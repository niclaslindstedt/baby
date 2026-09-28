import { defineConfig } from "vitest/config";

import { appName } from "./app-name.ts";

export default defineConfig({
  // The build-time names `vite.config.ts` defines, for the modules that read
  // them: a test builds as the website does.
  define: { __APP_NAME__: JSON.stringify(appName({})) },
  test: {
    // Pure-logic tests over the domain modules (export, search, migrations);
    // no DOM needed. Test files follow the OSS_SPEC §20.2 `_test` suffix.
    environment: "node",
    include: ["tests/**/*_test.ts"],
  },
});
