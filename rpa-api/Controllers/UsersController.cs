using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using rpa_api.Data;
using System.Linq;
namespace rpa_api.Controllers
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

/*        [HttpPost("register")]
        public async Task<ActionResult<User>> Register(User user)
        {
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetUser), new { id = user.Id }, user);
        }*/

        [HttpPost("register")]
        public async Task<ActionResult<User>> Register(User user)
        {
            // Check if a user with the provided email already exists
            var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == user.Email);
            if(existingUser != null)
            {
                // Return a conflict response indicating that the email is already in use
                return Conflict("Email already in use.");
            }

            // If the email is not already in use, proceed with user registration
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
        public async Task<ActionResult<User>> Login(User login)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == login.Email && u.Password == login.Password);

            if (user == null)
            {
                return NotFound("Wrong Email or Password."); // Return a custom error message
            }

            /*return Ok(user);*/
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
}
