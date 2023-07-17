import { createClient } from "npm:redis";

const client = createClient({
  url: "redis://localhost:6380",
});

await client.connect();

async function isRateLimited(userId: string): Promise<boolean> {
  const key = `rate_limit:${userId}`;
  const currentCount = await client.get(key);

  if (currentCount === null) {
    await client.set(key, 1, { EX: 24 * 60 * 60 }); // set key to expire after 24 hours
    return false;
  } else if (Number(currentCount) < 100) {
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
