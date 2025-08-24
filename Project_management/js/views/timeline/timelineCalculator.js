// timelineCalculator.js - タイムライン計算処理専門モジュール

/**
 * タイムライン期間の計算（状態管理から分離）
 */
function calculateTimelineRange() {
    console.log('🧮 タイムライン期間計算開始');
    
    const allItems = [...projectData.milestones, ...projectData.tasks];
    
    let minDate = new Date();
    let maxDate = new Date();
    let hasAnyDate = false;
    
    allItems.forEach(item => {
        if (item.startDate) {
            const start = new Date(item.startDate);
            if (!hasAnyDate || start < minDate) {
                minDate = start;
                hasAnyDate = true;
            }
        }
        if (item.endDate) {
            const end = new Date(item.endDate);
            if (!hasAnyDate || end > maxDate) {
                maxDate = end;
                hasAnyDate = true;
            }
            if (!hasAnyDate || end < minDate) {
                minDate = end;
                hasAnyDate = true;
            }
        }
    });
    
    // 日程が設定されているアイテムがない場合のデフォルト範囲
    if (!hasAnyDate) {
        minDate = new Date();
        maxDate = new Date();
        maxDate.setMonth(maxDate.getMonth() + 6); // 6ヶ月後まで
    }
    
    // 未定アイテム用のスペースを確保（右端に追加）
    minDate.setDate(minDate.getDate() - 7);
    maxDate.setDate(maxDate.getDate() + 90); // 未定エリア用に90日追加
    
    timelineState.startDate = minDate;
    timelineState.endDate = maxDate;
    
    const totalDays = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24));
    
    // ピクセル/日の計算を調整（横スクロール前提）
    switch (timelineState.zoom) {
        case 'day':
            timelineState.pixelsPerDay = 30; // 固定値で見やすく
            break;
        case 'week':
            timelineState.pixelsPerDay = 8;
            break;
        case 'month':
            timelineState.pixelsPerDay = 3;
            break;
    }
    
    console.log(`🧮 期間計算完了: ${totalDays}日, ピクセル/日: ${timelineState.pixelsPerDay}`);
    
    return {
        startDate: minDate,
        endDate: maxDate,
        totalDays: totalDays,
        pixelsPerDay: timelineState.pixelsPerDay
    };
}

/**
 * 指定日付の週の開始日（月曜日）を取得
 */
function getMondayOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 日曜日は-6、その他は1を加算
    d.setDate(diff);
    return d;
}

/**
 * 日付差分を日数で計算
 */
function getDateDifferenceInDays(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
}

/**
 * 指定日付のタイムライン上のピクセル位置を計算
 */
function getPixelPosition(date) {
    if (!timelineState.startDate) {
        console.warn('⚠️ timelineState.startDateが設定されていません');
        return 0;
    }
    
    const targetDate = new Date(date);
    const daysSinceStart = Math.floor((targetDate - timelineState.startDate) / (1000 * 60 * 60 * 24));
    return daysSinceStart * timelineState.pixelsPerDay;
}

/**
 * タイムライン開始日からの日数を計算
 */
function getDaysSinceStart(date) {
    if (!timelineState.startDate) {
        console.warn('⚠️ timelineState.startDateが設定されていません');
        return 0;
    }
    
    const targetDate = new Date(date);
    return Math.floor((targetDate - timelineState.startDate) / (1000 * 60 * 60 * 24));
}

/**
 * アイテムのバー位置とサイズを計算
 */
function calculateBarPosition(item, rowIndex) {
    console.log(`🧮 バー位置計算: ${item.id} (行${rowIndex})`);
    
    let startDate, endDate, daysSinceStart, duration;
    const isUnscheduled = !item.startDate && !item.endDate;
    
    if (isUnscheduled) {
        // 日程未定の場合の特別処理
        const totalDays = Math.ceil((timelineState.endDate - timelineState.startDate) / (1000 * 60 * 60 * 24));
        
        if (item.type === 'milestone') {
            daysSinceStart = totalDays - 30; // 右端から30日前
        } else {
            daysSinceStart = totalDays - 50; // 右端から50日前
            duration = 20; // デフォルト期間
        }
    } else if (item.type === 'milestone') {
        if (!item.endDate) {
            // マイルストーンで日程未定
            const totalDays = Math.ceil((timelineState.endDate - timelineState.startDate) / (1000 * 60 * 60 * 24));
            daysSinceStart = totalDays - 30;
        } else {
            endDate = new Date(item.endDate);
            daysSinceStart = Math.floor((endDate - timelineState.startDate) / (1000 * 60 * 60 * 24));
        }
    } else {
        // タスクの場合の処理を改善
        if (item.startDate && item.endDate) {
            startDate = new Date(item.startDate);
            endDate = new Date(item.endDate);
        } else if (item.endDate) {
            // 終了日のみ設定されている場合
            endDate = new Date(item.endDate);
            startDate = new Date(endDate);
            startDate.setDate(startDate.getDate() - 7); // デフォルト期間7日
        } else if (item.startDate) {
            // 開始日のみ設定されている場合
            startDate = new Date(item.startDate);
            endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 7); // デフォルト期間7日
        } else {
            // 両方未定の場合は右端に表示
            const totalDays = Math.ceil((timelineState.endDate - timelineState.startDate) / (1000 * 60 * 60 * 24));
            daysSinceStart = totalDays - 50;
            duration = 20;
        }
        
        if (startDate && endDate) {
            daysSinceStart = Math.floor((startDate - timelineState.startDate) / (1000 * 60 * 60 * 24));
            duration = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));
            
            if (duration <= 0) {
                duration = 1;
            }
        }
    }
    
    const left = daysSinceStart * timelineState.pixelsPerDay;
    const rowHeight = 60;
    const barHeight = item.type === 'milestone' ? 24 : 24;
    const top = rowIndex * rowHeight + (rowHeight - barHeight) / 2;
    
    const result = {
        left: left,
        top: top,
        width: duration ? duration * timelineState.pixelsPerDay : null,
        daysSinceStart: daysSinceStart,
        duration: duration,
        isUnscheduled: isUnscheduled
    };
    
    console.log(`🧮 バー位置計算結果: ${item.id} → (${left}, ${top}) 幅:${result.width}`);
    
    return result;
}

/**
 * 正確な座標計算（DOMベース）- 修正版
 */
function getAccurateCoordinates(fromItem, toItem, fromIndex, toIndex, depIndex) {
    console.log(`🎯 座標計算開始: ${fromItem.id} → ${toItem.id}`);
    
    try {
        const fromBar = document.querySelector(`.timeline-bar[data-item-id="${fromItem.id}"]`);
        const toBar = document.querySelector(`.timeline-bar[data-item-id="${toItem.id}"]`);
        
        if (!fromBar || !toBar) {
            console.warn('⚠️ timeline-bar要素が見つかりません:', fromItem.id, toItem.id);
            console.log('🔍 利用可能なtimeline-bar要素:', 
                Array.from(document.querySelectorAll('.timeline-bar')).map(el => el.getAttribute('data-item-id')));
            return null;
        }
        
        const fromRect = fromBar.getBoundingClientRect();
        const toRect = toBar.getBoundingClientRect();
        const chartContainer = document.getElementById('timeline-chart');
        const chartRect = chartContainer.getBoundingClientRect();
        
        // 修正: スクロール位置を考慮した座標計算
        const scrollLeft = chartContainer.scrollLeft || 0;
        const scrollTop = chartContainer.scrollTop || 0;
        
        let fromX, fromY, toX, toY;
        
        if (fromItem.type === 'milestone') {
            fromX = fromRect.left + fromRect.width / 2 - chartRect.left + scrollLeft;
            fromY = fromRect.top + fromRect.height / 2 - chartRect.top + scrollTop;
        } else {
            fromX = fromRect.right - chartRect.left + scrollLeft;
            fromY = fromRect.top + fromRect.height / 2 - chartRect.top + scrollTop;
        }
        
        if (toItem.type === 'milestone') {
            toX = toRect.left - chartRect.left + scrollLeft;
            toY = toRect.top + toRect.height / 2 - chartRect.top + scrollTop;
        } else {
            toX = toRect.left - chartRect.left + scrollLeft;
            toY = toRect.top + toRect.height / 2 - chartRect.top + scrollTop;
        }
        
        const verticalOffset = (depIndex * 3) - 1;
        fromY += verticalOffset;
        toY += verticalOffset;
        
        console.log(`🎯 座標計算成功: ${fromItem.id}(${fromX},${fromY}) → ${toItem.id}(${toX},${toY})`);
        
        return { fromX, fromY, toX, toY };
        
    } catch (error) {
        console.error('❌ 座標計算エラー:', error);
        return null;
    }
}

/**
 * タイミング競合チェック
 */
function checkTimingConflict(fromItem, toItem) {
    if (!fromItem.endDate || !toItem.startDate) return false;
    
    const fromEndDate = new Date(fromItem.endDate);
    const toStartDate = new Date(toItem.startDate);
    
    return fromEndDate >= toStartDate;
}

/**
 * 日付範囲の妥当性検証
 */
function validateDateRange(startDate, endDate) {
    if (!startDate || !endDate) return false;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // 無効な日付のチェック
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return false;
    }
    
    // 終了日が開始日より前でないかチェック
    return start <= end;
}

/**
 * ズームレベルに応じたグリッド間隔を計算 - 修正版
 */
function calculateGridInterval() {
    let gridInterval;
    switch (timelineState.zoom) {
        case 'day': 
            gridInterval = 1; // 日単位に変更
            break;
        case 'week': 
            gridInterval = 7; 
            break;
        case 'month': 
            gridInterval = 30; 
            break;
        default:
            gridInterval = 7;
    }
    return gridInterval;
}

/**
 * 日付フォーマット関数（ズームレベル対応）
 */
function getDateFormat() {
    switch (timelineState.zoom) {
        case 'day':
        case 'week':
            return (date) => `${date.getMonth() + 1}/${date.getDate()}`;
        case 'month':
            return (date) => `${date.getFullYear()}/${date.getMonth() + 1}`;
        default:
            return (date) => `${date.getMonth() + 1}/${date.getDate()}`;
    }
}

/**
 * タイムライン全体の幅を計算
 */
function calculateTotalTimelineWidth() {
    if (!timelineState.startDate || !timelineState.endDate) {
        console.warn('⚠️ タイムライン日付範囲が設定されていません');
        return 1200; // デフォルト幅
    }
    
    const totalDays = Math.ceil((timelineState.endDate - timelineState.startDate) / (1000 * 60 * 60 * 24));
    const calculatedWidth = totalDays * timelineState.pixelsPerDay + 200;
    const minWidth = 1200;
    
    const totalWidth = Math.max(calculatedWidth, minWidth);
    
    console.log(`🧮 タイムライン幅計算: ${totalWidth}px (${totalDays}日 × ${timelineState.pixelsPerDay}px/日)`);
    
    return totalWidth;
}

/**
 * 月表示のグリッド生成修正版
 */
function generateMonthlyGridLabels() {
    const labels = [];
    const seenMonths = new Set(); // 重複防止用
    
    let currentDate = new Date(timelineState.startDate);
    
    // 月の最初の日に調整
    currentDate.setDate(1);
    
    while (currentDate <= timelineState.endDate) {
        const monthKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}`;
        
        // 重複チェック
        if (!seenMonths.has(monthKey)) {
            seenMonths.add(monthKey);
            
            const daysSinceStart = Math.floor(
                (currentDate - timelineState.startDate) / (1000 * 60 * 60 * 24)
            );
            
            const pixelPosition = daysSinceStart * timelineState.pixelsPerDay;
            
            labels.push({
                date: new Date(currentDate),
                position: pixelPosition,
                label: `${currentDate.getFullYear()}/${currentDate.getMonth() + 1}`,
                key: monthKey
            });
        }
        
        // 次の月の1日に移動
        currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    return labels;
}

/**
 * 週単位のグリッドラベル生成
 */
function generateWeeklyGridLabels() {
    const labels = [];
    let currentDate = getMondayOfWeek(timelineState.startDate);
    
    while (currentDate <= timelineState.endDate) {
        const daysSinceStart = Math.floor(
            (currentDate - timelineState.startDate) / (1000 * 60 * 60 * 24)
        );
        
        const pixelPosition = daysSinceStart * timelineState.pixelsPerDay;
        
        labels.push({
            date: new Date(currentDate),
            position: pixelPosition,
            label: `${currentDate.getMonth() + 1}/${currentDate.getDate()}`,
            key: `${currentDate.getFullYear()}-${currentDate.getMonth()}-${currentDate.getDate()}`
        });
        
        // 次の週（7日後）に移動
        currentDate.setDate(currentDate.getDate() + 7);
    }
    
    return labels;
}

/**
 * 日単位のグリッドラベル生成
 */
function generateDailyGridLabels() {
    const labels = [];
    let currentDate = new Date(timelineState.startDate);
    
    while (currentDate <= timelineState.endDate) {
        const daysSinceStart = Math.floor(
            (currentDate - timelineState.startDate) / (1000 * 60 * 60 * 24)
        );
        
        const pixelPosition = daysSinceStart * timelineState.pixelsPerDay;
        
        // 週末をスキップするオプション（必要に応じて）
        const dayOfWeek = currentDate.getDay();
        
        labels.push({
            date: new Date(currentDate),
            position: pixelPosition,
            label: `${currentDate.getMonth() + 1}/${currentDate.getDate()}`,
            key: `${currentDate.getFullYear()}-${currentDate.getMonth()}-${currentDate.getDate()}`,
            isWeekend: dayOfWeek === 0 || dayOfWeek === 6
        });
        
        // 次の日に移動
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return labels;
}

/**
 * ズームレベル対応の日付ラベル生成
 */
function generateDateLabels() {
    const labels = [];
    
    switch (timelineState.zoom) {
        case 'month':
            return generateMonthlyGridLabels();
            
        case 'week':
            return generateWeeklyGridLabels();
            
        case 'day':
            return generateDailyGridLabels();
            
        default:
            return generateWeeklyGridLabels();
    }
}

/**
 * グリッド描画の座標計算
 */
function calculateGridLinePositions() {
    const gridLines = [];
    const labels = generateDateLabels();
    
    labels.forEach(labelInfo => {
        gridLines.push({
            x: labelInfo.position,
            label: labelInfo.label,
            date: labelInfo.date,
            isPrimary: true // メインのグリッドライン
        });
        
        // サブグリッドライン（必要に応じて）
        if (timelineState.zoom === 'month') {
            // 月表示の場合、週単位のサブグリッドを追加
            for (let week = 1; week < 4; week++) {
                const subDate = new Date(labelInfo.date);
                subDate.setDate(subDate.getDate() + (week * 7));
                
                if (subDate <= timelineState.endDate) {
                    const subPosition = labelInfo.position + (week * 7 * timelineState.pixelsPerDay);
                    gridLines.push({
                        x: subPosition,
                        label: '',
                        date: subDate,
                        isPrimary: false // サブグリッドライン
                    });
                }
            }
        }
    });
    
    return gridLines;
}

/**
 * タイムライン表示状態のリセット
 */
function resetTimelineDisplay() {
    console.log('🔄 タイムライン表示をリセット中...');
    
    // キャッシュクリア
    if (window.TimelineCalculator && window.TimelineCalculator.cache) {
        window.TimelineCalculator.cache.clear();
    }
    
    // 期間再計算
    calculateTimelineRange();
    
    console.log('✅ タイムライン表示リセット完了');
}

/**
 * 座標計算のキャッシュシステム
 */
const calculationCache = {
    coordinates: new Map(),
    positions: new Map(),
    
    // キャッシュをクリア
    clear() {
        this.coordinates.clear();
        this.positions.clear();
        console.log('🧹 計算キャッシュをクリアしました');
    },
    
    // 座標キャッシュのキー生成
    getCoordinateKey(fromId, toId, depIndex) {
        return `${fromId}->${toId}-${depIndex}`;
    },
    
    // 位置キャッシュのキー生成
    getPositionKey(itemId, rowIndex) {
        return `${itemId}-${rowIndex}`;
    }
};

/**
 * パフォーマンス計測ヘルパー
 */
function measureCalculationTime(calculationName, calculationFunction) {
    const startTime = performance.now();
    const result = calculationFunction();
    const endTime = performance.now();
    
    console.log(`⏱️ ${calculationName}: ${(endTime - startTime).toFixed(2)}ms`);
    
    return result;
}

// エクスポート - 計算関連の関数を外部から使用可能にする
window.TimelineCalculator = {
    // 期間・日付計算
    calculateTimelineRange,
    getMondayOfWeek,
    getDateDifferenceInDays,
    getPixelPosition,
    getDaysSinceStart,
    
    // 位置・座標計算
    calculateBarPosition,
    getAccurateCoordinates,
    calculateTotalTimelineWidth,
    
    // 競合・検証
    checkTimingConflict,
    validateDateRange,
    
    // グリッド・フォーマット
    calculateGridInterval,
    getDateFormat,
    generateDateLabels,
    generateMonthlyGridLabels,
    generateWeeklyGridLabels,
    generateDailyGridLabels,
    calculateGridLinePositions,
    
    // ユーティリティ
    resetTimelineDisplay,
    
    // キャッシュ管理
    cache: calculationCache,
    measureCalculationTime
};

// 後方互換性のため個別の関数もエクスポート
window.calculateTimelineRange = calculateTimelineRange;
window.getMondayOfWeek = getMondayOfWeek;
window.getAccurateCoordinates = getAccurateCoordinates;
window.checkTimingConflict = checkTimingConflict;