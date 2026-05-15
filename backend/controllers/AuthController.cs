/*
Este código cria endpoint:
    POST /auth/register

Recebe:
    Nome
    Email
    Senha
    Tipo de Usuário

Depois:
    Criptografa a senha e manda para o banco de dados.

*/

using backend.dtos;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

using Microsoft.AspNetCore.Mvc;
using backend.data;
using backend.entities;
using BCrypt.Net;

namespace backend.controllers;

[ApiController]
[Route("auth")]
public class AuthController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;
    
    public AuthController(ApplicationDbContext context, IConfiguration configuration)
    {
        _context = context;

        _configuration = configuration;
    }

[HttpPost("register")]
public IActionResult Register(User user)
{
    if (
        user.TipoUsuario != "Supervisor" &&
        user.TipoUsuario != "Bolsista"
    )
    {
        return BadRequest("Tipo de usuário inválido");
    }

    var senhaHash = BCrypt.Net.BCrypt.HashPassword(user.SenhaHash);

    user.SenhaHash = senhaHash;

    _context.Users.Add(user);

    _context.SaveChanges();

    return Ok(new
    {
        mensagem = "Usuário cadastrado com sucesso"
    });
}

    [HttpPost("login")]
    public IActionResult Login(LoginDto dto)
    {
        var user = _context.Users.FirstOrDefault(u => u.Email == dto.Email);

        if (user == null)
        {
            return Unauthorized("Usuário inválido");
        }

        var senhaCorreta = BCrypt.Net.BCrypt.Verify(dto.Senha, user.SenhaHash);

        if (!senhaCorreta)
        {
            return Unauthorized("Senha inválida");
        }

        var claims = new[]
        {
            new Claim(ClaimTypes.Name, user.Nome),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.TipoUsuario)
        };

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!)
        );

        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            claims: claims,
            expires: DateTime.Now.AddHours(8),
            signingCredentials: creds
        );

        var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

       return Ok(new
{
    token = tokenString,

    tipoUsuario = user.TipoUsuario,

    nome = user.Nome
});
    }
    
    
}

