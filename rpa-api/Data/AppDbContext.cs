using Microsoft.EntityFrameworkCore;

namespace rpa_api.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {

        }

        // Define your entities (models) here
        public DbSet<User> Users { get; set; }
    }
}

