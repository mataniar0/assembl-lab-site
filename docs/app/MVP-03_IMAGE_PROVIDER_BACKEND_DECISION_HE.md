# ASSEMBL LAB — MVP-03: בחירת ספקי הדמיה ושרת (POC)

**תאריך:** 2026-11-14  
**סטטוס:** Research completed / candidate stack selected for synthetic-data POC only / NOT DEPLOYED.  
**אפליקציה:** Android PWA בנתיב ה־QR הקבוע; התצורה המוצעת אינה משנה את GitHub Pages.  
**תחום הפיתוח:** שלב 1 — הצעת שידת לילה בצילום חדר. מודל GLB ו־CAD אינם תחום MVP-03.

## החלטה זמנית
- **מועמד ראשי לניסוי עלות-איכות:** Gemini API — \`gemini-3.1-flash-lite-image\`. מתאים לבדיקת עריכת תמונה זולה יחסית. מחיר רשמי: כ־$0.0336 לתמונת פלט 1K **לפני עלות טקסט/תמונת קלט**, במסלול סטנדרטי, נכון לבדיקת 2026-11-14. אין להניח מכסה חינמית ל־image generation.
- **מועמד איכות להשוואה:** OpenAI Image API — \`gpt-image-2.6-sunburst\` (או Flare). תומך בעריכת תמונה והכוונה באמצעות תמונת מקור; התמחור מבוסס טוקנים ולא מחיר יציב לתמונה. דוגמת מחיר: $30 למיליון טוקני פלט תמונה ו־$8 למיליון טוקני קלט תמונה, בתוספת קלט טקסט. אין להסיק ש־Sunburst תמיד איכותי יותר בלי ניסוי.
- **Backend POC מומלץ:** Supabase Free (Functions + Postgres + Private Storage + Auth). יתרונות: רכיבים מאוחדים וניהול הרשאות, פיתוח מהיר; חסרונות: pause לאחר חוסר פעילות, אין גיבוי אוטומטי בחינם, מכסות ו־egress. המועמד החלופי הוא Cloudflare Workers + R2 (Workers Free 100,000 requests/day בכפוף ל־CPU, R2 Standard עד 10 GB-month חינם, דורש הרשמה ל־R2), עם צורך להוסיף מנגנון identity/database.
- **החלטה מחייבת מאוחרת:** בחירת ספק קבוע רק אחרי POC עם תמונות סינתטיות, בדיקות פרטיות/רישוי מסחרי, הגדרת תקציב ואישור המשתמש להפעלת חשבון/API.

## השוואת מנועי תמונות (נתוני ספק, לא תוצאות ניסוי)
| ספק/מודל | יכולת | תמחור מתועד | יתרון ל־POC | פתוח לבדיקה |
|---|---|---|---|---|
| Google Gemini 3.1 Flash Lite Image | דור/עריכת תמונות | ~ $0.0336 לפלט 1K, לפני input ועלויות אחרות | סף עלות כניסה נמוך | האם שומר על פרטי חדר, פרספקטיבה ואילוצי שידה |
| Google Gemini 3.1 Flash Image | עריכה ושיח | ~ $0.067 לפלט 1K, לפני input | השוואת דיוק/עלות בשדרוג | quality delta |
| OpenAI GPT-Image-2.6 Sunburst | עריכות מדויקות ו־markup-guided edits | $30 / 1M image output tokens + קלט | התאמת מסכת מיקום והגנה על שאר החלל | cost/sample + room preservation |
| OpenAI GPT-Image-2.6 Flare | עריכה מהירה יותר | תמחור טוקנים, לפי המודל | השוואת latency ואיכות | total cost |

*המחירים והיכולות כפופים לדפי הספק ולמנוי המסוים, ויכולים להשתנות; אין התחייבות לסכומים אלה בעת שימוש.*

## השוואת Backend
| חלופה | מה כלול | חסרון קריטי |
|---|---|---|
| Supabase Free — מועמד עיקרי | Postgres, Auth, Storage פרטי, Edge Functions; 500 MB DB, 1 GB storage, 500k invocations | פרויקטים חינמיים יכולים להיות מוקפאים אחרי חוסר פעילות; אין גיבויים אוטומטיים |
| Cloudflare Worker Free + R2 Standard | Gateway, storage פרטי; Workers Free 100k requests/day, R2 free tier 10GB-month | יותר רכיבי תשתית לחיבור למנגנון הרשאות ותור; R2 דורש הפעלת subscription |
| No backend / PWA-only | חינם ופשוט | **פסול** לחיבור AI מסחרי: כל מפתח API בצד הלקוח חשוף; אין אכיפת תקציב/בקרת גישה |

## חוזה המערכת המוצע
- אפליקציית \`/app/\` שומרת צילום מקומית עד לאישור מפורש.
- משתמש פותח פרויקט באמצעות session מזוהה או אנונימי מוגבל (מימוש ומדיניות טרם אושרו); לכל פרויקט \`owner_id\`.
- \`POST /visualization-jobs\` מקבל מזהה תמונת מקור **פרטית**, prompt ו־Design Intent, בודק הרשאות, קרדיטים, קובץ ומדיניות הסכמה, ויוצר עבודה idempotent.
- Backend בלבד פונה למודל; סוד API נגיש **רק לשרת**, לעולם לא ל־HTML או לקוד GitHub Pages.
- תוצאת התמונה נשמרת באופן פרטי כגרסה חדשה; למשתמש מוחזר URL קצר-חיים או access-controlled download.
- התיקון יוצר גרסה חדשה; \`GATE 1\` מתייחס במפורש ל־\`version_id\` המדויק.
- יוגדרו חלון שמירה, מחיקה, הסרת פרטי תמונות, אחסון מוצפן ואירועי Audit שאינם כוללים תמונות.

## צעדי ביצוע
1. **MVP-03-A:** לבחור ראשי/חלופי וספק backend באופן זמני על סמך נתונים, ללא פתיחת חשבון בתשלום.
2. **MVP-03-B:** לבנות תשתית POC עם fixture סינתטי בלבד ותמונות mock, ללא איסוף תמונות לקוח.
3. **MVP-03-C:** להגדיר rubric: שמירת מבנה חדר, זווית, מידות מוצהרות, שינוי ממוקד, תאורה/צללים, היעדר שינויים לא רצויים, latency, cost.
4. **MVP-03-D:** להגדיר מכסה ותקציב ניסוי, הרשאות משתמש ו־consent לפני צילום אמת. בלי הסכמה/חשבון API תקף ה־POC יישאר offline.
5. **MVP-03-E:** לנסות עם תמונות סינתטיות ובהמשך אמת בהסכמה; לאשר ספק רק על סמך results evidence.
6. **MVP-04/05:** Threat model + API contracts; MVP-06/07: Backend ומנוע AI אמיתי.

## תקציב פיילוט מוצע — דרוש אישור
- עד 10–20 ריצות השוואה סינתטיות ראשונות, מנוע בודד ואז מנוע חלופי לפי צורך.
- מפתח API/הרשאה מופעלים רק אחרי אישור; אין פתיחת שירותים או חיוב אוטומטי כעת.
- מדידת חיוב בפועל לפי usage; הגבלה קשיחה של מספר ריצות לפרויקט/ליום לפני פתיחה למשתמשים נוספים.

## בקרות פריסה
- אין להעלות תמונות בתי לקוחות ל־repo, ל־logs או ל־Pages.
- אין להוסיף מפתחות API או חשבונות משתמש בקובצי PWA.
- אין שינוי באפליקציה המותקנת במסגרת המחקר הזה.
- שחרור Production מחייב אישור מיוחד בנפרד, בדיקות שליליות של אבטחה, ובדיקת עלויות.
- השימוש בהדמיה — לייצוג חזותי בלבד, לא ליצירת CAD אמין מעצמו.

## מקורות רשמיים
- Google pricing: https://ai.google.dev/gemini-api/docs/pricing
- Google image capabilities: https://ai.google.dev/gemini-api/docs/image-generation
- OpenAI image editing: https://developers.openai.com/api/docs/guides/image-generation
- OpenAI GPT Image 2.6 Sunburst model: https://developers.openai.com/api/docs/models/gpt-image-2.6-sunburst
- Supabase Free/Pro: https://supabase.com/pricing
- Cloudflare Workers pricing: https://developers.cloudflare.com/workers/platform/pricing/
- Cloudflare R2 pricing: https://developers.cloudflare.com/r2/pricing/
