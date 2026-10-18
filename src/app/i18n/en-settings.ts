// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The Settings screen's English strings, in a module of their own so `en.ts`
// stays a size a reader can hold. `en.ts` carries them as `settings`, so every
// key here is part of `Catalog` and `sv-settings.ts` must carry it too.

export const enSettings = {
  title: "Settings",
  appearance: "Appearance",
  theme: "Theme",
  themeLight: "Light",
  themeDark: "Dark",
  themeSystem: "System",
  language: "Language",
  // The tracker switches. Copy has one job here: say that switching a
  // tracker off hides it and nothing more, because "off" next to a health
  // record reads like "deleted" unless it is spelled out.
  features: "What you track",
  featuresHint:
    "Switch off what you don't use and its tab and cards disappear. Nothing is deleted — switch it back on and everything you entered is still there.",
  feature: {
    diapers: "Diapers",
    sleep: "Sleep",
    growth: "Growth",
    food: "Food",
    vaccines: "Vaccines",
  },
  featureHint: {
    diapers:
      "The Diapers tab, the diaper buttons behind the + in the top bar, and the last 24 hours against the norm for the age.",
    sleep:
      "The Sleep tab, the sleep buttons behind the +, the averages against the recommendation for the age, and a suggested time for the next sleep.",
    growth:
      "Weight, length and head readings on the WHO curves, with the trend and the forecast.",
    food: "The daily food regimen and the milk, checked against the recommendation for the age and weight.",
    vaccines:
      "The Swedish childhood program, what is given and what comes next.",
  },
  child: "Your child",
  // Read back on the page rather than behind the button: what the app
  // derives every number from, in four lines.
  childBorn: "{date} · {age}",
  childHeights: "Mother {mother}, father {father}",
  childHeightsMissing: "Not entered — the expected adult height needs both.",
  childMissing:
    "No child yet. Add a birth date and a sex and every screen starts working.",
  addChild: "Add your child",
  editChild: "Edit",
  sync: "Where the record lives",
  syncHint:
    "Your record is kept on this device. Keep a second, encrypted copy in a folder you pick, or in your own cloud account, to read it on another device too.",
  // The phone app's only word on where the record is, at the top of Your
  // data, in place of the section above: its build keeps the record on the
  // device and offers nothing to connect.
  deviceOnly:
    "Your record is kept on this device, and the app sends it nowhere. To keep a copy of your own, export a backup below.",
  backend: "Backend",
  // The places the record can live. "This device" is the browser's own
  // storage: no account, no picker, nothing leaves the phone.
  backendName: {
    idb: "This device",
    folder: "Local folder",
    dropbox: "Dropbox",
    gdrive: "Dropbox",
  },
  backendHint: {
    idb: "Kept in this browser's own storage. Nothing leaves the device, and nothing here can be read from another one.",
    folder:
      "A folder on this computer, through the browser's file access. The record becomes a file you can open, copy and back up yourself.",
    dropbox:
      "A file in your own Dropbox, in the app's folder. Sign in on another device to read the same record.",
    gdrive:
      "A file in your own Dropbox, in the app's folder. Sign in on another device to read the same record.",
  },
  folderUnavailable:
    "A local folder isn't offered here: it needs the browser's directory picker, which desktop Chrome, Edge and Opera have and no phone browser does.",
  disconnect: "Disconnect",
  connected: "Connected to {name}",
  localOnly: "On this device only",
  folderReconnect: "Reconnect to the folder",
  folderReconnectNeeded:
    "The browser needs you to confirm access to the folder again.",
  saveNow: "Save now",
  reload: "Reload from the backend",
  data: "Your data",
  export: "Export a backup",
  exportHint: "Saves the whole record as a JSON file.",
  exportFailed: "The backup could not be saved. Try again.",
  import: "Restore from a backup",
  importHint:
    "Merges the file into what is already here — nothing on this device is dropped.",
  imported: "Backup restored",
  importFailed: "That file could not be read as a backup.",
  deleteAll: "Delete everything",
  deleteAllHint:
    "Removes the child and every reading, diaper change, sleep, food and vaccination from this device. This cannot be undone.",
  deleteAllConfirm: "Delete the whole record on this device?",
  deleted: "Everything deleted",
  developer: "Developer",
  devMode: "Developer mode",
  devModeHint:
    "Shows the demo document, the log capture switch, the app log, and the raw document size.",
  demoData: "Demo data",
  demoDataHint:
    "Swap your record for an invented baby of seven and a half months with readings, diapers, sleeps, a regimen and a vaccination card. In memory only: nothing is saved, nothing is synced, and reloading brings your own record back.",
  demoDataOn: "Showing demo data — reload to get yours back",
  demoDataOff: "Back to your own record",
  captureLogs: "Capture console output",
  captureLogsHint: "Records diagnostic lines so the log below can show them.",
  documentSize: "Document size",
  about: "About",
  version: "Version",
  build: "Build",
  // Where the record goes. The phone app offers no copy elsewhere, not even
  // iCloud — the record is a child's health data — so its sentence says the
  // record leaves the device only in a backup. Tested at this use site, so
  // each build carries only its own words.
  privacy:
    import.meta.env.VITE_NATIVE_BUILD === "on"
      ? "Everything stays on this device. The app sends nothing when it opens, and there is no cloud copy — not iCloud, not anywhere else: the record leaves the device only in a backup you export yourself. There is no server of ours, so nothing about you or your child is logged, there is nothing to sign up for, and there are no analytics."
      : "Everything stays on this device unless you connect a folder or a cloud account yourself, and a copy there is encrypted with your passphrase first. There is no server, nothing to sign up for, and no analytics.",
  // The phone app's link under it, to the policy its store listing points at.
  privacyPolicy: "Read the full privacy policy",
  disclaimer:
    "A notebook, not medical advice. The app records what you enter and compares it with published recommendations; questions about your child's health belong with the child health center.",
} as const;
