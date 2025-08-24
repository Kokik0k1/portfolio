// graphView.js - グラフ表示機能

/**
 * ノード位置の初期化（グラフビューを開かなくても実行）
 */
function initializeNodePositions() {
    console.log('🎯 ノード位置の初期化開始');
    
    // 既に保存された位置情報があるかチェック
    if (loadSavedNodePositions()) {
        console.log('✅ 保存された位置情報を使用');
        return;
    }
    
    console.log('🔧 新しいノード位置を計算');
    
    const allItems = getAllItems(true);
    
    // 依存関係に基づいてレベルを計算
    const levels = {};
    const visited = new Set();
    
    function calculateLevel(item) {
        if (visited.has(item.id)) return levels[item.id] || 0;
        visited.add(item.id);
        
        if (!item.dependencies || item.dependencies.length === 0) {
            levels[item.id] = 0;
            return 0;
        }
        
        let maxDepLevel = -1;
        item.dependencies.forEach(depId => {
            const depItem = allItems.find(i => i.id === depId);
            if (depItem) {
                maxDepLevel = Math.max(maxDepLevel, calculateLevel(depItem));
            }
        });
        
        levels[item.id] = maxDepLevel + 1;
        return levels[item.id];
    }
    
    // 全アイテムのレベルを計算
    allItems.forEach(item => calculateLevel(item));
    
    // レベルごとにグループ化
    const levelGroups = {};
    Object.keys(levels).forEach(itemId => {
        const level = levels[itemId];
        if (!levelGroups[level]) levelGroups[level] = [];
        levelGroups[level].push(allItems.find(i => i.id === itemId));
    });
    
    // 各レベル内で日付順にソート
    Object.keys(levelGroups).forEach(level => {
        levelGroups[level].sort((a, b) => {
            const dateA = new Date(a.endDate || a.startDate || '9999-12-31');
            const dateB = new Date(b.endDate || b.startDate || '9999-12-31');
            return dateA - dateB;
        });
    });
    
    // デフォルトのグラフサイズを想定（800x600）
    const defaultWidth = 800;
    const defaultHeight = 600;
    const levelWidth = Math.min(250, (defaultWidth - 100) / Math.max(Object.keys(levelGroups).length, 1));
    
    // 各アイテムの位置を計算
    Object.keys(levelGroups).forEach(level => {
        const items = levelGroups[level];
        const levelHeight = Math.min(100, (defaultHeight - 100) / Math.max(items.length, 1));
        
        items.forEach((item, index) => {
            const baseY = item.type === 'milestone' ? 80 : 150;
            const yOffset = index * levelHeight;
            
            nodePositions[item.id] = {
                x: parseInt(level) * levelWidth + 100,
                y: baseY + yOffset + (Math.random() - 0.5) * 30
            };
        });
    });
    
    // projectDataにも保存
    projectData.graphLayout.nodePositions = {...nodePositions};
    projectData.graphLayout.lastUpdated = new Date().toISOString();
    
    console.log('✅ ノード位置初期化完了:', Object.keys(nodePositions).length, '個のノード');

    // 初期状態を履歴に保存
    setTimeout(() => {
        saveToHistory();
    }, 100);
}

/**
 * 保存されたノード位置を読み込み
 * @returns {boolean} 読み込み成功時true
 */
function loadSavedNodePositions() {
    if (projectData.graphLayout && projectData.graphLayout.nodePositions) {
        const savedPositions = projectData.graphLayout.nodePositions;
        if (Object.keys(savedPositions).length > 0) {
            nodePositions = {...savedPositions};
            console.log('✅ 保存された位置情報を読み込み:', Object.keys(nodePositions).length, '個のノード');
            return true;
        }
    }
    console.log('ℹ️ 保存された位置情報なし。初期レイアウトを使用。');
    return false;
}

/**
 * グラフ表示の更新（保存された位置情報を活用）
 */
/**
 * グラフ表示の更新（保存された位置情報を活用）
 */
function renderGraph() {
    const svg = document.getElementById('graph-svg');
    if (!svg) {
        console.error('❌ graph-svg要素が見つかりません');
        return;
    }
    
    console.log('🎨 GraphView描画開始');
    
    // データの存在確認
    const allItems = getAllItems(true);
    if (allItems.length === 0) {
        console.warn('⚠️ 表示するデータがありません');
        svg.innerHTML = '<text x="50" y="50" fill="#666" font-size="16">データがありません</text>';
        return;
    }
    
    console.log('📊 アイテム数:', allItems.length);
    
    // 位置情報を確認・初期化
    if (!loadSavedNodePositions()) {
        console.log('🔄 保存された位置情報がないため初期化を実行');
        initializeNodePositions();
    }
    
    // 初期化後も位置情報がない場合の緊急処理
    if (Object.keys(nodePositions).length === 0) {
        console.warn('⚠️ 位置情報初期化に失敗。緊急初期化を実行');
        // 緊急時の簡易位置設定
        allItems.forEach((item, index) => {
            nodePositions[item.id] = {
                x: 100 + (index % 5) * 150,
                y: 100 + Math.floor(index / 5) * 100
            };
        });
        
        // projectDataにも保存
        if (!projectData.graphLayout) {
            projectData.graphLayout = { nodePositions: {}, lastUpdated: null };
        }
        projectData.graphLayout.nodePositions = {...nodePositions};
        projectData.graphLayout.lastUpdated = new Date().toISOString();
    }
    
    console.log('📍 使用可能な位置情報:', Object.keys(nodePositions).length, '個');
    
    // SVGをクリア
    svg.innerHTML = `
        <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                    refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#90a4ae" />
            </marker>
        </defs>
        <g id="graph-group"></g>
    `;
    
    const width = svg.clientWidth;
    const height = svg.clientHeight;
    
    const positions = {};
    
    // 位置情報を準備
    allItems.forEach(item => {
        if (nodePositions[item.id]) {
            positions[item.id] = {
                x: nodePositions[item.id].x,
                y: nodePositions[item.id].y,
                item: item
            };
        }
    });
    
    console.log('🗺️ 描画対象ノード数:', Object.keys(positions).length);
    
    const graphGroup = document.getElementById('graph-group');
    if (!graphGroup) return;
    
    // 依存関係の線を描画
    allItems.forEach(item => {
        if (item.dependencies && item.dependencies.length > 0) {
            item.dependencies.forEach(depId => {
                if (positions[depId] && positions[item.id]) {
                    const fromRadius = allItems.find(i => i.id === depId)?.type === 'milestone' ? 25 : 20;
                    const toRadius = item.type === 'milestone' ? 25 : 20;
                    
                    const adjustedLine = createAdjustedLine(
                        positions[depId], 
                        positions[item.id], 
                        fromRadius, 
                        toRadius
                    );
                    
                    if (adjustedLine) {
                        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                        line.setAttribute('class', 'link');
                        line.setAttribute('x1', adjustedLine.startX);
                        line.setAttribute('y1', adjustedLine.startY);
                        line.setAttribute('x2', adjustedLine.endX);
                        line.setAttribute('y2', adjustedLine.endY);
                        graphGroup.appendChild(line);
                    }
                }
            });
        }
    });
    
    // ノードを描画
    Object.values(positions).forEach(pos => {
        const nodeGroup = createNodeElement(pos);
        graphGroup.appendChild(nodeGroup);
    });
    
    // グラフの変形を適用
    updateGraphTransform();
    
    console.log('✅ GraphView描画完了');
}

/**
 * ノード要素を作成
 * @param {Object} pos - 位置情報とアイテムデータ
 * @returns {SVGElement} 作成されたノードグループ
 */
function createNodeElement(pos) {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute('class', 'node');
    group.setAttribute('transform', `translate(${pos.x}, ${pos.y})`);
    group.setAttribute('data-id', pos.item.id);
    
    // 円
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute('r', pos.item.type === 'milestone' ? 25 : 20);
    circle.setAttribute('class', 
        pos.item.type === 'milestone' ? 'node-milestone' : 
        `node-task ${pos.item.status}`);
    
    // タイトルテキスト
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute('class', 'node-text');
    text.setAttribute('y', -30);
    text.textContent = truncateText(pos.item.name, 10);
    
    // IDテキスト
    const idText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    idText.setAttribute('class', 'node-text');
    idText.setAttribute('y', 5);
    idText.textContent = pos.item.id;
    
    // 日付テキスト
    const dateText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    dateText.setAttribute('class', 'node-date');
    dateText.setAttribute('y', 40);
    dateText.textContent = pos.item.endDate || pos.item.startDate || '-';
    
    group.appendChild(circle);
    group.appendChild(text);
    group.appendChild(idText);
    group.appendChild(dateText);
    
    // イベントリスナーを追加
    setupNodeEventListeners(group, pos);
    
    return group;
}

/**
 * ノードのイベントリスナーを設定
 * @param {SVGElement} group - ノードグループ
 * @param {Object} pos - 位置情報
 */
function setupNodeEventListeners(group, pos) {
    // ホバーイベント
    group.addEventListener('mouseenter', (e) => {
        showTooltip(e, pos.item);
    });
    
    group.addEventListener('mouseleave', () => {
        hideTooltip();
    });
    
    group.addEventListener('mousemove', (e) => {
        if (!isDraggingNode) {
            showTooltip(e, pos.item);
        }
    });
    
    // ドラッグ機能
    let isDraggingNode = false;
    let dragStart = { x: 0, y: 0 };
    
    group.addEventListener('mousedown', (e) => {
        isDraggingNode = true;
        dragStart = { x: e.clientX, y: e.clientY };
        group.style.cursor = 'grabbing';
        
        // ドラッグ開始時の状態を保存
        recordDragStartState();
        
        e.preventDefault();
        e.stopPropagation();
    });
    
    document.addEventListener('mousemove', (e) => {
        if (isDraggingNode && group.getAttribute('data-id')) {
            const dx = (e.clientX - dragStart.x) / graphState.scale;
            const dy = (e.clientY - dragStart.y) / graphState.scale;
            
            pos.x += dx;
            pos.y += dy;
            nodePositions[pos.item.id] = { x: pos.x, y: pos.y };
            
            group.setAttribute('transform', `translate(${pos.x}, ${pos.y})`);
            
            hideTooltip();
            updateConnections(pos.item.id);
            
            dragStart = { x: e.clientX, y: e.clientY };
            
            saveCurrentNodePositions();
        }
    });
    
    document.addEventListener('mouseup', () => {
        if (isDraggingNode) {
            isDraggingNode = false;
            group.style.cursor = 'grab';
            
            // ドラッグ完了時に履歴に保存
            saveToHistoryAfterDrag();
        }
    });
}

/**
 * 線の調整（ノードの境界から境界へ）
 * @param {Object} fromPos - 開始位置
 * @param {Object} toPos - 終了位置
 * @param {number} fromRadius - 開始ノードの半径
 * @param {number} toRadius - 終了ノードの半径
 * @returns {Object|null} 調整された線の座標
 */
function createAdjustedLine(fromPos, toPos, fromRadius, toRadius) {
    const dx = toPos.x - fromPos.x;
    const dy = toPos.y - fromPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance === 0) return null;
    
    const unitX = dx / distance;
    const unitY = dy / distance;
    
    const startX = fromPos.x + unitX * fromRadius;
    const startY = fromPos.y + unitY * fromRadius;
    const endX = toPos.x - unitX * toRadius;
    const endY = toPos.y - unitY * toRadius;
    
    return { startX, startY, endX, endY };
}

/**
 * 接続線を更新（特定ノード移動時）
 * @param {string} nodeId - 移動されたノードのID
 */
function updateConnections(nodeId) {
    const graphGroup = document.getElementById('graph-group');
    if (!graphGroup) return;
    
    // 既存の線を削除
    const lines = graphGroup.querySelectorAll('.link');
    lines.forEach(line => line.remove());
    
    const allItems = getAllItems(true);
    
    // 全ての依存関係線を再描画
    allItems.forEach(item => {
        item.dependencies.forEach(depId => {
            const fromPos = nodePositions[depId] || getNodePosition(depId);
            const toPos = nodePositions[item.id] || getNodePosition(item.id);
            
            if (fromPos && toPos) {
                const fromItem = allItems.find(i => i.id === depId);
                const fromRadius = fromItem && fromItem.type === 'milestone' ? 25 : 20;
                const toRadius = item.type === 'milestone' ? 25 : 20;
                
                const adjustedLine = createAdjustedLine(fromPos, toPos, fromRadius, toRadius);
                
                if (adjustedLine) {
                    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                    line.setAttribute('class', 'link');
                    line.setAttribute('x1', adjustedLine.startX);
                    line.setAttribute('y1', adjustedLine.startY);
                    line.setAttribute('x2', adjustedLine.endX);
                    line.setAttribute('y2', adjustedLine.endY);
                    graphGroup.appendChild(line);
                }
            }
        });
    });
}

/**
 * ノードの現在位置を取得
 * @param {string} nodeId - ノードID
 * @returns {Object|null} 位置情報
 */
function getNodePosition(nodeId) {
    const node = document.querySelector(`[data-id="${nodeId}"]`);
    if (node) {
        const transform = node.getAttribute('transform');
        const match = transform.match(/translate\(([^,]+),([^)]+)\)/);
        if (match) {
            return { x: parseFloat(match[1]), y: parseFloat(match[2]) };
        }
    }
    return null;
}

/**
 * グラフの変形を更新
 */
function updateGraphTransform() {
    const graphGroup = document.getElementById('graph-group');
    if (graphGroup) {
        graphGroup.setAttribute('transform', 
            `translate(${graphState.translateX}, ${graphState.translateY}) scale(${graphState.scale})`);
    }
}

/**
 * ズームリセット
 */
function resetZoom() {
    graphState.scale = 1;
    graphState.translateX = 0;
    graphState.translateY = 0;
    updateGraphTransform();
    logSuccess('ズームをリセット');
}

/**
 * 自動レイアウト
 */
function autoLayout() {
    nodePositions = {};
    projectData.graphLayout.nodePositions = {};
    projectData.graphLayout.lastUpdated = null;
    
    // 履歴をクリア
    clearHistory();
    
    console.log('🗑️ 位置情報をクリアして初期レイアウトに戻します');
    renderGraph();
    
    // 新しい初期状態を履歴に保存
    setTimeout(() => {
        saveToHistory();
    }, 100);
    
    logSuccess('自動レイアウト適用');
}

/**
 * ツールチップ表示
 * @param {Event} event - マウスイベント
 * @param {Object} item - アイテムデータ
 */
function showTooltip(event, item) {
    const tooltip = document.getElementById('tooltip');
    if (!tooltip) return;
    
    const statusText = item.type === 'milestone' ? 'マイルストーン' : 
                      item.status === 'not-started' ? '未開始' :
                      item.status === 'in-progress' ? '進行中' : '完了';
    
    const dateRange = item.startDate || item.endDate ? 
        (item.startDate ? `${item.startDate} ～ ${item.endDate || '-'}` : `期日: ${item.endDate || '-'}`) :
        '日程未定';
    
    const dependencies = item.dependencies.length > 0 ? 
        `依存: ${item.dependencies.join(', ')}` : '依存なし';
    
    tooltip.innerHTML = `
        <div class="tooltip-title">${item.name} (${item.id})</div>
        <div class="tooltip-detail">種類: ${statusText}</div>
        <div class="tooltip-detail">${dateRange}</div>
        <div class="tooltip-detail">${dependencies}</div>
        ${item.description ? `<div class="tooltip-detail">説明: ${item.description}</div>` : ''}
    `;
    
    tooltip.style.left = event.pageX + 10 + 'px';
    tooltip.style.top = event.pageY + 10 + 'px';
    tooltip.classList.add('show');
}

/**
 * ツールチップ非表示
 */
function hideTooltip() {
    const tooltip = document.getElementById('tooltip');
    if (tooltip) {
        tooltip.classList.remove('show');
    }
}

// エクスポート
window.initializeNodePositions = initializeNodePositions;
window.renderGraph = renderGraph;
window.updateGraphTransform = updateGraphTransform;
window.resetZoom = resetZoom;
window.autoLayout = autoLayout;