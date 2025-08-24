// timelineState.js - タイムライン状態管理専門モジュール

/**
 * タイムライン順序の初期化（改良版）
 */
function initializeTimelineOrder() {
    console.log('🔧 タイムライン順序の初期化');
    
    const allItems = getAllItems(true);
    
    if (!projectData.timelineOrder) {
        projectData.timelineOrder = [];
    }
    
    // 既存の順序を維持しつつ、新しいアイテムを追加
    const existingIds = new Set(projectData.timelineOrder);
    const newItems = allItems.filter(item => !existingIds.has(item.id));
    
    if (newItems.length > 0) {
        console.log('📝 新しいアイテムを追加:', newItems.map(i => i.id).join(','));
        
        // 新しいアイテムを日付順でソートして追加
        newItems.sort((a, b) => {
            const dateA = new Date(a.startDate || a.endDate || '9999-12-31');
            const dateB = new Date(b.startDate || b.endDate || '9999-12-31');
            return dateA - dateB;
        });
        
        projectData.timelineOrder.push(...newItems.map(item => item.id));
    }
    
    // 存在しないアイテムIDを除去
    const validIds = new Set(allItems.map(item => item.id));
    projectData.timelineOrder = projectData.timelineOrder.filter(id => validIds.has(id));
    
    console.log('✅ 初期化完了。順序:', projectData.timelineOrder.join(','));
}

/**
 * タイムライン順序に従ってアイテムを取得
 */
function getOrderedTimelineItems() {
    const allItems = getAllItems(true);
    
    // 順序が設定されている場合はそれに従う
    if (projectData.timelineOrder && projectData.timelineOrder.length > 0) {
        const orderedItems = [];
        
        // 順序に従って配置
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
    }
    
    // デフォルトは日付順（日程未定は最後）
    return allItems.sort((a, b) => {
        const dateA = new Date(a.startDate || a.endDate || '9999-12-31');
        const dateB = new Date(b.startDate || b.endDate || '9999-12-31');
        return dateA - dateB;
    });
}

/**
 * タイムライン項目の並び替え処理（完全修正版）
 */
function reorderTimelineItem(itemId, fromIndex, toIndex) {
    console.log(`🔀 並び替え処理開始: ${itemId} (${fromIndex} -> ${toIndex})`);
    
    try {
        // 現在の順序配列を取得
        if (!projectData.timelineOrder || projectData.timelineOrder.length === 0) {
            console.log('🔧 timelineOrder初期化中...');
            initializeTimelineOrder();
        }
        
        const currentOrder = [...projectData.timelineOrder];
        console.log('📋 現在の順序:', currentOrder.join(','));
        
        // インデックスの境界チェック
        if (fromIndex < 0 || fromIndex >= currentOrder.length) {
            console.error('❌ 無効なfromIndex:', fromIndex, '配列長:', currentOrder.length);
            return false;
        }
        
        if (toIndex < 0 || toIndex > currentOrder.length) {
            console.error('❌ 無効なtoIndex:', toIndex, '配列長:', currentOrder.length);
            return false;
        }
        
        // 同じ位置の場合は何もしない
        if (fromIndex === toIndex) {
            console.log('🔍 同じ位置のため並び替えなし');
            return false;
        }
        
        // 移動するアイテムIDを確認
        const movingItemId = currentOrder[fromIndex];
        if (movingItemId !== itemId) {
            console.error('❌ アイテムIDが一致しません:', movingItemId, '!=', itemId);
            return false;
        }
        
        // 配列操作：元の位置から削除
        const [removedId] = currentOrder.splice(fromIndex, 1);
        console.log('🗑️ 削除されたアイテム:', removedId, '位置:', fromIndex);
        
        // 修正：UI上のターゲット位置に基づいて正確に挿入
        // fromIndex < toIndex の場合、削除により配列が縮んだため調整が必要
        const adjustedToIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;
        
        currentOrder.splice(adjustedToIndex, 0, removedId);
        
        console.log('📍 挿入位置:', adjustedToIndex, '(調整後)');
        console.log('🔍 新しい順序:', currentOrder.join(','));
        
        // 更新を保存
        projectData.timelineOrder = currentOrder;
        
        console.log(`✅ ${itemId} を位置 ${fromIndex} から ${adjustedToIndex} に移動完了`);
        return true;
        
    } catch (error) {
        console.error('❌ 並び替え処理でエラーが発生:', error);
        return false;
    }
}

/**
 * タイムライン順序をリセット（改良版）
 */
function resetTimelineOrder(resetType = 'date') {
    console.log('🔄 タイムライン順序リセット開始:', resetType);
    
    const allItems = getAllItems(true);
    let orderedItems = [];
    
    if (resetType === 'date') {
        // 日付順リセット（日程未定は最後）
        orderedItems = allItems.sort((a, b) => {
            const dateA = new Date(a.startDate || a.endDate || '9999-12-31');
            const dateB = new Date(b.startDate || b.endDate || '9999-12-31');
            return dateA - dateB;
        });
        console.log('📅 日付順でリセットしました');
    } else if (resetType === 'type') {
        // タイプ別リセット
        const milestones = allItems.filter(item => item.type === 'milestone');
        const tasks = allItems.filter(item => item.type === 'task');
        
        // 各タイプ内では日付順にソート（日程未定は最後）
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
        
        orderedItems = [...milestones, ...tasks];
        console.log('🎯 タイプ別でリセットしました (マイルストーン:', milestones.length, '個 → タスク:', tasks.length, '個)');
    }
    
    // 新しい順序を保存
    projectData.timelineOrder = orderedItems.map(item => item.id);
    
    console.log('📋 新しいタイムライン順序:', projectData.timelineOrder.join(','));
    
    // リセットメニューを閉じる
    const resetMenu = document.getElementById('reset-menu');
    if (resetMenu) {
        resetMenu.classList.remove('show');
        console.log('📋 リセットメニューを閉じました');
    }
    
    // タイムラインを再描画
    if (typeof renderTimeline === 'function') {
        setTimeout(() => {
            renderTimeline();
            console.log('🎨 タイムライン再描画完了');
        }, 50);
    } else {
        console.error('❌ renderTimeline関数が見つかりません');
    }
        
    
    return true; // 成功を返す
}

/**
 * ドラッグ状態管理オブジェクト
 */
const timelineDragState = {
    isDragging: false,
    draggedElement: null,
    draggedItemId: null,
    originalIndex: -1,
    currentTargetIndex: -1,
    dropIndicator: null,
    activeListeners: []
};

/**
 * ドラッグ状態のリセット
 */
function resetTimelineDragState() {
    console.log('🧹 タイムライン・ドラッグ状態リセット');
    
    if (timelineDragState.isDragging) {
        if (timelineDragState.draggedElement) {
            timelineDragState.draggedElement.classList.remove('dragging');
        }
        if (timelineDragState.dropIndicator) {
            timelineDragState.dropIndicator.classList.remove('show');
        }
    }
    
    timelineDragState.isDragging = false;
    timelineDragState.draggedElement = null;
    timelineDragState.draggedItemId = null;
    timelineDragState.originalIndex = -1;
    timelineDragState.currentTargetIndex = -1;
    
    // アクティブなイベントリスナーもクリア
    if (timelineDragState.activeListeners && timelineDragState.activeListeners.length > 0) {
        timelineDragState.activeListeners.forEach(({ element, event, handler }) => {
            try {
                element.removeEventListener(event, handler);
            } catch (e) {
                console.warn('タイムライン・リスナー削除失敗:', e);
            }
        });
        timelineDragState.activeListeners = [];
    }
}

/**
 * タイムライン・イベントリスナーのクリア
 */
function cleanupTimelineDragListeners() {
    if (timelineDragState.activeListeners && timelineDragState.activeListeners.length > 0) {
        timelineDragState.activeListeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        timelineDragState.activeListeners = [];
        console.log('🧹 タイムライン・古いイベントリスナーをクリアしました');
    }
}

/**
 * ドラッグ状態の取得（読み取り専用）
 */
function getTimelineDragState() {
    return { ...timelineDragState }; // 読み取り専用のコピーを返す
}

/**
 * ドラッグ状態の更新（安全な更新メソッド）
 */
function updateTimelineDragState(updates) {
    Object.assign(timelineDragState, updates);
}

/**
 * アクティブリスナーの追加
 */
function addTimelineDragListener(element, event, handler) {
    timelineDragState.activeListeners.push({ element, event, handler });
}

// エクスポート - 状態管理関連の関数を外部から使用可能にする
window.TimelineState = {
    // 順序管理
    initializeTimelineOrder,
    getOrderedTimelineItems,
    reorderTimelineItem,
    resetTimelineOrder,
    
    // ドラッグ状態管理
    resetTimelineDragState,
    cleanupTimelineDragListeners,
    getTimelineDragState,
    updateTimelineDragState,
    addTimelineDragListener
};

// 後方互換性のため個別の関数もエクスポート
window.initializeTimelineOrder = initializeTimelineOrder;
window.getOrderedTimelineItems = getOrderedTimelineItems;
window.reorderTimelineItem = reorderTimelineItem;
window.resetTimelineOrder = resetTimelineOrder;
window.resetDragState = resetTimelineDragState; // 既存コードとの互換性
window.cleanupTimelineDragListeners = cleanupTimelineDragListeners;