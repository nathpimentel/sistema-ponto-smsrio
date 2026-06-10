using System.Net;
using System.Text.Json;

namespace backend.middleware;

public class ExceptionHandlerMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlerMiddleware> _logger;

    public ExceptionHandlerMiddleware(
        RequestDelegate next,
        ILogger<ExceptionHandlerMiddleware> logger
    )
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Erro nao tratado em {Method} {Path}",
                context.Request.Method,
                context.Request.Path
            );

            await EscreverRespostaErro(context);
        }
    }

    private static async Task EscreverRespostaErro(HttpContext context)
    {
        context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
        context.Response.ContentType = "application/json";

        var resposta = new
        {
            mensagem = "Erro interno no servidor. Tente novamente mais tarde."
        };

        var json = JsonSerializer.Serialize(resposta);

        await context.Response.WriteAsync(json);
    }
}
