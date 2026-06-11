/**
 * lib/areaData.js
 *
 * Next.js移行時: lib/areaData.ts として使用
 * 型定義例:
 *   type ScoreKey = 'cheap'|'access'|'safe'|'stylish'|'convenient'|'nature'|'young'|'new'
 *   type Area = { id:string; name:string; city:string; tags:string[]; desc:string; score:Record<ScoreKey,number>; excludeIfBudgetBelow:string|null }
 */

var AreaData = (function () {

  /** @type {Area[]} */
  var AREAS = [
    {
      id: 'tennoji',
      name: '天王寺・阿倍野',
      city: '大阪市天王寺区',
      tags: ['ターミナル駅直結', '買い物便利', 'ハルカス近く'],
      desc: '御堂筋線・谷町線・近鉄が集まる南大阪の玄関口。あべのハルカスを擁する百貨店・スーパーが揃い、梅田・難波・奈良方面へスムーズにアクセスできます。',
      score: { cheap: 2, access: 5, safe: 4, stylish: 3, convenient: 5, nature: 2, young: 3, new: 3 },
      excludeIfBudgetBelow: null,
    },
    {
      id: 'esaka',
      name: '江坂・吹田',
      city: '吹田市',
      tags: ['御堂筋線沿い', '大阪大学近く', '閑静な住宅街'],
      desc: '御堂筋線で梅田まで約15分。北大阪の落ち着いた住宅地で、大学生・若手社会人に根強い人気。スーパーも複数あり生活環境が整っています。',
      score: { cheap: 3, access: 4, safe: 5, stylish: 3, convenient: 4, nature: 3, young: 4, new: 3 },
      excludeIfBudgetBelow: null,
    },
    {
      id: 'horie',
      name: '北堀江・西長堀',
      city: '大阪市西区',
      tags: ['おしゃれ', 'カフェ・雑貨充実', '心斎橋すぐ'],
      desc: '心斎橋から徒歩圏内の洗練されたエリア。個性的なカフェや雑貨店が軒を連ね、長堀鶴見緑地線の利便性と都会的な雰囲気を両立しています。',
      score: { cheap: 1, access: 4, safe: 3, stylish: 5, convenient: 4, nature: 2, young: 5, new: 4 },
      excludeIfBudgetBelow: '5万円',
    },
    {
      id: 'saiin',
      name: '西院・四条大宮',
      city: '京都市右京区',
      tags: ['阪急・嵐電', '学生街', '家賃リーズナブル'],
      desc: '阪急京都線・嵐電が通り、京都中心部へすぐ。学生が多く活気ある街並みで、家賃相場が比較的低め。京都で暮らしたい方の定番エリアです。',
      score: { cheap: 4, access: 4, safe: 4, stylish: 4, convenient: 4, nature: 2, young: 5, new: 3 },
      excludeIfBudgetBelow: null,
    },
    {
      id: 'fushimi',
      name: '伏見・桃山',
      city: '京都市伏見区',
      tags: ['近鉄・JR・京阪沿い', '下町情緒', '大阪通勤可'],
      desc: '3路線が通り大阪方面にも通いやすい京都南部のエリア。伏見稲荷や酒蔵が点在し、下町の温かみある暮らしが楽しめます。家賃も市内比較で安め。',
      score: { cheap: 4, access: 3, safe: 4, stylish: 3, convenient: 3, nature: 4, young: 3, new: 3 },
      excludeIfBudgetBelow: null,
    },
    {
      id: 'sannomiya',
      name: '三宮・元町',
      city: '神戸市中央区',
      tags: ['JR・阪急・阪神', 'ハーバー近く', '国際的な雰囲気'],
      desc: '神戸の中心地で4路線が集結。ハーバーランドや北野異人館など観光スポットも身近で、おしゃれで国際的な雰囲気が魅力のエリアです。',
      score: { cheap: 2, access: 5, safe: 4, stylish: 5, convenient: 5, nature: 3, young: 4, new: 4 },
      excludeIfBudgetBelow: '6万円',
    },
    {
      id: 'nishinomiya',
      name: '西宮・甲子園',
      city: '西宮市',
      tags: ['阪神・阪急沿い', '閑静な住宅街', '自然豊か'],
      desc: '阪神・阪急2路線で大阪・神戸どちらにもアクセス良好。閑静な住宅地として人気が高く、自然も豊か。治安の良さと住みやすさが光るエリアです。',
      score: { cheap: 3, access: 4, safe: 5, stylish: 3, convenient: 4, nature: 4, young: 2, new: 3 },
      excludeIfBudgetBelow: null,
    },
    {
      id: 'nagai',
      name: '長居・我孫子',
      city: '大阪市住吉区',
      tags: ['御堂筋線沿い', '長居公園近く', 'コスパ◎'],
      desc: '御堂筋線で天王寺・梅田へ通いやすく、長居公園がある緑豊かなエリア。家賃相場が低く、コスパを重視する方に人気のエリアです。',
      score: { cheap: 5, access: 4, safe: 4, stylish: 2, convenient: 4, nature: 4, young: 3, new: 2 },
      excludeIfBudgetBelow: null,
    },
    {
      id: 'ibaraki',
      name: '茨木・摂津',
      city: '茨木市',
      tags: ['JR・阪急の2路線', '大阪大学近く', '住宅街'],
      desc: 'JR・阪急の2路線が通り、大阪・京都双方へのアクセスが良好。大阪大学の学生も多く、ほどよく若者が集まる住みやすいエリアです。',
      score: { cheap: 4, access: 4, safe: 4, stylish: 2, convenient: 3, nature: 3, young: 4, new: 3 },
      excludeIfBudgetBelow: null,
    },
    {
      id: 'nara',
      name: '奈良・学研都市',
      city: '奈良市・精華町',
      tags: ['近鉄沿い', '自然豊か', '家賃かなり安い'],
      desc: '近鉄で京都・大阪方面へアクセス可能。豊かな自然と非常に安い家賃が魅力で、通勤時間をある程度許容できる方には理想的な選択肢です。',
      score: { cheap: 5, access: 3, safe: 5, stylish: 2, convenient: 3, nature: 5, young: 2, new: 3 },
      excludeIfBudgetBelow: null,
    },
  ];

  return { AREAS: AREAS };
})();
