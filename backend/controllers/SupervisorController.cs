using backend.services;
using backend.data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

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

    private static DateTime HojeLocal =>
        DateTime.SpecifyKind(DateTime.Now.Date, DateTimeKind.Utc);

    private static string FormatarDuracao(TimeSpan duracao)
    {
        var totalMinutos = Math.Max(0, (int)Math.Floor(duracao.TotalMinutes));
        return $"{totalMinutos / 60:D2}:{totalMinutos % 60:D2}";
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
            u.Aprovado
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
            .Select(r => new
            {
                nome = r.User.Nome,

                email = r.User.Email,

                curso = r.User.CursoFaculdade,

                unidade = r.User.Unidade,

                cargaHorariaSemanal = r.User.CargaHorariaSemanal,

                data = r.Data.ToString("dd/MM/yyyy"),

                entrada = r.Entrada != null
                    ? r.Entrada.Value.ToLocalTime().ToString("HH:mm")
                    : null,

                saida = r.Saida != null
                    ? r.Saida.Value.ToLocalTime().ToString("HH:mm")
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

      var user = _context.Users
    .FirstOrDefault(u =>
        u.TipoUsuario == "Bolsista" &&
        (
            u.Email.ToLower() == termoBusca ||
            u.Nome.ToLower().Contains(termoBusca)
        )
    );

        if (user == null)
        {
            return NotFound("Nenhum bolsista encontrado com esse nome ou e-mail");
        }

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
                    ? r.Entrada.Value.ToLocalTime().ToString("HH:mm")
                    : "",

                saida = r.Saida != null
                    ? r.Saida.Value.ToLocalTime().ToString("HH:mm")
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
                    ? r.Entrada.Value.ToLocalTime().ToString("HH:mm")
                    : "",

                saida = r.Saida != null
                    ? r.Saida.Value.ToLocalTime().ToString("HH:mm")
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
                    r.Data.Date == HojeLocal &&
                    r.Entrada != null &&
                    r.Saida == null
                )
                .Select(r => new
                {
                    nome = r.User.Nome,

                    email = r.User.Email,

                    entrada = r.Entrada!.Value
                        .ToLocalTime()
                        .ToString("HH:mm"),

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
                        ? r.Entrada.Value.ToLocalTime().ToString("HH:mm")
                        : null,

                    saida = r.Saida != null
                        ? r.Saida.Value.ToLocalTime().ToString("HH:mm")
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
