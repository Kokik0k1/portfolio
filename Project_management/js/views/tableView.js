// tableView.js - テーブル表示機能

/**
 * テーブル表示の更新（ソート対応版）
 */
function updateTable() {
    const tbody = document.getElementById('table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // ソート設定に応じてアイテムを取得
    const orderedItems = getOrderedTableItems();
    
    orderedItems.forEach(item => {
        const row = createTableRow(item, item.type);
        tbody.appendChild(row);
    });
    
    console.log('📊 テーブル更新完了:', orderedItems.length, '項目, ソート:', tableState.sortBy);
}

/**
 * テーブル用のソート済みアイテム取得
 * @returns {Array} ソート済みのアイテム配列
 */
function getOrderedTableItems() {
    const allItems = getAllItems(true);
    
    if (tableState.sortBy === 'custom') {
        // カスタム順序（タイムライン順序）
        initializeTimelineOrder(); // 順序が未設定の場合に初期化
        
        const orderedItems = [];
        
        // タイムライン順序に従って配置
        projectData.timelineOrder.forEach(itemId => {
            const item = allItems.find(i => i.id === itemId);
            if (item) {
                orderedItems.push(item);
            }
        });
        
        // 新しく追加されたアイテムを末尾に追加
        allItems.forEach(item => {
            if (!projectData.timelineOrder.includes(item.id)) {
                orderedItems.push(item);
                projectData.timelineOrder.push(item.id);
            }
        });
        
        return orderedItems;
        
    } else if (tableState.sortBy === 'date') {
        // 日付順（日程未定は最後）
        return allItems.sort((a, b) => {
            const dateA = new Date(a.startDate || a.endDate || '9999-12-31');
            const dateB = new Date(b.startDate || b.endDate || '9999-12-31');
            return dateA - dateB;
        });
        
    } else if (tableState.sortBy === 'type') {
        // タイプ別（マイルストーン → タスク）
        const milestones = allItems.filter(item => item.type === 'milestone');
        const tasks = allItems.filter(item => item.type === 'task');
        
        // 各タイプ内では日付順にソート
        milestones.sort((a, b) => {
            const dateA = new Date(a.endDate || '9999-12-31');
            const dateB = new Date(b.endDate || '9999-12-31');
            return dateA - dateB;
        });
        
        tasks.sort((a, b) => {
            const dateA = new Date(a.startDate || a.endDate || '9999-12-31');
            const dateB = new Date(b.startDate || b.endDate || '9999-12-31');
            return dateA - dateB;
        });
        
        return [...milestones, ...tasks];
    }
    
    return allItems;
}

/**
 * テーブル行を作成
 * @param {Object} item - アイテムデータ
 * @param {string} type - 'milestone' または 'task'
 * @returns {HTMLElement} 作成されたテーブル行
 */
function createTableRow(item, type) {
    const row = document.createElement('tr');
    if (type === 'milestone') {
        row.className = 'milestone-row';
    }
    
    // 依存関係タグの作成
    const dependencies = item.dependencies.map(dep => 
        `<span class="dependency-tag">${dep}</span>`
    ).join('');
    
    // ステータステキストの決定
    const statusText = type === 'milestone' ? 'Milestone' : 
                      item.status === 'not-started' ? 'Not Started' :
                      item.status === 'in-progress' ? 'In Progress' : 'Completed';
    
    // 日程の表示（空欄対応）
    const startDateDisplay = item.startDate || '<span class="unscheduled">-</span>';
    const endDateDisplay = item.endDate || '<span class="unscheduled">-</span>';
    
    row.innerHTML = `
        <td>${type === 'milestone' ? 'Milestone' : 'Task'}</td>
        <td><strong>${item.id}</strong></td>
        <td>${item.name}</td>
        <td><span class="status ${type === 'milestone' ? 'milestone' : item.status}">${statusText}</span></td>
        <td>${startDateDisplay}</td>
        <td>${endDateDisplay}</td>
        <td><div class="task-dependencies">${dependencies}</div></td>
        <td>${item.description || '-'}</td>
        <td><button class="edit-btn" onclick="openEditModal('${item.id}')">Edit</button></td>
    `;
    
    return row;
}

/**
 * テーブルソート変更ハンドラー
 */
function changeTableSort() {
    const select = document.getElementById('table-sort-select');
    if (!select) return;
    
    tableState.sortBy = select.value;
    
    // ソート設定を保存（次回も同じ設定を使用）
    localStorage.setItem('project_table_sort', tableState.sortBy);
    
    console.log('🔄 テーブルソート変更:', tableState.sortBy);
    updateTable();
}

/**
 * テーブルビューの初期化
 */
function initializeTableView() {
    console.log('📋 テーブルビュー初期化開始');
    
    // 保存されたソート設定の復元
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
    
    console.log('✅ テーブルビュー初期化完了');
}

/**
 * テーブルデータの統計情報を取得
 * @returns {Object} 統計情報
 */
function getTableStatistics() {
    const allItems = getAllItems(true);
    
    const stats = {
        total: allItems.length,
        milestones: allItems.filter(item => item.type === 'milestone').length,
        tasks: allItems.filter(item => item.type === 'task').length,
        byStatus: {
            notStarted: allItems.filter(item => item.status === 'not-started').length,
            inProgress: allItems.filter(item => item.status === 'in-progress').length,
            completed: allItems.filter(item => item.status === 'completed').length,
            milestone: allItems.filter(item => item.type === 'milestone').length
        },
        withDates: {
            scheduled: allItems.filter(item => item.startDate || item.endDate).length,
            unscheduled: allItems.filter(item => !item.startDate && !item.endDate).length
        }
    };
    
    return stats;
}

/**
 * テーブル表示のフィルタリング（将来の拡張用）
 * @param {string} filterType - フィルタタイプ
 * @param {*} filterValue - フィルタ値
 */
function filterTable(filterType, filterValue) {
    // 将来の拡張：ステータス別表示、日付範囲フィルタなど
    console.log('🔍 テーブルフィルタ（未実装）:', filterType, filterValue);
}

// エクスポート（他のファイルから使用可能にする）
window.updateTable = updateTable;
window.changeTableSort = changeTableSort;
window.getTableStatistics = getTableStatistics;