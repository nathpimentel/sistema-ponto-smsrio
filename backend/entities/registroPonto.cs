/*
UserId
Relaciona registro ao usuário.

Entrada
Horário entrada.

Saida
Horário saída.

HorasTrabalhadas
Total horas do dia.
*/


namespace backend.entities;

public class RegistroPonto
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public User User { get; set; } = null!;

    public DateTime? Entrada { get; set; }

    public DateTime? Saida { get; set; }

    public DateTime CriadoEm { get; set; }

    public DateTime AtualizadoEm { get; set; }
}