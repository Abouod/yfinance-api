namespace backend_api.Models
{
    public class JwtSettings
    {
        public string Secret { get; set; }
        public int AccessTokenExpirationInMinutes { get; set; }
        public int RefreshTokenExpirationInMinutes { get; set; }
    }
}
