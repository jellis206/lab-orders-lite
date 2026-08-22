import { createApp } from "./app";
import { getConfig } from "./config";
import { createDatabase } from "./db/client";

const config = getConfig();
const database = createDatabase(config);

export default {
  port: config.port,
  fetch: createApp(database.db).fetch,
};
