"""OGP画像（SNSでリンクを貼ったときに出る画像）を作る。

使い方: python3 tools/make_ogp.py ogp.png
Playwright と日本語フォント（Noto Sans CJK JP）が必要。Chromeの場所は環境変数 CHROME で変えられる。
色はサイト（globals.css）と同じ青・緑。文字を変えたら画像も作り直して main に入れる（＝公開、要「ご」）。
"""
import os
import sys

from playwright.sync_api import sync_playwright

BLUE = "#1A6FD4"
GREEN = "#1DB87A"

HTML = f"""<!DOCTYPE html><html lang="ja"><head><meta charset="utf-8"><style>
*{{margin:0;padding:0;box-sizing:border-box}}
body{{width:1200px;height:630px;font-family:'Noto Sans CJK JP','Noto Sans JP',sans-serif;
background:{BLUE};color:#fff;position:relative;overflow:hidden}}
.wrap{{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:0 80px}}
.badge{{background:#fff;color:{BLUE};font-weight:800;font-size:30px;padding:10px 28px;border-radius:40px;margin-bottom:34px}}
.t1{{font-size:58px;font-weight:900;line-height:1.35}}
.hl{{display:inline-block;background:#fff;color:{BLUE};padding:0 18px;border-radius:14px;margin:0 6px}}
.sub{{margin-top:30px;font-size:30px;font-weight:600;opacity:.95}}
.foot{{position:absolute;left:0;right:0;bottom:0;height:70px;background:{GREEN};display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:800;letter-spacing:1px}}
</style></head><body>
<div class="wrap">
  <div class="badge">✦ 無料エリア診断・3分</div>
  <div class="t1">関西の新生活、<br>どこに住む？</div>
  <div class="sub">勤務地・予算・通勤時間から、おすすめエリアを3つ提案</div>
</div>
<div class="foot">関西新生活サポート ｜ 大阪・京都・兵庫・奈良・滋賀</div>
</body></html>"""


def main():
    out = sys.argv[1] if len(sys.argv) > 1 else "ogp.png"
    with sync_playwright() as pw:
        b = pw.chromium.launch(executable_path=os.environ.get("CHROME", "/usr/bin/google-chrome"))
        p = b.new_page(viewport={"width": 1200, "height": 630})
        p.set_content(HTML)
        p.wait_for_timeout(300)
        p.screenshot(path=out, type="png")
        b.close()
    print(out)


if __name__ == "__main__":
    main()
