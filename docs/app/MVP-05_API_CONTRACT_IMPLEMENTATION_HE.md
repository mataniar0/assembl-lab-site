# MVP-05 — חוזה API ראשוני והפרדה בין מצב Mock למצב אמת

**סטטוס:** IMPLEMENTED AS SYNTHETIC LOCAL DEV API ONLY.  
**מטרה:** לייצב חוזה בין Design Intent של MVP-02, יוצר ההוראות MVP-03 ושרת עבודות ללא AI בפועל.

## קלט ותנאי סף
- \`POST /api/v1/visualizations\` — Authorization: Bearer token (DEV), \`X-Dev-Session\`, \`Idempotency-Key\` (16–96 chars).
- Content-Type: application/json, גוף קטן מ־32KiB, מחייב \`source_kind: "synthetic"\` ו־\`design_intent\` תואם \`ASSEMBL-LAB.DESIGN-INTENT.0.1\`.
- מבנה Example (מקור נתונים בדוי): \`{"source_kind":"synthetic","design_intent": { ... }}\`.
- בדיקות שדה: category שידת לילה, width/height/depth במ״מ, גוון, drawers, lower_section, confidence ועובי 4/6 מ״מ.
- אין תמונה בשלב זה: \`photo\` / \`image\` / \`image_url\` / \`image_base64\` נדחים.

## משאבים ו־HTTP codes
| Endpoint | הצלחה | כישלון צפוי |
|---|---|---|
| \`GET /health\` | 200 synthetic mode | — |
| \`POST /api/v1/visualizations\` | 201 CREATE / 200 REPLAY | 400 malformed or missing keys, 401 auth, 409 idempotency conflict, 413 oversized, 415 type, 422 unsupported data, 429 quota |
| \`GET /api/v1/visualizations/{uuid}\` | 200 mock job | 401 auth, 404 not found/not owned |
| \`DELETE /api/v1/visualizations/{uuid}\` | 200 deleted | 401 auth, 404 not found/not owned |

## מצב עבודה
\`MOCK_READY\` הוא **מצב תרגול בלבד**; אין תמונה שנוצרה. השדה \`output_image_url\` הוא null.
\`engineering_approval=false\` ו־\`manufacturing_approval=false\`, גם אחרי אישור הדמיה חזותית.
כל הסטטוסים וכל חותמות הזמנים בזיכרון בלבד; שרת מחדש מוחק הכול.

### State machine עתידי — לא ממומש
\`DRAFT -> CONSENTED -> UPLOADED_PRIVATE -> QUEUED -> IMAGE_RUNNING -> IMAGE_READY -> GATE_1_APPROVED -> VISUAL_3D_RUNNING -> GATE_2_APPROVED -> CAD_REVIEW -> GATE_3_APPROVED\`.

מעברי כשל: \`REJECTED\`, \`NEEDS_REVIEW\`, \`FAILED\`, \`EXPIRED\`, \`DELETED\`. אף שלב אינו מדלג אוטומטית על GATE אחר.

## חוזה זהות ל־Production (לא קיים במוק)
- Backend מאמת JWT או session הרשאת משתמש בשכבת שרת.
- \`owner_id\` נגזר מ־Auth בלבד, **לא** משדה HTTP שהלקוח יכול להמציא.
- מידע ותמונות נשמרים ב־Private Storage עם RLS ו־signed URLs קצרים.
- ייחודיות Idempotency נסמכת על DB, לא זיכרון.
- יש לתעד מחיקה, עלות ו־approval version IDs בתנועות DB אטומיות.
- סוד ספק AI נשמר בשרת ונפרד ממפתחות שאפשר להציג בקליינט.

## עקיבות
- MVP-02: \`app/nightstand-intent.js\` -> יצוא JSON מקומי לאחר GATE 1.
- MVP-03: \`prototype/app-mvp-03/room-edit-contract.mjs\` -> בונה הוראות ומגן על תיאור תמונת חדר.
- MVP-06: \`prototype/app-mvp-06/mock-store.mjs\` + \`server.mjs\` -> חיי משימה מדומים.
- MVP-07/08: להוסיף תמונה סינתטית ואז ספק AI בפועל אחרי הקמת זהות ופרטיות.

## אחריות
- משתמש ביקש לדחות QA פורמלי, לא לבטל checks הנחוצים למניעת תמונת לקוח חשופה.
- אין כרגע סביבת Supabase מחוברת, ולכן לא נטען ל־Cloud Backend deployed.
