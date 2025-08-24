// history.js - アンドゥ・リドゥ機能

/**
 * 履歴に現在の状態を保存
 */
function saveToHistory() {
    const currentState = JSON.stringify(nodePositions);
    
    // 現在のインデックス以降の履歴を削除（新しい変更をした場合）
    if (positionHistory.currentIndex < positionHistory.states.length - 1) {
        positionHistory.states = positionHistory.states.slice(0, positionHistory.currentIndex + 1);
    }
    
    // 新しい状態を追加
    positionHistory.states.push(currentState);
    positionHistory.currentIndex++;
    
    // 履歴サイズの制限
    if (positionHistory.states.length > positionHistory.maxHistory) {
        positionHistory.states.shift();
        positionHistory.currentIndex--;
    }
    
    updateUndoRedoButtons();
    console.log('📚 履歴に保存:', positionHistory.currentIndex + 1, '/', positionHistory.states.length);
}

/**
 * アンドゥ機能
 */
function undoNodePosition() {
    if (positionHistory.currentIndex > 0) {
        positionHistory.isUndoRedo = true;
        positionHistory.currentIndex--;
        
        const previousState = positionHistory.states[positionHistory.currentIndex];
        nodePositions = JSON.parse(previousState);
        projectData.graphLayout.nodePositions = {...nodePositions};
        
        renderGraph();
        updateUndoRedoButtons();
        
        logSuccess('アンドゥ実行', {
            position: `${positionHistory.currentIndex + 1}/${positionHistory.states.length}`,
            nodeCount: Object.keys(nodePositions).length
        });
        
        setTimeout(() => {
            positionHistory.isUndoRedo = false;
        }, 100);
    } else {
        logWarning('アンドゥできません - 履歴の先頭です');
    }
}

/**
 * リドゥ機能
 */
function redoNodePosition() {
    if (positionHistory.currentIndex < positionHistory.states.length - 1) {
        positionHistory.isUndoRedo = true;
        positionHistory.currentIndex++;
        
        const nextState = positionHistory.states[positionHistory.currentIndex];
        nodePositions = JSON.parse(nextState);
        projectData.graphLayout.nodePositions = {...nodePositions};
        
        renderGraph();
        updateUndoRedoButtons();
        
        logSuccess('リドゥ実行', {
            position: `${positionHistory.currentIndex + 1}/${positionHistory.states.length}`,
            nodeCount: Object.keys(nodePositions).length
        });
        
        setTimeout(() => {
            positionHistory.isUndoRedo = false;
        }, 100);
    } else {
        logWarning('リドゥできません - 履歴の末尾です');
    }
}

/**
 * アンドゥ/リドゥボタンの状態更新
 */
function updateUndoRedoButtons() {
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    
    if (undoBtn) {
        undoBtn.disabled = positionHistory.currentIndex <= 0;
        undoBtn.style.opacity = undoBtn.disabled ? '0.5' : '1';
        undoBtn.title = undoBtn.disabled ? 
            '元に戻す (Ctrl+Z) - 履歴なし' : 
            `元に戻す (Ctrl+Z) - ${positionHistory.currentIndex}/${positionHistory.states.length}`;
    }
    
    if (redoBtn) {
        redoBtn.disabled = positionHistory.currentIndex >= positionHistory.states.length - 1;
        redoBtn.style.opacity = redoBtn.disabled ? '0.5' : '1';
        redoBtn.title = redoBtn.disabled ? 
            'やり直し (Ctrl+Y) - 履歴なし' : 
            `やり直し (Ctrl+Y) - ${positionHistory.currentIndex + 2}/${positionHistory.states.length}`;
    }
}

/**
 * ドラッグ完了時に履歴に保存
 */
function saveToHistoryAfterDrag() {
    if (!positionHistory.isUndoRedo) {
        // ドラッグ開始時の状態と現在の状態を比較
        const currentState = JSON.stringify(nodePositions);
        if (positionHistory.dragStartState && currentState !== positionHistory.dragStartState) {
            saveToHistory();
            console.log('📚 ドラッグ完了: 履歴に保存');
        }
    }
    positionHistory.dragStartState = null;
}

/**
 * ドラッグ開始時の状態を記録
 */
function recordDragStartState() {
    positionHistory.dragStartState = JSON.stringify(nodePositions);
}

/**
 * 履歴をクリア
 */
function clearHistory() {
    positionHistory.states = [];
    positionHistory.currentIndex = -1;
    positionHistory.isUndoRedo = false;
    positionHistory.dragStartState = null;
    
    updateUndoRedoButtons();
    logWarning('履歴をクリアしました');
}

/**
 * 履歴の統計情報を取得
 * @returns {Object} 履歴統計
 */
function getHistoryStats() {
    return {
        totalStates: positionHistory.states.length,
        currentIndex: positionHistory.currentIndex,
        canUndo: positionHistory.currentIndex > 0,
        canRedo: positionHistory.currentIndex < positionHistory.states.length - 1,
        memoryUsage: JSON.stringify(positionHistory.states).length
    };
}

/**
 * 履歴の詳細情報を表示（デバッグ用）
 */
function debugHistory() {
    console.group('📚 履歴情報');
    const stats = getHistoryStats();
    
    console.log('総状態数:', stats.totalStates);
    console.log('現在位置:', stats.currentIndex + 1, '/', stats.totalStates);
    console.log('アンドゥ可能:', stats.canUndo);
    console.log('リドゥ可能:', stats.canRedo);
    console.log('メモリ使用量:', `${(stats.memoryUsage / 1024).toFixed(2)} KB`);
    console.log('最大履歴数:', positionHistory.maxHistory);
    
    if (positionHistory.states.length > 0) {
        console.log('履歴内容:');
        positionHistory.states.forEach((state, index) => {
            const nodeCount = Object.keys(JSON.parse(state)).length;
            const marker = index === positionHistory.currentIndex ? ' ← 現在' : '';
            console.log(`  ${index + 1}. ${nodeCount}個のノード${marker}`);
        });
    }
    
    console.groupEnd();
}

/**
 * 履歴を最適化（重複する連続した状態を削除）
 */
function optimizeHistory() {
    let optimizedStates = [];
    let lastState = null;
    
    positionHistory.states.forEach(state => {
        if (state !== lastState) {
            optimizedStates.push(state);
            lastState = state;
        }
    });
    
    const removedCount = positionHistory.states.length - optimizedStates.length;
    if (removedCount > 0) {
        positionHistory.states = optimizedStates;
        positionHistory.currentIndex = Math.min(
            positionHistory.currentIndex, 
            optimizedStates.length - 1
        );
        
        updateUndoRedoButtons();
        logSuccess(`履歴を最適化`, { removedDuplicates: removedCount });
    } else {
        console.log('✨ 履歴は既に最適化されています');
    }
}

/**
 * 履歴の初期化（アプリケーション起動時）
 */
function initializeHistory() {
    // 初期状態を履歴に保存
    if (Object.keys(nodePositions).length > 0) {
        setTimeout(() => {
            saveToHistory();
            console.log('📚 初期状態を履歴に保存');
        }, 100);
    }
    
    updateUndoRedoButtons();
}

// エクスポート
window.undoNodePosition = undoNodePosition;
window.redoNodePosition = redoNodePosition;
window.saveToHistory = saveToHistory;
window.saveToHistoryAfterDrag = saveToHistoryAfterDrag;
window.recordDragStartState = recordDragStartState;
window.updateUndoRedoButtons = updateUndoRedoButtons;