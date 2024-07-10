using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend_api.Data;
using backend_api.Models;
using backend_api.Services;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;
using backend_api.DTOs;
using System.Security.Claims;
using System.Security.Cryptography;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;

namespace backend_api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthenticationController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly JwtService _jwtService;
        private readonly EmailService _emailService;
        private readonly ILogger<AuthenticationController> _logger;

        public AuthenticationController(AppDbContext context, JwtService jwtService, EmailService emailService, ILogger<AuthenticationController> logger)
        {
            _context = context;
            _jwtService = jwtService;
            _emailService = emailService;
            _logger = logger;
        }

        [HttpPost("authenticate")] //Defines an http endpoint
        public async Task<IActionResult> Authenticate([FromBody] LoginModel loginModel) //Authenticates a user with the provided login credentials
        {
            try
            {
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

                    var verificationLink = Url.Action(nameof(VerifyEmail), "Authentication", new { token = user.EmailVerificationToken, name = user.Name, email = user.Email }, Request.Scheme);
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

            var verificationLink = Url.Action(nameof(VerifyEmail), "Authentication", new { token = user.EmailVerificationToken, name = user.Name, email = user.Email }, Request.Scheme);
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
}
