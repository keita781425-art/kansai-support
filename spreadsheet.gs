/**
 * gas/spreadsheet.gs
 *
 * Google Apps Script — 問い合わせ保存 & 新規通知
 *
 * 【やること】
 *  1. フォーム送信を「問い合わせ一覧」シートに1行追加
 *  2. 電話番号は文字列として保存（先頭の0が消えないように）
 *  3. 対応ステータスに「未対応」を自動セット（プルダウン付き）
 *  4. 名前・電話番号つきの問い合わせが来たら、自分宛てにメール通知
 *  5. 10/28〜 サイトでは個人情報を聞かない。診断だけの行は「診断のみ」で記録（メール通知なし）
 *
 * 【更新手順】（URLを変えずに反映する方法）
 *  1. スプレッドシート「新生活サポート_問い合わせ」> 拡張機能 > Apps Script
 *  2. 既存コードを全部消して、このファイルの中身を貼り付けて保存
 *  3. 関数「fixExistingRows」を選んで ▶実行（見出しが「診断コード」になる）
 *     続けて「testPost」を ▶実行 → シートに「診断のみ」のテスト行が入ればOK（メールは来ない。テスト行は削除してOK）
 *  4. デプロイ > デプロイを管理 > ✏️編集 > バージョン「新バージョン」> デプロイ
 *     ※「新しいデプロイ」ではなく「デプロイを管理」から。URLが変わらずサイト側の修正不要。
 */

var SHEET_NAME = '問い合わせ一覧';

// 新規問い合わせの通知先（デフォルト：このスクリプトの持ち主＝自分のGmail。空文字にすると通知しない）
var NOTIFY_EMAIL = Session.getEffectiveUser().getEmail();

// 対応ステータスの選択肢
var STATUS_OPTIONS = ['診断のみ', '未対応', '対応中', '送客済み', '成約', '失注'];

var COLUMNS = [
  { key: 'timestamp',  header: '送信日時',        width: 160 },
  { key: 'name',       header: 'お名前',           width: 120 },
  { key: 'phone',      header: '電話番号',         width: 140, asText: true },
  { key: 'lineName',   header: 'LINE表示名',       width: 120 },
  { key: 'workplace',  header: '勤務地・通学先',   width: 160 },
  { key: 'moveIn',     header: '入居希望時期',     width: 140 },
  { key: 'budget',     header: '家賃予算',         width: 120 },
  { key: 'commute',    header: '希望通勤時間',     width: 130 },
  { key: 'conditions', header: '重視する条件',     width: 260 },
  { key: '_status',    header: '対応ステータス',   width: 120, defaultValue: '未対応' },
  { key: '_memo',      header: '担当者メモ',       width: 240 },
  { key: '_sentDate',  header: '送客日',           width: 110 },
  { key: '_wonDate',   header: '成約日',           width: 110 },
  { key: 'consent',    header: '情報提供への同意', width: 120 },
  { key: 'source',     header: '流入元',           width: 120 },
  { key: 'sid',        header: '診断コード',       width: 120 },
  { key: '_lineClick', header: 'LINEボタン',       width: 150 },
  { key: 'station1',   header: '最寄り駅①',       width: 120 },
  { key: 'station2',   header: '最寄り駅②',       width: 120 },
];

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var data = JSON.parse(e.postData.contents);

    // 導線の計測：診断結果ページの「LINEで相談」ボタンが押された記録
    if (data && data.type === 'line_click') {
      markLineClick(data.sid);
      return jsonResponse({ status: 'ok' });
    }

    // スパム対策：明らかに不正な送信は保存しない（送信元には成功と同じ応答を返す）
    if (!isAcceptable(data)) {
      return jsonResponse({ status: 'ok' });
    }
    sanitize(data);

    // 名前・電話番号がない＝診断だけ（個人情報なし）。メールは送らず「診断のみ」で記録
    var anonymous = !data.name && !data.phone;
    if (anonymous) data._status = '診断のみ';

    var sheet = getOrCreateSheet();
    var rowNum = appendDataRow(sheet, data);
    if (!anonymous) notifyNewInquiry(data, rowNum);
    return jsonResponse({ status: 'ok' });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

/** 受付IDの行の「LINEボタン」列に押した日時を入れる（同じ行に1回だけ） */
function markLineClick(sid) {
  if (!/^[a-z0-9]{8,20}$/.test(String(sid || ''))) return;
  var sheet = getOrCreateSheet();
  var last = sheet.getLastRow();
  if (last < 2) return;
  var sidCol = columnIndex('sid');
  var clickCol = columnIndex('_lineClick');
  var start = Math.max(2, last - 200); // 直近200行だけ探す
  var ids = sheet.getRange(start, sidCol, last - start + 1, 1).getValues();
  for (var i = ids.length - 1; i >= 0; i--) {
    if (String(ids[i][0]) === String(sid)) {
      var cell = sheet.getRange(start + i, clickCol);
      if (!cell.getValue()) {
        cell.setValue('押した ' + Utilities.formatDate(new Date(), 'Asia/Tokyo', 'M/d HH:mm'));
      }
      return;
    }
  }
}

/** 受け付けてよい送信かどうか */
function isAcceptable(data) {
  if (!data || typeof data !== 'object') return false;
  if (data.website) return false;                     // 見えない欄が埋まっている＝ボット
  if (!data.workplace) return false;                  // 勤務地・通学先がない
  // 名前・電話番号つき（旧フォームや今後の相談フォーム）のときだけ、同意と電話番号の形を確認
  if (data.name || data.phone) {
    if (!data.name || !data.phone) return false;
    if (data.consent !== '同意済み') return false;
    if (!/^[\d\-\+\(\)\s]{7,20}$/.test(String(data.phone))) return false;
  }
  return true;
}

/** 長すぎる入力を切り詰め、数式として解釈される先頭記号を無効化 */
function sanitize(data) {
  COLUMNS.forEach(function (col) {
    var v = data[col.key];
    if (v == null) return;
    v = String(v).slice(0, 300);
    if (/^[=+\-@]/.test(v) && col.key !== 'phone') v = "'" + v;
    data[col.key] = v;
  });
}

function getOrCreateSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    initializeHeader(sheet);
  }
  return sheet;
}

function initializeHeader(sheet) {
  var headers = COLUMNS.map(function (c) { return c.header; });
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
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
  var rowNum = sheet.getLastRow() + 1;
  var row = COLUMNS.map(function (col) {
    var v = data[col.key];
    if (v == null || v === '') v = col.defaultValue || '';
    return String(v);
  });

  // 電話番号など文字列で保持したい列は、書き込み前に書式を「書式なしテキスト」に
  COLUMNS.forEach(function (col, i) {
    if (col.asText) sheet.getRange(rowNum, i + 1).setNumberFormat('@');
  });
  sheet.getRange(rowNum, 1, 1, row.length).setValues([row]);

  // 対応ステータスにプルダウンを付ける
  var statusCol = columnIndex('_status');
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(STATUS_OPTIONS, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(rowNum, statusCol).setDataValidation(rule);

  // 偶数行に薄い背景色
  if (rowNum % 2 === 0) {
    sheet.getRange(rowNum, 1, 1, COLUMNS.length).setBackground('#F0F6FF');
  }
  return rowNum;
}

function notifyNewInquiry(data, rowNum) {
  if (!NOTIFY_EMAIL) return;
  var url = SpreadsheetApp.getActiveSpreadsheet().getUrl();
  var subject = '【新規問い合わせ】' + (data.name || '名前なし') + '様／' + (data.workplace || '');
  var body = [
    '関西新生活サポートに新しい問い合わせが届きました。',
    '',
    'お名前　　：' + (data.name || ''),
    '電話番号　：' + (data.phone || ''),
    'LINE表示名：' + (data.lineName || ''),
    '勤務地　　：' + (data.workplace || ''),
    '入居時期　：' + (data.moveIn || ''),
    '家賃予算　：' + (data.budget || ''),
    '通勤時間　：' + (data.commute || ''),
    '重視条件　：' + (data.conditions || ''),
    '',
    'シート（' + rowNum + '行目）：' + url,
  ].join('\n');
  MailApp.sendEmail(NOTIFY_EMAIL, subject, body);
}

function columnIndex(key) {
  for (var i = 0; i < COLUMNS.length; i++) {
    if (COLUMNS[i].key === key) return i + 1;
  }
  return -1;
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 既存データの一括修正（1回だけ実行）
 *  - A1見出しを「送信日時」に修正
 *  - 空欄の対応ステータスを「未対応」にしてプルダウンを付与
 *  - 電話番号列を文字列書式に（※すでに消えた先頭0は戻らないため、
 *    10桁で「0」以外から始まる番号には先頭に0を補う）
 */
function fixExistingRows() {
  var sheet = getOrCreateSheet();
  sheet.getRange(1, 1).setValue('送信日時');
  // 見出し行を最新の列構成にそろえる（同意列の追加など）
  sheet.getRange(1, 1, 1, COLUMNS.length).setValues([COLUMNS.map(function (c) { return c.header; })])
    .setBackground('#1A6FD4').setFontColor('#FFFFFF').setFontWeight('bold');
  var last = sheet.getLastRow();
  if (last < 2) return;

  var phoneCol = columnIndex('phone');
  var phoneRange = sheet.getRange(2, phoneCol, last - 1, 1);
  var phones = phoneRange.getValues().map(function (r) {
    var p = String(r[0]);
    if (/^\d{10}$/.test(p) && p.charAt(0) !== '0') p = '0' + p;
    return [p];
  });
  phoneRange.setNumberFormat('@').setValues(phones);

  var statusCol = columnIndex('_status');
  var statusRange = sheet.getRange(2, statusCol, last - 1, 1);
  var statuses = statusRange.getValues().map(function (r) {
    return [r[0] === '' ? '未対応' : r[0]];
  });
  statusRange.setValues(statuses);
  statusRange.setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(STATUS_OPTIONS, true).build()
  );
}

// テスト実行用（GASエディタから直接実行）
function testPost() {
  var testData = {
    postData: {
      contents: JSON.stringify({
        timestamp: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
        workplace: 'テスト・四条',
        station1: '四条',
        station2: '烏丸',
        moveIn: '2〜3ヶ月以内',
        budget: '5〜6万円',
        commute: '〜30分',
        conditions: '治安の良さ、学生・若者が多い',
        source: 'テスト',
        sid: 'testtest',
      })
    }
  };
  Logger.log(doPost(testData).getContent());
}
