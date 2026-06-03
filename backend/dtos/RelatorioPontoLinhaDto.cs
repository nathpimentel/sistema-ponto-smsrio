namespace backend.dtos;

public record RelatorioPontoLinhaDto(
    string Nome,
    string Data,
    string Entrada,
    string Saida,
    string HorasTrabalhadas,
    double MinutosTotais
);
