using backend_api.Models;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace backend_api.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Details> Details { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            /*HasOne(u => u.Details).WithOne(d => d.User).HasForeignKey<Details>(d => d.UserId);
            * configures the one-to-one relationship between User and Details, 
            * with Details.UserId as the foreign key.*/
            modelBuilder.Entity<User>()
                .HasOne(u => u.Details)
                .WithOne(d => d.User)
                .HasForeignKey<Details>(d => d.UserId);

            base.OnModelCreating(modelBuilder);
        }
    }
}
