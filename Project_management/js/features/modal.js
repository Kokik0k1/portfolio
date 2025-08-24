// modal.js - モーダル管理機能

// ===== 新規追加モーダル =====

/**
 * 新規追加モーダルを開く
 */
function openAddModal() {
    document.getElementById('add-modal').style.display = 'block';
    updateAddFormFields();
    
    // フォームをリセット
    document.getElementById('add-form').reset();
    console.log('➕ 新規追加モーダルを開きました');
}

/**
 * 新規追加モーダルを閉じる
 */
function closeAddModal() {
    document.getElementById('add-modal').style.display = 'none';
    currentEditingItem = null;
    console.log('❌ 新規追加モーダルを閉じました');
}

/**
 * 追加フォームのフィールド更新
 */
function updateAddFormFields() {
    const type = document.getElementById('add-type').value;
    const startDateGroup = document.getElementById('add-start-date-group');
    const endDateLabel = document.getElementById('add-end-date-label');
    
    if (type === 'milestone') {
        startDateGroup.style.display = 'none';
        endDateLabel.textContent = 'Due Date: (optional)';
    } else {
        startDateGroup.style.display = 'block';
        endDateLabel.textContent = 'End Date: (optional)';
    }
}

/**
 * 新しいアイテムを追加
 */
function addNewItem() {
    const type = document.getElementById('add-type').value;
    const id = document.getElementById('add-id').value.trim();
    const name = document.getElementById('add-name').value.trim();
    const status = document.getElementById('add-status').value;
    const startDate = document.getElementById('add-start-date').value;
    const endDate = document.getElementById('add-end-date').value;
    const dependencies = document.getElementById('add-dependencies').value.trim();
    const description = document.getElementById('add-description').value.trim();
    
    // バリデーション
    if (!id || !name) {
        alert('ID and Name are required.');
        return;
    }
    
    // ID妥当性チェック
    if (!isValidId(id)) {
        alert('ID format is invalid. Use only letters, numbers, underscores, and hyphens.');
        return;
    }
    
    // ID重複チェック
    if (isDuplicateId(id)) {
        alert('This ID already exists. Please use a different ID.');
        return;
    }
    
    const dependenciesArray = dependencies ? 
        dependencies.split(',').map(d => d.trim()).filter(d => d) : [];
    
    const newItem = {
        id: id,
        name: name,
        status: type === 'milestone' ? 'milestone' : status,
        dependencies: dependenciesArray,
        description: description
    };
    
    // 日程の設定（空欄でもOK）
    if (startDate) newItem.startDate = startDate;
    if (endDate) newItem.endDate = endDate;
    
    // データに追加
    addItem(newItem, type);
    
    // 表示を更新
    updateTable();
    refreshActiveView();
    
    closeAddModal();
    logSuccess(`新しい${type}を追加`, { id, name });
}

// ===== 編集モーダル =====

/**
 * 編集モーダルを開く
 * @param {string} itemId - 編集するアイテムID
 */
function openEditModal(itemId) {
    const item = findItemById(itemId);
    
    if (!item) {
        alert('Item not found.');
        logError('編集対象アイテムが見つかりません', null, { itemId });
        return;
    }
    
    currentEditingItem = {
        id: itemId,
        type: item.type,
        originalId: itemId
    };
    
    // フォームに値を設定
    document.getElementById('edit-type').value = item.type;
    document.getElementById('edit-id').value = item.id;
    document.getElementById('edit-name').value = item.name;
    document.getElementById('edit-status').value = item.status === 'milestone' ? 'completed' : item.status;
    document.getElementById('edit-start-date').value = item.startDate || '';
    document.getElementById('edit-end-date').value = item.endDate || '';
    document.getElementById('edit-dependencies').value = item.dependencies.join(', ');
    document.getElementById('edit-description').value = item.description || '';
    
    updateEditFormFields();
    
    document.getElementById('edit-modal-title').textContent = `Edit ${item.type}: ${item.name}`;
    document.getElementById('edit-modal').style.display = 'block';
    
    console.log('✏️ 編集モーダルを開きました:', itemId);
}

/**
 * 編集モーダルを閉じる
 */
function closeEditModal() {
    document.getElementById('edit-modal').style.display = 'none';
    currentEditingItem = null;
    console.log('❌ 編集モーダルを閉じました');
}

/**
 * 編集フォームのフィールド更新
 */
function updateEditFormFields() {
    const type = document.getElementById('edit-type').value;
    const startDateGroup = document.getElementById('edit-start-date-group');
    const endDateLabel = document.getElementById('edit-end-date-label');
    const statusSelect = document.getElementById('edit-status');
    
    if (type === 'milestone') {
        startDateGroup.style.display = 'none';
        endDateLabel.textContent = 'Due Date: (optional)';
        statusSelect.style.display = 'none';
    } else {
        startDateGroup.style.display = 'block';
        endDateLabel.textContent = 'End Date: (optional)';
        statusSelect.style.display = 'block';
    }
}

/**
 * 編集された内容を保存
 */
function saveEditedItem() {
    if (!currentEditingItem) return;
    
    const type = document.getElementById('edit-type').value;
    const id = document.getElementById('edit-id').value.trim();
    const name = document.getElementById('edit-name').value.trim();
    const status = document.getElementById('edit-status').value;
    const startDate = document.getElementById('edit-start-date').value;
    const endDate = document.getElementById('edit-end-date').value;
    const dependencies = document.getElementById('edit-dependencies').value.trim();
    const description = document.getElementById('edit-description').value.trim();
    
    // バリデーション
    if (!id || !name) {
        alert('ID and Name are required.');
        return;
    }
    
    // ID妥当性チェック
    if (!isValidId(id)) {
        alert('ID format is invalid. Use only letters, numbers, underscores, and hyphens.');
        return;
    }
    
    // ID重複チェック（自分以外）
    if (isDuplicateId(id, currentEditingItem.originalId)) {
        alert('This ID already exists. Please use a different ID.');
        return;
    }
    
    const dependenciesArray = dependencies ? 
        dependencies.split(',').map(d => d.trim()).filter(d => d) : [];
    
    const updatedItem = {
        id: id,
        name: name,
        status: type === 'milestone' ? 'milestone' : status,
        dependencies: dependenciesArray,
        description: description
    };
    
    // 日程の設定（空欄でもOK）
    if (startDate) updatedItem.startDate = startDate;
    if (endDate) updatedItem.endDate = endDate;
    
    // 既存のアイテムを削除
    removeItem(currentEditingItem.originalId);
    
    // 新しいアイテムを追加
    addItem(updatedItem, type);
    
    // 表示を更新
    updateTable();
    refreshActiveView();
    
    closeEditModal();
    logSuccess('アイテムを更新', { id, name, type });
}

/**
 * アイテムを削除
 */
function deleteItem() {
    if (!currentEditingItem) return;
    
    const item = findItemById(currentEditingItem.originalId);
    if (!item) return;
    
    if (!confirm(`Are you sure you want to delete "${item.name}" (${item.id})?`)) {
        return;
    }
    
    const success = removeItem(currentEditingItem.originalId);
    
    if (success) {
        // 表示を更新
        updateTable();
        refreshActiveView();
        
        closeEditModal();
        logSuccess('アイテムを削除', { id: item.id, name: item.name });
    } else {
        alert('Failed to delete item.');
        logError('アイテム削除に失敗');
    }
}

// ===== ユーティリティ関数 =====

/**
 * 現在アクティブなビューを更新
 */
function refreshActiveView() {
    const currentView = document.querySelector('.view.active');
    if (currentView) {
        const viewId = currentView.id;
        if (viewId === 'graph-view') {
            setTimeout(() => renderGraph(), 100);
        } else if (viewId === 'timeline-view') {
            setTimeout(() => renderTimeline(), 100);
        }
    }
}

/**
 * モーダルの入力値をクリア
 * @param {string} formId - フォームID
 */
function clearModalForm(formId) {
    const form = document.getElementById(formId);
    if (form) {
        form.reset();
        console.log('🧹 フォームをクリアしました:', formId);
    }
}

/**
 * モーダルのフォーカス管理
 * @param {string} modalId - モーダルID
 * @param {string} focusElementId - フォーカスする要素ID
 */
function setModalFocus(modalId, focusElementId) {
    const modal = document.getElementById(modalId);
    const element = document.getElementById(focusElementId);
    
    if (modal && element) {
        setTimeout(() => {
            element.focus();
        }, 100);
    }
}

/**
 * 依存関係の妥当性チェック
 * @param {string} itemId - チェックするアイテムID
 * @param {Array} dependencies - 依存関係配列
 * @returns {Object} チェック結果
 */
function validateDependencies(itemId, dependencies) {
    const result = { valid: true, errors: [] };
    
    dependencies.forEach(depId => {
        // 存在チェック
        if (!findItemById(depId)) {
            result.valid = false;
            result.errors.push(`Dependency "${depId}" does not exist`);
        }
        
        // 自己依存チェック
        if (depId === itemId) {
            result.valid = false;
            result.errors.push(`Self-dependency detected: "${depId}"`);
        }
    });
    
    return result;
}

// エクスポート
window.openAddModal = openAddModal;
window.closeAddModal = closeAddModal;
window.updateAddFormFields = updateAddFormFields;
window.addNewItem = addNewItem;
window.openEditModal = openEditModal;
window.closeEditModal = closeEditModal;
window.updateEditFormFields = updateEditFormFields;
window.saveEditedItem = saveEditedItem;
window.deleteItem = deleteItem;