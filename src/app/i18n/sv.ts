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
    name: "Baby",
  },

  nav: {
    today: "Idag",
    diapers: "Blöjor",
    sleep: "Sömn",
    growth: "Tillväxt",
    food: "Mat",
    vaccines: "Vaccin",
    settings: "Inställningar",
    child: "Ditt barn",
    logDiaper: "Logga en blöja",
    logSleep: "Logga sömn",
    logAny: "Logga en blöja eller sömn",
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

  duration: {
    hm: "{h} tim {m} min",
    h: "{h} tim",
    m: "{m} min",
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
    saveFailed:
      "Kunde inte spara på den här enheten — kontrollera webbläsarens lagringsinställningar.",
    diapersCard: "Blöjor",
    sleepCard: "Sömn",
    foodCard: "Matregim",
    growthCard: "Tillväxt",
    vaccinesCard: "Nästa vaccination",
    latestReading: "{value} den {date}",
    latestReadingZ: "{value} den {date} · {z}",
    noReadings: "Inga mätvärden än.",
    nextDue: "{dose} — förväntades {date}",
    nextUpcoming: "{dose} — {date}",
    allGiven: "Alla programmets doser är noterade.",
  },

  quickLog: {
    title: "Logga",
    titleDiaper: "Logga en blöja",
    titleSleep: "Logga sömn",
    subtitle:
      "Ett tryck. Tiden är nu — om du inte väljer en tidigare för sömnen.",
    diaper: "Blöja",
    sleep: "Sömn",
  },

  diapers: {
    title: "Blöjor",
    log: "Logga ett byte",
    logHint:
      "Tryck på vad blöjan innehöll. Tiden sparas åt dig, och samma tre knappar finns bakom + i toppraden från vilken skärm som helst.",
    pee: "Kiss",
    poo: "Bajs",
    both: "Båda",
    logged: "Loggat",
    removed: "Borttaget",
    removeChange: "Ta bort det här bytet",
    recent: "Senaste 7 dagarna",
    recentHint:
      "Det som loggats, senaste först. Ta bort en rad som blev en felaktig tryckning — räkningen följer med.",
    dayToday: "Idag",
    noneToday: "Inget loggat idag.",
    noneYet: "Tryck på en knapp när du byter blöja — tiden sparas åt dig.",
    last24: "Senaste dygnet",
    last24Line: "{wet} kiss och {dirty} bajs det senaste dygnet",
    wet: "{count} kiss",
    dirty: "{count} bajs",
    lastChange: "Senaste byte {time}",
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
        "Efter ettårsdagen anger källorna inget antal; ett litet barns blöja är torr längre.",
    },
  },

  sleep: {
    title: "Sömn",
    log: "Logga sömn",
    logHint:
      "Tryck på Tupplur eller Natt när {name} somnar, och på Vaknade när barnet vaknar. Hade du inte en hand ledig? Välj hur länge sedan det var ovanför knapparna först, eller en tid — och samma knappar finns bakom + i toppraden.",
    nap: "Tupplur",
    night: "Natt",
    when: {
      fell: "Somnade",
      woke: "Vaknade",
      now: "Nu",
      ago: "för {duration} sedan",
      pick: "Välj tid",
      at: "kl. {time}",
      problem: {
        future: "Den tiden har inte varit än.",
        beforeStart: "Det är före sömnen började kl. {start}.",
        beforeLastSleep:
          "Det är före förra sömnen slutade kl. {end} — rätta den i listan först.",
      },
    },
    wokeUp: "Vaknade",
    asleepNap: "Sover middag sedan {time}",
    asleepNight: "Sover för natten sedan {time}",
    startedNap: "Tupplur från {time}",
    startedNight: "God natt — sover från {time}",
    woke: "Vaknade {time} — loggat",
    saved: "Sömnen sparad",
    removed: "Sömnen borttagen",
    recent: "Senaste 7 dagarna",
    recentHint:
      "Grupperat efter dygnet varje sömn hör till — en natt räknas till kvällen den började. Rätta en tid som trycktes in sent, eller lägg till en sömn som ingen loggade.",
    add: "Lägg till sömn",
    dayToday: "Idag",
    span: "{start}–{end}",
    spanOpen: "{start}–",
    stillAsleep: "sover fortfarande",
    noneYet:
      "Inget loggat än. Tryck på Tupplur eller Natt när {name} somnar — tiden sparas åt dig.",
    unfinished:
      "En sömn från {date} kl. {time} avslutades aldrig. Ange när {name} vaknade, eller ta bort den — till dess räknas den inte.",
    finish: "Ange när den slutade",
    form: {
      addTitle: "Lägg till sömn",
      editTitle: "Ändra sömn",
      kind: "Tupplur eller natt",
      start: "Somnade",
      startTime: "Tid somnade",
      end: "Vaknade",
      endTime: "Tid vaknade",
      stillAsleep: "Sover fortfarande",
      startMissing: "Ange när sömnen började",
      endMissing: "Ange när den slutade, eller kryssa i Sover fortfarande",
      inFuture: "Den tiden har inte varit än",
      endBeforeStart: "Slutet måste komma efter början",
      tooLong: "Det är längre än någon enskild sömn — kontrollera datumen",
      save: "Spara sömn",
      deleteConfirm: "Ta bort den här sömnen?",
    },
    nowAsleep: "Sover sedan {time} — {duration}",
    nowAwake: "Vaken sedan {time} — {duration}",
    nightWaking: "Vaken sedan {time} — ett nattligt uppvaknande",
    nextNap: "Nästa tupplur runt {time}",
    nextBedtime: "Läggdags runt {time}",
    nextSleep: "Nästa sömn runt {time}",
    nextPassed: "{next} — när som helst nu",
    lastNight: "I natt {duration}",
    average30: "{duration} per dygn de senaste 30 dagarna",
    now: "Just nu",
    window:
      "I den här åldern brukar ett barn vara vaket ungefär {min} till {max} mellan sömnperioderna, matning inräknad.",
    basisHistory:
      "Barnets egna vakentider de senaste två veckorna lägger den här på ungefär {window}.",
    basisAge:
      "Tills det finns några dagar av barnets egen sömn att gå på tar förslaget mitten av det spannet.",
    shortNap:
      "Senaste tuppluren var kort — kortare än en sömncykel — så nästa sömn behövs troligen tidigare.",
    longNap:
      "Senaste tuppluren var lång, så {name} orkar troligen vara vaken mot den längre änden.",
    bedtimeNote:
      "{name} brukar somna för natten runt {time}, och det är inom räckhåll härifrån — så nästa sömn är natten.",
    overdue:
      "Den föreslagna tiden har passerat. Trötthetstecken — gäspningar, gnuggade ögon, stirrande blick, gnäll — säger mer än klockan.",
    nightWakingNote:
      "Att vakna på natten är vanligt de första åren. Nästa sömn är resten av natten, så ingen tid föreslås.",
    suggestionHint:
      "Ett förslag utifrån senaste sömnen, hur lång den var och den vanliga vakentiden för åldern — barnets trötthetstecken går först.",
    quiet:
      "Inget loggat på ett tag. Tryck på Tupplur eller Natt under Sömn när nästa sömn börjar.",
    nothingToSuggest:
      "Logga en sömn och när den slutade, så föreslås nästa här.",
    noSuggestionAge:
      "Från ungefär tre år har de flesta barn slutat eller håller på att sluta sova middag, och vakentider slutar vara ett användbart sätt att planera dagen.",
    last24: "Senaste dygnet",
    last24Line: "{total} — {night} på natten, {day} tupplurar",
    averages: "Medelvärden",
    avg30: "Senaste 30 dagarna",
    avg90: "Senaste 90 dagarna",
    avgTotal: "{duration} per dygn",
    avgSplit: "{night} på natten · {day} tupplurar · {naps} tupplurar per dag",
    avgDays: "från {count} loggade dagar",
    avgNone: "Inget loggat än.",
    recommended:
      "WHO rekommenderar {low}–{high} timmars sömn per dygn i den här åldern, tupplurar inräknade. Barn som följts i studier sover i genomsnitt {mean} timmar, och 19 av 20 mellan {obsLow} och {obsHigh}.",
    band: {
      newborn:
        "Nyfödda sover dygnet runt i korta pass. En dygnsrytm brukar komma efter ungefär två till fyra månader, när nätterna börjar bli längre.",
      infant:
        "Enligt 1177 sover de flesta barn i åldern 4–11 månader 9–10 timmar på natten och 3–6 timmar på dagen.",
      toddler:
        "De flesta barn går från två tupplurar till en runt 18 månader; 1177 räknar med ungefär två timmars dagsömn mellan ett och två år.",
      preschool:
        "Mellan tre och fem år slutar de flesta barn sova middag; en lugn vila kan ta dess plats.",
    },
    status: {
      within:
        "Medelvärdet de senaste 30 dagarna ligger inom det rekommenderade spannet.",
      littleShort:
        "Medelvärdet de senaste 30 dagarna ligger lite under rekommendationen, men inom vad de flesta barn i den här åldern sover.",
      littleLong:
        "Medelvärdet de senaste 30 dagarna ligger lite över rekommendationen, men inom vad de flesta barn i den här åldern sover.",
      short:
        "Medelvärdet de senaste 30 dagarna ligger under vad 19 av 20 barn i den här åldern sover. Kontrollera först att tupplurarna är loggade — en dag med bara natten inlagd blir kort. Stämmer det är det värt att nämna på BVC: en anledning att titta, inte en bedömning.",
      long: "Medelvärdet de senaste 30 dagarna ligger över vad 19 av 20 barn i den här åldern sover. Värt att nämna på BVC om {name} dessutom är svår att väcka eller ovanligt dåsig: en anledning att titta, inte en bedömning.",
      tooEarly:
        "Det behövs en veckas loggade dagar innan medelvärdet jämförs med rekommendationen.",
    },
    loggedNote:
      "Medelvärdena räknar dagarna där något är loggat, till och med senaste hela dygnet. En dag där bara natten är inlagd räknas som en dag utan tupplurar.",
    chart: "Senaste 14 dagarna",
    chartDesc:
      "Sömn per dygn de senaste två veckorna: natten längst ned i varje stapel och tupplurarna ovanpå, över det rekommenderade spannet för åldern. En dag där inget loggades lämnas tom.",
    chartReadout: "{total} · {night} natt · {day} tupplurar",
    chartReadoutSoFar: "{total} hittills · {night} natt · {day} tupplurar",
    chartNothing: "inget loggat",
    legendNight: "Natt",
    legendDay: "Tupplurar",
    legendRecommended: "Rekommenderat",
    diary: "Timme för timme",
    diaryDesc:
      "De senaste sju dagarna, en rad per dygn från midnatt till midnatt, med varje loggad sömn där den inföll: nätter i accentfärgen, tupplurar ljusare.",
    sources:
      "Källor: WHO, Guidelines on physical activity, sedentary behaviour and sleep for children under 5 (2019); Galland m.fl., Sleep Medicine Reviews (2012); vakentider från Tresillian och Karitane (NSW Health); 1177.",
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
    readingsHint:
      "Vad vågen och måttbandet sa. Öppna Tillväxt från Idag för att se dem på standardkurvan.",
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
    formulaType: "Vilken ersättning",
    formulaInfant: "Modersmjölksersättning",
    formulaFollowOn: "Tillskottsnäring",
    formulaTypeHint:
      "Tillskottsnäring säljs från sex månader och innehåller ungefär två och en halv gånger så mycket järn som modersmjölksersättning, så vilken som står i flaskan flyttar järnsiffran nedan. Modersmjölksersättning duger hela första året — ange det {name} faktiskt får, inte det åldern antyder.",
    formulaMl: "Mängd per dygn (ml)",
    dDrops:
      "D-dropparna — fem droppar, 10 µg om dagen, från ungefär en veckas ålder till två år — täcker D-vitaminet på egen hand. D-vitaminsiffran i matvyn är vad maten lägger till utöver dem.",
    regimen: "Daglig regim",
    regimenHint:
      "Den mat {name} vanligtvis får under en dag, med en daglig mängd för varje. Ingen dagbok — uppdatera när den vanliga kosten ändras, eller när appen säger att regimen inte längre räcker till dagen.",
    empty: "Inga livsmedel än.",
    add: "Lägg till livsmedel",
    amountLine: "{amount} {unit} per dag · {kcal} kcal",
    assessment: "Räcker den till dagen?",
    target: "Vad dagen ställs mot",
    covered: "Ja — regimen täcker det beräknade energibehovet.",
    low: "Inte riktigt — regimen ger kanske inte tillräckligt med energi för det beräknade behovet.",
    outgrown:
      "{name}s nuvarande matregim ger kanske inte längre tillräckligt med energi för det beräknade behovet. Öka portionerna, lägg till ett livsmedel eller ändra regimen tills den täcker dagen igen.",
    energyLine: "{actual} av ungefär {target} kcal per dag från mat",
    energyUnknown:
      "Lägg till ett livsmedel för att se om regimen täcker dagen.",
    targetBreast:
      "Vid {months} månader förväntas ett ammat barn få ungefär {share} av dagens energi från mat — ungefär {target} av {total} kcal, vid {weight}.",
    targetMixed:
      "Vid {months} månader förväntas mjölken stå för ungefär {milkShare} av dagens energi. De {ml} ml ersättning täcker ungefär {formulaKcal} kcal av det, så den räknas in i dagen i stället för ovanpå den — ersättning och mat tillsammans ställs mot ungefär {target} av {total} kcal, vid {weight}.",
    targetFormula:
      "Ersättning och mat tillsammans ställs mot hela dagen: ungefär {total} kcal, vid {weight}.",
    targetWholeDay:
      "Utan mjölkmåltid kvar ställs maten mot hela dagen: ungefär {total} kcal, vid {weight}.",
    weightReference:
      "Ingen vikt sparad än, så WHO:s medianvikt för åldern får duga. Lägg in ett mätvärde under Tillväxt för en siffra som är {name}s egen.",
    nutrients: "Resten",
    nutrientsHint:
      "Jämfört med de nordiska näringsrekommendationerna 2023 för den här åldern. Ett näringsämne som inget livsmedel anger är okänt — räknas aldrig som noll.",
    nutrientsBreastNote:
      "Bröstmjölk mäts inte, så det den bidrar med räknas inte nedan. För järn spelar det liten roll — bröstmjölk innehåller nästan inget, vilket är skälet till att maten tar över vid ungefär sex månader.",
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
    coverage: {
      title: "Över dagen",
      chartDesc:
        "Energin från regimen som byggs upp under dagen mot den streckade linje den ställs mot. Kurvan tar ett steg där ett livsmedel anger en tid det ges på och lutar där det inte gör det — ett livsmedel utan tid, och eventuell ersättning, ritas jämnt utspritt över dagen.",
      readout: "{actual} av {target} kcal",
      metAt:
        "En vanlig dag når regimen det beräknade behovet vid ungefär {time}.",
      short:
        "En vanlig dag slutar ungefär {kcal} kcal under det beräknade behovet. Större portioner, ett livsmedel till, eller ett energirikare är vägarna tillbaka.",
      spreadNote:
        "{kcal} kcal per dag har ingen tid på sig — livsmedel utan tider och eventuell ersättning — så de ritas jämnt utspridda över dagen. Ge ett livsmedel sina vanliga tider under Mat så tar dagen steg i stället.",
      anytime: "någon gång under dagen",
      legendGiven: "Given energi",
      legendNeed: "Behövs till dagens slut",
    },
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
      times: "När på dagen",
      timesHint:
        "Tiderna det här livsmedlet vanligtvis ges på. Den dagliga mängden delas jämnt mellan dem, och de formar kurvan i matvyn. Lämna dem tomma för något som ges när det passar.",
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
    recordedCount: "{given} av {total} noterade",
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
    short: {
      dtp: "DTP-polio-Hib-HepB",
      dtpLate: "DTP-polio",
      dtpBooster: "DTP",
      pneumococcal: "Pneumokocker",
      rotavirus: "Rotavirus",
      mpr: "MPR",
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
    exportHint: "Laddar ner hela journalen som en JSON-fil.",
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
      "Allt stannar på den här enheten om du inte själv ansluter en mapp eller ett molnkonto, och en kopia där krypteras med din lösenfras först. Det finns ingen server, inget konto och ingen statistikinsamling.",
    disclaimer:
      "En anteckningsbok, inte medicinsk rådgivning. Appen sparar det du fyller i och jämför det med publicerade rekommendationer; frågor om ditt barns hälsa hör hemma på BVC.",
  },

  about: {
    title: "Om appen",
    open: "Om appen och källor",
    openHint: "Riktlinjerna och studierna bakom appens siffror",
    sources: "Källor",
    sourcesIntro:
      "De publicerade riktlinjerna, studierna och vårdens egna sidor bakom appens siffror, med det starkaste underlaget först — var och en med orden appen hämtade ur den.",
    pending:
      "{trackers}: deras källor anges i deras egna vyer än så länge, och läggs till här när siffrorna har stämts av mot källorna igen.",
    loading: "Hämtar källorna…",
    quotes: "Vad appen hämtade ur den",
    accessed: "Läst {date}",
    openSource: "Öppna källan",
    isbn: "ISBN {isbn}",
    evidence: {
      guideline: "Riktlinje",
      consensus: "Konsensusuttalande",
      "systematic-review": "Systematisk översikt",
      "meta-analysis": "Metaanalys",
      "randomized-trial": "Randomiserad studie",
      cohort: "Kohortstudie",
      "clinical-study": "Klinisk studie",
      review: "Översikt",
      method: "Metod",
      dataset: "Referensdata",
      "health-service": "Vårdens råd",
    },
  },

  advice: {
    note: "En anteckningsbok, inte medicinsk rådgivning: det du fyller i, jämfört med publicerade referenser. Frågor om ditt barns hälsa hör hemma på BVC.",
  },

  // Det som står mellan journalen och en kopia som lämnar enheten.
  encryption: {
    headline: "Krypterat innan det lämnar enheten",
    required:
      "Allt krypteras på den här enheten innan det går till {name}, som bara någonsin får chiffertext.",
    on: "Krypterat. Lösenfrasen är sparad på den här enheten.",
    paused:
      "Synkningen väntar tills lösenfrasen är satt — inget lämnar enheten okrypterat.",
    checking: "Kollar vad {name} har…",
    unreachable: "Kunde inte nå {name} för att kolla krypteringen.",
    retry: "Försök igen",
    set: "Välj lösenfras",
    change: "Byt lösenfras",
    changed: "Lösenfrasen är bytt",
    createTitle: "Välj en lösenfras",
    createHint:
      "Ditt barns journal krypteras på den här enheten innan den når {name}. Varje enhet som synkar den behöver lösenfrasen.",
    unlockTitle: "Ange din lösenfras",
    unlockHint:
      "Kopian i {name} är krypterad. Ange lösenfrasen du valde på din andra enhet.",
    changedTitle: "Lösenfrasen har bytts",
    changedHint:
      "Lösenfrasen byttes på en annan enhet. Ange den nya för att fortsätta synka.",
    changeTitle: "Byt lösenfras",
    changeHint:
      "Kopian i {name} krypteras om med den nya lösenfrasen. Dina andra enheter frågar efter den vid nästa synkning.",
    noRecovery:
      "Ingen kan återskapa en bortglömd lösenfras — inte vi, inte {name}. Skriv ner den någonstans säkert.",
    passphrase: "Lösenfras",
    confirm: "Upprepa lösenfrasen",
    createSubmit: "Kryptera och synka",
    unlockSubmit: "Lås upp",
    changeSubmit: "Byt",
    tooShort: "Använd minst {min} tecken.",
    mismatch: "Lösenfraserna är inte lika.",
    wrong: "Fel lösenfras. Försök igen.",
    failed: "Det gick inte. Försök igen.",
    offline:
      "{name} går inte att nå just nu. Försök igen när du är uppkopplad.",
    working: "Arbetar med krypteringen…",
  },

  // Applåset. Ett mjukt lås, och texten säger det.
  pin: {
    title: "Applås",
    on: "En PIN-kod krävs på den här enheten",
    off: "Ingen PIN-kod på den här enheten",
    hint: "Frågas efter när appen öppnas, och igen efter fem minuter i bakgrunden.",
    softWarning:
      "En PIN-kod håller en lånad telefon ute. Den krypterar inte journalen på den här enheten.",
    set: "Välj en PIN-kod",
    change: "Byt PIN-kod",
    remove: "Ta bort PIN-koden",
    label: "Ny PIN-kod",
    confirm: "Upprepa PIN-koden",
    current: "Nuvarande PIN-kod",
    tooShort: "Använd minst {min} siffror.",
    mismatch: "PIN-koderna är inte lika.",
    wrong: "Fel PIN-kod.",
    gateTitle: "Låst",
    gateHint: "Ange din PIN-kod för att öppna journalen.",
    gateLabel: "PIN-kod",
    gateSubmit: "Öppna",
    gateWrong: "Fel PIN-kod. Försök igen.",
  },

  sync: {
    syncedTo: "Synkad till {name}",
  },

  update: {
    available: "En ny version är redo",
    reload: "Ladda om",
  },
};
