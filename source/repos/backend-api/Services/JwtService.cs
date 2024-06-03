using backend_api.Models;
using Microsoft.IdentityModel.Tokens;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
// generating JSON Web Tokens (JWTs) for users
//Update JwtService to Support Refresh Tokens:

namespace backend_api.Services
{
    public class JwtService
    {
        private readonly string _secret;
        private readonly string _issuer;
        private readonly string _audience;
        private readonly int _accessTokenExpirationMinutes;
        private readonly int _refreshTokenExpirationMinutes;

        public JwtService(JwtSettings jwtSettings)//class constructor to accept an instance of JwtSettings
        {
            _secret = jwtSettings.Secret;
            _issuer = jwtSettings.Issuer;
            _audience = jwtSettings.Audience;
            _accessTokenExpirationMinutes = jwtSettings.AccessTokenExpirationInMinutes;
            _refreshTokenExpirationMinutes = jwtSettings.RefreshTokenExpirationInMinutes;
        }

        public string GenerateToken(User user) //GenerateToken Method: This method takes a User object as input and generates a JWT for that user.
        {
            var tokenHandler = new JwtSecurityTokenHandler();//Creating Token Handler: It creates an instance of JwtSecurityTokenHandler, which is used to create and validate JWTs.
            var key = Encoding.ASCII.GetBytes(_secret);//The _secret key is encoded into a byte array using ASCII encoding. This encoded key will be used for signing the token.
            var tokenDescriptor = new SecurityTokenDescriptor//It creates a SecurityTokenDescriptor object which specifies the details of the token to be generated.
                                                             //This includes claims (such as user ID and email), expiration time (7 days from the current time),
                                                             //and the signing credentials (using the secret key and HMAC-SHA256 algorithm).
            {
                Subject = new ClaimsIdentity(new Claim[]
                {
                    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                    new Claim(ClaimTypes.Email, user.Email),
                    new Claim(ClaimTypes.Name, user.Name) // Include user name in the claims
                    // Add more claims if needed
                }),
                Expires = DateTime.UtcNow.AddMinutes(_accessTokenExpirationMinutes),
                Issuer = _issuer,
                Audience = _audience,
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        public string GenerateRefreshToken()
        {
            var randomNumber = new byte[32];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(randomNumber);
                return Convert.ToBase64String(randomNumber);
            }
        }

        // Add a method to get the access token expiration minutes
        public int GetAccessTokenExpirationMinutes()
        {
            return _accessTokenExpirationMinutes;
        }

        // Add a method to get the refresh token expiration minutes
        public int GetRefreshTokenExpirationMinutes()
        {
            return _refreshTokenExpirationMinutes;
        }

    }
}
