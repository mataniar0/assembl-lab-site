# Flow V3.1 — כתף מעוגלת / R_ROUNDED_SHOULDERS

מימוש ההצעה שהוצגה בתלת־ממד, לפי בקשת בעל התכנון. החלופה המעוגלת מבוססת **רק על R_RAIL_REINDEX** מתוך `d252377e9a929578f75d8ae121e2d21bbd029c05`. חלופות R ו־L הקודמות וכל מקור V3 נשמרים. ללא פלטה עליונה.

## שינוי התכנון

בכל אחת משמונה הרגליים נוספה כתף מקומית העוקבת אחר השפה התחתונה של הקורה שמעליה, ואחריה מעבר מעוגל ומשיק אל קו הרגל המקורי. עיגול בחיסור בלבד היה מגדיל את המרווח; לכן השינוי כולל בעיקר תוספת חומר קטנה, עם הסרה מקומית בקצה המעבר.

זהו מעבר Bézier משיק, **לא רדיוס מעגלי קבוע**. במערכת הקואורדינטות המקורית של הרגל:

- תחום השינוי מוגבל ל־U≥156, V≥386 מ״מ. כל שאר הפרופיל נשמר.
- התחום U156..164 עוקב אחר תחתית הקורה האמיתית באורך 8 מ״מ, ללא היסט חדש.
- המעבר מתחיל ב־U164 על תחתית הקורה ומסתיים בשפה המקורית ב־V386. ידיות הבקרה הן 2.5 מ״מ בכיוון U במשיק הקורה ו־2.7 מ״מ לאורך משיק שפת הרגל. המשיק הסופי נמדד מקו המקור, לא הומצא.
- הקו התחתון של הקורה נשמר כפי שנדגם במקור; המעבר מיוצא כ־100 מקטעי פוליליין. אין שינוי לקורה כדי לכפות התאמה.
- כל ארבע הלשוניות העליונות בכל רגל, החריץ התחתון, החורים והשדרה המשולבת נשמרים. כל 19 מטריצות ההרכבה זהות ל־R הקודמת.
- השפות הקרובות והרחוקות של הקורות אינן זהות. לכן יש ארבעה דפוסי רגל מפורשים: A_NEAR, A_FAR, B_NEAR, B_FAR, שני חלקים מכל דפוס. אין להחליף ביניהם.

התוספת לכל רגל כ־16.71–23.47 ממ״ר; ההסרה כ־0.76–0.91 ממ״ר. המרווח המקורי בנקודת U166 היה כ־2.37–3.01 מ״מ. בקטע המעקב U156..164 נסגר המרווח הנומינלי; לאחריו הפרופיל מתרחק בהדרגה מן הקורה במעבר המעוגל. אין טענה שכל חלל סביב החיבור בוטל.

לעומת V3: שתי תבניות קורה וארבע תבניות רגל משתנות, 12 חלקים פיזיים. 3 הקורות הפנימיות ו־4 הבסיסים נשמרים — 7 חלקים מקוריים. לעומת R הקודמת: משתנות רק 8 הרגליים. בסך הכול 9 דפוסים ו־19 חלקים; המעטפת נשארת 860×480×450 מ״מ. זו פשרה חזותית מודעת מול R המקורית שחייבה רק שתי תבניות חדשות.

## קבצים לביקורת

- [STEP מלא](artifacts/R_ROUNDED_SHOULDERS/FLOW_V31_CANDIDATE_FULL_19_DESIGN_ONLY.step) · [GLB מלא](artifacts/R_ROUNDED_SHOULDERS/FLOW_V31_CANDIDATE_FULL_19_DESIGN_ONLY.glb)
- [DXF נפרדים המסומנים V31_CANDIDATE / DESIGN_ONLY](artifacts/R_ROUNDED_SHOULDERS/dxf/) — יש להשתמש בסט קוהרנטי זה בלבד.
- [קדמי](artifacts/R_ROUNDED_SHOULDERS/front.png) · [צד](artifacts/R_ROUNDED_SHOULDERS/side.png) · [תחתון](artifacts/R_ROUNDED_SHOULDERS/underside.png) · [עליון](artifacts/R_ROUNDED_SHOULDERS/top.png)
- [תקריב מעוגל](artifacts/R_ROUNDED_SHOULDERS/detail.png) · [אותו תקריב לפני השינוי](artifacts/R_ROUNDED_SHOULDERS/detail-before.png)
- [שכבות שינוי ממודדות לארבעת דפוסי הרגל](artifacts/R_ROUNDED_SHOULDERS/shoulder-overlay.svg) — ירוק: תוספת; אדום: הסרה; מקווקו: הפרופיל הקודם.
- [פינה](artifacts/R_ROUNDED_SHOULDERS/corner.json) · [171 זוגות](artifacts/R_ROUNDED_SHOULDERS/pairs-171.json) · [32 חיבורים](artifacts/R_ROUNDED_SHOULDERS/joints-32.json)
- [בדיקת DXF/STEP/GLB עצמאית](artifacts/R_ROUNDED_SHOULDERS/independent-qc.json) · [בדיקת שינוי הכתף העצמאית](artifacts/R_ROUNDED_SHOULDERS/shoulder-qc.json)
- [כמויות ושינוי מדויק מול V3](artifacts/R_ROUNDED_SHOULDERS/bom-and-delta.json) · [מטריצות](artifacts/R_ROUNDED_SHOULDERS/transforms.json) · [פרמטרים וספירת סבבים](artifacts/R_ROUNDED_SHOULDERS/study.json)
- [בדיקת תאימות לאחור](artifacts/R_ROUNDED_SHOULDERS/backward-compatibility.json): כל 7/9 פרופילי R/L ו־19 המטריצות בכל חלופה זהים למחולל מה־SHA הקודם.
- [תקציר ממוחשב](artifacts/R_ROUNDED_SHOULDERS/summary.json) · [glTF](artifacts/R_ROUNDED_SHOULDERS/gltf-validation.json) · [דפדפן](artifacts/R_ROUNDED_SHOULDERS/browser-qc.json) · [SHA256](artifacts/R_ROUNDED_SHOULDERS/SHA256SUMS)

## קבלת התכנון

| בדיקה | תוצאה |
|---|---|
| פינת ייחוס: חיבורים מלאים וללא חדירה | PASS |
| 19 חלקים / 171 זוגות | PASS, ללא התנגשויות מעל 1e−5 ממ״ק |
| 32 חיבורים נדרשים / גרף מחובר של 19 חלקים | PASS |
| 32 לשוניות: 720 ממ״ק לכל לשונית, 120 ממ״ר מגע עליון | PASS |
| 8 מקבלי בסיס: 216 ממ״ק, 36 ממ״ר מגע לכל אחד | PASS |
| 4 בסיסים: מרכזי לשוניות וחריצים חופפים | PASS |
| מגע שדרה אנכי A/B: 2280 ממ״ר בכל פינה | PASS |
| שינוי כתף מקומי בלבד / חורים ומיקומי חיבורים נשמרו | PASS |
| בדיקה עצמאית מתוך DXF מיוצא, ללא ייבוא מחולל התכנון | PASS |
| STEP נפתח מחדש כ־19 גופים תקינים; GLB עם 19 רשתות סגורות | PASS |
| בדיקת glTF ללא שגיאות או אזהרות | PASS |
| ארבע זוויות ותקריבי לפני/אחרי בדפדפן | PASS |
| V3 וכל תוצרי R/L הקודמים נשמרים | PASS |
| בדיקות אתר: 66 PASS, אפס כשל ואפס פניות אמיתיות | PASS |
| התאמה פיזית, רצף הרכבה, Kerf, חוזק ויציבות | לא בוצעו |
| אישור חיתוך לייצור | לא ניתן |

הבדיקה העצמאית משחזרת גופים מה־DXF בקוד נפרד, בודקת חדירות ומידות, ובודקת בנפרד את שינוי הכתף מול R השמורה. בקטע המעקב נדגמות 161 תחנות לכל רגל; שגיאת התאמה מרבית מותרת 0.0002 מ״מ מול הפוליליין המקורי. זהו סף בדיקה גיאומטרי, לא מרווח חיתוך. עובי נומינלי 6 מ״מ, מרווח תכנוני 0, ללא פיצוי Kerf.

## סבבים והמלצה

**סבב שינוי תכנון אחד**, בעקבות בקשת העיגול וההמחשה שאושרה לביצוע; **סבב תיקון גיאומטרי אחד**, **0 תיקוני סקריפט** בעדכון זה. הדגימה האחידה הראשונית גישרה על קודקודי פוליליין מקוריים ויצרה מרווח מרבי של 0.000245569 מ״מ ב־B_NEAR, מעל סף 0.0002 מ״מ שנקבע. התיקון כולל את כל קודקודי הקורה המקוריים בקטע המעקב; סף הבדיקה נשמר. [כשל וקובצי הרגל הראשוניים](artifacts/R_ROUNDED_SHOULDERS/attempts/01-rail-sampling-gap/). לאחר התיקון כל הבדיקות הורצו מחדש. שני תיקוני הסקריפט מהמחקר הקודם נשארים מתועדים בנפרד ולא נמחקים או נספרים שוב. הצעת התצוגה הקודמת היא אותו מחזור עיצוב, לא מועמד הנדסי נוסף.

ההמלצה למראה המבוקש היא **R_ROUNDED_SHOULDERS**, תוך הכרה בתוספת ארבע תבניות רגל שונות. R הקודמת נשארת חלופת מינימום שינוי למי שמעדיף למחזר רגליים קיימות. סטייה נומינלית אפס ומגע CAD אינם אישור להתאמה בעץ: נדרשים ביקורת מנהל, קופוני חיבור והרכבה פיזית לפני ייצור.

ענף: `feature/al-016-flow-v31-options`. טיוטת PR #121 לביקורת בלבד; יעד `feature/33-flow-v3-cad`. SHA מדויק נמסר במסירה. אין Merge, Deploy או שינוי מקור V3.

## שחזור

לאחר התקנת `requirements.txt` וספריות Three/glTF המפורטות ב־OPTIONS.md:

```sh
/workspace/work/venv-cad/bin/python engineering/flow-v31/build.py R_ROUNDED_SHOULDERS
/workspace/work/venv-cad/bin/python engineering/flow-v31/verify.py R_ROUNDED_SHOULDERS
/workspace/work/venv-cad/bin/python engineering/flow-v31/verify_shoulder.py
node engineering/flow-v31/validate_glb.cjs R_ROUNDED_SHOULDERS
python engineering/flow-v31/shoulder_browser.py
/workspace/work/venv-cad/bin/python engineering/flow-v31/shoulder_overlay.py
python scripts/check_site.py
/workspace/work/venv-cad/bin/python engineering/flow-v31/finalize_shoulder.py
```

הסקריפטים הקיימים ללא ארגומנט ממשיכים לייצר את שתי החלופות ההיסטוריות בלבד; הארגומנט המפורש מבודד את העדכון מתוצריהן. הסקריפט הסופי מעדכן את רשימת ה־SHA256 של חבילת התוצרים כולה.
