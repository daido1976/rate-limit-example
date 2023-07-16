import rateLimitTable from "./db/rate-limit-table.json" assert { type: "json" };
import {
  DynamoDBClient,
  UpdateItemCommand,
} from "npm:@aws-sdk/client-dynamodb";
import { fromIni } from "npm:@aws-sdk/credential-provider-ini";
import { format } from "https://deno.land/std@0.194.0/datetime/format.ts";

const client = new DynamoDBClient({
  region: "us-west-2",
  credentials: fromIni({ profile: "local" }),
  endpoint: "http://localhost:8000",
});

async function isRateLimited(userId: string) {
  const date = format(new Date(), "yyyy-MM-dd");
  const command = new UpdateItemCommand({
    TableName: rateLimitTable.TableName,
    Key: {
      userId: { S: userId },
      date: { S: date },
    },
    ExpressionAttributeNames: {
      "#count": "count",
      "#ttl": "expiredAt",
    },
    ExpressionAttributeValues: {
      ":inc": { N: "1" },
      ":ttl": { N: (Math.floor(Date.now() / 1000) + 24 * 60 * 60).toString() }, // TTLのタイムスタンプ（24時間後のUNIX時間）
    },
    UpdateExpression: "ADD #count :inc SET #ttl = :ttl",
    ReturnValues: "UPDATED_NEW",
  });

  const result = await client.send(command);

  return parseInt(result.Attributes?.count?.N || "0") > 15;
}

async function handleRequest(userId: string) {
  if (await isRateLimited(userId)) {
    return "Rate limit exceeded. Try again tomorrow.";
  } else {
    // process the request normally
    return "Request processed.";
  }
}

handleRequest("user1").then(console.log);
