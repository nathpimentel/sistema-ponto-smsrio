namespace backend.dtos;

public class RegisterDto
{
    public string Nome { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string Senha { get; set; } = string.Empty;

    public string TipoUsuario { get; set; } = string.Empty;

    public string Unidade { get; set; } = string.Empty;

    public string CursoFaculdade { get; set; } = string.Empty;

    public int? CargaHorariaSemanal { get; set; }
}
