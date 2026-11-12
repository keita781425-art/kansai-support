/**
 * diagnose.js
 *
 * おすすめエリアを決める（2026/11/12 作り直し）。画面には依存しない純粋な関数。
 *
 * 決め方
 *   1. 最寄り駅から「ハブ駅」を決める（stationData.js）。わからなければ通勤時間ではしぼらない
 *   2. エリアごとに、通勤時間の目安（エリア→ハブ駅の分＋駅ごとの追加分）と、
 *      築年数の希望に合わせた1Kの家賃の目安を出す（areaData.js）
 *   3. 「希望の通勤時間以内」かつ「予算以内」のエリアから点数順に3つ
 *      足りないときは、予算を少し超えるエリア → 通勤時間を少し超えるエリアの順で補う（結果に印を付ける）
 *   点数 ＝ 重視条件の点 ＋ 通勤が短いほど加点 ＋ 予算に収まるほど加点
 */

var DiagnoseLogic = (function () {

  /** 予算の上限（万円） */
  var BUDGET_MAX = { '〜5万円': 5, '5〜6万円': 6, '6〜7万円': 7, '7〜9万円': 9, '9万円以上': 99 };

  /** 希望通勤時間の上限（分） */
  var COMMUTE_MAX = { '〜15分': 15, '〜30分': 30, '〜45分': 45, '〜1時間': 60 };

  /** 築年数の希望 → areaData の rent のキー */
  var AGE_KEY = { '〜5年': 'y5', '〜10年': 'y10', '〜20年': 'y20', '20年〜': 'old', 'こだわりなし': 'all' };

  /** 予算・通勤時間を「少し超える」とみなす幅 */
  var BUDGET_SLACK = 1;   // 万円
  var COMMUTE_SLACK = 15; // 分

  function rentOf(area, ageKey) {
    var r = area.rent || {};
    var v = r[ageKey];
    if (v == null) v = r.y10 != null ? r.y10 : r.all; // 〜5年のデータがないエリア
    return v;
  }

  /**
   * @param {{ station1?:string, station2?:string, workplace?:string, budget:string, commute:string, age?:string, conditions?:string[] }} values
   * @param {Area[]} areas
   * @param {{value:string, scoreKey:string}[]} conditionOptions
   * @param {number} [topN=3]
   * @returns {{ hub: {hub:string, extra:number, word:string}|null, items: DiagnoseResult[] }}
   *   DiagnoseResult = { area, score, matchPct, minutes|null, rent, overBudget, overTime }
   */
  function diagnose(values, areas, conditionOptions, topN) {
    topN = topN || 3;
    var budgetMax = BUDGET_MAX[values.budget] || 6;
    var commuteMax = COMMUTE_MAX[values.commute] || 45;
    var ageKey = AGE_KEY[values.age] || 'all';
    var selected = values.conditions || [];

    var keyMap = {};
    (conditionOptions || []).forEach(function (o) { keyMap[o.value] = o.scoreKey; });

    var hub = (typeof StationData !== 'undefined')
      ? StationData.findHubFrom([values.station1, values.station2, values.workplace])
      : null;

    var scored = areas.map(function (area) {
      // 重視条件の点（何も選ばなければ「治安＋生活の便利さ」）
      var cond = 0;
      if (selected.length) {
        selected.forEach(function (c) {
          var k = keyMap[c];
          if (k && area.score[k] != null) cond += area.score[k];
        });
      } else {
        cond = area.score.safe + area.score.convenient;
      }

      var minutes = hub ? area.minutes[hub.hub] + hub.extra : null;
      var rent = rentOf(area, ageKey);

      // 通勤：短いほど加点（0〜6点）。時間がわからないときは0
      var timeScore = 0;
      if (minutes != null) timeScore = Math.max(0, (commuteMax - minutes) / commuteMax) * 6;

      // 予算：収まれば+3、超えたぶんだけ減点
      var budgetScore = rent <= budgetMax ? 3 : -(rent - budgetMax) * 4;

      return {
        area: area,
        score: cond + timeScore + budgetScore,
        minutes: minutes,
        rent: rent,
        overBudget: rent > budgetMax,
        overTime: minutes != null && minutes > commuteMax,
      };
    });

    function byScore(a, b) { return b.score - a.score; }
    var ok = scored.filter(function (x) { return !x.overBudget && !x.overTime; }).sort(byScore);
    var picked = ok.slice(0, topN);

    if (picked.length < topN) {
      // 予算を少し超えるが、通勤時間は希望どおり（家賃が安い順）
      var nearBudget = scored.filter(function (x) {
        return x.overBudget && !x.overTime && x.rent <= budgetMax + BUDGET_SLACK;
      }).sort(function (a, b) { return a.rent - b.rent || byScore(a, b); });
      picked = picked.concat(nearBudget.slice(0, topN - picked.length));
    }
    if (picked.length < topN && hub) {
      // 予算内だが、通勤時間を少し超える（近い順）
      var nearTime = scored.filter(function (x) {
        return !x.overBudget && x.overTime && x.minutes <= commuteMax + COMMUTE_SLACK;
      }).sort(function (a, b) { return a.minutes - b.minutes || byScore(a, b); });
      picked = picked.concat(nearTime.slice(0, topN - picked.length));
    }
    if (picked.length < topN) {
      // それでも足りない：希望の通勤時間に近いものを優先し、その中で家賃が安い順
      var rest = scored.filter(function (x) { return picked.indexOf(x) === -1; })
        .sort(function (a, b) {
          var la = a.minutes == null ? 0 : Math.max(0, a.minutes - commuteMax);
          var lb = b.minutes == null ? 0 : Math.max(0, b.minutes - commuteMax);
          return (Math.ceil(la / 15) - Math.ceil(lb / 15)) || (a.rent - b.rent);
        });
      picked = picked.concat(rest.slice(0, topN - picked.length));
    }

    var top = picked.length ? Math.max.apply(null, picked.map(function (x) { return x.score; })) : 1;
    if (top <= 0) top = 1;
    var items = picked.map(function (x) {
      x.matchPct = Math.max(50, Math.min(100, Math.round((x.score / top) * 100)));
      if (x.overBudget || x.overTime) x.matchPct = Math.min(x.matchPct, 70);
      return x;
    });

    return { hub: hub, items: items };
  }

  return {
    diagnose: diagnose,
    AGE_KEY: AGE_KEY,
  };
})();
