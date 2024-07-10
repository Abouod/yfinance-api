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

        private string? GetCurrentUserId()
        {
            var identity = HttpContext.User.Identity as ClaimsIdentity;
            return identity?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
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
    }
}