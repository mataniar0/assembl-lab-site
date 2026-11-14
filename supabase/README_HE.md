# ASSEMBL LAB — MVP-06: Supabase Development Baseline

**סטטוס:** CODE_READY_FOR_LOCAL_VALIDATION / NOT_CONNECTED / NOT_DEPLOYED  
**מקור:** מסמכי MVP-02/03/04/05 וה־Backend mock מ־PR #56.  
**תלות:** PR #56 חייב להיטמע לפני העברת הענף הזה ל־main.  
**בעלות:** ChatGPT — קוד ומבחנים; בעל הפרויקט — חשבון, הרשאות, מדיניות, אישור כל שימוש בתמונות/כספים.  
**הערה:** המשתמש ביקש לדחות QA עצמאי ולהמשיך בפיתוח; הבדיקות המינימליות אינן אישור מערכת ייצור.

## היקף
- **Auth:** Edge Function עם \`withSupabase({auth:'user'})\`, בדיקת JWT בעזרת Supabase gateway.
- **DB:** שתי טבלאות \`public.al_app_projects\` ו־\`public.al_app_visualization_jobs\`, עם RLS של בעל הפרויקט.
- **API:** Edge Function בשם \`app-mock-api\`, שמטפלת רק בפרויקטים/משימות סינתטיים.
- **Idempotency:** מפתח ייחודי לכל משתמש ב־DB; בקשה חוזרת מחזירה את אותה משימה.
- **Limits:** עד 3 פרויקטי דוגמה ועד 5 משימות דוגמה לכל משתמש, באכיפה טרנזקציונית ב־Postgres (לא מגבלת חיוב של מנוע AI).
- **Storage:** שמות buckets שמורים \`al-app-room-inputs\` ו־\`al-app-room-previews\`; private=true; בלי מדיניות \`storage.objects\` שמאפשרת גישת לקוחות.
- **Privacy:** אין תמונות, אין מנוע AI, אין מפתח ספק, אין קוד לפנייה לספק בתשלום; \`status=MOCK_READY\` בלבד.

## קבצים
- \`config.toml\` — \`verify_jwt=true\`.
- \`migrations/20261114224500_app_synthetic_private_baseline.sql\` — טבלאות, RLS, מגבלות והרשאות אחסון.
- \`functions/app-mock-api/index.ts\` — API מאומת במשתמש, מבוסס RLS.
- \`functions/app-mock-api/synthetic-logic.mjs\` — סינון והלבנת נתונים לפני שמירה.
- \`functions/app-mock-api/synthetic-logic.test.mjs\` — מבחני חוזה/קלט.
- \`tests/rls_synthetic.sql\` — בדיקות Postgres דרך pgTAP, לא הורצו עד כה כי אין stack מקומי/חיבור Supabase.

## דרכי עבודה מאובטחות
1. לאחר חיבור חשבון Supabase, ליצור **פרויקט פיתוח ייעודי ונפרד** (לא פרויקט שמשותף ללקוחות אמיתיים).
2. על סביבת פיתוח מקומית עם Supabase CLI ו־Docker, לבדוק שהמיגרציה תקינה: \`supabase start\`, \`supabase db reset\`, \`supabase test db\`. **פעולת reset מוחקת נתוני DB מקומיים**, ולכן להריץ רק בסביבה ייעודית/זמנית. לא לבצע \`--remote\` או \`--linked\` בלי כוונה מפורשת.
3. לבדוק ידנית עם שני משתמשי Auth בדויים: קריאה/מחיקה של פרויקט משתמש א׳ בידי משתמש ב׳ חייבות להיכשל; גם ניסיון כתיבה ישירה ל־storage חייב להיכשל.
4. לבחון migration diff לפני כל החלה בענן. אין להחיל migration על סביבת ייצור ללא גיבוי/סקירה.
5. כש־DB מקומי תקין והחשבון מחובר, לפרוס Edge Function ל־staging בלבד. לעולם לא לפרסם credential או secret של Supabase בקוד HTML ציבורי.
6. להפעיל את ה־API עם JWT אמיתי, ולוודא \`source_kind=synthetic\` בלבד והפרדה בין משתמשים.
7. רק לאחר תכנון Retention, מחיקה, CORS מוגבל, בקרת עלות ו־Consent, להוסיף גרסת שרת שיכולה לקבל צילום אמיתי.

## מה *אינו* מוכן
- אין פרויקט Supabase מחובר, ולכן אין DB או Functions שפורסמו; אין מספר פרויקט או URL של שרת.
- לא בוצעה ריצת Postgres מיגרציה מקומית/בענן; בדיקות סטטיות בלבד עד חיבור סביבת DB.
- אין ממשק Login/Sign-in ב־PWA. ל־Edge Function אין כרגע CORS לדפדפן, בכוונה.
- אין ממשק upload או signed URLs. הבקטים פרטיים ללא מדיניות לקוח; תחומי הגישה של Storage בכל פרויקט קיים אחר דורשים אימות.
- אין חשבון AI בתשלום, כרטיס אשראי, תמונת משתמש, ייצור GLB או CAD.
- אין עדיין תורי עבודה durable, לוח זמנים למחיקה, audit log אמיתי, או עמידות production תחת עומס.
- לא בוצע Merge ל־main, ואין שינוי באפליקציית Android המותקנת.

## שערי המעבר הבאים
- **MVP-06-B:** חיבור/יצירת פרויקט Supabase פיתוח ואז migration + RLS test בפועל.
- **MVP-07:** ניסוי עם תמונת חדר סינתטית בלבד אצל ספק AI מאושר בתקציב מוגדר; אין אישור אוטומטי להוצאות.
- **MVP-08:** אחרי אבטחה ופרטיות — UI עם התחברות, הסכמה לפני העלאה, שמירת גרסאות ואישור GATE 1.

## מקור הנחיות
- https://supabase.com/docs/guides/functions/auth
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/storage/security/access-control
- https://supabase.com/docs/guides/local-development/cli-workflows
