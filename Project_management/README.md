```
project/
├── index.html
├── styles.css
├── js/
│   ├── main.js              # 初期化、イベント設定
│   ├── data.js              # データ管理、状態
│   ├── utils.js             # 共通関数
│   ├── views/
│   │   ├── tableView.js     # テーブル機能
│   │   ├── graphView.js     # グラフ機能
│   │   ├── timelineView.js  # タイムライン機能
│   │   └── timeline/
│   │       ├── timelineCalculator.js  # タイムライン計算処理
│   │       └── timelineState.js       # タイムライン状態管理
│   └── features/
│       ├── modal.js         # モーダル管理
│       ├── import-export.js # データ処理
│       └── history.js       # 履歴管理
└── README.md
```