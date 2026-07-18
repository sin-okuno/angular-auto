# angular-auto

Markdown 形式の画面仕様書を起点に、`screen.yaml` と Angular + NgRx コードを
**決定的に**生成するコード生成基盤と、その出力を組み込んだ Angular アプリケーション。

- Angular は **NgModule 構成**（Standalone Component は不使用）
- 状態管理は **NgRx Store / Effects**（`forFeature`）
- API 通信は **Service**、副作用は **Effects**、判定は **Selector** に集約
- 実行時に **AI による自由なコード生成は行わない**（テンプレート駆動で再現性あり）

## クイックスタート

```bash
# 1. 依存インストール
npm install
cd tools/generator && npm install && cd ../..

# 2. 差分確認（書き込まない）
npm run generate:dry-run -- specs/product-structure.md

# 3. 一括生成（変換→検証→生成→整形→書込→型チェック→build）
npm run generate:screen -- specs/product-structure.md

# 4. 個別検証
npm run screen:validate -- screens/product-structure.yaml

# 5. Angular build
npm run build

# 6. 整合性確認（CI 用: 差分/エラーで終了コード 1）
npm run generate:check -- specs/product-structure.md
```

## ディレクトリ構成

```text
angular-auto/
├── specs/                     # Markdown 画面仕様書（入力）
├── screens/                   # 生成された screen.yaml（Git 管理）
├── schemas/                   # screen.yaml の JSON Schema
├── templates/tree-detail/     # Handlebars テンプレート
├── tools/generator/           # 生成ツール（tsx で実行）
├── src/app/
│   ├── core/                  # PermissionService / ConfirmationService（既存規約）
│   └── features/
│       └── product-structure/ # 生成された Feature（Git 管理）
└── docs/                      # 手順書
```

生成 Feature の内部構成（`src/app/features/product-structure/`）:

```text
product-structure.module.ts
product-structure-routing.module.ts
pages/product-structure/        # ページ Component（OnPush + Reactive Forms）
store/                          # actions / reducer / selectors / effects / state
services/                       # HttpClient 通信のみ
mappers/                        # DTO ↔ View / Request 変換（pure function）
models/{api,store,actions}/     # 型を 3 系統に分離
guards/                         # 未保存変更 CanDeactivate ガード
```

> 本リポジトリのフォルダ構成は依頼書 (§17) の構成と一致している。差分はない。

## コマンド一覧

| コマンド | 用途 |
| --- | --- |
| `npm run spec:convert -- <md>` | Markdown → `screen.yaml` |
| `npm run screen:validate -- <yaml>` | Schema + 参照検証 |
| `npm run code:generate -- <yaml>` | `screen.yaml` → コード |
| `npm run generate:screen -- <md>` | 一括生成（`--test` で単体テストも） |
| `npm run generate:dry-run -- <md>` | 差分のみ表示（無書込） |
| `npm run generate:check -- <md>` | 整合性確認（差分で終了コード 1） |

## アーキテクチャ上の責務分離

- **Component**: Selector から ViewModel を取得。Reactive Forms で編集中の値を保持。
  入力のたびに Store を更新しない。Save 時にフォーム値から Payload を作成。
  Cancel 時は Store の確定値から復元。`form.dirty` で未保存判定。
  Service / HttpClient を直接呼ばない。展開状態はローカル UI 状態。
- **Effects**: Actions を受け、Service を呼び、DTO を View/Store 型へ変換し、
  Success/Failure を発行。`409 + CONCURRENT_UPDATE` を同時更新として扱う。
- **Service**: HttpClient 通信のみ。Store / Action / Router / Dialog を使わない。
- **Reducer**: 副作用なし・イミュータブル更新。Store 更新内容をそのまま反映。
- **Selector**: 0 件・エラー・権限・Save 可否・同時更新表示などの判定を集約。

詳細は `docs/` を参照。

## ドキュメント

- `docs/generator-guide.md` — セットアップ・コマンド・日常フロー
- `docs/markdown-specification-format.md` — Markdown 仕様書の書き方
- `docs/screen-yaml-format.md` — `screen.yaml` の全項目と参照関係
- `docs/template-development-guide.md` — テンプレート開発

## セキュリティ / 決定性

- 出力先はプロジェクトルート外へ出せない（パストラバーサル防止）。
- YAML は安全パーサで読み込み、任意コード実行を行わない。
- Markdown 中の HTML はコードとして実行しない。
- インターネット接続・API キー不要。Windows / Unix 双方で動作。
- 同じ入力から常に同じ出力（ヘッダーも定義から決定）。
- 自動生成ヘッダーの無い既存ファイルは既定で上書きしない（`--force` で許可）。
