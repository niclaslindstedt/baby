// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The English catalog — the app's single source of user-facing copy, and (as
// the fallback language) the source of the compile-time message-key type.
// Add a string here first; `t()` won't type-check against a key this file
// doesn't carry, and `sv.ts` must carry every key this one does.
//
// `{name}`-style placeholders interpolate at call time. Keep the surrounding
// sentence in the catalog rather than concatenating fragments at the call
// site: a translator needs the whole sentence to move its words around.
//
// The register is a calm friend who has read the guidelines, never a
// clinician: the app records and compares, and every sentence that could
// read as a verdict says what to look at instead.

import type { Widen } from "@niclaslindstedt/oss-framework/i18n";

export const en = {
  app: {
    name: "Nird Baby",
  },

  nav: {
    today: "Today",
    growth: "Growth",
    food: "Food",
    vaccines: "Vaccines",
    settings: "Settings",
    child: "Your child",
    // The top bar's `+`: a glyph with no label, so its name carries what it
    // does — open the diaper sheet, the app's one high-frequency action.
    logDiaper: "Log a diaper",
  },

  common: {
    save: "Save",
    cancel: "Cancel",
    close: "Close",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    done: "Done",
    back: "Back",
    remove: "Remove",
    noData: "—",
    optional: "optional",
  },

  // The framework `DatePicker`'s own chrome — the trigger's empty text and
  // the panel's month/year paging arrows, which are icons and so carry their
  // names for a screen reader rather than on screen.
  datePicker: {
    placeholder: "Pick a date",
    prevMonth: "Previous month",
    nextMonth: "Next month",
    prevYear: "Previous year",
    nextYear: "Next year",
    prevYears: "Previous years",
    nextYears: "Next years",
    clear: "Clear",
  },

  age: {
    // "7 mo 2 wk" — the parts a parent says out loud, joined by spaces.
    years: "{count} y",
    months: "{count} mo",
    weeks: "{count} wk",
    days: "{count} d",
    newborn: "Newborn",
    notBornYet: "Not born yet — due {date}",
    // "Elias, 7 mo 2 wk"
    line: "{name}, {age}",
    yourBaby: "Your baby",
  },

  // The first-run screen and the profile editor: the four facts every
  // derivation needs, and the two that make the target height possible.
  child: {
    setupTitle: "Your child",
    setupIntro:
      "A birth date and a sex are all the app needs to place readings on the growth curves and to date the vaccination programme. Everything stays on this device.",
    editTitle: "Your child",
    name: "Name",
    namePlaceholder: "optional",
    birthDate: "Birth date",
    sex: "Sex",
    female: "Girl",
    male: "Boy",
    sexHint:
      "The growth standards publish one curve per sex, and the expected adult height is computed differently for each.",
    parents: "Parents' heights",
    parentsHint:
      "Both, in centimetres, for the expected adult height. Optional — leave blank to skip it.",
    motherHeight: "Mother's height (cm)",
    fatherHeight: "Father's height (cm)",
    save: "Save",
    saved: "Saved",
    birthDateMissing: "Pick a birth date first",
  },

  today: {
    title: "Today",
    // The whole tap-to-log surface: three buttons, then the day so far.
    diapers: "Diapers",
    last24: "Last 24 hours",
    wet: "{count} wet",
    dirty: "{count} dirty",
    pee: "Pee",
    poo: "Poo",
    both: "Both",
    logged: "Logged",
    lastChange: "Last change {time}",
    todayLog: "Today's changes",
    noneToday: "Nothing logged today.",
    noneYet:
      "Tap a button when you change a diaper — the time is recorded for you.",
    removeChange: "Remove this change",
    removed: "Removed",
    chart: "Last 7 days",
    chartDesc:
      "Wet and dirty diapers per day over the last week. A change with both counts in both.",
    legendWet: "Wet",
    legendDirty: "Dirty",
    // The two warnings the norms can raise. Both name the number and the
    // floor, and both end on the sign to look for rather than on a verdict.
    fewWet:
      "{wet} wet {diapers} in the last 24 hours — at this age the usual floor is about {min} a day. Worth a closer look if the diapers are also light or the urine dark.",
    longGap:
      "{days} days since the last dirty diaper — longer than usual for this age and feeding. Hard stools or an uncomfortable baby are the signs to act on; a soft stool after a long gap is fine.",
    diaper: "diaper",
    diapersPlural: "diapers",
    // Which source the floor comes from, said once under the warning.
    norm: {
      firstDays:
        "In the first days the count rises with the milk: about one wet diaper on day one, two on day two, and so on.",
      newborn:
        "From about day five, Swedish child health care expects at least six wet diapers a day.",
      infant:
        "From about six weeks the diapers are heavier and fewer — about five or six a day.",
      toddler:
        "After the first birthday the sources give no count; a toddler's diaper is dry for longer.",
    },
    saveFailed:
      "Couldn't save to this device — check the browser's storage settings.",
    // The headline cards under the diapers: the other three questions the
    // app answers, one line each, each opening its own read-only view over
    // this screen rather than sending the parent off to a tab.
    foodCard: "Food regimen",
    growthCard: "Growth",
    vaccinesCard: "Next vaccination",
    view: "View",
    latestReading: "{value} on {date} · {z}",
    noReadings: "No readings yet.",
    nextDue: "{dose} — was expected {date}",
    nextUpcoming: "{dose} — {date}",
    allGiven: "Every programme dose is recorded.",
  },

  // The sheet behind the top bar's `+`: the three buttons, from anywhere.
  quickLog: {
    title: "Log a diaper",
    subtitle: "Tap what the diaper held. The time is recorded now.",
  },

  growth: {
    title: "Growth",
    weight: "Weight",
    length: "Length",
    head: "Head circumference",
    chartDesc:
      "{indicator} against the WHO growth standard for the child's sex: the median and the ±1 and ±2 SD channels, the recorded readings, and where the next readings are likely to land.",
    keyboardHint:
      "Chart. Use the left and right arrow keys to read each reading.",
    legendMedian: "Median",
    legendChannels: "±1 and ±2 SD",
    legendReadings: "Readings",
    legendForecast: "Likely range ahead",
    empty:
      "Add the readings from the child health centre — or from a scale at home, as often as you like — and they appear here on the growth curve.",
    add: "Add a reading",
    readings: "Readings",
    readingsHint:
      "What the scale and the tape said. Open Growth from Today to see these on the standard curve.",
    reading: "{date} · {age}",
    // The z-score, and the channel it puts a reading in.
    z: "{z}",
    channel: {
      high: "above the +2 SD channel",
      aboveOne: "between +1 and +2 SD",
      middle: "within ±1 SD of the median",
      belowOne: "between −1 and −2 SD",
      low: "below the −2 SD channel",
      outside: "outside the standards' age range",
    },
    // The trend, which is the point: movement across channels over time is
    // what Swedish child health care reads, not the single number.
    trend: "Trend",
    trendSingle:
      "One reading so far. The trend — whether {name} keeps following the same channel — is what matters, and it needs a few readings some weeks apart.",
    trendSteady:
      "Following the channel: {z} now, {delta} over the last {days} days.",
    trendUp:
      "Moving up across the channels: {z} now, {delta} over the last {days} days. Crossing a channel is worth mentioning at the next visit.",
    trendDown:
      "Moving down across the channels: {z} now, {delta} over the last {days} days. Crossing a channel is worth mentioning at the next visit.",
    forecast: "Where the next readings are likely to land",
    forecastDesc:
      "The shaded range ahead of the last reading follows the child's own channel on the standard, with the recent drift damped so it fades over a season. Wider further out on purpose. A reading outside it is a reason to look, not a verdict.",
    forecastHolding: "Channel {z}, holding.",
    forecastDrift: "Channel {z}, moving {drift} SD a month.",
    forecastAt: "By {date}: about {value} (likely {low}–{high})",
    target: "Expected adult height",
    targetValue: "About {cm} — roughly {low} to {high}.",
    targetHint:
      "From both parents' heights, with the formula Swedish child health care uses (Luo, Albertsson-Wikland & Karlberg 1998). The range is wide because it is: about ±10 cm for 19 children in 20.",
    targetMissing:
      "Add both parents' heights under Your child to see the expected adult height.",
    projection: "Projected adult height from {name}'s own growth",
    projectionValue: "About {cm} — likely {low} to {high}.",
    projectionHint:
      "From the current length channel ({z}), kept at {share} of its weight because length at this age only loosely predicts adult height, and regressed the rest of the way toward the parents' target. A fun estimate with honest bars, not a prognosis.",
    projectionHintNoParents:
      "From the current length channel ({z}), kept at {share} of its weight because length at this age only loosely predicts adult height, and regressed the rest of the way toward the average. Add both parents' heights to anchor it.",
    projectionMissing: "Add a length reading to project an adult height.",
    outOfRange:
      "The standards cover the first five years; later readings are listed but not placed.",
    form: {
      addTitle: "New reading",
      editTitle: "Edit reading",
      date: "Date",
      weight: "Weight (kg)",
      length: "Length (cm)",
      head: "Head circumference (cm)",
      hint: "Enter what was measured — one field is enough.",
      nothing: "Enter at least one measurement",
      save: "Save reading",
      deleteConfirm: "Delete this reading?",
    },
    saved: "Reading saved",
    deleted: "Reading deleted",
  },

  food: {
    title: "Food",
    // Before six months the screen stays out of the way, and says why.
    milkOnly:
      "Before about four months, breast milk or formula is everything {name} needs, and there is nothing to track here. The regimen starts at about six months, when solid foods are introduced.",
    tastes:
      "Tiny tastes from four months are fine — a pinch, never competing with the milk. The regimen starts at about six months, when solid foods are introduced.",
    // Milk feeding: the one fact beyond the regimen.
    milk: "Milk",
    milkHint:
      "Breast milk is not measured — a breastfed baby regulates it themselves. Formula is, so it counts toward the day.",
    breast: "Breastfed",
    formula: "Formula",
    mixed: "Both",
    none: "Neither",
    formulaType: "Which formula",
    formulaInfant: "Infant formula",
    formulaFollowOn: "Follow-on formula",
    formulaTypeHint:
      "Follow-on formula (tillskottsnäring) is sold from six months and carries about two and a half times the iron of infant formula, so which one is in the bottle moves the iron figure below. Infant formula is fine for the whole first year — say what {name} actually gets, not what the age suggests.",
    formulaMl: "Amount per day (ml)",
    dDrops:
      "The D-drops — five drops, 10 µg a day, from about one week until two years — cover vitamin D on their own. The vitamin D figure in the food view is what the food adds on top of them.",
    // The regimen list.
    regimen: "Daily regimen",
    regimenHint:
      "The foods {name} typically gets in a day, with a daily amount each. Not a diary — update it when the normal diet changes, or when the app says the regimen no longer covers the day.",
    empty: "No foods yet.",
    add: "Add a food",
    amountLine: "{amount} {unit} a day · {kcal} kcal",
    // The assessment, which opens from Today's Food card.
    assessment: "Does it cover the day?",
    target: "What the day is held to",
    covered: "Yes — the regimen covers the estimated energy needs.",
    low: "Not quite — the regimen may not provide enough energy for the estimated needs.",
    outgrown:
      "{name}'s current food regimen may no longer provide enough energy for their estimated needs. Increase portions, add a food, or change the regimen until it covers the day again.",
    energyLine: "{actual} of about {target} kcal a day from food",
    energyUnknown: "Add a food to see whether the regimen covers the day.",
    targetBreast:
      "At {months} months a breastfed child is expected to get about {share} of the day's energy from food — about {target} of {total} kcal, at {weight}.",
    targetMixed:
      "At {months} months milk is expected to supply about {milkShare} of the day's energy. The {ml} ml of formula covers about {formulaKcal} kcal of that, so it counts toward the day rather than on top of it — formula and food together are held to about {target} of {total} kcal, at {weight}.",
    targetFormula:
      "Formula and food together are held to the whole day: about {total} kcal, at {weight}.",
    targetWholeDay:
      "With no milk feed left, food is held to the whole day: about {total} kcal, at {weight}.",
    weightReference:
      "No weight recorded yet, so the WHO median weight for age stands in. Add a reading under Growth for a figure that is {name}'s own.",
    nutrients: "The rest",
    nutrientsHint:
      "Compared against the Nordic Nutrition Recommendations 2023 for this age. A nutrient no food states is unknown — never read as zero.",
    nutrientsBreastNote:
      "Breast milk is not measured, so what it contributes is not counted below. For iron that changes little — breast milk carries almost none, which is why food takes over at around six months.",
    nutrient: {
      ironMg: "Iron",
      vitaminDUg: "Vitamin D",
      fatE: "Fat, share of the food's energy",
      saturatedE: "Saturated fat, share of energy",
      omega6E: "Omega-6, share of energy",
      omega3E: "Omega-3, share of energy",
      dhaG: "DHA",
    },
    unit: {
      mg: "mg",
      ug: "µg",
      e: "E%",
      g: "g",
      ml: "ml",
      kcal: "kcal",
    },
    status: {
      covered: "covered",
      low: "below the recommendation",
      partial: "at least this much — some foods don't say",
      unknown: "no food states it",
      high: "above the recommended range",
    },
    line: "{actual} of {target} {unit}",
    lineMax: "{actual} {unit}, up to {target} {unit}",
    // The coverage curve: the same comparison with the clock on the x axis.
    coverage: {
      title: "Over the day",
      chartDesc:
        "Energy from the regimen accumulating through the day against the dashed line it is held to. The curve steps where a food names a time it is given and slopes where it doesn't — a food with no time, and the bottles, are spread evenly across the day.",
      readout: "{actual} of {target} kcal",
      metAt:
        "On a typical day the regimen reaches the estimated need at about {time}.",
      short:
        "A typical day ends about {kcal} kcal short of the estimated need. Bigger portions, an extra food, or a richer one are the ways back.",
      spreadNote:
        "{kcal} kcal a day has no time on it — untimed foods and any formula — so it is drawn spread evenly across the day. Give a food its usual times under Food to see the day step instead.",
      anytime: "sometime during the day",
      legendGiven: "Energy given",
      legendNeed: "Needed by the end of the day",
    },
    form: {
      addTitle: "New food",
      editTitle: "Edit food",
      name: "Name",
      namePlaceholder: "e.g. Fortified porridge",
      presets: "Common foods",
      presetsHint:
        "Tap one to fill in typical values from Livsmedelsverket's food database; adjust to the label if it differs.",
      amount: "Amount per day",
      unit: "Unit",
      times: "When in the day",
      timesHint:
        "The times this food is usually given. The daily amount is split evenly between them, and they shape the coverage curve in the food view. Leave them off for something given whenever it suits.",
      grams: "g",
      millilitres: "ml",
      per100: "Per 100 g / 100 ml",
      per100Hint:
        "Only calories are needed. Enter the rest when a label says so — a field left blank is treated as unknown, never as zero.",
      kcal: "Calories (kcal)",
      ironMg: "Iron (mg)",
      vitaminDUg: "Vitamin D (µg)",
      fatG: "Fat (g)",
      saturatedG: "of which saturated (g)",
      monounsaturatedG: "of which monounsaturated (g)",
      polyunsaturatedG: "of which polyunsaturated (g)",
      omega3G: "Omega-3 (g)",
      omega6G: "Omega-6 (g)",
      more: "More detail",
      alaG: "ALA (g)",
      dhaG: "DHA (g)",
      epaG: "EPA (g)",
      nameMissing: "Give it a name first",
      kcalMissing: "Calories are needed",
      save: "Save food",
      deleteConfirm: "Remove {name} from the regimen?",
    },
    saved: "Food saved",
    deleted: "Food removed",
    milkSaved: "Milk feeding saved",
  },

  vaccines: {
    title: "Vaccinations",
    programme: "The childhood vaccination programme",
    programmeHint:
      "Sweden's general programme, as Folkhälsomyndigheten publishes it. The child health centre calls you in; this is what each visit is for, and what comes after it.",
    given: "Given",
    recordedCount: "{given} of {total} recorded",
    due: "Expected by now",
    upcoming: "Upcoming",
    dose: "Dose {n}",
    givenOn: "Given {date}",
    expected: "Expected {date}",
    at: {
      weeks: "{count} weeks",
      months: "{count} months",
      years: "{count} years",
      school: "School year {grade}",
    },
    where: {
      bvc: "at the child health centre",
      school: "at school",
    },
    oral: "oral drops",
    group: {
      dtp: "Diphtheria, tetanus, whooping cough, polio, Hib, hepatitis B",
      dtpLate: "Diphtheria, tetanus, whooping cough, polio",
      dtpBooster: "Diphtheria, tetanus, whooping cough",
      pneumococcal: "Pneumococcal",
      rotavirus: "Rotavirus",
      mpr: "Measles, mumps, rubella (MPR)",
      hpv: "HPV",
      varicella: "Chickenpox",
    },
    // The overview's short names — the card as a parent scans it, rather
    // than the six diseases one injection covers spelled out.
    short: {
      dtp: "DTP-polio-Hib-HepB",
      dtpLate: "DTP-polio",
      dtpBooster: "DTP",
      pneumococcal: "Pneumococcal",
      rotavirus: "Rotavirus",
      mpr: "MPR",
      hpv: "HPV",
      varicella: "Chickenpox",
    },
    note: {
      rotavirusThird:
        "The third dose applies to the three-dose vaccine (RotaTeq, the national product since 2023).",
      hepatitisBRegional:
        "Hepatitis B is offered free by every region as part of the same injection, though not formally in the national programme.",
      hpvGrade:
        "Two doses at least six months apart, in school year 5 (some regions say 5–6).",
    },
    markGiven: "Mark as given",
    extras: "Outside the programme",
    extrasHint:
      "Offered to risk groups, by a region, or as a self-paid extra. Record one to keep the card complete.",
    recordExtra: "Record a vaccination",
    extra: {
      bcg: "BCG (tuberculosis)",
      "hepb-birth": "Hepatitis B, birth dose",
      rsv: "RSV protection (nirsevimab)",
      influenza: "Influenza",
      "varicella-extra": "Chickenpox",
      tbe: "TBE",
      meningococcal: "Meningococcal",
      "pneumococcal-extra": "Pneumococcal, extra dose",
      other: "Other",
    },
    typicalAge: {
      birth: "at birth",
      sixWeeks: "from six weeks",
      sixMonths: "from six months",
      twelveMonths: "from twelve months",
      oneYear: "from one year",
      threeYears: "from three years",
      season: "each autumn, from six months",
    },
    offer: {
      riskGroup: "risk groups",
      regional: "offered by the regions",
      optional: "self-paid",
      programmeFrom2027:
        "in the programme from 2027 for children born from July 2025; self-paid before",
    },
    form: {
      title: "Record a vaccination",
      which: "Which",
      date: "Date",
      vaccineName: "Vaccine name",
      vaccineNamePlaceholder: "as written on the card — optional",
      label: "Against",
      labelPlaceholder: "e.g. Yellow fever",
      note: "Note",
      notePlaceholder: "batch, site, reaction — optional",
      save: "Save",
      removeConfirm: "Remove this record?",
    },
    saved: "Vaccination recorded",
    removed: "Record removed",
    sources:
      "Schedule: Folkhälsomyndigheten, Barnvaccinationsprogram (2026). Ages are the programme's; the child health centre may adjust them.",
  },

  settings: {
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
      growth: "Growth",
      food: "Food",
      vaccines: "Vaccines",
    },
    featureHint: {
      diapers:
        "The one-tap log on Today, the + in the top bar, and the last 24 hours against the norm for the age.",
      growth:
        "Weight, length and head readings on the WHO curves, with the trend and the forecast.",
      food: "The daily food regimen and the milk, checked against the recommendation for the age and weight.",
      vaccines:
        "The Swedish childhood programme, what is given and what comes next.",
    },
    child: "Your child",
    childHint: "Name, birth date, sex and the parents' heights.",
    editChild: "Edit",
    sync: "Where the record lives",
    syncHint:
      "Your record lives in this browser. Keep a second copy on this device, in a folder you pick, or in your own cloud account to read it on another device.",
    backend: "Backend",
    disconnect: "Disconnect",
    connected: "Connected to {name}",
    localOnly: "This device only",
    folderReconnect: "Reconnect to the folder",
    folderReconnectNeeded:
      "The browser needs you to confirm access to the folder again.",
    folderHint:
      "A folder on this computer, through the browser's file access (Chrome, Edge). The record becomes a file you can open and back up.",
    idbHint:
      "A second copy in the browser's IndexedDB — more room, and kept when the browser trims other site data.",
    saveNow: "Save now",
    reload: "Reload from the backend",
    data: "Your data",
    export: "Export a backup",
    exportHint: "Downloads the whole record as a JSON file.",
    import: "Restore from a backup",
    importHint:
      "Merges the file into what is already here — nothing on this device is dropped.",
    imported: "Backup restored",
    importFailed: "That file could not be read as a backup.",
    deleteAll: "Delete everything",
    deleteAllHint:
      "Removes the child and every reading, diaper change, food and vaccination from this device. This cannot be undone.",
    deleteAllConfirm: "Delete the whole record on this device?",
    deleted: "Everything deleted",
    developer: "Developer",
    devMode: "Developer mode",
    devModeHint:
      "Shows the demo document, the log capture switch, the app log, and the raw document size.",
    demoData: "Demo data",
    demoDataHint:
      "Swap your record for an invented eight-month-old with readings, diapers, a regimen and a vaccination card. In memory only: nothing is saved, nothing is synced, and reloading brings your own record back.",
    demoDataOn: "Showing demo data — reload to get yours back",
    demoDataOff: "Back to your own record",
    captureLogs: "Capture console output",
    captureLogsHint: "Records diagnostic lines so the log below can show them.",
    documentSize: "Document size",
    about: "About",
    version: "Version",
    build: "Build",
    privacy:
      "Everything stays on this device unless you connect a folder or a cloud account yourself. There is no server, no account, and no analytics.",
    disclaimer:
      "A notebook, not medical advice. The app records what you enter and compares it with published recommendations; questions about your child's health belong with the child health centre.",
  },

  sync: {
    syncedTo: "Synced to {name}",
  },

  update: {
    available: "A new version is ready",
    reload: "Reload",
  },
} as const;

// The catalog shape every language must satisfy. `Widen` relaxes each leaf
// from its literal to `string`, so `sv.ts` type-checks against the *keys*.
export type Catalog = Widen<typeof en>;
