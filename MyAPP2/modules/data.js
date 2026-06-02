export async function render(containerId, { showToast }) {
    const container = document.getElementById(containerId);
    
    // 模拟数据
    let items = [
        { name: '项目 Alpha', progress: 85, status: '进行中' },
        { name: '项目 Beta', progress: 45, status: '进行中' },
        { name: '项目 Gamma', progress: 100, status: '已完成' }
    ];
    
    function renderTable() {
        const tbody = document.getElementById('tableBody');
        if (!tbody) return;
        
        tbody.innerHTML = items.map(item => `
            <tr>
                <td>${item.name}</td>
                <td>
                    <div style="background:#e0e0e0; border-radius:10px; overflow:hidden; width:100px;">
                        <div style="background:#667eea; width:${item.progress}%; height:20px; text-align:center; color:white; font-size:12px;">
                            ${item.progress}%
                        </div>
                    </div>
                </td>
                <td>${item.status}</td>
            </tr>
        `).join('');
    }
    
    container.innerHTML = `
        <div class="card">
            <h3>📊 项目列表</h3>
            <button class="btn" id="addBtn" style="margin: 12px 0;">➕ 添加项目</button>
            <table>
                <thead>
                    <tr>
                        <th>项目名称</th>
                        <th>进度</th>
                        <th>状态</th>
                    </tr>
                </thead>
                <tbody id="tableBody"></tbody>
            </table>
        </div>
        
        <div class="card" id="addForm" style="display:none;">
            <h3>➕ 添加新项目</h3>
            <input type="text" id="projectName" placeholder="项目名称">
            <input type="number" id="projectProgress" placeholder="进度 (0-100)">
            <button class="btn" id="saveBtn" style="margin-top: 8px;">保存</button>
            <button class="btn" id="cancelBtn" style="margin-top: 8px; background:#ccc;">取消</button>
        </div>
    `;
    
    renderTable();
    
    let addBtn = document.getElementById('addBtn');
    let addForm = document.getElementById('addForm');
    
    addBtn.addEventListener('click', () => {
        addForm.style.display = 'block';
    });
    
    document.getElementById('saveBtn')?.addEventListener('click', () => {
        let name = document.getElementById('projectName')?.value;
        let progress = parseInt(document.getElementById('projectProgress')?.value);
        
        if (name && progress >= 0 && progress <= 100) {
            items.push({
                name: name,
                progress: progress,
                status: progress === 100 ? '已完成' : '进行中'
            });
            renderTable();
            addForm.style.display = 'none';
            document.getElementById('projectName').value = '';
            document.getElementById('projectProgress').value = '';
            showToast('项目已添加');
        } else {
            showToast('请填写有效的项目名称和进度(0-100)');
        }
    });
    
    document.getElementById('cancelBtn')?.addEventListener('click', () => {
        addForm.style.display = 'none';
    });
}