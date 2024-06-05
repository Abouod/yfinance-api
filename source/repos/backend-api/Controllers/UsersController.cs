using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend_api.Data;
using backend_api.Models;
using System.Linq;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;
using BCrypt.Net;
using backend_api.Services;
using Microsoft.AspNetCore.Authorization;
using System.IdentityModel.Tokens.Jwt;
using System;
using System.Security.Claims;
using System.Xml.Linq;
using Microsoft.AspNetCore.Http;
using static System.Runtime.InteropServices.JavaScript.JSType;
using System.Diagnostics;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.VisualBasic;
using backend_api.DTOs;


namespace backend_api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        // Controller methods will go here
        private readonly AppDbContext _context;
        private readonly JwtService _jwtService; 

        public UsersController(AppDbContext context, JwtService jwtService)//Constructor Injecting an Instance of AppDbContext to Interact with DB
        {
            _context = context;
            _jwtService = jwtService; // Add this line
        }

        [HttpPost("authenticate")]
        public async Task<IActionResult> Authenticate([FromBody] LoginModel loginModel)
        {
            try {
                /*ModelState.Clear();*/
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == loginModel.Email);

                if (user == null || !BCrypt.Net.BCrypt.Verify(loginModel.Password, user.Password))
                {
                    Console.WriteLine("Authentication failed: Invalid email or password.");
                    return Unauthorized("Wrong Email or Password.");
                }

                var accessToken = _jwtService.GenerateToken(user);
                var refreshToken = _jwtService.GenerateRefreshToken();

                // Save refresh token in DB 
                user.RefreshToken = refreshToken;
                user.RefreshTokenExpiryTime = DateTime.UtcNow.AddMinutes(_jwtService.GetRefreshTokenExpirationMinutes());
                await _context.SaveChangesAsync();

                // Set JWT and refresh token as HttpOnly cookies
                SetCookie("jwtToken", accessToken, _jwtService.GetAccessTokenExpirationMinutes());
                SetCookie("refreshToken", refreshToken, _jwtService.GetRefreshTokenExpirationMinutes());

               /* Console.WriteLine($"User {user.Email} authenticated successfully.");*/
                return Ok();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error during authentication: {ex.Message}");
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error.");
            }
        }

        [HttpPost("refresh-token")]
        public async Task<IActionResult> RefreshToken()
        {
            if (!Request.Cookies.TryGetValue("refreshToken", out var refreshToken))//Retrive the refresh token from the cookies.
            {
                return Unauthorized();
            }

            if (string.IsNullOrEmpty(refreshToken)) //Validate refreshToken existence
            {
                return Unauthorized();
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.RefreshToken == refreshToken);

            if (user == null || user.RefreshTokenExpiryTime <= DateTime.UtcNow)//Validate refreshToken in DB
            {
                return Unauthorized();
            }

            //If valid a newAccessToken and a new refreshToken are generated.
            var newAccessToken = _jwtService.GenerateToken(user);
            var newRefreshToken = _jwtService.GenerateRefreshToken();

          /*  Storing the Refresh Token and Expiry in the Database:
            It allows the server to verify the validity and expiration
            of the refresh token during the token refresh process.*/

            // Update newRefreshToken and its expiryTime in DB
            user.RefreshToken = newRefreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddMinutes(_jwtService.GetRefreshTokenExpirationMinutes());
            await _context.SaveChangesAsync();

            // Set new refresh token as HttpOnly cookie
            SetCookie("jwtToken", newAccessToken, _jwtService.GetAccessTokenExpirationMinutes());
            SetCookie("refreshToken", newRefreshToken, _jwtService.GetRefreshTokenExpirationMinutes());

            return Ok();
        }

        [HttpPost("register")]
        public async Task<ActionResult<User>> Register([FromBody] User user)
        {
            // Validate the model state
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors)
                                .Select(e => e.ErrorMessage)
                                .ToList();
                return BadRequest(new { Errors = errors });
            }

            // Check if a user with the provided email already exists
            var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == user.Email);
            if (existingUser != null)
            {
                // Return a conflict response indicating that the email is already in use
                return Conflict("Email already in use.");
            }

            // Hash the password before saving the user
            user.Password = BCrypt.Net.BCrypt.HashPassword(user.Password);

            // If the email is not already in use, proceed with user registration (Save user)
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Construct a custom response object containing user data and redirect URL
            var response = new
            {
                User = user,
                Message = "Registered successfully. Please sign in."
            };

            // Return the custom response object
            return CreatedAtAction(nameof(GetUser), new { id = user.Id }, response);
        }

        /*  By including related Details in your queries, you ensure that the detailed information
          about the user is available in a single call to the database.*/
        [HttpGet("{id}")]
        public async Task<ActionResult<User>> GetUser(int id)
        {
            var user = await _context.Users
                .Include(u => u.Details)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null)
            {
                return NotFound();
            }

            return user;
        }

        /*        [HttpGet("profile")]
                [Authorize]
                public async Task<IActionResult> GetProfile()
                {
                    var identity = HttpContext.User.Identity as ClaimsIdentity;
                    if (identity == null)
                    {
                        return Unauthorized("Unauthorized. Identity is Undefined.");
                    }

                    var userId = identity.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                    if (userId == null)
                    {
                        return Unauthorized("Unauthorized. Identity is Undefined.");
                    }

                    var user = await _context.Users
                        .Include(u => u.Details)
                        .FirstOrDefaultAsync(u => u.Id == int.Parse(userId));

                    if (user == null)
                    {
                        return NotFound("User not found.");
                    }

                    return Ok(new
                    {
                        Id = user.Id,
                        Name = user.Name,
                        Email = user.Email,
                        Details = user.Details
                    });
                }*/

        [HttpGet("profile")]
        [Authorize] // Ensure the user is authenticated
        public IActionResult GetProfile()
        {
            var identity = HttpContext.User.Identity as ClaimsIdentity;
            if (identity != null)
            {
                var userClaims = identity.Claims;
                var userId = userClaims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
                var userName = userClaims.FirstOrDefault(c => c.Type == ClaimTypes.Name)?.Value;
                var userEmail = userClaims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;

                if (userId == null || userName == null || userEmail == null)
                {
                    return Unauthorized("Unauthorized. Please Sign in again");
                }

                return Ok(new
                {
                    Id = userId,
                    Name = userName,
                    Email = userEmail,
                });
            }
            return Unauthorized("Unauthorized. Identity is Undefined.");
        }

        [HttpGet("details")]
        [Authorize] // Ensure the user is authenticated
        public async Task<IActionResult> GetUserDetails()
        {
            var identity = HttpContext.User.Identity as ClaimsIdentity;
            if (identity != null)
            {
                var userId = identity.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (userId == null)
                {
                    return Unauthorized("Unauthorized. Please Sign in again");
                }

                var user = await _context.Users
                    .Include(u => u.Details)
                    .FirstOrDefaultAsync(u => u.Id == int.Parse(userId));

                if (user == null)
                {
                    return NotFound("User not found.");
                }

                // Create a DTO for user details
                var userDetailsDto = new UserDetailsDto
                {
                    AddressLine = user.Details?.AddressLine,
                    PhoneNumber = user.Details?.PhoneNumber,
                    Passport = user.Details?.Passport,
                    BankName = user.Details?.BankName,
                    BankAccount = user.Details?.BankAccount,
                    EmployeeId = user.Details?.EmployeeId,
                    JobTitle = user.Details?.JobTitle,
                    Department = user.Details?.Department,
                    Division = user.Details?.Division,
                    ManagerName = user.Details?.ManagerName,
                    ManagerId = user.Details?.ManagerId,
                    ManagerEmail = user.Details?.ManagerEmail,
                    SuperiorName = user.Details?.SuperiorName,
                    SuperiorId = user.Details?.SuperiorId,
                    SuperiorEmail = user.Details?.SuperiorEmail
                };

                return Ok(userDetailsDto);
            }
            return Unauthorized("Unauthorized. Identity is Undefined.");
        }



        [HttpPut("update-details")]
        [Authorize]
        public async Task<IActionResult> UpdateDetails([FromBody] Details updatedDetails)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null)
            {
                return NotFound("User not found.");
            }

            var user = await _context.Users.Include(u => u.Details).FirstOrDefaultAsync(u => u.Id == int.Parse(userId));
            if (user == null)
            {
                return NotFound("User not found.");
            }

            if (user.Details == null)
            {
                // Create a new Details object if it doesn't exist
                user.Details = new Details();
            }

            user.Details.AddressLine = updatedDetails.AddressLine;
            user.Details.PhoneNumber = updatedDetails.PhoneNumber;
            user.Details.Passport = updatedDetails.Passport;
            user.Details.BankName = updatedDetails.BankName;
            user.Details.BankAccount = updatedDetails.BankAccount;
            user.Details.EmployeeId = updatedDetails.EmployeeId;
            user.Details.JobTitle = updatedDetails.JobTitle;
            user.Details.Department = updatedDetails.Department;
            user.Details.Division = updatedDetails.Division;
            user.Details.ManagerName = updatedDetails.ManagerName;
            user.Details.ManagerId = updatedDetails.ManagerId;
            user.Details.ManagerEmail = updatedDetails.ManagerEmail;
            user.Details.SuperiorName = updatedDetails.SuperiorName;
            user.Details.SuperiorId = updatedDetails.SuperiorId;
            user.Details.SuperiorEmail = updatedDetails.SuperiorEmail;

            await _context.SaveChangesAsync();

            return Ok("Details updated successfully.");
        }

        [HttpPut("update-password")]
        public async Task<IActionResult> UpdatePassword([FromBody] PasswordUpdateModel passwordUpdateModel)
        {

            // Validate the model state
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors)
                                .Select(e => e.ErrorMessage)
                                .ToList();
                return BadRequest(new { Errors = errors });
            }

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null)
            {
                return NotFound("User not found.");
            }

            var user = await _context.Users.FindAsync(int.Parse(userId));

            if (user == null || !BCrypt.Net.BCrypt.Verify(passwordUpdateModel.CurrentPassword, user.Password))
            {
                return Unauthorized("Invalid current password.");
            }

            // Hash the new password
            user.Password = BCrypt.Net.BCrypt.HashPassword(passwordUpdateModel.NewPassword);

            await _context.SaveChangesAsync();

            return Ok("Password updated successfully.");
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            var identity = HttpContext.User.Identity as ClaimsIdentity;
            if (identity != null)
            {
                var userId = identity.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (userId != null)
                {
                    var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == int.Parse(userId));
                    if (user != null)
                    {
                        user.RefreshToken = null;
                        user.RefreshTokenExpiryTime = null;
                        await _context.SaveChangesAsync();

                        // Clear cookies
                        Response.Cookies.Delete("jwtToken");
                        Response.Cookies.Delete("refreshToken");

                        return Ok("Logged out successfully.");
                    }
                }
            }
            return Unauthorized("User not found.");
        }


        private void SetCookie(string key, string value, int expirationMinutes)
        {
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = false, // Set to true in production
                SameSite = SameSiteMode.Strict,
                Expires = DateTime.UtcNow.AddMinutes(expirationMinutes)
            };
            Response.Cookies.Append(key, value, cookieOptions);
        }


    }

        // A separate model to accept login credentials
        public class LoginModel
         {
                [Required(ErrorMessage = "Email is required.")]
                [EmailAddress(ErrorMessage = "Invalid email format.")]
                public string Email { get; set; }

                [Required(ErrorMessage = "Password is required.")]
                public string Password { get; set; }
         }

        public class PasswordUpdateModel
        {
            [Required(ErrorMessage = "Current password is required.")]
            public string CurrentPassword { get; set; }

            [Required(ErrorMessage = "New password is required.")]
            [PasswordComplexity]
            public string NewPassword { get; set; }

            [Required(ErrorMessage = "Confirm new password is required.")]
            [Compare("NewPassword", ErrorMessage = "Confirm new password doesn't match new password.")]
            public string ConfirmNewPassword { get; set; }
        }

}

