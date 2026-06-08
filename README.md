# Repositorio SUBG-SMS

## Migrations do banco

As migrations do EF Core devem ser aplicadas manualmente, antes de subir a API
ou durante uma janela controlada de manutencao. A aplicacao nao executa
`Database.Migrate()` automaticamente no boot.

Para aplicar migrations em desenvolvimento:

```powershell
dotnet ef database update --project backend --startup-project backend
```

Em producao, a variavel de ambiente `ConnectionStrings__DefaultConnection` deve
estar definida antes de rodar o comando acima.

## Configuracao sensivel

Credenciais de banco e chaves JWT nao devem ficar versionadas.
Use `backend/appsettings.example.json` como referencia dos nomes de configuracao.
Em desenvolvimento, use User Secrets do .NET. Em producao, use variaveis de
ambiente do servidor.

### Variaveis esperadas

```env
ConnectionStrings__DefaultConnection=Host=...;Port=5432;Database=sistema_ponto;Username=postgres;Password=SUA_SENHA
Jwt__Key=CHAVE_COM_NO_MINIMO_32_CARACTERES
Jwt__Issuer=SistemaPonto
Jwt__Audience=SistemaPontoApp
Cors__AllowedOrigins__0=https://ponto.smsrio.gov.br
```

### Desenvolvimento local com User Secrets

```powershell
cd backend
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=sistema_ponto;Username=postgres;Password=sua_senha_local"
dotnet user-secrets set "Jwt:Key" "gere_uma_chave_forte_com_32_caracteres_ou_mais"
dotnet user-secrets set "Jwt:Issuer" "SistemaPonto"
dotnet user-secrets set "Jwt:Audience" "SistemaPontoApp"
dotnet user-secrets set "Cors:AllowedOrigins:0" "http://localhost:5173"
```

## Rodando localmente

```powershell
# Backend
cd backend
dotnet run

# Frontend (em outro terminal)
cd frontend
npm install
npm run dev
```
