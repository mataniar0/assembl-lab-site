# Flow V3.1 — מסירה לביקורת / Issue #36

**עדכון כתף מעוגלת:** לבקשת בעל התכנון נוספה חלופה נפרדת **R_ROUNDED_SHOULDERS**, המבוססת על R ושומרת את מיקומי החיבורים. [מסירת העדכון, הבדיקות והוראות השחזור](ROUNDING.md). שתי החלופות המקוריות להלן נשמרות כראיות היסטוריות; השינוי החזותי אינו מחליף או מאשר קובצי V3.

- מעודכן: [GLB](artifacts/R_ROUNDED_SHOULDERS/FLOW_V31_CANDIDATE_FULL_19_DESIGN_ONLY.glb) · [STEP](artifacts/R_ROUNDED_SHOULDERS/FLOW_V31_CANDIDATE_FULL_19_DESIGN_ONLY.step) · [DXF](artifacts/R_ROUNDED_SHOULDERS/dxf/) · [תקריב](artifacts/R_ROUNDED_SHOULDERS/detail.png) · [דוח PASS/FAIL וסבבים](ROUNDING.md).

**שתי החלופות עברו אימות CAD ממוחשב מלא. ההמלצה לביקורת מנהל הפרויקט היא R_RAIL_REINDEX.** אלו מועמדי תכנון ללא פלטה; אין אישור חיתוך לייצור, התאמה פיזית, עומסים, Merge או Deploy.

לכל חלופה הופקו19 גופים,171 בדיקות זוגות ללא התנגשות,32 חיבורים עם מגע חיובי, STEP שנפתח מחדש, GLB תקין, קובציDXF נפרדים המסומניםV31_CANDIDATE וארבע הדמיות. קובציV3 המקוריים וראיות הכשל נשמרו ללא שינוי.

| חלופה | שינוי | תוצאה ממוחשבת | דפוסים/חלקים ששונו |
|---|---|---|---|
| **R — מומלצת** | הזזת מקבלי הרגל בקורות:‎+6 מ״מ בקצה הקרוב,‎−11 מ״מ בקצה הרחוק; שימור הרגליים והבסיס | PASS |2 /4 |
| L | חיתוך פנימי מקומי של שפת הרגליים, התאמת לשוניות הבסיס ובסיס ברדיוס9.5 מ״מ | PASS |5 /12 |

R משמרת15 חלקים פיזיים מקוריים, את שטח הבסיס ואת כל צורת הרגליים, ומקטינה את שטח השינוי הכולל פי6.34 לעומתL. ב־L שטח הבסיס קטן ב־45.19% ונחלש פרט מקומי סביב חריץ הרגל; לכן היא חלופה משנית למרותPASS גיאומטרי.

- [ניתוח החלופות, כל בדיקות PASS/FAIL, סבבי התיקון והוראות השחזור](OPTIONS.md)
- [דוח שינויים מפורט מולV3](SOURCE_DIFF.md)
- R: [STEP מלא](artifacts/R_RAIL_REINDEX/FLOW_V31_CANDIDATE_FULL_19_DESIGN_ONLY.step), [GLB מלא](artifacts/R_RAIL_REINDEX/FLOW_V31_CANDIDATE_FULL_19_DESIGN_ONLY.glb), [DXF מועמדים](artifacts/R_RAIL_REINDEX/dxf/), [171 זוגות](artifacts/R_RAIL_REINDEX/pairs-171.json), [בדיקה עצמאית](artifacts/R_RAIL_REINDEX/independent-qc.json)
- R: [קדמי](artifacts/R_RAIL_REINDEX/front.png), [צד](artifacts/R_RAIL_REINDEX/side.png), [תחתון](artifacts/R_RAIL_REINDEX/underside.png), [עליון](artifacts/R_RAIL_REINDEX/top.png)
- L: [STEP מלא](artifacts/L_LEG_BASE/FLOW_V31_CANDIDATE_FULL_19_DESIGN_ONLY.step), [GLB מלא](artifacts/L_LEG_BASE/FLOW_V31_CANDIDATE_FULL_19_DESIGN_ONLY.glb), [DXF מועמדים](artifacts/L_LEG_BASE/dxf/), [171 זוגות](artifacts/L_LEG_BASE/pairs-171.json), [בדיקה עצמאית](artifacts/L_LEG_BASE/independent-qc.json)
- L: [קדמי](artifacts/L_LEG_BASE/front.png), [צד](artifacts/L_LEG_BASE/side.png), [תחתון](artifacts/L_LEG_BASE/underside.png), [עליון](artifacts/L_LEG_BASE/top.png)
- [שכבות שינוי ממודדות](artifacts/joint-overlays.svg), [השוואת פינה לפני/אחרי](artifacts/corner-comparison.svg), [סריקת פרמטרים](artifacts/parameter-scan.json)

הבדיקה העצמאית בונה מחדש גופים מתוך קובציDXF שיוצאו, ללא ייבוא מחולל התכנון. היא מאמתת את171 הזוגות,32 הלשוניות העליונות,8 מקבלי הבסיס,4 התאמות מרכזי הבסיס, ומגע אנכי בין הרגליים לאורך כל הגובה. קיום מגע אופקי בלבד אינו מספיק; דוגמת בקרה כזו נדחתה.

לכל חלופה מחזור תכנון ראשוני אחד ו־0 סבבי תיקון גיאומטרי לאחריו;2 תיקוני תוכנת בדיקה/איור תועדו בנפרד. תוצאותPASS הן נומינליות לחומר6 מ״מ, ללא מרווח או פיצויKerf. יש לבצע ביקורת עצמאית, בחירת בעל התכנון ודגמי חיבור/הרכבה ועומס פיזיים לפני שחרור לייצור.

מקור מדויק: `7b5af4725fdd4eccd4ae623fb031cc5a796b6df1`. ענף: `feature/al-016-flow-v31-options`. טיוטתPR מכוונת ל־`feature/33-flow-v3-cad` בלבד; ה־SHA המדויק נמסר בתגובת המסירה. אין שינוי בעמודי מוצר, פרטיות או טפסים. המקורV3 אינו מוחלף ואינו מאושר בדיעבד.
