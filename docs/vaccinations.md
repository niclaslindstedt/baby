# Vaccinations

The programme the Vaccines screen draws, and how a dose's status is decided.
The code is `src/app/vaccines.ts`; the ages are pinned in
`tests/vaccines_test.ts`.

## The general programme

Sweden's general childhood vaccination programme, as Folkhälsomyndigheten
publishes it (table updated April 2026):

| Age         | Vaccine                                                      | Dose | Where  |
| ----------- | ------------------------------------------------------------ | ---- | ------ |
| 6 weeks     | Rotavirus (oral)                                             | 1    | BVC    |
| 3 months    | Diphtheria, tetanus, whooping cough, polio, Hib, hepatitis B | 1    | BVC    |
| 3 months    | Pneumococcal                                                 | 1    | BVC    |
| 3 months    | Rotavirus (oral)                                             | 2    | BVC    |
| 5 months    | Diphtheria, tetanus, whooping cough, polio, Hib, hepatitis B | 2    | BVC    |
| 5 months    | Pneumococcal                                                 | 2    | BVC    |
| 5 months    | Rotavirus (oral)                                             | 3    | BVC    |
| 12 months   | Diphtheria, tetanus, whooping cough, polio, Hib, hepatitis B | 3    | BVC    |
| 12 months   | Pneumococcal                                                 | 3    | BVC    |
| 18 months   | Measles, mumps, rubella (MPR)                                | 1    | BVC    |
| 5 years     | Diphtheria, tetanus, whooping cough, polio                   | 4    | BVC    |
| Årskurs 1–2 | Measles, mumps, rubella (MPR)                                | 2    | School |
| Årskurs 5   | HPV (two doses, at least six months apart)                   | 1, 2 | School |
| Årskurs 8–9 | Diphtheria, tetanus, whooping cough                          | 5    | School |

Two footnotes the app carries as row notes: the third rotavirus dose applies
to the three-dose vaccine (RotaTeq, the nationally procured product since
September 2023), and hepatitis B is not formally in the national programme
but is recommended by Folkhälsomyndigheten and offered free by every region
as part of the same hexavalent injection — so it is listed with the
programme, where a parent sees it on the card.

**Chickenpox (varicella)** joins the programme on 1 January 2027 for children
born from 1 July 2025: two doses, with MPR at 18 months and in årskurs 1–2.
The rows appear in the timeline only from that date and only for that cohort;
until then chickenpox is listed among the extras as a self-paid option from
twelve months.

## Expected dates

A dose's expected date is counted from the birth date: weeks as days,
months as calendar months (a child born on 31 January is one month old on 28
February), and a school year as 15 August of the calendar year the child
turns the grade's age (årskurs 1 starts the year a child turns seven).

A dose is **given** once a record points at it, **expected by now** when its
date has passed with nothing recorded, and **upcoming** otherwise. There is
no "overdue" grade: the child health centre works to windows the app does not
know, and a row that turns red a day late would only alarm.

## Outside the programme

Vaccinations offered to risk groups, by a region, or as a self-paid extra
are listed separately so they can be recorded without muddling the
programme's timeline: BCG (tuberculosis, from six weeks for risk groups), a
hepatitis B birth dose, the RSV antibody nirsevimab (offered by the regions
to newborns in season since 2025), influenza (risk groups, from six months),
chickenpox, TBE (from three years in risk areas), meningococcal (risk groups),
and an extra pneumococcal dose (risk groups) — plus "Other" for anything
else, with a free-text label.

## Sources

- Folkhälsomyndigheten, _Barnvaccinationsprogram_ and the A–Ö pages for
  rotavirus, hepatit B, HPV, vattkoppor, tuberkulos, influensa, TBE and the
  risk-group programmes (2025–2026).
- 1177.se, _Vaccinationsprogrammet för barn_ (2025).
- Rikshandboken barnhälsovård, the BVC vaccination pages.
