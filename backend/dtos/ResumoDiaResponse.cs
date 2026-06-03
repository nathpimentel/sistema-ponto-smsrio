namespace backend.dtos;

public record MembroExpedienteResponse(
    string Nome, string Email, string Entrada,
    string TempoEmExpediente, int MinutosEmExpediente, string Status
);

public record ResumoDiaResponse(
    string Data, string AtualizadoEm, int BolsistasAtivos,
    int PresentesHoje, int TrabalhandoAgora, int PendenciasSaida,
    int SemPontoHoje, List<MembroExpedienteResponse> EquipeEmExpediente
);
