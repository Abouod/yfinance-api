using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend_api.Models
{
    public class User
    {
        [Key]
        public int Id { get; set; }

        [Required(ErrorMessage = "Name is required.")]
        [Column("full_name")] // Map to the 'full_name' column in the database
        [StringLength(255, MinimumLength = 2, ErrorMessage = "Name must be at least 2 characters long.")]
        public string? Name { get; set; } // Nullable string

        [Required(ErrorMessage = "Email is required.")]
        [Column("email")] // Map to the 'email' column in the database
        [StringLength(100)]
        [EmailAddress(ErrorMessage = "Invalid email format.")]
        public string Email { get; set; }

        [Column("password")]
        [StringLength(100)]
        [PasswordComplexity]
        public string Password { get; set; }
    }
}
