namespace backend.entities;

using System.Text.Json.Serialization;

public class User
{
    public int Id { get; set; }

    public string Nome { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    [JsonIgnore]
    public string SenhaHash { get; set; } = string.Empty;

    [JsonIgnore]
    public string? PrimeiroAcessoTokenHash { get; set; }

    public DateTime? PrimeiroAcessoTokenExpiraEm { get; set; }

    public bool SenhaDefinida { get; set; } = true;

    public string TipoUsuario { get; set; } = string.Empty;

    public string Unidade { get; set; } = "";

    public string CursoFaculdade { get; set; } = "";

    public int? CargaHorariaSemanal { get; set; }
    
    // Aprovado: one-way, setado na primeira aprovacao pelo supervisor
    public bool Aprovado { get; set; } = false;

    // Ativo: toggle — false bloqueia login mesmo com Aprovado=true
    public bool Ativo { get; set; } = true;

    public string? FotoBase64 { get; set; }
}
