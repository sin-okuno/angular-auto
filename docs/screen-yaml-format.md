# screen.yaml フォーマット

`screen.yaml` は Markdown から生成される中間表現であり、コード生成の唯一の入力。
スキーマは `schemas/screen.schema.json`、型は
`tools/generator/src/types/screen-definition.ts` を参照。生成例は
`screens/product-structure.yaml`。

## 全体構造

```yaml
version: 1
screen: { id, name, route, pageType, featureName }
permissions: [{ code, description }]
operations: [{ id, name, description, requiresPermission }]
search: { conditionType, fields: [{ name, label, type, required }] }
tree: { nodeType, idField, detailIdField, displayFields, rules: [{ id, description }] }
detail: { modelType, fields: [{ name, label, type, required, editable }], formStateManagement }
apis: [{ id, name, method, path, requestType, responseType, description }]
store: { featureKey, fields: [{ name, type, initial, description }] }
types: { api: [...], view: [...], action: [...] }
actions: [{ id, name, category, payloadType, api, successAction, failureAction, relatedOperation, storeUpdates }]
unsavedChanges: { enabled, dirtySource, operations, confirmMessage }
concurrentUpdate: { enabled, revisionField, statusCode, errorCode, message }
displayRules: [{ id, condition, behavior }]
validations: [{ field, rule, message }]
tests: [{ id, target, description }]
```

## 必須・任意

- ルート直下の全キーは必須（`schemas/screen.schema.json` の `required`）。
- 配列は空でもよいが、キー自体は存在する必要がある。
- `type` プロパティの `optional` は `?` 修飾子の有無を表す。
- `store.fields[].initial` は TypeScript 初期化式（例: `[]`, `null`, `false`, `0`）。

## enum / 形式

| 項目 | 制約 |
| --- | --- |
| `screen.pageType` | `tree-detail` |
| `screen.id` / `featureName` | `^[a-z][a-z0-9-]*$` |
| `apis[].method` | `GET` / `POST` / `PUT` / `DELETE` / `PATCH` |
| `apis[].path` | `/` から始まる |
| `permissions[].code` | `^[A-Z][A-Z0-9_]*$` |
| `operations[].id` / `actions[].id` | `^[a-z][a-zA-Z0-9]*$` |
| `types.*[].name` | `^[A-Z][A-Za-z0-9]*$` |

## 参照関係（reference-validator.ts）

| 検証 | 内容 |
| --- | --- |
| 操作参照 | `actions[].relatedOperation` が `operations` に存在 |
| 型参照 | API / Store / Action / 型プロパティが参照する型が `types` に存在 |
| Action参照 | `successAction` / `failureAction` が `actions` に存在 |
| Store参照 | `storeUpdates[].field` が `store.fields` に存在 |
| API参照 | `actions[].api` が `apis` に存在 |
| 権限参照 | `operations[].requiresPermission` が `permissions` に存在 |
| 初期値 | `store.fields[].type` と `initial` が矛盾しない |
| 同時更新 | 更新系 API の `requestType` に `revisionField` が存在 |
| 未保存変更 | `PendingOperation` 型と `pendingOperation` Store 項目・更新 Action が存在 |
| 重複 | 操作ID / 型名 / Action名 / API名 / API ID が重複しない |
| 到達不能Action | どの操作・Action からも到達しない Action を警告 |
| 循環 | success/failure による意図しない循環を警告 |

エラーは終了コード 1、警告は 0（`validate` / `check`）。

## サンプル

`screens/product-structure.yaml`（自動生成）を参照。手で編集せず、
`specs/product-structure.md` を編集して再生成すること。
