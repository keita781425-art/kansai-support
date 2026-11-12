/**
 * stationData.js
 *
 * 入力された「最寄り駅」から、いちばん近い「ハブ駅」（areaData.js の HUBS）と、
 * そこからの追加の時間（分）を決めるための表。
 *
 * 当て方：入力の中から、表の言葉のうち「いちばん長いもの」を探す。
 *   例：「京都大学」は「京都」より長いので京都大学として扱う（京都駅にはしない）
 *       「四条畷」は「四条」より長いので四条畷として扱う
 * 表にない駅は「わからない」として、通勤時間ではしぼらない（診断結果にそう出す）。
 * 時間は Claude の目安。直したいときはこの表の数字を変える。
 */

var StationData = (function () {

  // [言葉, ハブ, 追加の分]
  var TABLE = [
    // ── 梅田 ──
    ['梅田', 'umeda', 0], ['大阪梅田', 'umeda', 0], ['東梅田', 'umeda', 0], ['西梅田', 'umeda', 0],
    ['大阪駅', 'umeda', 0], ['大阪', 'umeda', 0], ['北新地', 'umeda', 0], ['グランフロント', 'umeda', 0],
    ['中津', 'umeda', 2], ['中崎町', 'umeda', 2], ['扇町', 'umeda', 3], ['天満', 'umeda', 3],
    ['南森町', 'umeda', 3], ['大阪天満宮', 'umeda', 3], ['福島', 'umeda', 3], ['新福島', 'umeda', 3],
    ['野田', 'umeda', 5], ['十三', 'umeda', 4], ['塚本', 'umeda', 4], ['尼崎', 'umeda', 6],
    ['西九条', 'umeda', 6], ['天神橋筋六丁目', 'umeda', 5], ['天六', 'umeda', 5],
    // ── 淀屋橋 ──
    ['淀屋橋', 'yodoyabashi', 0], ['北浜', 'yodoyabashi', 2], ['大江橋', 'yodoyabashi', 1],
    ['なにわ橋', 'yodoyabashi', 2], ['肥後橋', 'yodoyabashi', 2], ['渡辺橋', 'yodoyabashi', 2],
    ['中之島', 'yodoyabashi', 3], ['天満橋', 'yodoyabashi', 3],
    // ── 本町 ──
    ['本町', 'hommachi', 0], ['堺筋本町', 'hommachi', 2], ['堺筋', 'hommachi', 3], ['心斎橋', 'hommachi', 3],
    ['四ツ橋', 'hommachi', 3], ['長堀橋', 'hommachi', 4], ['阿波座', 'hommachi', 2],
    ['西長堀', 'hommachi', 4], ['谷町四丁目', 'hommachi', 4], ['谷町六丁目', 'hommachi', 6],
    ['松屋町', 'hommachi', 5], ['靱公園', 'hommachi', 2], ['九条', 'hommachi', 4],
    // ── 難波 ──
    ['難波', 'namba', 0], ['なんば', 'namba', 0], ['大阪難波', 'namba', 0], ['日本橋', 'namba', 2],
    ['近鉄日本橋', 'namba', 2], ['桜川', 'namba', 3], ['大国町', 'namba', 3], ['恵美須町', 'namba', 4],
    ['汐見橋', 'namba', 4], ['ドーム前', 'namba', 8], ['大正', 'namba', 8],
    // ── 天王寺 ──
    ['天王寺', 'tennoji', 0], ['阿倍野', 'tennoji', 0], ['あべの', 'tennoji', 0], ['大阪阿部野橋', 'tennoji', 0],
    ['新今宮', 'tennoji', 3], ['動物園前', 'tennoji', 3], ['寺田町', 'tennoji', 3], ['昭和町', 'tennoji', 4],
    ['上本町', 'tennoji', 6], ['大阪上本町', 'tennoji', 6], ['谷町九丁目', 'tennoji', 6], ['鶴橋', 'tennoji', 6],
    ['桃谷', 'tennoji', 5], ['西田辺', 'tennoji', 6], ['あびこ', 'tennoji', 10], ['我孫子', 'tennoji', 10],
    ['堺', 'namba', 15], ['なかもず', 'namba', 22], ['中百舌鳥', 'namba', 22],
    // ── 京橋 ──
    ['京橋', 'kyobashi', 0], ['大阪城公園', 'kyobashi', 2], ['大阪ビジネスパーク', 'kyobashi', 3],
    ['大阪城北詰', 'kyobashi', 2], ['森ノ宮', 'kyobashi', 3], ['森之宮', 'kyobashi', 3],
    ['桜ノ宮', 'kyobashi', 3], ['都島', 'kyobashi', 4], ['蒲生四丁目', 'kyobashi', 4], ['玉造', 'kyobashi', 5],
    ['枚方', 'kyobashi', 22], ['門真', 'kyobashi', 12], ['守口', 'kyobashi', 10], ['四条畷', 'kyobashi', 20],
    // ── 新大阪 ──
    ['新大阪', 'shinosaka', 0], ['西中島南方', 'shinosaka', 2], ['南方', 'shinosaka', 2], ['東三国', 'shinosaka', 3],
    ['三国', 'umeda', 8], ['江坂', 'shinosaka', 6], ['吹田', 'shinosaka', 6], ['千里中央', 'shinosaka', 14],
    ['桃山台', 'shinosaka', 11], ['緑地公園', 'shinosaka', 9], ['淡路', 'shinosaka', 10], ['茨木', 'shinosaka', 10],
    ['高槻', 'shinosaka', 12], ['阪大', 'shinosaka', 25], ['大阪大学', 'shinosaka', 25], ['関西大学', 'shinosaka', 20],
    ['関大', 'shinosaka', 20], ['豊中', 'umeda', 15], ['伊丹', 'umeda', 20],
    // ── 京都駅 ──
    ['京都駅', 'kyoto', 0], ['京都', 'kyoto', 0], ['東福寺', 'kyoto', 4], ['丹波口', 'kyoto', 3],
    ['梅小路', 'kyoto', 3], ['山科', 'kyoto', 5], ['長岡京', 'kyoto', 12], ['向日町', 'kyoto', 8],
    ['伏見', 'kyoto', 12], ['大津', 'kyoto', 10], ['膳所', 'kyoto', 12], ['石山', 'kyoto', 15],
    ['瀬田', 'kyoto', 15], ['南草津', 'kyoto', 18], ['草津', 'kyoto', 20], ['立命館大学びわこ', 'kyoto', 30],
    // ── 四条烏丸 ──
    ['四条', 'shijo', 0], ['烏丸', 'shijo', 0], ['四条烏丸', 'shijo', 0], ['烏丸御池', 'shijo', 2],
    ['河原町', 'shijo', 3], ['京都河原町', 'shijo', 3], ['祇園四条', 'shijo', 4], ['祇園', 'shijo', 5],
    ['三条', 'shijo', 5], ['京都市役所前', 'shijo', 3], ['丸太町', 'shijo', 4], ['今出川', 'shijo', 6],
    ['大宮', 'shijo', 3], ['西院', 'shijo', 5], ['二条', 'shijo', 6], ['円町', 'shijo', 10],
    ['北大路', 'shijo', 10], ['出町柳', 'shijo', 12], ['京都大学', 'shijo', 12], ['京大', 'shijo', 12],
    ['同志社', 'shijo', 6], ['立命館', 'shijo', 25], ['桂', 'shijo', 10],
    // ── 三宮 ──
    ['三宮', 'sannomiya', 0], ['三ノ宮', 'sannomiya', 0], ['神戸三宮', 'sannomiya', 0], ['元町', 'sannomiya', 2],
    ['新神戸', 'sannomiya', 3], ['神戸駅', 'sannomiya', 4], ['ハーバーランド', 'sannomiya', 5],
    ['ポートアイランド', 'sannomiya', 10], ['六甲道', 'sannomiya', 6], ['六甲', 'sannomiya', 8],
    ['神戸大学', 'sannomiya', 20], ['岡本', 'sannomiya', 10],
    ['芦屋', 'sannomiya', 12], ['西宮', 'umeda', 14], ['西宮北口', 'umeda', 14], ['甲子園', 'umeda', 15],
    ['神戸', 'sannomiya', 3],
    // ── 奈良 ──
    ['生駒', 'namba', 20], ['大和西大寺', 'namba', 30], ['奈良', 'namba', 40],
  ];

  function normalize(s) {
    return String(s || '').normalize('NFKC').replace(/\s+/g, '');
  }

  /**
   * 入力の文字から、いちばん長く当たった言葉のハブを返す
   * @param {string} text
   * @returns {{ hub:string, extra:number, word:string } | null}
   */
  function findHub(text) {
    var s = normalize(text);
    if (!s) return null;
    var best = null;
    TABLE.forEach(function (row) {
      if (s.indexOf(row[0]) === -1) return;
      if (!best || row[0].length > best.word.length) best = { word: row[0], hub: row[1], extra: row[2] };
    });
    return best;
  }

  /**
   * 最寄り駅①→②→勤務地の文字の順に探す（最初に当たったものを使う）
   * @param {string[]} texts
   */
  function findHubFrom(texts) {
    for (var i = 0; i < texts.length; i++) {
      var r = findHub(texts[i]);
      if (r) return r;
    }
    return null;
  }

  return { findHub: findHub, findHubFrom: findHubFrom, TABLE: TABLE };
})();
