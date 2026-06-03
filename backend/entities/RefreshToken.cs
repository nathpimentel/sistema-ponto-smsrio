namespace backend.entities;

public class RefreshToken
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public User User { get; set; } = null!;

    // Hash SHA-256 do token bruto — nunca persiste o token em texto puro
    public string TokenHash { get; set; } = string.Empty;

    public DateTime ExpiresAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? RevokedAt { get; set; }

    public bool Revogado => RevokedAt.HasValue || DateTime.UtcNow > ExpiresAt;
}
