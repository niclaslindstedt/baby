// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The Swedish catalog. Must satisfy `Catalog` — every key `en.ts` carries,
// this file carries too, and the type checker says so when one is missing.
//
// The vocabulary is the child health centre's: BVC, MPR, årskurs, D-droppar,
// kissblöja and bajsblöja, gröt and välling — the words a parent in Sweden
// already has for these things.

import type { Catalog } from "./en.ts";

export const sv: Catalog = {
  app: {
    name: "Nird Baby",
  },

  nav: {
    today: "Idag",
    growth: "Tillväxt",
    food: "Mat",
    vaccines: "Vaccin",
    settings: "Inställningar",
    child: "Ditt barn",
    logDiaper: "Logga en blöja",
  },

  common: {
    save: "Spara",
    cancel: "Avbryt",
    close: "Stäng",
    delete: "Ta bort",
    edit: "Ändra",
    add: "Lägg till",
    done: "Klar",
    back: "Tillbaka",
    remove: "Ta bort",
    noData: "—",
    optional: "valfritt",
  },

  datePicker: {
    placeholder: "Välj ett datum",
    prevMonth: "Föregående månad",
    nextMonth: "Nästa månad",
    prevYear: "Föregående år",
    nextYear: "Nästa år",
    prevYears: "Föregående tolv år",
    nextYears: "Nästa tolv år",
    clear: "Rensa",
  },

  age: {
    years: "{count} år",
    months: "{count} mån",
    weeks: "{count} v",
    days: "{count} d",
    newborn: "Nyfödd",
    notBornYet: "Inte född än — beräknad {date}",
    line: "{name}, {age}",
    yourBaby: "Din bebis",
  },

  child: {
    setupTitle: "Ditt barn",
    setupIntro:
      "Ett födelsedatum och ett kön är allt appen behöver för att placera mätvärden på tillväxtkurvorna och datera vaccinationsprogrammet. Allt stannar på den här enheten.",
    editTitle: "Ditt barn",
    name: "Namn",
    namePlaceholder: "valfritt",
    birthDate: "Födelsedatum",
    sex: "Kön",
    female: "Flicka",
    male: "Pojke",
    sexHint:
      "Tillväxtstandarden har en kurva per kön, och den förväntade slutlängden räknas olika för flickor och pojkar.",
    parents: "Föräldrarnas längd",
    parentsHint:
      "Båda, i centimeter, för den förväntade slutlängden. Valfritt — lämna tomt för att hoppa över.",
    motherHeight: "Mammans längd (cm)",
    fatherHeight: "Pappans längd (cm)",
    save: "Spara",
    saved: "Sparat",
    birthDateMissing: "Välj ett födelsedatum först",
  },

  today: {
    title: "Idag",
    diapers: "Blöjor",
    last24: "Senaste dygnet",
    wet: "{count} kiss",
    dirty: "{count} bajs",
    pee: "Kiss",
    poo: "Bajs",
    both: "Båda",
    logged: "Loggat",
    lastChange: "Senaste byte {time}",
    todayLog: "Dagens byten",
    noneToday: "Inget loggat idag.",
    noneYet: "Tryck på en knapp när du byter blöja — tiden sparas åt dig.",
    removeChange: "Ta bort det här bytet",
    removed: "Borttaget",
    chart: "Senaste 7 dagarna",
    chartDesc:
      "Kissblöjor och bajsblöjor per dag den senaste veckan. Ett byte med båda räknas i båda.",
    legendWet: "Kiss",
    legendDirty: "Bajs",
    fewWet:
      "{wet} {diapers} med kiss det senaste dygnet — i den här åldern brukar gränsen vara ungefär {min} per dygn. Värt att titta närmare på om blöjorna dessutom är lätta eller kisset mörkt.",
    longGap:
      "{days} dagar sedan senaste bajsblöjan — längre än vanligt för åldern och matningen. Hård avföring eller ett barn som har ont är det som betyder något; ett löst bajs efter ett långt uppehåll är i sin ordning.",
    diaper: "blöja",
    diapersPlural: "blöjor",
    norm: {
      firstDays:
        "De första dagarna ökar antalet med mjölken: ungefär en kissblöja dag ett, två dag två, och så vidare.",
      newborn:
        "Från ungefär dag fem räknar barnhälsovården med minst sex kissblöjor per dygn.",
      infant:
        "Från ungefär sex veckor blir blöjorna tyngre och färre — ungefär fem eller sex per dygn.",
      toddler:
        "Efter ettårsdagen anger källorna inget antal; en liten barns blöja är torr längre.",
    },
    saveFailed:
      "Kunde inte spara på den här enheten — kontrollera webbläsarens lagringsinställningar.",
    foodCard: "Matregim",
    growthCard: "Tillväxt",
    vaccinesCard: "Nästa vaccination",
    open: "Öppna",
    latestReading: "{value} den {date} · {z}",
    noReadings: "Inga mätvärden än.",
    nextDue: "{dose} — förväntades {date}",
    nextUpcoming: "{dose} — {date}",
    allGiven: "Alla programmets doser är noterade.",
  },

  quickLog: {
    title: "Logga en blöja",
    subtitle: "Tryck på vad blöjan innehöll. Tiden sparas nu.",
  },

  growth: {
    title: "Tillväxt",
    weight: "Vikt",
    length: "Längd",
    head: "Huvudomfång",
    chartDesc:
      "{indicator} mot WHO:s tillväxtstandard för barnets kön: medianen och kanalerna ±1 och ±2 SD, de sparade mätvärdena, och var de kommande troligen hamnar.",
    keyboardHint:
      "Diagram. Använd vänster- och högerpil för att läsa varje mätvärde.",
    legendMedian: "Median",
    legendChannels: "±1 och ±2 SD",
    legendReadings: "Mätvärden",
    legendForecast: "Troligt spann framåt",
    empty:
      "Lägg in mätvärdena från BVC — eller från en våg hemma, så ofta du vill — så hamnar de här på tillväxtkurvan.",
    add: "Lägg till mätvärde",
    readings: "Mätvärden",
    reading: "{date} · {age}",
    z: "{z}",
    channel: {
      high: "över kanalen +2 SD",
      aboveOne: "mellan +1 och +2 SD",
      middle: "inom ±1 SD från medianen",
      belowOne: "mellan −1 och −2 SD",
      low: "under kanalen −2 SD",
      outside: "utanför standardens åldersspann",
    },
    trend: "Trend",
    trendSingle:
      "Ett mätvärde hittills. Trenden — om {name} fortsätter följa samma kanal — är det som räknas, och den behöver några mätvärden med några veckors mellanrum.",
    trendSteady: "Följer kanalen: {z} nu, {delta} de senaste {days} dagarna.",
    trendUp:
      "Rör sig uppåt över kanalerna: {z} nu, {delta} de senaste {days} dagarna. Att korsa en kanal är värt att nämna vid nästa besök.",
    trendDown:
      "Rör sig nedåt över kanalerna: {z} nu, {delta} de senaste {days} dagarna. Att korsa en kanal är värt att nämna vid nästa besök.",
    forecast: "Var de kommande mätvärdena troligen hamnar",
    forecastDesc:
      "Det skuggade spannet efter det senaste mätvärdet följer barnets egen kanal på standarden, med den senaste driften dämpad så att den klingar av under en säsong. Bredare längre fram med flit. Ett mätvärde utanför är ett skäl att titta, inte ett omdöme.",
    forecastHolding: "Kanal {z}, håller.",
    forecastDrift: "Kanal {z}, rör sig {drift} SD i månaden.",
    forecastAt: "Till {date}: ungefär {value} (troligen {low}–{high})",
    target: "Förväntad slutlängd",
    targetValue: "Ungefär {cm} — grovt {low} till {high}.",
    targetHint:
      "Från båda föräldrarnas längd, med den formel barnhälsovården använder (Luo, Albertsson-Wikland & Karlberg 1998). Spannet är brett för att det är det: ungefär ±10 cm för 19 barn av 20.",
    targetMissing:
      "Lägg in båda föräldrarnas längd under Ditt barn för att se den förväntade slutlängden.",
    projection: "Beräknad slutlängd från {name}s egen tillväxt",
    projectionValue: "Ungefär {cm} — troligen {low} till {high}.",
    projectionHint:
      "Från den nuvarande längdkanalen ({z}), viktad till {share} eftersom längden i den här åldern bara löst förutsäger slutlängden, och resten dragen mot föräldrarnas mållängd. En rolig uppskattning med ärliga felstaplar, inte en prognos.",
    projectionHintNoParents:
      "Från den nuvarande längdkanalen ({z}), viktad till {share} eftersom längden i den här åldern bara löst förutsäger slutlängden, och resten dragen mot genomsnittet. Lägg in båda föräldrarnas längd för att förankra den.",
    projectionMissing: "Lägg in ett längdmått för att beräkna en slutlängd.",
    outOfRange:
      "Standarden täcker de första fem åren; senare mätvärden listas men placeras inte.",
    form: {
      addTitle: "Nytt mätvärde",
      editTitle: "Ändra mätvärde",
      date: "Datum",
      weight: "Vikt (kg)",
      length: "Längd (cm)",
      head: "Huvudomfång (cm)",
      hint: "Fyll i det som mättes — ett fält räcker.",
      nothing: "Fyll i minst ett mått",
      save: "Spara mätvärde",
      deleteConfirm: "Ta bort det här mätvärdet?",
    },
    saved: "Mätvärde sparat",
    deleted: "Mätvärde borttaget",
  },

  food: {
    title: "Mat",
    milkOnly:
      "Före ungefär fyra månader är bröstmjölk eller ersättning allt {name} behöver, och det finns inget att följa här. Regimen börjar vid ungefär sex månader, när smakportionerna kommer igång.",
    tastes:
      "Pyttesmå smakprov från fyra månader går bra — ett kryddmått, aldrig i konkurrens med mjölken. Regimen börjar vid ungefär sex månader, när smakportionerna kommer igång.",
    milk: "Mjölk",
    milkHint:
      "Bröstmjölk mäts inte — ett ammat barn reglerar det själv. Ersättning går att mäta, så den räknas in i dagen.",
    breast: "Ammas",
    formula: "Ersättning",
    mixed: "Båda",
    none: "Ingetdera",
    formulaMl: "Ersättning per dygn (ml)",
    dDrops:
      "D-dropparna — fem droppar, 10 µg om dagen, från ungefär en veckas ålder till två år — täcker D-vitaminet på egen hand. Siffran nedan är vad maten lägger till.",
    regimen: "Daglig regim",
    regimenHint:
      "Den mat {name} vanligtvis får under en dag, med en daglig mängd för varje. Ingen dagbok — uppdatera när den vanliga kosten ändras, eller när appen säger att regimen inte längre räcker till dagen.",
    empty: "Inga livsmedel än.",
    add: "Lägg till livsmedel",
    amountLine: "{amount} {unit} per dag · {kcal} kcal",
    assessment: "Räcker den till dagen?",
    covered: "Ja — regimen täcker det beräknade energibehovet.",
    low: "Inte riktigt — regimen ger kanske inte tillräckligt med energi för det beräknade behovet.",
    outgrown:
      "{name}s nuvarande matregim ger kanske inte längre tillräckligt med energi för det beräknade behovet. Öka portionerna, lägg till ett livsmedel eller ändra regimen tills den täcker dagen igen.",
    energyLine: "{actual} av ungefär {target} kcal per dag från mat",
    energyUnknown:
      "Lägg till ett livsmedel för att se om regimen täcker dagen.",
    targetBreast:
      "Vid {months} månader förväntas ett ammat barn få ungefär {share} av dagens energi från mat — ungefär {target} av {total} kcal, vid {weight}.",
    targetFormula:
      "Ersättning och mat tillsammans ställs mot hela dagen: ungefär {total} kcal, vid {weight}.",
    weightReference:
      "Ingen vikt sparad än, så WHO:s medianvikt för åldern får duga. Lägg in ett mätvärde under Tillväxt för en siffra som är {name}s egen.",
    nutrients: "Resten",
    nutrientsHint:
      "Jämfört med de nordiska näringsrekommendationerna 2023 för den här åldern. Ett näringsämne som inget livsmedel anger är okänt — räknas aldrig som noll.",
    nutrient: {
      ironMg: "Järn",
      vitaminDUg: "D-vitamin",
      fatE: "Fett, andel av matens energi",
      saturatedE: "Mättat fett, andel av energin",
      omega6E: "Omega-6, andel av energin",
      omega3E: "Omega-3, andel av energin",
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
      covered: "täckt",
      low: "under rekommendationen",
      partial: "minst så här mycket — alla livsmedel anger det inte",
      unknown: "inget livsmedel anger det",
      high: "över det rekommenderade spannet",
    },
    line: "{actual} av {target} {unit}",
    lineMax: "{actual} {unit}, högst {target} {unit}",
    form: {
      addTitle: "Nytt livsmedel",
      editTitle: "Ändra livsmedel",
      name: "Namn",
      namePlaceholder: "t.ex. Berikad gröt",
      presets: "Vanliga livsmedel",
      presetsHint:
        "Tryck på ett för att fylla i typiska värden från Livsmedelsverkets livsmedelsdatabas; justera efter förpackningen om den säger något annat.",
      amount: "Mängd per dag",
      unit: "Enhet",
      grams: "g",
      millilitres: "ml",
      per100: "Per 100 g / 100 ml",
      per100Hint:
        "Bara kalorier behövs. Fyll i resten när en förpackning anger det — ett tomt fält räknas som okänt, aldrig som noll.",
      kcal: "Kalorier (kcal)",
      ironMg: "Järn (mg)",
      vitaminDUg: "D-vitamin (µg)",
      fatG: "Fett (g)",
      saturatedG: "varav mättat (g)",
      monounsaturatedG: "varav enkelomättat (g)",
      polyunsaturatedG: "varav fleromättat (g)",
      omega3G: "Omega-3 (g)",
      omega6G: "Omega-6 (g)",
      more: "Fler detaljer",
      alaG: "ALA (g)",
      dhaG: "DHA (g)",
      epaG: "EPA (g)",
      nameMissing: "Ge det ett namn först",
      kcalMissing: "Kalorier behövs",
      save: "Spara livsmedel",
      deleteConfirm: "Ta bort {name} från regimen?",
    },
    saved: "Livsmedel sparat",
    deleted: "Livsmedel borttaget",
    milkSaved: "Mjölkmatning sparad",
  },

  vaccines: {
    title: "Vaccinationer",
    programme: "Barnvaccinationsprogrammet",
    programmeHint:
      "Sveriges allmänna program, som Folkhälsomyndigheten publicerar det. BVC kallar er; det här är vad varje besök gäller, och vad som kommer sedan.",
    given: "Given",
    due: "Förväntad vid det här laget",
    upcoming: "Kommande",
    dose: "Dos {n}",
    givenOn: "Given {date}",
    expected: "Förväntad {date}",
    at: {
      weeks: "{count} veckor",
      months: "{count} månader",
      years: "{count} år",
      school: "Årskurs {grade}",
    },
    where: {
      bvc: "på BVC",
      school: "i skolan",
    },
    oral: "droppar i munnen",
    group: {
      dtp: "Difteri, stelkramp, kikhosta, polio, Hib, hepatit B",
      dtpLate: "Difteri, stelkramp, kikhosta, polio",
      dtpBooster: "Difteri, stelkramp, kikhosta",
      pneumococcal: "Pneumokocker",
      rotavirus: "Rotavirus",
      mpr: "Mässling, påssjuka, röda hund (MPR)",
      hpv: "HPV",
      varicella: "Vattkoppor",
    },
    note: {
      rotavirusThird:
        "Tredje dosen gäller vaccinet som ges i tre doser (RotaTeq, det nationella vaccinet sedan 2023).",
      hepatitisBRegional:
        "Hepatit B erbjuds kostnadsfritt av alla regioner i samma spruta, även om det inte formellt ingår i det nationella programmet.",
      hpvGrade:
        "Två doser med minst sex månaders mellanrum, i årskurs 5 (vissa regioner säger 5–6).",
    },
    markGiven: "Markera som given",
    extras: "Utanför programmet",
    extrasHint:
      "Erbjuds riskgrupper, av en region, eller som ett tillval man betalar själv. Notera en för att hålla kortet komplett.",
    recordExtra: "Notera en vaccination",
    extra: {
      bcg: "BCG (tuberkulos)",
      "hepb-birth": "Hepatit B, dos vid födseln",
      rsv: "RS-virusskydd (nirsevimab)",
      influenza: "Influensa",
      "varicella-extra": "Vattkoppor",
      tbe: "TBE",
      meningococcal: "Meningokocker",
      "pneumococcal-extra": "Pneumokocker, extra dos",
      other: "Annat",
    },
    typicalAge: {
      birth: "vid födseln",
      sixWeeks: "från sex veckor",
      sixMonths: "från sex månader",
      twelveMonths: "från tolv månader",
      oneYear: "från ett år",
      threeYears: "från tre år",
      season: "varje höst, från sex månader",
    },
    offer: {
      riskGroup: "riskgrupper",
      regional: "erbjuds av regionerna",
      optional: "betalas själv",
      programmeFrom2027:
        "i programmet från 2027 för barn födda från juli 2025; betalas själv dessförinnan",
    },
    form: {
      title: "Notera en vaccination",
      which: "Vilken",
      date: "Datum",
      vaccineName: "Vaccinets namn",
      vaccineNamePlaceholder: "som det står på kortet — valfritt",
      label: "Mot",
      labelPlaceholder: "t.ex. Gula febern",
      note: "Anteckning",
      notePlaceholder: "batch, ställe, reaktion — valfritt",
      save: "Spara",
      removeConfirm: "Ta bort den här noteringen?",
    },
    saved: "Vaccination noterad",
    removed: "Notering borttagen",
    sources:
      "Schema: Folkhälsomyndigheten, Barnvaccinationsprogram (2026). Åldrarna är programmets; BVC kan justera dem.",
  },

  settings: {
    title: "Inställningar",
    appearance: "Utseende",
    theme: "Tema",
    themeLight: "Ljust",
    themeDark: "Mörkt",
    themeSystem: "System",
    language: "Språk",
    child: "Ditt barn",
    childHint: "Namn, födelsedatum, kön och föräldrarnas längd.",
    editChild: "Ändra",
    sync: "Var journalen finns",
    syncHint:
      "Din journal finns i den här webbläsaren. Håll en andra kopia på enheten, i en mapp du väljer, eller i ditt eget molnkonto för att läsa den på en annan enhet.",
    backend: "Lagring",
    disconnect: "Koppla från",
    connected: "Ansluten till {name}",
    localOnly: "Bara den här enheten",
    folderReconnect: "Återanslut till mappen",
    folderReconnectNeeded:
      "Webbläsaren behöver att du bekräftar åtkomsten till mappen igen.",
    folderHint:
      "En mapp på den här datorn, via webbläsarens filåtkomst (Chrome, Edge). Journalen blir en fil du kan öppna och säkerhetskopiera.",
    idbHint:
      "En andra kopia i webbläsarens IndexedDB — mer utrymme, och den behålls när webbläsaren rensar annan webbplatsdata.",
    saveNow: "Spara nu",
    reload: "Läs om från lagringen",
    data: "Dina data",
    export: "Exportera en säkerhetskopia",
    exportHint: "Laddar ner hela journalen som en JSON-fil.",
    import: "Återställ från en säkerhetskopia",
    importHint:
      "Slår ihop filen med det som redan finns här — inget på den här enheten tas bort.",
    imported: "Säkerhetskopia återställd",
    importFailed: "Filen gick inte att läsa som en säkerhetskopia.",
    deleteAll: "Ta bort allt",
    deleteAllHint:
      "Tar bort barnet och alla mätvärden, blöjbyten, livsmedel och vaccinationer från den här enheten. Går inte att ångra.",
    deleteAllConfirm: "Ta bort hela journalen på den här enheten?",
    deleted: "Allt borttaget",
    developer: "Utvecklare",
    devMode: "Utvecklarläge",
    devModeHint:
      "Visar demodokumentet, loggfångsten, appens logg och dokumentets råstorlek.",
    demoData: "Demodata",
    demoDataHint:
      "Byt ut din journal mot en påhittad åttamånaders bebis med mätvärden, blöjor, en regim och ett vaccinationskort. Bara i minnet: inget sparas, inget synkas, och en omladdning tar tillbaka din egen journal.",
    demoDataOn: "Visar demodata — ladda om för att få tillbaka din egen",
    demoDataOff: "Tillbaka till din egen journal",
    captureLogs: "Fånga konsolutskrifter",
    captureLogsHint: "Sparar diagnostikrader så att loggen nedan kan visa dem.",
    documentSize: "Dokumentstorlek",
    about: "Om",
    version: "Version",
    build: "Bygge",
    privacy:
      "Allt stannar på den här enheten om du inte själv ansluter en mapp eller ett molnkonto. Det finns ingen server, inget konto och ingen statistikinsamling.",
    disclaimer:
      "En anteckningsbok, inte medicinsk rådgivning. Appen sparar det du fyller i och jämför det med publicerade rekommendationer; frågor om ditt barns hälsa hör hemma på BVC.",
  },

  sync: {
    syncedTo: "Synkad till {name}",
  },

  update: {
    available: "En ny version är redo",
    reload: "Ladda om",
  },
};
