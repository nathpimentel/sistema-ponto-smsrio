using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.EntityFrameworkCore;
using backend.data;
using Microsoft.OpenApi.Models;
using backend.services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(options =>

{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Sistema Ponto API",
        Version = "v1"
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Digite o token JWT"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddAuthorization();

var defaultConnection = GetRequiredConfiguration(
    builder.Configuration,
    "ConnectionStrings:DefaultConnection",
    "ConnectionStrings__DefaultConnection"
);

builder.Services.AddDbContext<ApplicationDbContext>(options =>

    options.UseNpgsql(
        defaultConnection
    )
);

builder.Services.AddScoped<PdfService>();

var jwtKey = GetRequiredConfiguration(
    builder.Configuration,
    "Jwt:Key",
    "Jwt__Key"
);

if (jwtKey.Length < 32)
{
    throw new InvalidOperationException(
        "Configure Jwt__Key com pelo menos 32 caracteres por variável de ambiente ou User Secrets."
    );
}

var jwtIssuer = GetRequiredConfiguration(
    builder.Configuration,
    "Jwt:Issuer",
    "Jwt__Issuer"
);

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,

            ValidIssuer = jwtIssuer,

            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtKey)
            )
        };
    });

    builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy =>
        {
            policy.AllowAnyOrigin()
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    db.Database.Migrate();
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();

    app.UseSwaggerUI();
}

// app.UseHttpsRedirection();

app.UseCors("AllowFrontend");

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

app.Run();

static string GetRequiredConfiguration(IConfiguration configuration, string key, string environmentVariableName)
{
    var value = configuration[key];

    if (!string.IsNullOrWhiteSpace(value))
    {
        return value;
    }

    throw new InvalidOperationException(
        $"Configure {environmentVariableName} por variável de ambiente ou User Secrets."
    );
}
