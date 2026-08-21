import { createApp } from "./app";
import { getConfig } from "./config";

const config = getConfig();

export default {
  port: config.port,
  fetch: createApp().fetch,
};
