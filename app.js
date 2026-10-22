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
        name: state.formData.name,
        workplace: state.formData.workplace,
        budget: state.formData.budget,
        commute: state.formData.commute,
        results: state.results,
        lineCTAUrl: LINE_CTA_URL,
      });
    }
  }
 
  // ━━ Event binding ━━━━━━━━━━━━━━━━━━━━━━━
  function bindStep1Events() {
    document.getElementById('btn-to-step2').addEventListener('click', handleSubmitStep1);
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

    // 個人情報の提供への同意（必須）
    if (!state.formData.consent) {
      result.valid = false;
      result.errors.consent = 'ご相談には、プライバシーポリシーと情報提供への同意が必要です';
    }

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
      state.results = DiagnoseLogic.diagnose(
        state.formData,
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
        // 受付ID：あとで「LINEボタンを押したか」をこの行に記録するための番号
        state.sid = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        var payload = GASClient.buildPayload(state.formData);
        payload.elapsedSec = elapsedSec;
        payload.sid = state.sid;
        GASClient.postToGAS(payload);
      }
 
      renderCurrentPage();
      bindLineClickTracking();
    }, 500);
  }
 
  // 導線の計測：診断結果ページで「LINEで相談」ボタンが押されたら、問い合わせ一覧の同じ行に記録する
  function bindLineClickTracking() {
    var btn = document.getElementById('line-cta-btn');
    if (!btn || !state.sid) return;
    btn.addEventListener('click', function () {
      GASClient.postToGAS({ type: 'line_click', sid: state.sid });
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
    var consentEl = document.getElementById('consent');
    if (consentEl) state.formData.consent = consentEl.checked;
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
    var consentEl = document.getElementById('consent');
    if (consentEl && state.formData.consent) consentEl.checked = true;
  }
 
  return { init: init };
})();
 
// DOMContentLoaded後に起動
document.addEventListener('DOMContentLoaded', function () {
  App.init();
});
