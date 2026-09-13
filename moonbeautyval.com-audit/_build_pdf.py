import json
import re
from pathlib import Path

import markdown
from playwright.sync_api import sync_playwright

BASE = Path(__file__).parent
report_md = (BASE / "FULL-AUDIT-REPORT.md").read_text(encoding="utf-8")
plan_md = (BASE / "ACTION-PLAN.md").read_text(encoding="utf-8")
data = json.loads((BASE / "audit-data.json").read_text(encoding="utf-8"))

# Insert a page break before the action-plan section when merged
merged_md = report_md.rstrip() + "\n\n<div class=\"pagebreak\"></div>\n\n" + plan_md.lstrip()

body_html = markdown.markdown(
    merged_md,
    extensions=["tables", "fenced_code", "sane_lists"],
)

score = data["summary"]["health_score"]

def score_color(s):
    if s >= 70:
        return "#1a7f37"
    if s >= 50:
        return "#b08800"
    return "#c62828"

html = f"""<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Auditoria SEO - moonbeautyval.com</title>
<style>
  @page {{ size: A4; margin: 20mm 16mm; }}
  * {{ box-sizing: border-box; }}
  body {{
    font-family: -apple-system, "Segoe UI", Arial, sans-serif;
    color: #1c1c1c;
    line-height: 1.5;
    font-size: 10.5pt;
  }}
  .cover {{
    height: 245mm;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    page-break-after: always;
  }}
  .cover h1 {{ font-size: 30pt; margin-bottom: 4px; color: #111; }}
  .cover .sub {{ font-size: 13pt; color: #555; margin-bottom: 40px; }}
  .cover .score-badge {{
    width: 160px; height: 160px; border-radius: 50%;
    border: 10px solid {score_color(score)};
    display: flex; align-items: center; justify-content: center;
    flex-direction: column;
    margin-bottom: 30px;
  }}
  .cover .score-badge .num {{ font-size: 42pt; font-weight: 700; color: {score_color(score)}; }}
  .cover .score-badge .label {{ font-size: 9pt; color: #666; }}
  .cover .meta {{ font-size: 10pt; color: #777; margin-top: 30px; }}
  h1 {{ font-size: 18pt; border-bottom: 2px solid #222; padding-bottom: 6px; margin-top: 30px; }}
  h2 {{ font-size: 14pt; color: #111; margin-top: 26px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }}
  h3 {{ font-size: 11.5pt; color: #222; margin-top: 18px; }}
  h4 {{ font-size: 10.5pt; color: #333; margin-top: 14px; }}
  table {{ border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 9pt; }}
  th, td {{ border: 1px solid #ccc; padding: 5px 8px; text-align: left; vertical-align: top; }}
  th {{ background: #f2f2f2; }}
  code {{ background: #f0f0f0; padding: 1px 4px; border-radius: 3px; font-size: 9pt; }}
  pre {{ background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; font-size: 8.5pt; }}
  pre code {{ background: none; padding: 0; }}
  ul, ol {{ padding-left: 22px; }}
  li {{ margin-bottom: 3px; }}
  strong {{ color: #111; }}
  hr {{ border: none; border-top: 1px solid #ddd; margin: 24px 0; }}
  .pagebreak {{ page-break-before: always; }}
  a {{ color: #1a4fa0; }}
</style>
</head>
<body>

<div class="cover">
  <div class="score-badge">
    <div class="num">{score}</div>
    <div class="label">/ 100</div>
  </div>
  <h1>Auditoria SEO Completa</h1>
  <div class="sub">moonbeautyval.com</div>
  <div class="meta">
    {data["summary"]["business_type"]}<br>
    Generado el 2026-09-13
  </div>
</div>

{body_html}

</body>
</html>
"""

html_path = BASE / "_report_render.html"
html_path.write_text(html, encoding="utf-8")

pdf_path = BASE / "Auditoria-SEO-moonbeautyval.pdf"
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.goto(html_path.as_uri())
    page.pdf(
        path=str(pdf_path),
        format="A4",
        print_background=True,
        margin={"top": "0mm", "bottom": "0mm", "left": "0mm", "right": "0mm"},
    )
    browser.close()

print(f"PDF generado: {pdf_path}")
