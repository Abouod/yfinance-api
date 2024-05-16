using Microsoft.EntityFrameworkCore;

namespace rpa_api.Data
{
    public class RpaDbContext : DbContext // Change inheritance from AppDbContext to DbContext
    {
        public RpaDbContext(DbContextOptions<RpaDbContext> options) 
            : base(options)
        {
        }

    }
}
