# REPOSITÓRIO SUBG-SMS

## Segurança de autenticação

O JWT valida emissor, audiência, tempo de expiração e chave de assinatura.
Configure a audiência com:

```powershell
dotnet user-secrets set "Jwt:Audience" "SistemaPonto"
```

Em produção, use a variável de ambiente equivalente:

```env
Jwt__Audience=SistemaPonto
```

## CORS

A API aceita somente origens explicitamente permitidas. Em desenvolvimento, se
nenhuma origem for configurada, a API permite apenas:

```txt
http://localhost:5173
http://127.0.0.1:5173
```

Em produção, configure as origens permitidas:

```env
Cors__AllowedOrigins=https://ponto.smsrio.gov.br
```

Para mais de uma origem, separe por vírgula ou ponto e vírgula.

## Rate limit no login

O endpoint `POST /auth/login` possui limite de 5 tentativas por minuto por IP.
Ao exceder o limite, a API responde com HTTP 429.

