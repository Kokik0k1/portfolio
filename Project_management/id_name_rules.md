# プロジェクト管理システム ID命名規則

## 🎯 基本ルール

### 構造
```
[TYPE]_[CATEGORY]_[ACTION]
```

- **TYPE**: `M`(Milestone) または `T`(Task)
- **CATEGORY**: 領域・分野（3文字）
- **ACTION**: 動作・目的（3文字）

### 例
```
M_PRJ_STR  → Milestone_Project_Start
T_API_DEV  → Task_API_Development  
T_DB_MIG   → Task_Database_Migration
```

## 📋 カテゴリ辞書（CATEGORY）

### 🏗️ 開発系
| カテゴリ | 短縮 | 説明 |
|----------|------|------|
| Project | PRJ | プロジェクト全体 |
| API | API | API関連 |
| Database | DB_ | データベース |
| Frontend | FRT | フロントエンド |
| Backend | BCK | バックエンド |
| Mobile | MOB | モバイル |
| Web | WEB | ウェブ |
| Server | SVR | サーバー |
| Client | CLT | クライアント |
| Security | SEC | セキュリティ |
| Auth | AUT | 認証・認可 |
| Payment | PAY | 決済 |
| Report | RPT | レポート |
| Admin | ADM | 管理機能 |
| User | USR | ユーザー機能 |

### 🎨 設計・企画系
| カテゴリ | 短縮 | 説明 |
|----------|------|------|
| Design | DSN | UI/UXデザイン |
| Research | RSC | 調査・研究 |
| Planning | PLN | 企画・計画 |
| Architecture | ARC | アーキテクチャ |
| Prototype | PRT | プロトタイプ |
| Wireframe | WFM | ワイヤーフレーム |
| Mockup | MCK | モックアップ |

### 🔧 運用・品質系
| カテゴリ | 短縮 | 説明 |
|----------|------|------|
| Testing | TST | テスト |
| Deploy | DPL | デプロイ |
| Monitor | MON | 監視 |
| Backup | BCK | バックアップ |
| Maintenance | MNT | メンテナンス |
| Migration | MIG | 移行 |
| Integration | ITG | 統合 |
| Performance | PRF | パフォーマンス |
| Infrastructure | INF | インフラ |
| DevOps | DOP | DevOps |

### 📊 ビジネス系
| カテゴリ | 短縮 | 説明 |
|----------|------|------|
| Marketing | MKT | マーケティング |
| Sales | SLS | 営業 |
| Finance | FIN | 財務 |
| Legal | LGL | 法務 |
| HR | HR_ | 人事 |
| Training | TRN | 研修・教育 |
| Document | DOC | ドキュメント |
| Communication | COM | コミュニケーション |

## 🎬 アクション辞書（ACTION）

### 📝 作成・準備系
| アクション | 短縮 | 説明 |
|------------|------|------|
| Start | STR | 開始 |
| Create | CRT | 作成 |
| Setup | STP | セットアップ |
| Build | BLD | 構築 |
| Generate | GEN | 生成 |
| Initialize | INI | 初期化 |
| Prepare | PRP | 準備 |
| Design | DSN | 設計 |
| Plan | PLN | 計画 |
| Draft | DRF | 下書き |

### 🔧 開発・実装系
| アクション | 短縮 | 説明 |
|------------|------|------|
| Develop | DEV | 開発 |
| Implement | IMP | 実装 |
| Code | COD | コーディング |
| Integrate | ITG | 統合 |
| Configure | CFG | 設定 |
| Customize | CST | カスタマイズ |
| Optimize | OPT | 最適化 |
| Refactor | RFT | リファクタリング |
| Debug | DBG | デバッグ |
| Fix | FIX | 修正 |

### ✅ 検証・品質系
| アクション | 短縮 | 説明 |
|------------|------|------|
| Test | TST | テスト |
| Review | RVW | レビュー |
| Validate | VLD | 検証 |
| Verify | VRF | 確認 |
| Audit | AUD | 監査 |
| Check | CHK | チェック |
| Analyze | ANL | 分析 |
| Evaluate | EVL | 評価 |
| Monitor | MON | 監視 |
| Measure | MSR | 測定 |

### 🚀 リリース・運用系
| アクション | 短縮 | 説明 |
|------------|------|------|
| Deploy | DPL | デプロイ |
| Release | REL | リリース |
| Launch | LNC | ローンチ |
| Rollout | ROL | 展開 |
| Migration | MIG | 移行 |
| Update | UPD | 更新 |
| Upgrade | UPG | アップグレード |
| Backup | BCK | バックアップ |
| Archive | ARC | アーカイブ |
| Cleanup | CLN | クリーンアップ |

### 🏁 完了・終了系
| アクション | 短縮 | 説明 |
|------------|------|------|
| Complete | CMP | 完了 |
| Finish | FIN | 終了 |
| Close | CLS | クローズ |
| End | END | 終了 |
| Finalize | FNL | 最終化 |
| Deliver | DLV | 納品 |
| Submit | SBM | 提出 |
| Approve | APV | 承認 |

## 🎨 命名例とパターン

### 典型的なプロジェクトフロー
```bash
# プロジェクト開始
M_PRJ_STR    # プロジェクト開始マイルストーン

# 要件・設計フェーズ  
T_PRJ_PLN    # プロジェクト計画
T_USR_RSC    # ユーザー調査
T_ARC_DSN    # アーキテクチャ設計
T_UI_DSN     # UI設計
M_DSN_CMP    # 設計完了マイルストーン

# 開発フェーズ
T_BCK_DEV    # バックエンド開発
T_FRT_DEV    # フロントエンド開発  
T_API_IMP    # API実装
T_DB_STP     # データベースセットアップ

# テスト・品質フェーズ
T_TST_UNT    # 単体テスト (Unit Test)
T_TST_ITG    # 統合テスト
T_TST_E2E    # E2Eテスト
T_PRF_TST    # パフォーマンステスト
M_TST_CMP    # テスト完了マイルストーン

# デプロイ・リリースフェーズ
T_DPL_STG    # ステージング環境デプロイ
T_DPL_PRD    # 本番環境デプロイ
T_DOC_CRT    # ドキュメント作成
M_REL_PRD    # 本番リリースマイルストーン
```

### 機能別開発例
```bash
# ユーザー認証機能
T_AUT_DSN    # 認証設計
T_AUT_IMP    # 認証実装
T_AUT_TST    # 認証テスト

# 決済機能  
T_PAY_ITG    # 決済統合
T_PAY_TST    # 決済テスト
T_PAY_RVW    # 決済レビュー

# 管理画面
T_ADM_DEV    # 管理画面開発
T_ADM_TST    # 管理画面テスト
```

## 🚨 特殊ケース・例外ルール

### 長いカテゴリ名の扱い
```bash
# 3文字で表現困難な場合は略語を使用
Infrastructure → INF
Communication → COM  
Performance → PRF
Authentication → AUT
```

### 数字・バージョンの扱い
```bash
# バージョンが必要な場合は末尾に追加
T_API_DEV_V2   # API開発 バージョン2
T_DB_MIG_V3    # DB移行 バージョン3
```

### 緊急対応・ホットフィックス
```bash
T_BUG_FIX    # バグ修正
T_HOT_FIX    # ホットフィックス  
T_EMG_RSP    # 緊急対応 (Emergency Response)
```

## ✅ 命名チェックリスト

### 作成時の確認項目
- [ ] `[TYPE]_[CATEGORY]_[ACTION]` の形式に従っている
- [ ] 各部分が3文字以内（可能な限り）
- [ ] 他のIDと重複していない
- [ ] 略語が辞書に登録されている（新規の場合は追加）
- [ ] チームメンバーが理解できる略語を使用している

### 禁止事項
- [ ] 数字のみのID（`T_001_002`など）
- [ ] 意味不明な略語（`T_XYZ_ABC`など）
- [ ] 日本語ローマ字（`T_KAIGI_JYUNBI`など）
- [ ] 特殊文字の使用（アンダースコア以外）

## 🔄 辞書の拡張方法

### 新しい略語を追加する場合
1. **既存辞書をチェック**: 似た意味の略語がないか確認
2. **3文字ルール**: 可能な限り3文字以内
3. **英語ベース**: 英語の略語を使用
4. **チーム共有**: 新しい略語をチームに共有・承認
5. **辞書更新**: この辞書に追加

### 例：新機能「チャット機能」の場合
```bash
# 1. 辞書をチェック → COMMUNICATIONがあるがCHATはない
# 2. 新略語を提案 → CHT (Chat)
# 3. IDを作成
T_CHT_DEV    # チャット開発
T_CHT_TST    # チャットテスト  
M_CHT_REL    # チャットリリース
```

## 📚 よく使う組み合わせ

### スタートアップ・MVP開発
```bash
M_PRJ_STR, T_MVR_RSC, T_MVP_DSN, T_MVP_DEV, T_MVP_TST, M_MVP_REL
```

### Webアプリケーション
```bash  
T_WEB_DSN, T_FRT_DEV, T_BCK_DEV, T_API_IMP, T_DB_STP, T_TST_E2E
```

### モバイルアプリ
```bash
T_MOB_DSN, T_MOB_DEV, T_MOB_TST, T_APP_REV, T_STR_SBM, M_APP_REL
```
