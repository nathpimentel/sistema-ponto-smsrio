using backend.data;
using backend.entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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

    private static readonly TimeZoneInfo FusoRio = ObterFusoRio();

    private static TimeZoneInfo ObterFusoRio()
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById("America/Sao_Paulo");
        }
        catch (TimeZoneNotFoundException)
        {
            return TimeZoneInfo.FindSystemTimeZoneById("E. South America Standard Time");
        }
    }

    private static DateTime ParaHorarioRio(DateTime dataUtc)
    {
        var utc = dataUtc.Kind == DateTimeKind.Utc
            ? dataUtc
            : DateTime.SpecifyKind(dataUtc, DateTimeKind.Utc);

        return TimeZoneInfo.ConvertTimeFromUtc(utc, FusoRio);
    }

    private static string FormatarDuracao(TimeSpan duracao)
    {
        var totalMinutos = Math.Max(0, (int)Math.Floor(duracao.TotalMinutes));
        return $"{totalMinutos / 60:D2}:{totalMinutos % 60:D2}";
    }

    private async Task<User?> ObterUsuarioLogadoAsync(CancellationToken ct)
    {
        var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (int.TryParse(idClaim, out var userId))
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);
        }

        var email = User.FindFirst(ClaimTypes.Email)?.Value;

        if (string.IsNullOrWhiteSpace(email))
        {
            return null;
        }

        var emailNormalizado = email.Trim().ToLowerInvariant();

        return await _context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == emailNormalizado, ct);
    }

    [Authorize]
    [HttpPost("entrada")]
    public async Task<IActionResult> BaterEntrada(CancellationToken cancellationToken = default)
    {
        var user = await ObterUsuarioLogadoAsync(cancellationToken);

        if (user == null)
        {
            return Unauthorized();
        }

        if (user.TipoUsuario == "Supervisor")
        {
            return BadRequest("Supervisor não pode bater ponto");
        }

        if (!user.Aprovado)
        {
            return Forbid();
        }

        var hoje = HojeUtc;

        var registroPendente = await _context.RegistrosPonto
            .FirstOrDefaultAsync(r =>
                r.UserId == user.Id &&
                r.Saida == null,
                cancellationToken
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

        await _context.SaveChangesAsync(cancellationToken);

        return Ok(new
        {
            mensagem = "Entrada registrada com sucesso",
            horario = registro.Entrada.HasValue
                ? (DateTime?)ParaHorarioRio(registro.Entrada.Value)
                : null
        });
    }

    [Authorize]
    [HttpPost("saida")]
    public async Task<IActionResult> BaterSaida(CancellationToken cancellationToken = default)
    {
        var user = await ObterUsuarioLogadoAsync(cancellationToken);

        if (user == null)
        {
            return Unauthorized();
        }

        if (user.TipoUsuario == "Supervisor")
        {
            return BadRequest("Supervisor não pode bater saída");
        }

        if (!user.Aprovado)
        {
            return Forbid();
        }

        var hoje = HojeUtc;

        var registroPendente = await _context.RegistrosPonto
            .FirstOrDefaultAsync(r =>
                r.UserId == user.Id &&
                r.Saida == null,
                cancellationToken
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

        await _context.SaveChangesAsync(cancellationToken);

        return Ok(new
        {
            mensagem = "Saída registrada com sucesso",

            entrada = registro.Entrada.HasValue
                ? (DateTime?)ParaHorarioRio(registro.Entrada.Value)
                : null,

            saida = registro.Saida.HasValue
                ? (DateTime?)ParaHorarioRio(registro.Saida.Value)
                : null,

            tempoTrabalhado = registro.Entrada != null && registro.Saida != null
                ? FormatarDuracao(registro.Saida.Value - registro.Entrada.Value)
                : null
        });
    }

    [Authorize]
    [HttpGet("meus-registros")]
    public async Task<IActionResult> MeusRegistros(CancellationToken cancellationToken = default)
    {
        var user = await ObterUsuarioLogadoAsync(cancellationToken);

        if (user == null)
        {
            return Unauthorized();
        }

        var registros = (await _context.RegistrosPonto
            .Where(r => r.UserId == user.Id)
            .OrderByDescending(r => r.Data)
            .ToListAsync(cancellationToken))
            .Select(r => new
            {
                data = r.Data.ToString("dd/MM/yyyy"),

                entrada = r.Entrada != null
                    ? ParaHorarioRio(r.Entrada.Value).ToString("HH:mm")
                    : "",

                saida = r.Saida != null
                    ? ParaHorarioRio(r.Saida.Value).ToString("HH:mm")
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
    public async Task<IActionResult> Resumo(CancellationToken cancellationToken = default)
    {
        var user = await ObterUsuarioLogadoAsync(cancellationToken);

        if (user == null)
        {
            return Unauthorized();
        }

        var hoje = HojeUtc;

        var registros = await _context.RegistrosPonto
            .Where(r =>
                r.UserId == user.Id &&
                r.Data.Month == hoje.Month &&
                r.Data.Year == hoje.Year
            )
            .ToListAsync(cancellationToken);

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
                registros.Count(r => r.Entrada != null && r.Saida != null),

            trabalhandoAgora,

            inicioExpediente =
                registroAberto?.Entrada != null
                    ? registroAberto.Entrada.Value.ToUniversalTime().ToString("O")
                    : null
        });
    }
}
