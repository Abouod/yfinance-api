using System.ComponentModel.DataAnnotations.Schema;

namespace rpa_api.Data
{
    public class User
    {
        public int Id { get; set; }

        [Column("full_name")] // Map to the 'full_name' column in the database
        public string? Name { get; set; } // Nullable string

        [Column("email")] // Map to the 'email' column in the database
        public string Email { get; set; }

        [Column("password")] // Map to the 'password' column in the database
        public string Password { get; set; }
    }
}
