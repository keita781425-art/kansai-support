
/**
 * lib/formConfig.js
 *
 * Next.js移行時: lib/formConfig.ts として使用
 * フォームの全フィールド定義を一元管理します。
 * フィールド追加・削除・選択肢変更はここだけ編集すればOKです。
 */
 
var FormConfig = (function () {
 
  /** Step 1: 基本情報フィールド */
  var STEP1_FIELDS = [
    {
      id: 'name',
      label: 'お名前',
      type: 'text',
      required: true,
      placeholder: '例：山田 太郎',
      autocomplete: 'name',
      errorMessage: 'お名前を入力してください',
    },
    {
      id: 'phone',
      label: '電話番号',
      type: 'tel',
      required: true,
      placeholder: '例：090-1234-5678',
      autocomplete: 'tel',
      errorMessage: '電話番号を入力してください',
    },
    {
      id: 'lineName',
      label: 'LINE表示名',
      type: 'text',
      required: false,
      placeholder: '例：たろう',
      autocomplete: 'off',
    },
    {
      id: 'workplace',
      label: '勤務地・通学先の最寄り駅',
      type: 'text',
      required: true,
      placeholder: '例：梅田駅、京都駅、三宮駅 など',
      autocomplete: 'off',
      errorMessage: '勤務地・通学先の最寄り駅を入力してください',
    },
  ];
 
  /** Step 2: 希望条件セレクト */
  var STEP2_SELECTS = [
    {
      id: 'moveIn',
      label: '入居希望時期',
      required: true,
      errorMessage: '入居希望時期を選択してください',
      options: [
        { value: '1ヶ月以内',   label: '1ヶ月以内' },
        { value: '2〜3ヶ月以内', label: '2〜3ヶ月以内' },
        { value: '半年以内',    label: '半年以内' },
        { value: '半年以上先',  label: '半年以上先' },
        { value: '未定',        label: 'まだ決まっていない' },
      ],
    },
    {
      id: 'budget',
      label: '月々の家賃予算',
      required: true,
      errorMessage: '家賃予算を選択してください',
      options: [
        { value: '〜4万円',  label: '〜4万円' },
        { value: '4〜5万円', label: '4〜5万円' },
        { value: '5〜6万円', label: '5〜6万円' },
        { value: '6〜7万円', label: '6〜7万円' },
        { value: '7〜9万円', label: '7〜9万円' },
        { value: '9万円以上', label: '9万円以上' },
      ],
    },
    {
      id: 'commute',
      label: '希望通勤時間',
      required: true,
      errorMessage: '通勤時間を選択してください',
      options: [
        { value: '〜15分',    label: '〜15分（徒歩・自転車圏内）' },
        { value: '〜30分',    label: '〜30分' },
        { value: '〜45分',    label: '〜45分' },
        { value: '〜1時間',   label: '〜1時間' },
        { value: '1時間以上可', label: '1時間以上でも可' },
      ],
    },
  ];
 
  /** Step 2: 重視条件チェックボックス */
  var CONDITION_OPTIONS = [
    { value: '家賃の安さ',         label: '家賃の安さ',       scoreKey: 'cheap' },
    { value: '駅近',               label: '駅近・交通アクセス', scoreKey: 'access' },
    { value: '治安の良さ',         label: '治安・安全性',      scoreKey: 'safe' },
    { value: 'おしゃれな街並み',   label: 'おしゃれな雰囲気',  scoreKey: 'stylish' },
    { value: 'スーパー・コンビニ近く', label: '生活利便性',    scoreKey: 'convenient' },
    { value: '自然・公園近く',     label: '自然・落ち着いた環境', scoreKey: 'nature' },
    { value: '学生・若者が多い',   label: '学生・若者が多い',  scoreKey: 'young' },
    { value: '築浅・新築',         label: '築浅・きれいな部屋', scoreKey: 'new' },
  ];
 
  return {
    STEP1_FIELDS: STEP1_FIELDS,
    STEP2_SELECTS: STEP2_SELECTS,
    CONDITION_OPTIONS: CONDITION_OPTIONS,
  };
})();
