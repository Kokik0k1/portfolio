// utils.js - 共通ユーティリティ関数

/**
 * 日付フォーマット関数
 * @param {Date|string} date - フォーマットする日付
 * @param {string} format - フォーマット形式 ('YYYY-MM-DD', 'MM/DD', etc.)
 * @returns {string} フォーマット済み日付文字列
 */
function formatDate(date, format = 'YYYY-MM-DD') {
    if (!date) return '';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    switch (format) {
        case 'YYYY-MM-DD':
            return `${year}-${month}-${day}`;
        case 'MM/DD':
            return `${month}/${day}`;
        case 'YYYY/MM':
            return `${year}/${month}`;
        case 'MM/DD/YYYY':
            return `${month}/${day}/${year}`;
        default:
            return `${year}-${month}-${day}`;
    }
}

/**
 * 週の月曜日を取得
 * @param {Date} date - 基準日
 * @returns {Date} その週の月曜日
 */
function getMondayOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

/**
 * 2つの日付間の日数を計算
 * @param {Date|string} startDate - 開始日
 * @param {Date|string} endDate - 終了日
 * @returns {number} 日数
 */
function getDaysBetween(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = Math.abs(end - start);
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
}

/**
 * 配列から重複を除去
 * @param {Array} array - 重複を除去する配列
 * @returns {Array} 重複除去済み配列
 */
function removeDuplicates(array) {
    return [...new Set(array)];
}

/**
 * オブジェクトの深いコピー
 * @param {Object} obj - コピーするオブジェクト
 * @returns {Object} コピーされたオブジェクト
 */
function deepCopy(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => deepCopy(item));
    
    const copied = {};
    Object.keys(obj).forEach(key => {
        copied[key] = deepCopy(obj[key]);
    });
    return copied;
}

/**
 * 文字列の省略表示
 * @param {string} text - 省略する文字列
 * @param {number} maxLength - 最大長
 * @param {string} suffix - 省略時の接尾辞
 * @returns {string} 省略済み文字列
 */
function truncateText(text, maxLength = 50, suffix = '...') {
    if (!text || text.length <= maxLength) return text || '';
    return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * IDの妥当性チェック
 * @param {string} id - チェックするID
 * @returns {boolean} 妥当な場合true
 */
function isValidId(id) {
    if (!id || typeof id !== 'string') return false;
    
    // アルファベット、数字、アンダースコア、ハイフンのみ許可
    const validPattern = /^[A-Za-z0-9_-]+$/;
    return validPattern.test(id) && id.length >= 1 && id.length <= 50;
}

/**
 * 色の明度を計算（グラフ表示で使用）
 * @param {string} color - 16進数カラーコード
 * @returns {number} 明度（0-255）
 */
function getLuminance(color) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // 相対輝度の計算
    return 0.299 * r + 0.587 * g + 0.114 * b;
}

/**
 * 座標間の距離を計算
 * @param {Object} point1 - 座標1 {x, y}
 * @param {Object} point2 - 座標2 {x, y}
 * @returns {number} 距離
 */
function calculateDistance(point1, point2) {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * ランダムなIDを生成
 * @param {string} prefix - 接頭辞
 * @param {number} length - ランダム部分の長さ
 * @returns {string} 生成されたID
 */
function generateRandomId(prefix = 'ID', length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = prefix + '_';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * 配列を指定の位置に移動
 * @param {Array} array - 操作する配列
 * @param {number} from - 移動元インデックス
 * @param {number} to - 移動先インデックス
 * @returns {Array} 移動後の配列
 */
function moveArrayItem(array, from, to) {
    const newArray = [...array];
    const [removed] = newArray.splice(from, 1);
    newArray.splice(to, 0, removed);
    return newArray;
}

/**
 * デバウンス関数（頻繁な実行を制御）
 * @param {Function} func - 実行する関数
 * @param {number} delay - 遅延時間（ms）
 * @returns {Function} デバウンス済み関数
 */
function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * スロットル関数（実行頻度を制限）
 * @param {Function} func - 実行する関数
 * @param {number} delay - 最小間隔（ms）
 * @returns {Function} スロットル済み関数
 */
function throttle(func, delay) {
    let isThrottled = false;
    return function(...args) {
        if (!isThrottled) {
            func.apply(this, args);
            isThrottled = true;
            setTimeout(() => isThrottled = false, delay);
        }
    };
}

/**
 * エラーログ出力
 * @param {string} message - エラーメッセージ
 * @param {Error} error - エラーオブジェクト
 * @param {Object} context - 追加コンテキスト
 */
function logError(message, error = null, context = {}) {
    console.error(`❌ ${message}`, {
        error: error?.message || error,
        stack: error?.stack,
        context,
        timestamp: new Date().toISOString()
    });
}

/**
 * 成功ログ出力
 * @param {string} message - 成功メッセージ
 * @param {Object} context - 追加コンテキスト
 */
function logSuccess(message, context = {}) {
    console.log(`✅ ${message}`, context);
}

/**
 * 警告ログ出力
 * @param {string} message - 警告メッセージ
 * @param {Object} context - 追加コンテキスト
 */
function logWarning(message, context = {}) {
    console.warn(`⚠️ ${message}`, context);
}

// LocalStorage関連のユーティリティ

/**
 * LocalStorageへの安全な保存
 * @param {string} key - キー
 * @param {*} value - 保存する値
 * @returns {boolean} 保存成功時true
 */
function saveToStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        logError('LocalStorage保存エラー', error, { key, valueType: typeof value });
        return false;
    }
}

/**
 * LocalStorageからの安全な読み込み
 * @param {string} key - キー
 * @param {*} defaultValue - デフォルト値
 * @returns {*} 読み込まれた値またはデフォルト値
 */
function loadFromStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        logError('LocalStorage読み込みエラー', error, { key });
        return defaultValue;
    }
}