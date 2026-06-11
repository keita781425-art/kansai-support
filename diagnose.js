/**
 * lib/diagnose.js
 *
 * Next.js移行時: lib/diagnose.ts として使用
 * UIへの依存がゼロのピュアな関数です。そのままサーバーサイド(Route Handler)でも使えます。
 *
 * 型定義例:
 *   type FormValues = { budget:string; commute:string; conditions:string[] }
 *   type DiagnoseResult = { area: Area; score: number; matchPct: number }
 *   export function diagnose(values: FormValues, areas: Area[]): DiagnoseResult[]
 */

var DiagnoseLogic = (function () {

  /**
   * 予算文字列を数値(万円)に変換するヘルパー
   * @param {string} budget
   * @returns {number}
   */
  function budgetToNumber(budget) {
    var map = {
      '〜4万円': 4,
      '4〜5万円': 4.5,
      '5〜6万円': 5.5,
      '6〜7万円': 6.5,
      '7〜9万円': 8,
      '9万円以上': 12,
    };
    return map[budget] || 6;
  }

  /**
   * 除外予算閾値を数値(万円)に変換するヘルパー
   * @param {string|null} threshold
   * @returns {number}
   */
  function thresholdToNumber(threshold) {
    if (!threshold) return 0;
    var num = parseFloat(threshold);
    return isNaN(num) ? 0 : num;
  }

  /**
   * 通勤ペナルティ係数（短時間希望 → 駅遠エリアを下げる）
   * @param {string} commute
   * @param {object} areaScore
   * @returns {number} 係数 0.5〜1.0
   */
  function commuteMultiplier(commute, areaScore) {
    if (commute === '〜15分' && areaScore.access <= 2) return 0.5;
    if (commute === '〜30分' && areaScore.access <= 2) return 0.7;
    return 1.0;
  }

  /**
   * メイン診断関数
   * @param {{ budget:string, commute:string, conditions:string[] }} values
   * @param {Area[]} areas
   * @param {ConditionOption[]} conditionOptions - scoreKeyのマッピングに使用
   * @param {number} [topN=3]
   * @returns {{ area:Area, score:number, matchPct:number }[]}
   */
  function diagnose(values, areas, conditionOptions, topN) {
    topN = topN || 3;
    var userBudget = budgetToNumber(values.budget);
    var selectedConditions = values.conditions || [];

    // conditionOptions から { value -> scoreKey } のマップを作成
    var conditionKeyMap = {};
    conditionOptions.forEach(function (opt) {
      conditionKeyMap[opt.value] = opt.scoreKey;
    });

    var scored = areas.map(function (area) {
      // 予算オーバーのエリアはスコア大幅減
      var budgetThreshold = thresholdToNumber(area.excludeIfBudgetBelow);
      var budgetPenalty = (budgetThreshold > 0 && userBudget < budgetThreshold) ? -6 : 0;

      // 選択条件がある場合はスコアリング、ない場合はデフォルトスコア
      var conditionScore = 0;
      if (selectedConditions.length > 0) {
        selectedConditions.forEach(function (cond) {
          var key = conditionKeyMap[cond];
          if (key && area.score[key] != null) {
            conditionScore += area.score[key];
          }
        });
      } else {
        // 条件未選択時: アクセス・治安・利便性の平均
        conditionScore = area.score.access + area.score.safe + area.score.convenient;
      }

      var multiplier = commuteMultiplier(values.commute, area.score);
      var rawScore = (conditionScore + budgetPenalty) * multiplier;

      return { area: area, rawScore: rawScore };
    });

    // 降順ソート
    scored.sort(function (a, b) { return b.rawScore - a.rawScore; });

    // 上位N件を取得してmatchPctを計算
    var topItems = scored.slice(0, topN);
    var maxScore = topItems[0] ? topItems[0].rawScore : 1;
    if (maxScore <= 0) maxScore = 1;

    return topItems.map(function (item) {
      return {
        area: item.area,
        score: item.rawScore,
        matchPct: Math.max(0, Math.round((item.rawScore / maxScore) * 100)),
      };
    });
  }

  return { diagnose: diagnose };
})();
