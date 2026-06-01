# REPOSITÓRIO SUBG-SMS

## Configuracao sensivel

As credenciais do banco e a chave JWT nao devem ficar versionadas no
`appsettings.json`. Configure esses valores por variaveis de ambiente ou por
User Secrets em desenvolvimento local.

Exemplo de variaveis disponiveis em `.env.example`:

```env
ConnectionStrings__DefaultConnection=Host=localhost;Port=5432;Database=sistema_ponto;Username=postgres;Password=troque_esta_senha
Jwt__Key=gere_uma_chave_forte_com_32_caracteres_ou_mais
Jwt__Issuer=SistemaPonto
```

Exemplo com User Secrets:

```powershell
cd backend
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=sistema_ponto;Username=postgres;Password=sua_senha_local"
dotnet user-secrets set "Jwt:Key" "gere_uma_chave_forte_com_32_caracteres_ou_mais"
dotnet user-secrets set "Jwt:Issuer" "SistemaPonto"
```

Credenciais que ja foram versionadas devem ser rotacionadas fora do codigo.

