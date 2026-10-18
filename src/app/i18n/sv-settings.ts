// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The Settings screen's Swedish strings, kept beside `en-settings.ts` so the
// two catalogs split the same way. Must satisfy `Catalog["settings"]`.

import type { Catalog } from "./en.ts";

export const svSettings: Catalog["settings"] = {
  title: "Inställningar",
  appearance: "Utseende",
  theme: "Tema",
  themeLight: "Ljust",
  themeDark: "Mörkt",
  themeSystem: "System",
  language: "Språk",
  features: "Vad du följer",
  featuresHint:
    "Stäng av det du inte använder, så försvinner fliken och korten. Inget tas bort — slå på det igen så finns allt du fyllt i kvar.",
  feature: {
    diapers: "Blöjor",
    sleep: "Sömn",
    growth: "Tillväxt",
    food: "Mat",
    vaccines: "Vaccin",
  },
  featureHint: {
    diapers:
      "Blöjfliken, blöjknapparna bakom plusknappen i toppraden och de senaste 24 timmarna mot normen för åldern.",
    sleep:
      "Sömnfliken, sömnknapparna bakom plusknappen, medelvärdena mot rekommendationen för åldern och en föreslagen tid för nästa sömn.",
    growth:
      "Vikt, längd och huvudomfång på WHO-kurvorna, med trenden och prognosen.",
    food: "Den dagliga matregimen och mjölken, jämförda med rekommendationen för ålder och vikt.",
    vaccines:
      "Det svenska barnvaccinationsprogrammet, vad som är givet och vad som står på tur.",
  },
  child: "Ditt barn",
  childBorn: "{date} · {age}",
  childHeights: "Mamma {mother}, pappa {father}",
  childHeightsMissing:
    "Inte ifyllt — den förväntade vuxenlängden behöver båda.",
  childMissing:
    "Inget barn än. Fyll i födelsedatum och kön så börjar alla skärmar fungera.",
  addChild: "Lägg till ditt barn",
  editChild: "Ändra",
  sync: "Var journalen finns",
  syncHint:
    "Din journal sparas på den här enheten. Håll en andra, krypterad kopia i en mapp du väljer, eller i ditt eget molnkonto, för att läsa den på en annan enhet också.",
  syncHintDevice:
    "Din journal sparas på den här enheten, och appen skickar den ingenstans. Exportera en säkerhetskopia nedan för att ha en egen kopia.",
  backend: "Lagring",
  backendName: {
    idb: "Den här enheten",
    folder: "Lokal mapp",
    dropbox: "Dropbox",
    gdrive: "Dropbox",
  },
  backendHint: {
    idb: "Sparas i den här webbläsarens egen lagring. Inget lämnar enheten, och inget här går att läsa från en annan.",
    folder:
      "En mapp på den här datorn, via webbläsarens filåtkomst. Journalen blir en fil du kan öppna, kopiera och säkerhetskopiera själv.",
    dropbox:
      "En fil i din egen Dropbox, i appens mapp. Logga in på en annan enhet för att läsa samma journal.",
    gdrive:
      "En fil i din egen Dropbox, i appens mapp. Logga in på en annan enhet för att läsa samma journal.",
  },
  folderUnavailable:
    "Lokal mapp erbjuds inte här: det kräver webbläsarens mappväljare, som Chrome, Edge och Opera på dator har men ingen mobilwebbläsare.",
  disconnect: "Koppla från",
  connected: "Ansluten till {name}",
  localOnly: "Bara på den här enheten",
  folderReconnect: "Återanslut till mappen",
  folderReconnectNeeded:
    "Webbläsaren behöver att du bekräftar åtkomsten till mappen igen.",
  saveNow: "Spara nu",
  reload: "Läs om från lagringen",
  data: "Dina data",
  export: "Exportera en säkerhetskopia",
  exportHint: "Sparar hela journalen som en JSON-fil.",
  exportFailed: "Säkerhetskopian kunde inte sparas. Försök igen.",
  import: "Återställ från en säkerhetskopia",
  importHint:
    "Slår ihop filen med det som redan finns här — inget på den här enheten tas bort.",
  imported: "Säkerhetskopia återställd",
  importFailed: "Filen gick inte att läsa som en säkerhetskopia.",
  deleteAll: "Ta bort allt",
  deleteAllHint:
    "Tar bort barnet och alla mätvärden, blöjbyten, sömnperioder, livsmedel och vaccinationer från den här enheten. Går inte att ångra.",
  deleteAllConfirm: "Ta bort hela journalen på den här enheten?",
  deleted: "Allt borttaget",
  developer: "Utvecklare",
  devMode: "Utvecklarläge",
  devModeHint:
    "Visar demodokumentet, loggfångsten, appens logg och dokumentets råstorlek.",
  demoData: "Demodata",
  demoDataHint:
    "Byt ut din journal mot en påhittad bebis på sju och en halv månad med mätvärden, blöjor, sömn, en regim och ett vaccinationskort. Bara i minnet: inget sparas, inget synkas, och en omladdning tar tillbaka din egen journal.",
  demoDataOn: "Visar demodata — ladda om för att få tillbaka din egen",
  demoDataOff: "Tillbaka till din egen journal",
  captureLogs: "Fånga konsolutskrifter",
  captureLogsHint: "Sparar diagnostikrader så att loggen nedan kan visa dem.",
  documentSize: "Dokumentstorlek",
  about: "Om",
  version: "Version",
  build: "Bygge",
  privacy:
    "Allt stannar på den här enheten om du inte själv ansluter en mapp eller ett molnkonto, och en kopia där krypteras med din lösenfras först. Det finns ingen server, ingen registrering och ingen statistikinsamling.",
  privacyDevice:
    "Allt stannar på den här enheten; appen skickar din journal ingenstans. Det finns ingen server, ingen registrering och ingen statistikinsamling.",
  disclaimer:
    "En anteckningsbok, inte medicinsk rådgivning. Appen sparar det du fyller i och jämför det med publicerade rekommendationer; frågor om ditt barns hälsa hör hemma på BVC.",
};
