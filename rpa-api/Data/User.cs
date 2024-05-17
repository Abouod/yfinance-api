using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;


namespace rpa_api.Data
{
    public class User
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "Name is required.")]
        [Column("full_name")] // Map to the 'full_name' column in the database
        [StringLength(255, MinimumLength = 2, ErrorMessage = "Name must be between 2 and 255 characters long.")]
        public string? Name { get; set; } // Nullable string

        [Required(ErrorMessage = "Email is required.")]
        [Column("email")] // Map to the 'email' column in the database
        [EmailAddress(ErrorMessage = "Invalid email format.")]
        public string Email { get; set; }

        [Required(ErrorMessage = "Password is required.")]
        [Column("password")] // Map to the 'password' column in the database
        [StringLength(100, MinimumLength = 8, ErrorMessage = "Password must be at least 8 characters long.")]
        public string Password { get; set; }
    }
}
