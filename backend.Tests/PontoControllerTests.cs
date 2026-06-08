using backend.controllers;
using backend.data;
using backend.entities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;
using Xunit;

namespace backend.Tests;

public class PontoControllerTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly PontoController _controller;
    private readonly User _bolsista;
    private readonly User _supervisor;
    private readonly User _bolsistaNaoAprovado;

    public PontoControllerTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);

        _supervisor = new User
        {
            Id = 1,
            Nome = "Supervisor",
            Email = "supervisor@test.com",
            TipoUsuario = "Supervisor",
            Aprovado = true,
            SenhaHash = "hash"
        };

        _bolsista = new User
        {
            Id = 2,
            Nome = "Bolsista",
            Email = "bolsista@test.com",
            TipoUsuario = "Bolsista",
            Aprovado = true,
            SenhaHash = "hash"
        };

        _bolsistaNaoAprovado = new User
        {
            Id = 3,
            Nome = "Pendente",
            Email = "pendente@test.com",
            TipoUsuario = "Bolsista",
            Aprovado = false,
            SenhaHash = "hash"
        };

        _context.Users.AddRange(_supervisor, _bolsista, _bolsistaNaoAprovado);
        _context.SaveChanges();

        _controller = new PontoController(_context);
    }

    public void Dispose() => _context.Dispose();

    private void SetUsuario(User user)
    {
        var claims = new[] { new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()) };
        var identity = new ClaimsIdentity(claims, "Test");
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) }
        };
    }

    private static string Json(object? value)
        => JsonSerializer.Serialize(value, new JsonSerializerOptions { PropertyNamingPolicy = null });

    private static JsonElement ParseResponse(IActionResult result)
    {
        var ok = Assert.IsType<OkObjectResult>(result);
        return JsonDocument.Parse(Json(ok.Value)).RootElement;
    }

    // ── Fluxo de aprovação ────────────────────────────────────────────────

    [Fact]
    public void BaterEntrada_Supervisor_RetornaBadRequest()
    {
        SetUsuario(_supervisor);

        var result = _controller.BaterEntrada();

        var bad = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Contains("Supervisor", bad.Value?.ToString());
    }

    [Fact]
    public void BaterEntrada_UsuarioNaoAprovado_RetornaForbid()
    {
        SetUsuario(_bolsistaNaoAprovado);

        var result = _controller.BaterEntrada();

        Assert.IsType<ForbidResult>(result);
    }

    [Fact]
    public void BaterSaida_Supervisor_RetornaBadRequest()
    {
        SetUsuario(_supervisor);

        var result = _controller.BaterSaida();

        Assert.IsType<BadRequestObjectResult>(result);
    }

    // ── Regra de entrada pendente ─────────────────────────────────────────

    [Fact]
    public void BaterEntrada_ComEntradaPendente_RetornaBadRequest()
    {
        _context.RegistrosPonto.Add(new RegistroPonto
        {
            UserId = _bolsista.Id,
            Data = DateTime.UtcNow.Date,
            Entrada = DateTime.UtcNow.AddHours(-1)
        });
        _context.SaveChanges();

        SetUsuario(_bolsista);

        var result = _controller.BaterEntrada();

        var bad = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Contains("pendente", bad.Value?.ToString());
    }

    [Fact]
    public void BaterEntrada_SemEntradaPendente_Sucesso()
    {
        SetUsuario(_bolsista);

        var result = _controller.BaterEntrada();

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public void BaterSaida_SemEntradaPendente_RetornaBadRequest()
    {
        SetUsuario(_bolsista);

        var result = _controller.BaterSaida();

        var bad = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Contains("pendente", bad.Value?.ToString());
    }

    // ── Cálculo de duração ────────────────────────────────────────────────

    [Fact]
    public void BaterSaida_RetornaDuracaoFormatadaHHMM()
    {
        var entrada = DateTime.UtcNow.AddHours(-2).AddMinutes(-30); // 2h30m atrás
        _context.RegistrosPonto.Add(new RegistroPonto
        {
            UserId = _bolsista.Id,
            Data = DateTime.UtcNow.Date,
            Entrada = entrada
        });
        _context.SaveChanges();

        SetUsuario(_bolsista);

        var doc = ParseResponse(_controller.BaterSaida());
        var tempo = doc.GetProperty("tempoTrabalhado").GetString();

        Assert.NotNull(tempo);
        Assert.Matches(@"^\d{2}:\d{2}$", tempo);

        var partes = tempo.Split(':');
        var horas = int.Parse(partes[0]);
        var minutos = int.Parse(partes[1]);

        // Tolera ±1 min de variação de relógio
        Assert.InRange(horas * 60 + minutos, 149, 151);
    }

    [Fact]
    public void BaterSaida_DuracaoZero_RetornaFormatoValido()
    {
        _context.RegistrosPonto.Add(new RegistroPonto
        {
            UserId = _bolsista.Id,
            Data = DateTime.UtcNow.Date,
            Entrada = DateTime.UtcNow
        });
        _context.SaveChanges();

        SetUsuario(_bolsista);

        var doc = ParseResponse(_controller.BaterSaida());
        var tempo = doc.GetProperty("tempoTrabalhado").GetString();

        Assert.NotNull(tempo);
        Assert.Matches(@"^\d{2}:\d{2}$", tempo);
    }

    // ── Conversão de fuso horário (UTC → America/Sao_Paulo = UTC-3) ──────

    [Fact]
    public void MeusRegistros_HorarioConvertidoParaRio()
    {
        // Insere registro com horário UTC conhecido: meio-dia UTC = 09:00 Rio (UTC-3)
        var entradaUtc = new DateTime(2025, 6, 10, 12, 0, 0, DateTimeKind.Utc);
        var saidaUtc = new DateTime(2025, 6, 10, 14, 0, 0, DateTimeKind.Utc);

        _context.RegistrosPonto.Add(new RegistroPonto
        {
            UserId = _bolsista.Id,
            Data = entradaUtc.Date,
            Entrada = entradaUtc,
            Saida = saidaUtc
        });
        _context.SaveChanges();

        SetUsuario(_bolsista);

        var ok = Assert.IsType<OkObjectResult>(_controller.MeusRegistros());
        var json = JsonDocument.Parse(Json(ok.Value));
        var registro = json.RootElement[0];

        // UTC-3: 12:00 UTC → 09:00; 14:00 UTC → 11:00
        Assert.Equal("09:00", registro.GetProperty("entrada").GetString());
        Assert.Equal("11:00", registro.GetProperty("saida").GetString());
        Assert.Equal("02:00", registro.GetProperty("horas").GetString());
    }

    [Fact]
    public void MeusRegistros_RegistroSemSaida_HorasRetornaZero()
    {
        _context.RegistrosPonto.Add(new RegistroPonto
        {
            UserId = _bolsista.Id,
            Data = DateTime.UtcNow.Date,
            Entrada = DateTime.UtcNow
        });
        _context.SaveChanges();

        SetUsuario(_bolsista);

        var ok = Assert.IsType<OkObjectResult>(_controller.MeusRegistros());
        var json = JsonDocument.Parse(Json(ok.Value));
        var registro = json.RootElement[0];

        Assert.Equal("00:00", registro.GetProperty("horas").GetString());
        Assert.Equal("", registro.GetProperty("saida").GetString());
    }

    // ── Resumo mensal ─────────────────────────────────────────────────────

    [Fact]
    public void Resumo_SemRegistros_TotalZero()
    {
        SetUsuario(_bolsista);

        var doc = ParseResponse(_controller.Resumo());

        Assert.Equal("00:00", doc.GetProperty("totalHoras").GetString());
        Assert.Equal(0, doc.GetProperty("totalRegistros").GetInt32());
        Assert.False(doc.GetProperty("trabalhandoAgora").GetBoolean());
    }

    [Fact]
    public void Resumo_ComRegistroAberto_TrabalhandoAgoraVerdadeiro()
    {
        _context.RegistrosPonto.Add(new RegistroPonto
        {
            UserId = _bolsista.Id,
            Data = DateTime.UtcNow.Date,
            Entrada = DateTime.UtcNow.AddHours(-1)
        });
        _context.SaveChanges();

        SetUsuario(_bolsista);

        var doc = ParseResponse(_controller.Resumo());

        Assert.True(doc.GetProperty("trabalhandoAgora").GetBoolean());
    }
}
