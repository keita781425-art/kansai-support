/**
 * lib/lineData.js
 *
 * 関西の主要駅と、その駅が通る路線の対応表。
 * ユーザーが入力した「最寄り駅」の文字列から、該当する路線を特定するために使用します。
 *
 * Next.js移行時: lib/lineData.ts として使用
 * 型定義例:
 *   type LineId = 'midosuji'|'hankyu_kobe'|'hankyu_kyoto'|'hanshin'|'jr_kobe'|'jr_kyoto'|
 *                  'jr_osaka_loop'|'kintetsu_nara'|'kintetsu_kyoto'|'tanimachi'|'keihan'|
 *                  'jr_naniwasuji'|'jr_nara'|'jr_kansai'|'subway_karasuma'|'subway_kobe'|
 *                  'subway_nagahori'|'randen'|'nankai'|'jr_takatsuki'|'eizan'
 *   type StationEntry = { keywords:string[]; lines:LineId[] }
 */
 
var LineData = (function () {
 
  /**
   * 主要駅 → 通っている路線のマッピング
   * keywords: ユーザー入力に含まれていればこの駅とみなすキーワード群（表記ゆれ対応）
   * lines: その駅を通る路線ID
   */
  var STATIONS = [
    { keywords: ['梅田', 'うめだ', '大阪駅', 'おおさか駅'], lines: ['midosuji', 'hankyu_kobe', 'hankyu_kyoto', 'hanshin', 'jr_osaka_loop', 'jr_kobe', 'jr_kyoto'] },
    { keywords: ['難波', 'なんば', 'ナンバ'], lines: ['midosuji', 'kintetsu_nara', 'jr_naniwasuji'] },
    { keywords: ['天王寺', 'てんのうじ', '阿倍野'], lines: ['midosuji', 'tanimachi', 'jr_osaka_loop', 'jr_kansai'] },
    { keywords: ['新大阪', 'しんおおさか', '東三国', 'ひがしみくに'], lines: ['midosuji', 'jr_kyoto', 'jr_kobe'] },
    { keywords: ['京都駅', 'きょうと駅', '京都'], lines: ['jr_kyoto', 'kintetsu_kyoto', 'jr_nara'] },
    { keywords: ['四条', 'しじょう', '烏丸'], lines: ['hankyu_kyoto', 'subway_karasuma'] },
    { keywords: ['西院', 'さいいん'], lines: ['hankyu_kyoto', 'randen'] },
    { keywords: ['三宮', 'さんのみや', '三ノ宮'], lines: ['jr_kobe', 'hankyu_kobe', 'hanshin', 'subway_kobe'] },
    { keywords: ['元町', 'もとまち'], lines: ['jr_kobe', 'hanshin'] },
    { keywords: ['西宮', 'にしのみや'], lines: ['hankyu_kobe', 'hanshin', 'jr_kobe'] },
    { keywords: ['甲子園', 'こうしえん'], lines: ['hanshin'] },
    { keywords: ['江坂', 'えさか'], lines: ['midosuji'] },
    { keywords: ['吹田', 'すいた'], lines: ['jr_kyoto', 'midosuji'] },
    { keywords: ['茨木', 'いばらき'], lines: ['jr_kyoto', 'hankyu_kyoto'] },
    { keywords: ['奈良', 'なら'], lines: ['kintetsu_nara', 'jr_nara'] },
    { keywords: ['伏見', 'ふしみ', '桃山', 'ももやま'], lines: ['kintetsu_kyoto', 'jr_nara', 'keihan'] },
    { keywords: ['長居', 'ながい', '我孫子', 'あびこ'], lines: ['midosuji'] },
    { keywords: ['心斎橋', 'しんさいばし'], lines: ['midosuji', 'subway_nagahori'] },
    { keywords: ['北堀江', '西長堀', 'にしながほり'], lines: ['subway_nagahori'] },
    { keywords: ['尼崎', 'あまがさき'], lines: ['jr_kobe', 'hanshin', 'hankyu_kobe'] },
    { keywords: ['豊中', 'とよなか', '曽根', 'そね'], lines: ['hankyu_kyoto', 'midosuji'] },
    { keywords: ['枚方', 'ひらかた'], lines: ['keihan'] },
    { keywords: ['東大阪', '布施', 'ふせ'], lines: ['kintetsu_nara'] },
    { keywords: ['堺', 'さかい'], lines: ['jr_kansai', 'nankai'] },
    { keywords: ['福島', 'ふくしま', '野田', 'のだ'], lines: ['jr_osaka_loop', 'jr_kobe', 'hanshin'] },
    { keywords: ['高槻', 'たかつき'], lines: ['jr_kyoto', 'jr_takatsuki', 'hankyu_kyoto'] },
    { keywords: ['千里中央', 'せんりちゅうおう', '千里', 'せんり'], lines: ['midosuji'] },
    { keywords: ['桂', 'かつら', '洛西口', 'らくさいぐち'], lines: ['hankyu_kyoto'] },
    { keywords: ['出町柳', 'でまちやなぎ'], lines: ['keihan', 'eizan'] },
    { keywords: ['山科', 'やましな'], lines: ['jr_kyoto', 'keihan', 'subway_karasuma'] },
    { keywords: ['岡本', 'おかもと', '摂津本山', 'せっつもとやま'], lines: ['jr_kobe', 'hankyu_kobe'] },
    { keywords: ['生駒', 'いこま'], lines: ['kintetsu_nara'] },
  ];
 
  /**
   * ユーザー入力(駅名)から該当する路線IDの配列を返す
   * 部分一致・複数駅指定に対応（カンマ・スペース・読点区切り）
   * @param {string} input
   * @returns {string[]} 重複なしの路線IDリスト
   */
  function detectLines(input) {
    if (!input) return [];
    var normalized = input.trim();
    if (!normalized) return [];
 
    var matchedLines = {};
    STATIONS.forEach(function (station) {
      station.keywords.forEach(function (kw) {
        if (normalized.indexOf(kw) !== -1) {
          station.lines.forEach(function (line) {
            matchedLines[line] = true;
          });
        }
      });
    });
 
    return Object.keys(matchedLines);
  }
 
  return {
    STATIONS: STATIONS,
    detectLines: detectLines,
  };
})();
