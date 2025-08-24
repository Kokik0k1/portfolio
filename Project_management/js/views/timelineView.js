// timelineView.js - タイムライン表示機能

/**
 * タイムライン表示の更新（修正版：確実な描画順序）
 */
function renderTimeline() {
    console.log('📄 タイムライン描画開始');
    TimelineState.initializeTimelineOrder();
    TimelineCalculator.calculateTimelineRange();
    renderTimelineHeader();
    renderTimelineContent();
    renderTimelineToday();
    
    // グリッド描画を先に完了
    setTimeout(() => {
        renderTimelineGrid();
        
        // timeline-bar要素の描画完了を確実に待ってから依存関係を描画
        setTimeout(() => {
            const timelineBars = document.querySelectorAll('.timeline-bar');
            console.log('🔍 描画完了時点でのtimeline-bar数:', timelineBars.length);
            
            if (timelineBars.length > 0) {
                renderTimelineDependencies();
            } else {
                console.warn('⚠️ timeline-bar要素がまだ準備できていません');
                // さらに待ってリトライ
                setTimeout(() => {
                    renderTimelineDependencies();
                }, 300);
            }
        }, 300); // より長い待機時間
    }, 100);
}



/**
 * タイムラインヘッダー描画の修正版
 */
function renderTimelineHeader() {
    const datesContainer = document.getElementById('timeline-dates');
    const sidebar = document.getElementById('timeline-sidebar');
    if (!datesContainer) return;
    
    // サイドバーのサイズ設定を統一
    if (sidebar) {
        sidebar.style.width = '250px';
        sidebar.style.minWidth = '250px';
        sidebar.style.maxWidth = '250px';
        sidebar.style.flexShrink = '0';
        sidebar.style.background = '#f8f9fa';
        sidebar.style.borderRight = '1px solid #e1e5e9';
    }
    
    datesContainer.innerHTML = '';
    
    const totalDays = Math.ceil((timelineState.endDate - timelineState.startDate) / (1000 * 60 * 60 * 24));
    
    // 🔧 月表示の場合は専用の処理を使用
    if (timelineState.zoom === 'month') {
        renderMonthlyHeader(datesContainer, totalDays);
        return;
    }
    
    // 日・週表示の処理（既存のまま）
    let gridInterval, dateFormat;
    switch (timelineState.zoom) {
        case 'day':
            gridInterval = 7;
            dateFormat = (date) => `${date.getMonth() + 1}/${date.getDate()}`;
            break;
        case 'week':
            gridInterval = 7;
            dateFormat = (date) => `${date.getMonth() + 1}/${date.getDate()}`;
            break;
    }
    
    let startDate = new Date(timelineState.startDate);
    if (timelineState.zoom === 'week' || timelineState.zoom === 'day') {
        startDate = TimelineCalculator.getMondayOfWeek(startDate);
    }
    
    let dayOffset = 0;
    if (timelineState.zoom === 'week' || timelineState.zoom === 'day') {
        dayOffset = Math.floor((startDate - timelineState.startDate) / (1000 * 60 * 60 * 24));
    }
    
    for (let i = dayOffset; i <= totalDays; i += gridInterval) {
        const currentDate = new Date(timelineState.startDate);
        currentDate.setDate(currentDate.getDate() + i);
        
        if (timelineState.zoom === 'week' || timelineState.zoom === 'day') {
            const adjustedDate = TimelineCalculator.getMondayOfWeek(currentDate);
            currentDate.setTime(adjustedDate.getTime());
        }
        
        const leftPosition = i * timelineState.pixelsPerDay;
        
        const dateElement = document.createElement('div');
        dateElement.style.position = 'absolute';
        dateElement.style.left = leftPosition + 'px';
        dateElement.style.width = (gridInterval * timelineState.pixelsPerDay) + 'px';
        dateElement.style.textAlign = 'center';
        dateElement.style.borderRight = '1px solid #e1e5e9';
        dateElement.style.padding = '8px 4px';
        dateElement.style.fontSize = '11px';
        dateElement.style.whiteSpace = 'nowrap';
        dateElement.style.overflow = 'hidden';
        dateElement.style.background = '#fff';
        dateElement.textContent = dateFormat(currentDate);
        
        datesContainer.appendChild(dateElement);
    }
    
    // **修正: 統一した幅設定**
    const totalWidth = Math.max(totalDays * timelineState.pixelsPerDay + 200, 1200); // 最小幅を確保
    datesContainer.style.width = totalWidth + 'px';
    datesContainer.style.minWidth = totalWidth + 'px';
    datesContainer.style.height = '50px';
    datesContainer.style.background = '#fff';
    
    // **重要: 親コンテナにも同じ幅を設定**
    const timelineContainer = document.getElementById('timeline-container');
    if (timelineContainer) {
        timelineContainer.style.overflowX = 'auto';
        timelineContainer.style.overflowY = 'auto';
    }
    
    console.log(`🔧 タイムラインヘッダー幅: ${totalWidth}px (${totalDays}日 × ${timelineState.pixelsPerDay}px/日)`);
}

/**
 * タイムラインコンテンツ描画の修正版
 */
function renderTimelineContent() {
    const itemsContainer = document.getElementById('timeline-items');
    const chartContainer = document.getElementById('timeline-chart');
    
    if (!itemsContainer || !chartContainer) return;
    
    // 既存のイベントリスナーをクリア
    TimelineState.cleanupTimelineDragListeners();
    
    // **修正: アイテムコンテナの固定幅設定**
    itemsContainer.style.width = '250px';
    itemsContainer.style.minWidth = '250px';
    itemsContainer.style.maxWidth = '250px';
    itemsContainer.style.flexShrink = '0';
    itemsContainer.style.boxSizing = 'border-box';
    itemsContainer.style.background = '#f8f9fa';
    itemsContainer.style.borderRight = '1px solid #e1e5e9';
    
    itemsContainer.innerHTML = '';
    
    // 既存のバーを削除
    const existingBars = chartContainer.querySelectorAll('.timeline-bar');
    existingBars.forEach(bar => bar.remove());
    
    // 既存の依存関係SVGも削除
    const existingSvg = chartContainer.querySelector('.timeline-dependencies-svg');
    if (existingSvg) {
        existingSvg.remove();
    }
    
    
    TimelineState.resetTimelineDragState();
    
    // タイムライン順序に従ってアイテムを取得
    const orderedItems = TimelineState.getOrderedTimelineItems();
    
    console.log('📊 タイムライン項目数:', orderedItems.length);
    
    // **修正: 総幅を正確に計算してチャートコンテナに適用**
    const totalDays = Math.ceil((timelineState.endDate - timelineState.startDate) / (1000 * 60 * 60 * 24));
    const totalWidth = Math.max(totalDays * timelineState.pixelsPerDay + 200, 1200); // ヘッダーと同じ計算
    
    // チャートコンテナの幅設定を修正
    chartContainer.style.width = totalWidth + 'px';
    chartContainer.style.minWidth = totalWidth + 'px';
    chartContainer.style.flexShrink = '0';
    chartContainer.style.position = 'relative';
    chartContainer.style.overflow = 'visible'; // 重要: overflowをvisibleに
    
    orderedItems.forEach((item, index) => {
        createTimelineItemRow(item, index, itemsContainer);
        createTimelineBar(item, index);
    });
    
    setupTimelineDragAndDrop(itemsContainer);
    
    const minHeight = orderedItems.length * 60 + 50;
    itemsContainer.style.minHeight = minHeight + 'px';
    chartContainer.style.minHeight = minHeight + 'px';
    
    console.log(`🔧 チャートコンテナ幅設定: ${totalWidth}px (ヘッダーと同期)`);
}

/**
 * タイムライン項目行を作成（改良版）
 */
function createTimelineItemRow(item, index, container) {
    const itemRow = document.createElement('div');
    itemRow.className = `timeline-item-row ${item.type === 'milestone' ? 'milestone' : ''}`;
    itemRow.setAttribute('data-item-id', item.id);
    itemRow.setAttribute('data-item-type', item.type);
    itemRow.setAttribute('data-index', index);
    
    // ドラッグハンドル
    const dragHandle = document.createElement('div');
    dragHandle.className = 'drag-handle';
    dragHandle.innerHTML = '⋮⋮';
    dragHandle.title = 'ドラッグして並び替え';
    
    // アイテム情報
    const itemContent = document.createElement('div');
    itemContent.style.display = 'flex';
    itemContent.style.flexDirection = 'column';
    itemContent.style.flex = '1';
    
    const itemId = document.createElement('div');
    itemId.className = 'timeline-item-id';
    itemId.textContent = item.id;
    
    const itemName = document.createElement('div');
    itemName.className = 'timeline-item-name';
    itemName.textContent = item.name;
    itemName.title = `${item.id}: ${item.description || item.name}`;
    
    itemContent.appendChild(itemId);
    itemContent.appendChild(itemName);
    
    itemRow.appendChild(dragHandle);
    itemRow.appendChild(itemContent);
    
    container.appendChild(itemRow);
}

/**
 * タイムラインバーを作成
 */
function createTimelineBar(item, rowIndex) {
    const chartContainer = document.getElementById('timeline-chart');
    if (!chartContainer) return;
    
    const bar = document.createElement('div');
    bar.className = `timeline-bar ${item.type === 'milestone' ? 'milestone' : item.status}`;
    bar.setAttribute('data-item-id', item.id);
    
    // 👇 複雑な計算を1行に集約！
    const position = TimelineCalculator.calculateBarPosition(item, rowIndex);
    
    bar.style.left = position.left + 'px';
    bar.style.top = position.top + 'px';
    
    if (position.isUnscheduled) {
        bar.classList.add('unscheduled');
    }
    
    if (item.type === 'milestone') {
        // マイルストーン表示ロジック（既存のまま）
        if (position.isUnscheduled || !item.endDate) {
            bar.style.left = (position.left + 15) + 'px';
            bar.title = `${item.name} (日程未定)`;
        } else {
            bar.style.left = (position.left + 15) + 'px';
            bar.title = `${item.name} (${item.endDate})`;
        }
    } else {
        // タスク表示ロジック
        const calculatedWidth = position.width;
        const minWidth = 40;
        const finalWidth = Math.max(minWidth, calculatedWidth);
        
        bar.style.width = finalWidth + 'px';
        
        // テキスト表示ロジック（既存のまま）
        const taskName = item.name;
        const textWidth = taskName.length * 7;
        
        if (textWidth > finalWidth - 16) {
            const shortText = finalWidth > 50 ? taskName.substring(0, Math.floor((finalWidth - 16) / 7)) : '';
            bar.textContent = shortText;
            
            const overflowText = document.createElement('span');
            overflowText.className = 'timeline-bar-overflow';
            overflowText.textContent = taskName;
            bar.appendChild(overflowText);
        } else {
            bar.textContent = taskName;
        }
        
        // ツールチップ設定（既存のまま）
        if (position.isUnscheduled) {
            bar.title = `${item.name}\n日程未定\n依存: ${item.dependencies.join(', ') || 'なし'}`;
        } else {
            const startDateStr = item.startDate || 'TBD';
            const endDateStr = item.endDate || 'TBD';
            bar.title = `${item.name}\n${startDateStr} ～ ${endDateStr}\n期間: ${position.duration}日`;
            
            if (!item.startDate || !item.endDate) {
                bar.style.opacity = '0.7';
                bar.style.border = '2px dashed rgba(255,255,255,0.8)';
            }
        }
    }
    
    console.log(`📊 バー作成: ${item.id} at (${position.left}, ${position.top})`);
    
    chartContainer.appendChild(bar);
}

/**
 * ドラッグ&ドロップ機能のセットアップ（完全修正版）
 */
function setupTimelineDragAndDrop(container) {
    console.log('🎛️ ドラッグ&ドロップセットアップ開始');
    
    // ドロップインジケーターを作成
    let dropIndicator = container.querySelector('.drop-indicator');
    if (!dropIndicator) {
        dropIndicator = document.createElement('div');
        dropIndicator.className = 'drop-indicator';
        container.appendChild(dropIndicator);
    }
    dragState.dropIndicator = dropIndicator;
    
    // メインのマウスダウンハンドラー
    function handleMouseDown(e) {
        // 既にドラッグ中の場合は無視
        if (dragState.isDragging) {
            console.log('⚠️ 既にドラッグ中のため無視');
            return;
        }
        
        const dragHandle = e.target.closest('.drag-handle');
        const itemRow = e.target.closest('.timeline-item-row');
        
        if (dragHandle && itemRow) {
            e.preventDefault();
            e.stopPropagation();
            
            // ドラッグ状態を設定
            dragState.isDragging = true;
            dragState.draggedElement = itemRow;
            dragState.draggedItemId = itemRow.getAttribute('data-item-id');
            dragState.originalIndex = parseInt(itemRow.getAttribute('data-index'));
            
            itemRow.classList.add('dragging');
            
            console.log('🎯 ドラッグ開始:', dragState.draggedItemId, 'インデックス:', dragState.originalIndex);
            
            // グローバルイベントリスナーを追加
            document.addEventListener('mousemove', handleMouseMove, { passive: false });
            document.addEventListener('mouseup', handleMouseUp, { once: true });
            
            // イベントリスナーを記録
            dragState.activeListeners.push(
                { element: document, event: 'mousemove', handler: handleMouseMove }
            );
        }
    }
    
    function handleMouseMove(e) {
        if (!dragState.isDragging || !dragState.draggedElement) return;
        
        e.preventDefault();
        
        // マウス位置でドロップ位置を計算
        const containerRect = container.getBoundingClientRect();
        const mouseY = e.clientY - containerRect.top;
        const rowHeight = 60;
        
        // 修正：ドラッグ中の要素を除いた行を取得
        const allRows = Array.from(container.querySelectorAll('.timeline-item-row:not(.dragging)'));
        
        // 修正：より精密なターゲットインデックス計算
        let targetIndex;
        
        if (mouseY < 0) {
            targetIndex = 0;
        } else if (mouseY >= allRows.length * rowHeight) {
            targetIndex = allRows.length;
        } else {
            // 各行の中央で区切りを判定
            targetIndex = Math.floor((mouseY + rowHeight / 2) / rowHeight);
            targetIndex = Math.max(0, Math.min(targetIndex, allRows.length));
        }
        
        // ドロップインジケーターを表示
        if (targetIndex >= 0 && targetIndex <= allRows.length) {
            if (targetIndex < allRows.length) {
                const targetRow = allRows[targetIndex];
                const targetRect = targetRow.getBoundingClientRect();
                const relativeTop = targetRect.top - containerRect.top;
                
                dropIndicator.style.top = relativeTop + 'px';
                dropIndicator.classList.add('show');
            } else {
                // 最後の要素の後に挿入
                if (allRows.length > 0) {
                    const lastRow = allRows[allRows.length - 1];
                    const lastRect = lastRow.getBoundingClientRect();
                    const relativeBottom = lastRect.bottom - containerRect.top;
                    dropIndicator.style.top = relativeBottom + 'px';
                    dropIndicator.classList.add('show');
                }
            }
            
            // 現在のターゲットインデックスを保存
            dragState.currentTargetIndex = targetIndex;
            
            console.log('🎯 ターゲットインデックス:', targetIndex, 'マウスY:', mouseY);
        } else {
            dropIndicator.classList.remove('show');
            dragState.currentTargetIndex = -1;
        }
    }
    
    function handleMouseUp(e) {
        if (!dragState.isDragging) return;
        
        console.log('📚 マウスアップ検出');
        
        // イベントリスナーを削除
        document.removeEventListener('mousemove', handleMouseMove);
        
        // ドロップ位置を確定
        let targetIndex = dragState.currentTargetIndex;
        
        // フォールバック：マウス位置から再計算（同じロジックを使用）
        if (targetIndex === undefined || targetIndex === -1) {
            const containerRect = container.getBoundingClientRect();
            const mouseY = e.clientY - containerRect.top;
            const rowHeight = 60;
            const allRows = container.querySelectorAll('.timeline-item-row:not(.dragging)');
            
            if (mouseY < 0) {
                targetIndex = 0;
            } else if (mouseY >= allRows.length * rowHeight) {
                targetIndex = allRows.length;
            } else {
                // handleMouseMoveと同じ計算方式
                targetIndex = Math.floor((mouseY + rowHeight / 2) / rowHeight);
                targetIndex = Math.max(0, Math.min(targetIndex, allRows.length));
            }
        }
        
        console.log('🔍 最終ターゲットインデックス:', targetIndex, '元のインデックス:', dragState.originalIndex);
        
        // 実際に位置が変わった場合のみ並び替えを実行
        if (targetIndex !== dragState.originalIndex && 
            dragState.draggedItemId && 
            targetIndex >= 0) {
            
            console.log('🔄 並び替え実行:', dragState.draggedItemId, dragState.originalIndex, '->', targetIndex);
            
            // 並び替えを実行
            const success = TimelineState.reorderTimelineItem(dragState.draggedItemId, dragState.originalIndex, targetIndex);
            
            if (success) {
                // UI状態をクリアしてから再描画
                cleanupDragState();
                
                // 並び替え後にタイムラインを再描画
                setTimeout(() => {
                    renderTimeline();
                }, 50);
            } else {
                console.error('❌ 並び替えに失敗しました');
                cleanupDragState();
            }
        } else {
            // 位置が変わらない場合はドラッグ状態だけクリア
            console.log('🔍 位置変更なし、ドラッグ状態をクリア');
            cleanupDragState();
        }
    }
    
    // ドラッグ状態のクリーンアップ
    function cleanupDragState() {
        if (dragState.draggedElement) {
            dragState.draggedElement.classList.remove('dragging');
        }
        if (dragState.dropIndicator) {
            dragState.dropIndicator.classList.remove('show');
        }
        
        // ドラッグ状態をリセット
        dragState.isDragging = false;
        dragState.draggedElement = null;
        dragState.draggedItemId = null;
        dragState.originalIndex = -1;
        dragState.currentTargetIndex = -1;
    }
    
    // コンテナにイベントリスナーを追加
    container.addEventListener('mousedown', handleMouseDown, { passive: false });
    
    // アクティブなイベントリスナーを記録
    dragState.activeListeners.push(
        { element: container, event: 'mousedown', handler: handleMouseDown }
    );
    
    console.log('✅ ドラッグ&ドロップセットアップ完了');
}


/**
 * リセットメニューの表示切り替え
 */
function toggleResetMenu() {
    const menu = document.getElementById('reset-menu');
    if (menu) {
        menu.classList.toggle('show');
    }
}

/**
 * タイムラインズーム設定
 */
function setTimelineZoom(zoom) {
    timelineState.zoom = zoom;
    
    document.querySelectorAll('.timeline-zoom-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    renderTimeline();
}

/**
 * タイムライングリッドの描画
 */
function renderTimelineGrid() {
    const gridContainer = document.getElementById('timeline-grid');
    if (!gridContainer) return;
    
    gridContainer.innerHTML = '';
    
    const totalDays = Math.ceil((timelineState.endDate - timelineState.startDate) / (1000 * 60 * 60 * 24));
    
    let gridInterval;
    switch (timelineState.zoom) {
        case 'day': gridInterval = 7; break;
        case 'week': gridInterval = 7; break;
        case 'month': gridInterval = 30; break;
    }
    
    let dayOffset = 0;
    if (timelineState.zoom === 'week' || timelineState.zoom === 'day') {
        const startDate = TimelineCalculator.getMondayOfWeek(timelineState.startDate);
        dayOffset = Math.floor((startDate - timelineState.startDate) / (1000 * 60 * 60 * 24));
    }
    
    for (let i = dayOffset; i <= totalDays; i += gridInterval) {
        const leftPosition = i * timelineState.pixelsPerDay;
        
        const line = document.createElement('div');
        line.className = 'timeline-grid-line';
        line.style.left = leftPosition + 'px';
        
        gridContainer.appendChild(line);
    }
    
    // 修正: グリッドコンテナの幅もヘッダー・コンテンツと同期
    const totalWidth = Math.max(totalDays * timelineState.pixelsPerDay + 200, 1200);
    gridContainer.style.width = totalWidth + 'px';
    gridContainer.style.minWidth = totalWidth + 'px';
    gridContainer.style.position = 'absolute';
    gridContainer.style.top = '0';
    gridContainer.style.left = '0';
    gridContainer.style.height = '100%';
    
    console.log(`🔧 グリッド幅設定: ${totalWidth}px`);
}

/**
 * 今日ラインの描画
 */
function renderTimelineToday() {
    const todayLine = document.getElementById('timeline-today-line');
    if (!todayLine) return;
    
    const today = new Date();
    const daysSinceStart = Math.floor((today - timelineState.startDate) / (1000 * 60 * 60 * 24));
    
    if (daysSinceStart >= 0) {
        todayLine.style.left = (daysSinceStart * timelineState.pixelsPerDay) + 'px';
        todayLine.style.display = 'block';
        
        // 今日ラインの高さも設定
        todayLine.style.height = '100%';
        
        console.log(`🔍 今日ライン位置: ${daysSinceStart * timelineState.pixelsPerDay}px`);
    } else {
        todayLine.style.display = 'none';
    }
}

/**
 * 改良版：Asanaスタイルのタイムライン依存関係矢印描画
 */
function renderTimelineDependencies() {
    console.log('🎯 依存関係矢印の描画開始 (Asanaスタイル)');
    
    const chartContainer = document.getElementById('timeline-chart');
    if (!chartContainer) {
        console.error('❌ timeline-chartコンテナが見つかりません');
        return;
    }
    
    // timeline-bar要素の存在確認
    const timelineBars = chartContainer.querySelectorAll('.timeline-bar');
    console.log('🔍 timeline-bar要素数:', timelineBars.length);
    
    if (timelineBars.length === 0) {
        console.warn('⚠️ timeline-bar要素が存在しません。依存関係矢印をスキップします。');
        return;
    }
    
    // 既存のSVGを削除
    const existingSvg = chartContainer.querySelector('.timeline-dependencies-svg');
    if (existingSvg) {
        existingSvg.remove();
    }
    
    // SVGコンテナを作成（背景レイヤー）
    const svgContainer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgContainer.setAttribute('class', 'timeline-dependencies-svg');
    svgContainer.style.position = 'absolute';
    svgContainer.style.top = '0';
    svgContainer.style.left = '0';
    svgContainer.style.width = '100%';
    svgContainer.style.height = '100%';
    svgContainer.style.pointerEvents = 'none';
    svgContainer.style.zIndex = '1';
    
    // 矢印マーカーを定義（複数色対応）
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    
    const normalMarker = createArrowMarker('timeline-arrow-normal', '#90a4ae');
    defs.appendChild(normalMarker);
    
    const conflictMarker = createArrowMarker('timeline-arrow-conflict', '#f44336');
    defs.appendChild(conflictMarker);
    
    const hoverMarker = createArrowMarker('timeline-arrow-hover', '#2196f3');
    defs.appendChild(hoverMarker);
    
    svgContainer.appendChild(defs);
    
    chartContainer.insertBefore(svgContainer, chartContainer.firstChild);
    
    const orderedItems = TimelineState.getOrderedTimelineItems();
    
    console.log('📋 全項目数:', orderedItems.length);
    
    let arrowCount = 0;
    let skippedCount = 0;
    
    orderedItems.forEach((item, toIndex) => {
        if (!item.dependencies || item.dependencies.length === 0) return;
        
        item.dependencies.forEach((depId, depIndex) => {
            const fromIndex = orderedItems.findIndex(i => i.id === depId);
            if (fromIndex === -1) {
                console.warn('⚠️ 依存関係のアイテムが見つかりません:', depId);
                skippedCount++;
                return;
            }
            
            const fromItem = orderedItems[fromIndex];
            
            const coordinates = getAccurateCoordinates(fromItem, item, fromIndex, toIndex, depIndex);
            
            if (coordinates) {
                const hasTimingConflict = TimelineCalculator.checkTimingConflict(fromItem, item);
                createTimelineDependencyArrow(svgContainer, coordinates, fromItem, item, hasTimingConflict);
                arrowCount++;
                console.log(`🎨 矢印作成: ${fromItem.id} -> ${item.id}`);
            } else {
                skippedCount++;
                console.warn(`❌ 座標取得失敗: ${fromItem.id} -> ${item.id}`);
            }
        });
    });
    
    console.log(`✅ 依存関係矢印の描画完了: ${arrowCount}本の矢印を作成, ${skippedCount}本をスキップ`);
}

/**
 * 矢印マーカー作成ヘルパー関数
 */
function createArrowMarker(id, color) {
    const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
    marker.setAttribute('id', id);
    marker.setAttribute('markerWidth', '8');
    marker.setAttribute('markerHeight', '6');
    marker.setAttribute('refX', '7');
    marker.setAttribute('refY', '3');
    marker.setAttribute('orient', 'auto');
    marker.setAttribute('markerUnits', 'strokeWidth');
    
    const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    polygon.setAttribute('points', '0 0, 8 3, 0 6');
    polygon.setAttribute('fill', color);
    
    marker.appendChild(polygon);
    return marker;
}



/**
 * Asanaスタイルの依存関係矢印作成
 */
function createTimelineDependencyArrow(svgContainer, coordinates, fromItem, toItem, hasConflict) {
    const { fromX, fromY, toX, toY } = coordinates;
    
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    
    let pathData;
    const horizontalDistance = toX - fromX;
    const verticalDistance = toY - fromY;
    
    if (Math.abs(verticalDistance) < 5) {
        pathData = `M ${fromX} ${fromY} L ${toX} ${toY}`;
    } else if (horizontalDistance > 20) {
        const midX = fromX + Math.min(horizontalDistance / 2, 30);
        pathData = `M ${fromX} ${fromY} L ${midX} ${fromY} L ${midX} ${toY} L ${toX} ${toY}`;
    } else {
        pathData = `M ${fromX} ${fromY} L ${toX} ${toY}`;
    }
    
    const strokeColor = hasConflict ? '#f44336' : '#90a4ae';
    const markerUrl = hasConflict ? 'url(#timeline-arrow-conflict)' : 'url(#timeline-arrow-normal)';
    
    path.setAttribute('d', pathData);
    path.setAttribute('stroke', strokeColor);
    path.setAttribute('stroke-width', '1.5');
    path.setAttribute('fill', 'none');
    path.setAttribute('marker-end', markerUrl);
    path.setAttribute('class', 'timeline-dependency-arrow');
    path.setAttribute('opacity', '0.7');
    
    path.style.transition = 'all 0.2s ease';
    path.style.pointerEvents = 'all';
    path.style.cursor = 'pointer';
    
    path.setAttribute('data-from-id', fromItem.id);
    path.setAttribute('data-to-id', toItem.id);
    path.setAttribute('data-has-conflict', hasConflict.toString());
    
    path.addEventListener('mouseenter', (e) => {
        path.setAttribute('stroke', '#2196f3');
        path.setAttribute('stroke-width', '2.5');
        path.setAttribute('opacity', '1');
        path.setAttribute('marker-end', 'url(#timeline-arrow-hover)');
        showDependencyTooltip(e, fromItem, toItem, hasConflict);
    });
    
    path.addEventListener('mouseleave', () => {
        const originalColor = hasConflict ? '#f44336' : '#90a4ae';
        const originalMarker = hasConflict ? 'url(#timeline-arrow-conflict)' : 'url(#timeline-arrow-normal)';
        
        path.setAttribute('stroke', originalColor);
        path.setAttribute('stroke-width', '1.5');
        path.setAttribute('opacity', '0.7');
        path.setAttribute('marker-end', originalMarker);
        if (window.hideTooltip) {
            hideTooltip();
        }
    });
    
    path.style.opacity = '0';
    svgContainer.appendChild(path);
    
    setTimeout(() => {
        path.style.transition = 'opacity 0.3s ease';
        path.style.opacity = '0.7';
    }, 50);
}

/**
 * 依存関係ツールチップ表示
 */
function showDependencyTooltip(event, fromItem, toItem, hasConflict) {
    const tooltip = document.getElementById('tooltip');
    if (!tooltip) return;
    
    const conflictWarning = hasConflict ? 
        '<div class="tooltip-warning">⚠️ タイミング競合あり</div>' : '';
    
    tooltip.innerHTML = `
        <div class="tooltip-title">依存関係</div>
        <div class="tooltip-detail"><strong>From:</strong> ${fromItem.name} (${fromItem.id})</div>
        <div class="tooltip-detail"><strong>To:</strong> ${toItem.name} (${toItem.id})</div>
        ${conflictWarning}
        <div class="tooltip-detail">
            ${fromItem.name}が完了してから${toItem.name}が開始できます
        </div>
    `;
    
    tooltip.style.left = event.pageX + 10 + 'px';
    tooltip.style.top = event.pageY + 10 + 'px';
    tooltip.classList.add('show');
}

// 🆕 月表示専用のヘッダー描画関数
function renderMonthlyHeader(datesContainer, totalDays) {
    console.log('📅 月表示ヘッダー描画開始');
    
    const seenMonths = new Set(); // 重複防止用
    let currentDate = new Date(timelineState.startDate);
    
    // 月の1日に調整
    currentDate.setDate(1);
    
    const monthElements = [];
    
    while (currentDate <= timelineState.endDate) {
        const monthKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}`;
        
        // 重複チェック
        if (!seenMonths.has(monthKey)) {
            seenMonths.add(monthKey);
            
            const daysSinceStart = Math.floor((currentDate - timelineState.startDate) / (1000 * 60 * 60 * 24));
            
            // 負の値を0にクランプ
            const leftPosition = Math.max(0, daysSinceStart * timelineState.pixelsPerDay);
            
            const dateElement = document.createElement('div');
            dateElement.className = 'timeline-month-header';
            dateElement.style.position = 'absolute';
            dateElement.style.left = leftPosition + 'px';
            dateElement.style.width = '100px'; // 月表示の固定幅
            dateElement.style.textAlign = 'center';
            dateElement.style.borderRight = '1px solid #e1e5e9';
            dateElement.style.padding = '8px 4px';
            dateElement.style.fontSize = '11px';
            dateElement.style.whiteSpace = 'nowrap';
            dateElement.style.overflow = 'hidden';
            dateElement.style.background = '#fff';
            dateElement.textContent = `${currentDate.getFullYear()}/${currentDate.getMonth() + 1}`;
            
            monthElements.push({
                element: dateElement,
                position: leftPosition,
                monthKey: monthKey
            });
            
            console.log(`📅 月要素作成: ${currentDate.getFullYear()}/${currentDate.getMonth() + 1} at ${leftPosition}px`);
        }
        
        // 次の月の1日に移動
        currentDate.setMonth(currentDate.getMonth() + 1);
        currentDate.setDate(1); // 確実に1日に設定
    }
    
    // 作成した月要素をDOMに追加
    monthElements.forEach(item => {
        datesContainer.appendChild(item.element);
    });
    
    // **修正: 統一した幅設定**
    const totalWidth = Math.max(totalDays * timelineState.pixelsPerDay + 200, 1200);
    datesContainer.style.width = totalWidth + 'px';
    datesContainer.style.minWidth = totalWidth + 'px';
    datesContainer.style.height = '50px';
    datesContainer.style.background = '#fff';
    
    // **重要: 親コンテナにも同じ幅を設定**
    const timelineContainer = document.getElementById('timeline-container');
    if (timelineContainer) {
        timelineContainer.style.overflowX = 'auto';
        timelineContainer.style.overflowY = 'auto';
    }
    
    console.log(`✅ 月表示ヘッダー完了: ${monthElements.length}個の月要素, 幅: ${totalWidth}px`);
}

// エクスポート（他のファイルから使用可能にする）
window.renderTimeline = renderTimeline;
window.setTimelineZoom = setTimelineZoom;
window.resetTimelineOrder = resetTimelineOrder;
window.toggleResetMenu = toggleResetMenu;