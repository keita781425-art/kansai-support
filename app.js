/**
 * pages/app.js  (エントリーポイント)
 *
 * Next.js移行時:
 *   - このファイルのstateはReact useReducerに置き換え
 *   - navigateTo() は router.push() / URL-based routing に置き換え
 *   - init() はapp/layout.tsxのuseEffectに移動
 *
 * 現在の責務:
 *   1. アプリ全体のstate管理 (currentStep, formData, errors, results)
 *   2. ページ遷移制御 (navigateTo)
 *   3. フォーム送信フロー (handleSubmitStep1, handleSubmitStep2)
 *   4. 各コンポーネントへのデータ注入 (renderCurrentPage)
 */
 
var App = (function () {
 
  // ━━ Config ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ▼▼▼ LINE公式アカウントの友達追加URLをここに設定してください ▼▼▼
  var LINE_CTA_URL = 'https://lin.ee/WXRhuH1';
 
  // ━━ State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Next.js移行時: useReducer({ currentStep, formData, errors, results, loading })
  var state = {
    currentStep: 1,
    formData: {},
    errors: {},
    results: [],
    startedAt: Date.now(), // スパム対策：入力開始時刻
  };
 
  // ━━ DOM refs ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  var $header, $hero, $main;
 
  // ━━ Init ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ━━ 流入元（どこから来たか）━━━━━━━━━━━━━━
  // 例：?ref=friend（知人紹介）、?utm_source=instagram（SNS別リンク）
  // サイト内でFAQ等を行き来しても消えないよう、同じタブの間は sessionStorage に保持する
  var SOURCE_LABELS = { friend: '知人紹介', instagram: 'Instagram', threads: 'Threads', tiktok: 'TikTok', line: 'LINE' };
  function detectSource() {
    var saved = '';
    try { saved = sessionStorage.getItem('ks_source') || ''; } catch (e) {}
    var params = new URLSearchParams(window.location.search);
    var raw = (params.get('ref') || params.get('utm_source') || '').toLowerCase().slice(0, 40);
    var source = raw ? (SOURCE_LABELS[raw] || raw) : '';
    if (!source && !saved && document.referrer) {
      try {
        var host = new URL(document.referrer).hostname;
        if (host && host.indexOf('kansai-shinseikatu.com') < 0) source = host;
      } catch (e) {}
    }
    source = source || saved || '直接';
    try { sessionStorage.setItem('ks_source', source); } catch (e) {}
    return source;
  }

  // 紛らわしい文字（0/o、1/l/i）を除いた英数字でコードを作る
  function randomCode(len) {
    var chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    var out = '';
    var buf = new Uint32Array(len);
    try { window.crypto.getRandomValues(buf); } catch (e) { for (var j = 0; j < len; j++) buf[j] = Math.floor(Math.random() * 4294967296); }
    for (var i = 0; i < len; i++) out += chars.charAt(buf[i] % chars.length);
    return out;
  }

  // ━━ 効果測定（GA4）━━━━━━━━━━━━━━━━━━━━━━
  // どこまで進んだかだけを送る。名前・電話番号などの入力内容は送らない
  function track(eventName, params) {
    try {
      if (typeof window.gtag === 'function') window.gtag('event', eventName, params || {});
    } catch (e) {}
  }

  function init() {
    state.formData.source = detectSource();
    $header = document.getElementById('app-header');
    $hero   = document.getElementById('app-hero');
    $main   = document.getElementById('app-main');
 
    Components.renderHeader($header);
    renderCurrentPage();
 
    // トースト通知の初期化
    var toastEl = document.createElement('div');
    toastEl.id = 'toast';
    toastEl.className = 'toast';
    document.body.appendChild(toastEl);
  }
 
  // ━━ Router ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  function navigateTo(step) {
    state.currentStep = step;
    state.errors = {};
    window.scrollTo({ top: 0, behavior: 'smooth' });
    renderCurrentPage();
  }
 
  // ━━ Render ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  function renderCurrentPage() {
    Components.renderHero($hero, { currentStep: state.currentStep });
 
    if (state.currentStep === 1) {
      Components.renderStep1Form($main, {
        fields: FormConfig.STEP1_FIELDS,
        errors: state.errors,
      });
      bindStep1Events();
 
    } else if (state.currentStep === 2) {
      Components.renderStep2Form($main, {
        selects: FormConfig.STEP2_SELECTS,
        conditionOptions: FormConfig.CONDITION_OPTIONS,
        errors: state.errors,
      });
      bindStep2Events();
      // 前のステップで入力した値を復元
      restoreStep2Values();
 
    } else if (state.currentStep === 3) {
      Components.renderResultPage($main, {
        workplace: state.formData.workplace,
        stations: [state.formData.station1, state.formData.station2].filter(Boolean).join('・'),
        budget: state.formData.budget,
        commute: state.formData.commute,
        results: state.results,
        lineCTAUrl: LINE_CTA_URL,
        code: state.sid ? state.sid.toUpperCase() : '',
      });
    }
  }
 
  // ━━ Event binding ━━━━━━━━━━━━━━━━━━━━━━━
  function bindStep1Events() {
    document.getElementById('btn-to-step2').addEventListener('click', handleSubmitStep1);
    // 最初の入力で「診断を始めた」を1回だけ記録
    $main.addEventListener('input', function () {
      if (state.trackedStart) return;
      state.trackedStart = true;
      track('diagnosis_start', { source: state.formData.source });
    }, { once: true });
  }
 
  function bindStep2Events() {
    document.getElementById('btn-submit').addEventListener('click', handleSubmitStep2);
    document.getElementById('btn-to-step1').addEventListener('click', function () {
      collectStep2Values(); // 戻る前に値を保存
      navigateTo(1);
    });
  }
 
  // ━━ Step1: バリデーション & 遷移 ━━━━━━━━━
  function handleSubmitStep1() {
    var values = collectStep1Values();
    var result = Validate.validateFields(values, FormConfig.STEP1_FIELDS);
 
    if (!result.valid) {
      state.errors = result.errors;
      renderCurrentPage();
      return;
    }
 
    Object.assign(state.formData, values);
    var hp = document.getElementById('hp_website');
    state.formData._hp = hp ? hp.value : '';
    track('diagnosis_step1_done', { source: state.formData.source });
    navigateTo(2);
  }
 
  function collectStep1Values() {
    var values = {};
    FormConfig.STEP1_FIELDS.forEach(function (f) {
      var el = document.getElementById(f.id);
      values[f.id] = el ? el.value.trim() : '';
    });
    return values;
  }
 
  // ━━ Step2: バリデーション & 診断 ━━━━━━━━━
  function handleSubmitStep2() {
    collectStep2Values();
    var selectValues = {};
    FormConfig.STEP2_SELECTS.forEach(function (s) {
      selectValues[s.id] = state.formData[s.id] || '';
    });
    var result = Validate.validateFields(selectValues, FormConfig.STEP2_SELECTS);

    if (!result.valid) {
      state.errors = result.errors;
      renderCurrentPage();
      return;
    }
 
    // ローディング表示
    state.currentStep = 3;
    Components.renderHero($hero, { currentStep: 3 });
    Components.renderLoadingScreen($main);
    window.scrollTo({ top: 0, behavior: 'smooth' });
 
    // 診断実行（非同期に見せる）
    setTimeout(function () {
      // 路線の判定は最寄り駅①②（＋勤務地の文字）から行う
      var diagValues = Object.assign({}, state.formData, {
        workplace: [state.formData.station1, state.formData.station2, state.formData.workplace].filter(Boolean).join(' '),
      });
      state.results = DiagnoseLogic.diagnose(
        diagValues,
        AreaData.AREAS,
        FormConfig.CONDITION_OPTIONS,
        3
      );
      // スプレッドシートへ送信
      // スパム対策：見えない欄が埋まっている／入力が速すぎる（5秒未満）場合は送らない
      var elapsedSec = Math.round((Date.now() - state.startedAt) / 1000);
      var looksLikeBot = !!state.formData._hp || elapsedSec < 5;
      state.sid = '';
      if (!looksLikeBot) {
        // 受付ID（＝診断コード）：LINEで送ってもらうと、この診断結果とつなげられる。8文字の英数字
        state.sid = randomCode(8);
        var payload = GASClient.buildPayload(state.formData);
        payload.elapsedSec = elapsedSec;
        payload.sid = state.sid;
        GASClient.postToGAS(payload);
        track('generate_lead', { source: state.formData.source });
      }
 
      renderCurrentPage();
      bindLineClickTracking();
    }, 500);
  }
 
  // 導線の計測：診断結果ページで「LINEで相談」ボタンが押されたら、問い合わせ一覧の同じ行に記録する
  function bindLineClickTracking() {
    var btn = document.getElementById('line-cta-btn');
    if (!btn) return;
    btn.addEventListener('click', function () {
      track('line_click', { source: state.formData.source, place: 'result' });
      if (state.sid) GASClient.postToGAS({ type: 'line_click', sid: state.sid });
    }, { once: true });
  }

  function collectStep2Values() {
    FormConfig.STEP2_SELECTS.forEach(function (s) {
      var el = document.getElementById(s.id);
      if (el) state.formData[s.id] = el.value;
    });
    state.formData.conditions = Array.from(
      document.querySelectorAll('#conditions-grid input[type="checkbox"]:checked')
    ).map(function (cb) { return cb.value; });
  }
 
  // 戻ってきたときにStep2の値を復元
  function restoreStep2Values() {
    FormConfig.STEP2_SELECTS.forEach(function (s) {
      var el = document.getElementById(s.id);
      if (el && state.formData[s.id]) el.value = state.formData[s.id];
    });
    (state.formData.conditions || []).forEach(function (val) {
      var checkItem = document.querySelector('.check-item[data-value="' + val + '"]');
      if (checkItem) {
        checkItem.classList.add('checked');
        checkItem.querySelector('input[type="checkbox"]').checked = true;
      }
    });
  }
 
  return { init: init };
})();
 
// DOMContentLoaded後に起動
document.addEventListener('DOMContentLoaded', function () {
  App.init();
});
