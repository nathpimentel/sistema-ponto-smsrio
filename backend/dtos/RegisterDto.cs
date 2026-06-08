using System.ComponentModel.DataAnnotations;

namespace backend.dtos;

public class RegisterDto
{
    [Required(AllowEmptyStrings = false)]
    [MaxLength(200)]
    public string Nome { get; set; } = string.Empty;

    [Required(AllowEmptyStrings = false)]
    [EmailAddress]
    [MaxLength(320)]
    public string Email { get; set; } = string.Empty;

    [Required(AllowEmptyStrings = false)]
    public string Senha { get; set; } = string.Empty;

    [Required(AllowEmptyStrings = false)]
    public string TipoUsuario { get; set; } = string.Empty;

    [MaxLength(200)]
    public string Unidade { get; set; } = string.Empty;

    [MaxLength(200)]
    public string CursoFaculdade { get; set; } = string.Empty;

    [Range(1, 44)]
    public int? CargaHorariaSemanal { get; set; }
}
