namespace backend.dtos;
public record UsuarioResponse(
    int Id, string Nome, string Email, string TipoUsuario,
    string Unidade, string CursoFaculdade, int? CargaHorariaSemanal,
    bool Aprovado, string? FotoBase64
);
