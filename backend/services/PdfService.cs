using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;


namespace backend.Services;

public class PdfService
{
    private static string FormatarHorasLegivel(string? valor)
    {
        if (string.IsNullOrWhiteSpace(valor))
        {
            return "";
        }

        var partes = valor.Split(":");

        if (partes.Length < 2)
        {
            return valor;
        }

        var horas = int.TryParse(partes[0], out var horasNumero)
            ? horasNumero
            : 0;
        var minutos = int.TryParse(partes[1], out var minutosNumero)
            ? minutosNumero
            : 0;

        return $"{horas}h e {minutos}m";
    }

    public byte[] GerarRelatorio(
    string nome,
    int mes,
    int ano,
    List<dynamic> registros,
    string totalHorasMes,
    bool relatorioGeral
)
    {
        QuestPDF.Settings.License = QuestPDF.Infrastructure.LicenseType.Community;

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Margin(30);

                    page.Header().Column(column =>
{
    column.Item()
        .Text("Relatório de Ponto")
        .FontSize(20)
        .Bold();

    column.Item()
        .Text($"Bolsista: {nome}");

    column.Item()
        .Text($"Mês/Ano: {mes:D2}/{ano}");

    column.Item()
        .Text($"Carga Horária Total: {FormatarHorasLegivel(totalHorasMes)}");
});

page.Content().Table(table =>
{
    table.ColumnsDefinition(columns =>
{
    if (relatorioGeral)
    {
        columns.RelativeColumn();
    }

    columns.RelativeColumn();
    columns.RelativeColumn();
    columns.RelativeColumn();
    columns.RelativeColumn();
});

    table.Header(header =>
{
    if (relatorioGeral)
    {
        header.Cell().Text("Nome");
    }

    header.Cell().Text("Data");
    header.Cell().Text("Entrada");
    header.Cell().Text("Saída");
    header.Cell().Text("Horas");
});

foreach (dynamic r in registros)
{
    if (relatorioGeral)
    {
        table.Cell().Text((string)r.nome);
    }

    table.Cell().Text((string)r.data);

    table.Cell().Text(FormatarHorasLegivel((string)r.entrada));

    table.Cell().Text(FormatarHorasLegivel((string)r.saida));

    table.Cell().Text(FormatarHorasLegivel((string)r.horasTrabalhadas));
}
});

                page.Footer()
                    .AlignCenter()
                    .Text("Assinatura Supervisor:");
            });
        });

        return document.GeneratePdf();
    }
}
