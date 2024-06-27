using backend_api.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Npgsql.EntityFrameworkCore.PostgreSQL;
using Microsoft.Extensions.Configuration;
using backend_api.Services;
using backend_api.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer; 
using Microsoft.IdentityModel.Tokens;
using System.Text; // Import for Encoding
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging; // Import logging
using DotNetEnv;




var builder = WebApplication.CreateBuilder(args);
var configuration = builder.Configuration;

// Load the .env file
DotNetEnv.Env.Load();

// Retrieve environment variables
var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET");
var dbConnection = Environment.GetEnvironmentVariable("DB_CONNECTION");
var emailFrom = Environment.GetEnvironmentVariable("EMAIL_FROM");
var smtpServer = Environment.GetEnvironmentVariable("SMTP_SERVER");
var smtpPort = Environment.GetEnvironmentVariable("SMTP_PORT");
var smtpUser = Environment.GetEnvironmentVariable("SMTP_USER");
var smtpPass = Environment.GetEnvironmentVariable("SMTP_PASS");

// Configure logging
builder.Logging.ClearProviders();
builder.Logging.AddConsole();

// Add environment variables to configuration
builder.Configuration.AddInMemoryCollection(new[]
{
    new KeyValuePair<string, string>("JwtSettings:Secret", jwtSecret),
    new KeyValuePair<string, string>("ConnectionStrings:DefaultConnection", dbConnection),
    new KeyValuePair<string, string>("EmailSettings:FromEmail", emailFrom),
    new KeyValuePair<string, string>("EmailSettings:SmtpServer", smtpServer),
    new KeyValuePair<string, string>("EmailSettings:SmtpPort", smtpPort),
    new KeyValuePair<string, string>("EmailSettings:SmtpUser", smtpUser),
    new KeyValuePair<string, string>("EmailSettings:SmtpPass", smtpPass)
});


// Add services to the container.
builder.Services.AddControllers();

// Add DbContext configuration
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowSpecificOrigin",
        builder =>
        {
            builder.WithOrigins("http://localhost:5173", "https://localhost:5173")
                   .AllowAnyMethod()
                   .AllowAnyHeader()
                   .AllowCredentials();
        });
});

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Register JwtService with JwtSettings dependency
builder.Services.AddScoped<JwtService>();

// Register EmailService 
builder.Services.AddScoped<EmailService>();


// Configure JWT settings
var jwtSettings = new JwtSettings();
configuration.GetSection("JwtSettings").Bind(jwtSettings);
builder.Services.AddSingleton(jwtSettings);

// Configure JWT authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings.Issuer,
            ValidAudience = jwtSettings.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(jwtSettings.Secret)),
            ClockSkew = TimeSpan.Zero
        };

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                if (context.Request.Cookies.ContainsKey("jwtToken"))
                {
                    context.Token = context.Request.Cookies["jwtToken"];
                }
                return Task.CompletedTask;
            }
        };
    });

var app = builder.Build();

// Use CORS policy
app.UseCors("AllowSpecificOrigin");

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
// Configure the HTTP request pipeline.
app.UseHttpsRedirection();
// Serve static files from the 'uploads' directory
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(
        Path.Combine(Directory.GetCurrentDirectory(), "uploads")),
    RequestPath = "/uploads"
});


// Use JWT authentication middleware
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.Run();
