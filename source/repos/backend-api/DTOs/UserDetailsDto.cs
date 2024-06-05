namespace backend_api.DTOs
{
    public class UserDetailsDto
    {
        public string AddressLine { get; set; }
        public string PhoneNumber { get; set; }
        public string Passport { get; set; }
        public string BankName { get; set; }
        public string BankAccount { get; set; }
        public string EmployeeId { get; set; }
        public string JobTitle { get; set; }
        public string Department { get; set; }
        public string Division { get; set; }
        public string ManagerName { get; set; }
        public string ManagerId { get; set; }
        public string ManagerEmail { get; set; }
        public string SuperiorName { get; set; }
        public string SuperiorId { get; set; }
        public string SuperiorEmail { get; set; }
    }

}
