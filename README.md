# angular-auto

Markdown 形式の画面仕様書（`screen.md` + `components.md`）から、
中間 YAML を経て Angular + NgRx コードを決定的に生成する基盤です。

```text
screen.md + components.md
  → draft-screen.yaml
  → resolved-screen.yaml
  → Angular 22 (NgModule) コード
```

- 実装本体: `packages/screen-angular-generator`
- Markdown を直接テンプレートへ渡さない（必ず YAML 中間成果物を経由）

詳細手順は [`docs/angular-code-generation-guide.md`](docs/angular-code-generation-guide.md) を参照してください。

## クイックスタート

```bash
# 1. ジェネレータ依存インストール
cd packages/screen-angular-generator
npm install

# 2. 一括生成（parse → validate → resolve → Angular 生成）
npm run generate -- \
  --spec ./specs/product-structure \
  --target ./tests/output/angular-22-app \
  --force

# 3. 生成結果の検証
npm run generated:check -- \
  --target ./tests/output/angular-22-app \
  --feature product-structure
```

ルートからも実行できます。

```bash
npm run generate -- --spec ./packages/screen-angular-generator/specs/product-structure --target ./packages/screen-angular-generator/tests/output/angular-22-app --force
```

## ディレクトリ構成

```text
angular-auto/
├── packages/screen-angular-generator/   # Parser / Validator / Resolver / Generator
│   ├── specs/product-structure/         # 入力 Markdown（screen.md / components.md）
│   ├── templates/angular-22-ngrx/       # Handlebars テンプレート
│   └── tests/output/angular-22-app/     # Angular 22 生成先フィクスチャ
├── specs/product-structure/             # 仕様書の参照コピー
└── src/app/                             # ルート Angular アプリ（shell）
```

## コマンド一覧

| コマンド | 用途 |
| --- | --- |
| `npm run spec:parse` | Markdown → `draft-screen.yaml` |
| `npm run spec:validate` | draft 検証 |
| `npm run spec:resolve` | draft → `resolved-screen.yaml` |
| `npm run spec:compile` | parse → validate → resolve |
| `npm run generate:angular` | resolved → Angular コード |
| `npm run generate` | 全工程（compile + generate） |
| `npm run generated:check` | prettier / eslint / ng test / ng build |

## 中間成果物

- `draft-screen.yaml` — Parser 出力
- `resolved-screen.yaml` — Validator / Resolver 出力（Generator の唯一の入力）

旧来の `screens/*.yaml`（`tools/generator`）は廃止済みです。
