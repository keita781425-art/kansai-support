/**
 * lib/gasClient.js
 *
 * Next.js移行時: lib/gasClient.ts として使用
 * GASへのPOSTをラップします。
 * Next.js化する際は app/api/submit/route.ts を作成してサーバーサイドで呼ぶことを推奨。
 *
 * --- Next.js移行後の構成例 ---
 * app/api/submit/route.ts:
 *   import { postToGAS } from '@/lib/gasClient'
 *   export async function POST(req: Request) {
 *     const body = await req.json()
 *     const result = await postToGAS(body)
 *     return Response.json(result)
 *   }
 */

var GASClient = (function () {

  // ▼▼▼ Google Apps Script のデプロイURLをここに設定してください ▼▼▼
  var GAS_URL = 'https://script.google.com/macros/s/AKfycbyEaa_jYcKk6gZg6B-sSttmlBbfhi4fxy2KZwFbZoDIWwhqnFtQ3phDV7CIHC6oM8C3iQ/exec';

  /**
   * フォーム送信データをGASへPOSTする
   * @param {FormPayload} payload
   * @returns {Promise<{ ok: boolean, error?: string }>}
   */
  function postToGAS(payload) {
    if (GAS_URL.indexOf('YOUR_DEPLOYMENT_ID') >= 0) {
      console.warn('[GASClient] GAS_URLが未設定です。実際には送信されません。', payload);
      return Promise.resolve({ ok: true, skipped: true });
    }

    return fetch(GAS_URL, {
      method: 'POST',
      mode: 'no-cors', // GASはCORSヘッダーを返さないため
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(function () {
        return { ok: true };
      })
      .catch(function (err) {
        console.error('[GASClient] 送信エラー:', err);
        return { ok: false, error: err.message };
      });
  }

  /**
   * フォームデータをAPIペイロード形式に変換する
   * @param {object} formData
   * @returns {FormPayload}
   */
  function buildPayload(formData) {
    return {
      timestamp: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
      name: formData.name || '',
      phone: formData.phone || '',
      lineName: formData.lineName || '',
      workplace: formData.workplace || '',
      moveIn: formData.moveIn || '',
      budget: formData.budget || '',
      commute: formData.commute || '',
      conditions: (formData.conditions || []).join('、'),
    };
  }

  return {
    postToGAS: postToGAS,
    buildPayload: buildPayload,
  };
})();
