export async function render(containerId, { showToast }) {
    const container = document.getElementById(containerId);
    
    // 读取保存的设置
    let isDark = localStorage.getItem('darkMode') === 'true';
    
    // 应用主题
    if (isDark) {
        document.body.style.backgroundColor = '#1a1a2e';
        document.body.style.color = '#eee';
    } else {
        document.body.style.backgroundColor = '#f5f5f5';
        document.body.style.color = '#333';
    }
    
    container.innerHTML = `
        <div class="card">
            <h3>⚙️ 设置</h3>
            
            <div style="margin: 20px 0; display: flex; justify-content: space-between; align-items: center;">
                <span>🌙 深色模式</span>
                <label style="position: relative; display: inline-block; width: 50px; height: 24px;">
                    <input type="checkbox" id="darkModeToggle" style="display: none;" ${isDark ? 'checked' : ''}>
                    <span id="toggleSlider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: ${isDark ? '#667eea' : '#ccc'}; transition: .3s; border-radius: 24px;"></span>
                    <span id="toggleKnob" style="position: absolute; content: ''; height: 18px; width: 18px; left: ${isDark ? '28px' : '3px'}; bottom: 3px; background-color: white; transition: .3s; border-radius: 50%;"></span>
                </label>
            </div>
            
            <button class="btn" id="clearDataBtn" style="width:100%; margin-top:20px; background:#ff6b6b;">🗑️ 清除所有数据</button>
        </div>
        
        <div class="card">
            <h3>ℹ️ 关于</h3>
            <p style="margin-top:8px;">版本 1.0<br>修改 modules 文件夹里的文件即可更新功能</p>
        </div>
    `;
    
    // 深色模式切换
    let darkToggle = document.getElementById('darkModeToggle');
    let toggleSlider = document.getElementById('toggleSlider');
    let toggleKnob = document.getElementById('toggleKnob');
    
    function updateToggle(isChecked) {
        toggleSlider.style.backgroundColor = isChecked ? '#667eea' : '#ccc';
        toggleKnob.style.left = isChecked ? '28px' : '3px';
    }
    
    darkToggle.addEventListener('change', (e) => {
        let isChecked = e.target.checked;
        localStorage.setItem('darkMode', isChecked);
        updateToggle(isChecked);
        
        if (isChecked) {
            document.body.style.backgroundColor = '#1a1a2e';
            document.body.style.color = '#eee';
        } else {
            document.body.style.backgroundColor = '#f5f5f5';
            document.body.style.color = '#333';
        }
        showToast(`已切换为${isChecked ? '深色' : '浅色'}模式`);
    });
    
    // 清除数据
    document.getElementById('clearDataBtn')?.addEventListener('click', () => {
        localStorage.clear();
        showToast('所有本地数据已清除');
        setTimeout(() => location.reload(), 1000);
    });
}