// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// A handful of common Swedish baby foods with typical nutrient content per
// 100 g, so a parent can fill a regimen row with one tap and adjust to the
// label. Values from Livsmedelsverket's food database (Livsmedelsdatabasen,
// version 2026-06-29) unless noted; fatty acids are rounded to 0.1 g there.
// A typing aid, not a formulary — anything can be entered by hand, and no
// byte of what is typed leaves the device. Rides in its own chunk behind
// `import()`.
//
//   - Fortified whole-grain baby porridge, ready to eat (id 6263)
//   - Fortified whole-grain välling, ready to drink (id 6257)
//   - Boiled egg (id 2205)
//   - Boiled salmon (id 1317)
//   - Banana (id 553; iron 0.0 is the database's value)
//   - Avocado (id 320)
//   - Rapeseed oil (id 2189)
//   - Infant formula (id 6552), DHA at the EU minimum the database rounds away
//   - Follow-on formula (tillskottsnäring) and the milk drink that follows it
//     from a year, both from the Swedish label rather than the database

import type { Nutrients } from "../types.ts";

export type FoodPreset = {
  id: string;
  /** Swedish and English names — the list shows the reader's language. */
  name: { sv: string; en: string };
  unit: "g" | "ml";
  /** A typical daily amount for a first-year regimen, as a starting point. */
  typicalAmount: number;
  per100: Nutrients;
};

export const FOOD_PRESETS: FoodPreset[] = [
  {
    id: "porridge",
    name: {
      sv: "Barngröt, fullkorn, berikad",
      en: "Fortified whole-grain baby porridge",
    },
    unit: "g",
    typicalAmount: 150,
    per100: {
      kcal: 104,
      ironMg: 1.7,
      vitaminDUg: 1.79,
      fatG: 3.7,
      saturatedG: 0.7,
      monounsaturatedG: 1.7,
      polyunsaturatedG: 1.1,
      omega3G: 0.2,
      omega6G: 0.9,
    },
  },
  {
    id: "valling",
    name: {
      sv: "Välling, fullkorn, berikad",
      en: "Fortified whole-grain välling",
    },
    unit: "ml",
    typicalAmount: 200,
    per100: {
      kcal: 59,
      ironMg: 1.1,
      vitaminDUg: 0.96,
      fatG: 1.9,
      saturatedG: 0.4,
      monounsaturatedG: 0.8,
      polyunsaturatedG: 0.6,
      omega3G: 0.1,
      omega6G: 0.5,
    },
  },
  {
    id: "egg",
    name: { sv: "Ägg, kokt", en: "Egg, boiled" },
    unit: "g",
    typicalAmount: 30,
    per100: {
      kcal: 136,
      ironMg: 1.8,
      vitaminDUg: 1.92,
      fatG: 9.8,
      saturatedG: 2.6,
      monounsaturatedG: 3.9,
      polyunsaturatedG: 1.5,
      omega3G: 0.19,
      omega6G: 1.32,
      dhaG: 0.1,
    },
  },
  {
    id: "salmon",
    name: { sv: "Lax, kokt", en: "Salmon, boiled" },
    unit: "g",
    typicalAmount: 25,
    per100: {
      kcal: 246,
      ironMg: 0.2,
      vitaminDUg: 6.91,
      fatG: 16.6,
      saturatedG: 2.2,
      monounsaturatedG: 7.9,
      polyunsaturatedG: 4.8,
      omega3G: 2.2,
      omega6G: 2.3,
      alaG: 0.9,
      dhaG: 0.7,
      epaG: 0.4,
    },
  },
  {
    id: "banana",
    name: { sv: "Banan", en: "Banana" },
    unit: "g",
    typicalAmount: 50,
    per100: { kcal: 95, fatG: 0.1 },
  },
  {
    id: "avocado",
    name: { sv: "Avokado", en: "Avocado" },
    unit: "g",
    typicalAmount: 30,
    per100: {
      kcal: 197,
      ironMg: 0.3,
      fatG: 19.6,
      saturatedG: 3.4,
      monounsaturatedG: 12.7,
      polyunsaturatedG: 2.6,
      omega3G: 0.2,
      omega6G: 2.4,
    },
  },
  {
    id: "rapeseed-oil",
    name: { sv: "Rapsolja", en: "Rapeseed oil" },
    unit: "g",
    typicalAmount: 5,
    per100: {
      kcal: 884,
      fatG: 100,
      saturatedG: 7.1,
      monounsaturatedG: 61.3,
      polyunsaturatedG: 27.4,
      omega3G: 8.5,
      omega6G: 18.8,
      alaG: 8.5,
    },
  },
  {
    id: "formula",
    name: { sv: "Modersmjölksersättning", en: "Infant formula" },
    unit: "ml",
    typicalAmount: 200,
    per100: {
      kcal: 66,
      ironMg: 0.4,
      vitaminDUg: 1.37,
      fatG: 3.5,
      saturatedG: 1.1,
      monounsaturatedG: 1.6,
      polyunsaturatedG: 0.6,
      omega3G: 0.1,
      omega6G: 0.6,
      // 20 mg per 100 kcal, the EU minimum, at 66 kcal per 100 ml.
      dhaG: 0.0132,
    },
  },
  // Tillskottsnäring, from six months. The Food screen's milk card counts
  // these bottles on its own once the parent says which product they are —
  // this chip is for a parent who would rather carry their own tin's label
  // in the regimen, and for anyone whose brand differs from the typical one.
  {
    id: "follow-on-formula",
    name: { sv: "Tillskottsnäring", en: "Follow-on formula" },
    unit: "ml",
    typicalAmount: 200,
    per100: {
      kcal: 69,
      ironMg: 1.0,
      vitaminDUg: 1.5,
      fatG: 3.4,
      saturatedG: 1.2,
      monounsaturatedG: 1.3,
      polyunsaturatedG: 0.6,
      omega3G: 0.071,
      omega6G: 0.52,
      alaG: 0.057,
      dhaG: 0.0138,
    },
  },
  // Mjölkdryck from a year — not a formula at all, and never the milk card's
  // millilitres: it is a drink alongside a table diet, so it belongs in the
  // regimen like any other food.
  {
    id: "toddler-milk",
    name: { sv: "Mjölkdryck (från 1 år)", en: "Toddler milk drink (from 1)" },
    unit: "ml",
    typicalAmount: 400,
    per100: {
      kcal: 64,
      ironMg: 1.2,
      vitaminDUg: 1.6,
      fatG: 2.8,
      saturatedG: 0.9,
      monounsaturatedG: 1.2,
      polyunsaturatedG: 0.6,
      omega3G: 0.084,
      omega6G: 0.55,
      alaG: 0.08,
      dhaG: 0.0039,
    },
  },
];
