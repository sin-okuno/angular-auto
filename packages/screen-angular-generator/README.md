# screen-angular-generator

`screen.md` + `components.md` を起点に Angular 22 コードを生成するツールです。

## Phase 1–2（実装済み）

```bash
npm install
npm run spec:compile -- --spec ./specs/product-structure
```

生成物:

- `specs/product-structure/draft-screen.yaml`
- `specs/product-structure/resolved-screen.yaml`

個別コマンド:

```bash
npm run spec:parse -- --spec ./specs/product-structure
npm run spec:validate -- --spec ./specs/product-structure
npm run spec:resolve -- --spec ./specs/product-structure
```

## 処理フロー

```text
screen.md + components.md
  → draft-screen.yaml   (Phase 1 Parser)
  → resolved-screen.yaml (Phase 2 Validator/Resolver)
  → Angular 22 code      (Phase 3 Generator)
```

Phase 3（Angular Generator）は未実装です。
