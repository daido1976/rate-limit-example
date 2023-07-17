import { createClient } from "npm:redis";
import { delay } from "https://deno.land/std@0.194.0/async/mod.ts";

const client = createClient({
  url: "redis://localhost:6380",
});

await client.connect();

async function isRateLimited(userId: string): Promise<boolean> {
  const key = `rate_limit:${userId}`;
  const currentCount = await client.get(key);

  if (currentCount === null) {
    // ここで詰まると毎回set1で上書きされてしまう
    await delay(1000);
    await client.set(key, 1, { EX: 24 * 60 * 60 }); // set key to expire after 24 hours
    return false;
  } else if (Number(currentCount) < 5) {
    // ここで詰まるとincrはされるが、リクエストは通ってしまう
    await delay(1000);
    await client.incr(key);
    return false;
  } else {
    return true;
  }
}

// Function to handle a request
async function handleRequest(userId: string): Promise<string> {
  if (await isRateLimited(userId)) {
    return "Rate limit exceeded. Try again tomorrow.";
  } else {
    // process the request normally
    return "Request processed.";
  }
}

// Example usage
await handleRequest("user2")
  .then(console.log)
  .finally(() => client.quit());
