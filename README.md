# 関西新生活サポート v2 — セットアップ手順 & Next.js移行ガイド

## ファイル構成

```
kansai-support-v2/
├── index.html              # エントリーポイント (Next.js: app/layout.tsx)
│
├── styles/
│   ├── globals.css         # CSS変数・ベーススタイル (Next.js: app/globals.css)
│   └── components.css      # コンポーネントスタイル (Next.js: *.module.css に分割)
│
├── lib/                    # ピュアな関数・データ定義 (Next.js: そのまま lib/*.ts に)
│   ├── areaData.js         # エリアデータ定義
│   ├── formConfig.js       # フォームフィールド定義
│   ├── diagnose.js         # 診断ロジック (UIに依存しない)
│   ├── validate.js         # バリデーション関数
│   └── gasClient.js        # GAS通信クライアント
│
├── components/
│   └── index.js            # UI描画関数 (Next.js: 各 .tsx ファイルに分割)
│
├── pages/
│   └── app.js              # アプリ制御・ルーティング (Next.js: app/page.tsx)
│
└── gas/
    └── spreadsheet.gs      # Google Apps Script (スプレッドシート保存)
```

---

## 1. すぐに公開する（MVP）

### GitHub Pages（無料・最短5分）

1. GitHubで新しいリポジトリを作成（例: `kansai-support`）
2. このフォルダの中身をそのままアップロード
3. Settings > Pages > Source: main branch > Save
4. `https://あなたのID.github.io/kansai-support` で公開完了

> ⚠️ GitHub Pages はフォルダ構成のままホストするため、`index.html` の `<link>` や `<script>` の相対パスがそのまま動作します。

### Netlify（ドラッグ&ドロップで公開）

1. https://netlify.com にログイン
2. フォルダをドラッグ&ドロップするだけで公開

---

## 2. LINEリンクを設定する

`pages/app.js` の先頭にある変数を変更してください:

```js
// pages/app.js
var LINE_CTA_URL = 'https://lin.ee/あなたのID';  // ← ここを変更
```

---

## 3. Googleスプレッドシート連携を設定する

1. Googleスプレッドシートを新規作成
2. 「拡張機能」→「Apps Script」
3. `gas/spreadsheet.gs` の内容を貼り付けて保存
4. 「デプロイ」→「新しいデプロイ」→「ウェブアプリ」
   - 実行ユーザー: 自分
   - アクセスできるユーザー: **全員**
5. デプロイURLをコピーして `lib/gasClient.js` に設定:

```js
// lib/gasClient.js
var GAS_URL = 'https://script.google.com/macros/s/コピーしたID/exec';
```

---

## 4. カスタマイズポイント

| 変更内容             | 編集ファイル                      |
|---------------------|----------------------------------|
| エリアの追加・変更   | `lib/areaData.js` の `AREAS` 配列 |
| 診断ロジックの調整   | `lib/diagnose.js` の `diagnose()` |
| フォーム項目の追加   | `lib/formConfig.js`              |
| カラーテーマの変更   | `styles/globals.css` の `:root`  |
| LINEリンクの変更     | `pages/app.js` の `LINE_CTA_URL` |
| GAS URLの変更        | `lib/gasClient.js` の `GAS_URL`  |

---

## 5. Next.js移行ガイド

### フェーズ1: プロジェクト作成・構造コピー

```bash
npx create-next-app@latest kansai-support-next --typescript --app --tailwind
```

```
src/
├── app/
│   ├── layout.tsx          ← index.html の <head> + Google Fonts
│   ├── globals.css         ← styles/globals.css (変数はそのままTailwindに移管可)
│   └── page.tsx            ← pages/app.js のロジックをuseReducerで再実装
│
├── components/
│   ├── Header/             ← components/index.js の renderHeader()
│   ├── Hero/               ← renderHero()
│   ├── StepIndicator/      ← renderStepIndicatorHTML()
│   ├── FormSection/        ← Step1Form, Step2Form
│   ├── AreaCard/           ← renderAreaCardHTML()
│   └── CTA/                ← renderCTAHTML()
│
├── lib/
│   ├── areaData.ts         ← lib/areaData.js (ほぼそのままTypeScript化)
│   ├── formConfig.ts       ← lib/formConfig.js
│   ├── diagnose.ts         ← lib/diagnose.js
│   ├── validate.ts         ← lib/validate.js
│   └── gasClient.ts        ← lib/gasClient.js (Routeハンドラ経由に変更推奨)
│
└── app/api/
    └── submit/
        └── route.ts        ← GAS呼び出しをサーバーサイドに移動
```

### フェーズ2: lib のTypeScript化

`lib/diagnose.js` の関数はUIに依存していないため、ファイル名変更 + `export` 追加だけで移行完了:

```ts
// lib/diagnose.ts
export type FormValues = { budget: string; commute: string; conditions: string[] }
export type DiagnoseResult = { area: Area; score: number; matchPct: number }

export function diagnose(values: FormValues, areas: Area[], ...): DiagnoseResult[] {
  // ロジックはそのまま
}
```

### フェーズ3: コンポーネントのReact化

`components/index.js` の各 `render*` 関数を JSX に変換します。
引数がそのままpropsになります:

```tsx
// components/AreaCard/AreaCard.tsx
type Props = { area: Area; matchPct: number; rank: number }

export function AreaCard({ area, matchPct, rank }: Props) {
  return (
    <div className={styles.card}>
      {/* render関数のHTMLをJSXに変換 */}
    </div>
  )
}
```

### フェーズ4: Stateの置き換え

`pages/app.js` の `state` オブジェクトを `useReducer` に変換:

```ts
// app/page.tsx
type State = {
  currentStep: 1 | 2 | 3
  formData: Partial<FormData>
  errors: Record<string, string>
  results: DiagnoseResult[]
}

type Action =
  | { type: 'NEXT_STEP'; payload: Partial<FormData> }
  | { type: 'PREV_STEP' }
  | { type: 'SET_ERRORS'; payload: Record<string, string> }
  | { type: 'SET_RESULTS'; payload: DiagnoseResult[] }
```

### フェーズ5: GASをAPIルートに移行（推奨）

```ts
// app/api/submit/route.ts
import { google } from 'googleapis'

export async function POST(req: Request) {
  const body = await req.json()
  // Google Sheets APIで直接書き込み（APIキー不要、サービスアカウント使用）
  const auth = new google.auth.GoogleAuth({ ... })
  const sheets = google.sheets({ version: 'v4', auth })
  await sheets.spreadsheets.values.append({ ... })
  return Response.json({ ok: true })
}
```
