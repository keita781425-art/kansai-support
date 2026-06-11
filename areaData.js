/**
 * lib/areaData.js
 *
 * Next.js移行時: lib/areaData.ts として使用
 * 型定義例:
 *   type ScoreKey = 'cheap'|'access'|'safe'|'stylish'|'convenient'|'nature'|'young'|'new'
 *   type LineId = 'midosuji'|'hankyu_kobe'|'hankyu_kyoto'|'hanshin'|'jr_kobe'|'jr_kyoto'|
 *                  'jr_osaka_loop'|'kintetsu_nara'|'kintetsu_kyoto'|'tanimachi'|'keihan'|
 *                  'jr_naniwasuji'|'jr_nara'|'jr_kansai'|'subway_karasuma'|'subway_kobe'|
 *                  'subway_nagahori'|'randen'|'nankai'|'subway_midosuji_kita'|'jr_takatsuki'|
 *                  'eizan'
 *   type Area = {
 *     id:string; name:string; city:string; tags:string[]; desc:string;
 *     score:Record<ScoreKey,number>; excludeIfBudgetBelow:string|null;
 *     lines: LineId[]   // このエリアからアクセスできる路線
 *   }
 *
 * 全20エリア構成:
 *   大阪: 天王寺・阿倍野/江坂・吹田/北堀江・西長堀/長居・我孫子/福島・野田/
 *         新大阪・東三国/茨木・摂津/高槻/千里中央/豊中・曽根
 *   京都: 西院・四条大宮/伏見・桃山/桂・洛西口/出町柳/山科
 *   兵庫: 三宮・元町/西宮・甲子園/尼崎/岡本・摂津本山
 *   奈良: 生駒
 */
 
var AreaData = (function () {
 
  /** @type {Area[]} */
  var AREAS = [
    // ───────── 大阪 ─────────
    {
      id: 'tennoji',
      name: '天王寺・阿倍野',
      city: '大阪市天王寺区',
      tags: ['ターミナル駅直結', '買い物便利', 'ハルカス近く'],
      desc: '御堂筋線・谷町線・近鉄が集まる南大阪の玄関口。あべのハルカスを擁する百貨店・スーパーが揃い、梅田・難波・奈良方面へスムーズにアクセスできます。',
      score: { cheap: 2, access: 5, safe: 4, stylish: 3, convenient: 5, nature: 2, young: 3, new: 3 },
      excludeIfBudgetBelow: null,
      lines: ['midosuji', 'tanimachi', 'jr_osaka_loop', 'jr_kansai', 'kintetsu_nara'],
    },
    {
      id: 'esaka',
      name: '江坂・吹田',
      city: '吹田市',
      tags: ['御堂筋線沿い', '社会人定番', '閑静な住宅街'],
      desc: '御堂筋線で梅田まで約15分。北大阪の落ち着いた住宅地で、若手社会人に根強い人気の通勤定番エリア。スーパーも複数あり生活環境が整っています。',
      score: { cheap: 3, access: 5, safe: 5, stylish: 3, convenient: 4, nature: 3, young: 4, new: 3 },
      excludeIfBudgetBelow: null,
      lines: ['midosuji', 'jr_kyoto'],
    },
    {
      id: 'horie',
      name: '北堀江・西長堀',
      city: '大阪市西区',
      tags: ['おしゃれ', 'カフェ・雑貨充実', '心斎橋すぐ'],
      desc: '心斎橋から徒歩圏内の洗練されたエリア。個性的なカフェや雑貨店が軒を連ね、長堀鶴見緑地線の利便性と都会的な雰囲気を両立しています。',
      score: { cheap: 1, access: 4, safe: 3, stylish: 5, convenient: 4, nature: 2, young: 5, new: 4 },
      excludeIfBudgetBelow: '5万円',
      lines: ['subway_nagahori', 'midosuji'],
    },
    {
      id: 'nagai',
      name: '長居・我孫子',
      city: '大阪市住吉区',
      tags: ['御堂筋線沿い', '長居公園近く', 'コスパ◎'],
      desc: '御堂筋線で天王寺・梅田へ通いやすく、長居公園がある緑豊かなエリア。家賃相場が低く、コスパを重視する方に人気のエリアです。',
      score: { cheap: 5, access: 4, safe: 4, stylish: 2, convenient: 4, nature: 4, young: 3, new: 2 },
      excludeIfBudgetBelow: null,
      lines: ['midosuji'],
    },
    {
      id: 'fukushima',
      name: '福島・野田',
      city: '大阪市福島区',
      tags: ['梅田徒歩圏', '人気急上昇', 'グルメ充実'],
      desc: '梅田まで徒歩圏内・電車で1駅という好立地ながら、落ち着いた雰囲気を持つ注目エリア。おしゃれな飲食店が増えており、若い世代からの人気が急上昇中です。',
      score: { cheap: 2, access: 5, safe: 4, stylish: 4, convenient: 5, nature: 2, young: 4, new: 4 },
      excludeIfBudgetBelow: '5万円',
      lines: ['jr_osaka_loop', 'jr_kobe', 'hanshin'],
    },
    {
      id: 'shin_osaka',
      name: '新大阪・東三国',
      city: '大阪市淀川区',
      tags: ['通勤最強', '家賃安め', '新幹線アクセス◎'],
      desc: '新大阪駅周辺は新幹線・在来線・地下鉄が集結する交通の要所。1駅隣の東三国まで来ると家賃が下がり、通勤の利便性とコストのバランスが良いエリアです。',
      score: { cheap: 4, access: 5, safe: 4, stylish: 2, convenient: 4, nature: 2, young: 3, new: 3 },
      excludeIfBudgetBelow: null,
      lines: ['midosuji', 'jr_kyoto', 'jr_kobe'],
    },
    {
      id: 'ibaraki',
      name: '茨木・摂津',
      city: '茨木市',
      tags: ['JR・阪急の2路線', '大阪大学近く', '住宅街'],
      desc: 'JR・阪急の2路線が通り、大阪・京都双方へのアクセスが良好。大阪大学の学生も多く、ほどよく若者が集まる住みやすいエリアです。',
      score: { cheap: 4, access: 4, safe: 4, stylish: 2, convenient: 3, nature: 3, young: 4, new: 3 },
      excludeIfBudgetBelow: null,
      lines: ['jr_kyoto', 'hankyu_kyoto'],
    },
    {
      id: 'takatsuki',
      name: '高槻',
      city: '高槻市',
      tags: ['大阪・京都の中間', '自然豊か', '商業施設充実'],
      desc: '大阪と京都のちょうど中間に位置し、どちらの方面にも通いやすい立地。駅前に商業施設が充実しつつ、少し離れると緑豊かな環境が広がります。',
      score: { cheap: 4, access: 4, safe: 4, stylish: 2, convenient: 4, nature: 4, young: 3, new: 3 },
      excludeIfBudgetBelow: null,
      lines: ['jr_kyoto', 'jr_takatsuki', 'hankyu_kyoto'],
    },
    {
      id: 'senrichuo',
      name: '千里中央',
      city: '豊中市',
      tags: ['治安◎', '住環境◎', 'ニュータウン'],
      desc: '計画的に整備されたニュータウンで、緑が多く治安・住環境ともに高評価。商業施設も駅直結で揃っており、落ち着いて暮らしたい方に最適です。',
      score: { cheap: 2, access: 4, safe: 5, stylish: 3, convenient: 4, nature: 5, young: 2, new: 3 },
      excludeIfBudgetBelow: '5万円',
      lines: ['midosuji'],
    },
    {
      id: 'toyonaka_sone',
      name: '豊中・曽根',
      city: '豊中市',
      tags: ['落ち着いた住宅街', '阪急沿線', 'ファミリー人気'],
      desc: '阪急宝塚線沿いの閑静な住宅街。大阪梅田まで電車で20分前後とアクセスも良く、落ち着いた環境でゆったり暮らしたい方に向いています。',
      score: { cheap: 3, access: 4, safe: 5, stylish: 3, convenient: 3, nature: 4, young: 2, new: 3 },
      excludeIfBudgetBelow: null,
      lines: ['hankyu_takarazuka', 'midosuji'],
    },
 
    // ───────── 京都 ─────────
    {
      id: 'saiin',
      name: '西院・四条大宮',
      city: '京都市右京区',
      tags: ['阪急・嵐電', '学生街', '家賃リーズナブル'],
      desc: '阪急京都線・嵐電が通り、京都中心部へすぐ。学生が多く活気ある街並みで、家賃相場が比較的低め。京都で暮らしたい方の定番エリアです。',
      score: { cheap: 4, access: 4, safe: 4, stylish: 4, convenient: 4, nature: 2, young: 5, new: 3 },
      excludeIfBudgetBelow: null,
      lines: ['hankyu_kyoto', 'randen', 'subway_karasuma'],
    },
    {
      id: 'fushimi',
      name: '伏見・桃山',
      city: '京都市伏見区',
      tags: ['近鉄・JR・京阪沿い', '下町情緒', '大阪通勤可'],
      desc: '3路線が通り大阪方面にも通いやすい京都南部のエリア。伏見稲荷や酒蔵が点在し、下町の温かみある暮らしが楽しめます。家賃も市内比較で安め。',
      score: { cheap: 5, access: 3, safe: 4, stylish: 3, convenient: 3, nature: 4, young: 3, new: 3 },
      excludeIfBudgetBelow: null,
      lines: ['kintetsu_kyoto', 'jr_nara', 'keihan'],
    },
    {
      id: 'katsura',
      name: '桂・洛西口',
      city: '京都市西京区',
      tags: ['新築多い', '阪急沿線', 'ベッドタウン'],
      desc: '阪急京都線沿いで、近年マンションや新築アパートの開発が進むエリア。京都駅・四条河原町方面への乗り換え拠点でもあり、きれいな部屋に住みたい方におすすめです。',
      score: { cheap: 3, access: 4, safe: 4, stylish: 3, convenient: 3, nature: 3, young: 3, new: 5 },
      excludeIfBudgetBelow: null,
      lines: ['hankyu_kyoto'],
    },
    {
      id: 'demachiyanagi',
      name: '出町柳',
      city: '京都市左京区',
      tags: ['京大周辺', '学生街', 'カフェ・本屋多い'],
      desc: '京都大学・同志社大学に近く、昔ながらの学生街の雰囲気が残るエリア。個性的なカフェや書店が多く、鴨川のほとりでのんびり過ごせる環境も魅力です。',
      score: { cheap: 3, access: 3, safe: 4, stylish: 3, convenient: 3, nature: 4, young: 5, new: 2 },
      excludeIfBudgetBelow: null,
      lines: ['keihan', 'eizan'],
    },
    {
      id: 'yamashina',
      name: '山科',
      city: '京都市山科区',
      tags: ['京都中心部より安い', 'JR・地下鉄', '大津方面も便利'],
      desc: 'JR・京阪・地下鉄東西線が通り、京都中心部や大津方面へのアクセスが良好。山に囲まれた落ち着いた環境ながら、家賃は京都市中心部より抑えめです。',
      score: { cheap: 4, access: 3, safe: 4, stylish: 2, convenient: 3, nature: 4, young: 2, new: 3 },
      excludeIfBudgetBelow: null,
      lines: ['jr_kyoto', 'keihan', 'subway_karasuma'],
    },
 
    // ───────── 兵庫 ─────────
    {
      id: 'sannomiya',
      name: '三宮・元町',
      city: '神戸市中央区',
      tags: ['神戸中心地', 'JR・阪急・阪神', '国際的な雰囲気'],
      desc: '神戸の中心地で4路線が集結。ハーバーランドや北野異人館など観光スポットも身近で、おしゃれで国際的な雰囲気が魅力のエリアです。',
      score: { cheap: 2, access: 5, safe: 4, stylish: 5, convenient: 5, nature: 3, young: 4, new: 4 },
      excludeIfBudgetBelow: '6万円',
      lines: ['jr_kobe', 'hankyu_kobe', 'hanshin', 'subway_kobe'],
    },
    {
      id: 'nishinomiya',
      name: '西宮・甲子園',
      city: '西宮市',
      tags: ['治安◎', '阪神・阪急沿い', '自然豊か'],
      desc: '阪神・阪急2路線で大阪・神戸どちらにもアクセス良好。閑静な住宅地として人気が高く、治安・住環境ともに評判の良いエリアです。',
      score: { cheap: 3, access: 4, safe: 5, stylish: 3, convenient: 4, nature: 4, young: 2, new: 3 },
      excludeIfBudgetBelow: null,
      lines: ['hankyu_kobe', 'hanshin', 'jr_kobe'],
    },
    {
      id: 'amagasaki',
      name: '尼崎',
      city: '尼崎市',
      tags: ['大阪通勤最強クラス', '家賃安め', 'JR・阪神・阪急'],
      desc: '大阪駅・梅田まで10分圏内という抜群のアクセスながら、兵庫県のため家賃は大阪市内より割安。コストを抑えつつ大阪で働きたい方に人気です。',
      score: { cheap: 5, access: 5, safe: 3, stylish: 2, convenient: 4, nature: 2, young: 3, new: 3 },
      excludeIfBudgetBelow: null,
      lines: ['jr_kobe', 'hanshin', 'hankyu_kobe'],
    },
    {
      id: 'okamoto',
      name: '岡本・摂津本山',
      city: '神戸市東灘区',
      tags: ['おしゃれ', '学生人気', '坂の街・緑豊か'],
      desc: '甲南大学が近く学生にも人気の、おしゃれなカフェ・雑貨店が並ぶエリア。山と海に挟まれた立地で、緑豊かな環境と洗練された雰囲気を両立しています。',
      score: { cheap: 2, access: 4, safe: 4, stylish: 5, convenient: 3, nature: 4, young: 4, new: 3 },
      excludeIfBudgetBelow: '5万円',
      lines: ['jr_kobe', 'hankyu_kobe'],
    },
 
    // ───────── 奈良 ─────────
    {
      id: 'ikoma',
      name: '生駒',
      city: '生駒市',
      tags: ['大阪通勤◎', '家賃安い', '自然豊か'],
      desc: '近鉄奈良線で大阪難波まで約20分とアクセス良好でありながら、奈良県のため家賃は控えめ。山に囲まれた自然豊かな環境で、治安の良さにも定評があります。',
      score: { cheap: 5, access: 4, safe: 5, stylish: 2, convenient: 3, nature: 5, young: 2, new: 3 },
      excludeIfBudgetBelow: null,
      lines: ['kintetsu_nara'],
    },
  ];
 
  return { AREAS: AREAS };
})();
