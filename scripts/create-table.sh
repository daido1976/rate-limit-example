aws dynamodb create-table --cli-input-json file://scripts/rate-limit-table.json --profile local --endpoint-url http://localhost:8000
aws dynamodb update-time-to-live --cli-input-json file://scripts/rate-limit-ttl.json --profile local --endpoint-url http://localhost:8000
