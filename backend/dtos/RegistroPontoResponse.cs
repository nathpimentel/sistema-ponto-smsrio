namespace backend.dtos;
public record RegistroPontoResponse(
    int Id, string Nome, string Email, string? Curso,
    string? Unidade, int? CargaHorariaSemanal,
    string Data, string? Entrada, string? Saida, string? TempoTrabalhado
);
