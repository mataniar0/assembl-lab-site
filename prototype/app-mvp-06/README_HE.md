# ASSEMBL LAB MVP-06 — Local Synthetic Backend POC

**סטטוס:** קוד פיתוח בלבד, *לא* שרת פרודקשן; *לא* מחובר לאפליקציית אנדרואיד. אין העלאת תמונות, אין AI, אין חיוב ואין קבצים הנדסיים.

## הפעלה למפתח מקומי
נדרש Node 20+; אין התקנת תלויות.

1. מגדירים משתנה סביבה מקומי עם סוד פיתוח **שלא הועלה ל־GitHub**: \`ASSEMBL_LAB_LOCAL_DEV_TOKEN\` — 24 תווים לפחות.
2. מפעילים: \`node prototype/app-mvp-06/server.mjs\`.
3. השרת מאזין אך ורק ל־\`127.0.0.1:8787\`, ללא CORS או גישת רשת מרחוק.
4. מספקים בקשות JSON עם כותרות \`Authorization: Bearer <local-secret>\`, \`X-Dev-Session: synthetic_owner_001\` ו־\`Idempotency-Key: example_request_00001\`.
5. גוף בקשה: \`{"source_kind":"synthetic","design_intent": ...}\` כאשר design_intent הוא המבנה שבקובץ \`../app-mvp-03/synthetic-intent.json\`.

## בדיקות
\`\`\`bash
node --test prototype/app-mvp-03/contract.test.mjs prototype/app-mvp-06/server.test.mjs
\`\`\`
CI: \`.github/workflows/app-backend-contract.yml\`.

## מגבלות
- \`X-Dev-Session\` **אינו מערכת זיהוי**. אין לאפשר פתיחת שרת זה לאינטרנט, לא להעלות אליו תמונות אמיתיות.
- הבקשות נשמרות רק בזיכרון; quota/idempotency אינם עמידים לכיבוי או למתקפות.
- שלב UI של Android PWA לא מחובר לשרת; כל עוד לא בוצעו Auth + Storage פרטיים + consent + rate-limit + תקציב, זהו POC בלבד.
- סגירת תהליך Node מוחקת את כל העבודות.
- \`MOCK_READY\` = mock JSON response בלבד, ללא image output.
- לצורך פרסום השירות הבא יידרש חיבור Supabase או ספק equivalent, פעולת משתמש לאישור חשבון/סודות, והקמת backend נפרד.
