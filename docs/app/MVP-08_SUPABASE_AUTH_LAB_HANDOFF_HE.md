# ASSEMBL LAB / MVP-08 — חיבור ניסיוני של אפליקציית Android PWA ל־Supabase Auth ו־Data API

**תאריך:** 2026-11-15  
**סטטוס:** CODE IMPLEMENTED ON FEATURE BRANCH; NO MAIN MERGE / NO LIVE ANDROID RELEASE / USER-JWT END-TO-END NOT YET VERIFIED.

## תוצרים
- מסך נפרד ב־\`app/cloud-dev.html\` עם דוא״ל/סיסמה, כניסה ויציאה; ההרשמה העצמית הוסרה מממשק הפיילוט.
- \`app/cloud-api-core.mjs\` שולח Auth (password token, logout) וגם CRUD של פרויקט דוגמה דרך Supabase Data REST API. הרשמה עצמית אינה זמינה בלקוח.
- \`app/cloud-dev.js\` מציג נתוני שידה ומאפשר שמירה יזומה של פרויקט בענן, יצירת משימה \`MOCK_READY\` ומחיקת הפרויקט.
- קישור למסך הניסוי מתוך דף הבית ומתוך מסך אישור המראה; העברה מהאישור כרוכה בלחיצה יזומה, וחלון הענן אינו שומר בשרת עד לחיצה נוספת על "שמירה".
- \`app/nightstand-intent.js\` מעביר רק מידות/גוון/מגירות/חומר ל־\`sessionStorage\` המקומי; לא צילום, לא טקסט חופשי, לא שמות, לא מזהה מכשיר ולא מידע EXIF.
- \`app/sw.js\` שומר את מסך הבית כ־offline shell בלבד ומונע את שמירת מסך ההתחברות במטמון כ־\`index.html\`.
- \`app/cloud-dev.css\` עיצוב מותאם RTL/נייד, ללא CDN.
- \`app/cloud-api-core.test.mjs\` מבחני API עם \`fetch\` מדומה (אין מיילים אמיתיים/חשבון/תמונות/כסף בבדיקות).

## סביבה
- Supabase project: \`widfojfysblgbwswmigq\`, \`assembl-lab-dev\`, Free, \`eu-central-1\`.
- Endpoint: \`https://widfojfysblgbwswmigq.supabase.co\`.
- Frontend משתמש **רק** ב־\`sb_publishable_...\` (מפתח ציבורי ומיועד להופיע בקוד האתר); אין \`service_role\`, \`sb_secret_\` או סיסמת מסד.
- Auth credentials & JWT access token kept **in page memory only** (not localStorage, URL or service worker). Browser may optionally save passwords on its own.
- RLS already deployed for \`public.al_app_projects\` and \`public.al_app_visualization_jobs\`.
- Storage buckets remain private without app policies; no image upload from browser.

## מדיניות תמונות/תוכן
- אין תמונת חדר או הדמיה שנשמרות בענן.
- \`canonicalSyntheticIntent\` מבצע **whitelist** ומנקה \`appearance.notes\`; כל שדות image / photo / metadata לא נכנסים לבקשת Data API.
- **תשומת לב:** כאשר המשתמש מגיע מהדמיה מאושרת, *המידות שהזין עשויות להיות אמיתיות*. למרות שהעבודה מתויגת \`source_kind='synthetic'\` לפי חוזה פיילוט הבדיקה, המידות עצמן אינן בהכרח נתוני דוגמה. הכפתור מציין במפורש שהן יישלחו לענן, והשליחה דורשת פעולה יזומה.
- נדרש ייעוץ/אישור פרטיות לפני שמירת תצלומי בתים ופרטים חופשיים.
- אין קריאות Gemini/OpenAI, אין תור תמונות אמיתי, אין קבצי CAD/GLB, אין חיוב AI.

## מה דורש בדיקה בסביבת Supabase לפני פרסום ציבורי
1. **Auth → URL Configuration:** לוודא שה־Site URL ו־Redirect URLs של אימות דוא״ל מותאמים לכתובת GitHub Pages של \`/app/cloud-dev.html\`. אין לשנות Site URL של פרויקט אחר; הוא חדש ונפרד.
2. **Auth → Providers:** **לכבות Allow new users to sign up** או להפעיל שער הזמנות שקול לפני כל פרסום. דף הפיילוט כבר לא מציג כפתור הרשמה, אך **זה לא חוסם את נקודת הקצה של Supabase**. חובה לבדוק הגדרה בפועל. להגדיר אימות דוא״ל, קצב מיילים והתנהגות איפוס סיסמה.
3. ליצור שני חשבונות בדיקה בבעלות המשתמש (לא לתת לי סיסמאות); לבצע בדיקות RLS קריאה/כתיבה/מחיקה בין חשבונות אמיתיים.
4. למדוד קריאות API אמיתיות, להוכיח \`createProject -> createJob -> list/delete\` עם JWT תקף ובלי Service Role.
5. לבדוק במכשיר Android: כניסה, רענון הדף (מחייב כניסה מחודשת), התנתקות, רשת לא זמינה, בטיחות offline home.
6. להחליט על מדיניות מחיקה/שימור של **metadata** של פרויקטים; אין עדיין Retention אוטומטי.

## תחומי שימוש
- הפיילוט מוגבל לשידות לילה עומדות, 20–90 ס״מ רוחב, 20–100 גובה, 25–60 עומק, לביד 4/6 מ״מ. זה אינו טווח מאושר הנדסית.
- יש מכסת DB: עד 3 פרויקטים ו־5 משימות מדומות לכל משתמש. יצירת משתמשים חדשים ללא הגבלה עלולה לצרוך משאבים, לכן **GO/NO-GO ציבורי תלוי בהגנת Auth**.
- פעולות Data API עובדות עם JWT המשתמש ומדיניות RLS. ה־Edge Function \`app-mock-api\` קיים בשרת אך *מסך הניסוי החדש אינו קורא לו*: שימוש ישיר ב־Data REST נבחר זמנית כדי לבחון RLS ו־Auth ולמנוע תלות בקדם-בדיקת CORS של פונקציה מאומתת.
- הנתונים ניתנים למחיקה ב־DELETE של פרויקט האב (Cascade למשימות). עדיין לא נדרש מחיקת תמונות כי אינן נשמרות.

## בדיקות ומצב פרסום
- בדיקות יחידה מקומיות של הממשק נשענות על \`fetch\` מדומה ואינן מוכיחות CORS/אימות/RLS בשרת.
- GitHub Actions: \`.github/workflows/app-cloud-auth-client.yml\`.
- Site checks הרגיל עדיין נדרש כ־PR ל־main.
- ענף פיתוח: \`feature/app-mvp-08-supabase-auth-lab\`; אין לפרסם \`main\` לפני בדיקות Auth עם משתמש אמיתי, קונפיגורציית Redirect וקביעת הגבלות הרשמה.
- **אין לשתף סיסמאות, קודי אימות או JWT בצ׳אט או ב־GitHub.**

## מדריך קצר לבדיקה לאחר GO
1. פתח את \`https://mataniar0.github.io/assembl-lab-site/app/\` וגש ל"ניסוי ענן".
2. השתמש בחשבון Auth ייעודי שהוזמן או נוצר מראש בסביבת הפיתוח; חשבון חדש לא נוצר מתוך דף הפיילוט.
3. התחבר, בחר לשמור שידה לדוגמה, צור משימת \`MOCK_READY\` ומחק את פרויקט הניסוי.
4. חזור לאפליקציה הראשית, אשר מראה של שידה ובחר "ניסוי ענן"; בדוק שמועברים מידות וחומר בלבד.
5. ודא שהמכשיר אינו מעלה צילומי חדר ושסגירת הדף משחררת את אסימון הכניסה.

## סטטוס בדיקות נוספות — 2026-11-15
- Site checks ו־Auth client CI בגרסה הקודמת עברו; אחרי תיקון Gate ההרשמה נדרשת הרצה חדשה על SHA האחרון.
- בדיקות PostgreSQL עם זהויות סינתטיות ב־BEGIN/ROLLBACK: בעל פרויקט קורא אותו ואת המשימה, משתמש אחר אינו קורא ואינו מוחק; ניסיון כתיבת owner_id זר ואנונימי נדחה; UPDATE חסום.
- לפני ואחרי: auth.users=0, projects=0, jobs=0. ראיות מבוססות שאילתות באותו פרויקט.
- אין עוד הרשמה עצמית בלקוח. **לא אומת שהרשמה עצמית כבויה ב־Supabase Auth עצמו** כי אין כלי לשינוי/קריאת הגדרת GoTrue. נדרשת פעולה ידנית בלוח הבקרה.
- תרחישי RLS נשענו על SET LOCAL ROLE ו־request.jwt.claim.sub; טרם נבדק JWT שהונפק ב־Auth מול דפדפן אמיתי.
