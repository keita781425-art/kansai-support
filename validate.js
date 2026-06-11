/**
 * lib/validate.js
 *
 * Next.js移行時: lib/validate.ts として使用
 * サーバー/クライアント両方で使えるピュア関数のみ定義します。
 *
 * 型定義例:
 *   type FieldConfig = { id:string; required:boolean; errorMessage?:string }
 *   type ValidationResult = { valid:boolean; errors:Record<string,string> }
 *   export function validateFields(values: Record<string,string>, fields: FieldConfig[]): ValidationResult
 */

var Validate = (function () {

  /**
   * フィールドリストに対してバリデーションを実行
   * @param {Record<string, string>} values  フィールドID -> 入力値
   * @param {FieldConfig[]} fields
   * @returns {{ valid: boolean, errors: Record<string, string> }}
   */
  function validateFields(values, fields) {
    var errors = {};
    fields.forEach(function (field) {
      if (field.required && !values[field.id]) {
        errors[field.id] = field.errorMessage || (field.label + 'を入力してください');
      }
    });
    return { valid: Object.keys(errors).length === 0, errors: errors };
  }

  /**
   * 電話番号の簡易フォーマットチェック
   * @param {string} phone
   * @returns {boolean}
   */
  function isValidPhone(phone) {
    return /^[\d\-\+\(\)\s]{7,15}$/.test(phone.trim());
  }

  return {
    validateFields: validateFields,
    isValidPhone: isValidPhone,
  };
})();
