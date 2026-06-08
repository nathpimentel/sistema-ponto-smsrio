namespace backend.entities;

using System.Text.Json.Serialization;

public class User
{
    public int Id { get; set; }

    public string Nome { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    [JsonIgnore]
    public string SenhaHash { get; set; } = string.Empty;

    public string TipoUsuario { get; set; } = string.Empty;

    public string Unidade { get; set; } = "";

    public string CursoFaculdade { get; set; } = "";

    public int? CargaHorariaSemanal { get; set; }

    public bool Aprovado { get; set; } = false;

    public string? FotoBase64 { get; set; }
}
