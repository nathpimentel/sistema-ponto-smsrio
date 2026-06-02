using backend.data;
using backend.entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace backend.controllers;

[ApiController]
[Route("ponto")]
public class PontoController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public PontoController(ApplicationDbContext context)
    {
        _context = context;
    }

    private static DateTime HojeUtc => DateTime.UtcNow.Date;

    private static string FormatarDuracao(TimeSpan duracao)
    {
        var totalMinutos = Math.Max(0, (int)Math.Floor(duracao.TotalMinutes));
        return $"{totalMinutos / 60:D2}:{totalMinutos % 60:D2}";
    }

    private static string ParaIsoUtc(DateTime data)
    {
        var utc = data.Kind switch
        {
            DateTimeKind.Utc => data,
            DateTimeKind.Local => data.ToUniversalTime(),
            _ => DateTime.SpecifyKind(data, DateTimeKind.Utc)
        };

        return utc.ToString("O");
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

    [Authorize]
    [HttpPost("entrada")]
    public IActionResult BaterEntrada()
    {
        var user = ObterUsuarioLogado();

        if (user == null)
        {
            return Unauthorized();
        }

        if (user.TipoUsuario == "Supervisor")
    {
        return BadRequest(
            "Supervisor não pode bater ponto"
        );
    }

        if (!user.Aprovado)
        {
            return Forbid();
        }

        var hoje = HojeUtc;

        var registroPendente = _context.RegistrosPonto
            .FirstOrDefault(r =>
                r.UserId == user.Id &&
                r.Saida == null
            );

        if (registroPendente != null)
        {
            return BadRequest("Existe uma entrada pendente para registrar saída");
        }

        var registro = new RegistroPonto
        {
            UserId = user.Id,
            Data = hoje,
            Entrada = DateTime.UtcNow
        };

        _context.RegistrosPonto.Add(registro);

        _context.SaveChanges();

        return Ok(new
        {
            mensagem = "Entrada registrada com sucesso",
            horario = registro.Entrada.HasValue
                ? ParaIsoUtc(registro.Entrada.Value)
                : null
        });
    }

    [Authorize]
    [HttpPost("saida")]
    public IActionResult BaterSaida()
    {
        var user = ObterUsuarioLogado();

        if (user == null)
        {
            return Unauthorized();
        }

        if (user.TipoUsuario == "Supervisor")
    {
        return BadRequest(
            "Supervisor não pode bater saída"
        );
    }

        if (!user.Aprovado)
        {
            return Forbid();
        }

        var hoje = HojeUtc;

        var registroPendente = _context.RegistrosPonto
            .FirstOrDefault(r =>
                r.UserId == user.Id &&
                r.Saida == null
            );

        if (registroPendente != null && registroPendente.Data.Date != hoje)
        {
            return BadRequest(
                "Existe uma entrada pendente de outro dia. Procure o supervisor"
            );
        }

        var registro = registroPendente;

                if (registro == null)
        {
            return BadRequest(
                "Não existe entrada pendente para registrar saída"
            );
        }

        if (registro.Saida != null)
        {
            return BadRequest("Saída já registrada");
        }

        registro.Saida = DateTime.UtcNow;

        _context.SaveChanges();

        return Ok(new
        {
            mensagem = "Saída registrada com sucesso",

            entrada = registro.Entrada.HasValue
                ? ParaIsoUtc(registro.Entrada.Value)
                : null,

            saida = registro.Saida.HasValue
                ? ParaIsoUtc(registro.Saida.Value)
                : null,

            tempoTrabalhado = registro.Entrada != null && registro.Saida != null
    ? FormatarDuracao(registro.Saida.Value - registro.Entrada.Value)
    : null
        });
    }


[Authorize]
[HttpGet("meus-registros")]
public IActionResult MeusRegistros()
{
    var user = ObterUsuarioLogado();

    if (user == null)
    {
        return Unauthorized();
    }

    var registros = _context.RegistrosPonto
        .Where(r => r.UserId == user.Id)
        .OrderByDescending(r => r.Data)
        .ToList()
        .Select(r => new
        {
            data = r.Data
                .ToString("yyyy-MM-dd"),

            entrada = r.Entrada != null
                ? ParaIsoUtc(r.Entrada.Value)
                : "",

            saida = r.Saida != null
                ? ParaIsoUtc(r.Saida.Value)
                : "",

            horas =
                r.Entrada != null &&
                r.Saida != null
                    ? FormatarDuracao(r.Saida.Value - r.Entrada.Value)
                    : "00:00"
        })
        .ToList();

    return Ok(registros);
}
[Authorize]
[HttpGet("resumo")]
public IActionResult Resumo()
{
    var user = ObterUsuarioLogado();

    if (user == null)
    {
        return Unauthorized();
    }

    var hoje = HojeUtc;

    var registros = _context.RegistrosPonto
        .Where(r =>
            r.UserId == user.Id &&
            r.Data.Month == hoje.Month &&
            r.Data.Year == hoje.Year
        )
        .ToList();

    var totalMinutos = registros
        .Where(r =>
            r.Entrada != null &&
            r.Saida != null
        )
        .Sum(r =>
            (r.Saida!.Value - r.Entrada!.Value)
            .TotalMinutes
        );

    var horas = (int)totalMinutos / 60;

    var minutos = (int)totalMinutos % 60;

    var registroAberto =
        registros.FirstOrDefault(r =>
            r.Data.Date == hoje.Date &&
            r.Entrada != null &&
            r.Saida == null
        );

    var trabalhandoAgora = registroAberto != null;

    return Ok(new
    {
        totalHoras =
            $"{horas:D2}:{minutos:D2}",

        totalRegistros =
            registros
                .Where(r => r.Entrada != null && r.Saida != null)
                .Select(r => r.Data.Date)
                .Distinct()
                .Count(),

        trabalhandoAgora,

        inicioExpediente =
            registroAberto?.Entrada != null
                ? registroAberto.Entrada.Value.ToUniversalTime().ToString("O")
                : null
    });
}

}
