namespace backend.entities;

public class AuditLog
{
    public int Id { get; set; }

    public int SupervisorId { get; set; }

    public string SupervisorNome { get; set; } = "";

    public string Acao { get; set; } = "";

    public int? AlvoId { get; set; }

    public string? AlvoNome { get; set; }

    public string? Detalhes { get; set; }

    public DateTime DataHora { get; set; } = DateTime.UtcNow;
}
