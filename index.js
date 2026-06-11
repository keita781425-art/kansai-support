/**
 * components/index.js
 *
 * Next.js移行時の対応表:
 *   renderHeader()          → components/Header/Header.tsx
 *   renderHero()            → components/Hero/Hero.tsx
 *   renderStepIndicator()   → components/StepIndicator/StepIndicator.tsx
 *   renderStep1Form()       → components/Step1Form/Step1Form.tsx
 *   renderStep2Form()       → components/Step2Form/Step2Form.tsx
 *   renderLoadingScreen()   → components/LoadingScreen/LoadingScreen.tsx
 *   renderResultPage()      → pages/result/page.tsx (またはcomponents/ResultPage)
 *   renderAreaCard()        → components/AreaCard/AreaCard.tsx
 *   renderCTA()             → components/CTA/CTA.tsx
 *
 * Next.js化の際はDOMの直接操作をReact Stateに置き換えてください。
 * 各関数の引数がそのままReactコンポーネントのpropsに対応します。
 */

var Components = (function () {

  /* ━━ Header ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

  function renderHeader(container) {
    container.innerHTML =
      '<header class="header" role="banner">' +
        '<div class="logo-mark" aria-hidden="true">' +
          '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 8v14h8v-6h4v6h8V8L12 2z"/></svg>' +
        '</div>' +
        '<div class="logo-text">' +
          '関西新生活サポート' +
          '<span>住まいから始まる、新生活サポート。</span>' +
        '</div>' +
      '</header>';
  }

  /* ━━ Hero + StepIndicator ━━━━━━━━━━━━━━━ */

  /**
   * @param {HTMLElement} container
   * @param {{ currentStep: number }} props
   */
  function renderHero(container, props) {
    container.innerHTML =
      '<div class="hero">' +
        '<div class="hero-badge" aria-label="無料エリア診断">✦ 無料エリア診断</div>' +
        '<h1>あなたにぴったりの<br><span>関西エリア</span>を見つけよう</h1>' +
        '<p>3分で完了 ・ 入力後すぐに診断結果を表示します</p>' +
        renderStepIndicatorHTML(props.currentStep) +
      '</div>';
  }

  /**
   * @param {number} current  1〜3
   * @returns {string} HTML文字列
   */
  function renderStepIndicatorHTML(current) {
    var steps = [
      { n: 1, label: '基本情報' },
      { n: 2, label: '希望条件' },
      { n: 3, label: '診断結果' },
    ];
    var html = '<div class="steps-bar" role="list" aria-label="入力ステップ">';
    steps.forEach(function (s, i) {
      var cls = s.n < current ? 'done' : s.n === current ? 'active' : '';
      html +=
        '<div class="step-item" role="listitem">' +
          '<div class="step-num ' + cls + '" aria-label="ステップ' + s.n + '">' + s.n + '</div>' +
          '<div class="step-label">' + s.label + '</div>' +
        '</div>';
      if (i < steps.length - 1) {
        var lineDone = current > s.n ? 'done' : '';
        html += '<div class="step-line ' + lineDone + '" aria-hidden="true"></div>';
      }
    });
    html += '</div>';
    return html;
  }

  /* ━━ Step1Form ━━━━━━━━━━━━━━━━━━━━━━━━━━ */

  /**
   * @param {HTMLElement} container
   * @param {{ fields: FieldConfig[], errors: Record<string,string> }} props
   */
  function renderStep1Form(container, props) {
    var fieldsHTML = props.fields.map(function (f) {
      var hasError = props.errors && props.errors[f.id];
      var reqBadge = f.required ? '<span class="req" aria-hidden="true">*</span>' : '<span class="opt">任意</span>';
      return (
        '<div class="field">' +
          '<label for="' + f.id + '">' + f.label + reqBadge + '</label>' +
          '<input' +
            ' type="' + f.type + '"' +
            ' id="' + f.id + '"' +
            ' placeholder="' + (f.placeholder || '') + '"' +
            ' autocomplete="' + (f.autocomplete || 'off') + '"' +
            (hasError ? ' class="error"' : '') +
            (f.required ? ' aria-required="true"' : '') +
          '>' +
          (hasError ? '<div class="field-error show" role="alert">' + props.errors[f.id] + '</div>' : '<div class="field-error"></div>') +
        '</div>'
      );
    }).join('');

    container.innerHTML =
      '<div class="screen active" id="screen1">' +
        '<div class="form-section">' +
          '<div class="section-title">あなたのことを教えてください</div>' +
          fieldsHTML +
        '</div>' +
        '<div class="form-actions">' +
          '<button class="btn-primary" id="btn-to-step2" type="button">次へ → 希望条件を入力</button>' +
        '</div>' +
        '<div class="bottom-spacer"></div>' +
      '</div>';
  }

  /* ━━ Step2Form ━━━━━━━━━━━━━━━━━━━━━━━━━━ */

  /**
   * @param {HTMLElement} container
   * @param {{ selects: SelectConfig[], conditionOptions: ConditionOption[], errors: Record<string,string> }} props
   */
  function renderStep2Form(container, props) {
    var selectsHTML = props.selects.map(function (s) {
      var hasError = props.errors && props.errors[s.id];
      var optionsHTML = s.options.map(function (o) {
        return '<option value="' + o.value + '">' + o.label + '</option>';
      }).join('');
      return (
        '<div class="field">' +
          '<label for="' + s.id + '">' + s.label + '<span class="req" aria-hidden="true">*</span></label>' +
          '<select id="' + s.id + '"' + (hasError ? ' class="error"' : '') + ' aria-required="true">' +
            '<option value="">選択してください</option>' +
            optionsHTML +
          '</select>' +
          (hasError ? '<div class="field-error show" role="alert">' + props.errors[s.id] + '</div>' : '<div class="field-error"></div>') +
        '</div>'
      );
    }).join('');

    var conditionsHTML = props.conditionOptions.map(function (opt) {
      return (
        '<label class="check-item" data-value="' + opt.value + '">' +
          '<input type="checkbox" value="' + opt.value + '" aria-label="' + opt.label + '">' +
          '<div class="check-box" aria-hidden="true"></div>' +
          opt.label +
        '</label>'
      );
    }).join('');

    container.innerHTML =
      '<div class="screen active" id="screen2">' +
        '<div class="form-section">' +
          '<div class="section-title">住まいの希望条件</div>' +
          selectsHTML +
        '</div>' +
        '<div class="form-section">' +
          '<div class="section-title">重視したい条件（複数選択OK）</div>' +
          '<div class="check-grid" id="conditions-grid" role="group" aria-label="重視する条件">' +
            conditionsHTML +
          '</div>' +
        '</div>' +
        '<div class="form-actions">' +
          '<button class="btn-primary" id="btn-submit" type="button">診断結果を見る ✦</button>' +
          '<button class="btn-text" id="btn-to-step1" type="button">← 基本情報に戻る</button>' +
        '</div>' +
        '<div class="bottom-spacer"></div>' +
      '</div>';

    // チェックボックスのトグル
    // label要素クリックでブラウザがネイティブにcheckboxをトグルするため、
    // checkboxのchangeイベントを監視してクラスを同期する（二重トグル防止）
    container.querySelectorAll('.check-item').forEach(function (el) {
      var checkbox = el.querySelector('input[type="checkbox"]');
      checkbox.addEventListener('change', function () {
        el.classList.toggle('checked', checkbox.checked);
      });
    });
  }

  /* ━━ LoadingScreen ━━━━━━━━━━━━━━━━━━━━━━ */

  function renderLoadingScreen(container) {
    container.innerHTML =
      '<div class="screen active loading-screen" id="loading-screen" role="status" aria-live="polite">' +
        '<div class="spinner" aria-hidden="true"></div>' +
        '<div class="loading-text">あなたにぴったりのエリアを<br>診断しています…</div>' +
      '</div>';
  }

  /* ━━ ResultPage ━━━━━━━━━━━━━━━━━━━━━━━━━ */

  /**
   * @param {HTMLElement} container
   * @param {{ name:string, workplace:string, budget:string, commute:string, results:DiagnoseResult[], lineCTAUrl:string }} props
   */
  function renderResultPage(container, props) {
    var displayName = props.name ? props.name.split(/[\s　]/)[0] + 'さん' : '';

    var cardsHTML = props.results.map(function (item, i) {
      return renderAreaCardHTML(item, i + 1);
    }).join('');

    container.innerHTML =
      '<div class="screen active" id="screen3">' +
        '<div class="result-header">' +
          '<div class="hero-badge" style="background:var(--color-primary-light);color:var(--color-primary)">✦ 診断完了</div>' +
          '<h2>' + displayName + 'へのおすすめエリア</h2>' +
          '<p>' +
            '勤務地：' + props.workplace + '　' +
            '予算：' + props.budget + '　' +
            '通勤：' + props.commute +
          '</p>' +
        '</div>' +
        '<div id="area-cards-container">' + cardsHTML + '</div>' +
        renderCTAHTML(props.lineCTAUrl) +
        '<p class="disclaimer">' +
          '※ 診断結果はご入力の情報をもとにした参考情報です。<br>' +
          '実際の物件状況は担当スタッフにご確認ください。' +
        '</p>' +
        '<div class="bottom-spacer"></div>' +
      '</div>';

    // マッチ度バーのアニメーション（DOM描画後に幅を設定）
    setTimeout(function () {
      props.results.forEach(function (item, i) {
        var bar = container.querySelector('#bar' + i);
        if (bar) bar.style.width = item.matchPct + '%';
      });
    }, 100);
  }

  /* ━━ AreaCard ━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

  var MEDALS = ['🥇', '🥈', '🥉'];
  var TAG_CLASSES = ['tag tag-blue', 'tag tag-green', 'tag tag-gray'];

  /**
   * @param {DiagnoseResult} item
   * @param {number} rank  1〜3
   * @returns {string} HTML文字列
   */
  function renderAreaCardHTML(item, rank) {
    var a = item.area;
    var tagsHTML = a.tags.map(function (t, j) {
      return '<span class="' + TAG_CLASSES[j] + '">' + t + '</span>';
    }).join('');

    return (
      '<div class="area-card" aria-label="' + rank + '位：' + a.name + '">' +
        '<div class="area-card-header">' +
          '<div class="rank-badge rank-' + rank + '" aria-hidden="true">' + MEDALS[rank - 1] + '</div>' +
          '<div>' +
            '<div class="area-name">' + a.name + '</div>' +
            '<div class="area-sub">' + a.city + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="area-body">' +
          '<div class="area-tags">' + tagsHTML + '</div>' +
          '<p class="area-desc">' + a.desc + '</p>' +
          '<div class="match-bar-wrap">' +
            '<div class="match-label">' +
              '<span>マッチ度</span>' +
              '<span>' + item.matchPct + '%</span>' +
            '</div>' +
            '<div class="match-bar" role="progressbar" aria-valuenow="' + item.matchPct + '" aria-valuemin="0" aria-valuemax="100">' +
              '<div class="match-fill" id="bar' + (rank - 1) + '" style="width:0%"></div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  /* ━━ CTA ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

  /**
   * @param {string} lineUrl
   * @returns {string} HTML文字列
   */
  function renderCTAHTML(lineUrl) {
    return (
      '<div class="cta-section">' +
        '<h3>気になるエリアを詳しく知りたい方へ</h3>' +
        '<p>担当スタッフが物件探しのご相談を<br>無料でサポートします。</p>' +
        '<a href="' + lineUrl + '" class="btn-line" id="line-cta-btn" target="_blank" rel="noopener noreferrer" aria-label="LINEで担当者に無料相談する">' +
          renderLineIconSVG() +
          '担当者に無料相談する' +
        '</a>' +
      '</div>'
    );
  }

  function renderLineIconSVG() {
    return (
      '<svg width="24" height="24" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<rect width="40" height="40" rx="10" fill="white"/>' +
        '<path d="M20 7C12.82 7 7 12.06 7 18.31c0 5.61 4.98 10.32 11.7 11.19.46.1 1.08.3 1.24.7.14.35.09.91.04 1.26 0 0-.16 1-.2 1.21-.06.35-.28 1.38 1.21.75 1.49-.63 8.05-4.74 10.98-8.12C33.88 22.62 33 20.56 33 18.31 33 12.06 27.18 7 20 7z" fill="#06C755"/>' +
        '<path d="M28.03 22.07h-4.2a.3.3 0 01-.3-.3v-6.5c0-.17.13-.3.3-.3h4.2c.16 0 .3.13.3.3v1.06c0 .17-.14.3-.3.3h-2.83v1.12h2.83c.16 0 .3.13.3.3v1.06c0 .17-.14.3-.3.3h-2.83v1.12h2.83c.16 0 .3.13.3.3v1.06c0 .17-.14.3-.3.3zm-5.88 0h-1.06a.3.3 0 01-.3-.3v-6.5c0-.17.13-.3.3-.3h1.06c.17 0 .3.13.3.3v6.5c0 .16-.13.3-.3.3zm-2.12 0h-4.2a.3.3 0 01-.3-.3v-6.5c0-.17.13-.3.3-.3h1.06c.17 0 .3.13.3.3v5.14h2.84c.16 0 .3.13.3.3v1.06c0 .17-.14.3-.3.3zm-5.88-6.8h-1.06a.3.3 0 00-.3.3v6.5c0 .16.13.3.3.3h1.06c.17 0 .3-.14.3-.3v-6.5c0-.17-.13-.3-.3-.3z" fill="white"/>' +
      '</svg>'
    );
  }

  return {
    renderHeader: renderHeader,
    renderHero: renderHero,
    renderStep1Form: renderStep1Form,
    renderStep2Form: renderStep2Form,
    renderLoadingScreen: renderLoadingScreen,
    renderResultPage: renderResultPage,
  };
})();
