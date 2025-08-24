// data.js - データ管理と状態管理

// メインプロジェクトデータ（位置情報も含む）
let projectData = {
    milestones: [
        {
            id: 'M_PRJ_STR',
            name: 'Project Start',
            status: 'completed',
            endDate: '2024-01-15',
            dependencies: [],
            description: 'Project kickoff meeting'
        },
        {
            id: 'M_DSN_CMP',
            name: 'Design Complete',
            status: 'completed',
            endDate: '2024-02-28',
            dependencies: ['T_REQ_ANL', 'T_UI_DSN'],
            description: 'System design and UI design completion'
        },
        {
            id: 'M_REL_PRD',
            name: 'Production Release',
            status: 'not-started',
            endDate: '', // 空欄の例
            dependencies: ['T_TST_QA', 'T_DPL_PRP'],
            description: 'Release to production environment (date TBD)'
        }
    ],
    tasks: [
        {
            id: 'T_REQ_ANL',
            name: 'Requirements Analysis',
            status: 'completed',
            startDate: '2024-01-16',
            endDate: '2024-02-15',
            dependencies: ['M_PRJ_STR'],
            description: 'System requirements analysis and organization'
        },
        {
            id: 'T_UI_DSN',
            name: 'UI Design',
            status: 'completed',
            startDate: '2024-02-01',
            endDate: '2024-02-28',
            dependencies: ['T_REQ_ANL'],
            description: 'User interface design'
        },
        {
            id: 'T_BCK_DEV',
            name: 'Backend Development',
            status: 'in-progress',
            startDate: '2024-03-01',
            endDate: '2024-04-30',
            dependencies: ['M_DSN_CMP'],
            description: 'Server-side implementation'
        },
        {
            id: 'T_FRT_DEV',
            name: 'Frontend Development',
            status: 'in-progress',
            startDate: '2024-03-15',
            endDate: '2024-05-15',
            dependencies: ['T_UI_DSN'],
            description: 'Client-side implementation'
        },
        {
            id: 'T_TST_QA',
            name: 'Testing & QA',
            status: 'not-started',
            startDate: '', // 空欄の例
            endDate: '', // 空欄の例
            dependencies: ['T_BCK_DEV', 'T_FRT_DEV'],
            description: 'Integration testing and quality assurance (dates TBD)'
        },
        {
            id: 'T_DPL_PRP',
            name: 'Deploy Preparation',
            status: 'not-started',
            startDate: '2024-06-16',
            endDate: '2024-06-29',
            dependencies: ['T_TST_QA'],
            description: 'Preparation for production deployment'
        }
    ],
    graphLayout: {
        nodePositions: {},
        lastUpdated: null
    },
    // タイムライン表示順序を管理
    timelineOrder: []
};

// グラフの状態管理
let graphState = {
    scale: 1,
    translateX: 0,
    translateY: 0,
    isDragging: false,
    dragStart: { x: 0, y: 0 }
};

// ノード位置情報
let nodePositions = {};

// アンドゥ/リドゥ履歴管理
let positionHistory = {
    states: [],
    currentIndex: -1,
    maxHistory: 50,
    isUndoRedo: false, // アンドゥ/リドゥ実行中フラグ
    dragStartState: null // ドラッグ開始時の状態を保存
};

// タイムラインの状態管理
let timelineState = {
    zoom: 'month',
    startDate: null,
    endDate: null,
    pixelsPerDay: 3
};

// ドラッグ&ドロップの状態管理（改良版）
let dragState = {
    isDragging: false,
    draggedElement: null,
    draggedItemId: null,
    originalIndex: -1,
    dropIndicator: null,
    activeListeners: []
};

// テーブルソート状態の管理
let tableState = {
    sortBy: 'custom' // 'custom' または 'date'
};

// 出力関連の変数
let currentExportFormat = '';
let currentExportData = '';

// 編集用の変数
let currentEditingItem = null;

// データ操作関数

/**
 * 全アイテム（マイルストーン + タスク）を取得
 * @param {boolean} includeType - typeプロパティを含むかどうか
 * @returns {Array} 全アイテムの配列
 */
function getAllItems(includeType = true) {
    if (includeType) {
        return [
            ...projectData.milestones.map(m => ({...m, type: 'milestone'})),
            ...projectData.tasks.map(t => ({...t, type: 'task'}))
        ];
    } else {
        return [...projectData.milestones, ...projectData.tasks];
    }
}

/**
 * IDでアイテムを検索
 * @param {string} itemId - 検索するアイテムID
 * @returns {Object|null} 見つかったアイテムまたはnull
 */
function findItemById(itemId) {
    const allItems = getAllItems(true);
    return allItems.find(item => item.id === itemId) || null;
}

/**
 * IDの重複チェック
 * @param {string} newId - チェックするID
 * @param {string} excludeId - 除外するID（編集時に使用）
 * @returns {boolean} 重複している場合true
 */
function isDuplicateId(newId, excludeId = null) {
    const allItems = getAllItems(false);
    return allItems.some(item => item.id === newId && item.id !== excludeId);
}

/**
 * アイテムを追加
 * @param {Object} item - 追加するアイテム
 * @param {string} type - 'milestone' または 'task'
 */
function addItem(item, type) {
    if (type === 'milestone') {
        projectData.milestones.push(item);
    } else {
        projectData.tasks.push(item);
    }
    
    // タイムライン順序に追加
    if (!projectData.timelineOrder.includes(item.id)) {
        projectData.timelineOrder.push(item.id);
    }
}

/**
 * アイテムを削除
 * @param {string} itemId - 削除するアイテムID
 * @returns {boolean} 削除成功時true
 */
function removeItem(itemId) {
    // マイルストーンから削除を試行
    const milestoneIndex = projectData.milestones.findIndex(m => m.id === itemId);
    if (milestoneIndex !== -1) {
        projectData.milestones.splice(milestoneIndex, 1);
    } else {
        // タスクから削除を試行
        const taskIndex = projectData.tasks.findIndex(t => t.id === itemId);
        if (taskIndex !== -1) {
            projectData.tasks.splice(taskIndex, 1);
        } else {
            return false; // アイテムが見つからない
        }
    }
    
    // タイムライン順序からも削除
    const orderIndex = projectData.timelineOrder.indexOf(itemId);
    if (orderIndex !== -1) {
        projectData.timelineOrder.splice(orderIndex, 1);
    }
    
    // ノード位置情報も削除
    if (nodePositions[itemId]) {
        delete nodePositions[itemId];
        delete projectData.graphLayout.nodePositions[itemId];
    }
    
    return true;
}

/**
 * タイムライン表示順序の初期化
 */
function initializeTimelineOrder() {
    if (projectData.timelineOrder.length === 0) {
        const allItems = getAllItems(true);
        
        // デフォルトは日付順でソート（日程未定は最後）
        allItems.sort((a, b) => {
            const dateA = new Date(a.startDate || a.endDate || '9999-12-31');
            const dateB = new Date(b.startDate || b.endDate || '9999-12-31');
            return dateA - dateB;
        });
        
        projectData.timelineOrder = allItems.map(item => item.id);
        console.log('📋 タイムライン初期順序を設定:', projectData.timelineOrder);
    }
}

/**
 * データの整合性チェック
 * @returns {Array} 問題のリスト
 */
function validateData() {
    const issues = [];
    const allItems = getAllItems(true);
    const allIds = allItems.map(item => item.id);
    
    // 依存関係の整合性チェック
    allItems.forEach(item => {
        item.dependencies.forEach(depId => {
            if (!allIds.includes(depId)) {
                issues.push(`${item.id}: 存在しない依存関係 "${depId}"`);
            }
        });
    });
    
    // 循環依存のチェック（簡易版）
    allItems.forEach(item => {
        if (item.dependencies.includes(item.id)) {
            issues.push(`${item.id}: 自己依存が検出されました`);
        }
    });
    
    return issues;
}

// 状態管理関数

/**
 * プロジェクトデータをリセット（デバッグ用）
 */
function resetProjectData() {
    console.warn('🗑️ プロジェクトデータをリセットしています...');
    
    // 位置履歴をクリア
    positionHistory.states = [];
    positionHistory.currentIndex = -1;
    
    // ノード位置をクリア
    nodePositions = {};
    projectData.graphLayout.nodePositions = {};
    
    // タイムライン順序をクリア
    projectData.timelineOrder = [];
    
    // 初期化
    initializeTimelineOrder();
    initializeNodePositions();
    
    console.log('✅ プロジェクトデータのリセット完了');
}

// デバッグ用関数
function debugProjectData() {
    console.group('📊 プロジェクトデータ状況');
    console.log('マイルストーン数:', projectData.milestones.length);
    console.log('タスク数:', projectData.tasks.length);
    console.log('ノード位置数:', Object.keys(nodePositions).length);
    console.log('タイムライン順序:', projectData.timelineOrder.length);
    console.log('履歴状態:', `${positionHistory.currentIndex + 1}/${positionHistory.states.length}`);
    
    const issues = validateData();
    if (issues.length > 0) {
        console.warn('⚠️ データ整合性の問題:', issues);
    } else {
        console.log('✅ データ整合性: 正常');
    }
    console.groupEnd();
}