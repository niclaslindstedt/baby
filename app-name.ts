// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The name the built app calls itself in its top bar — the wordmark.
//
// Only the PHONE build takes the store listing's name. It is the build
// `native/scripts/bundle-web.mjs` makes (`VITE_EMBEDDED_BUILD` without
// `VITE_SHELL_BUILD`), and that script hands it `APP_DISPLAY_NAME` — the same
// variable `native/identifiers.js` reads for the name under the icon — so the
// wordmark inside the app matches the tile outside it. The website and the
// desktop shell are the project's own deploys and keep the project name.
// Unset, every build falls back to the project name, so a plain checkout
// builds any target with nothing configured.
//
// Not `VITE_`-prefixed on purpose: `vite.config.ts` resolves it here and hands
// it to the app as the `__APP_NAME__` define, never through `import.meta.env`.

/** The project's own name. Not the listing name. */
export const PROJECT_NAME = "Baby";

export function appName(env: Record<string, string | undefined>): string {
  const phoneBuild =
    env.VITE_EMBEDDED_BUILD === "on" && env.VITE_SHELL_BUILD !== "on";
  return (phoneBuild && env.APP_DISPLAY_NAME?.trim()) || PROJECT_NAME;
}
