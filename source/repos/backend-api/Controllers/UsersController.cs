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
using System.Security.Claims;

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
           /* ModelState.Clear();*/
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == loginModel.Email);

            if (user == null || !BCrypt.Net.BCrypt.Verify(loginModel.Password, user.Password))
            {
                return NotFound("Wrong Email or Password.");
            }

            var token = _jwtService.GenerateToken(user);
            return Ok(new { Token = token, RedirectUrl = "/home" });
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


        [HttpGet("{id}")]
        public async Task<ActionResult<User>> GetUser(int id)
        {
            var user = await _context.Users.FindAsync(id);

            if (user == null)
            {
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

                return Ok(new
                {
                    Id = userClaims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value,
                    Name = userClaims.FirstOrDefault(c => c.Type == ClaimTypes.Name)?.Value,
                    Email = userClaims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value,
                });
            }
            return Unauthorized();
        }

    }
    // Define a separate model to accept login credentials
    // Represents the model for accepting login credentials,
    // containing properties for Email and Password.
    public class LoginModel
    {
        [Required(ErrorMessage = "Email is required.")]
        [EmailAddress(ErrorMessage = "Invalid email format.")]
        public string Email { get; set; }

        [Required(ErrorMessage = "Password is required.")]
        public string Password { get; set; }
    }
}

