import { config } from "./config/config";
import { connectDB } from "./config/db";
import { createApp } from "./app";

async function main(): Promise<void> {
  await connectDB();

  const app = createApp();
  app.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`[server] listening on port ${config.port} (${config.nodeEnv})`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[server] failed to start:", err);
  process.exit(1);
});
