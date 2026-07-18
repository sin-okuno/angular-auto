# Markdown 画面仕様書フォーマット

`specs/*.md` は決められた見出し（`##`）とテーブルで構成する。
サンプルは `specs/product-structure.md`。

## 1. 必須見出し（すべて `##`）

```text
画面概要
権限制御
画面操作
検索条件
製品構成ツリー
製品詳細項目
API一覧
Store構成
型定義
Action一覧・Store更新内容
未保存変更
同時更新
表示ルール
入力チェック
主なテスト観点
```

いずれか欠けると `MISSING_SECTION_ERROR` で停止する。

## 2. 表の列名

メタ情報は `| 項目 | 値 |` の 2 列テーブルで表す。一覧は以下の列を持つ。

| セクション | 必須列 |
| --- | --- |
| 権限制御 | 権限コード, 用途 |
| 画面操作 | 操作ID, 操作名, 説明, 必要権限 |
| 検索条件 | フィールド, ラベル, 型, 必須（＋メタ: 条件型） |
| 製品構成ツリー | ルールID, 内容（＋メタ: ノード型 / IDフィールド / 詳細IDフィールド / 表示フィールド） |
| 製品詳細項目 | フィールド, ラベル, 型, 必須, 編集可（＋メタ: モデル型 / フォーム状態管理） |
| API一覧 | API ID, API名, メソッド, パス, リクエスト型, レスポンス型, 説明 |
| Store構成 | フィールド, 型, 初期値, 説明（＋メタ: フィーチャーキー） |
| 型定義 | カテゴリー, 型名, プロパティ, 型, 任意, 説明 |
| Action一覧・Store更新内容 | アクションID, アクション名, カテゴリー, ペイロード型, API, 成功アクション, 失敗アクション, 関連操作, Store更新内容 |
| 未保存変更 | 対象操作（＋メタ: 有効 / 判定元 / 確認メッセージ） |
| 同時更新 | メタ: 有効 / リビジョン項目 / ステータスコード / エラーコード / メッセージ |
| 表示ルール | ルールID, 条件, 挙動 |
| 入力チェック | フィールド, ルール, メッセージ |
| 主なテスト観点 | テストID, 対象, 内容 |

列が不足すると `MISSING_COLUMN_ERROR` で対象セクションを表示して停止する。

## 3. 型の書き方

- `string` `number` `boolean` などのプリミティブ
- 配列は `ProductTreeNode[]`
- Union は `string | null`（`|` はセル内で `\|` とエスケープ）
- 参照する型は必ず「型定義」セクションに存在すること（`TYPE_REFERENCE_ERROR`）

## 4. null / 真偽値 / 数値の書き方

セル値は以下のルールで正規化される。

- `-` / 空 / `なし` … 未設定（null 相当）
- `null` … null 値
- `true` / `false` … boolean
- 数値として解釈できる文字列 … number
- 全角・半角空白の差は正規化される
- `<br>` は配列（複数値）として扱う（例: 表示フィールド、Store更新内容、対象操作）

## 5. Action の書き方

`Action一覧・Store更新内容` の 1 行が 1 アクション。

- 日本語のアクション名は変更されない（`アクション名`）。
- アクションIDはコード上の識別子（camelCase）。
- `成功アクション` `失敗アクション` は他のアクションIDを参照する（`ACTION_REFERENCE_ERROR`）。
- `API` は `API一覧` の ID を参照する（`API_REFERENCE_ERROR`）。
- `関連操作` は `画面操作` の操作IDを参照する。

## 6. Store 更新内容の書き方

`field=value` を `<br>` で区切って複数指定する。

```text
treeNodes=action.nodes<br>loading=false
```

- 左辺は `Store構成` のフィールド（`STORE_REFERENCE_ERROR`）。
- 右辺はそのまま Reducer の式として展開される（`action.xxx`、`true`、`null` など）。
- `action.xxx` を含む場合、Reducer は `(state, action)` を受け取る。

## 7. API 用型と画面用型の分離

`型定義` の `カテゴリー` 列で 3 種類に分離する。

| カテゴリー | 用途 | 出力先 |
| --- | --- | --- |
| `api` | HTTP 送受信の DTO | `models/api/` |
| `view` | 画面・Store モデル | `models/store/` |
| `action` | Action ペイロード（UI 用 `componentId` 等も可） | `models/actions/action-payloads.model.ts`（一括） |

API Body へ画面制御用の項目（`componentId` 等）を含めないこと。

## 8. サンプル仕様書

`specs/product-structure.md` を参照。この 1 ファイルから
`screens/product-structure.yaml` と `src/app/features/product-structure/` 一式が
生成される。

## 9. 主なエラー分類

```text
MARKDOWN_PARSE_ERROR      Markdown 解析エラー
MISSING_SECTION_ERROR     必須セクション不足
MISSING_COLUMN_ERROR      必須列不足
SCHEMA_VALIDATION_ERROR   JSON Schema 違反
TYPE_REFERENCE_ERROR      型参照不正
STORE_REFERENCE_ERROR     Store 項目参照不正
ACTION_REFERENCE_ERROR    Action 参照不正 / 到達不能 / 循環
API_REFERENCE_ERROR       API 参照不正
PERMISSION_REFERENCE_ERROR 権限参照不正
TEMPLATE_RENDER_ERROR     テンプレート描画エラー
FILE_WRITE_ERROR          ファイル書込エラー
BUILD_ERROR               型チェック / build 失敗
```
