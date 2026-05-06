# Auditoria XAMPP

## O que foi encontrado

- O Apache do XAMPP inclui uma configuracao extra em [C:\xampp\apache\conf\extra\darcan-api.conf](C:/xampp/apache/conf/extra/darcan-api.conf:1).
- Essa configuracao publica uma API separada em `C:\xampp\htdocs\darcan-api`.
- Essa API local nao e igual ao backend do repositório atual.
- A API do XAMPP possui sessoes por token, cache Redis opcional e upload fisico para `storage/uploads`.
- Em `C:\xampp\mysql\data` so aparecem as bases padrao do MySQL:
  - `mysql`
  - `performance_schema`
  - `phpmyadmin`
  - `test`

## Conclusao tecnica

Hoje o teu ambiente mostra dois backends distintos:

1. Backend do repositório em `backend/`
2. Backend do XAMPP em `C:\xampp\htdocs\darcan-api\index.php`

Isto e um risco alto porque:

- o frontend pode apontar para uma API diferente da que estas a editar
- as regras de persistencia e autenticacao nao sao as mesmas
- o comportamento em producao pode divergir do que testas localmente

## Recomendacao

Escolhe uma unica API oficial para producao e aposenta a outra.

Se vais publicar o repositório atual:

- nao uses o `darcan-api` do XAMPP como backend oficial
- mantem o XAMPP apenas para teste temporario
- usa Docker com MySQL persistente ou um MySQL gerenciado
- configura backups automaticos

Se vais manter a API do XAMPP:

- ela precisa de versionamento no mesmo repositório
- precisa de schema/migrations formais
- precisa de backup dos uploads em disco alem do banco
- precisa de revisao de seguranca e deploy reproduzivel

## Verificacao manual recomendada

1. Confirma qual URL o frontend publicado esta a chamar.
2. Confirma onde a base de dados real esta hospedada.
3. Confirma se os uploads estao em disco local, rede ou objeto remoto.
4. Confirma se existe backup automatico diario com restore testado.
