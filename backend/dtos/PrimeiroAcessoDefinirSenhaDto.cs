using System.ComponentModel.DataAnnotations;

namespace backend.dtos;

public class PrimeiroAcessoDefinirSenhaDto
{
    [Required(AllowEmptyStrings = false)]
    public string Token { get; set; } = string.Empty;

    [Required(AllowEmptyStrings = false)]
    [MinLength(8)]
    public string NovaSenha { get; set; } = string.Empty;
}
