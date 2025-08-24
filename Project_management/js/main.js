// main.js - アプリケーション初期化とイベント管理

// ビュー切り替え機能
function showView(viewName) {
    // 全てのビューとボタンを非アクティブに
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
    
    // 選択されたビューとボタンをアクティブに
    document.getElementById(viewName + '-view').classList.add('active');
    event.target.classList.add('active');
    
    // ビューに応じた描画処理
    if (viewName === 'graph') {
        setTimeout(() => {
            renderGraph();
        }, 50);
    } else if (viewName === 'timeline') {
        setTimeout(() => {
            renderTimeline();
        }, 50);
    }
}

// グラフビューのパン・ズーム制御
function setupGraphControls() {
    const graphContainer = document.getElementById('graph-container');
    const graphSvg = document.getElementById('graph-svg');
    
    if (!graphContainer || !graphSvg) return;

    // マウスホイールでズーム
    graphContainer.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        graphState.scale = Math.max(0.1, Math.min(3, graphState.scale * delta));
        updateGraphTransform();
    });
    
    // パン機能の設定
    let isPanning = false;
    let panStart = { x: 0, y: 0 };
    
    graphContainer.addEventListener('mousedown', (e) => {
        if (!e.target.closest('.node') && (e.target === graphSvg || e.target === graphContainer || e.target.tagName === 'g')) {
            isPanning = true;
            panStart = { x: e.clientX, y: e.clientY };
            graphContainer.style.cursor = 'grabbing';
        }
    });
    
    document.addEventListener('mousemove', (e) => {
        if (isPanning) {
            const dx = e.clientX - panStart.x;
            const dy = e.clientY - panStart.y;
            
            graphState.translateX += dx;
            graphState.translateY += dy;
            
            updateGraphTransform();
            
            panStart = { x: e.clientX, y: e.clientY };
        }
    });
    
    document.addEventListener('mouseup', () => {
        if (isPanning) {
            isPanning = false;
            graphContainer.style.cursor = 'grab';
        }
    });
}

// キーボードショートカットの設定
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl+Z でアンドゥ
        if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            undoNodePosition();
        }
        // Ctrl+Y または Ctrl+Shift+Z でリドゥ
        if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
            e.preventDefault();
            redoNodePosition();
        }
    });
}

// モーダル外クリックでの閉じる処理
function setupModalHandlers() {
    window.addEventListener('click', function(event) {
        // 各モーダルの外クリック処理
        const exportModal = document.getElementById('export-modal');
        const importModal = document.getElementById('import-modal');
        const editModal = document.getElementById('edit-modal');
        const addModal = document.getElementById('add-modal');
        const exportMenu = document.getElementById('export-menu');
        const resetMenu = document.getElementById('reset-menu');
        
        if (event.target === exportModal) closeExportModal();
        if (event.target === importModal) closeImportModal();
        if (event.target === editModal) closeEditModal();
        if (event.target === addModal) closeAddModal();
        
        // ドロップダウンメニューの外クリック
        if (!event.target.closest('.export-dropdown')) {
            exportMenu?.classList.remove('show');
            resetMenu?.classList.remove('show');
        }
    });
}

// アプリケーション初期化
function initializeApp() {
    console.log('🚀 アプリケーション初期化開始');
    
    // データとレイアウトの初期化
    initializeTimelineOrder();
    initializeNodePositions();
    
    // テーブルソート設定の復元
    const savedTableSort = localStorage.getItem('project_table_sort');
    if (savedTableSort && ['custom', 'date', 'type'].includes(savedTableSort)) {
        tableState.sortBy = savedTableSort;
        const selectElement = document.getElementById('table-sort-select');
        if (selectElement) {
            selectElement.value = savedTableSort;
        }
    }
    
    // 初期テーブル表示
    updateTable();
    
    // 各種イベントリスナーの設定
    setupKeyboardShortcuts();
    setupGraphControls();
    setupModalHandlers();
    
    console.log('✅ アプリケーション初期化完了');
}

// DOMロード完了時の処理
window.addEventListener('load', function() {
    initializeApp();
});

// エクスポートする関数（他のファイルから使用）
window.showView = showView;