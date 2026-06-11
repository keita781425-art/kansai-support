/**
 * gas/spreadsheet.gs
 *
 * Google Apps Script — スプレッドシート保存スクリプト
 *
 * 【Next.js移行時の対応】
 * このスクリプトは廃止し、以下に置き換えることを推奨:
 *   - app/api/submit/route.ts でPOSTを受け取る
 *   - Google Sheets API (googleapis npm) でサーバーサイドから直接書き込む
 *   - または Supabase / PlanetScale などDBへ移行する
 *
 * 【設置手順】
 * 1. Googleスプレッドシートを新規作成
 * 2. 拡張機能 > Apps Script を開く
 * 3. このファイルの内容を貼り付け
 * 4. 「デプロイ」>「新しいデプロイ」>「ウェブアプリ」
 *    - 実行ユーザー: 自分
 *    - アクセスできるユーザー: 全員
 * 5. デプロイURLを lib/gasClient.js の GAS_URL に設定
 */

var SHEET_NAME = '問い合わせ一覧';

var COLUMNS = [
  { key: 'timestamp',  header: '送信日時',        width: 160 },
  { key: 'name',       header: 'お名前',           width: 120 },
  { key: 'phone',      header: '電話番号',         width: 140 },
  { key: 'lineName',   header: 'LINE表示名',       width: 120 },
  { key: 'workplace',  header: '勤務地・通学先',   width: 160 },
  { key: 'moveIn',     header: '入居希望時期',     width: 140 },
  { key: 'budget',     header: '家賃予算',         width: 120 },
  { key: 'commute',    header: '希望通勤時間',     width: 130 },
  { key: 'conditions', header: '重視する条件',     width: 260 },
];

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = getOrCreateSheet();
    appendDataRow(sheet, data);
    return jsonResponse({ status: 'ok' });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

function getOrCreateSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    initializeHeader(sheet);
  }
  return sheet;
}

function initializeHeader(sheet) {
  var headers = COLUMNS.map(function (c) { return c.header; });
  sheet.appendRow(headers);

  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#1A6FD4');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setFontWeight('bold');
  sheet.setFrozenRows(1);

  COLUMNS.forEach(function (col, i) {
    sheet.setColumnWidth(i + 1, col.width);
  });
}

function appendDataRow(sheet, data) {
  var row = COLUMNS.map(function (col) {
    return data[col.key] || '';
  });
  sheet.appendRow(row);

  // 偶数行に薄い背景色
  var lastRow = sheet.getLastRow();
  if (lastRow % 2 === 0) {
    sheet.getRange(lastRow, 1, 1, COLUMNS.length).setBackground('#F0F6FF');
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// テスト実行用（GASエディタから直接実行）
function testPost() {
  var testData = {
    postData: {
      contents: JSON.stringify({
        timestamp: new Date().toLocaleString('ja-JP'),
        name: 'テスト 花子',
        phone: '080-9876-5432',
        lineName: 'はなこ',
        workplace: '京都・四条',
        moveIn: '2〜3ヶ月以内',
        budget: '5〜6万円',
        commute: '〜30分',
        conditions: '治安の良さ、学生・若者が多い',
      })
    }
  };
  Logger.log(doPost(testData).getContent());
}
