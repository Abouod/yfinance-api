using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend_api.Data;
using backend_api.Models;
using System.Linq;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;
using BCrypt.Net;

namespace backend_api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        // Controller methods will go here
        private readonly AppDbContext _context;

        public UsersController(AppDbContext context)
        {
            _context = context;
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
                RedirectUrl = "/home" // Specify the redirect URL here
            };

            // Return the custom response object
            return CreatedAtAction(nameof(GetUser), new { id = user.Id }, response);
        }


        [HttpPost("login")]
        public async Task<ActionResult<User>> Login([FromBody] User login)
        {
            ModelState.Clear();
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == login.Email);

            if (user == null || !BCrypt.Net.BCrypt.Verify(login.Password, user.Password))
            {
                return NotFound("Wrong Email or Password."); // Return a custom error message
            }

            // If authentication successful, return a redirect URL
            return Ok(new { RedirectUrl = "/home" });
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

    }
    // Define a separate model to accept login credentials
    /*    public class LoginModel
        {
            [Required(ErrorMessage = "Email is required.")]
            [EmailAddress(ErrorMessage = "Invalid email format.")]
            public string Email { get; set; }

            [Required(ErrorMessage = "Password is required.")]
            public string Password { get; set; }
        }*/
}

