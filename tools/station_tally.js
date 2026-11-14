// 問い合わせシートの「勤務地・通学先」「最寄り駅①②」を数えて、駅の表（stationData.js）で判定できない言葉を洗い出す。
// 使い方: node tools/station_tally.js 言葉1 言葉2 ...   （シートの列の値をそのまま渡す）
const fs = require('fs'), path = require('path');
global.window = {};
eval.call(global, fs.readFileSync(path.join(__dirname, '..', 'stationData.js'), 'utf8').replace(/^var (\w+) =/m, 'global.$1 ='));
const words = process.argv.slice(2).map(s => s.trim()).filter(Boolean);
const count = {};
words.forEach(w => { count[w] = (count[w] || 0) + 1; });
const rows = Object.entries(count).sort((a, b) => b[1] - a[1]).map(([w, n]) => {
  const hit = StationData.findHub(w);
  return { 言葉: w, 件数: n, 判定: hit ? (hit.hub || hit) : '表にない' };
});
console.table(rows);
const miss = rows.filter(r => r.判定 === '表にない');
console.log(`表にない言葉: ${miss.length}種類 / ${miss.reduce((s, r) => s + r.件数, 0)}件`);
