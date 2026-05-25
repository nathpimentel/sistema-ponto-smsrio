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
using System.Security.Cryptography;
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
        senha.Any(char.IsLower) &&
        senha.Any(char.IsUpper) &&
        senha.Any(char.IsDigit) &&
        senha.Any(c => !char.IsLetterOrDigit(c));
}

private const string MensagemSenhaInvalida =
    "A senha deve ter no minimo 8 caracteres, uma letra minuscula, uma letra maiuscula, um numero e um caractere especial";

private static string GerarTokenPrimeiroAcesso()
{
    return Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant();
}

private static string GerarHashToken(string token)
{
    return Convert.ToHexString(
        SHA256.HashData(Encoding.UTF8.GetBytes(token.Trim()))
    );
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

[Authorize(Roles = "Supervisor")]
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
        string.IsNullOrWhiteSpace(email)
    )
    {
        return BadRequest(
            "Nome e email sao obrigatorios"
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
            !cargaHorariaSemanal.HasValue ||
            cargaHorariaSemanal.Value <= 0
        )
    )
    {
        return BadRequest(
            "Carga horaria semanal e obrigatoria para bolsistas"
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

    var tokenPrimeiroAcesso = GerarTokenPrimeiroAcesso();

    var user = new User
    {
        Nome = nome,
        Email = email,
        SenhaHash = BCrypt.Net.BCrypt.HashPassword(GerarTokenPrimeiroAcesso()),
        SenhaDefinida = false,
        PrimeiroAcessoTokenHash = GerarHashToken(tokenPrimeiroAcesso),
        PrimeiroAcessoTokenExpiraEm = DateTime.UtcNow.AddMinutes(60),
        TipoUsuario = tipoUsuario,
        Unidade = tipoUsuario == "Bolsista" ? unidade : "",
        CursoFaculdade = tipoUsuario == "Bolsista" ? cursoFaculdade : "",
        CargaHorariaSemanal = tipoUsuario == "Bolsista"
            ? cargaHorariaSemanal
            : null,
        Aprovado = true
    };

    _context.Users.Add(user);

    _context.SaveChanges();

    return Ok(new
    {
        mensagem =
            "Usuário cadastrado com sucesso",
        primeiroAcessoToken = tokenPrimeiroAcesso,
        primeiroAcessoUrl = $"/primeiro-acesso?token={tokenPrimeiroAcesso}",
        expiraEm = user.PrimeiroAcessoTokenExpiraEm
    });
}

    [HttpGet("primeiro-acesso/validar-token")]
    public IActionResult ValidarTokenPrimeiroAcesso([FromQuery] string token)
    {
        token = (token ?? "").Trim();

        if (string.IsNullOrWhiteSpace(token))
        {
            return BadRequest("Token de primeiro acesso obrigatorio");
        }

        var tokenHash = GerarHashToken(token);

        var user = _context.Users.FirstOrDefault(u =>
            u.PrimeiroAcessoTokenHash == tokenHash &&
            !u.SenhaDefinida
        );

        if (user == null)
        {
            return BadRequest("Link invalido ou ja utilizado");
        }

        if (
            !user.PrimeiroAcessoTokenExpiraEm.HasValue ||
            user.PrimeiroAcessoTokenExpiraEm.Value < DateTime.UtcNow
        )
        {
            return BadRequest("Link expirado. Solicite um novo convite ao supervisor");
        }

        return Ok(new
        {
            mensagem = "Convite valido",
            expiraEm = user.PrimeiroAcessoTokenExpiraEm
        });
    }

    [HttpPost("primeiro-acesso/definir-senha")]
    public IActionResult DefinirSenhaPrimeiroAcesso(PrimeiroAcessoDefinirSenhaDto dto)
    {
        var token = (dto.Token ?? "").Trim();
        var novaSenha = dto.NovaSenha ?? "";

        if (string.IsNullOrWhiteSpace(token) || string.IsNullOrWhiteSpace(novaSenha))
        {
            return BadRequest("Token e nova senha sao obrigatorios");
        }

        if (!SenhaValida(novaSenha))
        {
            return BadRequest(MensagemSenhaInvalida);
        }

        var tokenHash = GerarHashToken(token);

        var user = _context.Users.FirstOrDefault(u =>
            u.PrimeiroAcessoTokenHash == tokenHash &&
            !u.SenhaDefinida
        );

        if (user == null)
        {
            return BadRequest("Token invalido ou ja utilizado");
        }

        if (
            !user.PrimeiroAcessoTokenExpiraEm.HasValue ||
            user.PrimeiroAcessoTokenExpiraEm.Value < DateTime.UtcNow
        )
        {
            return BadRequest("Token expirado. Solicite um novo convite ao supervisor");
        }

        user.SenhaHash = BCrypt.Net.BCrypt.HashPassword(novaSenha);
        user.SenhaDefinida = true;
        user.PrimeiroAcessoTokenHash = null;
        user.PrimeiroAcessoTokenExpiraEm = null;

        _context.SaveChanges();

        return Ok(new
        {
            mensagem = "Senha definida com sucesso"
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

        if (!user.SenhaDefinida)
        {
            return Unauthorized("Primeiro acesso pendente");
        }

        var senhaCorreta = BCrypt.Net.BCrypt.Verify(dto.Senha, user.SenhaHash);

        if (!senhaCorreta)
        {
            return Unauthorized("Senha inválida");
        }

        if (!user.Aprovado)
        {
            return Unauthorized(
                "Usuario inativo ou aguardando aprovacao"
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
            cargaHorariaSemanal = user.CargaHorariaSemanal,
            fotoBase64 = user.FotoBase64
        });
    }

    [Authorize]
    [HttpPost("foto-perfil")]
    public async Task<IActionResult> UploadFotoPerfil(IFormFile foto)
    {
        var user = ObterUsuarioLogado();

        if (user == null)
        {
            return Unauthorized();
        }

        if (foto == null || foto.Length == 0)
        {
            return BadRequest("Nenhuma foto enviada");
        }

        var tiposPermitidos = new[] { "image/jpeg", "image/png", "image/gif", "image/webp" };

        if (!tiposPermitidos.Contains(foto.ContentType.ToLower()))
        {
            return BadRequest("Formato inválido. Use JPEG, PNG, GIF ou WebP");
        }

        const long tamanhoMaximo = 2 * 1024 * 1024;

        if (foto.Length > tamanhoMaximo)
        {
            return BadRequest("A foto deve ter no máximo 2MB");
        }

        using var ms = new MemoryStream();
        await foto.CopyToAsync(ms);
        var bytes = ms.ToArray();
        var base64 = Convert.ToBase64String(bytes);
        var dataUrl = $"data:{foto.ContentType};base64,{base64}";

        user.FotoBase64 = dataUrl;
        _context.SaveChanges();

        return Ok(new { fotoBase64 = dataUrl });
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
            return BadRequest(MensagemSenhaInvalida);
        }

        user.SenhaHash = BCrypt.Net.BCrypt.HashPassword(dto.NovaSenha);

        _context.SaveChanges();

        return Ok(new
        {
            mensagem = "Senha alterada com sucesso"
        });
    }
    
    
}

