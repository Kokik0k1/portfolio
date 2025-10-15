// カレンダー切り替えスクリプト

// Webアプリとして表示するHTML
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('カレンダー切り替え')
    .setWidth(350)
    .setHeight(500);
}

// プリセット一覧を取得
function getPresets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const presetSheet = ss.getSheetByName('プリセット設定');
  
  if (!presetSheet) {
    throw new Error('「プリセット設定」シートが見つかりません');
  }
  
  const data = presetSheet.getDataRange().getValues();
  const presets = [];
  
  // 2行目以降がプリセット（1行目はヘッダー）
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) { // プリセット名が空でない場合
      presets.push(data[i][0]);
    }
  }
  
  return presets;
}

// カレンダー切り替えを実行
function switchCalendar(presetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const calendarSheet = ss.getSheetByName('カレンダー一覧');
  const presetSheet = ss.getSheetByName('プリセット設定');
  const logSheet = ss.getSheetByName('エラーログ');
  
  if (!calendarSheet || !presetSheet) {
    throw new Error('必要なシートが見つかりません');
  }
  
  // カレンダー一覧を取得
  const calendarData = calendarSheet.getDataRange().getValues();
  const calendars = [];
  for (let i = 1; i < calendarData.length; i++) { // 1行目はヘッダー
    if (calendarData[i][0] && calendarData[i][1]) { // 名前とIDが両方ある
      calendars.push({
        name: calendarData[i][0],
        id: calendarData[i][1]
      });
    }
  }
  
  // プリセット設定を取得
  const presetData = presetSheet.getDataRange().getValues();
  let presetRow = -1;
  
  // 指定されたプリセット名の行を探す
  for (let i = 1; i < presetData.length; i++) {
    if (presetData[i][0] === presetName) {
      presetRow = i;
      break;
    }
  }
  
  if (presetRow === -1) {
    throw new Error('プリセット「' + presetName + '」が見つかりません');
  }
  
  // カレンダーの表示/非表示を設定
  const results = {
    success: [],
    errors: []
  };
  
  for (let i = 0; i < calendars.length; i++) {
    const calendar = calendars[i];
    const shouldShow = presetData[presetRow][i + 1] === true; // B列から始まるので+1
    
    try {
      // Calendar APIで表示/非表示を設定
      updateCalendarVisibility(calendar.id, shouldShow);
      results.success.push(calendar.name);
    } catch (error) {
      const errorMsg = calendar.name + ': ' + error.message;
      results.errors.push(errorMsg);
      
      // エラーログに記録
      if (logSheet) {
        logSheet.appendRow([
          new Date(),
          presetName,
          calendar.name,
          error.message
        ]);
      }
    }
  }
  
  return results;
}

// Calendar APIでカレンダーの表示/非表示を更新
function updateCalendarVisibility(calendarId, shouldShow) {
  try {
    // カレンダーIDが 'primary' の場合はそのまま使用
    const id = calendarId === 'primary' ? 'primary' : calendarId;
    
    // Calendar APIで現在の設定を取得
    const calendar = Calendar.CalendarList.get(id);
    
    // selected プロパティを更新
    calendar.selected = shouldShow;
    
    // 更新を適用
    Calendar.CalendarList.update(calendar, id);
    
  } catch (error) {
    throw new Error('API呼び出しエラー: ' + error.message);
  }
}

// 全カレンダーの現在の表示状態を取得（デバッグ用）
function getCurrentCalendarStatus() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const calendarSheet = ss.getSheetByName('カレンダー一覧');
  const calendarData = calendarSheet.getDataRange().getValues();
  
  const status = [];
  
  for (let i = 1; i < calendarData.length; i++) {
    if (calendarData[i][1]) {
      try {
        const id = calendarData[i][1];
        const calendar = Calendar.CalendarList.get(id);
        status.push({
          name: calendarData[i][0],
          id: id,
          selected: calendar.selected
        });
      } catch (error) {
        status.push({
          name: calendarData[i][0],
          id: calendarData[i][1],
          error: error.message
        });
      }
    }
  }
  
  return status;
}