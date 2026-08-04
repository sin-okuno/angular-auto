# Angular コード生成手順書

Markdown 画面仕様から Angular 22（NgModule + NgRx）コードを生成するまでの手順です。

実装本体は `packages/screen-angular-generator` です。

---

## 1. 全体の流れ

```text
screen.md
+
components.md
    ↓  parse
draft-screen.yaml
    ↓  validate / resolve
resolved-screen.yaml
    ↓  generate
Angular 22 コード
    ↓  prettier / eslint / ng test / ng build
検証完了
```

Markdown を直接 Angular テンプレートへ渡してはいけません。必ず YAML 中間成果物を経由します。

| 成果物 | 役割 |
| --- | --- |
| `screen.md` / `components.md` | 人手で書く入力仕様 |
| `draft-screen.yaml` | Parser の出力 |
| `resolved-screen.yaml` | Validator / Resolver の出力。**Generator の唯一の入力** |
| `src/app/features/<feature>/` | 生成された Angular コード |

---

## 2. 前提条件

### 2.1 ソフトウェア

| 項目 | 要件 |
| --- | --- |
| Node.js | ジェネレータ実行: `>=22.20.0 <23` |
| Node.js（`ng test` / `ng build`） | **`>=22.22.3`**（Angular CLI 22 の要件） |
| npm | Node に付属のもの |

> ホスト Node が 22.20.x の場合、`generate` までは動きますが、`generated:check` の `ng test` / `ng build` は失敗します。チェックまで通すなら Node を 22.22.3 以上へ更新してください。

### 2.2 作業ディレクトリ

以降のコマンドは次の場所で実行します。

```bash
cd packages/screen-angular-generator
```

---

## 3. 初回セットアップ

### 3.1 ジェネレータの依存インストール

```bash
cd packages/screen-angular-generator
npm install
```

### 3.2 生成先 Angular プロジェクトの準備

生成先は `--target` で指定します。標準の検証用フィクスチャは次です。

```text
tests/output/angular-22-app/
```

初回のみ、フィクスチャ側の依存も入れます。

```bash
cd tests/output/angular-22-app
npm install
cd ../..
```

フィクスチャの条件:

- Angular 22
- NgModule 構成
- `@ngrx/store` / `@ngrx/effects`
- `@angular/forms`
- Routing / SCSS

別の Angular 22 アプリへ出す場合は、同様の依存が入っていること、`package.json` と `angular.json` があることを確認してください。

---

## 4. 仕様書の配置

入力仕様は次の構成にします。

```text
specs/<feature-kebab>/
├── screen.md        # 画面仕様
└── components.md    # コンポーネント仕様
```

製品構成画面の例:

```text
specs/product-structure/
├── screen.md
└── components.md
```

新規画面を追加する場合:

1. `specs/<feature-kebab>/` を作成する
2. `screen.md` と `components.md` を置く
3. 後述の生成コマンドの `--spec` をそのディレクトリにする

---

## 5. Angular コードを生成する（推奨: 一括）

parse → validate → resolve → Angular 生成までを一度に実行します。

```bash
cd packages/screen-angular-generator

npm run generate -- \
  --spec ./specs/product-structure \
  --target ./tests/output/angular-22-app \
  --angular-version 22 \
  --force
```

### 5.1 主なオプション

| オプション | 意味 | 既定 |
| --- | --- | --- |
| `--spec` | Markdown のあるディレクトリ | （必須） |
| `--target` | 生成先 Angular プロジェクトルート | （必須） |
| `--angular-version` | 要求する Angular major | `22` |
| `--force` | 既存の自動生成ファイルを上書き | off |
| `--dry-run` | 書き込まず計画のみ表示 | off |
| `--clean` | Manifest に無い古い生成ファイルを削除 | off |
| `--allow-version-mismatch` | Angular 22 以外でも続行 | off |
| `--component-api` | `decorators` / `signals` | `decorators` |
| `--template-control-flow` | `builtIn` / `structuralDirectives` | `builtIn` |
| `--dependency-injection` | `inject` / `constructor` | `inject` |

### 5.2 成功時にできるもの

1. `specs/product-structure/draft-screen.yaml`
2. `specs/product-structure/resolved-screen.yaml`
3. `tests/output/angular-22-app/src/app/features/product-structure/` 配下の Angular コード
4. `.screen-generator-manifest.json`（再生成管理用）

ログ例:

```text
[PARSE] screen.md
[PARSE] components.md
[WRITE] .../draft-screen.yaml
[VALIDATE] schema: OK
...
[WRITE] .../resolved-screen.yaml
[TARGET] Angular 22.x
[PLAN] create: 55
[GENERATE] 55 files
[FORMAT] prettier: OK
[MANIFEST] written
[DONE]
```

### 5.3 ルートからの実行

リポジトリルートから実行する場合:

```bash
cd <repo-root>   # angular-auto

npm run generate -- \
  --spec ./packages/screen-angular-generator/specs/product-structure \
  --target ./packages/screen-angular-generator/tests/output/angular-22-app \
  --force
```

---

## 6. 工程を分割して実行する（任意）

問題切り分けやレビュー用に、段階実行もできます。

```bash
cd packages/screen-angular-generator

# ① Markdown → draft
npm run spec:parse -- --spec ./specs/product-structure

# ② draft 検証
npm run spec:validate -- --spec ./specs/product-structure

# ③ draft → resolved
npm run spec:resolve -- --spec ./specs/product-structure

# ①〜③ まとめて
npm run spec:compile -- --spec ./specs/product-structure

# ④ resolved のみから Angular 生成
npm run generate:angular -- \
  --spec ./specs/product-structure \
  --target ./tests/output/angular-22-app \
  --force
```

`generate:angular` は **`resolved-screen.yaml` が既にあること**が前提です。Markdown や draft は読みません。

---

## 7. 生成結果を検証する

```bash
cd packages/screen-angular-generator

npm run generated:check -- \
  --target ./tests/output/angular-22-app \
  --feature product-structure
```

実行内容:

1. `prettier --check`（feature 配下）
2. `eslint`（feature 配下）
3. `ng test --watch=false --browsers=ChromeHeadless`
4. `ng build`

すべて成功すれば、生成コードはフォーマット・静的解析・テスト・ビルドを通過した状態です。

---

## 8. 再生成の運用

| やりたいこと | コマンド |
| --- | --- |
| 上書きして再生成 | `npm run generate -- ... --force` |
| 書き込まず差分確認 | `npm run generate -- ... --dry-run` |
| Manifest 上の不要ファイル削除も行う | `npm run generate -- ... --force --clean` |

注意:

- `--force` なしで既存の自動生成ファイルがあると `[FILE_EXISTS]` で止まります
- Manifest に無い手動ファイルは、原則上書き・削除しません

---

## 9. 生成後に人手で行うこと

生成コードは **コンパイル可能な骨格** です。業務完成形ではありません。

最低限、次を確認・実装してください。

1. **Mapper** … `TODO(spec)` の変換ロジックを本実装する
2. **Reducer** … 仕様が曖昧で TODO になっている更新を確定する
3. **HTML** … 見た目・アクセシビリティ・画面固有 UI を整える
4. **ルーティング接続** … ホストアプリの `app-routing` から feature module を lazy load する
5. **API パス / 環境設定** … 実エンドポイントと認証ヘッダ等を合わせる
6. **権限・Guard** … 実 Permission サービスと接続する

---

## 10. トラブルシュート

| 症状 | 確認すること |
| --- | --- |
| `[VALIDATE] ...` で失敗 | `screen.md` / `components.md` の表・ID・参照を修正し、再度 `generate` |
| `[ANGULAR_VERSION_ERROR]` | target の `@angular/core` が 22 系か確認。別バージョンなら `--allow-version-mismatch` |
| `[DEPENDENCY_ERROR]` | target に `@ngrx/store` / `@ngrx/effects` / `@angular/forms` を入れる（手動 `npm install`。`--force` / `--legacy-peer-deps` は使わない） |
| `[FILE_EXISTS]` | `--force` を付けるか、衝突ファイルを確認 |
| `ng` が Node バージョン不足 | Node を **22.22.3 以上**へ更新 |
| `resolved-screen.yaml not found` | 先に `spec:compile` または `generate`（all）を実行 |

---

## 11. 最短手順（チェックリスト）

- [ ] Node.js を用意（check まで行うなら ≥22.22.3）
- [ ] `cd packages/screen-angular-generator && npm install`
- [ ] `cd tests/output/angular-22-app && npm install`（初回）
- [ ] `specs/<feature>/screen.md` と `components.md` を用意
- [ ] `npm run generate -- --spec ./specs/<feature> --target ./tests/output/angular-22-app --force`
- [ ] `draft-screen.yaml` / `resolved-screen.yaml` / `features/<feature>/` ができたことを確認
- [ ] `npm run generated:check -- --target ./tests/output/angular-22-app --feature <feature>`
- [ ] Mapper / UI / ルーティングなど人手補完

以上で、仕様書から Angular コード実装（生成 + 検証）までの一連の流れは完了です。
