# 製品構成管理画面 コンポーネント仕様書

本仕様書は、`screen.md`で定義された製品構成管理画面を、Angular NgModuleおよびNgRxで実装する際の以下を定義する。

* コンポーネント種別
* コンポーネント分割
* 各コンポーネントの責務
* InputおよびOutput
* Storeとの接続
* フォームの所有関係
* 未保存変更の制御
* コンポーネント間のイベント連携
* 出力ファイル構成
* テスト観点
* 参照整合性ルール

業務項目、API制約、型、操作、Action、Store項目、Validationは本仕様書では再定義せず、`screen.md`のIDを参照する。

---

## 1. 参照ルール

### 1.1 基本方針

参照対象の種類は、表の列名またはYAMLのプロパティ名で判別する。

```yaml
action: searchTree
operation: search
api: loadTree
permission: productView
storeField: treeNodes
validation: searchKeyword.maxLength
type: view.searchCondition
componentType: presentational
```

型以外のIDには、次のような接頭辞を付与しない。

* `action.`
* `operation.`
* `api.`
* `permission.`
* `store.`
* `component.`
* `validation.`

型IDについては、同名衝突を防ぐため、`screen.md`で定義された名前空間を使用する。

```text
api.productStructureRequest
view.searchCondition
payload.saveProduct
common.apiError
```

### 1.2 参照先

| 参照対象       | 参照元                  |
| ---------- | -------------------- |
| 操作         | `screen.md`の画面操作     |
| Action     | `screen.md`のAction一覧 |
| API        | `screen.md`のAPI一覧    |
| 権限         | `screen.md`の権限定義     |
| Store項目    | `screen.md`のStore構成  |
| 型          | `screen.md`の型定義      |
| Validation | `screen.md`の画面入力チェック |
| 表示ルール      | `screen.md`の表示ルール    |
| 未保存変更      | `screen.md`の未保存変更    |
| 同時更新       | `screen.md`の同時更新     |

---

## 2. コンポーネント種別

### 2.1 種別一覧

| 種別ID           | 種別名                      | 説明                                                 |
| -------------- | ------------------------ | -------------------------------------------------- |
| container      | Container Component      | Storeと接続し、Selectorの購読、Actionのdispatch、画面全体の制御を担当する |
| presentational | Presentational Component | InputとOutputを使用し、表示、入力、利用者操作を担当する                  |
| dialog         | Dialog Component         | 確認や選択をモーダル形式で表示し、利用者の判断結果をOutputで通知する              |

### 2.2 種別の利用ルール

コンポーネント一覧および各コンポーネントの基本定義に記載する「種別」は、必ず本章の種別IDを参照する。

次の値以外は使用しない。

```text
container
presentational
dialog
```

---

## 3. 実装原則

### 3.1 全種別共通の実装原則

| 原則ID                    | 適用種別                            | 内容                                        |
| ----------------------- | ------------------------------- | ----------------------------------------- |
| typedInputOutput        | container、presentational、dialog | 親子コンポーネント間は型付きInputとOutputで連携する           |
| noDirectHttp            | container、presentational、dialog | コンポーネントからHttpClientを直接使用しない               |
| noAny                   | container、presentational、dialog | Input、Output、フォーム、イベントで`any`を使用しない        |
| onPush                  | container、presentational、dialog | `ChangeDetectionStrategy.OnPush`を使用する     |
| ngModule                | container、presentational、dialog | Standalone Componentを使用せずNgModuleで宣言する    |
| referenceValidation     | container、presentational、dialog | 入力制約を直接重複定義せず、`screen.md`のValidationを参照する |
| noConstraintDuplication | container、presentational、dialog | 最大文字数、最小値、最大値などを複数箇所で独自定義しない              |
| noApiModelForForm       | presentational                  | APIリクエスト型をそのままフォームモデルとして使用しない             |
| noStoreKeystroke        | container、presentational        | フォーム入力のたびにStoreを更新しない                     |

### 3.2 containerの実装原則

| 原則ID               | 適用種別      | 内容                                    |
| ------------------ | --------- | ------------------------------------- |
| connectStore       | container | NgRx Storeへ接続できる                      |
| subscribeSelectors | container | SelectorまたはViewModel Selectorを購読する    |
| dispatchActions    | container | 子コンポーネントのOutputをActionへ変換してdispatchする |
| coordinateChildren | container | 複数の子コンポーネント間の状態とイベントを調整する             |
| controlPageState   | container | ローディング、エラー、権限、未保存変更などの画面全体状態を制御する     |
| noApiServiceCall   | container | API Serviceを直接呼び出さず、Effect経由でAPIを実行する |
| noApiMapping       | container | API DTOと画面型の変換を直接行わない                 |
| noOwnedDetailForm  | container | 詳細編集用FormGroupを所有しない                  |

### 3.3 presentationalの実装原則

| 原則ID              | 適用種別           | 内容                                      |
| ----------------- | -------------- | --------------------------------------- |
| noStoreConnection | presentational | NgRx Storeへ直接接続しない                      |
| noActionDispatch  | presentational | Actionを直接dispatchしない                    |
| noServiceCall     | presentational | API Serviceおよび業務Serviceを直接呼び出さない        |
| receiveByInput    | presentational | 表示に必要な値はInputから受け取る                     |
| notifyByOutput    | presentational | 利用者操作はOutputで親コンポーネントへ通知する              |
| localUiState      | presentational | 展開状態、フォーカス状態など一時的なUI状態をローカルで管理できる       |
| localFormState    | presentational | フォーム所有コンポーネントは編集中の値をReactive Formsで管理する |
| noFormStoreSync   | presentational | `valueChanges`ごとにStore更新イベントを送信しない      |

### 3.4 dialogの実装原則

| 原則ID                       | 適用種別   | 内容                               |
| -------------------------- | ------ | -------------------------------- |
| noStoreConnection          | dialog | NgRx Storeへ直接接続しない               |
| noActionDispatch           | dialog | Actionを直接dispatchしない             |
| noServiceCall              | dialog | API Serviceおよび業務Serviceを直接呼び出さない |
| receiveDialogState         | dialog | 表示状態、メッセージ、操作可否をInputから受け取る      |
| emitDecision               | dialog | 利用者の確認結果または取消結果をOutputで通知する      |
| noBusinessDecision         | dialog | 保留操作の実行内容や業務分岐をDialog内部で判断しない    |
| focusManagement            | dialog | 表示時のフォーカス移動と閉じた後のフォーカス復元を行う      |
| preventBackgroundOperation | dialog | 表示中は背面画面の操作を無効化する                |

---

## 4. コンポーネント一覧

| Component ID            | クラス名                             | Selector                      | 種別             | 親Component           | 主責務                               | Store接続 | フォーム所有 |
| ----------------------- | -------------------------------- | ----------------------------- | -------------- | -------------------- | --------------------------------- | ------- | ------ |
| productStructurePage    | ProductStructurePageComponent    | app-product-structure-page    | container      | -                    | 画面全体制御、Selector購読、Action dispatch | true    | false  |
| productSearch           | ProductSearchComponent           | app-product-search            | presentational | productStructurePage | 検索条件入力、検索・クリアイベント通知               | false   | true   |
| productTree             | ProductTreeComponent             | app-product-tree              | presentational | productStructurePage | 製品構成ツリー表示、選択、展開制御                 | false   | false  |
| productTreeNode         | ProductTreeNodeComponent         | app-product-tree-node         | presentational | productTree          | 再帰的な単一ノード表示                       | false   | false  |
| productDetailForm       | ProductDetailFormComponent       | app-product-detail-form       | presentational | productStructurePage | 製品詳細表示・編集、Save・Cancel通知           | false   | true   |
| concurrentUpdateMessage | ConcurrentUpdateMessageComponent | app-concurrent-update-message | presentational | productDetailForm    | 同時更新メッセージと再取得操作                   | false   | false  |
| unsavedChangesDialog    | UnsavedChangesDialogComponent    | app-unsaved-changes-dialog    | dialog         | productStructurePage | 未保存変更破棄の確認                        | false   | false  |

### 4.1 種別と設定の整合性

| 種別             | Store接続 | Action dispatch | Service呼び出し    | Input／Output | ローカルフォーム所有 |
| -------------- | ------- | --------------- | -------------- | ------------ | ---------- |
| container      | 許可      | 許可              | API Serviceは不可 | 許可           | 原則不可       |
| presentational | 不可      | 不可              | 不可             | 必須           | 必要な場合のみ許可  |
| dialog         | 不可      | 不可              | 不可             | 必須           | 原則不可       |

---

## 5. コンポーネント階層

```text
productStructurePage
├── productSearch
├── productTree
│   └── productTreeNode
│       └── productTreeNode
├── productDetailForm
│   └── concurrentUpdateMessage
└── unsavedChangesDialog
```

---

## 6. ProductStructurePageComponent

### 6.1 基本定義

| 項目               | 値                             |
| ---------------- | ----------------------------- |
| Component ID     | productStructurePage          |
| クラス名             | ProductStructurePageComponent |
| Selector         | app-product-structure-page    |
| 種別               | container                     |
| Route Component  | true                          |
| Store接続          | true                          |
| Change Detection | OnPush                        |
| フォーム所有           | false                         |
| 参照権限             | productView                   |

### 6.2 適用する種別原則

| 原則ID               |
| ------------------ |
| connectStore       |
| subscribeSelectors |
| dispatchActions    |
| coordinateChildren |
| controlPageState   |
| noApiServiceCall   |
| noApiMapping       |
| noOwnedDetailForm  |

### 6.3 責務

| 責務ID                   | 内容                             |
| ---------------------- | ------------------------------ |
| initialize             | 初期表示時に`enterPage`をdispatchする   |
| subscribeViewModel     | 画面表示用ViewModel Selectorを購読する   |
| receiveEvents          | 子コンポーネントのOutputを受け取る           |
| dispatchActions        | 子コンポーネントイベントを対応するActionへ変換する   |
| controlUnsavedChanges  | 詳細フォームのdirty状態を確認し、保留操作を制御する   |
| controlDialog          | 未保存変更確認Dialogの表示を制御する          |
| provideDeactivateState | CanDeactivateへ未保存状態を提供する       |
| controlPermission      | 権限に基づき子コンポーネントの読み取り専用状態を制御する   |
| controlLoading         | Storeの状態に基づき操作可否とローディング表示を制御する |
| controlErrors          | ツリー、詳細、保存のエラー表示を制御する           |

### 6.4 使用Selector

| Selector ID               | Storeまたはルール参照       |
| ------------------------- | ------------------- |
| productStructureViewModel | Storeおよび表示ルール全体     |
| searchCondition           | searchCondition     |
| treeNodes                 | treeNodes           |
| selectedComponentId       | selectedComponentId |
| selectedProductId         | selectedProductId   |
| productDetail             | detail              |
| treeLoading               | treeLoading         |
| detailLoading             | detailLoading       |
| saving                    | saving              |
| treeError                 | treeError           |
| detailError               | detailError         |
| saveError                 | saveError           |
| concurrentUpdate          | concurrentUpdate    |
| pendingOperation          | pendingOperation    |
| canUpdate                 | productUpdate       |
| isTreeEmpty               | treeEmpty           |
| isOperationDisabled       | saving              |

### 6.5 DispatchするAction

| 発生契機         | Action                |
| ------------ | --------------------- |
| ngOnInit     | enterPage             |
| 検索要求         | searchTree            |
| 検索条件クリア要求    | clearSearch           |
| ノード選択要求      | selectNode            |
| 保存要求         | saveProduct           |
| キャンセル要求      | cancelEdit            |
| 最新情報再取得要求    | reloadDetail          |
| 未保存変更ありの操作要求 | requestDiscardChanges |
| 変更破棄確認       | confirmDiscardChanges |
| 変更破棄取消       | cancelDiscardChanges  |

### 6.6 子コンポーネントへの値受け渡し

| 子Component           | Input               | 参照元                   |
| -------------------- | ------------------- | --------------------- |
| productSearch        | condition           | searchCondition       |
| productSearch        | disabled            | saving                |
| productTree          | nodes               | treeNodes             |
| productTree          | selectedComponentId | selectedComponentId   |
| productTree          | loading             | treeLoading           |
| productTree          | disabled            | saving                |
| productTree          | error               | treeError             |
| productDetailForm    | detail              | detail                |
| productDetailForm    | selectedComponentId | selectedComponentId   |
| productDetailForm    | readonly            | productUpdateを保有しない   |
| productDetailForm    | loading             | detailLoading         |
| productDetailForm    | saving              | saving                |
| productDetailForm    | saveError           | saveError             |
| productDetailForm    | concurrentUpdate    | concurrentUpdate      |
| unsavedChangesDialog | visible             | pendingOperationが存在する |
| unsavedChangesDialog | message             | 未保存変更メッセージ            |
| unsavedChangesDialog | disabled            | saving                |

### 6.7 禁止事項

| 禁止事項ID                 | 内容                           |
| ---------------------- | ---------------------------- |
| noHttp                 | HttpClientを使用しない             |
| noApiService           | API Serviceを直接呼び出さない         |
| noApiMapping           | API DTO変換を行わない               |
| noDetailForm           | 詳細用FormGroupを所有しない           |
| noInlineConstraint     | 最大文字数や最大値を直接記述しない            |
| noDirectDialogDecision | Dialogの確認結果を受け取る前に保留操作を実行しない |

---

## 7. ProductSearchComponent

### 7.1 基本定義

| 項目               | 値                      |
| ---------------- | ---------------------- |
| Component ID     | productSearch          |
| クラス名             | ProductSearchComponent |
| Selector         | app-product-search     |
| 種別               | presentational         |
| Store接続          | false                  |
| Change Detection | OnPush                 |
| フォーム所有           | true                   |
| フォームID           | productSearch          |
| フォーム型            | view.searchCondition   |

### 7.2 適用する種別原則

| 原則ID              |
| ----------------- |
| noStoreConnection |
| noActionDispatch  |
| noServiceCall     |
| receiveByInput    |
| notifyByOutput    |
| localFormState    |
| noFormStoreSync   |

### 7.3 Input

| Input ID  | Input名    | 型                    | 必須   |
| --------- | --------- | -------------------- | ---- |
| condition | condition | view.searchCondition | true |
| disabled  | disabled  | boolean              | true |

### 7.4 Output

| Output ID       | Output名         | Payload型             | 操作          | Action      |
| --------------- | --------------- | -------------------- | ----------- | ----------- |
| searchRequested | searchRequested | view.searchCondition | search      | searchTree  |
| clearRequested  | clearRequested  | -                    | clearSearch | clearSearch |

Action列は、親となる`productStructurePage`がOutput受信後にdispatchするActionを示す。

`productSearch`自身はActionをdispatchしない。

### 7.5 フォームコントロール

| Control ID | Control名   | フィールド      | APIパラメータ            | Validation              |
| ---------- | ---------- | ---------- | ------------------- | ----------------------- |
| keyword    | keyword    | keyword    | loadTree.keyword    | searchKeyword.maxLength |
| categoryId | categoryId | categoryId | loadTree.categoryId | searchCategoryId.format |

### 7.6 フォーム動作

| 動作ID             | 内容                                    |
| ---------------- | ------------------------------------- |
| initialize       | `condition`を受け取ったときにフォームへ反映する         |
| submit           | 入力値を`view.searchCondition`としてemitする   |
| normalize        | `normalizeKeyword`に従ってkeywordを正規化する   |
| emptyAsUndefined | 正規化後のkeywordが空文字の場合は未指定として扱う          |
| clear            | Clear押下時は`clearRequested`をemitする      |
| disable          | `disabled=true`の場合はSearchとClearを無効化する |
| noDirtyGuard     | 検索フォーム自体のdirty状態では破棄確認を行わない           |

### 7.7 禁止事項

| 禁止事項ID                  | 内容                                        |
| ----------------------- | ----------------------------------------- |
| noStore                 | Storeへ接続しない                               |
| noDispatch              | Actionを直接dispatchしない                      |
| noService               | Serviceを呼び出さない                            |
| noApiFormType           | `api.productStructureRequest`をフォーム型に使用しない |
| noValidationDuplication | 文字数やUUID形式を独自定義しない                        |
| noUnsavedDecision       | 詳細フォームの未保存変更有無を判断しない                      |

---

## 8. ProductTreeComponent

### 8.1 基本定義

| 項目               | 値                    |
| ---------------- | -------------------- |
| Component ID     | productTree          |
| クラス名             | ProductTreeComponent |
| Selector         | app-product-tree     |
| 種別               | presentational       |
| Store接続          | false                |
| Change Detection | OnPush               |
| フォーム所有           | false                |
| データ型             | view.treeNode        |

### 8.2 適用する種別原則

| 原則ID              |
| ----------------- |
| noStoreConnection |
| noActionDispatch  |
| noServiceCall     |
| receiveByInput    |
| notifyByOutput    |
| localUiState      |

### 8.3 Input

| Input ID            | Input名              | 型                      | 必須    |
| ------------------- | ------------------- | ---------------------- | ----- |
| nodes               | nodes               | view.treeNode[]        | true  |
| selectedComponentId | selectedComponentId | string | null          | false |
| loading             | loading             | boolean                | true  |
| disabled            | disabled            | boolean                | true  |
| error               | error               | common.apiError | null | false |

### 8.4 Output

| Output ID    | Output名      | Payload型           | 操作         | Action     |
| ------------ | ------------ | ------------------ | ---------- | ---------- |
| nodeSelected | nodeSelected | view.nodeSelection | selectNode | selectNode |
| nodeToggled  | nodeToggled  | string             | toggleNode | -          |

`nodeToggled`のPayloadには、展開または折りたたみ対象となる`componentId`を設定する。

Action列は親コンポーネントがdispatchするActionを示す。

`productTree`自身はActionをdispatchしない。

### 8.5 ローカル状態

| State ID        | 状態名             | 型             | 初期値  | 説明                    |
| --------------- | --------------- | ------------- | ---- | --------------------- |
| expandedNodeIds | expandedNodeIds | Set<string>   | 空Set | 展開中のcomponentId       |
| focusedNodeId   | focusedNodeId   | string | null | null | キーボード操作対象のcomponentId |

### 8.6 表示参照

| 用途      | 参照            |
| ------- | ------------- |
| ノード一意判定 | idField       |
| 詳細取得対象  | detailIdField |
| 製品名表示   | productName   |
| 製品コード表示 | productCode   |
| 選択表示    | selected      |
| 0件表示    | treeEmpty     |
| ローディング  | treeLoading   |
| エラー表示   | treeError     |

### 8.7 動作ルール

| 動作ID                | 内容                                         |
| ------------------- | ------------------------------------------ |
| select              | ノード選択時に`view.nodeSelection`を生成してemitする     |
| toggle              | 展開操作時に対象componentIdを`nodeToggled`としてemitする |
| updateExpandedState | `nodeToggled`を受けてexpandedNodeIdsを更新する      |
| identifyByComponent | 選択状態および展開状態はproductIdではなくcomponentIdで判定する  |
| disableOperation    | `disabled=true`の場合は選択と展開操作を無効化する           |
| recursiveRendering  | 子ノードは`productTreeNode`を使用して再帰的に表示する        |

### 8.8 禁止事項

| 禁止事項ID                 | 内容                               |
| ---------------------- | -------------------------------- |
| noStore                | Storeへ接続しない                      |
| noDispatch             | Actionを直接dispatchしない             |
| noService              | Serviceを呼び出さない                   |
| noProductIdSelection   | 選択状態の一意判定にproductIdを使用しない        |
| noExpandedStateInStore | expandedNodeIdsをNgRx Storeへ保存しない |
| noUnsavedDecision      | 未保存変更の有無を判断しない                   |

---

## 9. ProductTreeNodeComponent

### 9.1 基本定義

| 項目               | 値                        |
| ---------------- | ------------------------ |
| Component ID     | productTreeNode          |
| クラス名             | ProductTreeNodeComponent |
| Selector         | app-product-tree-node    |
| 種別               | presentational           |
| Store接続          | false                    |
| Change Detection | OnPush                   |
| フォーム所有           | false                    |
| 再帰表示             | true                     |

### 9.2 適用する種別原則

| 原則ID              |
| ----------------- |
| noStoreConnection |
| noActionDispatch  |
| noServiceCall     |
| receiveByInput    |
| notifyByOutput    |

### 9.3 Input

| Input ID            | Input名              | 型                   | 必須    |
| ------------------- | ------------------- | ------------------- | ----- |
| node                | node                | view.treeNode       | true  |
| selectedComponentId | selectedComponentId | string | null       | false |
| expandedNodeIds     | expandedNodeIds     | ReadonlySet<string> | true  |
| disabled            | disabled            | boolean             | true  |

### 9.4 Output

| Output ID    | Output名      | Payload型           | 操作         |
| ------------ | ------------ | ------------------ | ---------- |
| nodeSelected | nodeSelected | view.nodeSelection | selectNode |
| nodeToggled  | nodeToggled  | string             | toggleNode |

### 9.5 NodeSelection生成

| プロパティ       | 参照元              |
| ----------- | ---------------- |
| componentId | node.componentId |
| productId   | node.productId   |

### 9.6 表示ルール

| ルールID              | 内容                                                        |
| ------------------ | --------------------------------------------------------- |
| selected           | `node.componentId`と`selectedComponentId`が一致する場合に選択状態で表示する |
| expanded           | `expandedNodeIds`に`node.componentId`が含まれる場合に子ノードを表示する     |
| hasChildren        | `node.children.length > 0`の場合のみ展開操作を表示する                  |
| recursiveChildren  | 子ノードごとに`productTreeNode`を再帰的に表示する                         |
| propagateSelection | 子から受け取った`nodeSelected`を親へそのままemitする                       |
| propagateToggle    | 子から受け取った`nodeToggled`を親へそのままemitする                        |

### 9.7 禁止事項

| 禁止事項ID              | 内容                                 |
| ------------------- | ---------------------------------- |
| noStore             | Storeへ接続しない                        |
| noDispatch          | Actionを直接dispatchしない               |
| noService           | Serviceを呼び出さない                     |
| noExpandedMutation  | Inputで受け取ったexpandedNodeIdsを直接変更しない |
| noProductIdIdentity | ノードの一意識別にproductIdを使用しない           |

---

## 10. ProductDetailFormComponent

### 10.1 基本定義

| 項目               | 値                          |
| ---------------- | -------------------------- |
| Component ID     | productDetailForm          |
| クラス名             | ProductDetailFormComponent |
| Selector         | app-product-detail-form    |
| 種別               | presentational             |
| Store接続          | false                      |
| Change Detection | OnPush                     |
| フォーム所有           | true                       |
| フォームID           | productDetail              |
| フォーム型            | view.productDetail         |

### 10.2 適用する種別原則

| 原則ID              |
| ----------------- |
| noStoreConnection |
| noActionDispatch  |
| noServiceCall     |
| receiveByInput    |
| notifyByOutput    |
| localFormState    |
| noFormStoreSync   |

### 10.3 Input

| Input ID            | Input名              | 型                         | 必須    |
| ------------------- | ------------------- | ------------------------- | ----- |
| detail              | detail              | view.productDetail | null | false |
| selectedComponentId | selectedComponentId | string | null             | false |
| readonly            | readonly            | boolean                   | true  |
| loading             | loading             | boolean                   | true  |
| saving              | saving              | boolean                   | true  |
| saveError           | saveError           | common.apiError | null    | false |
| concurrentUpdate    | concurrentUpdate    | boolean                   | true  |

### 10.4 Output

| Output ID       | Output名         | Payload型             | 操作           | Action       |
| --------------- | --------------- | -------------------- | ------------ | ------------ |
| saveRequested   | saveRequested   | payload.saveProduct  | saveProduct  | saveProduct  |
| cancelRequested | cancelRequested | -                    | cancelEdit   | cancelEdit   |
| reloadRequested | reloadRequested | payload.reloadDetail | reloadDetail | reloadDetail |
| dirtyChanged    | dirtyChanged    | boolean              | -            | -            |

Action列は親コンポーネントがdispatchするActionを示す。

`productDetailForm`自身はActionをdispatchしない。

### 10.5 フォームコントロール

| Control ID  | Control名    | フィールド       | APIパラメータ                 | Validation                                       |
| ----------- | ----------- | ----------- | ------------------------ | ------------------------------------------------ |
| productName | productName | productName | updateDetail.productName | productName.required、productName.maxLength       |
| productCode | productCode | productCode | -                        | -                                                |
| price       | price       | price       | updateDetail.price       | price.required、price.min、price.max、price.integer |
| description | description | description | updateDetail.description | description.maxLength                            |
| revision    | revision    | revision    | updateDetail.revision    | -                                                |

`productId`と`selectedComponentId`はフォーム入力対象にしない。

Save Payload生成時にInputおよび確定済みdetailから設定する。

### 10.6 編集可否

| フィールド       | 制御                        |
| ----------- | ------------------------- |
| productName | `readonly=false`の場合のみ編集可能 |
| productCode | 常に読み取り専用                  |
| price       | `readonly=false`の場合のみ編集可能 |
| description | `readonly=false`の場合のみ編集可能 |
| revision    | 非表示または読み取り専用              |

### 10.7 フォーム動作

| 動作ID                       | 内容                                               |
| -------------------------- | ------------------------------------------------ |
| initialize                 | detail受信時にフォームへ値を設定する                            |
| resetOnDetailChange        | 選択製品が変更された場合は、新しいdetailでフォームをresetする             |
| save                       | 有効なフォーム値から`payload.saveProduct`を生成してemitする       |
| cancel                     | 確定済みdetailでフォームをresetする                          |
| notifyDirty                | dirty状態変更時に`dirtyChanged`をemitする                 |
| resetAfterSave             | 保存後のdetail受信時にresetしてdirtyを解除する                  |
| resetAfterReload           | 最新detail受信時にresetしてdirtyを解除する                    |
| disableSave                | invalid、readonly、saving、detail=nullの場合はSave不可とする |
| disableCancel              | readonly、saving、detail=nullの場合はCancel不可とする       |
| validateWithApiRules       | API入力制約と同じ制約でフォームを検証する                           |
| keepFormOnConcurrentUpdate | 同時更新発生時は編集中のフォーム値を保持する                           |
| displaySaveError           | saveErrorが存在する場合はフォーム領域にエラーを表示する                 |

### 10.8 Save Payload割り当て

| Payloadプロパティ | 参照元                 |
| ------------ | ------------------- |
| componentId  | selectedComponentId |
| productId    | detail.productId    |
| productName  | productName Control |
| price        | price Control       |
| description  | description Control |
| revision     | detail.revision     |

### 10.9 Save実行条件

次の条件をすべて満たす場合のみ`saveRequested`をemitする。

| 条件ID                 | 条件                           |
| -------------------- | ---------------------------- |
| hasDetail            | detailがnullではない              |
| hasSelectedComponent | selectedComponentIdがnullではない |
| editable             | readonly=false               |
| valid                | FormGroupがvalid              |
| notSaving            | saving=false                 |
| changed              | FormGroupがdirty              |

### 10.10 禁止事項

| 禁止事項ID                  | 内容                                         |
| ----------------------- | ------------------------------------------ |
| noStore                 | Storeへ接続しない                                |
| noDispatch              | Actionを直接dispatchしない                       |
| noService               | Serviceを呼び出さない                             |
| noApiFormModel          | `api.productUpdateRequest`をフォームモデルとして使用しない |
| noKeystrokeStoreUpdate  | valueChangesごとにStore更新イベントをemitしない         |
| noConstraintDuplication | 入力可能文字数や最大値を独自定義しない                        |
| noRevisionEdit          | revisionを利用者が編集できる状態にしない                   |
| noProductIdEdit         | productIdを利用者が編集できる状態にしない                  |

---

## 11. ConcurrentUpdateMessageComponent

### 11.1 基本定義

| 項目               | 値                                |
| ---------------- | -------------------------------- |
| Component ID     | concurrentUpdateMessage          |
| クラス名             | ConcurrentUpdateMessageComponent |
| Selector         | app-concurrent-update-message    |
| 種別               | presentational                   |
| Store接続          | false                            |
| Change Detection | OnPush                           |
| フォーム所有           | false                            |

### 11.2 適用する種別原則

| 原則ID              |
| ----------------- |
| noStoreConnection |
| noActionDispatch  |
| noServiceCall     |
| receiveByInput    |
| notifyByOutput    |

### 11.3 Input

| Input ID  | Input名    | 型または参照        | 必須    |
| --------- | --------- | ------------- | ----- |
| visible   | visible   | boolean       | true  |
| message   | message   | 同時更新メッセージ     | true  |
| loading   | loading   | boolean       | true  |
| productId | productId | string | null | false |

### 11.4 Output

| Output ID       | Output名         | Payload型             | 操作           | Action       |
| --------------- | --------------- | -------------------- | ------------ | ------------ |
| reloadRequested | reloadRequested | payload.reloadDetail | reloadDetail | reloadDetail |

### 11.5 動作ルール

| 動作ID          | 内容                                                    |
| ------------- | ----------------------------------------------------- |
| show          | `visible=true`の場合のみメッセージを表示する                         |
| reload        | productIdが存在し、loading=falseの場合にreloadRequestedをemitする |
| disableReload | productId=nullまたはloading=trueの場合は再取得操作を無効化する          |
| preserveForm  | 再取得操作を行うまでは詳細フォームの値を変更しない                             |

### 11.6 Reload Payload割り当て

| Payloadプロパティ | 参照元             |
| ------------ | --------------- |
| productId    | productId Input |

### 11.7 禁止事項

| 禁止事項ID            | 内容                       |
| ----------------- | ------------------------ |
| noStore           | Storeへ接続しない              |
| noDispatch        | Actionを直接dispatchしない     |
| noService         | Serviceを呼び出さない           |
| noAutomaticReload | visibleになった時点で自動的に再取得しない |
| noFormReset       | 詳細フォームを直接resetしない        |

---

## 12. UnsavedChangesDialogComponent

### 12.1 基本定義

| 項目               | 値                             |
| ---------------- | ----------------------------- |
| Component ID     | unsavedChangesDialog          |
| クラス名             | UnsavedChangesDialogComponent |
| Selector         | app-unsaved-changes-dialog    |
| 種別               | dialog                        |
| Store接続          | false                         |
| Change Detection | OnPush                        |
| フォーム所有           | false                         |

### 12.2 適用する種別原則

| 原則ID                       |
| -------------------------- |
| noStoreConnection          |
| noActionDispatch           |
| noServiceCall              |
| receiveDialogState         |
| emitDecision               |
| noBusinessDecision         |
| focusManagement            |
| preventBackgroundOperation |

### 12.3 Input

| Input ID | Input名   | 型または参照     | 必須   |
| -------- | -------- | ---------- | ---- |
| visible  | visible  | boolean    | true |
| message  | message  | 未保存変更メッセージ | true |
| disabled | disabled | boolean    | true |

### 12.4 Output

| Output ID | Output名   | 操作             | Action                |
| --------- | --------- | -------------- | --------------------- |
| confirmed | confirmed | confirmDiscard | confirmDiscardChanges |
| cancelled | cancelled | cancelDiscard  | cancelDiscardChanges  |

### 12.5 動作ルール

| 動作ID           | 内容                               |
| -------------- | -------------------------------- |
| show           | `visible=true`の場合にDialogを表示する    |
| confirm        | 確認ボタン押下時に`confirmed`をemitする      |
| cancel         | 取消ボタン押下時に`cancelled`をemitする      |
| escape         | Escapeキー押下時は取消として扱う              |
| backdrop       | 背景クリックを許可する場合は取消として扱う            |
| disableButtons | `disabled=true`の場合は確認と取消操作を無効化する |
| focusConfirm   | 表示時は確認または取消ボタンへフォーカスを移動する        |
| restoreFocus   | 閉じた後はDialog表示前の要素へフォーカスを戻す       |

### 12.6 禁止事項

| 禁止事項ID             | 内容                        |
| ------------------ | ------------------------- |
| noStore            | Storeへ接続しない               |
| noDispatch         | Actionを直接dispatchしない      |
| noService          | Serviceを呼び出さない            |
| noPendingExecution | pendingOperationの内容を実行しない |
| noFormReset        | 詳細フォームを直接resetしない         |
| noRouteControl     | Routerを直接操作しない            |

---

## 13. フォーム所有関係

| Form ID       | 所有Component       | 種別             | 型                    | Storeへの保存                 | dirty判定        |
| ------------- | ----------------- | -------------- | -------------------- | ------------------------- | -------------- |
| productSearch | productSearch     | presentational | view.searchCondition | 検索実行時のみsearchConditionへ保存 | 未保存変更判定には使用しない |
| productDetail | productDetailForm | presentational | view.productDetail   | 保存成功後にAPI結果をdetailへ保存     | form.dirty     |

### 13.1 フォーム所有ルール

| ルールID                | 内容                                  |
| -------------------- | ----------------------------------- |
| singleOwner          | 1つのFormGroupは1つのコンポーネントのみが所有する      |
| noParentMutation     | 親コンポーネントは子コンポーネントのFormGroupを直接変更しない |
| emitOperation        | 親コンポーネントは子のOutputを通じてフォーム操作を要求する    |
| confirmedDataInStore | StoreにはAPIで確定したデータのみ保持する            |
| editingDataLocal     | 利用者が編集中の値はフォーム所有コンポーネント内に保持する       |
| noKeystrokeDispatch  | 入力ごとにActionをdispatchしない             |

---

## 14. 操作とイベントの対応

| 操作             | 発生Component             | 種別             | Output          | Container処理                   |
| -------------- | ----------------------- | -------------- | --------------- | ----------------------------- |
| search         | productSearch           | presentational | searchRequested | dirty確認後にsearchTreeをdispatch  |
| clearSearch    | productSearch           | presentational | clearRequested  | dirty確認後にclearSearchをdispatch |
| selectNode     | productTree             | presentational | nodeSelected    | dirty確認後にselectNodeをdispatch  |
| toggleNode     | productTree             | presentational | nodeToggled     | expandedNodeIdsを更新            |
| saveProduct    | productDetailForm       | presentational | saveRequested   | saveProductをdispatch          |
| cancelEdit     | productDetailForm       | presentational | cancelRequested | dirty確認後にフォームをreset           |
| reloadDetail   | concurrentUpdateMessage | presentational | reloadRequested | reloadDetailをdispatch         |
| confirmDiscard | unsavedChangesDialog    | dialog         | confirmed       | 保留操作を実行                       |
| cancelDiscard  | unsavedChangesDialog    | dialog         | cancelled       | 保留操作を破棄                       |
| leavePage      | productStructurePage    | container      | -               | CanDeactivateでdirtyを確認        |

---

## 15. 未保存変更制御

### 15.1 dirty状態の管理

`productDetailForm`は、`dirtyChanged`を使用して現在のdirty状態を`productStructurePage`へ通知する。

dirty状態は一時的なフォーム状態であるため、NgRx Storeへ保存しない。

### 15.2 対象操作

| 操作          | dirty=false          | dirty=true                     |
| ----------- | -------------------- | ------------------------------ |
| selectNode  | selectNodeをdispatch  | requestDiscardChangesをdispatch |
| search      | searchTreeをdispatch  | requestDiscardChangesをdispatch |
| clearSearch | clearSearchをdispatch | requestDiscardChangesをdispatch |
| cancelEdit  | detailでフォームをreset    | requestDiscardChangesをdispatch |
| leavePage   | 遷移を許可                | CanDeactivateで確認               |

### 15.3 保留操作の実行

| 保留操作種別      | 確認後の処理                                  |
| ----------- | --------------------------------------- |
| selectNode  | フォームをdetailでresetし、selectNodeをdispatch  |
| search      | フォームをdetailでresetし、searchTreeをdispatch  |
| clearSearch | フォームをdetailでresetし、clearSearchをdispatch |
| cancelEdit  | フォームをdetailでresetし、cancelEditをdispatch  |
| leavePage   | フォームをdetailでresetし、画面遷移を継続              |

### 15.4 取消時の処理

利用者が変更破棄を取り消した場合は、次の処理を行う。

1. 保留操作を実行しない。
2. 詳細フォームの値を維持する。
3. dirty状態を維持する。
4. `cancelDiscardChanges`をdispatchする。
5. Dialogを閉じる。

---

## 16. ProductStructureViewModel

`productStructurePage`は、個別Selectorを多数購読する代わりに、次のViewModelを返すSelectorを使用できる。

| プロパティ               | 型                            | Storeまたはルール参照       |
| ------------------- | ---------------------------- | ------------------- |
| searchCondition     | view.searchCondition         | searchCondition     |
| treeNodes           | view.treeNode[]              | treeNodes           |
| selectedComponentId | string | null                | selectedComponentId |
| selectedProductId   | string | null                | selectedProductId   |
| detail              | view.productDetail | null    | detail              |
| treeLoading         | boolean                      | treeLoading         |
| detailLoading       | boolean                      | detailLoading       |
| saving              | boolean                      | saving              |
| treeError           | common.apiError | null       | treeError           |
| detailError         | common.apiError | null       | detailError         |
| saveError           | common.apiError | null       | saveError           |
| concurrentUpdate    | boolean                      | concurrentUpdate    |
| pendingOperation    | view.pendingOperation | null | pendingOperation    |
| canUpdate           | boolean                      | productUpdate       |
| treeEmpty           | boolean                      | treeEmpty           |
| operationDisabled   | boolean                      | saving              |

---

## 17. Angularモジュール構成

### 17.1 ProductStructureModule

| 項目             | 内容                            |
| -------------- | ----------------------------- |
| Module         | ProductStructureModule        |
| Routing Module | ProductStructureRoutingModule |
| Store登録        | StoreModule.forFeature        |
| Effects登録      | EffectsModule.forFeature      |
| Reactive Forms | ReactiveFormsModule           |
| Common Module  | CommonModule                  |

### 17.2 Declarations

| Component                        | 種別             |
| -------------------------------- | -------------- |
| ProductStructurePageComponent    | container      |
| ProductSearchComponent           | presentational |
| ProductTreeComponent             | presentational |
| ProductTreeNodeComponent         | presentational |
| ProductDetailFormComponent       | presentational |
| ConcurrentUpdateMessageComponent | presentational |
| UnsavedChangesDialogComponent    | dialog         |

### 17.3 Routing

| パス   | Component                     | Guard               |
| ---- | ----------------------------- | ------------------- |
| `''` | ProductStructurePageComponent | productView権限Guard  |
| 画面離脱 | ProductStructurePageComponent | CanDeactivate Guard |

---

## 18. 出力ファイル構成

```text
src/app/features/product-structure/
├── product-structure.module.ts
├── product-structure-routing.module.ts
│
├── pages/
│   └── product-structure-page/
│       ├── product-structure-page.component.ts
│       ├── product-structure-page.component.html
│       ├── product-structure-page.component.scss
│       └── product-structure-page.component.spec.ts
│
├── components/
│   ├── product-search/
│   │   ├── product-search.component.ts
│   │   ├── product-search.component.html
│   │   ├── product-search.component.scss
│   │   └── product-search.component.spec.ts
│   │
│   ├── product-tree/
│   │   ├── product-tree.component.ts
│   │   ├── product-tree.component.html
│   │   ├── product-tree.component.scss
│   │   └── product-tree.component.spec.ts
│   │
│   ├── product-tree-node/
│   │   ├── product-tree-node.component.ts
│   │   ├── product-tree-node.component.html
│   │   ├── product-tree-node.component.scss
│   │   └── product-tree-node.component.spec.ts
│   │
│   ├── product-detail-form/
│   │   ├── product-detail-form.component.ts
│   │   ├── product-detail-form.component.html
│   │   ├── product-detail-form.component.scss
│   │   └── product-detail-form.component.spec.ts
│   │
│   ├── concurrent-update-message/
│   │   ├── concurrent-update-message.component.ts
│   │   ├── concurrent-update-message.component.html
│   │   ├── concurrent-update-message.component.scss
│   │   └── concurrent-update-message.component.spec.ts
│   │
│   └── unsaved-changes-dialog/
│       ├── unsaved-changes-dialog.component.ts
│       ├── unsaved-changes-dialog.component.html
│       ├── unsaved-changes-dialog.component.scss
│       └── unsaved-changes-dialog.component.spec.ts
│
├── store/
│   ├── product-structure.actions.ts
│   ├── product-structure.reducer.ts
│   ├── product-structure.selectors.ts
│   ├── product-structure.effects.ts
│   ├── product-structure.state.ts
│   └── product-structure-store.module.ts
│
├── services/
│   ├── product-structure-api.service.ts
│   └── product-structure-api.service.spec.ts
│
├── models/
│   ├── product-structure-api.models.ts
│   ├── product-structure-view.models.ts
│   ├── product-structure-payload.models.ts
│   └── product-structure-view-model.ts
│
├── mappers/
│   ├── product-structure.mapper.ts
│   └── product-structure.mapper.spec.ts
│
├── validators/
│   ├── integer.validator.ts
│   └── uuid.validator.ts
│
└── guards/
    ├── product-structure-access.guard.ts
    ├── product-structure-deactivate.guard.ts
    └── product-structure-deactivate.guard.spec.ts
```

---

## 19. コンポーネントテスト観点

### 19.1 containerテスト

| テストID              | Component            | 内容                                             |
| ------------------ | -------------------- | ---------------------------------------------- |
| pageInit           | productStructurePage | 初期表示時にenterPageをdispatchする                     |
| selectorBinding    | productStructurePage | ViewModelを子コンポーネントのInputへ正しく渡す                 |
| searchDispatch     | productStructurePage | searchRequested受信時にsearchTreeをdispatchする       |
| selectDispatch     | productStructurePage | nodeSelected受信時にselectNodeをdispatchする          |
| saveDispatch       | productStructurePage | saveRequested受信時にsaveProductをdispatchする        |
| dirtyOperation     | productStructurePage | dirty時に操作を保留してrequestDiscardChangesをdispatchする |
| confirmPending     | productStructurePage | confirmed受信時に保留操作を実行する                         |
| cancelPending      | productStructurePage | cancelled受信時に保留操作を破棄する                         |
| permissionReadonly | productStructurePage | productUpdateがない場合にreadonly=trueを渡す            |
| savingDisabled     | productStructurePage | saving中に子コンポーネントの操作を無効化する                      |
| leaveGuard         | productStructurePage | dirty時の画面離脱を確認する                               |

### 19.2 presentationalテスト

| テストID                 | Component               | 内容                                   |
| --------------------- | ----------------------- | ------------------------------------ |
| searchOutput          | productSearch           | Search押下でview.searchConditionをemitする |
| searchNormalize       | productSearch           | keywordの前後空白を除去する                    |
| searchValidation      | productSearch           | keywordとcategoryIdをAPI制約に基づいて検証する    |
| clearOutput           | productSearch           | Clear押下でclearRequestedをemitする        |
| treeSelect            | productTree             | ノード選択時にview.nodeSelectionをemitする     |
| treeComponentIdentity | productTree             | 同一productIdでもcomponentIdで選択状態を区別する   |
| treeToggle            | productTree             | 展開状態をローカルで変更する                       |
| treeNodeRecursive     | productTreeNode         | childrenを再帰的に表示する                    |
| detailInput           | productDetailForm       | detailをフォームへ反映する                     |
| detailValidation      | productDetailForm       | API制約に基づいて各フォーム値を検証する                |
| detailSave            | productDetailForm       | payload.saveProductを正しく生成する          |
| detailCancel          | productDetailForm       | Cancel時に確定済みdetailでresetする           |
| detailDirty           | productDetailForm       | dirty状態変更時にdirtyChangedをemitする       |
| detailReadonly        | productDetailForm       | readonly時に編集フィールドを無効化する              |
| detailConcurrent      | productDetailForm       | 同時更新時に編集中の値を維持する                     |
| concurrentMessage     | concurrentUpdateMessage | 同時更新メッセージと再取得ボタンを表示する                |
| concurrentReload      | concurrentUpdateMessage | reloadRequestedへproductIdを設定する       |

### 19.3 dialogテスト

| テストID                  | Component            | 内容                          |
| ---------------------- | -------------------- | --------------------------- |
| unsavedVisible         | unsavedChangesDialog | visible=trueの場合にDialogを表示する |
| unsavedConfirm         | unsavedChangesDialog | 確認押下でconfirmedをemitする       |
| unsavedCancel          | unsavedChangesDialog | 取消押下でcancelledをemitする       |
| unsavedEscape          | unsavedChangesDialog | Escapeキーでcancelledをemitする   |
| unsavedDisabled        | unsavedChangesDialog | disabled=trueの場合に操作を無効化する   |
| unsavedFocus           | unsavedChangesDialog | 表示時と終了時にフォーカスを適切に制御する       |
| unsavedNoBusinessLogic | unsavedChangesDialog | 保留操作をDialog内部で実行しない         |

---

## 20. 参照整合性ルール

### 20.1 コンポーネント種別

| 検証ID                       | 検証内容                                  |
| -------------------------- | ------------------------------------- |
| componentTypeExists        | コンポーネントの種別が2章の種別一覧に存在する               |
| componentTypeRuleExists    | 各コンポーネントに対応する種別原則が定義されている             |
| containerStoreRule         | 種別containerかつStore接続=trueである          |
| presentationalStoreRule    | 種別presentationalの場合はStore接続=falseである  |
| dialogStoreRule            | 種別dialogの場合はStore接続=falseである          |
| presentationalDispatchRule | 種別presentationalはActionを直接dispatchしない |
| dialogDispatchRule         | 種別dialogはActionを直接dispatchしない         |
| dialogDecisionRule         | 種別dialogは業務上の保留操作を直接実行しない             |

### 20.2 親子関係

| 検証ID                | 検証内容                                        |
| ------------------- | ------------------------------------------- |
| parentExists        | 親Componentがコンポーネント一覧に存在する                   |
| noComponentCycle    | 親子Component関係に循環がない                         |
| rootContainer       | ルートComponentの種別がcontainerである                |
| childPresentational | container配下の画面部品がpresentationalまたはdialogである |
| recursiveComponent  | 再帰Componentが自身を子として参照できる                    |

### 20.3 Input・Output

| 検証ID                  | 検証内容                                                 |
| --------------------- | ---------------------------------------------------- |
| inputTypeExists       | Input型がscreen.mdの型定義またはTypeScript組み込み型に存在する          |
| outputTypeExists      | Output Payload型がscreen.mdの型定義またはTypeScript組み込み型に存在する |
| inputNameUnique       | 同一Component内でInput IDが重複していない                        |
| outputNameUnique      | 同一Component内でOutput IDが重複していない                       |
| outputOperationExists | Outputに設定された操作がscreen.mdの画面操作に存在する                   |
| outputActionExists    | Outputに設定されたActionがscreen.mdのAction一覧に存在する           |
| outputHandledByParent | 子ComponentのOutputが親Componentで処理される                   |

### 20.4 フォーム

| 検証ID                   | 検証内容                            |
| ---------------------- | ------------------------------- |
| formOwnerExists        | Form IDに対応する所有Componentが存在する    |
| singleFormOwner        | 1つのForm IDに所有Componentが1つだけ存在する |
| formFieldExists        | フォームフィールドがscreen.mdに存在する        |
| validationExists       | Validationがscreen.mdに存在する       |
| apiParameterExists     | APIパラメータがscreen.mdのAPI一覧に存在する   |
| constraintConsistency  | 画面ValidatorとAPIパラメータ制約が一致する     |
| noApiFormModel         | APIリクエスト型がフォーム型として使用されていない      |
| noKeystrokeStoreUpdate | valueChangesによるStore更新が定義されていない |

### 20.5 Store・Action

| 検証ID                    | 検証内容                                        |
| ----------------------- | ------------------------------------------- |
| storeFieldExists        | Selector参照元のStore項目がscreen.mdに存在する          |
| actionExists            | dispatch対象Actionがscreen.mdのAction一覧に存在する    |
| containerDispatchOnly   | Action dispatchがcontainerに限定されている           |
| selectorContainerOnly   | Store Selectorの購読がcontainerに限定されている         |
| presentationalIsolation | presentationalがStore、Effect、Serviceへ接続していない |
| dialogIsolation         | dialogがStore、Effect、Serviceへ接続していない         |

### 20.6 ID一意性

| 検証ID                                  | 検証内容                          |
| ------------------------------------- | ----------------------------- |
| componentIdUnique                     | Component IDが重複していない          |
| componentTypeIdUnique                 | 種別IDが重複していない                  |
| principleIdUniqueWithinSection        | 同一実装原則セクション内で原則IDが重複していない     |
| formIdUnique                          | Form IDが重複していない               |
| stateIdUniqueWithinComponent          | 同一Component内でState IDが重複していない |
| responsibilityIdUniqueWithinComponent | 同一Component内で責務IDが重複していない     |

---

## 21. 自動生成時の解決ルール

MarkdownからYAMLへ変換する際は、コンポーネントの種別に応じて適用原則を解決する。

例：

```yaml
componentTypes:
  - id: container
    rules:
      - connectStore
      - subscribeSelectors
      - dispatchActions
      - coordinateChildren
      - controlPageState
      - noApiServiceCall

  - id: presentational
    rules:
      - noStoreConnection
      - noActionDispatch
      - noServiceCall
      - receiveByInput
      - notifyByOutput

  - id: dialog
    rules:
      - noStoreConnection
      - noActionDispatch
      - noServiceCall
      - receiveDialogState
      - emitDecision
      - noBusinessDecision
```

コンポーネント側では種別IDのみを指定し、共通原則および種別原則をResolverで結合する。

```yaml
components:
  - id: productStructurePage
    type: container

  - id: productSearch
    type: presentational

  - id: unsavedChangesDialog
    type: dialog
```

Resolverは次の順序で実装ルールを解決する。

```text
全種別共通原則
+
指定された種別の実装原則
+
コンポーネント固有の責務・禁止事項
=
resolved component rules
```

これにより、コンポーネントごとに同じ原則を重複記載せず、種別に基づいた一貫したコード生成を行う。
