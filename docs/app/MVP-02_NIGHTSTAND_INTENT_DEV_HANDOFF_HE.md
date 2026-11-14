# ASSEMBL LAB — MVP-02 / Android PWA Nightstand Configurator

**מצב:** DEV_IMPLEMENTED / NOT_DEPLOYED / FORMAL_QA_DEFERRED  
**תאריך:** 2026-11-14  
**ענף:** `feature/app-mvp-02-nightstand-intent`  
**בעל ביצוע:** ChatGPT  
**דגש הנחיית משתמש:** שלבי QA העצמאי נדחו בשלב זה כדי להתחיל בפיתוח. אין לפרש דחייה כ־PASS.

## תוצרי פיתוח
- נוספו לשלב הגדרת הרהיט שני קלטים: **עומק בס״מ** ו**עובי לביד בירץ׳ 4/6 מ״מ**.
- נשמרות יכולות קיימות: רוחב, גובה, מגירה אחת/שתיים, מדף/חזית, גוון, מיקום ותקציר.
- משולב מודול `app/nightstand-intent.js` שמפיק ייצוג נתונים מובנה של גרסת העיצוב המאושרת.
- לאחר GATE 1 מוצג כפתור הורדת `assembl-lab-nightstand-vN.json`. הקובץ מכיל פרטי תכנון ולא מכיל את צילום הבית.
- עובי 4 מ״מ מוצג כקונספט בלבד; עבור 6 מ״מ מוצג טווח מועמד להנדסה ולא אישור.
- דף האפליקציה והקובץ החדש כלולים ב־Service Worker shell עם מפתח cache חדש.

## גבולות ממשק זמניים — לא כללי ייצור מאושרים
| שדה | טווח הדמיה נוכחי | טווח מועמד לתכנון הנדסי |
|---|---|---|
| רוחב | 20–90 ס״מ | 30–65 ס״מ |
| גובה | 20–100 ס״מ | 35–75 ס״מ |
| עומק | 25–60 ס״מ | 25–50 ס״מ |
| חומר | לביד בירץ׳ 4 או 6 מ״מ | 6 מ״מ בלבד כמועמד |

הטווחים ההנדסיים לעיל הם **הנחות פיתוח זמניות**, עד לאישור מידות, עומסים, עובי נמדד, kerf, שיטת חיבור, ונסטינג במסגרת MVP-11/12. אין כאן אישור מבני או פיזי.

## חוזה JSON ראשוני
- `schema_version`: `ASSEMBL-LAB.DESIGN-INTENT.0.1`.
- `category`: `freestanding_nightstand`.
- `requested_dimensions_mm`: `width`, `height`, `depth`.
- `dimension_confidence`: measured / estimated / unknown.
- `appearance`: finish / drawers / lower_section / notes.
- `placement_preview`: relative_scale / horizontal_position_percent.
- `construction_preferences`: material / nominal_thickness_mm / joining_method / construction_verified=false.
- `engineering_candidate_envelope`: WITHIN_PROVISIONAL_LIMITS / OUTSIDE_PROVISIONAL_LIMITS.
- `lifecycle_status=VISUAL_CONCEPT_ONLY`, `engineering_approval=false`, `manufacturing_approval=false`, `photo_included=false`.
- `visual_version_id`: מזהה גרסה פנימי של ההמחשה לאחר אישור.
- `visual_approval_recorded_at`: מועד אישור כפי שנרשם בדף.

**אין בגרסה הזאת API, AI, CAD או העלאת תמונות.** קובץ JSON יורד למכשיר באופן מקומי בלחיצת המשתמש בלבד.

## שינויי קוד
- `app/index.html`: שדות והודעת תיחום, כפתור יצוא, רישוי טעינה של JS מקומי ב־CSP.
- `app/nightstand-intent.js`: קליטת נתוני form, תוקף קלט, גרסאות ועימוד JSON.
- `app/sw.js`: cache versioned עם JS החדש.
- מסמך זה.

## בדיקות בסיס מינימליות (לא שער QA)
- תחביר JS של המודול וקוד ה־Service Worker.
- HTML משמר חתימת hash של script inline המקורי, וצירוף מודול חיצוני עם `script-src 'self'`.
- שמות שדות HTML ממופים לשמות הנצרכים ב־JS.
- ממשק QR ו־PWA manifest נשמרים ללא שינוי.
- אין שיחות רשת חדשות מקוד ה־MVP-02.

**לא נבדקו עדיין:** טעינת Android אמיתית של גרסה זו; הורדת JSON במכשיר; בדיקת עדכון Service Worker; כלל תרחישי הרגרסיה; איכות הנדסית; ביקורת עצמאית.

## המשך מומלץ
1. MVP-03: להשוות ספקי הדמיה/שרת, אופי חיוב ואחסון תמונות.
2. MVP-04/05: פרטיות, הרשאות וחוזה API על בסיס ה־Design Intent.
3. MVP-06/07: מימוש סביבת backend פרטית וניסוי יצירת תמונה אמיתית.
4. רק אחר כך MVP-08: חיבור PWA ל־AI, תוך עדכון הגרסה המותקנת ללא QR חדש.

## גבול פרסום
העבודה נשמרה **בענף feature בלבד**. לא בוצעו Merge/Deploy ל־main, ואין שינוי באפליקציית Android הפעילה. לאחר האישור, יש לסיים בדיקות מינימליות רלוונטיות ולפרסם עדכון.
