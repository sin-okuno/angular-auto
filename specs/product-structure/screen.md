# 製品構成管理画面 画面仕様書

本仕様書は、製品構成ツリーの検索・表示、製品詳細の参照・更新に関する画面仕様、API、状態、型、Action、入力制約を定義する。

Angularのコンポーネント構成、Input、Output、フォーム所有関係は、別紙`components.md`で定義する。

---

## 1. ID命名規則

### 1.1 基本方針

IDは、所属するセクション内で一意とする。

参照先の種類は、列名またはプロパティ名で判断するため、次の接頭辞は付与しない。

* `action.`
* `operation.`
* `permission.`
* `mapper.`
* `store.`
* `component.`
* `validation.`

### 1.2 ID例

| 種類         | ID例                  |
| ---------- | -------------------- |
| API        | loadTree             |
| Action     | loadTree             |
| 操作         | search               |
| 権限         | productView          |
| Store項目    | treeNodes            |
| Mapper     | searchToApi          |
| Component  | productSearch        |
| Validation | productName.required |

APIとActionで同じIDを使用してもよい。

参照時は、次のように参照種類を示す列またはキーを使用する。

```yaml
api: loadTree
action: loadTree
operation: search
permission: productView
mapper: searchToApi
storeField: treeNodes
```

### 1.3 型ID

型は同名衝突を防止するため、以下の名前空間を使用する。

| 名前空間    | 用途              |
| ------- | --------------- |
| api     | APIリクエスト・レスポンス型 |
| view    | 画面・Store用型      |
| payload | Action Payload型 |
| common  | 共通型             |

例：

```text
api.productStructureRequest
api.productDetailResponse
view.productDetail
view.treeNode
payload.saveProduct
common.apiError
```

---

## 2. 画面概要

| 項目ID        | 項目     | 値                 |
| ----------- | ------ | ----------------- |
| id          | 画面ID   | product-structure |
| name        | 画面名    | 製品構成管理画面          |
| route       | ルート    | product-structure |
| pageType    | ページタイプ | tree-detail       |
| featureName | 機能名    | product-structure |

---

## 3. 権限定義

権限情報は既存の認証・認可Storeから取得する。

本画面専用の権限取得APIは定義しない。

| 権限ID          | 権限コード          | 用途                |
| ------------- | -------------- | ----------------- |
| productView   | PRODUCT_VIEW   | 画面表示、ツリー参照、製品詳細参照 |
| productUpdate | PRODUCT_UPDATE | 製品詳細の編集、保存、キャンセル  |

### 3.1 権限ルール

| ルールID          | 条件                  | 挙動               |
| -------------- | ------------------- | ---------------- |
| viewRequired   | productViewを保有しない   | 画面へのアクセスを拒否する    |
| updateRequired | productUpdateを保有しない | 詳細フォームを読み取り専用にする |
| saveHidden     | productUpdateを保有しない | Saveボタンを表示しない    |
| cancelHidden   | productUpdateを保有しない | Cancelボタンを表示しない  |

---

## 4. 画面操作

| 操作ID           | 操作名             | 説明                    | 必要権限          |
| -------------- | --------------- | --------------------- | ------------- |
| enterPage      | Enter Page      | 画面を初期表示する             | productView   |
| search         | Search          | 検索条件を指定して製品構成ツリーを取得する | productView   |
| clearSearch    | Clear Search    | 検索条件を初期値へ戻してツリーを再取得する | productView   |
| selectNode     | Select Node     | 製品構成ツリーのノードを選択する      | productView   |
| toggleNode     | Toggle Node     | ツリーノードを展開または折りたたむ     | productView   |
| saveProduct    | Save Product    | 編集した製品詳細を保存する         | productUpdate |
| cancelEdit     | Cancel Edit     | 編集内容を破棄して確定済みデータへ戻す   | productUpdate |
| reloadDetail   | Reload Detail   | 同時更新発生後に最新の製品詳細を取得する  | productView   |
| leavePage      | Leave Page      | 他画面へ遷移する              | productView   |
| confirmDiscard | Confirm Discard | 未保存の変更を破棄して保留操作を実行する  | productView   |
| cancelDiscard  | Cancel Discard  | 未保存変更の破棄を取り消す         | productView   |

---

## 5. 検索条件

### 5.1 検索条件概要

| 項目ID           | 項目        | 値                           |
| -------------- | --------- | --------------------------- |
| conditionType  | 画面用検索条件型  | view.searchCondition        |
| apiRequestType | APIリクエスト型 | api.productStructureRequest |
| storeField     | Store項目   | searchCondition             |
| form           | フォームID    | productSearch               |

### 5.2 検索フィールド

| フィールドID    | フィールド名     | ラベル    | 型             | 必須    | 初期値  | APIパラメータ            |
| ---------- | ---------- | ------ | ------------- | ----- | ---- | ------------------- |
| keyword    | keyword    | キーワード  | string        | false | 空文字  | loadTree.keyword    |
| categoryId | categoryId | カテゴリID | string | null | false | null | loadTree.categoryId |

### 5.3 検索ルール

| ルールID            | 内容                                  |
| ---------------- | ----------------------------------- |
| normalizeKeyword | 検索実行前にkeywordの前後空白を除去する             |
| emptyKeyword     | 前後空白除去後に空文字の場合は未指定として扱う             |
| clearCondition   | Clear実行時は検索条件を初期値へ戻す                |
| reloadAfterClear | Clear実行後は初期条件でツリーを再取得する             |
| confirmUnsaved   | 未保存変更がある場合はSearchおよびClearの前に破棄確認を行う |

---

## 6. 製品構成ツリー

### 6.1 ツリー概要

| 項目ID                   | 項目           | 値                   |
| ---------------------- | ------------ | ------------------- |
| nodeType               | 画面用ノード型      | view.treeNode       |
| apiNodeType            | APIノード型      | api.treeNode        |
| idField                | ツリーノード識別子    | componentId         |
| detailIdField          | 詳細取得識別子      | productId           |
| selectedComponentField | 選択ノードStore項目 | selectedComponentId |
| selectedProductField   | 選択製品Store項目  | selectedProductId   |

### 6.2 表示項目

| 表示項目ID      | フィールド       | 説明    |
| ----------- | ----------- | ----- |
| productName | productName | 製品名   |
| productCode | productCode | 製品コード |

### 6.3 ツリールール

| ルールID                   | 内容                                       |
| ----------------------- | ---------------------------------------- |
| parentChild             | 子ノードは親ノードのchildren配下に表示する                |
| selected                | selectedComponentIdと一致するノードを強調表示する       |
| uniqueComponent         | componentIdはツリー内で一意とする                   |
| duplicateProduct        | 同一productIdが複数のcomponentIdとして存在することを許可する |
| localExpandedState      | 展開・折りたたみ状態はComponentのローカル状態として管理する       |
| includeAncestors        | 検索結果に該当するノードと祖先ノードを表示する                  |
| reselectAfterSave       | 保存後のツリー再取得時は保存前のcomponentIdを再選択する        |
| confirmUnsavedSelection | 未保存変更がある状態で別ノードを選択する場合は破棄確認を行う           |

---

## 7. 製品詳細

### 7.1 詳細概要

| 項目ID                | 項目        | 値                         |
| ------------------- | --------- | ------------------------- |
| modelType           | 画面用モデル型   | view.productDetail        |
| apiResponseType     | APIレスポンス型 | api.productDetailResponse |
| formStateManagement | フォーム状態管理  | local                     |
| form                | フォームID    | productDetail             |

### 7.2 詳細フィールド

| フィールドID     | フィールド名      | ラベル   | 型             | 必須    | 編集可   | API更新対象 | APIパラメータ                 |
| ----------- | ----------- | ----- | ------------- | ----- | ----- | ------- | ------------------------ |
| productId   | productId   | 製品ID  | string        | true  | false | false   | updateDetail.productId   |
| productName | productName | 製品名   | string        | true  | true  | true    | updateDetail.productName |
| productCode | productCode | 製品コード | string        | true  | false | false   | -                        |
| price       | price       | 価格    | number        | true  | true  | true    | updateDetail.price       |
| description | description | 説明    | string | null | false | true  | true    | updateDetail.description |
| revision    | revision    | リビジョン | number        | true  | false | true    | updateDetail.revision    |

### 7.3 フォーム状態ルール

| ルールID             | 内容                                                           |
| ----------------- | ------------------------------------------------------------ |
| confirmedInStore  | APIから取得した確定済み製品詳細はNgRx Storeに保持する                            |
| editingInForm     | 利用者の編集中データはReactive Formsに保持する                               |
| noStoreKeystroke  | フォーム入力のたびにNgRx Storeを更新しない                                   |
| createSavePayload | Save時にフォーム値と確定済みproductId、revisionからpayload.saveProductを作成する |
| resetOnCancel     | Cancel時はStore上のdetailを使用してフォームをresetする                       |
| resetOnSuccess    | 保存成功時は保存後のdetailでフォームをresetしてdirtyを解除する                      |
| resetOnReload     | 最新情報取得成功時は取得したdetailでフォームをresetしてdirtyを解除する                  |

---

## 8. API一覧

### 8.1 API概要

| API ID       | API名    | メソッド | パス                        | リクエスト型                      | レスポンス型                    | 必要権限          | 説明                |
| ------------ | ------- | ---- | ------------------------- | --------------------------- | ------------------------- | ------------- | ----------------- |
| loadTree     | 構成ツリー取得 | GET  | /api/products/tree        | api.productStructureRequest | api.treeResponse          | productView   | 検索条件で製品構成ツリーを取得する |
| loadDetail   | 製品詳細取得  | GET  | /api/products/{productId} | api.productDetailRequest    | api.productDetailResponse | productView   | 指定した製品の詳細を取得する    |
| updateDetail | 製品詳細更新  | PUT  | /api/products/{productId} | api.productUpdateRequest    | api.productDetailResponse | productUpdate | 製品詳細を更新する         |

### 8.2 APIリクエストパラメータ

| パラメータID                  | API          | パラメータ名      | 送信先   | 型      | 必須    | null許可 | 最小  | 最大           | 入力可能値・形式                     | 未指定時                 |
| ------------------------ | ------------ | ----------- | ----- | ------ | ----- | ------ | --- | ------------ | ---------------------------- | -------------------- |
| loadTree.keyword         | loadTree     | keyword     | query | string | false | false  | 0文字 | 100文字        | Unicode文字列。改行、タブ、制御文字不可      | Query Parameterへ含めない |
| loadTree.categoryId      | loadTree     | categoryId  | query | string | false | true   | 1文字 | 36文字         | 有効なカテゴリID。UUID採用時はUUID形式     | Query Parameterへ含めない |
| loadDetail.productId     | loadDetail   | productId   | path  | string | true  | false  | 1文字 | 36文字         | 存在する参照可能な製品ID。UUID採用時はUUID形式 | 未指定不可                |
| updateDetail.productId   | updateDetail | productId   | path  | string | true  | false  | 1文字 | 36文字         | 存在する更新可能な製品ID。UUID採用時はUUID形式 | 未指定不可                |
| updateDetail.productName | updateDetail | productName | body  | string | true  | false  | 1文字 | 200文字        | 前後空白除去後に1文字以上。改行、タブ、制御文字不可   | 未指定不可                |
| updateDetail.price       | updateDetail | price       | body  | number | true  | false  | 0   | 999999999999 | 整数                           | 未指定不可                |
| updateDetail.description | updateDetail | description | body  | string | false | true   | 0文字 | 2000文字       | Unicode文字列。改行、タブを許可          | null                 |
| updateDetail.revision    | updateDetail | revision    | body  | number | true  | false  | 0   | 2147483647   | 整数                           | 未指定不可                |

### 8.3 APIリクエスト検証

| Validation ID                  | パラメータ                    | ルール                       | 値            | メッセージ                                 |
| ------------------------------ | ------------------------ | ------------------------- | ------------ | ------------------------------------- |
| keyword.maxLength              | loadTree.keyword         | maxLength                 | 100          | キーワードは100文字以内で入力してください                |
| keyword.trim                   | loadTree.keyword         | trim                      | true         | -                                     |
| keyword.emptyAsUndefined       | loadTree.keyword         | emptyAsUndefined          | true         | -                                     |
| keyword.noControlCharacter     | loadTree.keyword         | forbiddenControlCharacter | true         | キーワードに使用できない文字が含まれています                |
| categoryId.maxLength           | loadTree.categoryId      | maxLength                 | 36           | カテゴリIDは36文字以内で指定してください                |
| categoryId.format              | loadTree.categoryId      | identifierFormat          | uuid         | カテゴリIDの形式が正しくありません                    |
| categoryId.exists              | loadTree.categoryId      | exists                    | category     | 指定されたカテゴリが存在しません                      |
| categoryId.active              | loadTree.categoryId      | activeOnly                | true         | 指定されたカテゴリは利用できません                     |
| loadProductId.required         | loadDetail.productId     | required                  | true         | 製品IDは必須です                             |
| loadProductId.maxLength        | loadDetail.productId     | maxLength                 | 36           | 製品IDは36文字以内で指定してください                  |
| loadProductId.format           | loadDetail.productId     | identifierFormat          | uuid         | 製品IDの形式が正しくありません                      |
| loadProductId.exists           | loadDetail.productId     | exists                    | product      | 指定された製品が存在しません                        |
| loadProductId.accessible       | loadDetail.productId     | accessible                | true         | 指定された製品を参照する権限がありません                  |
| updateProductId.required       | updateDetail.productId   | required                  | true         | 製品IDは必須です                             |
| updateProductId.maxLength      | updateDetail.productId   | maxLength                 | 36           | 製品IDは36文字以内で指定してください                  |
| updateProductId.format         | updateDetail.productId   | identifierFormat          | uuid         | 製品IDの形式が正しくありません                      |
| updateProductId.exists         | updateDetail.productId   | exists                    | product      | 指定された製品が存在しません                        |
| updateProductId.updatable      | updateDetail.productId   | updatable                 | true         | 指定された製品を更新する権限がありません                  |
| productName.required           | updateDetail.productName | required                  | true         | 製品名は必須です                              |
| productName.trim               | updateDetail.productName | trim                      | true         | -                                     |
| productName.maxLength          | updateDetail.productName | maxLength                 | 200          | 製品名は200文字以内で入力してください                  |
| productName.noControlCharacter | updateDetail.productName | forbiddenControlCharacter | true         | 製品名に使用できない文字が含まれています                  |
| price.required                 | updateDetail.price       | required                  | true         | 価格は必須です                               |
| price.integer                  | updateDetail.price       | integer                   | true         | 価格は整数で入力してください                        |
| price.min                      | updateDetail.price       | min                       | 0            | 価格は0以上で入力してください                       |
| price.max                      | updateDetail.price       | max                       | 999999999999 | 価格は999,999,999,999以下で入力してください         |
| description.maxLength          | updateDetail.description | maxLength                 | 2000         | 説明は2000文字以内で入力してください                  |
| description.allowLineBreaks    | updateDetail.description | allowLineBreaks           | true         | -                                     |
| description.allowTabs          | updateDetail.description | allowTabs                 | true         | -                                     |
| revision.required              | updateDetail.revision    | required                  | true         | リビジョンは必須です                            |
| revision.integer               | updateDetail.revision    | integer                   | true         | リビジョンの形式が正しくありません                     |
| revision.min                   | updateDetail.revision    | min                       | 0            | リビジョンの形式が正しくありません                     |
| revision.max                   | updateDetail.revision    | max                       | 2147483647   | リビジョンの値が上限を超えています                     |
| revision.match                 | updateDetail.revision    | optimisticLock            | true         | 他の利用者によって製品情報が更新されています。最新情報を再取得してください |

### 8.4 API共通ルール

| ルールID                 | 内容                                                  |
| --------------------- | --------------------------------------------------- |
| pathProductId         | productIdはURLパスパラメータとして送信する                         |
| omitEmptyQuery        | Query Parameterがnullまたは空文字の場合は送信しない                 |
| noProductIdInBody     | api.productUpdateRequestにはproductIdを含めない            |
| noComponentId         | componentIdは画面制御用でありAPIへ送信しない                       |
| includeRevision       | 更新APIには取得時のrevisionを含める                             |
| concurrentUpdate      | HTTP 409かつerror.codeがCONCURRENT_UPDATEの場合は同時更新として扱う |
| useMapper             | API型と画面用型の変換はMapperで行う                              |
| rejectUnknownProperty | 定義されていないRequest Bodyプロパティは送信しない                     |
| clientValidation      | API送信前に画面側で入力値を検証する                                 |
| serverValidation      | サーバー側でも同じ制約を検証する                                    |
| serverAuthority       | クライアント側とサーバー側が異なる場合はサーバー側を正とする                      |

### 8.5 APIエラー

| 条件       | HTTPステータス | エラーコード                |
| -------- | --------: | --------------------- |
| リクエスト値不正 |       400 | VALIDATION_ERROR      |
| 権限不足     |       403 | FORBIDDEN             |
| カテゴリ未存在  |       400 | CATEGORY_NOT_FOUND    |
| 製品未存在    |       404 | PRODUCT_NOT_FOUND     |
| 同時更新     |       409 | CONCURRENT_UPDATE     |
| サーバーエラー  |       500 | INTERNAL_SERVER_ERROR |

---

## 9. Store構成

### 9.1 Store概要

| 項目ID       | 値                |
| ---------- | ---------------- |
| featureKey | productStructure |

### 9.2 Storeフィールド

| Store項目ID           | フィールド名              | 型                            | 初期値                                 | 説明          |
| ------------------- | ------------------- | ---------------------------- | ----------------------------------- | ----------- |
| searchCondition     | searchCondition     | view.searchCondition         | `{ keyword: '', categoryId: null }` | 現在の検索条件     |
| treeNodes           | treeNodes           | view.treeNode[]              | []                                  | 製品構成ツリー     |
| selectedComponentId | selectedComponentId | string | null                | null                                | 選択中の構成ノードID |
| selectedProductId   | selectedProductId   | string | null                | null                                | 選択中の製品ID    |
| detail              | detail              | view.productDetail | null    | null                                | 確定済み製品詳細    |
| treeLoading         | treeLoading         | boolean                      | false                               | ツリー取得中      |
| detailLoading       | detailLoading       | boolean                      | false                               | 詳細取得中       |
| saving              | saving              | boolean                      | false                               | 保存処理中       |
| treeError           | treeError           | common.apiError | null       | null                                | ツリー取得エラー    |
| detailError         | detailError         | common.apiError | null       | null                                | 詳細取得エラー     |
| saveError           | saveError           | common.apiError | null       | null                                | 保存エラー       |
| concurrentUpdate    | concurrentUpdate    | boolean                      | false                               | 同時更新状態      |
| pendingOperation    | pendingOperation    | view.pendingOperation | null | null                                | 保留操作        |
| reselectTarget      | reselectTarget      | view.nodeSelection | null    | null                                | 保存後の再選択対象   |

### 9.3 Storeで管理しない状態

| 状態ID            | 状態              | 管理先                  |
| --------------- | --------------- | -------------------- |
| expandedNodeIds | ツリー展開状態         | productTree          |
| searchForm      | 検索フォーム編集中値      | productSearch        |
| detailForm      | 詳細フォーム編集中値      | productDetailForm    |
| detailFormDirty | 詳細フォームdirty状態   | productDetailForm    |
| dialogVisible   | 未保存変更確認Dialog表示 | productStructurePage |

---

## 10. 型定義

### 10.1 API型

| 型ID                         | 型名                         | プロパティ             | 型              | 任意    |
| --------------------------- | -------------------------- | ----------------- | -------------- | ----- |
| api.productStructureRequest | ProductStructureApiRequest | keyword           | string         | true  |
| api.productStructureRequest | ProductStructureApiRequest | categoryId        | string         | true  |
| api.productDetailRequest    | ProductDetailApiRequest    | productId         | string         | false |
| api.productUpdateRequest    | ProductUpdateApiRequest    | productName       | string         | false |
| api.productUpdateRequest    | ProductUpdateApiRequest    | price             | number         | false |
| api.productUpdateRequest    | ProductUpdateApiRequest    | description       | string | null  | false |
| api.productUpdateRequest    | ProductUpdateApiRequest    | revision          | number         | false |
| api.treeResponse            | ProductTreeResponseDto     | nodes             | api.treeNode[] | false |
| api.treeNode                | ProductTreeNodeDto         | componentId       | string         | false |
| api.treeNode                | ProductTreeNodeDto         | productId         | string         | false |
| api.treeNode                | ProductTreeNodeDto         | productName       | string         | false |
| api.treeNode                | ProductTreeNodeDto         | productCode       | string         | false |
| api.treeNode                | ProductTreeNodeDto         | parentComponentId | string | null  | false |
| api.treeNode                | ProductTreeNodeDto         | children          | api.treeNode[] | false |
| api.productDetailResponse   | ProductDetailApiResponse   | productId         | string         | false |
| api.productDetailResponse   | ProductDetailApiResponse   | productName       | string         | false |
| api.productDetailResponse   | ProductDetailApiResponse   | productCode       | string         | false |
| api.productDetailResponse   | ProductDetailApiResponse   | price             | number         | false |
| api.productDetailResponse   | ProductDetailApiResponse   | description       | string | null  | false |
| api.productDetailResponse   | ProductDetailApiResponse   | revision          | number         | false |

### 10.2 画面・Store型

| 型ID                       | 型名                     | プロパティ             | 型                                                                          |
| ------------------------- | ---------------------- | ----------------- | -------------------------------------------------------------------------- |
| view.searchCondition      | ProductSearchCondition | keyword           | string                                                                     |
| view.searchCondition      | ProductSearchCondition | categoryId        | string | null                                                              |
| view.treeNode             | ProductTreeNode        | componentId       | string                                                                     |
| view.treeNode             | ProductTreeNode        | productId         | string                                                                     |
| view.treeNode             | ProductTreeNode        | productName       | string                                                                     |
| view.treeNode             | ProductTreeNode        | productCode       | string                                                                     |
| view.treeNode             | ProductTreeNode        | parentComponentId | string | null                                                              |
| view.treeNode             | ProductTreeNode        | children          | view.treeNode[]                                                            |
| view.productDetail        | ProductDetail          | productId         | string                                                                     |
| view.productDetail        | ProductDetail          | productName       | string                                                                     |
| view.productDetail        | ProductDetail          | productCode       | string                                                                     |
| view.productDetail        | ProductDetail          | price             | number                                                                     |
| view.productDetail        | ProductDetail          | description       | string | null                                                              |
| view.productDetail        | ProductDetail          | revision          | number                                                                     |
| view.nodeSelection        | NodeSelection          | componentId       | string                                                                     |
| view.nodeSelection        | NodeSelection          | productId         | string                                                                     |
| view.pendingOperation     | PendingOperation       | operationType     | view.pendingOperationType                                                  |
| view.pendingOperation     | PendingOperation       | selection         | view.nodeSelection | null                                                  |
| view.pendingOperation     | PendingOperation       | searchCondition   | view.searchCondition | null                                                |
| view.pendingOperationType | PendingOperationType   | value             | `'selectNode' \| 'search' \| 'clearSearch' \| 'cancelEdit' \| 'leavePage'` |

### 10.3 共通型

| 型ID               | 型名         | プロパティ       | 型                   |
| ----------------- | ---------- | ----------- | ------------------- |
| common.apiError   | ApiError   | code        | string              |
| common.apiError   | ApiError   | message     | string              |
| common.apiError   | ApiError   | status      | number | null       |
| common.apiError   | ApiError   | fieldErrors | common.fieldError[] |
| common.fieldError | FieldError | field       | string              |
| common.fieldError | FieldError | code        | string              |
| common.fieldError | FieldError | message     | string              |

### 10.4 Action Payload型

| 型ID                         | 型名                         | プロパティ       | 型                     |
| --------------------------- | -------------------------- | ----------- | --------------------- |
| payload.searchTree          | SearchTreePayload          | condition   | view.searchCondition  |
| payload.loadTree            | LoadTreePayload            | condition   | view.searchCondition  |
| payload.loadTreeSuccess     | LoadTreeSuccessPayload     | nodes       | view.treeNode[]       |
| payload.selectNode          | SelectNodePayload          | selection   | view.nodeSelection    |
| payload.loadDetail          | LoadDetailPayload          | productId   | string                |
| payload.loadDetailSuccess   | LoadDetailSuccessPayload   | detail      | view.productDetail    |
| payload.saveProduct         | SaveProductPayload         | componentId | string                |
| payload.saveProduct         | SaveProductPayload         | productId   | string                |
| payload.saveProduct         | SaveProductPayload         | productName | string                |
| payload.saveProduct         | SaveProductPayload         | price       | number                |
| payload.saveProduct         | SaveProductPayload         | description | string | null         |
| payload.saveProduct         | SaveProductPayload         | revision    | number                |
| payload.saveProductSuccess  | SaveProductSuccessPayload  | componentId | string                |
| payload.saveProductSuccess  | SaveProductSuccessPayload  | detail      | view.productDetail    |
| payload.reloadTreeAfterSave | ReloadTreeAfterSavePayload | condition   | view.searchCondition  |
| payload.reloadTreeAfterSave | ReloadTreeAfterSavePayload | selection   | view.nodeSelection    |
| payload.reloadDetail        | ReloadDetailPayload        | productId   | string                |
| payload.setPendingOperation | SetPendingOperationPayload | pending     | view.pendingOperation |
| payload.apiError            | ApiErrorPayload            | error       | common.apiError       |

---

## 11. Action一覧

| Action ID                  | Action名                        | Payload型                    | API          | 成功Action                   | 失敗Action           | 関連操作                                               |
| -------------------------- | ------------------------------ | --------------------------- | ------------ | -------------------------- | ------------------ | -------------------------------------------------- |
| enterPage                  | Enter Page                     | -                           | -            | loadTree                   | -                  | enterPage                                          |
| searchTree                 | Search Tree                    | payload.searchTree          | -            | loadTree                   | -                  | search                                             |
| clearSearch                | Clear Search                   | -                           | -            | loadTree                   | -                  | clearSearch                                        |
| loadTree                   | Load Tree                      | payload.loadTree            | loadTree     | loadTreeSuccess            | loadTreeFailure    | enterPage、search、clearSearch                       |
| loadTreeSuccess            | Load Tree Success              | payload.loadTreeSuccess     | -            | -                          | -                  | -                                                  |
| loadTreeFailure            | Load Tree Failure              | payload.apiError            | -            | -                          | -                  | -                                                  |
| selectNode                 | Select Node                    | payload.selectNode          | -            | loadDetail                 | -                  | selectNode                                         |
| loadDetail                 | Load Detail                    | payload.loadDetail          | loadDetail   | loadDetailSuccess          | loadDetailFailure  | selectNode                                         |
| loadDetailSuccess          | Load Detail Success            | payload.loadDetailSuccess   | -            | -                          | -                  | -                                                  |
| loadDetailFailure          | Load Detail Failure            | payload.apiError            | -            | -                          | -                  | -                                                  |
| saveProduct                | Save Product                   | payload.saveProduct         | updateDetail | saveProductSuccess         | saveProductFailure | saveProduct                                        |
| saveProductSuccess         | Save Product Success           | payload.saveProductSuccess  | -            | reloadTreeAfterSave        | -                  | -                                                  |
| saveProductFailure         | Save Product Failure           | payload.apiError            | -            | -                          | -                  | -                                                  |
| concurrentUpdateDetected   | Concurrent Update Detected     | payload.apiError            | -            | -                          | -                  | saveProduct                                        |
| reloadTreeAfterSave        | Reload Tree After Save         | payload.reloadTreeAfterSave | loadTree     | reloadTreeAfterSaveSuccess | loadTreeFailure    | -                                                  |
| reloadTreeAfterSaveSuccess | Reload Tree After Save Success | payload.loadTreeSuccess     | -            | selectNode                 | -                  | -                                                  |
| reloadDetail               | Reload Detail                  | payload.reloadDetail        | loadDetail   | reloadDetailSuccess        | loadDetailFailure  | reloadDetail                                       |
| reloadDetailSuccess        | Reload Detail Success          | payload.loadDetailSuccess   | -            | -                          | -                  | -                                                  |
| cancelEdit                 | Cancel Edit                    | -                           | -            | -                          | -                  | cancelEdit                                         |
| requestDiscardChanges      | Request Discard Changes        | payload.setPendingOperation | -            | -                          | -                  | selectNode、search、clearSearch、cancelEdit、leavePage |
| confirmDiscardChanges      | Confirm Discard Changes        | -                           | -            | -                          | -                  | confirmDiscard                                     |
| cancelDiscardChanges       | Cancel Discard Changes         | -                           | -            | -                          | -                  | cancelDiscard                                      |
| clearPendingOperation      | Clear Pending Operation        | -                           | -            | -                          | -                  | -                                                  |

### 11.1 Store更新

| Action ID                  | Store更新内容                                                              |
| -------------------------- | ---------------------------------------------------------------------- |
| enterPage                  | treeError=null; detailError=null; saveError=null                       |
| searchTree                 | searchCondition=action.condition                                       |
| clearSearch                | 検索条件、選択、詳細を初期化                                                         |
| loadTree                   | treeLoading=true; treeError=null                                       |
| loadTreeSuccess            | treeNodes=action.nodes; treeLoading=false                              |
| loadTreeFailure            | treeError=action.error; treeLoading=false                              |
| selectNode                 | selectedComponentIdとselectedProductIdを更新                               |
| loadDetail                 | detailLoading=true; detailError=null                                   |
| loadDetailSuccess          | detail=action.detail; detailLoading=false; concurrentUpdate=false      |
| loadDetailFailure          | detailError=action.error; detailLoading=false                          |
| saveProduct                | saving=true; saveError=null; concurrentUpdate=false; reselectTargetを設定 |
| saveProductSuccess         | detail=action.detail; saving=false; concurrentUpdate=false             |
| saveProductFailure         | saveError=action.error; saving=false                                   |
| concurrentUpdateDetected   | concurrentUpdate=true; saving=false; saveError=action.error            |
| reloadTreeAfterSave        | treeLoading=true; treeError=null                                       |
| reloadTreeAfterSaveSuccess | treeNodes=action.nodes; treeLoading=false                              |
| reloadDetail               | detailLoading=true; detailError=null                                   |
| reloadDetailSuccess        | detail更新、同時更新状態と保存エラーを解除                                               |
| cancelEdit                 | saveError=null; concurrentUpdate=false                                 |
| requestDiscardChanges      | pendingOperation=action.pending                                        |
| confirmDiscardChanges      | pendingOperation=null                                                  |
| cancelDiscardChanges       | pendingOperation=null                                                  |
| clearPendingOperation      | pendingOperation=null                                                  |

### 11.2 Effect分岐ルール

| ルールID            | 対象Action    | 条件                                                  | Dispatch先                |
| ---------------- | ----------- | --------------------------------------------------- | ------------------------ |
| saveConcurrent   | saveProduct | HTTP 409かつerror.code=CONCURRENT_UPDATE              | concurrentUpdateDetected |
| saveFailure      | saveProduct | 上記以外のエラー                                            | saveProductFailure       |
| mapSearchRequest | loadTree    | view.searchConditionをapi.productStructureRequestへ変換 | loadTree API             |
| mapUpdateRequest | saveProduct | payload.saveProductをapi.productUpdateRequestへ変換     | updateDetail API         |
| mapDetailRequest | loadDetail  | productIdをapi.productDetailRequestへ変換               | loadDetail API           |

---

## 12. 未保存変更

| 項目ID        | 値                              |
| ----------- | ------------------------------ |
| enabled     | true                           |
| dirtySource | productDetail.dirty            |
| message     | 編集内容が保存されていません。変更を破棄してよろしいですか？ |

### 12.1 対象操作

| 対象ID        | 操作          | 保留操作種別      |
| ----------- | ----------- | ----------- |
| selectNode  | selectNode  | selectNode  |
| search      | search      | search      |
| clearSearch | clearSearch | clearSearch |
| cancelEdit  | cancelEdit  | cancelEdit  |
| leavePage   | leavePage   | leavePage   |

---

## 13. 同時更新

| 項目ID          | 値                                      |
| ------------- | -------------------------------------- |
| enabled       | true                                   |
| revisionField | revision                               |
| statusCode    | 409                                    |
| errorCode     | CONCURRENT_UPDATE                      |
| message       | 他の利用者によって製品情報が更新されています。最新情報を再取得してください。 |

### 13.1 同時更新ルール

| ルールID                 | 内容                         |
| --------------------- | -------------------------- |
| keepForm              | 同時更新発生時は編集中のフォーム値を保持する     |
| showReload            | 同時更新発生時は最新情報再取得ボタンを表示する    |
| userTriggeredReload   | 利用者が再取得を選択した場合のみ最新詳細を取得する  |
| resetAfterReload      | 最新詳細取得成功後はフォームを取得値でresetする |
| clearDirtyAfterReload | 最新詳細取得成功後はフォームのdirtyを解除する  |

---

## 14. 表示ルール

| ルールID         | 条件                              | 挙動                    |
| ------------- | ------------------------------- | --------------------- |
| treeEmpty     | treeLoading=falseかつtreeNodesが0件 | 0件メッセージを表示する          |
| treeLoading   | treeLoading=true                | ツリー領域にローディングを表示する     |
| detailLoading | detailLoading=true              | 詳細領域にローディングを表示する      |
| saving        | saving=true                     | 保存中表示にして再操作を禁止する      |
| treeError     | treeErrorが存在する                  | ツリー領域にエラーを表示する        |
| detailError   | detailErrorが存在する                | 詳細領域にエラーを表示する         |
| saveError     | saveErrorが存在する                  | 詳細フォームに保存エラーを表示する     |
| readonly      | productUpdateを保有しない             | 詳細フォームを読み取り専用にする      |
| concurrent    | concurrentUpdate=true           | 同時更新メッセージと再取得ボタンを表示する |
| noSelection   | selectedProductId=null          | 詳細未選択メッセージを表示する       |

---

## 15. 画面入力チェック

画面入力チェックはAPIリクエスト検証を参照する。

| Validation ID           | フィールド       | API Validation        | Angular Validator            |
| ----------------------- | ----------- | --------------------- | ---------------------------- |
| searchKeyword.maxLength | keyword     | keyword.maxLength     | Validators.maxLength(100)    |
| searchCategoryId.format | categoryId  | categoryId.format     | uuidValidator                |
| productName.required    | productName | productName.required  | Validators.required          |
| productName.maxLength   | productName | productName.maxLength | Validators.maxLength(200)    |
| price.required          | price       | price.required        | Validators.required          |
| price.min               | price       | price.min             | Validators.min(0)            |
| price.max               | price       | price.max             | Validators.max(999999999999) |
| price.integer           | price       | price.integer         | integerValidator             |
| description.maxLength   | description | description.maxLength | Validators.maxLength(2000)   |

---

## 16. Mapper定義

| Mapper ID        | 入力型                       | 出力型                         | 用途              |
| ---------------- | ------------------------- | --------------------------- | --------------- |
| searchToApi      | view.searchCondition      | api.productStructureRequest | ツリー取得APIリクエスト生成 |
| treeDtoToView    | api.treeNode              | view.treeNode               | ツリーノードの画面用変換    |
| detailApiToView  | api.productDetailResponse | view.productDetail          | 詳細レスポンスの画面用変換   |
| savePayloadToApi | payload.saveProduct       | api.productUpdateRequest    | 更新APIリクエスト生成    |

---

## 17. 主なテスト観点

| テストID               | 対象                | 内容                                |
| ------------------- | ----------------- | --------------------------------- |
| enterPage           | effects           | enterPageで現在の検索条件を使用してツリーを取得する    |
| search              | effects           | 検索条件をStoreへ保存してツリーを取得する           |
| searchBoundary      | component/service | keywordの0、100、101文字を検証する          |
| categoryIdFormat    | component/service | categoryIdのUUID形式を検証する            |
| clearSearch         | reducer/effects   | 条件と選択を初期化してツリーを再取得する              |
| selectNode          | effects           | 指定productIdの詳細を取得する               |
| productIdFormat     | service           | productIdの形式不正を検証する               |
| save                | effects           | saveProductで更新APIを呼び出す            |
| productNameBoundary | component/service | productNameの0、1、200、201文字を検証する    |
| priceBoundary       | component/service | priceの負数、0、最大値、最大値超過、小数を検証する      |
| descriptionBoundary | component/service | descriptionの2000、2001文字を検証する      |
| revisionBoundary    | effects/service   | revisionの負数、小数、上限超過を検証する          |
| saveReloadTree      | effects           | 保存成功後に現在の条件でツリーを再取得する             |
| saveReselect        | effects/reducer   | 再取得後に保存前のcomponentIdを再選択する        |
| concurrent          | effects/reducer   | 409かつCONCURRENT_UPDATEで同時更新状態にする  |
| readonly            | selectors         | productUpdateがない場合に編集不可と判定する      |
| unsavedSelect       | component         | dirty状態でノード選択時に確認を表示する            |
| unsavedSearch       | component         | dirty状態で検索時に確認を表示する               |
| unsavedLeave        | guard             | dirty状態で画面離脱時に確認する                |
| cancel              | component         | Cancel時にStore.detailからフォームを復元する   |
| reloadDetail        | component/effects | 最新情報取得成功時にフォームをresetする            |
| duplicateProduct    | reducer/selectors | 同一productIdでも異なるcomponentIdを選択できる |
