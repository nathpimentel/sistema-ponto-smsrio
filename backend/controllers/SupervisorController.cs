using backend.services;
using backend.data;
using backend.dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

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

    private static string FormatarDuracao(TimeSpan duracao)
    {
        var totalMinutos = Math.Max(0, (int)Math.Floor(duracao.TotalMinutes));
        return $"{totalMinutos / 60:D2}:{totalMinutos % 60:D2}";
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

    private int? ObterSupervisorId()
    {
        var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (int.TryParse(idClaim, out var userId))
        {
            return userId;
        }

        return null;
    }

    [Authorize(Roles = "Supervisor")]
[HttpGet("usuarios")]
public IActionResult Usuarios()
{
    var usuarios = _context.Users
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
        .ToList();

    return Ok(usuarios);
}


    [Authorize(Roles = "Supervisor")]
    [HttpGet("registros")]
public IActionResult BuscarTodosRegistros(
    int? mes,
    int? ano,
    string? busca
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

        var registros = query
            .OrderBy(r => r.User.Nome)
            .ThenBy(r => r.Data)
            .ToList()
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
                        : null,

                ajustadoEm = r.AjustadoEmUtc != null
                    ? ParaHorarioRio(r.AjustadoEmUtc.Value).ToString("dd/MM/yyyy HH:mm")
                    : null,

                ajustadoPorUsuarioId = r.AjustadoPorUsuarioId,

                justificativaAjuste = r.JustificativaAjuste
            })
            .ToList();

        return Ok(registros);
    }

[Authorize(Roles = "Supervisor")]
[HttpPut("aprovar/{id}")]
public IActionResult AprovarUsuario(int id)
{
    var user = _context.Users
        .FirstOrDefault(u => u.Id == id);

    if (user == null)
    {
        return NotFound();
    }

    user.Aprovado = true;

    _context.SaveChanges();

    return Ok();
}

[Authorize(Roles = "Supervisor")]
[HttpGet("pendentes")]
public IActionResult UsuariosPendentes()
{
    var usuarios = _context.Users
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
        .ToList();

    return Ok(usuarios);
}

[Authorize(Roles = "Supervisor")]
[HttpGet("relatorio-pdf")]
public IActionResult GerarRelatorioPdf(
    string? busca = "",
    int mes = 0,
    int ano = 0
)
{
    if (mes < 1 || mes > 12 || ano < 1)
    {
        return BadRequest("Informe mês e ano válidos");
    }

    List<dynamic> dadosRelatorio;

    string nomeRelatorio;

    if (!string.IsNullOrWhiteSpace(busca))
    {
        // RELATÓRIO INDIVIDUAL

      var termoBusca = busca.Trim().ToLower();

      var candidatos = _context.Users
    .Where(u =>
        u.TipoUsuario == "Bolsista" &&
        (
            u.Email.ToLower() == termoBusca ||
            u.Nome.ToLower().Contains(termoBusca)
        )
    )
    .Select(u => new
    {
        u.Id,
        u.Nome,
        u.Email
    })
    .ToList();

        if (!candidatos.Any())
        {
            return NotFound("Nenhum bolsista encontrado com esse nome ou e-mail");
        }

        if (candidatos.Count > 1)
        {
            return BadRequest(new
            {
                mensagem = "Mais de um bolsista encontrado. Selecione pelo email.",
                candidatos
            });
        }

        var user = candidatos[0];

        nomeRelatorio = user.Nome;

        var registros = _context.RegistrosPonto
            .Where(r =>
                r.UserId == user.Id &&
                r.Data.Month == mes &&
                r.Data.Year == ano
            )
            .OrderBy(r => r.Data)
            .ToList();

        dadosRelatorio = registros.Select(r =>
        {
            var tempo = r.Saida != null
                ? r.Saida.Value - r.Entrada!.Value
                : TimeSpan.Zero;

            return new
            {
                nome = user.Nome,

                data = r.Data.ToString("dd/MM/yyyy"),

                entrada = r.Entrada != null
                    ? ParaHorarioRio(r.Entrada.Value).ToString("HH:mm")
                    : "",

                saida = r.Saida != null
                    ? ParaHorarioRio(r.Saida.Value).ToString("HH:mm")
                    : "",

                horasTrabalhadas =
                    FormatarDuracao(tempo),

                minutosTotais = tempo.TotalMinutes
            };
        }).ToList<dynamic>();

        var totalMinutos =
            dadosRelatorio.Sum(r => (double)r.minutosTotais);

        var horas = (int)totalMinutos / 60;

        var minutos = (int)totalMinutos % 60;

        var totalHorasMes =
            $"{horas:D2}:{minutos:D2}";

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

  var registros = _context.RegistrosPonto
    .Where(r =>
        r.Data.Month == mes &&
        r.Data.Year == ano &&
        r.User != null &&
        r.User.TipoUsuario == "Bolsista"
    )
    .OrderBy(r => r.UserId)
    .ThenBy(r => r.Data)
    .ToList();
        dadosRelatorio = registros.Select(r =>
        {
            var tempo = r.Saida != null
                ? r.Saida.Value - r.Entrada!.Value
                : TimeSpan.Zero;

            return new
            {
                nome = r.User.Nome,

                data = r.Data.ToString("dd/MM/yyyy"),

                entrada = r.Entrada != null
                    ? ParaHorarioRio(r.Entrada.Value).ToString("HH:mm")
                    : "",

                saida = r.Saida != null
                    ? ParaHorarioRio(r.Saida.Value).ToString("HH:mm")
                    : "",

                horasTrabalhadas =
                    FormatarDuracao(tempo),

                minutosTotais = tempo.TotalMinutes
            };
        }).ToList<dynamic>();


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
        public IActionResult ListarBolsistas()
        {
            var bolsistas = _context.Users
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
                .ToList();

            return Ok(bolsistas);
        }

        [Authorize(Roles = "Supervisor")]
        [HttpGet("ativos")]
        public IActionResult UsuariosAtivos()
        {
            var ativos = _context.RegistrosPonto
                .Where(r =>
                    r.Data.Date == HojeUtc &&
                    r.Entrada != null &&
                    r.Saida == null
                )
                .ToList()
                .Select(r => new
                {
                    nome = r.User.Nome,

                    email = r.User.Email,

                    entrada = ParaHorarioRio(r.Entrada!.Value).ToString("HH:mm"),

                    data = r.Data.ToString("dd/MM/yyyy")
                })
                .ToList();

            if (!ativos.Any())
            {
                return Ok(new
                {
                    mensagem = "Nenhum bolsista em trabalho no momento"
                });
            }

            return Ok(ativos);


        }

        [Authorize(Roles = "Supervisor")]
        [HttpGet("resumo-dia")]
        public IActionResult ResumoDia()
        {
            var hoje = HojeUtc;
            var agoraUtc = DateTime.UtcNow;
            var agoraLocal = ParaHorarioRio(agoraUtc);

            var bolsistasAtivos = _context.Users
                .Where(u =>
                    u.TipoUsuario == "Bolsista" &&
                    u.Aprovado
                )
                .ToList();

            var registrosHoje = _context.RegistrosPonto
                .Where(r => r.Data.Date == hoje)
                .ToList();

            var presentesHoje = registrosHoje
                .Where(r => r.Entrada != null)
                .Select(r => r.UserId)
                .Distinct()
                .Count();

            var trabalhandoAgora = registrosHoje
                .Count(r => r.Entrada != null && r.Saida == null);

            var pendenciasSaida = _context.RegistrosPonto
                .Count(r =>
                    r.Data.Date < hoje &&
                    r.Entrada != null &&
                    r.Saida == null
                );

            var usuariosComPontoHoje = registrosHoje
                .Where(r => r.Entrada != null)
                .Select(r => r.UserId)
                .Distinct()
                .ToHashSet();

            var semPontoHoje = bolsistasAtivos
                .Count(u => !usuariosComPontoHoje.Contains(u.Id));

            var equipeEmExpediente = _context.RegistrosPonto
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
                .ToList()
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
public IActionResult DesativarUsuario(int id)
{
    var user = _context.Users
        .FirstOrDefault(u => u.Id == id);

    if (user == null)
    {
        return NotFound();
    }

    user.Aprovado = false;

    _context.SaveChanges();

    return Ok();
}

[Authorize(Roles = "Supervisor")]
[HttpPut("registros/{id}/ajustar")]
public IActionResult AjustarRegistro(int id, AjustarRegistroPontoDto dto)
{
    var registro = _context.RegistrosPonto
        .FirstOrDefault(r => r.Id == id);

    if (registro == null)
    {
        return NotFound("Registro não encontrado");
    }

    if (dto.Entrada == null && dto.Saida == null && dto.Data == null)
    {
        return BadRequest("Informe ao menos um campo para ajuste");
    }

    var justificativa = (dto.Justificativa ?? "").Trim();

    if (string.IsNullOrWhiteSpace(justificativa))
    {
        return BadRequest("Informe a justificativa do ajuste");
    }

    var supervisorId = ObterSupervisorId();

    if (supervisorId == null)
    {
        return Unauthorized();
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

    registro.AjustadoEmUtc = DateTime.UtcNow;
    registro.AjustadoPorUsuarioId = supervisorId.Value;
    registro.JustificativaAjuste = justificativa;

    _context.SaveChanges();

    return Ok(new
    {
        mensagem = "Registro ajustado com sucesso",
        ajustadoEm = ParaHorarioRio(registro.AjustadoEmUtc.Value).ToString("dd/MM/yyyy HH:mm")
    });
}

[Authorize(Roles = "Supervisor")]
[HttpDelete("excluir/{id}")]
public IActionResult ExcluirUsuario(int id)
{
    var user = _context.Users
        .FirstOrDefault(u => u.Id == id);

    if (user == null)
    {
        return NotFound();
    }

    var registros = _context.RegistrosPonto
        .Where(r => r.UserId == id)
        .ToList();

    _context.RegistrosPonto.RemoveRange(registros);

    _context.Users.Remove(user);

    _context.SaveChanges();

    return Ok(new
    {
        mensagem = "Usuário excluído"
    });
}

        [Authorize(Roles = "Supervisor")]
        [HttpGet("relatorio-mensal/{userId}")]
        public IActionResult RelatorioMensal(
        int userId,
        int mes,
        int ano
    )
        {
            var user = _context.Users.FirstOrDefault(u => u.Id == userId);

            if (user == null)
            {
                return NotFound("Usuário não encontrado");
            }

            var registros = _context.RegistrosPonto
                .Where(r =>
                    r.UserId == userId &&
                    r.Data.Month == mes &&
                    r.Data.Year == ano
                )
                .OrderBy(r => r.Data)
                .ToList();

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
