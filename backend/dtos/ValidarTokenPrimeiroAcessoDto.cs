using System.ComponentModel.DataAnnotations;

namespace backend.dtos;

public class ValidarTokenPrimeiroAcessoDto
{
    [Required(AllowEmptyStrings = false)]
    public string Token { get; set; } = string.Empty;
}
