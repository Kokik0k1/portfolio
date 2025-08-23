// データ管理
let projectData = {
    milestones: [
        {
            id: 'M1',
            name: 'プロジェクト開始',
            status: 'completed',
            endDate: '2024-01-15',
            dependencies: [],
            description: 'プロジェクトキックオフミーティング'
        },
        {
            id: 'M2',
            name: '設計完了',
            status: 'completed',
            endDate: '2024-02-28',
            dependencies: ['T1', 'T2'],
            description: 'システム設計とUI設計の完了'
        },
        {
            id: 'M3',
            name: 'リリース',
            status: 'not-started',
            endDate: '2024-06-30',
            dependencies: ['T5', 'T6'],
            description: '本番環境へのリリース'
        }
    ],
    tasks: [
        {
            id: 'T1',
            name: '要件分析',
            status: 'completed',
            startDate: '2024-01-16',
            endDate: '2024-02-15',
            dependencies: ['M1'],
            description: 'システム要件の分析と整理'
        },
        {
            id: 'T2',
            name: 'UI設計',
            status: 'completed',
            startDate: '2024-02-01',
            endDate: '2024-02-28',
            dependencies: ['T1'],
            description: 'ユーザーインターフェースの設計'
        },
        {
            id: 'T3',
            name: 'バックエンド開発',
            status: 'in-progress',
            startDate: '2024-03-01',
            endDate: '2024-04-30',
            dependencies: ['M2'],
            description: 'サーバーサイドの実装'
        },
        {
            id: 'T4',
            name: 'フロントエンド開発',
            status: 'in-progress',
            startDate: '2024-03-15',
            endDate: '2024-05-15',
            dependencies: ['T2'],
            description: 'クライアントサイドの実装'
        },
        {
            id: 'T5',
            name: 'テスト',
            status: 'not-started',
            startDate: '2024-05-01',
            endDate: '2024-06-15',
            dependencies: ['T3', 'T4'],
            description: '統合テストと品質確認'
        },
        {
            id: 'T6',
            name: 'デプロイ準備',
            status: 'not-started',
            startDate: '2024-06-16',
            endDate: '2024-06-29',
            dependencies: ['T5'],
            description: '本番環境へのデプロイ準備'
        }
    ]
};

// グラフの状態管理
let graphState = {
    scale: 1,
    translateX: 0,
    translateY: 0,
    isDragging: false,
    dragStart: { x: 0, y: 0 }
};

let nodePositions = {};

// タイムラインの状態管理
let timelineState = {
    zoom: 'month',
    startDate: null,
    endDate: null,
    pixelsPerDay: 3
};

// 出力関連の変数
let currentExportFormat = '';
let currentExportData = '';

// ビュー切り替え
function showView(viewName) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(viewName + '-view').classList.add('active');
    event.target.classList.add('active');
    
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

// データ出力機能
function toggleExportMenu() {
    const menu = document.getElementById('export-menu');
    menu.classList.toggle('show');
}

function exportData(format) {
    currentExportFormat = format;
    let exportData = '';
    let modalTitle = '';
    
    const allItems = [
        ...projectData.milestones.map(m => ({...m, type: 'milestone'})),
        ...projectData.tasks.map(t => ({...t, type: 'task'}))
    ];
    
    switch (format) {
        case 'json':
            exportData = JSON.stringify({
                exportDate: new Date().toISOString(),
                milestones: projectData.milestones,
                tasks: projectData.tasks
            }, null, 2);
            modalTitle = 'JSON形式でのデータ出力';
            break;
            
        case 'yaml':
            exportData = generateYAML({
                exportDate: new Date().toISOString(),
                milestones: projectData.milestones,
                tasks: projectData.tasks
            });
            modalTitle = 'YAML形式でのデータ出力';
            break;
            
        case 'tsv':
            exportData = generateTSV(allItems);
            modalTitle = 'TSV形式でのデータ出力（スプレッドシート用）';
            break;
    }
    
    currentExportData = exportData;
    
    document.getElementById('export-modal-title').textContent = modalTitle;
    document.getElementById('export-data-content').textContent = exportData;
    document.getElementById('export-modal').style.display = 'block';
    document.getElementById('export-menu').classList.remove('show');
}

// YAML生成関数
function generateYAML(data) {
    let yaml = `# プロジェクトデータ出力\n`;
    yaml += `exportDate: "${data.exportDate}"\n\n`;
    
    yaml += `milestones:\n`;
    data.milestones.forEach(m => {
        yaml += `  - id: "${m.id}"\n`;
        yaml += `    name: "${m.name}"\n`;
        yaml += `    status: "${m.status}"\n`;
        yaml += `    endDate: "${m.endDate}"\n`;
        yaml += `    dependencies: [${m.dependencies.map(d => `"${d}"`).join(', ')}]\n`;
        yaml += `    description: "${m.description || ''}"\n\n`;
    });
    
    yaml += `tasks:\n`;
    data.tasks.forEach(t => {
        yaml += `  - id: "${t.id}"\n`;
        yaml += `    name: "${t.name}"\n`;
        yaml += `    status: "${t.status}"\n`;
        yaml += `    startDate: "${t.startDate || ''}"\n`;
        yaml += `    endDate: "${t.endDate}"\n`;
        yaml += `    dependencies: [${t.dependencies.map(d => `"${d}"`).join(', ')}]\n`;
        yaml += `    description: "${t.description || ''}"\n\n`;
    });
    
    return yaml;
}

// TSV生成関数
function generateTSV(allItems) {
    const headers = ['種類', 'ID', '名前', 'ステータス', '開始日', '終了日/期日', '依存関係', '説明'];
    let tsv = headers.join('\t') + '\n';
    
    allItems.forEach(item => {
        const statusText = item.type === 'milestone' ? 'マイルストーン' : 
                          item.status === 'not-started' ? '未開始' :
                          item.status === 'in-progress' ? '進行中' : '完了';
        
        const dependencies = item.dependencies.join(', ');
        const startDate = item.startDate || '';
        const description = (item.description || '').replace(/\t/g, ' ').replace(/\n/g, ' ');
        
        const row = [
            item.type === 'milestone' ? 'マイルストーン' : 'タスク',
            item.id,
            item.name,
            statusText,
            startDate,
            item.endDate,
            dependencies,
            description
        ];
        
        tsv += row.join('\t') + '\n';
    });
    
    return tsv;
}

// クリップボードにコピー
function copyToClipboard() {
    navigator.clipboard.writeText(currentExportData).then(() => {
        const btn = document.getElementById('copy-btn');
        btn.textContent = 'コピー完了！';
        btn.classList.add('copied');
        
        setTimeout(() => {
            btn.textContent = 'クリップボードにコピー';
            btn.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        alert('コピーに失敗しました: ' + err);
    });
}

// ファイルダウンロード
function downloadFile() {
    const extensions = {
        'json': 'json',
        'yaml': 'yml',
        'tsv': 'tsv'
    };
    
    const mimeTypes = {
        'json': 'application/json',
        'yaml': 'text/yaml',
        'tsv': 'text/tab-separated-values'
    };
    
    const today = new Date().toISOString().split('T')[0];
    const filename = `project_data_${today}.${extensions[currentExportFormat]}`;
    
    const blob = new Blob([currentExportData], { 
        type: mimeTypes[currentExportFormat] + ';charset=utf-8;' 
    });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    
    URL.revokeObjectURL(link.href);
}

function closeExportModal() {
    document.getElementById('export-modal').style.display = 'none';
}

// テーブル表示の更新
function updateTable() {
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = '';
    
    // マイルストーンを追加
    projectData.milestones.forEach(item => {
        const row = createTableRow(item, 'milestone');
        tbody.appendChild(row);
    });
    
    // タスクを追加
    projectData.tasks.forEach(item => {
        const row = createTableRow(item, 'task');
        tbody.appendChild(row);
    });
}

function createTableRow(item, type) {
    const row = document.createElement('tr');
    if (type === 'milestone') {
        row.className = 'milestone-row';
    }
    
    const dependencies = item.dependencies.map(dep => 
        `<span class="dependency-tag">${dep}</span>`
    ).join('');
    
    const statusText = type === 'milestone' ? 'マイルストーン' : 
                      item.status === 'not-started' ? '未開始' :
                      item.status === 'in-progress' ? '進行中' : '完了';
    
    row.innerHTML = `
        <td>${type === 'milestone' ? 'マイルストーン' : 'タスク'}</td>
        <td><strong>${item.id}</strong></td>
        <td>${item.name}</td>
        <td><span class="status ${type === 'milestone' ? 'milestone' : item.status}">${statusText}</span></td>
        <td>${item.startDate || '-'}</td>
        <td>${item.endDate}</td>
        <td><div class="task-dependencies">${dependencies}</div></td>
        <td>${item.description || '-'}</td>
    `;
    
    return row;
}

// グラフ表示の更新
function renderGraph() {
    const svg = document.getElementById('graph-svg');
    if (!svg) return;
    
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
    
    const allItems = [
        ...projectData.milestones.map(m => ({...m, type: 'milestone'})),
        ...projectData.tasks.map(t => ({...t, type: 'task'}))
    ];
    
    const positions = {};
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
    
    allItems.forEach(item => calculateLevel(item));
    
    const levelGroups = {};
    Object.keys(levels).forEach(itemId => {
        const level = levels[itemId];
        if (!levelGroups[level]) levelGroups[level] = [];
        levelGroups[level].push(allItems.find(i => i.id === itemId));
    });
    
    Object.keys(levelGroups).forEach(level => {
        levelGroups[level].sort((a, b) => {
            const dateA = new Date(a.endDate || '9999-12-31');
            const dateB = new Date(b.endDate || '9999-12-31');
            return dateA - dateB;
        });
    });
    
    const levelWidth = Math.min(250, (width - 100) / Math.max(Object.keys(levelGroups).length, 1));
    
    Object.keys(levelGroups).forEach(level => {
        const items = levelGroups[level];
        const levelHeight = Math.min(100, (height - 100) / Math.max(items.length, 1));
        
        items.forEach((item, index) => {
            const baseY = item.type === 'milestone' ? 80 : 150;
            const yOffset = index * levelHeight;
            
            positions[item.id] = {
                x: parseInt(level) * levelWidth + 100,
                y: baseY + yOffset + (Math.random() - 0.5) * 30,
                item: item
            };
        });
    });
    
    const graphGroup = document.getElementById('graph-group');
    if (!graphGroup) return;
    
    // 依存関係の線を描画
    allItems.forEach(item => {
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
    });
    
    // ノードを描画
    Object.values(positions).forEach(pos => {
        const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
        group.setAttribute('class', 'node');
        group.setAttribute('transform', `translate(${pos.x}, ${pos.y})`);
        group.setAttribute('data-id', pos.item.id);
        
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute('r', pos.item.type === 'milestone' ? 25 : 20);
        circle.setAttribute('class', 
            pos.item.type === 'milestone' ? 'node-milestone' : 
            `node-task ${pos.item.status}`);
        
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute('class', 'node-text');
        text.setAttribute('y', -30);
        text.textContent = pos.item.name.length > 10 ? 
            pos.item.name.substring(0, 10) + '...' : pos.item.name;
        
        const idText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        idText.setAttribute('class', 'node-text');
        idText.setAttribute('y', 5);
        idText.textContent = pos.item.id;
        
        const dateText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        dateText.setAttribute('class', 'node-date');
        dateText.setAttribute('y', 40);
        dateText.textContent = pos.item.endDate;
        
        group.appendChild(circle);
        group.appendChild(text);
        group.appendChild(idText);
        group.appendChild(dateText);
        
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
        
        let isDraggingNode = false;
        let dragStart = { x: 0, y: 0 };
        
        group.addEventListener('mousedown', (e) => {
            isDraggingNode = true;
            dragStart = { x: e.clientX, y: e.clientY };
            group.style.cursor = 'grabbing';
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
            }
        });
        
        document.addEventListener('mouseup', () => {
            if (isDraggingNode) {
                isDraggingNode = false;
                group.style.cursor = 'grab';
            }
        });
        
        graphGroup.appendChild(group);
    });
    
    Object.keys(nodePositions).forEach(id => {
        if (positions[id]) {
            positions[id].x = nodePositions[id].x;
            positions[id].y = nodePositions[id].y;
        }
    });
    
    updateGraphTransform();
}

function updateGraphTransform() {
    const graphGroup = document.getElementById('graph-group');
    if (graphGroup) {
        graphGroup.setAttribute('transform', 
            `translate(${graphState.translateX}, ${graphState.translateY}) scale(${graphState.scale})`);
    }
}

function resetZoom() {
    graphState.scale = 1;
    graphState.translateX = 0;
    graphState.translateY = 0;
    updateGraphTransform();
}

function autoLayout() {
    nodePositions = {};
    renderGraph();
}

function showTooltip(event, item) {
    const tooltip = document.getElementById('tooltip');
    if (!tooltip) return;
    
    const statusText = item.type === 'milestone' ? 'マイルストーン' : 
                      item.status === 'not-started' ? '未開始' :
                      item.status === 'in-progress' ? '進行中' : '完了';
    
    const dateRange = item.startDate ? 
        `${item.startDate} ～ ${item.endDate}` : 
        `期日: ${item.endDate}`;
    
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

function hideTooltip() {
    const tooltip = document.getElementById('tooltip');
    if (tooltip) {
        tooltip.classList.remove('show');
    }
}

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

function updateConnections(nodeId) {
    const graphGroup = document.getElementById('graph-group');
    if (!graphGroup) return;
    
    const lines = graphGroup.querySelectorAll('.link');
    lines.forEach(line => line.remove());
    
    const allItems = [
        ...projectData.milestones.map(m => ({...m, type: 'milestone'})),
        ...projectData.tasks.map(t => ({...t, type: 'task'}))
    ];
    
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

// タイムライン表示の更新
function renderTimeline() {
    calculateTimelineRange();
    renderTimelineHeader();
    renderTimelineContent();
    renderTimelineToday();
    
    setTimeout(() => {
        renderTimelineGrid();
    }, 50);
}

function calculateTimelineRange() {
    const allItems = [
        ...projectData.milestones,
        ...projectData.tasks
    ];
    
    let minDate = new Date();
    let maxDate = new Date();
    
    allItems.forEach(item => {
        if (item.startDate) {
            const start = new Date(item.startDate);
            if (start < minDate) minDate = start;
        }
        if (item.endDate) {
            const end = new Date(item.endDate);
            if (end > maxDate) maxDate = end;
        }
    });
    
    minDate.setDate(minDate.getDate() - 7);
    maxDate.setDate(maxDate.getDate() + 7);
    
    timelineState.startDate = minDate;
    timelineState.endDate = maxDate;
    
    const totalDays = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24));
    const containerWidth = document.getElementById('timeline-chart')?.clientWidth || 800;
    
    switch (timelineState.zoom) {
        case 'day':
            timelineState.pixelsPerDay = Math.max(20, containerWidth / totalDays);
            break;
        case 'week':
            timelineState.pixelsPerDay = Math.max(5, containerWidth / totalDays);
            break;
        case 'month':
            timelineState.pixelsPerDay = Math.max(2, containerWidth / totalDays);
            break;
    }
}

function getMondayOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

function renderTimelineHeader() {
    const datesContainer = document.getElementById('timeline-dates');
    const sidebar = document.getElementById('timeline-sidebar');
    if (!datesContainer) return;
    
    if (sidebar) {
        sidebar.style.width = '200px';
        sidebar.style.minWidth = '200px';
        sidebar.style.maxWidth = '200px';
        sidebar.style.flexShrink = '0';
        sidebar.style.background = '#f8f9fa';
        sidebar.style.borderRight = '1px solid #e1e5e9';
    }
    
    datesContainer.innerHTML = '';
    
    const totalDays = Math.ceil((timelineState.endDate - timelineState.startDate) / (1000 * 60 * 60 * 24));
    
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
        case 'month':
            gridInterval = 30;
            dateFormat = (date) => `${date.getFullYear()}/${date.getMonth() + 1}`;
            break;
    }
    
    let startDate = new Date(timelineState.startDate);
    if (timelineState.zoom === 'week' || timelineState.zoom === 'day') {
        startDate = getMondayOfWeek(startDate);
    }
    
    let dayOffset = 0;
    if (timelineState.zoom === 'week' || timelineState.zoom === 'day') {
        dayOffset = Math.floor((startDate - timelineState.startDate) / (1000 * 60 * 60 * 24));
    }
    
    for (let i = dayOffset; i <= totalDays; i += gridInterval) {
        const currentDate = new Date(timelineState.startDate);
        currentDate.setDate(currentDate.getDate() + i);
        
        if (timelineState.zoom === 'week' || timelineState.zoom === 'day') {
            const adjustedDate = getMondayOfWeek(currentDate);
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
    
    datesContainer.style.minWidth = (totalDays * timelineState.pixelsPerDay) + 'px';
    datesContainer.style.height = '50px';
    datesContainer.style.background = '#fff';
}

function renderTimelineContent() {
    const itemsContainer = document.getElementById('timeline-items');
    const chartContainer = document.getElementById('timeline-chart');
    
    if (!itemsContainer || !chartContainer) return;
    
    itemsContainer.style.width = '200px';
    itemsContainer.style.minWidth = '200px';
    itemsContainer.style.maxWidth = '200px';
    itemsContainer.style.flexShrink = '0';
    itemsContainer.style.boxSizing = 'border-box';
    itemsContainer.style.background = '#f8f9fa';
    itemsContainer.style.borderRight = '1px solid #e1e5e9';
    
    itemsContainer.innerHTML = '';
    
    const existingBars = chartContainer.querySelectorAll('.timeline-bar');
    existingBars.forEach(bar => bar.remove());
    
    const allItems = [
        ...projectData.milestones.map(m => ({...m, type: 'milestone'})),
        ...projectData.tasks.map(t => ({...t, type: 'task'}))
    ];
    
    allItems.forEach((item, index) => {
        const itemRow = document.createElement('div');
        itemRow.className = `timeline-item-row ${item.type === 'milestone' ? 'milestone' : ''}`;
        
        itemRow.style.width = '200px';
        itemRow.style.minWidth = '200px';
        itemRow.style.maxWidth = '200px';
        itemRow.style.boxSizing = 'border-box';
        itemRow.style.background = item.type === 'milestone' ? '#f3e5f5' : 'white';
        itemRow.style.borderBottom = '1px solid #e1e5e9';
        
        const itemId = document.createElement('div');
        itemId.className = 'timeline-item-id';
        itemId.textContent = item.id;
        
        const itemName = document.createElement('div');
        itemName.className = 'timeline-item-name';
        itemName.textContent = item.name;
        itemName.title = item.description || item.name;
        
        itemRow.appendChild(itemId);
        itemRow.appendChild(itemName);
        itemsContainer.appendChild(itemRow);
        
        createTimelineBar(item, index);
    });
    
    const minHeight = allItems.length * 60 + 50;
    itemsContainer.style.minHeight = minHeight + 'px';
    chartContainer.style.minHeight = minHeight + 'px';
    
    renderTimelineGrid();
}

function createTimelineBar(item, rowIndex) {
    const chartContainer = document.getElementById('timeline-chart');
    if (!chartContainer) return;
    
    const bar = document.createElement('div');
    bar.className = `timeline-bar ${item.type === 'milestone' ? 'milestone' : item.status}`;
    
    let startDate, endDate, daysSinceStart, duration;
    
    if (item.type === 'milestone') {
        endDate = new Date(item.endDate);
        daysSinceStart = Math.floor((endDate - timelineState.startDate) / (1000 * 60 * 60 * 24));
    } else {
        if (item.startDate) {
            startDate = new Date(item.startDate);
            endDate = new Date(item.endDate);
        } else {
            endDate = new Date(item.endDate);
            startDate = new Date(endDate);
            startDate.setDate(startDate.getDate() - 7);
        }
        
        daysSinceStart = Math.floor((startDate - timelineState.startDate) / (1000 * 60 * 60 * 24));
        duration = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));
        
        if (duration <= 0) {
            duration = 1;
        }
    }
    
    const left = daysSinceStart * timelineState.pixelsPerDay;
    
    const rowHeight = 60;
    const barHeight = item.type === 'milestone' ? 24 : 24;
    const top = rowIndex * rowHeight + (rowHeight - barHeight) / 2;
    
    bar.style.left = left + 'px';
    bar.style.top = top + 'px';
    
    if (item.type === 'milestone') {
        bar.style.left = (left + 15) + 'px';
        bar.title = `${item.name} (${item.endDate})`;
    } else {
        const calculatedWidth = duration * timelineState.pixelsPerDay;
        const minWidth = 40;
        const finalWidth = Math.max(minWidth, calculatedWidth);
        
        bar.style.width = finalWidth + 'px';
        
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
        
        const startDateStr = item.startDate || `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
        bar.title = `${item.name}\n${startDateStr} ～ ${item.endDate}\n期間: ${duration}日`;
    }
    
    chartContainer.appendChild(bar);
}

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
        const startDate = getMondayOfWeek(timelineState.startDate);
        dayOffset = Math.floor((startDate - timelineState.startDate) / (1000 * 60 * 60 * 24));
    }
    
    for (let i = dayOffset; i <= totalDays; i += gridInterval) {
        const leftPosition = i * timelineState.pixelsPerDay;
        
        const line = document.createElement('div');
        line.className = 'timeline-grid-line';
        line.style.left = leftPosition + 'px';
        
        gridContainer.appendChild(line);
    }
}

function renderTimelineToday() {
    const todayLine = document.getElementById('timeline-today-line');
    if (!todayLine) return;
    
    const today = new Date();
    const daysSinceStart = Math.floor((today - timelineState.startDate) / (1000 * 60 * 60 * 24));
    
    if (daysSinceStart >= 0) {
        todayLine.style.left = (daysSinceStart * timelineState.pixelsPerDay) + 'px';
        todayLine.style.display = 'block';
    } else {
        todayLine.style.display = 'none';
    }
}

function setTimelineZoom(zoom) {
    timelineState.zoom = zoom;
    
    document.querySelectorAll('.timeline-zoom-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    renderTimeline();
}

// モーダル関連
function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

function updateFormFields() {
    const type = document.getElementById('item-type').value;
    const statusGroup = document.getElementById('status-group');
    const startDateGroup = document.getElementById('start-date-group');
    
    if (type === 'milestone') {
        statusGroup.style.display = 'none';
        startDateGroup.style.display = 'none';
    } else {
        statusGroup.style.display = 'block';
        startDateGroup.style.display = 'block';
    }
}

// インポート機能
function openImportModal() {
    document.getElementById('import-modal').style.display = 'block';
    updateImportFormat();
}

function closeImportModal() {
    document.getElementById('import-modal').style.display = 'none';
}

function updateImportFormat() {
    const format = document.querySelector('input[name="import-format"]:checked').value;
    
    document.getElementById('tsv-import').style.display = format === 'tsv' ? 'block' : 'none';
    document.getElementById('json-import').style.display = format === 'json' ? 'block' : 'none';
}

function importData() {
    const format = document.querySelector('input[name="import-format"]:checked').value;
    const replaceMode = document.getElementById('replace-data').checked;
    
    try {
        let newData = { milestones: [], tasks: [] };
        
        if (format === 'tsv') {
            const tsvText = document.getElementById('tsv-input').value.trim();
            if (!tsvText) {
                alert('TSVデータを入力してください。');
                return;
            }
            newData = parseTSV(tsvText);
        } else if (format === 'json') {
            const jsonText = document.getElementById('json-input').value.trim();
            if (!jsonText) {
                alert('JSONデータを入力してください。');
                return;
            }
            newData = JSON.parse(jsonText);
        }
        
        // データの検証
        if (!newData.milestones || !newData.tasks) {
            throw new Error('データ形式が正しくありません。milestonesとtasksが必要です。');
        }
        
        // データの適用
        if (replaceMode) {
            projectData = newData;
        } else {
            // 追加モード：IDの重複をチェック
            const existingIds = [
                ...projectData.milestones.map(m => m.id),
                ...projectData.tasks.map(t => t.id)
            ];
            
            newData.milestones.forEach(milestone => {
                if (!existingIds.includes(milestone.id)) {
                    projectData.milestones.push(milestone);
                    existingIds.push(milestone.id);
                }
            });
            
            newData.tasks.forEach(task => {
                if (!existingIds.includes(task.id)) {
                    projectData.tasks.push(task);
                    existingIds.push(task.id);
                }
            });
        }
        
        updateTable();
        closeImportModal();
        
        const mode = replaceMode ? '置き換え' : '追加';
        const itemCount = newData.milestones.length + newData.tasks.length;
        alert(`データを${mode}しました！（${itemCount}件の項目）`);
        
    } catch (error) {
        alert('インポートエラー: ' + error.message);
    }
}

function parseTSV(tsvText) {
    const lines = tsvText.split('\n').filter(line => line.trim());
    if (lines.length === 0) {
        throw new Error('データが空です。');
    }
    
    // ヘッダー行を取得
    const headers = lines[0].split('\t').map(h => h.trim());
    const requiredHeaders = ['種類', 'ID', '名前', 'ステータス', '開始日', '終了日/期日', '依存関係', '説明'];
    
    // ヘッダーの検証
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
        throw new Error(`必要な列が不足しています: ${missingHeaders.join(', ')}`);
    }
    
    const milestones = [];
    const tasks = [];
    
    // データ行を処理
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split('\t');
        const rowData = {};
        
        headers.forEach((header, index) => {
            rowData[header] = values[index] ? values[index].trim() : '';
        });
        
        // 必須項目のチェック
        if (!rowData['ID'] || !rowData['名前'] || !rowData['終了日/期日']) {
            console.warn(`行 ${i + 1}: 必須項目が不足しています。スキップします。`);
            continue;
        }
        
        // ステータスの正規化
        let status = 'not-started';
        const statusText = rowData['ステータス'];
        if (statusText === '完了' || statusText === 'completed') {
            status = 'completed';
        } else if (statusText === '進行中' || statusText === 'in-progress') {
            status = 'in-progress';
        } else if (statusText === '未開始' || statusText === 'not-started') {
            status = 'not-started';
        }
        
        // 依存関係の処理
        const dependencies = rowData['依存関係'] ? 
            rowData['依存関係'].split(',').map(d => d.trim()).filter(d => d) : [];
        
        const item = {
            id: rowData['ID'],
            name: rowData['名前'],
            status: status,
            endDate: rowData['終了日/期日'],
            dependencies: dependencies,
            description: rowData['説明'] || ''
        };
        
        // 開始日があれば追加
        if (rowData['開始日']) {
            item.startDate = rowData['開始日'];
        }
        
        // 種類に応じて分類
        const type = rowData['種類'];
        if (type === 'マイルストーン' || type === 'milestone') {
            milestones.push(item);
        } else {
            tasks.push(item);
        }
    }
    
    return { milestones, tasks };
}

// 初期化
window.addEventListener('load', function() {
    updateTable();
    
    const graphContainer = document.getElementById('graph-container');
    const graphSvg = document.getElementById('graph-svg');
    
    graphContainer.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        graphState.scale = Math.max(0.1, Math.min(3, graphState.scale * delta));
        updateGraphTransform();
    });
    
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
});

// モーダル外クリックで閉じる
window.addEventListener('click', function(event) {
    const exportModal = document.getElementById('export-modal');
    const importModal = document.getElementById('import-modal');
    const exportMenu = document.getElementById('export-menu');
    
    if (event.target === exportModal) {
        closeExportModal();
    }
    if (event.target === importModal) {
        closeImportModal();
    }
    
    // 出力メニューの外をクリックした場合は閉じる
    if (!event.target.closest('.export-dropdown')) {
        exportMenu.classList.remove('show');
    }
});