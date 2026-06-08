using System.ComponentModel.DataAnnotations;

namespace backend.dtos;

public class AtualizarPerfilDto
{
    [Required(AllowEmptyStrings = false)]
    [MaxLength(200)]
    public string Nome { get; set; } = string.Empty;

    [Required(AllowEmptyStrings = false)]
    [EmailAddress]
    [MaxLength(320)]
    public string Email { get; set; } = string.Empty;
}
