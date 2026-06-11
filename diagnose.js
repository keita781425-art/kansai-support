/**
 * lib/diagnose.js
 *
 * Next.js移行時: lib/diagnose.ts として使用
 * UIへの依存がゼロのピュアな関数です。そのままサーバーサイド(Route Handler)でも使えます。
 *
 * 型定義例:
 *   type FormValues = { workplace:string; budget:string; commute:string; conditions:string[] }
 *   type DiagnoseResult = { area: Area; score: number; matchPct: number; lineMatched: boolean }
 *   export function diagnose(values: FormValues, areas: Area[], conditionOptions, topN?): DiagnoseResult[]
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
   * 通勤時間の希望に応じた重み（路線マッチが見つかった場合の加点幅をスケール）
   * 短い通勤時間を希望するほど、路線が直結しているかどうかの重要度を上げる
   * @param {string} commute
   * @returns {number}
   */
  function commuteWeight(commute) {
    var map = {
      '〜15分': 8,
      '〜30分': 6,
      '〜45分': 4,
      '〜1時間': 2,
      '1時間以上可': 0,
    };
    return map[commute] != null ? map[commute] : 4;
  }
 
  /**
   * 通勤時間の希望に応じたペナルティ係数（路線が一切マッチしない場合の倍率）
   * 短時間通勤を希望しているのに直通路線がない場合、大きく減点する
   * @param {string} commute
   * @returns {number} 0〜1の倍率
   */
  function noMatchPenaltyMultiplier(commute) {
    var map = {
      '〜15分': 0.5,
      '〜30分': 0.65,
      '〜45分': 0.8,
      '〜1時間': 0.9,
      '1時間以上可': 1.0,
    };
    return map[commute] != null ? map[commute] : 0.85;
  }
 
  /**
   * メイン診断関数
   * @param {{ workplace:string, budget:string, commute:string, conditions:string[] }} values
   * @param {Area[]} areas
   * @param {ConditionOption[]} conditionOptions - scoreKeyのマッピングに使用
   * @param {number} [topN=3]
   * @returns {{ area:Area, score:number, matchPct:number, lineMatched:boolean }[]}
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
 
    // 入力された勤務地・通学先の最寄り駅から、該当する路線を特定
    var userLines = (typeof LineData !== 'undefined')
      ? LineData.detectLines(values.workplace)
      : [];
 
    var weight = commuteWeight(values.commute);
    var noMatchMultiplier = noMatchPenaltyMultiplier(values.commute);
 
    var scored = areas.map(function (area) {
      // ─ 重視条件のスコア合計 ─
      var conditionScore = 0;
      if (selectedConditions.length > 0) {
        selectedConditions.forEach(function (cond) {
          var key = conditionKeyMap[cond];
          if (key && area.score[key] != null) {
            conditionScore += area.score[key];
          }
        });
      } else {
        // 条件未選択時: アクセス・治安・利便性の合計をデフォルトスコアとする
        conditionScore = area.score.access + area.score.safe + area.score.convenient;
      }
 
      // ─ 予算オーバーのエリアはスコア大幅減 ─
      var budgetThreshold = thresholdToNumber(area.excludeIfBudgetBelow);
      var budgetPenalty = (budgetThreshold > 0 && userBudget < budgetThreshold) ? -6 : 0;
 
      // ─ 路線マッチによる通勤スコア ─
      var lineMatched = false;
      var commuteBonus = 0;
      if (userLines.length > 0) {
        var areaLines = area.lines || [];
        var hasCommonLine = areaLines.some(function (line) {
          return userLines.indexOf(line) !== -1;
        });
        if (hasCommonLine) {
          lineMatched = true;
          commuteBonus = weight; // 直通路線あり → 希望通勤時間の重みぶん加点
        }
      }
 
      var subtotal = conditionScore + budgetPenalty + commuteBonus;
 
      // ─ 路線情報はあるのにこのエリアとマッチしない場合のペナルティ ─
      // (希望通勤時間が短いほど厳しく減点)
      var rawScore = subtotal;
      if (userLines.length > 0 && !lineMatched) {
        rawScore = subtotal * noMatchMultiplier;
      }
 
      return {
        area: area,
        rawScore: rawScore,
        lineMatched: lineMatched,
      };
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
        lineMatched: item.lineMatched,
      };
    });
  }
 
  return { diagnose: diagnose };
})();
