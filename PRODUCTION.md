# Producao e Persistencia

## O que foi endurecido

- MySQL continua a ser a fonte oficial dos dados.
- Redis foi adicionado como cache opcional para acelerar respostas e reduzir carga no backend.
- O estado agregado da plataforma agora usa cache com invalidação automática em requisições de escrita.
- Seed demo e contas admin padrão passaram a ser controlados por ambiente.
- Docker Compose agora sobe MySQL com volume persistente e Redis com append only.
- Foi adicionado endpoint de saúde em `/api/health`.
- Foram adicionados scripts de backup e restore do banco.

## Variaveis importantes

- `APP_ENV=production`
- `APP_ENABLE_DEFAULT_ADMINS=false`
- `APP_ENABLE_DEMO_SEED=false`
- `STATE_CACHE_TTL=15`
- `MYSQLHOST`
- `MYSQLPORT`
- `MYSQLDATABASE`
- `MYSQLUSER`
- `MYSQLPASSWORD`
- `REDIS_URL` ou `REDIS_HOST`/`REDIS_PORT`/`REDIS_DB`

## Regras para nao perder dados

1. Nunca use XAMPP local como base oficial de producao.
2. Em producao, use MySQL gerenciado ou um servidor MySQL com disco persistente e backups automáticos.
3. Nao publique com `APP_ENABLE_DEMO_SEED=true`.
4. Nao publique com `APP_ENABLE_DEFAULT_ADMINS=true` a menos que seja uma inicializacao controlada.
5. Configure backup automatico diario do MySQL e teste restore regularmente.
6. Monitore `/api/health` depois de cada deploy.

## Comandos uteis

Subir ambiente local:

```bash
docker compose up --build -d
```

Subir perfil de producao com ficheiro de ambiente:

```bash
cp .env.production.example .env.production
docker compose --env-file .env.production -f docker-compose.prod.yml up --build -d
```

Ver saúde da API:

```bash
curl http://localhost:8000/api/health
```

Criar backup:

```bash
chmod +x scripts/backup-db.sh
./scripts/backup-db.sh
```

Restaurar backup:

```bash
chmod +x scripts/restore-db.sh
./scripts/restore-db.sh backups/db/SEU_BACKUP.sql
```

## Diagnostico do problema atual

O repositório tinha persistencia local aceitável apenas para desenvolvimento com Docker volume, mas a configuracao de deploy nao mostrava um banco persistente acoplado ao ambiente de producao. Alem disso, o backend fazia bootstrap com seed orientado a demo. Isso nao apaga os dados semanalmente por si só, mas combinado com hospedagem efemera ou banco sem disco/backup cria exatamente o sintoma de perda de dados apos reinicios, rebuilds ou troca de ambiente.

## Alerta sobre o XAMPP

Foi encontrado um segundo backend em `C:\xampp\htdocs\darcan-api` com comportamento diferente do backend deste repositório. O resumo desta auditoria esta em [XAMPP_AUDIT.md](C:/Users/Gildassia/Desktop/rucrutamento_darcan-main/XAMPP_AUDIT.md:1). Antes de publicar, define uma unica API oficial para evitar divergencia de dados e comportamento.
