import { getConfig } from "../../apps/api/src/config";
import { createDatabase } from "../../apps/api/src/db/client";
import { seedDatabase } from "../../apps/api/src/db/seed";

if (import.meta.main) {
  const config = getConfig();
  const { client, db } = createDatabase(config);
  try {
    await seedDatabase(db);
    console.info("Seeded 4 patients, 6 lab tests, and 4 orders.");
  } finally {
    client.close();
  }
}
