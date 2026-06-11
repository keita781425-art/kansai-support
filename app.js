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
  };

  // ━━ DOM refs ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  var $header, $hero, $main;

  // ━━ Init ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  function init() {
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
      state.results = DiagnoseLogic.diagnose(
        state.formData,
        AreaData.AREAS,
        FormConfig.CONDITION_OPTIONS,
        3
      );
      // スプレッドシートへ送信
      var payload = GASClient.buildPayload(state.formData);
      GASClient.postToGAS(payload);

      renderCurrentPage();
    }, 1600);
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
