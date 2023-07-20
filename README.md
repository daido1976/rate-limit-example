# rate-limit-example

```sh
$ docker-compose up -d

# redis-cli
$ docker-compose exec redis redis-cli

# dynamodb
# local 用の configure を作成する（credential はダミーで OK）
$ aws configure set aws_access_key_id dummy --profile local && aws configure set aws_secret_access_key dummy --profile local && aws configure set region us-west-2 --profile local && aws configure set output json --profile local
# aws cli で確認する
$ aws dynamodb list-tables --profile local --endpoint-url http://localhost:8000
# rate limit 用のテーブルを作成する
$ ./dynamodb/scripts/create-table.sh

# スクリプトを並行実行する
$ for i in {1..20}; do deno run -A redis/with-race-condition.ts & done
```
