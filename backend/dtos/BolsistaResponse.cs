namespace backend.dtos;
public record BolsistaResponse(
    int Id, string Nome, string Email,
    string? Curso, string? Unidade, int? CargaHorariaSemanal
);
