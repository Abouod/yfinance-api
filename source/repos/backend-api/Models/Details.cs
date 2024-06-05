using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend_api.Models
{
    public class Details
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [ForeignKey("User")]
        public int UserId { get; set; }//navigation property to the User model. This sets up a relationship between
                                       //the Details entity and the User entity,
                                       //allowing access to the User associated with a particular Details entity.
        public User? User { get; set; }

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
    }
}
