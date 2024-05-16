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

        [HttpGet]
        public async Task<ActionResult<IEnumerable<User>>> GetAllUsers()
        {
            return await _context.Users.ToListAsync();
        }
    }
}
