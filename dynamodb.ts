import rateLimitTable from "./scripts/rate-limit-table.json" assert { type: "json" };
import {
  DynamoDBClient,
  ListTablesCommand,
} from "npm:@aws-sdk/client-dynamodb";
import { fromIni } from "npm:@aws-sdk/credential-provider-ini";

// クライアントの設定を行います
const client = new DynamoDBClient({
  region: "us-west-2",
  credentials: fromIni({ profile: "local" }),
  endpoint: "http://localhost:8000",
});

const run = async () => {
  const command = new ListTablesCommand({});
  try {
    const results = await client.send(command);
    console.log("Table names are ", results.TableNames);
  } catch (err) {
    console.error(err);
  }
};

run();
