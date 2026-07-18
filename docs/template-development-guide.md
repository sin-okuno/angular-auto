# テンプレート開発ガイド

コード生成は Handlebars テンプレート（`templates/<pageType>/*.hbs`）で行う。
現在の `pageType` は `tree-detail`。

## 1. hbs の役割

| テンプレート | 生成物 |
| --- | --- |
| `module.ts.hbs` | Feature `NgModule`（`StoreModule.forFeature` / `EffectsModule.forFeature`） |
| `routing.module.ts.hbs` | Feature Routing（`CanDeactivate` 未保存変更ガード） |
| `component.ts.hbs` | ページ Component（OnPush / Reactive Forms） |
| `component.html.hbs` | テンプレート（検索・ツリー・詳細フォーム・同時更新） |
| `component.scss.hbs` | スタイル |
| `actions.ts.hbs` | `createAction` 群 |
| `reducer.ts.hbs` | `createReducer`（Store更新内容を反映） |
| `selectors.ts.hbs` | Feature / 派生 / ViewModel セレクター |
| `effects.ts.hbs` | Effects（Service 呼出・DTO 変換・同時更新判定） |
| `state.ts.hbs` | State interface / featureKey / initialState |
| `service.ts.hbs` | HttpClient 通信のみの Service |
| `mapper.ts.hbs` | DTO ↔ View / Request 変換の pure function |
| `api-model.ts.hbs` / `store-model.ts.hbs` | 型定義（api / view は 1 型 1 ファイル） |
| `action-models.ts.hbs` | Action ペイロード型（`action-payloads.model.ts` にまとめて出力） |
| `*.spec.ts.hbs` | Component / Reducer / Selector / Effect / Service / Guard テスト |
| `unsaved-changes.guard.ts.hbs` | `CanDeactivateFn` ガード |

## 2. テンプレート変数一覧

コンテキストは `tools/generator/src/generator/code-generator.ts` の `buildContext`
が組み立てる。主なもの:

| 変数 | 内容 |
| --- | --- |
| `header` | 自動生成ヘッダー（`sourceSpecification` / `screenDefinition`） |
| `naming` | 命名一式（`componentClassName`, `moduleClassName`, `featureKey`, `fileBase` ...） |
| `screen` / `permissions` / `operations` | 画面メタ・権限・操作 |
| `search` / `tree` / `detail` | 検索条件・ツリー・詳細 |
| `apis` | Service 用に整形した API（`methodName`, `urlExpression`, `isQuery`/`isBody` ...） |
| `store` | featureKey と Store 項目（`initial` は初期化式） |
| `models` | `api` / `view` / `action` のモデルファイル群（各要素は `fileBase` + `types` + `imports`） |
| `actions` | Action（`type`, `propName`, `hasPayload`, `storeUpdates`, `needsActionParam` ...） |
| `flow` | tree-detail 固有の解決済み型・プロパティ（`nodeType`, `detailResponseType` ...） |
| `formFields` / `editableFormFields` | フォーム項目（`defaultValue`, `validators`, `disabled`） |
| `viewPermission` / `updatePermission` | 権限コード |
| `apiTypeNames` / `viewTypeNames` / `actionTypeNames` / `actionPayloadTypes` | import 用の型名 |

## 3. each / if の使い方

```hbs
{{#each store.fields}}
  {{name}}: {{type}};
{{/each}}

{{#if hasPayload}}
  props<{{payloadType}}>(),
{{/if}}

{{#each actions}}
  on({{../naming.actionsClassName}}.{{propName}}, ...)
{{/each}}
```

親コンテキスト参照は `../` を使う。

## 4. helper 一覧（`template-renderer.ts`）

| helper | 用途 |
| --- | --- |
| `pascalCase` / `camelCase` / `kebabCase` / `constantCase` | 命名変換 |
| `capitalize` / `upper` / `lower` | 大文字小文字 |
| `eq` / `ne` / `and` / `or` / `not` | 比較・論理 |
| `includes` | 配列包含 |
| `join` | 配列を区切り結合（既定 `, `） |
| `json` | `JSON.stringify` |

## 5. HTML テンプレートの注意（重要）

Handlebars と Angular はどちらも `{{ }}` を使う。競合を避けるため、
HTML テンプレートでは Angular の補間 `{{ }}` を使わず、プロパティバインディング
（`[textContent]` など）と Handlebars による静的テキスト出力で表現する。
ノードラベルなどの式は `code-generator.ts` で事前計算し（例: `nodeLabelBinding`）、
テンプレートには文字列として差し込む。

## 6. pageType の追加方法

1. `templates/<newPageType>/` に hbs 一式を追加する。
2. `code-generator.ts` の `PAGE_TEMPLATE_DIR` / `fileTemplates` を pageType で分岐させる。
3. 必要に応じて `buildFlow` を pageType 別に実装する。
4. `schemas/screen.schema.json` の `pageType` enum に追加する。
5. `screen-converter.ts` の pageType チェックを更新する。

## 7. テンプレート変更時のテスト方法

```bash
# 差分確認（書き込まない）
npm run generate:dry-run -- specs/product-structure.md

# 反映して型チェック・build まで
npm run generate:screen -- specs/product-structure.md

# 反映後、テストまで
npm run generate:screen -- specs/product-structure.md --test

# 整合性確認（CI 用、差分で終了コード 1）
npm run generate:check -- specs/product-structure.md
```

生成は決定的なので、同じ入力からは常に同じ出力になる。差分が出た場合は
テンプレートまたは仕様書の変更が原因。
