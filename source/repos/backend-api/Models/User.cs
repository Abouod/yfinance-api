using Microsoft.EntityFrameworkCore;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend_api.Models
{
    public class User
    {
        [Key]
        public int Id { get; set; }

        public Details? Details { get; set; } // This is a navigation property. It allows you to navigate from a User entity to
                                              // the related Details entity The ? indicates that this property is nullable,
                                              // meaning that a User may or may not have associated Details.

                                            //Entity Framework (EF) relies on navigation properties to automatically include related entities
                                            //when querying the database. If these properties are removed:
                                            /*Tables will need to be explicitly joined in every query to retrive related data.
                                            The.Include() method will no longer be useful, which means queries like the following will need to be rewritten:
                                            var user = await _context.Users.Include(u => u.Details).FirstOrDefaultAsync(u => u.Id == id*/


        [Required(ErrorMessage = "Name is required.")]
        [Column("full_name")] // Map to the 'full_name' column in the database
        [StringLength(255, MinimumLength = 2, ErrorMessage = "Name must be at least 2 characters long.")]
        public string? Name { get; set; } // Nullable string

        [Required(ErrorMessage = "Email is required.")]
        [Column("email")] // Map to the 'email' column in the database
        [StringLength(100)]
        [EmailAddress(ErrorMessage = "Invalid email format.")]
        public string Email { get; set; }

        [Required(ErrorMessage = "Password is required.")]
        [Column("password")]
        [StringLength(100)]
        [PasswordComplexity]
        public string Password { get; set; }

        [Column("refresh_token")] // Add column mapping
        public string? RefreshToken { get; set; }

        [Column("refresh_token_expiry_time")] // Add column mapping for expiry time
        public DateTime? RefreshTokenExpiryTime { get; set; }

        [Column("email_verification_token")]
        public string? EmailVerificationToken { get; set; }

        [Column("is_email_verified")]
        public bool IsEmailVerified { get; set; }

        [Column("password_reset_token")]
        public string? PasswordResetToken { get; set; }

        [Column("password_reset_token_expiry_time")]
        public DateTime? PasswordResetTokenExpiryTime { get; set; }
    }
}
