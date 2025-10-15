document.addEventListener('DOMContentLoaded', () => {
  displayPresets();
});

function displayPresets() {
  const container = document.getElementById('presetButtons');
  
  CONFIG.PRESETS.forEach(preset => {
    const btn = document.createElement('button');
    btn.className = 'preset-btn';
    btn.textContent = preset;
    btn.onclick = () => executeSwitch(preset);
    container.appendChild(btn);
  });
}

function executeSwitch(presetName) {
  const buttons = document.querySelectorAll('.preset-btn');
  buttons.forEach(btn => btn.disabled = true);
  
  showStatus('loading', `<span class="loading-spinner"></span>「${presetName}」に切り替え中...`);
  
  chrome.runtime.sendMessage(
    {
      action: 'switchCalendar',
      presetName: presetName,
      appsScriptUrl: CONFIG.APPS_SCRIPT_URL
    },
    (response) => {
      if (response.success) {
        showStatus('success', `✓ 切り替え完了！ページをリロードします...`);
        
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'reloadCalendar' });
        });
        
        setTimeout(() => {
          window.close();
        }, 1500);
      } else {
        buttons.forEach(btn => btn.disabled = false);
        showStatus('error', `❌ エラー: ${response.error}`);
      }
    }
  );
}

function showStatus(type, message) {
  const statusEl = document.getElementById('status');
  statusEl.className = 'status-' + type;
  statusEl.innerHTML = message;
  statusEl.style.display = 'block';
}