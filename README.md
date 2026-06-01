# Repositorio SUBG-SMS

## Migrations do banco

As migrations do EF Core devem ser aplicadas manualmente, antes de subir a API
ou durante uma janela controlada de manutencao. A aplicacao nao executa
`Database.Migrate()` automaticamente no boot.

Para aplicar migrations em desenvolvimento:

```powershell
dotnet ef database update --project backend --startup-project backend
```
