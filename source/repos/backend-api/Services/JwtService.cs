using backend_api.Models;
using Microsoft.IdentityModel.Tokens;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
// generating JSON Web Tokens (JWTs) for users

namespace backend_api.Services
{
    public class JwtService
    {
        private readonly string _secret;

        public JwtService(JwtSettings jwtSettings)//class constructor to accept an instance of JwtSettings
        {
            _secret = jwtSettings.Secret;
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
                    new Claim(ClaimTypes.Email, user.Email)
                    // Add more claims if needed
                }),
                Expires = DateTime.UtcNow.AddDays(7),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }
    }
}
