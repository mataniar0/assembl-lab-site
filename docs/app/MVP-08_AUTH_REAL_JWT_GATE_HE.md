# ASSEMBL LAB — MVP-08 / שער אימות Auth אמיתי עם שני משתמשים

**תאריך:** 2026-11-16
**סביבה:** `assembl-lab-dev` / `widfojfysblgbwswmigq`
**סטטוס בפועל:** **NO_GO** — `disable_signup=false`; אין חשבונות פיילוט, JWT אמיתי או E2E מאומת. אין מיזוג/הפצה.

## מה אומת בפועל היום
1. **קריאת Supabase Auth חיה ללא הרשאות:** `GET /auth/v1/settings`, באמצעות מפתח `sb_publishable_...` הציבורי. התוצאה: `disable_signup=false`, התחברות דוא"ל פעילה, אישור דוא"ל נדרש, כניסה אנונימית כבויה.
2. ראיה: https://github.com/mataniar0/assembl-lab-site/actions/runs/43885472472 — שש בדיקות probe עברו, ו־release gate `NO_GO`.
3. **מסד PostgreSQL חי:** `supabase/tests/rls_pilot_behavioral.sql` הורץ מחדש בהצלחה בטרנזקציית `BEGIN...ROLLBACK`: בעל פרויקט מאושר, משתמש לא מאושר, משתמש מאושר אחר, התחזות דרך `user_metadata`, שינוי/מחיקה/כתיבה ואנונימי.
4. אימות לאחר הבדיקה: `auth.users=0`, `auth.sessions=0`, `al_app_projects=0`, `al_app_visualization_jobs=0`; לא נותרו נתוני ניסיון.
5. **בדיקות קוד:** בדיקות לקוח, דפדפן מדומה, ו־runner חדש התומך בשני משתמשים; הן אינן הוכחת JWT חי. 
6. **לא הושלם:** לא ניתן לשנות Config של GoTrue או ליצור שני משתמשי Auth באמצעות כלי Supabase המחוברים הזמינים; לפיכך לא ניתן להגדיר `disable_signup=true` או להוכיח שני JWT אמיתיים באופן עצמאי מתוך הצ'אט.

## פעולות נדרשות בלוח הבקרה (בידי מנהל הפרויקט בלבד)

1. בכתובת https://supabase.com/dashboard/project/widfojfysblgbwswmigq/auth/providers או `Authentication → Settings → General`: **לכבות** `Allow new users to sign up` ולשמור. השאר `Confirm Email` פעיל, `Email` פעיל, ו־`Anonymous sign-ins` כבוי.
2. בכתובת https://supabase.com/dashboard/project/widfojfysblgbwswmigq/auth/url-configuration : להגדיר Site URL תקף ולהוסיף ל־Redirect URLs רק את נתיבי הפיילוט המיועדים. `https://mataniar0.github.io/assembl-lab-site/app/cloud-dev.html` אינו נתיב שפעיל ב־main כל עוד PR #61 לא מוזג; **לא להשתמש בו כרגע כאישור שהמסך זמין**. לצורך בדיקת password login ישירות מול GoTrue לא נדרש callback.
3. בכתובת https://supabase.com/dashboard/project/widfojfysblgbwswmigq/auth/users : ליצור שני חשבונות פיילוט נפרדים, בבעלותך בלבד, דרך תהליך אדמין רשמי. לא לשמור סיסמאות, קישורי אישור, קודי OTP, JWT או מפתחות שירות ב־GitHub Issues/PR, בצ'אט או בקבצי מאגר. אם משתמש מוזמן בדוא"ל, יש לוודא תחילה שהקישור ומנגנון ההגדרה של הסיסמה מובילים לכתובת תקפה.
4. להעניק **למשתמש A בלבד** `app_metadata.assembl_lab_pilot = "enabled"`, בפעולת Auth Admin מהימנה (לא `user_metadata`). ליצור JWT טרי באמצעות כניסה מחדש. ל־B לא להעניק הרשאה בתחילה.
5. להשלים בדיקת `before_grant_b`; אז להעניק גם ל־B הרשאת פיילוט דרך אותו מנגנון Admin, להיכנס מחדש כדי לקבל JWT טרי ולהשלים `after_grant_b`.
6. לאחר סיום הבדיקות יש להחליט אם להשאיר/לבטל את חשבונות הבדיקה. יש לבטל Session או להמתין לפקיעת JWT; מחיקת משתמש לבדה אינה מבטלת JWT שהונפק.

**חשוב:** במידת הצורך ניתן להעניק `app_metadata` דרך Supabase Auth Admin API `updateUserById` בשרת מהימן, אבל לעולם לא דרך מפתח Secret/Service Role בתוך JavaScript ציבורי. תיעוד: https://supabase.com/docs/reference/javascript/auth-admin-updateuserbyid

## בדיקות שתי הזהויות — runner מוכן, טרם בוצע בשרת

`tests/app_auth_real_e2e.mjs` משתמש ב־Node 22 ומחייב 4 משתני סביבה זמניים ושם שלב. הוא מתחבר לחשבונות A ו־B עם סיסמה, קורא JWT אמיתי של GoTrue, מאמת פרטי JWT מול `auth.user.id`, ואחרי כן מבצע קריאות Data API עם אותו JWT; הבדיקה בשרת מאמתת חתימת JWT ולכן אינו מדובר ב־claims סינתטיים.

### הפעלה ממחשב מהימן בלבד (בסביבת פרויקט מקומית)
```bash
# לעבור לענף feature/app-mvp-08-supabase-auth-lab
# להזין משתני סביבה במחשב המקומי, לא ב-GitHub או בצ'אט
read -r -p 'Account A email: ' AL_AUTH_A_EMAIL
read -r -s -p 'Account A password: ' AL_AUTH_A_PASSWORD
printf '\n'
read -r -p 'Account B email: ' AL_AUTH_B_EMAIL
read -r -s -p 'Account B password: ' AL_AUTH_B_PASSWORD
printf '\n'
export AL_AUTH_A_EMAIL AL_AUTH_A_PASSWORD AL_AUTH_B_EMAIL AL_AUTH_B_PASSWORD

AL_AUTH_PHASE=before_grant_b node tests/app_auth_real_e2e.mjs
# לאחר מתן app_metadata ל־B, התחברות רעננה:
AL_AUTH_PHASE=after_grant_b node tests/app_auth_real_e2e.mjs

unset AL_AUTH_A_EMAIL AL_AUTH_A_PASSWORD AL_AUTH_B_EMAIL AL_AUTH_B_PASSWORD
```

אם הפעלת הסקריפט נכשלה, הוא מציג רק קוד כשל כללי, ללא סיסמאות, JWT או הודעות ספק מלאות. הוא כותב רק נתוני שידה **סינתטיים**, ומכין מראש מזהה לכל פרויקט כדי לאפשר ניקוי גם במקרה של זמן תגובה ארוך. במקרה של תקלה בניקוי הוא מדווח `CLEANUP_FAILED` ויש לוודא ידנית שאין פרויקטי בדיקה.

### קריטריוני PASS אמיתיים
- `/auth/v1/settings`: `disable_signup=true`, `external.email=true`, `mailer_autoconfirm=false`, `anonymous_users=false`.
- `before_grant_b`: A מאושר, B אינו מאושר; A יוצר פרויקט ומשימת `MOCK_READY`; B אינו קורא, מוחק או יוצר פרויקט משלו; JWT שגוי נחסם.
- `after_grant_b`: שתי זהויות מאושרות בעלות JWT חדש; כל משתמש יוצר, קורא ומוחק רק את שלו; השני אינו קורא או מוחק.
- אחרי כל הרצה: פרויקטי הבדיקה נמחקו ו־`/auth/v1/logout` הצליח. אין העלאת תמונות, יצירת AI או חיוב.
- בדיקת מובייל ומחשב דרך מסך הפיילוט, CORS, CSP, חידוש אסימון, השפעת logout, הודעות שגיאה ונגישות היא שער נוסף לפני הפצה.
- G5: בדיקת QA אנושית נפרדת + אישור בעל הפרויקט למיזוג PR #61 ולפרסום — לא בוצעו.

## סטטוס שאסור לטשטש
**בדיקת ה־RLS ב־SQL מדמה תביעות JWT אך אינה מנפיקה JWT חתום.** בדיקת ״שני משתמשים״ הממוכנת החדשה עושה סימולציה בלבד ב־CI. הבדיקה החיה של `GET /auth/v1/settings` מאמתת הגדרות ציבוריות בלבד. אף אחת מהן לא מחליפה את הרצת `app_auth_real_e2e.mjs` לאחר יצירת חשבונות אמיתיים.

## החלטת סיום
- **קוד הבדיקות, תיעוד, בדיקות SQL וקריאת הגדרות חיה — PASS**.
- **שינוי הגדרות GoTrue ו־JWT אמיתי לשני משתמשים — BLOCKED, פעולה נדרשת בבקרת מנהל Supabase**.
- **אין אישור מיזוג/הפצה**, ללא תמונות לקוח וללא עלות AI.
