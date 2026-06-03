using backend.services;
using backend.data;
using backend.dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.controllers;

[ApiController]
[Route("supervisor")]
public class SupervisorController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly PdfService _pdfService;

    public SupervisorController(
        ApplicationDbContext context,
        PdfService pdfService
    )
    {
        _context = context;
        _pdfService = pdfService;
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

    private static DateTime NormalizarUtc(DateTime data)
    {
        return data.Kind switch
        {
            DateTimeKind.Utc => data,
            DateTimeKind.Local => data.ToUniversalTime(),
            _ => DateTime.SpecifyKind(data, DateTimeKind.Local).ToUniversalTime()
        };
    }

    private static string FormatarDuracao(TimeSpan duracao)
    {
        var totalMinutos = Math.Max(0, (int)Math.Floor(duracao.TotalMinutes));
        return $"{totalMinutos / 60:D2}:{totalMinutos % 60:D2}";
    }

    [Authorize(Roles = "Supervisor")]
    [HttpGet("usuarios")]
    public async Task<IActionResult> Usuarios(CancellationToken cancellationToken = default)
    {
        var usuarios = await _context.Users
            .Select(u => new
            {
                u.Id,
                u.Nome,
                u.Email,
                u.TipoUsuario,
                u.Unidade,
                u.CursoFaculdade,
                u.CargaHorariaSemanal,
                u.Aprovado,
                u.FotoBase64
            })
            .ToListAsync(cancellationToken);

        return Ok(usuarios);
    }

    [Authorize(Roles = "Supervisor")]
    [HttpGet("registros")]
    public async Task<IActionResult> BuscarTodosRegistros(
        int? mes,
        int? ano,
        string? busca,
        CancellationToken cancellationToken = default
    )
    {
        if (mes.HasValue && (mes.Value < 1 || mes.Value > 12))
        {
            return BadRequest("Mês inválido");
        }

        if (ano.HasValue && ano.Value < 1)
        {
            return BadRequest("Ano inválido");
        }

        var query = _context.RegistrosPonto.AsQueryable();

        if (ano.HasValue)
        {
            query = query.Where(r => r.Data.Year == ano.Value);
        }

        if (mes.HasValue)
        {
            query = query.Where(r => r.Data.Month == mes.Value);
        }

        if (!string.IsNullOrWhiteSpace(busca))
        {
            var termoBusca = busca.Trim().ToLower();

            query = query.Where(r =>
                r.User.Nome.ToLower().Contains(termoBusca) ||
                r.User.Email.ToLower().Contains(termoBusca)
            );
        }

        var registros = (await query
            .OrderBy(r => r.User.Nome)
            .ThenBy(r => r.Data)
            .ToListAsync(cancellationToken))
            .Select(r => new
            {
                id = r.Id,

                nome = r.User.Nome,

                email = r.User.Email,

                curso = r.User.CursoFaculdade,

                unidade = r.User.Unidade,

                cargaHorariaSemanal = r.User.CargaHorariaSemanal,

                data = r.Data.ToString("dd/MM/yyyy"),

                entrada = r.Entrada != null
                    ? ParaHorarioRio(r.Entrada.Value).ToString("HH:mm")
                    : null,

                saida = r.Saida != null
                    ? ParaHorarioRio(r.Saida.Value).ToString("HH:mm")
                    : null,

                tempoTrabalhado =
                    r.Entrada != null && r.Saida != null
                        ? FormatarDuracao(r.Saida.Value - r.Entrada.Value)
                        : null
            })
            .ToList();

        return Ok(registros);
    }

    [Authorize(Roles = "Supervisor")]
    [HttpPut("aprovar/{id}")]
    public async Task<IActionResult> AprovarUsuario(int id, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == id, cancellationToken);

        if (user == null)
        {
            return NotFound();
        }

        user.Aprovado = true;

        await _context.SaveChangesAsync(cancellationToken);

        return Ok();
    }

    [Authorize(Roles = "Supervisor")]
    [HttpGet("pendentes")]
    public async Task<IActionResult> UsuariosPendentes(CancellationToken cancellationToken = default)
    {
        var usuarios = await _context.Users
            .Where(u =>
                !u.Aprovado &&
                u.TipoUsuario == "Bolsista"
            )
            .Select(u => new
            {
                u.Id,
                u.Nome,
                u.Email
            })
            .ToListAsync(cancellationToken);

        return Ok(usuarios);
    }

    [Authorize(Roles = "Supervisor")]
    [HttpGet("relatorio-pdf")]
    public async Task<IActionResult> GerarRelatorioPdf(
        string? busca = "",
        int mes = 0,
        int ano = 0,
        CancellationToken cancellationToken = default
    )
    {
        if (mes < 1 || mes > 12 || ano < 1)
        {
            return BadRequest("Informe mês e ano válidos");
        }

        List<RelatorioPontoLinhaDto> dadosRelatorio;

        string nomeRelatorio;

        if (!string.IsNullOrWhiteSpace(busca))
        {
            // RELATÓRIO INDIVIDUAL

            var termoBusca = busca.Trim().ToLower();

            var candidatos = await _context.Users
                .Where(u =>
                    u.TipoUsuario == "Bolsista" &&
                    (
                        u.Email.ToLower() == termoBusca ||
                        u.Nome.ToLower().Contains(termoBusca)
                    )
                )
                .Select(u => new { u.Id, u.Nome, u.Email })
                .ToListAsync(cancellationToken);

            if (!candidatos.Any())
            {
                return NotFound("Nenhum bolsista encontrado com esse nome ou e-mail");
            }

            if (candidatos.Count > 1)
            {
                return BadRequest(new
                {
                    mensagem = "Mais de um bolsista encontrado. Selecione pelo e-mail.",
                    candidatos
                });
            }

            var user = candidatos[0];

            nomeRelatorio = user.Nome;

            var registros = await _context.RegistrosPonto
                .Where(r =>
                    r.UserId == user.Id &&
                    r.Data.Month == mes &&
                    r.Data.Year == ano
                )
                .OrderBy(r => r.Data)
                .ToListAsync(cancellationToken);

            dadosRelatorio = registros.Select(r =>
            {
                var tempo = r.Saida != null
                    ? r.Saida.Value - r.Entrada!.Value
                    : TimeSpan.Zero;

                return new RelatorioPontoLinhaDto(
                    Nome: user.Nome,
                    Data: r.Data.ToString("dd/MM/yyyy"),
                    Entrada: r.Entrada != null
                        ? ParaHorarioRio(r.Entrada.Value).ToString("HH:mm")
                        : "",
                    Saida: r.Saida != null
                        ? ParaHorarioRio(r.Saida.Value).ToString("HH:mm")
                        : "",
                    HorasTrabalhadas: FormatarDuracao(tempo),
                    MinutosTotais: tempo.TotalMinutes
                );
            }).ToList();

            var totalMinutos =
                dadosRelatorio.Sum(r => r.MinutosTotais);

            var horas = (int)totalMinutos / 60;

            var minutos = (int)totalMinutos % 60;

            var totalHorasMes = $"{horas:D2}:{minutos:D2}";

            var pdf = _pdfService.GerarRelatorio(
                nomeRelatorio,
                mes,
                ano,
                dadosRelatorio,
                totalHorasMes,
                false
            );

            return File(
                pdf,
                "application/pdf",
                $"relatorio-{nomeRelatorio}.pdf"
            );
        }
        else
        {
            // RELATÓRIO GERAL

            nomeRelatorio = "Todos os Bolsistas";

            var registros = await _context.RegistrosPonto
                .Where(r =>
                    r.Data.Month == mes &&
                    r.Data.Year == ano &&
                    r.User != null &&
                    r.User.TipoUsuario == "Bolsista"
                )
                .OrderBy(r => r.UserId)
                .ThenBy(r => r.Data)
                .ToListAsync(cancellationToken);

            dadosRelatorio = registros.Select(r =>
            {
                var tempo = r.Saida != null
                    ? r.Saida.Value - r.Entrada!.Value
                    : TimeSpan.Zero;

                return new RelatorioPontoLinhaDto(
                    Nome: r.User.Nome,
                    Data: r.Data.ToString("dd/MM/yyyy"),
                    Entrada: r.Entrada != null
                        ? ParaHorarioRio(r.Entrada.Value).ToString("HH:mm")
                        : "",
                    Saida: r.Saida != null
                        ? ParaHorarioRio(r.Saida.Value).ToString("HH:mm")
                        : "",
                    HorasTrabalhadas: FormatarDuracao(tempo),
                    MinutosTotais: tempo.TotalMinutes
                );
            }).ToList();

            var pdf = _pdfService.GerarRelatorio(
                nomeRelatorio,
                mes,
                ano,
                dadosRelatorio,
                "",
                true
            );

            return File(
                pdf,
                "application/pdf",
                $"relatorio-geral.pdf"
            );
        }
    }

    [Authorize(Roles = "Supervisor")]
    [HttpGet("bolsistas")]
    public async Task<IActionResult> ListarBolsistas(CancellationToken cancellationToken = default)
    {
        var bolsistas = await _context.Users
            .Where(u => u.TipoUsuario == "Bolsista")
            .Select(u => new
            {
                id = u.Id,
                nome = u.Nome,
                email = u.Email,
                curso = u.CursoFaculdade,
                unidade = u.Unidade,
                cargaHorariaSemanal = u.CargaHorariaSemanal
            })
            .ToListAsync(cancellationToken);

        return Ok(bolsistas);
    }

    [Authorize(Roles = "Supervisor")]
    [HttpGet("ativos")]
    public async Task<IActionResult> UsuariosAtivos(CancellationToken cancellationToken = default)
    {
        var ativos = (await _context.RegistrosPonto
            .Where(r =>
                r.Data.Date == HojeUtc &&
                r.Entrada != null &&
                r.Saida == null
            )
            .ToListAsync(cancellationToken))
            .Select(r => new
            {
                nome = r.User.Nome,

                email = r.User.Email,

                entrada = ParaHorarioRio(r.Entrada!.Value).ToString("HH:mm"),

                data = r.Data.ToString("dd/MM/yyyy")
            })
            .ToList();

        return Ok(ativos);
    }

    [Authorize(Roles = "Supervisor")]
    [HttpGet("resumo-dia")]
    public async Task<IActionResult> ResumoDia(CancellationToken cancellationToken = default)
    {
        var hoje = HojeUtc;
        var agoraUtc = DateTime.UtcNow;
        var agoraLocal = ParaHorarioRio(agoraUtc);

        var bolsistasAtivos = await _context.Users
            .Where(u =>
                u.TipoUsuario == "Bolsista" &&
                u.Aprovado
            )
            .ToListAsync(cancellationToken);

        var registrosHoje = await _context.RegistrosPonto
            .Where(r => r.Data.Date == hoje)
            .ToListAsync(cancellationToken);

        var presentesHoje = registrosHoje
            .Where(r => r.Entrada != null)
            .Select(r => r.UserId)
            .Distinct()
            .Count();

        var trabalhandoAgora = registrosHoje
            .Count(r => r.Entrada != null && r.Saida == null);

        var pendenciasSaida = await _context.RegistrosPonto
            .CountAsync(r =>
                r.Data.Date < hoje &&
                r.Entrada != null &&
                r.Saida == null,
                cancellationToken
            );

        var usuariosComPontoHoje = registrosHoje
            .Where(r => r.Entrada != null)
            .Select(r => r.UserId)
            .Distinct()
            .ToHashSet();

        var semPontoHoje = bolsistasAtivos
            .Count(u => !usuariosComPontoHoje.Contains(u.Id));

        var equipeEmExpediente = (await _context.RegistrosPonto
            .Where(r =>
                r.Data.Date == hoje &&
                r.Entrada != null &&
                r.Saida == null
            )
            .Select(r => new
            {
                r.User.Nome,
                r.User.Email,
                r.Entrada
            })
            .ToListAsync(cancellationToken))
            .Select(r => new
            {
                nome = r.Nome,
                email = r.Email,
                entrada = ParaHorarioRio(r.Entrada!.Value).ToString("HH:mm"),
                tempoEmExpediente = FormatarDuracao(agoraUtc - r.Entrada.Value),
                minutosEmExpediente = Math.Max(0, (int)Math.Floor((agoraUtc - r.Entrada.Value).TotalMinutes)),
                status = (agoraUtc - r.Entrada.Value).TotalHours >= 8
                    ? "Atenção"
                    : "Em expediente"
            })
            .OrderByDescending(r => r.minutosEmExpediente)
            .ToList();

        return Ok(new
        {
            data = hoje.ToString("dd/MM/yyyy"),
            atualizadoEm = agoraLocal.ToString("HH:mm"),
            bolsistasAtivos = bolsistasAtivos.Count,
            presentesHoje,
            trabalhandoAgora,
            pendenciasSaida,
            semPontoHoje,
            equipeEmExpediente
        });
    }

    [Authorize(Roles = "Supervisor")]
    [HttpPut("desativar/{id}")]
    public async Task<IActionResult> DesativarUsuario(int id, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == id, cancellationToken);

        if (user == null)
        {
            return NotFound();
        }

        user.Aprovado = false;

        await _context.SaveChangesAsync(cancellationToken);

        return Ok();
    }

    [Authorize(Roles = "Supervisor")]
    [HttpPut("registros/{id}/ajustar")]
    public async Task<IActionResult> AjustarRegistro(int id, AjustarRegistroPontoDto dto, CancellationToken cancellationToken = default)
    {
        var registro = await _context.RegistrosPonto
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        if (registro == null)
        {
            return NotFound("Registro não encontrado");
        }

        if (dto.Entrada == null && dto.Saida == null && dto.Data == null)
        {
            return BadRequest("Informe ao menos um campo para ajuste");
        }

        if (dto.Data.HasValue)
        {
            registro.Data = NormalizarUtc(dto.Data.Value).Date;
        }

        if (dto.Entrada.HasValue)
        {
            registro.Entrada = NormalizarUtc(dto.Entrada.Value);
        }

        if (dto.Saida.HasValue)
        {
            registro.Saida = NormalizarUtc(dto.Saida.Value);
        }

        if (
            registro.Entrada.HasValue &&
            registro.Saida.HasValue &&
            registro.Saida.Value < registro.Entrada.Value
        )
        {
            return BadRequest("A saída não pode ser anterior à entrada");
        }

        await _context.SaveChangesAsync(cancellationToken);

        return Ok(new
        {
            mensagem = "Registro ajustado com sucesso"
        });
    }

    [Authorize(Roles = "Supervisor")]
    [HttpDelete("excluir/{id}")]
    public async Task<IActionResult> ExcluirUsuario(int id, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == id, cancellationToken);

        if (user == null)
        {
            return NotFound();
        }

        var registros = await _context.RegistrosPonto
            .Where(r => r.UserId == id)
            .ToListAsync(cancellationToken);

        _context.RegistrosPonto.RemoveRange(registros);

        _context.Users.Remove(user);

        await _context.SaveChangesAsync(cancellationToken);

        return Ok(new
        {
            mensagem = "Usuário excluído"
        });
    }

    [Authorize(Roles = "Supervisor")]
    [HttpGet("relatorio-mensal/{userId}")]
    public async Task<IActionResult> RelatorioMensal(
        int userId,
        int mes,
        int ano,
        CancellationToken cancellationToken = default
    )
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user == null)
        {
            return NotFound("Usuário não encontrado");
        }

        var registros = await _context.RegistrosPonto
            .Where(r =>
                r.UserId == userId &&
                r.Data.Month == mes &&
                r.Data.Year == ano
            )
            .OrderBy(r => r.Data)
            .ToListAsync(cancellationToken);

        var relatorio = registros.Select(r =>
        {
            TimeSpan? tempo = null;

            if (r.Entrada != null && r.Saida != null)
            {
                tempo = r.Saida.Value - r.Entrada.Value;
            }

            return new
            {
                data = r.Data.ToString("dd/MM/yyyy"),

                entrada = r.Entrada != null
                    ? ParaHorarioRio(r.Entrada.Value).ToString("HH:mm")
                    : null,

                saida = r.Saida != null
                    ? ParaHorarioRio(r.Saida.Value).ToString("HH:mm")
                    : null,

                horasTrabalhadas = tempo != null
                    ? FormatarDuracao(tempo.Value)
                    : "00:00",

                minutosTotais = tempo != null
                    ? tempo.Value.TotalMinutes
                    : 0
            };
        }).ToList();

        var totalMinutos = relatorio.Sum(r => r.minutosTotais);

        var horas = (int)totalMinutos / 60;

        var minutos = (int)totalMinutos % 60;

        var totalHorasFormatado = $"{horas:D2}:{minutos:D2}";

        return Ok(new
        {
            nome = user.Nome,

            email = user.Email,

            mes,

            ano,

            totalHoras = totalHorasFormatado,

            registros = relatorio
        });
    }
}
