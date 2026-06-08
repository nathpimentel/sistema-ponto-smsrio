using System.ComponentModel.DataAnnotations;

namespace backend.dtos;

public class LoginDto
{
    [Required(AllowEmptyStrings = false)]
    [EmailAddress]
    [MaxLength(320)]
    public string Email { get; set; } = string.Empty;

    [Required(AllowEmptyStrings = false)]
    public string Senha { get; set; } = string.Empty;
}
