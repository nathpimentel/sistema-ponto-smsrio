using backend.data;
using Microsoft.EntityFrameworkCore;

namespace backend.services;

public class TokenLimpezaService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<TokenLimpezaService> _logger;
    private static readonly TimeSpan Intervalo = TimeSpan.FromHours(24);

    public TokenLimpezaService(
        IServiceProvider serviceProvider,
        ILogger<TokenLimpezaService> logger
    )
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("TokenLimpezaService iniciado");

        while (!stoppingToken.IsCancellationRequested)
        {
            await LimparTokensExpirados(stoppingToken);
            await Task.Delay(Intervalo, stoppingToken);
        }
    }

    private async Task LimparTokensExpirados(CancellationToken cancellationToken)
    {
        try
        {
            using var scope = _serviceProvider.CreateScope();

            var context = scope.ServiceProvider
                .GetRequiredService<ApplicationDbContext>();

            var agora = DateTime.UtcNow;

            var deletados = await context.RefreshTokens
                .Where(t => t.ExpiresAt < agora)
                .ExecuteDeleteAsync(cancellationToken);

            if (deletados > 0)
                _logger.LogInformation(
                    "{Count} refresh token(s) expirado(s) removido(s)",
                    deletados
                );
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "Erro ao limpar refresh tokens expirados");
        }
    }
}
