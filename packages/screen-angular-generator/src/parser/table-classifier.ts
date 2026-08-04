import type { SectionContext } from './markdown-ast-parser.js';

export type TableKind =
  | 'screenMeta'
  | 'idExamples'
  | 'typeNamespaces'
  | 'permissions'
  | 'permissionRules'
  | 'operations'
  | 'searchMeta'
  | 'searchFields'
  | 'searchRules'
  | 'treeMeta'
  | 'treeDisplayFields'
  | 'treeRules'
  | 'detailMeta'
  | 'detailFields'
  | 'detailFormRules'
  | 'apis'
  | 'apiParameters'
  | 'apiValidations'
  | 'apiCommonRules'
  | 'apiErrors'
  | 'storeMeta'
  | 'storeFields'
  | 'nonStoreState'
  | 'types'
  | 'actions'
  | 'reducerUpdates'
  | 'effectRules'
  | 'unsavedChangesMeta'
  | 'unsavedChangeOperations'
  | 'concurrentUpdateMeta'
  | 'concurrentUpdateRules'
  | 'displayRules'
  | 'screenValidations'
  | 'mappers'
  | 'tests'
  | 'componentTypes'
  | 'implementationRules'
  | 'componentsCatalog'
  | 'componentTypeMatrix'
  | 'componentMeta'
  | 'componentAppliedRules'
  | 'componentResponsibilities'
  | 'componentSelectors'
  | 'componentDispatchActions'
  | 'componentChildBindings'
  | 'componentInputs'
  | 'componentOutputs'
  | 'componentFormControls'
  | 'componentLocalState'
  | 'componentBehaviorRules'
  | 'componentProhibitions'
  | 'componentReferenceMap'
  | 'forms'
  | 'formRules'
  | 'operationEventMap'
  | 'unsavedDirtyBehavior'
  | 'pendingOperationExecution'
  | 'viewModel'
  | 'moduleMeta'
  | 'moduleDeclarations'
  | 'moduleRouting'
  | 'outputFiles'
  | 'integrityRules'
  | 'referenceTargets'
  | 'unknown';

export interface TableClassification {
  kind: TableKind;
  confidence: 'high' | 'medium' | 'low';
}

function hasAll(headers: string[], required: string[]): boolean {
  return required.every((item) => headers.includes(item));
}

function hasAny(headers: string[], candidates: string[]): boolean {
  return candidates.some((item) => headers.includes(item));
}

function headingIncludes(section: SectionContext, ...keywords: string[]): boolean {
  const haystack = section.path.join(' / ').toLowerCase();
  return keywords.some((keyword) => haystack.includes(keyword.toLowerCase()));
}

/**
 * Classify a GFM table using heading hierarchy, column names, and leading columns.
 * Does not rely on heading text alone.
 */
export function classifyTable(
  headers: string[],
  section: SectionContext,
  precedingParagraph: string | null,
): TableClassification {
  const first = headers[0] ?? '';
  const context = `${section.path.join(' ')} ${precedingParagraph ?? ''}`;

  if (hasAll(headers, ['項目ID', '項目', '値']) && headingIncludes(section, '画面概要')) {
    return { kind: 'screenMeta', confidence: 'high' };
  }
  if (hasAll(headers, ['項目ID', '項目', '値']) && headingIncludes(section, '検索条件概要', '検索条件')) {
    return { kind: 'searchMeta', confidence: 'high' };
  }
  if (hasAll(headers, ['項目ID', '項目', '値']) && headingIncludes(section, 'ツリー概要', '製品構成ツリー')) {
    return { kind: 'treeMeta', confidence: 'high' };
  }
  if (hasAll(headers, ['項目ID', '項目', '値']) && headingIncludes(section, '詳細概要', '製品詳細')) {
    return { kind: 'detailMeta', confidence: 'high' };
  }
  if (hasAll(headers, ['項目ID', '値']) && headingIncludes(section, '未保存変更')) {
    return { kind: 'unsavedChangesMeta', confidence: 'high' };
  }
  if (hasAll(headers, ['項目ID', '値']) && headingIncludes(section, '同時更新')) {
    return { kind: 'concurrentUpdateMeta', confidence: 'high' };
  }
  if (hasAll(headers, ['項目ID', '値']) && headingIncludes(section, 'Store概要', 'Store構成')) {
    return { kind: 'storeMeta', confidence: 'high' };
  }
  if (hasAll(headers, ['項目', '値']) && headingIncludes(section, '基本定義')) {
    return { kind: 'componentMeta', confidence: 'high' };
  }
  if (hasAll(headers, ['項目', '内容']) && headingIncludes(section, 'モジュール', 'ProductStructureModule')) {
    return { kind: 'moduleMeta', confidence: 'medium' };
  }

  if (hasAll(headers, ['種類', 'ID例'])) {
    return { kind: 'idExamples', confidence: 'high' };
  }
  if (hasAll(headers, ['名前空間', '用途'])) {
    return { kind: 'typeNamespaces', confidence: 'high' };
  }
  if (hasAll(headers, ['権限ID', '権限コード', '用途'])) {
    return { kind: 'permissions', confidence: 'high' };
  }
  if (hasAll(headers, ['ルールID', '条件', '挙動']) && headingIncludes(section, '権限')) {
    return { kind: 'permissionRules', confidence: 'high' };
  }
  if (hasAll(headers, ['操作ID', '操作名', '説明'])) {
    return { kind: 'operations', confidence: 'high' };
  }
  if (
    hasAll(headers, ['フィールドID', 'フィールド名', 'ラベル', '型', '必須']) &&
    headingIncludes(section, '検索')
  ) {
    return { kind: 'searchFields', confidence: 'high' };
  }
  if (
    hasAll(headers, ['フィールドID', 'フィールド名', 'ラベル', '型', '必須', '編集可']) ||
    (hasAll(headers, ['フィールドID', 'フィールド名', 'ラベル', '型']) &&
      headingIncludes(section, '詳細'))
  ) {
    return { kind: 'detailFields', confidence: 'high' };
  }
  if (hasAll(headers, ['表示項目ID', 'フィールド', '説明'])) {
    return { kind: 'treeDisplayFields', confidence: 'high' };
  }
  if (hasAll(headers, ['API ID', 'API名', 'メソッド', 'パス'])) {
    return { kind: 'apis', confidence: 'high' };
  }
  if (hasAll(headers, ['パラメータID', 'API', 'パラメータ名', '送信先'])) {
    return { kind: 'apiParameters', confidence: 'high' };
  }
  if (
    hasAll(headers, ['Validation ID', 'パラメータ', 'ルール']) ||
    (hasAll(headers, ['Validation ID', 'ルール']) && headingIncludes(section, 'API'))
  ) {
    return { kind: 'apiValidations', confidence: 'high' };
  }
  if (hasAll(headers, ['条件', 'HTTPステータス', 'エラーコード'])) {
    return { kind: 'apiErrors', confidence: 'high' };
  }
  if (hasAll(headers, ['Store項目ID', 'フィールド名', '型', '初期値'])) {
    return { kind: 'storeFields', confidence: 'high' };
  }
  if (hasAll(headers, ['状態ID', '状態', '管理先'])) {
    return { kind: 'nonStoreState', confidence: 'high' };
  }
  if (hasAll(headers, ['型ID', '型名', 'プロパティ', '型'])) {
    return { kind: 'types', confidence: 'high' };
  }
  if (hasAll(headers, ['Action ID', 'Action名'])) {
    return { kind: 'actions', confidence: 'high' };
  }
  if (hasAll(headers, ['Action ID', 'Store更新内容'])) {
    return { kind: 'reducerUpdates', confidence: 'high' };
  }
  if (hasAll(headers, ['ルールID', '対象Action', '条件', 'Dispatch先'])) {
    return { kind: 'effectRules', confidence: 'high' };
  }
  if (hasAll(headers, ['対象ID', '操作', '保留操作種別'])) {
    return { kind: 'unsavedChangeOperations', confidence: 'high' };
  }
  if (hasAll(headers, ['ルールID', '条件', '挙動']) && headingIncludes(section, '表示')) {
    return { kind: 'displayRules', confidence: 'high' };
  }
  if (hasAll(headers, ['Validation ID', 'フィールド']) && headingIncludes(section, '画面入力')) {
    return { kind: 'screenValidations', confidence: 'high' };
  }
  if (hasAll(headers, ['Mapper ID', '入力型', '出力型'])) {
    return { kind: 'mappers', confidence: 'high' };
  }
  if (hasAll(headers, ['テストID', '対象', '内容']) || hasAll(headers, ['テストID', 'Component', '内容'])) {
    return { kind: 'tests', confidence: 'high' };
  }
  if (hasAll(headers, ['種別ID', '種別名', '説明'])) {
    return { kind: 'componentTypes', confidence: 'high' };
  }
  if (hasAll(headers, ['原則ID', '適用種別', '内容'])) {
    return { kind: 'implementationRules', confidence: 'high' };
  }
  if (hasAll(headers, ['Component ID', 'クラス名', 'Selector', '種別'])) {
    return { kind: 'componentsCatalog', confidence: 'high' };
  }
  if (hasAll(headers, ['種別', 'Store接続', 'Action dispatch'])) {
    return { kind: 'componentTypeMatrix', confidence: 'high' };
  }
  if (headers.length === 1 && headers[0] === '原則ID') {
    return { kind: 'componentAppliedRules', confidence: 'high' };
  }
  if (hasAll(headers, ['責務ID', '内容'])) {
    return { kind: 'componentResponsibilities', confidence: 'high' };
  }
  if (hasAll(headers, ['Selector ID', 'Storeまたはルール参照']) || hasAll(headers, ['Selector ID'])) {
    return { kind: 'componentSelectors', confidence: 'high' };
  }
  if (hasAll(headers, ['発生契機', 'Action'])) {
    return { kind: 'componentDispatchActions', confidence: 'high' };
  }
  if (hasAll(headers, ['子Component', 'Input', '参照元'])) {
    return { kind: 'componentChildBindings', confidence: 'high' };
  }
  if (hasAll(headers, ['Input ID', 'Input名']) && hasAny(headers, ['型', '型または参照'])) {
    return { kind: 'componentInputs', confidence: 'high' };
  }
  if (hasAll(headers, ['Output ID', 'Output名'])) {
    return { kind: 'componentOutputs', confidence: 'high' };
  }
  if (hasAll(headers, ['Control ID', 'Control名'])) {
    return { kind: 'componentFormControls', confidence: 'high' };
  }
  if (hasAll(headers, ['State ID', '状態名', '型', '初期値'])) {
    return { kind: 'componentLocalState', confidence: 'high' };
  }
  if (hasAll(headers, ['動作ID', '内容']) || hasAll(headers, ['条件ID', '条件'])) {
    return { kind: 'componentBehaviorRules', confidence: 'high' };
  }
  if (hasAll(headers, ['禁止事項ID', '内容'])) {
    return { kind: 'componentProhibitions', confidence: 'high' };
  }
  if (
    hasAll(headers, ['プロパティ', '参照元']) ||
    hasAll(headers, ['Payloadプロパティ', '参照元']) ||
    hasAll(headers, ['用途', '参照']) ||
    hasAll(headers, ['フィールド', '制御'])
  ) {
    return { kind: 'componentReferenceMap', confidence: 'medium' };
  }
  if (hasAll(headers, ['Form ID', '所有Component'])) {
    return { kind: 'forms', confidence: 'high' };
  }
  if (hasAll(headers, ['操作', '発生Component', 'Output', 'Container処理'])) {
    return { kind: 'operationEventMap', confidence: 'high' };
  }
  if (hasAll(headers, ['操作', 'dirty=false', 'dirty=true'])) {
    return { kind: 'unsavedDirtyBehavior', confidence: 'high' };
  }
  if (hasAll(headers, ['保留操作種別', '確認後の処理'])) {
    return { kind: 'pendingOperationExecution', confidence: 'high' };
  }
  if (hasAll(headers, ['プロパティ', '型', 'Storeまたはルール参照'])) {
    return { kind: 'viewModel', confidence: 'high' };
  }
  if (hasAll(headers, ['Component', '種別']) && headingIncludes(section, 'Declarations')) {
    return { kind: 'moduleDeclarations', confidence: 'high' };
  }
  if (hasAll(headers, ['パス', 'Component']) && headingIncludes(section, 'Routing', 'ルート')) {
    return { kind: 'moduleRouting', confidence: 'high' };
  }
  if (hasAll(headers, ['参照対象', '参照元'])) {
    return { kind: 'referenceTargets', confidence: 'high' };
  }
  if (hasAll(headers, ['検証ID', '検証内容'])) {
    return { kind: 'integrityRules', confidence: 'high' };
  }
  if (hasAll(headers, ['ルールID', '内容'])) {
    if (headingIncludes(section, '検索')) return { kind: 'searchRules', confidence: 'high' };
    if (headingIncludes(section, 'ツリー')) return { kind: 'treeRules', confidence: 'high' };
    if (headingIncludes(section, 'フォーム状態', '詳細')) return { kind: 'detailFormRules', confidence: 'high' };
    if (headingIncludes(section, 'API共通')) return { kind: 'apiCommonRules', confidence: 'high' };
    if (headingIncludes(section, '同時更新')) return { kind: 'concurrentUpdateRules', confidence: 'high' };
    if (headingIncludes(section, 'フォーム所有')) return { kind: 'formRules', confidence: 'high' };
    if (headingIncludes(section, '動作', '表示')) return { kind: 'componentBehaviorRules', confidence: 'medium' };
    return { kind: 'searchRules', confidence: 'low' };
  }

  if (first === 'ルールID' && headers.includes('内容')) {
    return { kind: 'searchRules', confidence: 'low' };
  }

  void context;
  return { kind: 'unknown', confidence: 'low' };
}
