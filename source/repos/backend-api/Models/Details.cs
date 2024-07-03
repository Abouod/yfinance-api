using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend_api.Models
{
    public class Details
    {
        [Key]
        public int Id { get; set; }

        [Required] //A value must be provided for this property when creating or updating a Details instance. 
        [ForeignKey("User")] // Indicating that the UserId property is a foreign key that references the primary key of the User entity. 
                             //It establishes a relationship between the Details entity and the User entity.
        public int UserId { get; set; } //This is the foreign key property. It holds the ID of the associated User.

        public User? User { get; set; } // This is a navigation property. It allows you to navigate from a Details entity to the related User entity.
                                        // The ? indicates that this property is nullable, meaning that it is optional in code, but since UserId is required,
                                        // this should never be null when the entity is in a valid state.

        [Column("address_line")]
        [StringLength(255)]
        public string? AddressLine { get; set; }

        [Column("phone_number")]
        [StringLength(50)]
        public string? PhoneNumber { get; set; }

        [Column("passport")]
        [StringLength(50)]
        public string? Passport { get; set; }

        [Column("bank_name")]
        [StringLength(100)]
        public string? BankName { get; set; }

        [Column("bank_account")]
        [StringLength(100)]
        public string? BankAccount { get; set; }

        [Column("employee_id")]
        [StringLength(50)]
        public string? EmployeeId { get; set; }

        [Column("job_title")]
        [StringLength(100)]
        public string? JobTitle { get; set; }

        [Column("department")]
        [StringLength(100)]
        public string? Department { get; set; }

        [Column("division")]
        [StringLength(100)]
        public string? Division { get; set; }

        [Column("manager_name")]
        [StringLength(100)]
        public string? ManagerName { get; set; }

        [Column("manager_id")]
        [StringLength(50)]
        public string? ManagerId { get; set; }

        [Column("manager_email")]
        [StringLength(100)]
        [EmailAddress]
        public string? ManagerEmail { get; set; }

        [Column("superior_name")]
        [StringLength(100)]
        public string? SuperiorName { get; set; }

        [Column("superior_id")]
        [StringLength(50)]
        public string? SuperiorId { get; set; }

        [Column("superior_email")]
        [StringLength(100)]
        [EmailAddress]
        public string? SuperiorEmail { get; set; }

        [Column("signature")]
        [StringLength(255)]
        public string? Signature { get; set; }  
    }
}
