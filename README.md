# WorthIt

Whether a skincare product is working on your face, and when it is still too early to tell.

WorthIt is a personal test. It is not medical care, and it never calls itself a clinical trial. YouCam raw scores are the measurements. A Galaxy Watch4 records the confounders a bathroom mirror cannot see. The laptop is the ledger.

## What you need

- Node 20+
- A YouCam API key
- Optional: an Anthropic key, for phrasing only. The numbers do not depend on it.
- Optional: Supabase, if you want a second copy of the ledger and a remote delete.
- For the devices: Android Studio, a Galaxy Watch4, and a phone with Health Connect. The Watch4 has no skin-temperature sensor, so WorthIt does not pretend to read one.

## Run the desk

```bash
cd apps/web
cp ../../.env.example .env.local
npm install
npm test
npm run dev
```

Open http://localhost:3000 for the landing page, or go straight to http://localhost:3000/today and agree on the consent screen. The watch and the phone app need no pairing code.

`YOUCAM_MODE=sd` scores acne, pores, redness, and texture. HD is available per scan and costs more units. Results are cached under `apps/web/.data`, so a retry does not spend another unit.

## The three devices

**Phone, in the browser.** Camera Kit (`hdskincare` or `skincare`, strict quality) is the gated capture. An ungated photo is a separate control, used by the lighting test. Five back-to-back scans estimate instrument noise:

`MDC95 = 1.96 · √2 · SEM`

One scan a morning is a day. Days are not the five noise scans.

**Watch4, `apps/watch`.** There is no pairing step. Set `worthitServer` in `apps/watch/gradle.properties` to the laptop's Wi-Fi address (for example `http://192.168.1.8:3000`) or a deployed https URL, then run it on the watch from Android Studio. Watch events go to the account currently using the web app. The UI is four swipeable neobrutalist pages: Hands off, Today, Your product, and Setup.

- Hands Off uses the accelerometer and gyroscope, a 5-touch calibration, and a nearest-centroid classifier. A face touch buzzes and posts `/api/events`. The laptop counter is server-sent events.
- Gesture test posts labeled predictions. Lab shows precision, recall, and the confusion matrix only after those posts exist.
- Wake buzz listens for Health Services asleep-to-awake and also sets a 07:30 alarm, because that transition has to be verified on a real watch.
- The tile shows the trial day and verdict after you pull a summary.
- Heart-rate IBI / RMSSD needs Samsung's Health Sensor SDK, which is not on Maven and is not bundled. WorthIt will not invent an RMSSD. The phone can still sync sleep.

**Phone sync, `apps/phone-sync`.** Reads last night's sleep from Health Connect (Samsung Health on a Galaxy Watch writes it there) and, only when today falls inside a period record, sends `cyclePhase: menstrual`. It does not guess other phases.

## How a verdict is reached

For the concern you are testing:

`y = intercept + β · (on × adherence) + covariates + noise`

Covariates, when they exist: sleep debt below 7 hours, RMSSD z-score, face-touch count, humidity, cycle. A column with no variance is dropped. If every day is "on", the noise-floor mean is the before, so the effect can be identified.

β has a Normal-Inverse-Gamma posterior. The call is Working only when `P(β > MDC95) ≥ 0.95`. No detectable effect means the posterior sits inside the noise band. Too early is everything else. A drop lined up with days you used it is reported as moving the wrong way, not as "no effect".

The earliest honest day is a seeded Monte Carlo: the smallest n where at least 80% of simulated trials would clear that bar, given your noise and an effect size. The effect size is a measured claim when one exists, otherwise 10% of your baseline raw score. Day-to-day spread starts at a stated prior of 3.5 raw points and updates as mornings arrive, so the day can move. Prior and current are both shown.

One-side versus before/after is the same simulation. Live left-minus-right scores are used only when a YouCam mask actually splits. The split uses a MediaPipe Face Landmarker midline when the model loads, and refuses the split when either half is empty. Until then, one-side stays labeled as a simulation.

## Claim check

A pack photo is read only when `ANTHROPIC_API_KEY` is set. A barcode uses Open Beauty Facts when the product is listed. Otherwise type the claim. Skin Simulation renders it at an intensity taken from the wording, then Skin Analysis measures the render. SKIP if the measured change is inside your noise. TEST IT if it is larger. The sentence is checked against a block list (cure, treat, diagnose, guaranteed, clinical trial, and a few condition names) before it is shown.

## Shop & try on

`/shop` is a demo shelf of generic, unbranded products with no prices. In a real store the list comes from the retailer's catalogue.

- **Colour profile.** YouCam AI Facial Color Tones Analyzer reads skin, lip, eye, brow and hair colours from the latest scan photo. Shades are ranked by CIELAB distance to the skin colour (foundation, concealer) or the natural lip colour (lip tint).
- **Makeup try-on.** YouCam AI Makeup VTO applies foundation, concealer, lip colour or blush to the latest scan photo. One shade, or the whole basket in a single call, shown as a before/after slider.
- **Skincare.** Each product runs the claim check above, and "Bought it? Test it" opens Protocol with the product filled in.

## YouCam APIs used

| API | Task | Where |
| --- | --- | --- |
| AI Skin Analysis | `skin-analysis` | Every scan, and measuring Skin Simulation renders |
| AI Skin Simulation | `skin-simulation` | Claim check |
| AI Facial Color Tones Analyzer | `skin-tone-analysis` | Colour profile, shade matching, concealer |
| AI Makeup VTO | `makeup-vto` (foundation, concealer, lip_color, blush) | Shop try-on, breakout-day concealer |
| JS Camera Kit | `skincare` / `hdskincare` | Gated capture on the phone |
| File API | `POST /s2s/v2.0/file` | Uploads for every task |

Results are cached under `apps/web/.data/cache`, keyed by the image bytes and the request (not the per-upload file id), so re-running the same photo does not spend units again.

## What is deliberately not in the product

No clothing try-on, no UV coach, no aging simulation, no PDF, no community percentages, no chat. Clothing VTO and hair VTO do not answer "is my skincare worth it", so they stay out.

## Submission measurements

Do not write a number into the Devpost text until Lab shows it.

| Measurement | Where it appears |
| --- | --- |
| Lighting spread, ungated vs Camera Kit | Light |
| Noise floor, SEM, MDC95 | Today, after 5 scans |
| Hands Off precision / recall | Lab, after the watch gesture test |
| Days to detect, false-Working rate | Trial and Retail, simulated from your noise |
| One-side vs before/after | Trial |
| Scan latency, mean and p95 | Lab, from logged scans |
| Claim checker blocked/total | `npm test` |

## Layout

```
apps/web          Next.js desk
apps/watch        Wear OS, Watch4
apps/phone-sync   Health Connect
supabase/schema.sql
docs/api.md
docs/architecture.svg
```

The API contract for a second machine is `docs/api.md`.
