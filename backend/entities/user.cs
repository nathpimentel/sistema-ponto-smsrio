namespace backend.entities;

public class User
{
    public int Id { get; set; }

    public string Nome { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string SenhaHash { get; set; } = string.Empty;

    public string TipoUsuario { get; set; } = string.Empty;

    public string Unidade { get; set; } = "";
    
    public bool Aprovado { get; set; } = false;


}