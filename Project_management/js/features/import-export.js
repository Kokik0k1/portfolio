// import-export.js - データインポート・エクスポート機能

// ===== エクスポート機能 =====

/**
 * エクスポートメニューの表示切り替え
 */
function toggleExportMenu() {
    const menu = document.getElementById('export-menu');
    menu.classList.toggle('show');
}

/**
 * データをエクスポート
 * @param {string} format - エクスポート形式 ('json', 'yaml', 'tsv')
 */
function exportData(format) {
    saveCurrentNodePositions();
    
    currentExportFormat = format;
    let exportData = '';
    let modalTitle = '';
    
    const allItems = getAllItems(true);
    
    switch (format) {
        case 'json':
            exportData = generateJSON();
            modalTitle = 'JSON Format Data Export (with Layout & Order)';
            break;
            
        case 'yaml':
            exportData = generateYAML();
            modalTitle = 'YAML Format Data Export (with Layout & Order)';
            break;
            
        case 'tsv':
            exportData = generateTSV(allItems);
            modalTitle = 'TSV Format Data Export (for Spreadsheets)';
            break;
            
        default:
            logError('不明なエクスポート形式', null, { format });
            return;
    }
    
    currentExportData = exportData;
    
    document.getElementById('export-modal-title').textContent = modalTitle;
    document.getElementById('export-data-content').textContent = exportData;
    document.getElementById('export-modal').style.display = 'block';
    document.getElementById('export-menu').classList.remove('show');
    
    logSuccess('データエクスポート完了', { format, size: exportData.length });
}

/**
 * JSONデータを生成
 * @returns {string} JSON文字列
 */
function generateJSON() {
    const exportObj = {
        exportDate: new Date().toISOString(),
        version: "1.0",
        milestones: projectData.milestones,
        tasks: projectData.tasks,
        graphLayout: projectData.graphLayout,
        timelineOrder: projectData.timelineOrder
    };
    
    return JSON.stringify(exportObj, null, 2);
}

/**
 * YAMLデータを生成
 * @returns {string} YAML文字列
 */
function generateYAML() {
    let yaml = `# プロジェクトデータ出力\n`;
    yaml += `exportDate: "${new Date().toISOString()}"\n`;
    yaml += `version: "1.0"\n\n`;
    
    // マイルストーン
    yaml += `milestones:\n`;
    projectData.milestones.forEach(m => {
        yaml += `  - id: "${m.id}"\n`;
        yaml += `    name: "${m.name}"\n`;
        yaml += `    status: "${m.status}"\n`;
        yaml += `    endDate: "${m.endDate || ''}"\n`;
        yaml += `    dependencies: [${m.dependencies.map(d => `"${d}"`).join(', ')}]\n`;
        yaml += `    description: "${(m.description || '').replace(/"/g, '\\"')}"\n\n`;
    });
    
    // タスク
    yaml += `tasks:\n`;
    projectData.tasks.forEach(t => {
        yaml += `  - id: "${t.id}"\n`;
        yaml += `    name: "${t.name}"\n`;
        yaml += `    status: "${t.status}"\n`;
        yaml += `    startDate: "${t.startDate || ''}"\n`;
        yaml += `    endDate: "${t.endDate || ''}"\n`;
        yaml += `    dependencies: [${t.dependencies.map(d => `"${d}"`).join(', ')}]\n`;
        yaml += `    description: "${(t.description || '').replace(/"/g, '\\"')}"\n\n`;
    });
    
    // グラフレイアウト
    if (projectData.graphLayout && Object.keys(projectData.graphLayout.nodePositions || {}).length > 0) {
        yaml += `graphLayout:\n`;
        yaml += `  lastUpdated: "${projectData.graphLayout.lastUpdated || ''}"\n`;
        yaml += `  nodePositions:\n`;
        Object.entries(projectData.graphLayout.nodePositions || {}).forEach(([id, pos]) => {
            yaml += `    "${id}":\n`;
            yaml += `      x: ${pos.x}\n`;
            yaml += `      y: ${pos.y}\n`;
        });
        yaml += '\n';
    }
    
    // タイムライン順序
    if (projectData.timelineOrder && projectData.timelineOrder.length > 0) {
        yaml += `timelineOrder: [${projectData.timelineOrder.map(id => `"${id}"`).join(', ')}]\n`;
    }
    
    return yaml;
}

/**
 * TSVデータを生成
 * @param {Array} allItems - 全アイテム
 * @returns {string} TSV文字列
 */
function generateTSV(allItems) {
    const headers = ['Type', 'ID', 'Name', 'Status', 'Start Date', 'End Date/Due Date', 'Dependencies', 'Description'];
    let tsv = headers.join('\t') + '\n';
    
    allItems.forEach(item => {
        const statusText = item.type === 'milestone' ? 'Milestone' : 
                          item.status === 'not-started' ? 'Not Started' :
                          item.status === 'in-progress' ? 'In Progress' : 'Completed';
        
        const dependencies = item.dependencies.join(', ');
        const startDate = item.startDate || '';
        const description = (item.description || '').replace(/\t/g, ' ').replace(/\n/g, ' ');
        
        const row = [
            item.type === 'milestone' ? 'Milestone' : 'Task',
            item.id,
            item.name,
            statusText,
            startDate,
            item.endDate || '',
            dependencies,
            description
        ];
        
        tsv += row.join('\t') + '\n';
    });
    
    return tsv;
}

/**
 * クリップボードにコピー
 */
function copyToClipboard() {
    navigator.clipboard.writeText(currentExportData).then(() => {
        const btn = document.getElementById('copy-btn');
        const originalText = btn.textContent;
        
        btn.textContent = 'コピー完了！';
        btn.classList.add('copied');
        
        setTimeout(() => {
            btn.textContent = originalText;
            btn.classList.remove('copied');
        }, 2000);
        
        logSuccess('クリップボードにコピー完了');
    }).catch(err => {
        alert('コピーに失敗しました: ' + err);
        logError('クリップボードコピーエラー', err);
    });
}

/**
 * ファイルとしてダウンロード
 */
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
    
    const today = formatDate(new Date(), 'YYYY-MM-DD');
    const filename = `project_data_${today}.${extensions[currentExportFormat]}`;
    
    const blob = new Blob([currentExportData], { 
        type: mimeTypes[currentExportFormat] + ';charset=utf-8;' 
    });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    
    URL.revokeObjectURL(link.href);
    
    logSuccess('ファイルダウンロード完了', { filename, size: currentExportData.length });
}

/**
 * エクスポートモーダルを閉じる
 */
function closeExportModal() {
    document.getElementById('export-modal').style.display = 'none';
    currentExportData = '';
    currentExportFormat = '';
}

// ===== インポート機能 =====

/**
 * インポートモーダルを開く
 */
function openImportModal() {
    document.getElementById('import-modal').style.display = 'block';
    updateImportFormat();
}

/**
 * インポートモーダルを閉じる
 */
function closeImportModal() {
    document.getElementById('import-modal').style.display = 'none';
    
    // インプット内容をクリア
    document.getElementById('tsv-input').value = '';
    document.getElementById('json-input').value = '';
}

/**
 * インポート形式の表示を更新
 */
function updateImportFormat() {
    const format = document.querySelector('input[name="import-format"]:checked').value;
    
    document.getElementById('tsv-import').style.display = format === 'tsv' ? 'block' : 'none';
    document.getElementById('json-import').style.display = format === 'json' ? 'block' : 'none';
}

/**
 * データをインポート
 */
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
        
        // データ形式の検証
        if (!newData.milestones || !newData.tasks) {
            throw new Error('データ形式が正しくありません。milestonesとtasksが必要です。');
        }
        
        if (replaceMode) {
            replaceProjectData(newData);
        } else {
            mergeProjectData(newData);
        }
        
        // 表示を更新
        updateTable();
        refreshActiveView();
        
        closeImportModal();
        
        const mode = replaceMode ? '置き換え' : '追加';
        const itemCount = newData.milestones.length + newData.tasks.length;
        const positionCount = (newData.graphLayout && newData.graphLayout.nodePositions) ? 
            Object.keys(newData.graphLayout.nodePositions).length : 0;
        
        let message = `データを${mode}しました！（${itemCount}件の項目）`;
        if (positionCount > 0) {
            message += `\nグラフ位置情報も復元しました（${positionCount}個のノード）`;
        }
        if (newData.timelineOrder && newData.timelineOrder.length > 0) {
            message += `\nタイムライン順序も復元しました（${newData.timelineOrder.length}項目）`;
        }
        
        alert(message);
        logSuccess('データインポート完了', { mode, itemCount, positionCount });
        
    } catch (error) {
        alert('インポートエラー: ' + error.message);
        logError('データインポートエラー', error);
    }
}

/**
 * プロジェクトデータを置き換え
 * @param {Object} newData - 新しいデータ
 */
function replaceProjectData(newData) {
    projectData = {
        milestones: newData.milestones,
        tasks: newData.tasks,
        graphLayout: newData.graphLayout || { nodePositions: {}, lastUpdated: null },
        timelineOrder: newData.timelineOrder || []
    };
    
    if (projectData.graphLayout && projectData.graphLayout.nodePositions) {
        nodePositions = {...projectData.graphLayout.nodePositions};
        console.log('保存された位置情報を復元しました:', Object.keys(nodePositions).length, '個のノード');
    }
    
    // タイムライン順序の復元
    if (projectData.timelineOrder.length === 0) {
        initializeTimelineOrder();
    }
}

/**
 * プロジェクトデータをマージ
 * @param {Object} newData - 追加するデータ
 */
function mergeProjectData(newData) {
    const existingIds = getAllItems(false).map(item => item.id);
    
    // マイルストーンを追加
    newData.milestones.forEach(milestone => {
        if (!existingIds.includes(milestone.id)) {
            projectData.milestones.push(milestone);
            existingIds.push(milestone.id);
        }
    });
    
    // タスクを追加
    newData.tasks.forEach(task => {
        if (!existingIds.includes(task.id)) {
            projectData.tasks.push(task);
            existingIds.push(task.id);
        }
    });
    
    // 位置情報をマージ
    if (newData.graphLayout && newData.graphLayout.nodePositions) {
        Object.assign(nodePositions, newData.graphLayout.nodePositions);
        Object.assign(projectData.graphLayout.nodePositions, newData.graphLayout.nodePositions);
    }
    
    // タイムライン順序をマージ
    if (newData.timelineOrder) {
        newData.timelineOrder.forEach(id => {
            if (!projectData.timelineOrder.includes(id)) {
                projectData.timelineOrder.push(id);
            }
        });
    }
}

/**
 * TSVテキストをパース
 * @param {string} tsvText - TSVテキスト
 * @returns {Object} パース結果
 */
function parseTSV(tsvText) {
    const lines = tsvText.split('\n').filter(line => line.trim());
    if (lines.length === 0) {
        throw new Error('データが空です。');
    }
    
    const headers = lines[0].split('\t').map(h => h.trim());
    const requiredHeaders = ['Type', 'ID', 'Name', 'Status', 'Start Date', 'End Date/Due Date', 'Dependencies', 'Description'];
    
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
        throw new Error(`必要な列が不足しています: ${missingHeaders.join(', ')}`);
    }
    
    const milestones = [];
    const tasks = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split('\t');
        const rowData = {};
        
        headers.forEach((header, index) => {
            rowData[header] = values[index] ? values[index].trim() : '';
        });
        
        if (!rowData['ID'] || !rowData['Name']) {
            console.warn(`行 ${i + 1}: ID and Name are required. スキップします。`);
            continue;
        }
        
        let status = 'not-started';
        const statusText = rowData['Status'];
        if (statusText === 'Completed' || statusText === 'completed') {
            status = 'completed';
        } else if (statusText === 'In Progress' || statusText === 'in-progress') {
            status = 'in-progress';
        } else if (statusText === 'Not Started' || statusText === 'not-started') {
            status = 'not-started';
        }
        
        const dependencies = rowData['Dependencies'] ? 
            rowData['Dependencies'].split(',').map(d => d.trim()).filter(d => d) : [];
        
        const item = {
            id: rowData['ID'],
            name: rowData['Name'],
            status: status,
            dependencies: dependencies,
            description: rowData['Description'] || ''
        };
        
        // 日程の設定（空欄でもOK）
        if (rowData['Start Date']) {
            item.startDate = rowData['Start Date'];
        }
        if (rowData['End Date/Due Date']) {
            item.endDate = rowData['End Date/Due Date'];
        }
        
        const type = rowData['Type'];
        if (type === 'Milestone' || type === 'milestone') {
            milestones.push(item);
        } else {
            tasks.push(item);
        }
    }
    
    return { milestones, tasks };
}

/**
 * 現在のノード位置を保存
 */
function saveCurrentNodePositions() {
    projectData.graphLayout.nodePositions = {...nodePositions};
    projectData.graphLayout.lastUpdated = new Date().toISOString();
    console.log('💾 位置情報を保存:', Object.keys(nodePositions).length, '個のノード');
}

// エクスポート
window.toggleExportMenu = toggleExportMenu;
window.exportData = exportData;
window.copyToClipboard = copyToClipboard;
window.downloadFile = downloadFile;
window.closeExportModal = closeExportModal;
window.openImportModal = openImportModal;
window.closeImportModal = closeImportModal;
window.updateImportFormat = updateImportFormat;
window.importData = importData;