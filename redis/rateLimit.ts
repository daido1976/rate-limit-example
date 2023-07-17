import { createClient } from "npm:redis";
import { format } from "https://deno.land/std@0.194.0/datetime/format.ts";

const client = createClient({
  url: "redis://localhost:6380",
});

await client.connect();

async function isRateLimited(userId: string): Promise<boolean> {
  const date = format(new Date(), "yyyy-MM-dd");
  const key = `rate_limit:${userId}:${date}`;

  const m = client.multi();
  m.incr(key);
  m.expire(key, 24 * 60 * 60); // TTL: 24時間
  const responses = await m.exec();
  const currentCount = responses[0];

  return currentCount > 5;
}

async function handleRequest(userId: string): Promise<string> {
  if (await isRateLimited(userId)) {
    return "Rate limit exceeded. Try again tomorrow.";
  } else {
    // process the request normally
    return "Request processed.";
  }
}

await handleRequest("user1")
  .then(console.log)
  .finally(() => client.quit());
