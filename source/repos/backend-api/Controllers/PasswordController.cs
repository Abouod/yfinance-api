using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend_api.Data;
using backend_api.Models;
using backend_api.Services;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;
using backend_api.DTOs;
using Microsoft.AspNetCore.Authorization;
using System.Net;
using System.Security.Cryptography;
using System.Security.Claims;
using System.ComponentModel.DataAnnotations;

namespace backend_api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PasswordController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly EmailService _emailService;
        private readonly ILogger<PasswordController> _logger;

        public PasswordController(AppDbContext context, EmailService emailService, ILogger<PasswordController> logger)
        {
            _context = context;
            _emailService = emailService;
            _logger = logger;
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

            var resetLink = $"http://localhost:5173/reset-password?token={WebUtility.UrlEncode(user.PasswordResetToken)}&email={WebUtility.UrlEncode(user.Email)}";
            var emailBody = $@"
        <html>
        <head>
            <style>
                body {{
                    font-family: Inter, Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                    background-color: #f6f6f6;
                }}
                .container {{
                    width: 90%;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #ffffff;
                    border-radius: 10px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }}
                .header {{
                    text-align: left;
                    padding-left: 20px;
                }}
                .content {{
                    padding: 5px 20px;
                    font-size: 16px;
                    line-height: 1.5;
                }}
                .button {{
                    display: block;
                    width: 200px;
                    margin: 20px auto;
                    padding: 10px;
                    text-align: center;
                    background-color: #0073e6;
                    color: #ffffff;
                    text-decoration: none;
                    border-radius: 5px;
                }}
                .footer {{
                    text-align: center;
                    padding: 10px 0;
                    color: #888888;
                }}
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>Reset Your Password</h1>
                </div>
                <div class='content'>
                    <p>Hello,</p>
                    <p>We received a request to reset your password. Click the button below to reset it. <small> (Link will expire in 1 hour.)</small></p>
                    <a style='color: white;' class='button' href='{resetLink}'>Reset Password</a>
                    <p>If you didn't request a password reset, please ignore this email.</p>
                </div>
                <div class='footer'>
                    <p>&copy; 2024 Sophic Automation Sdn Bhd. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>";

            _emailService.SendEmail(user.Email, "Reset Password", emailBody);

            return Ok("Password reset link has been sent to your email.");
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest model)
        {
            try
            {
                _logger.LogInformation("ResetPassword requested for email: {Email}, token: {Token}", model.Email, model.Token);

                // Find user by email and token
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == model.Email && u.PasswordResetToken == model.Token);
                _logger.LogInformation("User: ", user);
                if (user == null)
                {
                    _logger.LogWarning("User not found for email: {Email} and token: {Token}", model.Email, model.Token);
                    return BadRequest("Invalid password reset Link. Please restart the process.");
                }

                if (!user.PasswordResetTokenExpiryTime.HasValue || user.PasswordResetTokenExpiryTime <= DateTime.UtcNow)
                {
                    _logger.LogWarning("Expired token for user: {UserId}", user.Id);
                    return BadRequest("Expired password reset token. Please restart the process.");
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


        private string? GetCurrentUserId()
        {
            var identity = HttpContext.User.Identity as ClaimsIdentity;
            return identity?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        }
    }
    // DTO classes for requests
    public class ForgotPasswordRequest
    {
        [Required(ErrorMessage = "Email is required.")]
        [EmailAddress(ErrorMessage = "Invalid email format.")]
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
