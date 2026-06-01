# Repositório SUBG-SMS

## Configuração sensível

Credenciais de banco e chaves de assinatura JWT não devem ficar versionadas.
O `backend/appsettings.json` é local, ignorado pelo Git, e não deve ser usado
para compartilhar senha, token ou chave real.

Use o arquivo `.env.example` e o `backend/appsettings.example.json` apenas como
referência dos nomes de configuração. Em desenvolvimento local, prefira User
Secrets do .NET. Em produção, use variáveis de ambiente do servidor/container.

### Variáveis esperadas

```env
ConnectionStrings__DefaultConnection=Host=localhost;Port=5432;Database=sistema_ponto;Username=postgres;Password=troque_esta_senha
Jwt__Key=gere_uma_chave_forte_com_32_caracteres_ou_mais
Jwt__Issuer=SistemaPonto
```

### Desenvolvimento local com User Secrets

O projeto já possui `UserSecretsId`, então os comandos abaixo funcionam sem
versionar secrets no repositório.

```powershell
cd backend
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=sistema_ponto;Username=postgres;Password=sua_senha_local"
dotnet user-secrets set "Jwt:Key" "gere_uma_chave_forte_com_32_caracteres_ou_mais"
dotnet user-secrets set "Jwt:Issuer" "SistemaPonto"
```

### Produção

Configure as mesmas chaves por variáveis de ambiente:

```env
ConnectionStrings__DefaultConnection=...
Jwt__Key=...
Jwt__Issuer=...
```

Se alguma configuração obrigatória estiver ausente, a API falha no boot com uma
mensagem explícita indicando qual variável precisa ser configurada.

### Rotação obrigatória

Remover secrets do repositório não invalida credenciais que já foram expostas no
histórico do Git. As senhas e chaves JWT que já foram versionadas devem ser
rotacionadas fora do código.

Se for necessário limpar o histórico público do Git, faça isso em uma operação
separada e coordenada com o time, usando uma ferramenta como `git filter-repo`
e `git push --force-with-lease`.
