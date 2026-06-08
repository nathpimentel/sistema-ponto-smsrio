namespace backend.Entities;

public class RegistroPonto
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public User User { get; set; } = null!;

    public DateTime Data { get; set; }

    public DateTime? Entrada { get; set; }

    public DateTime? Saida { get; set; }

    public double? HorasTrabalhadas { get; set; }
}