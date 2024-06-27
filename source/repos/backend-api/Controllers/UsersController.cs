using Microsoft.AspNetCore.Mvc; //for creating controllers
using Microsoft.EntityFrameworkCore; //for database interactions
using backend_api.Data;
using backend_api.Models;
using System.Linq;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;
using BCrypt.Net; //password hashing
using backend_api.Services;
using Microsoft.AspNetCore.Authorization;
using System.IdentityModel.Tokens.Jwt;
using System;
using System.Security.Claims;
using System.Xml.Linq;
using static System.Runtime.InteropServices.JavaScript.JSType;
using System.Diagnostics;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.VisualBasic;
using backend_api.DTOs;
using System.IO;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging; // logging
using System.Security.Cryptography;
using Microsoft.AspNetCore.Identity.Data;
using System.Net;




namespace backend_api.Controllers
{
    [ApiController] //ApiController attribute Specifies that this class is an api controller
    [Route("api/[controller]")] // Sets the base route for the controller to api/users.
    public class UsersController : ControllerBase //Begins the definition of the UsersController class, inheriting from ControllerBase.
    {
        // Controller methods will go here
        private readonly AppDbContext _context;
        private readonly JwtService _jwtService;
        private readonly EmailService _emailService;
        private readonly ILogger<UsersController> _logger;

        public UsersController(AppDbContext context, JwtService jwtService, EmailService emailService, ILogger<UsersController> logger)//Constructor: Injects the AppDbContext and JwtService via dependency injection. This allows the controller to interact with the database and manage JWT tokens.
        {
            //Defines private fields for database context (_context) and JWT service (_jwtService).
            _context = context;
            _jwtService = jwtService;
            _emailService = emailService;
            _logger = logger; // Inject logger
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);

            if (user == null)
            {
                return NotFound("User with this email does not exist.");
            }

            // Generate password reset token
            user.PasswordResetToken = GeneratePasswordResetToken();
            user.PasswordResetTokenExpiryTime = DateTime.UtcNow.AddHours(1); // Token valid for 1 hour
            await _context.SaveChangesAsync();

            /* var resetLink = Url.Action(nameof(ResetPassword), "Users", new { token = user.PasswordResetToken, email = user.Email }, Request.Scheme);*/
            /* var resetLink = $"http://localhost:5173/reset-password?token={user.PasswordResetToken}&email={user.Email}";*/
            var resetLink = $"http://localhost:5173/reset-password?token={WebUtility.UrlEncode(user.PasswordResetToken)}&email={WebUtility.UrlEncode(user.Email)}";
            var emailBody = $"Please reset your password by clicking on the link: <a href='{resetLink}'>Reset Password</a>";
            _emailService.SendEmail(user.Email, "Reset Password", emailBody);

            return Ok("Password reset link has been sent to your email.");
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest model)
        {
            try
            {
                if (model == null)
                {
                    _logger.LogWarning("ResetPassword request is null.");
                    return BadRequest("Invalid request.");
                }

                if (string.IsNullOrEmpty(model.Email) || string.IsNullOrEmpty(model.Token) || string.IsNullOrEmpty(model.NewPassword) || string.IsNullOrEmpty(model.ConfirmNewPassword))
                {
                    _logger.LogWarning("ResetPassword request missing fields: {Request}", model);
                    return BadRequest("All fields are required.");
                }

                _logger.LogInformation("ResetPassword requested for email: {Email}, token: {Token}", model.Email, model.Token);

                // Find user by email and token
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == model.Email && u.PasswordResetToken == model.Token);
                _logger.LogInformation("User: ", user);
                if (user == null)
                {
                    _logger.LogWarning("User not found for email: {Email} and token: {Token}", model.Email, model.Token);
                    return BadRequest("Invalid password reset token or email.");
                }

                if (!user.PasswordResetTokenExpiryTime.HasValue || user.PasswordResetTokenExpiryTime <= DateTime.UtcNow)
                {
                    _logger.LogWarning("Expired token for user: {UserId}", user.Id);
                    return BadRequest("Invalid or expired password reset token.");
                }

                if (model.NewPassword != model.ConfirmNewPassword)
                {
                    _logger.LogWarning("Password mismatch for user: {UserId}", user.Id);
                    return BadRequest("New password and confirm password do not match.");
                }

                // Hash the new password before saving
                user.Password = BCrypt.Net.BCrypt.HashPassword(model.NewPassword);
                user.PasswordResetToken = null;  // Clear the token
                user.PasswordResetTokenExpiryTime = null;  // Clear the token expiry time
                await _context.SaveChangesAsync();

                _logger.LogInformation("Password reset successfully for user: {UserId}", user.Id);
                return Ok("Password has been reset successfully.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error resetting password");
                return StatusCode(500, "An error occurred while resetting the password.");
            }
        }

        private string GeneratePasswordResetToken()
        {
            using (var rng = RandomNumberGenerator.Create())
            {
                var bytes = new byte[32];
                rng.GetBytes(bytes);
                var token = Convert.ToBase64String(bytes)
                    .Replace('+', '-')
                    .Replace('/', '_')
                    .Replace("=", ""); // Remove any trailing '=' padding
                return token;
            }
        }


        [HttpPost("authenticate")] //Defines an http endpoint
        public async Task<IActionResult> Authenticate([FromBody] LoginModel loginModel) //Authenticates a user with the provided login credentials
        {
            try {
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == loginModel.Email); //Retrieves User: Searches for a user in the database by email.

                if (user == null || !BCrypt.Net.BCrypt.Verify(loginModel.Password, user.Password)) //Verifies Password: Uses BCrypt to verify the password.
                {
                    _logger.LogWarning("Authentication failed: Invalid email or password.");
                    return Unauthorized("Wrong Email or Password.");
                }

                if (!user.IsEmailVerified)
                {
                    // Resend verification email
                    user.EmailVerificationToken = GenerateEmailVerificationToken();
                    await _context.SaveChangesAsync();

                    var verificationLink = Url.Action(nameof(VerifyEmail), "Users", new { token = user.EmailVerificationToken, name = user.Name, email = user.Email }, Request.Scheme);
                    var emailBody = $"Please verify your email by clicking on the link: <a href='{verificationLink}'>Verify Email</a>";
                    _emailService.SendEmail(user.Email, "Verify your email", emailBody);

                    _logger.LogWarning("Authentication failed. Email isn't verified. Verification email resent.");
                    return Unauthorized(new { Message = "Email not verified.", Name = user.Name, Email = user.Email });
                }

                //Generates Tokens: Creates access and refresh tokens using JwtService.
                var accessToken = _jwtService.GenerateToken(user);
                var refreshToken = _jwtService.GenerateRefreshToken();

                // Save refresh token and expiary time in DB 
                user.RefreshToken = refreshToken;
                user.RefreshTokenExpiryTime = DateTime.UtcNow.AddMinutes(_jwtService.GetRefreshTokenExpirationMinutes());
                await _context.SaveChangesAsync();

                // Set JWT and refresh token as HttpOnly cookies
                SetCookie("jwtToken", accessToken, _jwtService.GetAccessTokenExpirationMinutes());
                SetCookie("refreshToken", refreshToken, _jwtService.GetRefreshTokenExpirationMinutes());

                _logger.LogInformation($"User {user.Email} authenticated successfully.");
                return Ok();
            }
            catch (Exception ex)//Exception Handling: Catches and handles exceptions, returning a 500 status code if needed.
            {
                _logger.LogError($"Error during authentication: {ex.Message}");
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error.");
            }
        }

        [HttpPost("refresh-token")]
        public async Task<IActionResult> RefreshToken()// Handles token refresh logic.
        {
            if (!Request.Cookies.TryGetValue("refreshToken", out var refreshToken))//Retrieves Refresh Token: Checks for the refresh token in cookies.

            {
                _logger.LogWarning("Refresh token is missing in cookies.");
                return Unauthorized();
            }

            if (string.IsNullOrEmpty(refreshToken)) //Validate refreshToken existence
            {
                _logger.LogWarning("Refresh token is empty.");
                return Unauthorized();
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.RefreshToken == refreshToken);

            if (user == null || user.RefreshTokenExpiryTime <= DateTime.UtcNow)//Validate refreshToken in DB
            {
                _logger.LogWarning("Invalid or expired refresh token.");
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

            _logger.LogInformation("Refresh token for user {Email} refreshed successfully.", user.Email);
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
                _logger.LogWarning("User registration failed due to invalid model state: {Errors}", errors);
                return BadRequest(new { Errors = errors });
            }

            // Check if a user with the provided email already exists
            var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == user.Email);
            if (existingUser != null)
            {
                _logger.LogWarning("User registration failed: Email {Email} is already in use.", user.Email);
                // Return a conflict response indicating that the email is already in use
                return Conflict("Email already in use.");
            }

            // Hash the password before saving the user
            user.Password = BCrypt.Net.BCrypt.HashPassword(user.Password);

            user.EmailVerificationToken = GenerateEmailVerificationToken();
            user.IsEmailVerified = false;

            // If the email is not already in use, proceed with user registration (Save user)
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var verificationLink = Url.Action(nameof(VerifyEmail), "Users", new { token = user.EmailVerificationToken, name = user.Name, email = user.Email }, Request.Scheme);
            var emailBody = $"Please verify your email by clicking on the link: <a href='{verificationLink}'>Verify Email</a>";
            _emailService.SendEmail(user.Email, "Verify your email", emailBody);

            // Construct a custom response object containing user data and redirect URL
            var response = new
            {
                User = user,
                Message = "Registered successfully. Please sign in.",
                Name = user.Name,
                Email = user.Email 
            };

            // Return the custom response object
            _logger.LogInformation("User {Email} registered successfully.", user.Email);
            return CreatedAtAction(nameof(GetUser), new { id = user.Id }, response);
        }


        [HttpGet("verify-email")]
        public async Task<IActionResult> VerifyEmail(string token)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.EmailVerificationToken == token);
            if (user == null)
            {
                return Redirect("http://localhost:5173/verify-status?status=error&message=Invalid%20token");
            }

            user.IsEmailVerified = true;
            user.EmailVerificationToken = null;
            await _context.SaveChangesAsync();

            return Redirect("http://localhost:5173/verify-status?status=success&message=Email%20verified%20successfully");

        }

        private string GenerateEmailVerificationToken()
        {
            using (var rng = RandomNumberGenerator.Create())
            {
                var bytes = new byte[32];
                rng.GetBytes(bytes);
                return Convert.ToBase64String(bytes);
            }
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
                _logger.LogWarning("User with ID {Id} not found.", id);
                return NotFound();
            }

            return user;
        }

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
                    _logger.LogWarning("Unauthorized access attempt with missing claims.");
                    return Unauthorized("Unauthorized. Please Sign in again");
                }

                return Ok(new
                {
                    Id = userId,
                    Name = userName,
                    Email = userEmail,
                });
            }
            _logger.LogWarning("Unauthorized access attempt with undefined identity.");
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
                    _logger.LogWarning("Unauthorized access attempt with missing user ID.");
                    return Unauthorized("Unauthorized. Please Sign in again");
                }

                var user = await _context.Users
                    .Include(u => u.Details)
                    .FirstOrDefaultAsync(u => u.Id == int.Parse(userId));

                if (user == null)
                {
                    _logger.LogWarning("User details not found for user ID {UserId}.", userId);
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
                    SuperiorEmail = user.Details?.SuperiorEmail,
                    Signature = !string.IsNullOrEmpty(user.Details?.Signature)
                        ? $"{Request.Scheme}://{Request.Host}/uploads/{user.Details.Signature}"
                        : null
                };

                return Ok(userDetailsDto);
            }
            _logger.LogWarning("Unauthorized access attempt with undefined identity.");
            return Unauthorized("Unauthorized. Identity is Undefined.");
        }


        [HttpPut("update-details")]
        [Authorize]
        public async Task<IActionResult> UpdateDetails([FromBody] Details updatedDetails)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null)
            {
                _logger.LogWarning("User not found during details update.");
                return NotFound("User not found.");
            }

            var user = await _context.Users.Include(u => u.Details).FirstOrDefaultAsync(u => u.Id == int.Parse(userId));
            if (user == null)
            {
                _logger.LogWarning("User not found during details update for user ID {UserId}.", userId);
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

            _logger.LogInformation("User details for user ID {UserId} updated successfully.", userId);
            return Ok("Details updated successfully.");
        }

        [HttpPut("update-password")]
        [Authorize]
        public async Task<IActionResult> UpdatePassword([FromBody] PasswordUpdateModel passwordUpdateModel)
        {

            // Validate the model state
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors)
                                .Select(e => e.ErrorMessage)
                                .ToList();
                _logger.LogWarning("Password update failed due to invalid model state: {Errors}", errors);
                return BadRequest(new { Errors = errors });
            }

            var userId = GetCurrentUserId();
            if (userId == null)
            {
                _logger.LogWarning("User not found during password update.");
                return NotFound("User not found.");
            }

            var user = await _context.Users.FindAsync(int.Parse(userId));

            if (user == null || !BCrypt.Net.BCrypt.Verify(passwordUpdateModel.CurrentPassword, user.Password))
            {
                _logger.LogWarning("Password update failed: Invalid current password for user ID {UserId}.", userId);
                return Unauthorized("Invalid current password.");
            }

            // Hash the new password
            user.Password = BCrypt.Net.BCrypt.HashPassword(passwordUpdateModel.NewPassword);

            await _context.SaveChangesAsync();

            _logger.LogInformation("Password for user ID {UserId} updated successfully.", userId);
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

                        _logger.LogInformation("User ID {UserId} logged out successfully.", userId);
                        return Ok("Logged out successfully.");
                    }
                }
            }
            _logger.LogWarning("Unauthorized logout attempt.");
            return Unauthorized("User not found.");
        }

        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                _logger.LogWarning("User with ID {Id} not found for deletion.", id);
                return NotFound();
            }

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            _logger.LogInformation("User with ID {Id} deleted successfully.", id);
            return NoContent();
        }

        [HttpPost("upload")]
        [Authorize]
        public async Task<IActionResult> Upload(IFormFile file)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null)
            {
                _logger.LogWarning("Unauthorized upload attempt with missing user ID.");
                return Unauthorized("Unauthorized. Please sign in again.");
            }

            var user = await _context.Users.Include(u => u.Details).FirstOrDefaultAsync(u => u.Id == int.Parse(userId));
            if (user == null)
            {
                _logger.LogWarning("User not found for upload attempt by user ID {UserId}.", userId);
                return NotFound("User not found.");
            }

            if (file == null || file.Length == 0)
            {
                _logger.LogWarning("Upload attempt with no file by user ID {UserId}.", userId);
                return BadRequest("No file uploaded.");
            }

            var uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
            if (!Directory.Exists(uploadPath))
            {
                Directory.CreateDirectory(uploadPath);
            }

            var uniqueFileName = $"{user.Id}_{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
            var filePath = Path.Combine(uploadPath, uniqueFileName);

            try
            {
                // Ensure user details object exists
                if (user.Details == null)
                {
                    user.Details = new Details { UserId = user.Id };
                    _context.Details.Add(user.Details); // Add new details entry
                }

                // Delete the old signature file if it exists
                if (!string.IsNullOrEmpty(user.Details.Signature))
                {
                    var oldFilePath = Path.Combine(uploadPath, user.Details.Signature);
                    if (System.IO.File.Exists(oldFilePath))
                    {
                        System.IO.File.Delete(oldFilePath);
                    }
                }

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                user.Details.Signature = uniqueFileName;
                await _context.SaveChangesAsync();

                _logger.LogInformation("File uploaded successfully for user ID {UserId}. File path: {FilePath}", userId, filePath);
                return Ok(new { filePath });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while uploading file for user ID {UserId}.", userId);
                return StatusCode(StatusCodes.Status500InternalServerError, "An error occurred while uploading the file. Please try again later.");
            }
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

        private string? GetCurrentUserId()
        {
            var identity = HttpContext.User.Identity as ClaimsIdentity;
            return identity?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        }


    }

    // DTO classes for requests
    public class ForgotPasswordRequest
    {
        public string Email { get; set; }
    }

    public class ResetPasswordRequest
    {
        public string Email { get; set; }
        public string Token { get; set; }
        [Required(ErrorMessage = "New password is required.")]
        [PasswordComplexity]
        public string NewPassword { get; set; }
        [Required(ErrorMessage = "Confirm new password is required.")]
        [Compare("NewPassword", ErrorMessage = "Confirm new password doesn't match new password.")]
        public string ConfirmNewPassword { get; set; }
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

