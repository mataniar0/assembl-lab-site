# AL-007 read-only baseline audit

Baseline `be50dc06467b252929ae59a9703fefce0ab616df`. Eight homepage cards, ten model/product pages including tables family and Flow. No application edits.

| Homepage card | Before card | Linked page before | Supported lifecycle | Media |
|---|---|---|---|---|
| Tables / שולחנות | No lifecycle badge; table family | Not explicit; Flow: Photos coming soon | Mixed family: Geometric built, Flow in planning | Geometric photograph used for family card. Child Flow has no model image. |
| Kids Shelf / מדף לילדים | No badge; alt: finished product | No explicit lifecycle badge | Built | Authentic workshop photograph, approved fifth sprite panel; not evidence of painted finish. |
| Driller Stand / מעמד למקדחה | No badge; alt: finished product | No explicit lifecycle badge | Built / in use | Authentic workshop photograph; original photo exists separately and matches card product. |
| Shoe rack / מעמד נעליים | No badge; Three shelves and a seat — model rendering | Assembled in raw plywood · before finishing | Assembled in raw plywood · before finishing | Existing homepage image remains a rendering; product page has six real raw/pre-finish photographs plus planning image. |
| Workbench / שולחן עבודה | IN DEVELOPMENT | In development / Planning | In development / Planning | Card is rendered crop from planning board; page planning sheet/render, not documentary product photo. |
| Crib / מיטת תינוק | IN DEVELOPMENT | In development / Rendering | In development / Rendering | Card and page rendered project; cutting layout is planning drawing. Preserve infant safety warning. |
| Etrog box / קופסה לאתרוג | IN DEVELOPMENT | In development / Planning | In development / Planning | Rendered decorated box and planned cutting drawings, no product photographs. |
| Esther scroll case / כיסוי למגילת אסתר | IN DEVELOPMENT | In development / Planning | In development / Planning | Rendered product concept and V8.2.2 technical/planning drawings, no product photographs. |

## Tables submodels

- **geometric**: Built. Built object photo; planning board contains renderings/drawings and documentary thumbnails. Laser, parts, assembly, black-finish stages are documentary images. Distinguish planning stage from photo stages. Evidence: table/index.html:35, geometric/index.html:262, geometric/index.html:266, geometric/index.html:267, geometric/index.html:270.
- **flow**: In planning; no product photographs available. No model images exist. media/ contains README only, placeholder correctly has no missing img URL. DXF package demonstrates design files, not fabrication/completion. Evidence: table/index.html:35, table/flow/index.html:104, table/flow/media/README.md:3, table/flow/README.md:20.

## Minimal recommendations

1. Shoe homepage: add actual assembled/raw lifecycle while explicitly retaining/render-labelling existing card image. Keep product status/6 real photos/7th planning stage and no-final-finish statement.
2. Flow: explicit planning status in both family card and detail; replace vague photos-coming-soon with current no-product-photographs language. Do not add image URLs or imply fabricated/finished object.
3. Use consistent, minimal lifecycle words on all eight cards and linked pages. Tables family needs mixed status; show Geometric built and Flow planning individually.
4. Kids/drill: built/workshop-photo labels; replace homepage "finished" alts with as-built. Current raw wood photographs do not establish painted/finished coating.
5. Geometric planning board: label planning/renderings/drawings; do not call entire planning board a product photograph. Documentary stage photos may retain photo labels.
6. Workbench/crib/etrog/scroll pages already explicit planning/render status: preserve existing notes, diagram labels and crib safety warning; only standardize concise visible card provenance if required.

## Evidence

- Tables / שולחנות: index.html:312, table/index.html:35, assets/cards/README.md:7
- Kids Shelf / מדף לילדים: index.html:313, shelf/kids/index.html:275
- Driller Stand / מעמד למקדחה: index.html:314, driller_stand/index.html:308
- Shoe rack / מעמד נעליים: index.html:315, shoe_rack/index.html:325, shoe_rack/media/production/sources/README_SELECTED_FILES.md:31, shoe_rack/media/production/EDITING.md:3
- Workbench / שולחן עבודה: index.html:316, workbench/index.html:231, workbench/index.html:234
- Crib / מיטת תינוק: index.html:317, crib/index.html:300, crib/index.html:303
- Etrog box / קופסה לאתרוג: index.html:318, etrog_box/index.html:280, etrog_box/index.html:283
- Esther scroll case / כיסוי למגילת אסתר: index.html:319, megillat_esther_box/index.html:327, megillat_esther_box/index.html:330

## Uncertainties

- The audit distinguishes workshop photographs visually and by repository provenance. No external EXIF/photographer chain-of-custody verification was performed.
- Kids/drill as-built images do not establish surface finishing or paint. Avoid treating a carousel stage named Finishing as proof of a painted finish.
- Geometric planning-clean.webp is a mixed illustration board including authentic thumbnails; a broad label should say planning/renderings, not pure CAD drawing or authentic product photo.
- Flow lacks product photographs; this does not independently prove whether any physical prototype exists. The supported public description is planning/design files and no available photographs.

Machine-readable exact bilingual texts and references: `/tmp/al007-before-audit.json`.
