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

using Microsoft.AspNetCore.Authorization;
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

private static bool SenhaValida(string senha)
{
    return senha.Length >= 8 &&
        senha.Any(char.IsDigit) &&
        senha.Any(c => !char.IsLetterOrDigit(c));
}

private User? ObterUsuarioLogado()
{
    var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

    if (int.TryParse(idClaim, out var userId))
    {
        return _context.Users.FirstOrDefault(u => u.Id == userId);
    }

    var email = User.FindFirst(ClaimTypes.Email)?.Value;

    if (string.IsNullOrWhiteSpace(email))
    {
        return null;
    }

    var emailNormalizado = email.Trim().ToLowerInvariant();

    return _context.Users
        .FirstOrDefault(u => u.Email.ToLower() == emailNormalizado);
}

[HttpPost("register")]
public IActionResult Register(RegisterDto dto)
{
    var nome = (dto.Nome ?? "").Trim();
    var email = (dto.Email ?? "").Trim().ToLowerInvariant();
    var tipoUsuario = (dto.TipoUsuario ?? "").Trim();
    var unidade = (dto.Unidade ?? "").Trim();
    var cursoFaculdade = (dto.CursoFaculdade ?? "").Trim();
    var cargaHorariaSemanal = dto.CargaHorariaSemanal;

    if (
        string.IsNullOrWhiteSpace(nome) ||
        string.IsNullOrWhiteSpace(email) ||
        string.IsNullOrWhiteSpace(dto.Senha)
    )
    {
        return BadRequest(
            "Nome, email e senha são obrigatórios"
        );
    }

    if (!SenhaValida(dto.Senha))
    {
        return BadRequest(
            "A senha deve ter no mínimo 8 caracteres, 1 número e 1 caractere especial"
        );
    }

    if (
        tipoUsuario != "Supervisor" &&
        tipoUsuario != "Bolsista"
    )
    {
        return BadRequest(
            "Tipo de usuário inválido"
        );
    }

    if (
        tipoUsuario == "Bolsista" &&
        (
            string.IsNullOrWhiteSpace(unidade) ||
            string.IsNullOrWhiteSpace(cursoFaculdade) ||
            !cargaHorariaSemanal.HasValue ||
            cargaHorariaSemanal.Value <= 0
        )
    )
    {
        return BadRequest(
            "Curso, carga horária semanal e unidade são obrigatórios para bolsistas"
        );
    }

    var emailExiste = _context.Users
        .Any(u => u.Email.ToLower() == email);

    if (emailExiste)
    {
        return BadRequest(
            "Email já cadastrado"
        );
    }

    var senhaHash =
        BCrypt.Net.BCrypt.HashPassword(
            dto.Senha
        );

    var user = new User
    {
        Nome = nome,
        Email = email,
        SenhaHash = senhaHash,
        TipoUsuario = tipoUsuario,
        Unidade = tipoUsuario == "Bolsista" ? unidade : "",
        CursoFaculdade = tipoUsuario == "Bolsista" ? cursoFaculdade : "",
        CargaHorariaSemanal = tipoUsuario == "Bolsista"
            ? cargaHorariaSemanal
            : null,
        Aprovado = tipoUsuario == "Supervisor"
    };

    _context.Users.Add(user);

    _context.SaveChanges();

    return Ok(new
    {
        mensagem =
            "Usuário cadastrado com sucesso"
    });
}

    [HttpPost("login")]
    public IActionResult Login(LoginDto dto)
    {
        var email = dto.Email.Trim().ToLowerInvariant();

        var user = _context.Users.FirstOrDefault(u => u.Email.ToLower() == email);

        if (user == null)
        {
            return Unauthorized("Usuário inválido");
        }

        var senhaCorreta = BCrypt.Net.BCrypt.Verify(dto.Senha, user.SenhaHash);

        if (!senhaCorreta)
        {
            return Unauthorized("Senha inválida");
        }

        if (user.TipoUsuario == "Bolsista" && !user.Aprovado)
        {
            return Unauthorized(
                "Aguardando aprovação do supervisor"
            );
        }

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
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

    [Authorize]
    [HttpGet("perfil")]
    public IActionResult Perfil()
    {
        var user = ObterUsuarioLogado();

        if (user == null)
        {
            return Unauthorized();
        }

        return Ok(new
        {
            nome = user.Nome,
            email = user.Email,
            tipoUsuario = user.TipoUsuario,
            unidade = user.Unidade,
            cursoFaculdade = user.CursoFaculdade,
            cargaHorariaSemanal = user.CargaHorariaSemanal
        });
    }

    [Authorize]
    [HttpPut("perfil")]
    public IActionResult AtualizarPerfil(AtualizarPerfilDto dto)
    {
        var user = ObterUsuarioLogado();

        if (user == null)
        {
            return Unauthorized();
        }

        var nome = (dto.Nome ?? "").Trim();
        var email = (dto.Email ?? "").Trim().ToLowerInvariant();

        if (
            string.IsNullOrWhiteSpace(nome) ||
            string.IsNullOrWhiteSpace(email)
        )
        {
            return BadRequest("Nome e email são obrigatórios");
        }

        var emailExiste = _context.Users
            .Any(u =>
                u.Id != user.Id &&
                u.Email.ToLower() == email
            );

        if (emailExiste)
        {
            return BadRequest("Email já cadastrado");
        }

        user.Nome = nome;
        user.Email = email;

        _context.SaveChanges();

        return Ok(new
        {
            nome = user.Nome,
            email = user.Email
        });
    }

    [Authorize]
    [HttpPut("alterar-senha")]
    public IActionResult AlterarSenha(AlterarSenhaDto dto)
    {
        var user = ObterUsuarioLogado();

        if (user == null)
        {
            return Unauthorized();
        }

        if (
            string.IsNullOrWhiteSpace(dto.SenhaAtual) ||
            string.IsNullOrWhiteSpace(dto.NovaSenha)
        )
        {
            return BadRequest("Informe a senha atual e a nova senha");
        }

        var senhaAtualCorreta =
            BCrypt.Net.BCrypt.Verify(dto.SenhaAtual, user.SenhaHash);

        if (!senhaAtualCorreta)
        {
            return BadRequest("Senha atual inválida");
        }

        if (dto.SenhaAtual == dto.NovaSenha)
        {
            return BadRequest("A nova senha deve ser diferente da senha atual");
        }

        if (!SenhaValida(dto.NovaSenha))
        {
            return BadRequest(
                "A nova senha deve ter no mínimo 8 caracteres, 1 número e 1 caractere especial"
            );
        }

        user.SenhaHash = BCrypt.Net.BCrypt.HashPassword(dto.NovaSenha);

        _context.SaveChanges();

        return Ok(new
        {
            mensagem = "Senha alterada com sucesso"
        });
    }
    
    
}

