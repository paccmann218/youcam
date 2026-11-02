# WorthIt API

The desk is the source of truth. The watch and the phone need no pairing: `POST /api/events`, `POST /api/ingest` and `GET /api/trial` attach to the most recently active consented account when no cookie or pair code is sent (`X-Proof-Pair` / `?pair=` still work if supplied). The browser uses the `proof_uid` cookie from `POST /api/session`.

All JSON errors look like `{ "error": "..." }`.

## Session

`POST /api/session`

```json
{ "tzOffsetMinutes": 330, "consent": true }
```

Sets the cookie. Returns `{ user }`.

## State

`GET /api/state` → `{ view, status }`

`view` is the derived ledger: noise floors, daily points, verdict, lighting spreads, latency, gestures, last night. It does not contain simulated days. Those come from `/api/power`.

## Scans

`POST /api/scan` multipart

| field | |
| --- | --- |
| image | jpeg |
| purpose | `noise`, `daily`, or `lighting` |
| gated | `1` if Camera Kit accepted it |
| mode | `sd` or `hd` |
| lightLabel | lighting test only |
| groupId | lighting test only |

Needs consent. Calls YouCam Skin Analysis. `raw_score` is what gets stored.

`POST /api/scan/split`

```json
{ "scanId": "...", "halves": [{ "concern": "acne", "left": 0.2, "right": 0.4 }] }
```

## Events

`POST /api/events`

```json
{ "type": "face_touch", "payload": { "source": "watch4" } }
```

`type` is `face_touch`, `checkoff` (`payload.slot` of `morning` or `evening`), `wake`, `hr_ibi`, or `gesture_test` (`label` and `predicted` of `face` or `other`).

`GET /api/events/stream` is `text/event-stream` for the laptop counter. The browser sends its cookie. A watch can pass `?pair=`.

## Nights

`POST /api/ingest`

```json
{ "day": "2026-11-02", "sleepHours": 6.4, "rmssd": 28, "cyclePhase": "menstrual" }
```

Humidity is filled from Open-Meteo when a place has been set. Missing fields stay null. They are not zeroes.

`POST /api/place` `{ "place": "Bengaluru" }`

## Trial and watch summary

`POST /api/trial`

```json
{ "productName": "The serum", "active": "niacinamide", "concern": "acne", "design": "split_face", "startedOn": "2026-11-02" }
```

`GET /api/trial?pair=123456` is the watch summary:

```json
{ "line": "Too early to tell.", "kind": "too_early", "trialDay": 3, "faceTouches": 4, "phrase": "Same light. Same time.", "checkoffs": { "morning": false, "evening": true }, "pairCode": "123456" }
```

## The rest

`POST /api/breakout` ranks a morning where acne fell past the noise floor.

`POST /api/claim` multipart: `claim`, `name`, `barcode`, `concern`, `photo`.

`POST /api/concealer` tries a shade from skin tone, then makeup try-on.

`GET /api/power?trials=400` runs the seeded simulation from the measured noise. Cached on disk.

`DELETE /api/me` deletes the local ledger and the Supabase rows.

`GET /api/images/:name` serves a copied scan or mask. Names are basenames only.
