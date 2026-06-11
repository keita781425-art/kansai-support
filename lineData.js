/**
 * lib/lineData.js
 *
 * 関西の主要路線・各駅と、その駅が通る路線の対応表。
 * ユーザーが入力した「最寄り駅」の文字列から、該当する路線を特定するために使用します。
 *
 * Next.js移行時: lib/lineData.ts として使用
 *
 * 型定義例:
 *   type LineId =
 *     | 'midosuji' | 'tanimachi' | 'yotsubashi' | 'sennichimae' | 'sakaisuji'
 *     | 'subway_nagahori' | 'chuo' | 'subway_kobe' | 'subway_karasuma'
 *     | 'jr_kyoto' | 'jr_kobe' | 'jr_osaka_loop' | 'jr_kansai' | 'jr_nara'
 *     | 'jr_takatsuki' | 'jr_naniwasuji' | 'jr_tozai' | 'jr_gakkentoshi' | 'jr_kosei'
 *     | 'hankyu_kyoto' | 'hankyu_kobe' | 'hankyu_takarazuka' | 'hankyu_minoo' | 'hankyu_imazu'
 *     | 'hanshin' | 'hanshin_namba'
 *     | 'kintetsu_nara' | 'kintetsu_kyoto' | 'kintetsu_osaka' | 'kintetsu_minami_osaka'
 *     | 'keihan' | 'keihan_keishin' | 'eizan' | 'randen' | 'nankai'
 *
 *   type StationEntry = { keywords:string[]; lines:LineId[] }
 *
 * 収録範囲(約190駅):
 *   - 大阪メトロ: 御堂筋線・谷町線・四つ橋線・千日前線・堺筋線・長堀鶴見緑地線・中央線
 *   - JR: 京都線・神戸線・大阪環状線・大和路線・おおさか東線・学研都市線・湖西線・JR神戸線(西)
 *   - 阪急: 京都線・神戸線・宝塚線・箕面線・今津線
 *   - 阪神: 本線・なんば線
 *   - 近鉄: 奈良線・京都線・大阪線・南大阪線
 *   - 京阪: 本線・鴨東線・京津線
 *   - 京都市営地下鉄: 烏丸線・東西線
 *   - 神戸市営地下鉄: 西神・山手線
 *   - 嵐電・叡山電鉄・南海
 */
 
var LineData = (function () {
 
  /**
   * 1回の乗り換えで実質的にアクセス可能とみなす路線の接続マップ。
   * key: 起点路線、value: その路線から1回の乗換で到達できる主要路線
   * (双方向に定義。支線→幹線の接続を中心に、新卒・学生の生活圏で
   *  現実的に使われる組み合わせのみ収録)
   */
  var LINE_CONNECTIONS = {
    // 阪急 箕面線 → 石橋阪大前で宝塚線に接続
    hankyu_minoo: ['hankyu_takarazuka'],
    hankyu_takarazuka: ['hankyu_minoo'],
 
    // 阪急 今津線 → 西宮北口で神戸線、宝塚で宝塚線に接続
    hankyu_imazu: ['hankyu_kobe', 'hankyu_takarazuka', 'hanshin'],
 
    // 嵐電 → 西院・太秦天神川で阪急京都線・地下鉄東西線に接続
    randen: ['hankyu_kyoto', 'subway_tozai_kyoto'],
 
    // 叡山電鉄 → 出町柳で京阪鴨東線に接続
    eizan: ['keihan'],
 
    // 京阪 京津線 → 山科でJR・地下鉄東西線に接続
    keihan_keishin: ['jr_kyoto', 'subway_tozai_kyoto', 'keihan'],
 
    // JR学研都市線 → 京橋でJR大阪環状線・東西線に接続
    jr_gakkentoshi: ['jr_tozai', 'jr_osaka_loop'],
 
    // JRおおさか東線 → 新大阪でJR京都線・神戸線、放出で学研都市線に接続
    jr_osaka_higashi: ['jr_kyoto', 'jr_kobe', 'jr_gakkentoshi'],
 
    // 近鉄南大阪線 → 大阪阿部野橋(天王寺)で御堂筋線・JR各線に接続
    kintetsu_minami_osaka: ['midosuji', 'jr_osaka_loop', 'jr_kansai'],
 
    // 近鉄大阪線 → 鶴橋で大阪環状線・近鉄奈良線に接続
    kintetsu_osaka: ['jr_osaka_loop', 'kintetsu_nara'],
 
    // 神戸市営地下鉄 西神・山手線 → 新長田・三宮でJR神戸線・阪急・阪神に接続
    subway_kobe: ['jr_kobe', 'hankyu_kobe', 'hanshin'],
 
    // 京都市営地下鉄 東西線 → 烏丸御池で烏丸線、山科でJR・京阪に接続
    subway_tozai_kyoto: ['subway_karasuma', 'jr_kyoto', 'keihan'],
 
    // 京都市営地下鉄 烏丸線 → 京都駅でJR京都線・近鉄京都線に接続
    subway_karasuma: ['jr_kyoto', 'kintetsu_kyoto', 'subway_tozai_kyoto'],
 
    // JR湖西線 → 山科でJR京都線・地下鉄東西線に接続
    jr_kosei: ['jr_kyoto', 'subway_tozai_kyoto', 'keihan_keishin'],
 
    // 阪神なんば線 → 大阪難波で御堂筋線・近鉄奈良線に接続
    hanshin_namba: ['midosuji', 'kintetsu_nara'],
 
    // 大阪メトロ 長堀鶴見緑地線 → 心斎橋で御堂筋線に接続
    subway_nagahori: ['midosuji'],
  };
 
  /**
   * 主要駅 → 通っている路線のマッピング
   * keywords: ユーザー入力に含まれていればこの駅とみなすキーワード群（表記ゆれ対応）
   * lines: その駅を通る路線ID
   */
  var STATIONS = [
 
    // ═══════════════════════════════════════
    // 大阪メトロ 御堂筋線
    // ═══════════════════════════════════════
    { keywords: ['江坂', 'えさか'], lines: ['midosuji'] },
    { keywords: ['東三国', 'ひがしみくに'], lines: ['midosuji'] },
    { keywords: ['新大阪', 'しんおおさか'], lines: ['midosuji', 'jr_kyoto', 'jr_kobe'] },
    { keywords: ['西中島南方', 'にしなかじまみなみがた', '西中島', '南方'], lines: ['midosuji', 'hankyu_kyoto'] },
    { keywords: ['中津', 'なかつ'], lines: ['midosuji', 'hankyu_kobe', 'hankyu_kyoto', 'hankyu_takarazuka'] },
    { keywords: ['梅田', 'うめだ', '大阪駅', 'おおさか駅'], lines: ['midosuji', 'hankyu_kobe', 'hankyu_kyoto', 'hankyu_takarazuka', 'hanshin', 'jr_osaka_loop', 'jr_kobe', 'jr_kyoto'] },
    { keywords: ['淀屋橋', 'よどやばし'], lines: ['midosuji', 'keihan'] },
    { keywords: ['本町', 'ほんまち'], lines: ['midosuji', 'yotsubashi', 'chuo'] },
    { keywords: ['心斎橋', 'しんさいばし'], lines: ['midosuji', 'subway_nagahori'] },
    { keywords: ['難波', 'なんば', 'ナンバ'], lines: ['midosuji', 'kintetsu_nara', 'jr_naniwasuji', 'hanshin_namba', 'nankai', 'sennichimae', 'yotsubashi'] },
    { keywords: ['大国町', 'だいこくちょう'], lines: ['midosuji', 'yotsubashi'] },
    { keywords: ['動物園前', 'どうぶつえんまえ', '新今宮', 'しんいまみや'], lines: ['midosuji', 'sakaisuji', 'jr_osaka_loop', 'jr_kansai', 'nankai'] },
    { keywords: ['天王寺', 'てんのうじ', '阿倍野'], lines: ['midosuji', 'tanimachi', 'jr_osaka_loop', 'jr_kansai', 'jr_kansai_airport', 'kintetsu_minami_osaka'] },
    { keywords: ['昭和町', 'しょうわちょう'], lines: ['midosuji'] },
    { keywords: ['西田辺', 'にしたなべ'], lines: ['midosuji'] },
    { keywords: ['長居', 'ながい'], lines: ['midosuji'] },
    { keywords: ['我孫子', 'あびこ'], lines: ['midosuji'] },
    { keywords: ['北花田', 'きたはなだ'], lines: ['midosuji'] },
    { keywords: ['新金岡', 'しんかなおか'], lines: ['midosuji'] },
    { keywords: ['なかもず', '中百舌鳥'], lines: ['midosuji', 'kintetsu_minami_osaka'] },
    { keywords: ['千里中央', 'せんりちゅうおう', '千里', 'せんり'], lines: ['midosuji'] },
    { keywords: ['江坂', 'えさか'], lines: ['midosuji'] },
    { keywords: ['東梅田', 'ひがしうめだ'], lines: ['tanimachi'] },
 
    // ═══════════════════════════════════════
    // 大阪メトロ 谷町線
    // ═══════════════════════════════════════
    { keywords: ['谷町四丁目', 'たにまちよんちょうめ', '谷町六丁目', 'たにまちろくちょうめ', '谷町九丁目', 'たにまちきゅうちょうめ'], lines: ['tanimachi'] },
    { keywords: ['天満橋', 'てんまばし'], lines: ['tanimachi', 'keihan'] },
    { keywords: ['南森町', 'みなみもりまち'], lines: ['tanimachi', 'sakaisuji'] },
    { keywords: ['東梅田', 'ひがしうめだ'], lines: ['tanimachi'] },
    { keywords: ['大日', 'だいにち'], lines: ['tanimachi'] },
    { keywords: ['守口', 'もりぐち'], lines: ['tanimachi', 'keihan'] },
    { keywords: ['平野', 'ひらの'], lines: ['tanimachi'] },
    { keywords: ['八尾南', 'やおみなみ'], lines: ['tanimachi'] },
 
    // ═══════════════════════════════════════
    // 大阪メトロ 四つ橋線
    // ═══════════════════════════════════════
    { keywords: ['西梅田', 'にしうめだ'], lines: ['yotsubashi'] },
    { keywords: ['四ツ橋', 'よつばし'], lines: ['yotsubashi'] },
    { keywords: ['玉出', 'たまで'], lines: ['yotsubashi'] },
    { keywords: ['住之江公園', 'すみのえこうえん'], lines: ['yotsubashi'] },
 
    // ═══════════════════════════════════════
    // 大阪メトロ 千日前線
    // ═══════════════════════════════════════
    { keywords: ['今里', 'いまざと'], lines: ['sennichimae', 'jr_tozai'] },
    { keywords: ['鶴橋', 'つるはし'], lines: ['sennichimae', 'kintetsu_nara', 'kintetsu_osaka', 'jr_osaka_loop'] },
    { keywords: ['谷町九丁目', 'たにまちきゅうちょうめ'], lines: ['tanimachi', 'sennichimae'] },
 
    // ═══════════════════════════════════════
    // 大阪メトロ 堺筋線
    // ═══════════════════════════════════════
    { keywords: ['南森町', 'みなみもりまち'], lines: ['tanimachi', 'sakaisuji'] },
    { keywords: ['北浜', 'きたはま'], lines: ['sakaisuji', 'keihan'] },
    { keywords: ['日本橋', 'にっぽんばし'], lines: ['sakaisuji', 'sennichimae', 'kintetsu_nara'] },
    { keywords: ['恵美須町', 'えびすちょう'], lines: ['sakaisuji'] },
    { keywords: ['天神橋筋六丁目', 'てんじんばしすじろくちょうめ', '天六'], lines: ['sakaisuji', 'subway_tanimachi_loop'] },
 
    // ═══════════════════════════════════════
    // 大阪メトロ 長堀鶴見緑地線
    // ═══════════════════════════════════════
    { keywords: ['北堀江', '西長堀', 'にしながほり'], lines: ['subway_nagahori'] },
    { keywords: ['京橋', 'きょうばし'], lines: ['subway_nagahori', 'jr_osaka_loop', 'jr_tozai', 'keihan'] },
    { keywords: ['鶴見緑地', 'つるみりょくち'], lines: ['subway_nagahori'] },
    { keywords: ['門真南', 'かどまみなみ'], lines: ['subway_nagahori'] },
    { keywords: ['大正', 'たいしょう'], lines: ['subway_nagahori', 'jr_osaka_loop'] },
 
    // ═══════════════════════════════════════
    // 大阪メトロ 中央線
    // ═══════════════════════════════════════
    { keywords: ['森ノ宮', 'もりのみや'], lines: ['chuo', 'jr_osaka_loop'] },
    { keywords: ['弁天町', 'べんてんちょう'], lines: ['chuo', 'jr_osaka_loop'] },
    { keywords: ['コスモスクエア'], lines: ['chuo'] },
    { keywords: ['長田', 'ながた'], lines: ['chuo', 'kintetsu_keihanna'] },
 
    // ═══════════════════════════════════════
    // JR京都線・JR神戸線(東海道・山陽本線)
    // ═══════════════════════════════════════
    { keywords: ['大阪城北詰', 'おおさかじょうきたづめ'], lines: ['jr_tozai'] },
    { keywords: ['桂川', 'かつらがわ'], lines: ['jr_kyoto'] },
    { keywords: ['西大路', 'にしおおじ'], lines: ['jr_kyoto'] },
    { keywords: ['向日町', 'むこうまち'], lines: ['jr_kyoto'] },
    { keywords: ['長岡京', 'ながおかきょう'], lines: ['jr_kyoto'] },
    { keywords: ['山崎', 'やまざき'], lines: ['jr_kyoto'] },
    { keywords: ['島本', 'しまもと'], lines: ['jr_kyoto'] },
    { keywords: ['高槻', 'たかつき'], lines: ['jr_kyoto', 'jr_takatsuki', 'hankyu_kyoto'] },
    { keywords: ['摂津富田', 'せっつとんだ'], lines: ['jr_kyoto'] },
    { keywords: ['茨木', 'いばらき'], lines: ['jr_kyoto', 'hankyu_kyoto'] },
    { keywords: ['千里丘', 'せんりおか'], lines: ['jr_kyoto'] },
    { keywords: ['岸辺', 'きしべ'], lines: ['jr_kyoto'] },
    { keywords: ['吹田', 'すいた'], lines: ['jr_kyoto', 'midosuji'] },
    { keywords: ['東淀川', 'ひがしよどがわ'], lines: ['jr_kyoto'] },
    { keywords: ['塚本', 'つかもと'], lines: ['jr_kobe'] },
    { keywords: ['尼崎', 'あまがさき'], lines: ['jr_kobe', 'hanshin', 'hankyu_kobe'] },
    { keywords: ['立花', 'たちばな'], lines: ['jr_kobe'] },
    { keywords: ['甲子園口', 'こうしえんぐち'], lines: ['jr_kobe'] },
    { keywords: ['西宮', 'にしのみや'], lines: ['hankyu_kobe', 'hanshin', 'jr_kobe'] },
    { keywords: ['さくら夙川', 'さくらしゅくがわ'], lines: ['jr_kobe'] },
    { keywords: ['芦屋', 'あしや'], lines: ['jr_kobe', 'hankyu_kobe', 'hanshin'] },
    { keywords: ['甲南山手', 'こうなんやまて'], lines: ['jr_kobe'] },
    { keywords: ['摂津本山', 'せっつもとやま', '岡本', 'おかもと'], lines: ['jr_kobe', 'hankyu_kobe'] },
    { keywords: ['住吉', 'すみよし'], lines: ['jr_kobe', 'hankyu_kobe', 'hanshin'] },
    { keywords: ['六甲道', 'ろっこうみち'], lines: ['jr_kobe'] },
    { keywords: ['灘', 'なだ'], lines: ['jr_kobe', 'hanshin'] },
    { keywords: ['三ノ宮', '三宮', 'さんのみや'], lines: ['jr_kobe', 'hankyu_kobe', 'hanshin', 'subway_kobe'] },
    { keywords: ['元町', 'もとまち'], lines: ['jr_kobe', 'hanshin'] },
    { keywords: ['神戸', 'こうべ'], lines: ['jr_kobe', 'hanshin'] },
 
    // ═══════════════════════════════════════
    // JR大阪環状線
    // ═══════════════════════════════════════
    { keywords: ['福島', 'ふくしま'], lines: ['jr_osaka_loop', 'jr_kobe', 'hanshin'] },
    { keywords: ['野田', 'のだ'], lines: ['jr_osaka_loop', 'jr_kobe', 'hanshin'] },
    { keywords: ['西九条', 'にしくじょう'], lines: ['jr_osaka_loop', 'jr_yumesaki', 'hanshin_namba'] },
    { keywords: ['芦原橋', 'あしはらばし'], lines: ['jr_osaka_loop'] },
    { keywords: ['今宮', 'いまみや'], lines: ['jr_osaka_loop', 'jr_naniwasuji'] },
    { keywords: ['桃谷', 'ももだに'], lines: ['jr_osaka_loop'] },
    { keywords: ['寺田町', 'てらだちょう'], lines: ['jr_osaka_loop'] },
    { keywords: ['玉造', 'たまつくり'], lines: ['jr_osaka_loop'] },
    { keywords: ['桜ノ宮', 'さくらのみや'], lines: ['jr_osaka_loop'] },
    { keywords: ['天満', 'てんま'], lines: ['jr_osaka_loop'] },
 
    // ═══════════════════════════════════════
    // JR大和路線(関西本線)
    // ═══════════════════════════════════════
    { keywords: ['東部市場前', 'とうぶしじょうまえ'], lines: ['jr_kansai'] },
    { keywords: ['平野', 'ひらの'], lines: ['jr_kansai', 'tanimachi'] },
    { keywords: ['加美', 'かみ'], lines: ['jr_kansai'] },
    { keywords: ['八尾', 'やお'], lines: ['jr_kansai'] },
    { keywords: ['久宝寺', 'きゅうほうじ'], lines: ['jr_kansai', 'jr_osaka_higashi'] },
    { keywords: ['王寺', 'おうじ'], lines: ['jr_kansai', 'jr_wakayama', 'kintetsu_ikoma'] },
    { keywords: ['法隆寺', 'ほうりゅうじ'], lines: ['jr_kansai'] },
 
    // ═══════════════════════════════════════
    // JR奈良線
    // ═══════════════════════════════════════
    { keywords: ['東福寺', 'とうふくじ'], lines: ['jr_nara', 'keihan'] },
    { keywords: ['稲荷', 'いなり'], lines: ['jr_nara'] },
    { keywords: ['JR藤森', 'ふじのもり'], lines: ['jr_nara'] },
    { keywords: ['桃山', 'ももやま'], lines: ['jr_nara', 'kintetsu_kyoto', 'keihan'] },
    { keywords: ['六地蔵', 'ろくじぞう'], lines: ['jr_nara', 'subway_tozai_kyoto', 'keihan'] },
    { keywords: ['宇治', 'うじ'], lines: ['jr_nara', 'keihan'] },
    { keywords: ['新田', 'しんでん'], lines: ['jr_nara'] },
    { keywords: ['城陽', 'じょうよう'], lines: ['jr_nara'] },
    { keywords: ['木津', 'きづ'], lines: ['jr_nara', 'jr_gakkentoshi'] },
    { keywords: ['奈良', 'なら'], lines: ['kintetsu_nara', 'jr_nara'] },
 
    // ═══════════════════════════════════════
    // JRおおさか東線
    // ═══════════════════════════════════════
    { keywords: ['放出', 'はなてん'], lines: ['jr_osaka_higashi', 'jr_gakkentoshi'] },
    { keywords: ['新加美', 'しんかみ'], lines: ['jr_osaka_higashi'] },
    { keywords: ['鴫野', 'しぎの'], lines: ['jr_osaka_higashi', 'jr_gakkentoshi'] },
 
    // ═══════════════════════════════════════
    // JR学研都市線(片町線)
    // ═══════════════════════════════════════
    { keywords: ['四条畷', 'しじょうなわて'], lines: ['jr_gakkentoshi'] },
    { keywords: ['松井山手', 'まついやまて'], lines: ['jr_gakkentoshi'] },
    { keywords: ['長尾', 'ながお'], lines: ['jr_gakkentoshi'] },
    { keywords: ['同志社前', 'どうししゃまえ'], lines: ['jr_gakkentoshi'] },
    { keywords: ['京田辺', 'きょうたなべ'], lines: ['jr_gakkentoshi'] },
 
    // ═══════════════════════════════════════
    // JR湖西線
    // ═══════════════════════════════════════
    { keywords: ['大津京', 'おおつきょう'], lines: ['jr_kosei', 'keihan_keishin'] },
    { keywords: ['堅田', 'かたた'], lines: ['jr_kosei'] },
 
    // ═══════════════════════════════════════
    // 阪急京都線
    // ═══════════════════════════════════════
    { keywords: ['十三', 'じゅうそう'], lines: ['hankyu_kyoto', 'hankyu_kobe', 'hankyu_takarazuka'] },
    { keywords: ['南方', 'みなみがた'], lines: ['hankyu_kyoto', 'midosuji'] },
    { keywords: ['上新庄', 'かみしんじょう'], lines: ['hankyu_kyoto'] },
    { keywords: ['正雀', 'しょうじゃく'], lines: ['hankyu_kyoto'] },
    { keywords: ['相川', 'あいかわ'], lines: ['hankyu_kyoto'] },
    { keywords: ['南茨木', 'みなみいばらき'], lines: ['hankyu_kyoto', 'subway_monorail'] },
    { keywords: ['総持寺', 'そうじじ'], lines: ['hankyu_kyoto'] },
    { keywords: ['富田', 'とんだ'], lines: ['hankyu_kyoto'] },
    { keywords: ['高槻市', 'たかつきし'], lines: ['hankyu_kyoto'] },
    { keywords: ['上牧', 'かんまき'], lines: ['hankyu_kyoto'] },
    { keywords: ['水無瀬', 'みなせ'], lines: ['hankyu_kyoto'] },
    { keywords: ['大山崎', 'おおやまざき'], lines: ['hankyu_kyoto'] },
    { keywords: ['西山天王山', 'にしやまてんのうざん'], lines: ['hankyu_kyoto'] },
    { keywords: ['長岡天神', 'ながおかてんじん'], lines: ['hankyu_kyoto'] },
    { keywords: ['西向日', 'にしむこう'], lines: ['hankyu_kyoto'] },
    { keywords: ['東向日', 'ひがしむこう'], lines: ['hankyu_kyoto'] },
    { keywords: ['洛西口', 'らくさいぐち'], lines: ['hankyu_kyoto'] },
    { keywords: ['桂', 'かつら'], lines: ['hankyu_kyoto'] },
    { keywords: ['西京極', 'にしきょうごく'], lines: ['hankyu_kyoto'] },
    { keywords: ['西院', 'さいいん'], lines: ['hankyu_kyoto', 'randen'] },
    { keywords: ['大宮', 'おおみや', '四条大宮'], lines: ['hankyu_kyoto', 'randen'] },
    { keywords: ['烏丸', 'からすま', '四条', 'しじょう'], lines: ['hankyu_kyoto', 'subway_karasuma'] },
    { keywords: ['河原町', 'かわらまち', '京都河原町'], lines: ['hankyu_kyoto'] },
 
    // ═══════════════════════════════════════
    // 阪急神戸線
    // ═══════════════════════════════════════
    { keywords: ['神崎川', 'かんざきがわ'], lines: ['hankyu_kobe'] },
    { keywords: ['園田', 'そのだ'], lines: ['hankyu_kobe'] },
    { keywords: ['塚口', 'つかぐち'], lines: ['hankyu_kobe', 'hankyu_imazu'] },
    { keywords: ['武庫之荘', 'むこのそう'], lines: ['hankyu_kobe'] },
    { keywords: ['western', '西宮北口', 'にしのみやきたぐち'], lines: ['hankyu_kobe', 'hankyu_imazu'] },
    { keywords: ['夙川', 'しゅくがわ'], lines: ['hankyu_kobe'] },
    { keywords: ['岡本', 'おかもと'], lines: ['hankyu_kobe', 'jr_kobe'] },
    { keywords: ['御影', 'みかげ'], lines: ['hankyu_kobe', 'hanshin'] },
    { keywords: ['六甲', 'ろっこう'], lines: ['hankyu_kobe'] },
    { keywords: ['王子公園', 'おうじこうえん'], lines: ['hankyu_kobe'] },
    { keywords: ['花隈', 'はなくま'], lines: ['hankyu_kobe'] },
 
    // ═══════════════════════════════════════
    // 阪急宝塚線
    // ═══════════════════════════════════════
    { keywords: ['豊中', 'とよなか'], lines: ['hankyu_takarazuka'] },
    { keywords: ['曽根', 'そね'], lines: ['hankyu_takarazuka'] },
    { keywords: ['岡町', 'おかまち'], lines: ['hankyu_takarazuka'] },
    { keywords: ['池田', 'いけだ'], lines: ['hankyu_takarazuka'] },
    { keywords: ['川西能勢口', 'かわにしのせぐち'], lines: ['hankyu_takarazuka'] },
    { keywords: ['石橋阪大前', '石橋', 'いしばし'], lines: ['hankyu_takarazuka', 'hankyu_minoo'] },
    { keywords: ['宝塚', 'たからづか'], lines: ['hankyu_takarazuka', 'hankyu_imazu'] },
 
    // ═══════════════════════════════════════
    // 阪急箕面線
    // ═══════════════════════════════════════
    { keywords: ['箕面', 'みのお'], lines: ['hankyu_minoo'] },
    { keywords: ['桜井', 'さくらい', '牧落', 'まきおち'], lines: ['hankyu_minoo'] },
 
    // ═══════════════════════════════════════
    // 阪神本線
    // ═══════════════════════════════════════
    { keywords: ['野田', 'のだ'], lines: ['hanshin', 'jr_osaka_loop', 'jr_kobe'] },
    { keywords: ['尼崎', 'あまがさき'], lines: ['hanshin', 'jr_kobe', 'hankyu_kobe'] },
    { keywords: ['甲子園', 'こうしえん'], lines: ['hanshin'] },
    { keywords: ['今津', 'いまづ'], lines: ['hanshin', 'hankyu_imazu'] },
    { keywords: ['魚崎', 'うおざき'], lines: ['hanshin'] },
 
    // ═══════════════════════════════════════
    // 阪神なんば線
    // ═══════════════════════════════════════
    { keywords: ['福', 'なんば線'], lines: ['hanshin_namba'] },
 
    // ═══════════════════════════════════════
    // 近鉄奈良線
    // ═══════════════════════════════════════
    { keywords: ['布施', 'ふせ'], lines: ['kintetsu_nara', 'kintetsu_osaka'] },
    { keywords: ['東大阪', '河内永和', 'かわちえいわ'], lines: ['kintetsu_nara'] },
    { keywords: ['八戸ノ里', 'やえのさと'], lines: ['kintetsu_nara'] },
    { keywords: ['若江岩田', 'わかえいわた'], lines: ['kintetsu_nara'] },
    { keywords: ['東花園', 'ひがしはなぞの'], lines: ['kintetsu_nara'] },
    { keywords: ['瓢箪山', 'ひょうたんやま'], lines: ['kintetsu_nara'] },
    { keywords: ['石切', 'いしきり'], lines: ['kintetsu_nara'] },
    { keywords: ['生駒', 'いこま'], lines: ['kintetsu_nara'] },
    { keywords: ['学園前', 'がくえんまえ'], lines: ['kintetsu_nara'] },
    { keywords: ['富雄', 'とみお'], lines: ['kintetsu_nara'] },
    { keywords: ['西大寺', 'さいだいじ', '大和西大寺'], lines: ['kintetsu_nara', 'kintetsu_kyoto'] },
 
    // ═══════════════════════════════════════
    // 近鉄京都線
    // ═══════════════════════════════════════
    { keywords: ['竹田', 'たけだ'], lines: ['kintetsu_kyoto', 'subway_karasuma'] },
    { keywords: ['伏見', 'ふしみ'], lines: ['kintetsu_kyoto', 'jr_nara', 'keihan'] },
    { keywords: ['丹波橋', 'たんばばし'], lines: ['kintetsu_kyoto', 'keihan'] },
    { keywords: ['近鉄丹波橋', 'きんてつたんばばし'], lines: ['kintetsu_kyoto', 'keihan'] },
    { keywords: ['新田辺', 'しんたなべ'], lines: ['kintetsu_kyoto'] },
    { keywords: ['近鉄宮津', '高の原', 'たかのはら'], lines: ['kintetsu_kyoto'] },
 
    // ═══════════════════════════════════════
    // 近鉄大阪線
    // ═══════════════════════════════════════
    { keywords: ['鶴橋', 'つるはし'], lines: ['kintetsu_osaka', 'kintetsu_nara', 'jr_osaka_loop', 'sennichimae'] },
    { keywords: ['大阪上本町', 'うえほんまち', '上本町'], lines: ['kintetsu_osaka', 'kintetsu_minami_osaka'] },
    { keywords: ['桃谷', 'ももだに'], lines: ['kintetsu_osaka'] },
    { keywords: ['長瀬', 'ながせ'], lines: ['kintetsu_osaka'] },
    { keywords: ['八尾', 'やお'], lines: ['kintetsu_osaka'] },
    { keywords: ['大和八木', 'やまとやぎ'], lines: ['kintetsu_osaka', 'kintetsu_kashihara'] },
 
    // ═══════════════════════════════════════
    // 近鉄南大阪線
    // ═══════════════════════════════════════
    { keywords: ['天下茶屋', 'てんがちゃや'], lines: ['kintetsu_minami_osaka', 'sakaisuji', 'nankai'] },
    { keywords: ['河内松原', 'かわちまつばら'], lines: ['kintetsu_minami_osaka'] },
    { keywords: ['藤井寺', 'ふじいでら'], lines: ['kintetsu_minami_osaka'] },
    { keywords: ['古市', 'ふるいち'], lines: ['kintetsu_minami_osaka'] },
 
    // ═══════════════════════════════════════
    // 京阪本線・鴨東線
    // ═══════════════════════════════════════
    { keywords: ['野江', 'のえ'], lines: ['keihan'] },
    { keywords: ['関目', 'せきめ'], lines: ['keihan'] },
    { keywords: ['守口市', 'もりぐちし'], lines: ['keihan', 'tanimachi'] },
    { keywords: ['寝屋川市', 'ねやがわし'], lines: ['keihan'] },
    { keywords: ['香里園', 'こうりえん'], lines: ['keihan'] },
    { keywords: ['枚方市', 'ひらかたし', '枚方', 'ひらかた'], lines: ['keihan'] },
    { keywords: ['樟葉', 'くずは'], lines: ['keihan'] },
    { keywords: ['八幡市', 'やわたし'], lines: ['keihan'] },
    { keywords: ['中書島', 'ちゅうしょじま'], lines: ['keihan'] },
    { keywords: ['丹波橋', 'たんばばし'], lines: ['keihan', 'kintetsu_kyoto'] },
    { keywords: ['伏見桃山', 'ふしみももやま'], lines: ['keihan'] },
    { keywords: ['七条', 'しちじょう'], lines: ['keihan'] },
    { keywords: ['清水五条', 'きよみずごじょう', '五条', 'ごじょう'], lines: ['keihan'] },
    { keywords: ['祇園四条', 'ぎおんしじょう'], lines: ['keihan'] },
    { keywords: ['三条', 'さんじょう'], lines: ['keihan', 'subway_tozai_kyoto'] },
    { keywords: ['神宮丸太町', 'まるたまち'], lines: ['keihan'] },
    { keywords: ['出町柳', 'でまちやなぎ'], lines: ['keihan', 'eizan'] },
 
    // ═══════════════════════════════════════
    // 京阪京津線
    // ═══════════════════════════════════════
    { keywords: ['大谷', 'おおたに'], lines: ['keihan_keishin'] },
    { keywords: ['浜大津', 'はまおおつ', '大津', 'おおつ'], lines: ['keihan_keishin', 'jr_kosei'] },
 
    // ═══════════════════════════════════════
    // 京都市営地下鉄 烏丸線
    // ═══════════════════════════════════════
    { keywords: ['国際会館', 'こくさいかいかん'], lines: ['subway_karasuma'] },
    { keywords: ['北山', 'きたやま'], lines: ['subway_karasuma'] },
    { keywords: ['北大路', 'きたおおじ'], lines: ['subway_karasuma'] },
    { keywords: ['鞍馬口', 'くらまぐち'], lines: ['subway_karasuma'] },
    { keywords: ['今出川', 'いまでがわ'], lines: ['subway_karasuma'] },
    { keywords: ['丸太町', 'まるたまち'], lines: ['subway_karasuma'] },
    { keywords: ['烏丸御池', 'からすまおいけ'], lines: ['subway_karasuma', 'subway_tozai_kyoto'] },
    { keywords: ['五条', 'ごじょう'], lines: ['subway_karasuma'] },
    { keywords: ['京都駅', 'きょうと駅', '京都'], lines: ['jr_kyoto', 'kintetsu_kyoto', 'jr_nara', 'subway_karasuma'] },
    { keywords: ['九条', 'くじょう'], lines: ['subway_karasuma'] },
    { keywords: ['くいな橋', 'くいなばし'], lines: ['subway_karasuma'] },
    { keywords: ['竹田', 'たけだ'], lines: ['subway_karasuma', 'kintetsu_kyoto'] },
 
    // ═══════════════════════════════════════
    // 京都市営地下鉄 東西線
    // ═══════════════════════════════════════
    { keywords: ['太秦天神川', 'うずまさてんじんがわ'], lines: ['subway_tozai_kyoto', 'randen'] },
    { keywords: ['西大路御池', 'にしおおじおいけ'], lines: ['subway_tozai_kyoto'] },
    { keywords: ['二条城前', 'にじょうじょうまえ'], lines: ['subway_tozai_kyoto'] },
    { keywords: ['二条', 'にじょう'], lines: ['subway_tozai_kyoto', 'jr_sagano'] },
    { keywords: ['烏丸御池', 'からすまおいけ'], lines: ['subway_tozai_kyoto', 'subway_karasuma'] },
    { keywords: ['東山', 'ひがしやま'], lines: ['subway_tozai_kyoto'] },
    { keywords: ['蹴上', 'けあげ'], lines: ['subway_tozai_kyoto'] },
    { keywords: ['御陵', 'みささぎ'], lines: ['subway_tozai_kyoto', 'keihan_keishin'] },
    { keywords: ['山科', 'やましな'], lines: ['jr_kyoto', 'keihan', 'subway_tozai_kyoto'] },
    { keywords: ['椥辻', 'なぎつじ'], lines: ['subway_tozai_kyoto'] },
    { keywords: ['六地蔵', 'ろくじぞう'], lines: ['subway_tozai_kyoto', 'jr_nara', 'keihan'] },
 
    // ═══════════════════════════════════════
    // 嵐電(京福電鉄)
    // ═══════════════════════════════════════
    { keywords: ['帷子ノ辻', 'かたびらのつじ'], lines: ['randen'] },
    { keywords: ['嵐山', 'あらしやま'], lines: ['randen', 'hankyu_kyoto_arashiyama'] },
    { keywords: ['北野白梅町', 'きたのはくばいちょう'], lines: ['randen'] },
 
    // ═══════════════════════════════════════
    // 叡山電鉄
    // ═══════════════════════════════════════
    { keywords: ['修学院', 'しゅうがくいん'], lines: ['eizan'] },
    { keywords: ['一乗寺', 'いちじょうじ'], lines: ['eizan'] },
    { keywords: ['市原', 'いちはら'], lines: ['eizan'] },
    { keywords: ['鞍馬', 'くらま'], lines: ['eizan'] },
 
    // ═══════════════════════════════════════
    // 神戸市営地下鉄 西神・山手線
    // ═══════════════════════════════════════
    { keywords: ['新長田', 'しんながた'], lines: ['subway_kobe', 'jr_kobe_west'] },
    { keywords: ['長田', 'ながた', '神戸'], lines: ['subway_kobe'] },
    { keywords: ['大倉山', 'おおくらやま'], lines: ['subway_kobe'] },
    { keywords: ['県庁前', 'けんちょうまえ'], lines: ['subway_kobe'] },
    { keywords: ['新神戸', 'しんこうべ'], lines: ['subway_kobe', 'jr_shinkansen'] },
    { keywords: ['谷上', 'たにがみ'], lines: ['subway_kobe', 'kobe_dentetsu'] },
    { keywords: ['名谷', 'みょうだに'], lines: ['subway_kobe'] },
    { keywords: ['学園都市', 'がくえんとし'], lines: ['subway_kobe'] },
    { keywords: ['西神中央', 'せいしんちゅうおう'], lines: ['subway_kobe'] },
 
    // ═══════════════════════════════════════
    // 南海本線
    // ═══════════════════════════════════════
    { keywords: ['新今宮', 'しんいまみや'], lines: ['nankai', 'midosuji', 'sakaisuji', 'jr_osaka_loop', 'jr_kansai'] },
    { keywords: ['堺', 'さかい'], lines: ['nankai', 'jr_kansai'] },
    { keywords: ['岸和田', 'きしわだ'], lines: ['nankai'] },
 
    // ═══════════════════════════════════════
    // その他主要エリア(複数路線併記・代表名)
    // ═══════════════════════════════════════
    { keywords: ['豊中', 'とよなか', '曽根', 'そね'], lines: ['hankyu_takarazuka', 'midosuji'] },
    { keywords: ['枚方', 'ひらかた'], lines: ['keihan'] },
    { keywords: ['東大阪', '布施', 'ふせ'], lines: ['kintetsu_nara', 'kintetsu_osaka'] },
    { keywords: ['桃山', 'ももやま', '伏見', 'ふしみ'], lines: ['kintetsu_kyoto', 'jr_nara', 'keihan'] },
    { keywords: ['北堀江', '西長堀', 'にしながほり'], lines: ['subway_nagahori', 'midosuji'] },
  ];
 
  /**
   * ユーザー入力(駅名)から該当する路線IDの配列を返す
   * 部分一致・複数駅指定に対応（カンマ・スペース・読点区切り）
   * @param {string} input
   * @returns {string[]} 重複なしの路線IDリスト（直結路線 + 1回乗換で繋がる主要路線）
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
 
    // 1回の乗換で接続する主要路線も「アクセス可能」に含める
    // 例: 箕面線(箕面駅)→ 石橋阪大前で宝塚線に接続 → 梅田・大阪方面へ実質アクセス可
    Object.keys(matchedLines).forEach(function (line) {
      var connections = LINE_CONNECTIONS[line];
      if (connections) {
        connections.forEach(function (connectedLine) {
          matchedLines[connectedLine] = true;
        });
      }
    });
 
    return Object.keys(matchedLines);
  }
 
  return {
    STATIONS: STATIONS,
    LINE_CONNECTIONS: LINE_CONNECTIONS,
    detectLines: detectLines,
  };
})();
