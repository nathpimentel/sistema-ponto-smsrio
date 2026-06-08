using System.ComponentModel.DataAnnotations;

namespace backend.dtos;

public class AlterarSenhaDto
{
    [Required(AllowEmptyStrings = false)]
    public string SenhaAtual { get; set; } = string.Empty;

    [Required(AllowEmptyStrings = false)]
    [MinLength(8)]
    public string NovaSenha { get; set; } = string.Empty;
}
