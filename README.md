# Repositório SUBG-SMS

## Configuração sensível

Credenciais de banco e chaves de assinatura JWT não devem ficar versionadas.
O `backend/appsettings.json` é local, ignorado pelo Git — use
`backend/appsettings.example.json` apenas como referência dos nomes de
configuração. Em desenvolvimento local, use User Secrets do .NET. Em produção,
use variáveis de ambiente do servidor ou container.

### Variáveis esperadas

```env
ConnectionStrings__DefaultConnection=Host=...;Port=5432;Database=sistema_ponto;Username=postgres;Password=SUA_SENHA
Jwt__Key=CHAVE_COM_NO_MINIMO_32_CARACTERES
Jwt__Issuer=SistemaPonto
Jwt__Audience=SistemaPontoApp
Cors__AllowedOrigins__0=https://ponto.smsrio.gov.br
```

### Desenvolvimento local com User Secrets

O projeto já possui `UserSecretsId` configurado no `.csproj`. Rode os comandos
abaixo uma vez — as credenciais ficam fora do repositório:

```powershell
cd backend
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=sistema_ponto;Username=postgres;Password=sua_senha_local"
dotnet user-secrets set "Jwt:Key" "gere_uma_chave_forte_com_32_caracteres_ou_mais"
dotnet user-secrets set "Jwt:Issuer" "SistemaPonto"
dotnet user-secrets set "Jwt:Audience" "SistemaPontoApp"
dotnet user-secrets set "Cors:AllowedOrigins:0" "http://localhost:5173"
```

### Produção

Configure as mesmas chaves por variáveis de ambiente do servidor ou container.
Se alguma configuração obrigatória estiver ausente, a API falha no boot com uma
mensagem indicando qual variável precisa ser definida.

### Rotação de credenciais vazadas

Remover um arquivo do repositório não apaga o que já foi commitado — qualquer
pessoa que clonou o repositório antes tem as credenciais antigas para sempre.
As credenciais que estavam versionadas **devem ser rotacionadas**:

1. Troque a senha do Postgres no banco e atualize a variável de ambiente
2. Gere uma nova `Jwt:Key` e atualize a variável de ambiente (invalida todas as sessões ativas)

### Limpeza do histórico Git (quando necessário)

Para remover os arquivos com credenciais do histórico completo do Git, use
`git filter-repo` (requer instalação separada):

```bash
# Instalar (uma vez)
pip install git-filter-repo

# Remover o arquivo do histórico inteiro
git filter-repo --path backend/appsettings.json --invert-paths

# Reescrever o repositório remoto (coordenar com o time antes)
git push origin --force-with-lease --all
git push origin --force-with-lease --tags
```

> **Atenção:** `--force-with-lease --all` reescreve o histórico de todas as
> branches. Avisar o time para fazer `git clone` novo após a operação.
