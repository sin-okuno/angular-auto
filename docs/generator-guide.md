# コード生成基盤 利用ガイド

Markdown 形式の画面仕様書を起点に、`screen.yaml` と Angular + NgRx コードを
決定的に生成する基盤の使い方をまとめる。AI による実行時のコード生成は行わない。
同じ Markdown からは常に同じ `screen.yaml`・同じコードが生成される。

## 1. 初回セットアップ

```bash
# ルートの Angular 依存
npm install

# ジェネレーター依存
cd tools/generator
npm install
cd ../..
```

Node.js 20 以上を推奨。インターネット接続なしで生成できる（外部 API 不要）。

## 2. コマンド一覧

ルートの `package.json` から利用できる。すべて引数の前に `--` が必要。

| コマンド | 説明 |
| --- | --- |
| `npm run spec:convert -- <md>` | Markdown から `screen.yaml` を生成 |
| `npm run screen:validate -- <yaml>` | `screen.yaml` を Schema + 参照検証 |
| `npm run code:generate -- <yaml>` | `screen.yaml` から Angular コード生成 |
| `npm run generate:screen -- <md>` | 一括生成（変換→検証→生成→整形→書込→型チェック→build） |
| `npm run generate:dry-run -- <md>` | 差分のみ表示（ファイルは変更しない） |
| `npm run generate:check -- <md>` | 仕様書・YAML・コードの整合性確認（差分で終了コード 1） |

ジェネレーター単体でも実行できる（`tools/generator` 配下）。

```bash
cd tools/generator
npx tsx src/index.ts <convert|validate|generate|all|dry-run|check> <input> [options]
```

## 3. Markdown から一括生成する

```bash
npm run generate:screen -- specs/product-structure.md
```

実行順序:

1. Markdown 解析
2. `screen.yaml` 生成（`screens/<feature>.yaml`）
3. JSON Schema 検証
4. 参照整合性検証
5. 一時（メモリ）へコード生成
6. Prettier 整形
7. 差分確認
8. 実ファイルへ反映（簡易トランザクション）
9. ジェネレーターの型チェック（`tsc --noEmit`）
10. `ng build`

出力先は既定で `src/app/features/<feature>/`。

### 単体テストまで実行する

```bash
npm run generate:screen -- specs/product-structure.md --test
```

`--test` 指定時のみ `ng test`（ChromeHeadless）を実行する。

## 4. dry-run（差分確認）

```bash
npm run generate:dry-run -- specs/product-structure.md
```

ファイルは一切変更せず、以下のように表示する。

```text
CREATE product-structure.actions.ts
UPDATE product-structure.reducer.ts
UNCHANGED product-structure.service.ts
DELETE obsolete.generated.ts

No files were written.
```

## 5. check（整合性確認）

```bash
npm run generate:check -- specs/product-structure.md
```

- `screen.yaml` が Markdown と一致しているか
- 生成コードがディスク上のコードと一致しているか
- Schema / 参照検証にエラーがないか

差分・エラーがなければ終了コード `0`、あれば `1`。CI に組み込める。

## 6. force（上書き）

- 自動生成ファイルには `AUTO-GENERATED FILE` ヘッダーが付く。
- ヘッダーの無い既存ファイルは既定では上書きしない（`Protected` として警告）。
- 上書きするには `--force` を付ける。

```bash
npm run code:generate -- screens/product-structure.yaml --force
```

## 7. エラー時の確認方法

エラーはコード・対象・原因・修正例を表示する。例:

```text
[TYPE_REFERENCE_ERROR]
Section: Action一覧・Store更新内容
Target: action:saveProduct.payloadType
Unknown type "SaveProductPayload" referenced in Action一覧.

Fix:
Add "SaveProductPayload" to "型定義" or fix the reference.
```

主なエラー分類は `docs/markdown-specification-format.md` と
`tools/generator/src/utils/errors.ts` を参照。

## 8. 日常の開発フロー

1. `specs/*.md` を編集する（画面仕様の変更）。
2. `npm run generate:dry-run -- specs/<name>.md` で差分を確認する。
3. 問題なければ `npm run generate:screen -- specs/<name>.md` で反映する。
4. 生成された `screen.yaml` とコードをコミットする。
5. CI で `npm run generate:check -- specs/<name>.md` を実行し、
   仕様書とコードの乖離を検出する。

生成コードは直接編集しない。変更は必ず Markdown 仕様書に対して行う。
