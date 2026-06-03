using backend.data;
using backend.entities;
using Microsoft.EntityFrameworkCore;

namespace backend.services;

public class PontoService
{
    private readonly ApplicationDbContext _context;

    public PontoService(ApplicationDbContext context)
    {
        _context = context;
    }

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

    private static DateTime HojeUtc => DateTime.UtcNow.Date;

    private static string FormatarDuracao(TimeSpan duracao)
    {
        var totalMinutos = Math.Max(0, (int)Math.Floor(duracao.TotalMinutes));
        return $"{totalMinutos / 60:D2}:{totalMinutos % 60:D2}";
    }

    public async Task<(bool sucesso, string mensagem, object? dados)> BaterEntrada(int userId, CancellationToken ct)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);

        if (user == null)
        {
            return (false, "Usuário não encontrado", null);
        }

        if (user.TipoUsuario == "Supervisor")
        {
            return (false, "Supervisor não pode bater ponto", null);
        }

        if (!user.Aprovado)
        {
            return (false, "Usuário não aprovado", null);
        }

        var hoje = HojeUtc;

        var registroPendente = await _context.RegistrosPonto
            .FirstOrDefaultAsync(r =>
                r.UserId == user.Id &&
                r.Saida == null,
                ct
            );

        if (registroPendente != null)
        {
            return (false, "Existe uma entrada pendente para registrar saída", null);
        }

        var registro = new RegistroPonto
        {
            UserId = user.Id,
            Data = hoje,
            Entrada = DateTime.UtcNow
        };

        _context.RegistrosPonto.Add(registro);

        await _context.SaveChangesAsync(ct);

        var dados = new
        {
            mensagem = "Entrada registrada com sucesso",
            horario = registro.Entrada.HasValue
                ? (DateTime?)ParaHorarioRio(registro.Entrada.Value)
                : null
        };

        return (true, "Entrada registrada com sucesso", dados);
    }

    public async Task<(bool sucesso, string mensagem, object? dados)> BaterSaida(int userId, CancellationToken ct)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);

        if (user == null)
        {
            return (false, "Usuário não encontrado", null);
        }

        if (user.TipoUsuario == "Supervisor")
        {
            return (false, "Supervisor não pode bater saída", null);
        }

        if (!user.Aprovado)
        {
            return (false, "Usuário não aprovado", null);
        }

        var hoje = HojeUtc;

        var registroPendente = await _context.RegistrosPonto
            .FirstOrDefaultAsync(r =>
                r.UserId == user.Id &&
                r.Saida == null,
                ct
            );

        if (registroPendente != null && registroPendente.Data.Date != hoje)
        {
            return (false, "Existe uma entrada pendente de outro dia. Procure o supervisor", null);
        }

        var registro = registroPendente;

        if (registro == null)
        {
            return (false, "Não existe entrada pendente para registrar saída", null);
        }

        if (registro.Saida != null)
        {
            return (false, "Saída já registrada", null);
        }

        registro.Saida = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);

        var dados = new
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
        };

        return (true, "Saída registrada com sucesso", dados);
    }
}
