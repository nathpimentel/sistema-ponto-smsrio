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

    [Authorize]
    [HttpPost("entrada")]
    public IActionResult BaterEntrada()
    {
        var email = User.FindFirst(ClaimTypes.Email)?.Value;

        var user = _context.Users.FirstOrDefault(u => u.Email == email);


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

        var hoje = DateTime.UtcNow.Date;

        var registroExistente = _context.RegistrosPonto
            .FirstOrDefault(r =>
                r.UserId == user.Id &&
                r.Data.Date == hoje
            );

        if (registroExistente != null)
        {
            return BadRequest("Entrada já registrada hoje");
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
            horario = registro.Entrada?.ToLocalTime()
        });
    }

    [Authorize]
    [HttpPost("saida")]
    public IActionResult BaterSaida()
    {
        var email = User.FindFirst(ClaimTypes.Email)?.Value;

        var user = _context.Users.FirstOrDefault(u => u.Email == email);

        if (user == null)
        {
            return Unauthorized();
        }

        if (user.TipoUsuario == "Supervisor")
    {
        return BadRequest(
            "Supervisor não possui registros de ponto"
        );
    }

        var hoje = DateTime.UtcNow.Date;

        var registro = _context.RegistrosPonto
    .FirstOrDefault(r =>
        r.UserId == user.Id &&
        r.Saida == null
    );

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

        if (registro.Entrada != null)
        {
            var horas = registro.Saida.Value - registro.Entrada.Value;

            registro.HorasTrabalhadas = horas.TotalHours;
        }

        _context.SaveChanges();

        return Ok(new
        {
            mensagem = "Saída registrada com sucesso",

            entrada = registro.Entrada?.ToLocalTime(),

            saida = registro.Saida?.ToLocalTime(),

            tempoTrabalhado = registro.Entrada != null && registro.Saida != null
    ? (registro.Saida.Value - registro.Entrada.Value).ToString(@"hh\:mm")
    : null
        });
    }

    [Authorize]
[HttpGet("meus-registros")]
public IActionResult MeusRegistros()
{
    var email = User.FindFirst(ClaimTypes.Email)?.Value;

    var user = _context.Users.FirstOrDefault(u => u.Email == email);

    if (user == null)
    {
        return Unauthorized();
    }

    if (user.TipoUsuario == "Supervisor")
{
    return BadRequest(
        "Supervisor não possui registros de ponto"
    );
}

    var registros = _context.RegistrosPonto
        .Where(r => r.UserId == user.Id)
        .OrderByDescending(r => r.Data)
        .Select(r => new
        {
            data = r.Data.ToString("dd/MM/yyyy"),

            entrada = r.Entrada != null
                ? r.Entrada.Value.ToLocalTime().ToString("HH:mm")
                : null,

            saida = r.Saida != null
                ? r.Saida.Value.ToLocalTime().ToString("HH:mm")
                : null,

            tempoTrabalhado =
                r.Entrada != null && r.Saida != null
                    ? $"{(r.Saida.Value - r.Entrada.Value).Hours:D2}:{(r.Saida.Value - r.Entrada.Value).Minutes:D2}"
                    : null
        })
        .ToList();

    return Ok(registros);
}
}