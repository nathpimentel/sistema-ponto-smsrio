using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;


namespace backend.services;

public class PdfService
{
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
        .Text($"Carga Horária Total: {totalHorasMes}");
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

    table.Cell().Text((string)r.entrada);

    table.Cell().Text((string)r.saida);

    table.Cell().Text((string)r.horasTrabalhadas);
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