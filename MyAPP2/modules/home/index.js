export async function render(containerId, { showToast, navigateTo }) {
    const container = document.getElementById(containerId);

    container.innerHTML = `
        <section class="home-ref">
            <style>
                .home-ref {
                    min-height: 100%;
                    background: #f0f1f4;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    color: #5a5a5a;
                }

                .top-grad {
                    background: linear-gradient(115deg, #4b78ee 0%, #42a8f5 100%);
                    padding: 8px 12px 10px;
                    color: #fff;
                }

                .status {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    height: 30px;
                    font-weight: 600;
                }

                .status-time { font-size: 18px; letter-spacing: 0.3px; }
                .status-right { font-size: 16px; opacity: 0.95; }
                .status-dot {
                    width: 16px;
                    height: 16px;
                    border: 1.5px solid #fff;
                    border-radius: 50%;
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .status-dot::after {
                    content: '';
                    width: 4px;
                    height: 4px;
                    background: #fff;
                    border-radius: 50%;
                }

                .headline {
                    display: grid;
                    grid-template-columns: 24px 1fr 16px;
                    align-items: center;
                    gap: 8px;
                    margin-top: 6px;
                }

                .improve {
                    width: 24px;
                    height: 24px;
                    border-radius: 5px;
                    border: 1px solid rgba(255, 255, 255, 0.8);
                    font-size: 6px;
                    line-height: 1.06;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                }

                .rolling {
                    overflow: hidden;
                    white-space: nowrap;
                    font-size: 13px;
                    opacity: 0.96;
                }

                .rolling span {
                    display: inline-block;
                    padding-left: 100%;
                    animation: ticker 12s linear infinite;
                }

                .weather-search {
                    margin-top: 2px;
                    display: grid;
                    grid-template-columns: 48px auto 1fr 24px;
                    align-items: center;
                    gap: 4px;
                    height: 34px;
                }

                .weather { font-size: 12px; font-weight: 400; line-height: 1.1; }
                .weather small { display: block; font-size: 10px; margin-top: 2px; font-weight: 400; }

                .qr-mini {
                    width: 24px;
                    height: 24px;
                    border-radius: 4px;
                    border: 1.5px solid #fff;
                    margin: 0 6px;
                    background: 
                        linear-gradient(90deg, #fff 0px, #fff 4px, transparent 4px, transparent 6px, #fff 6px, #fff 10px, transparent 10px, transparent 12px, #fff 12px, #fff 16px, transparent 16px, transparent 18px, #fff 18px, #fff 22px),
                        linear-gradient(0deg, #fff 0px, #fff 4px, transparent 4px, transparent 6px, #fff 6px, #fff 10px, transparent 10px, transparent 12px, #fff 12px, #fff 16px, transparent 16px, transparent 18px, #fff 18px, #fff 22px),
                        linear-gradient(90deg, #fff 0%, #fff 20%, transparent 20%, transparent 80%, #fff 80%, #fff 100%),
                        transparent;
                    background-size: 24px 24px, 24px 24px, 24px 24px;
                    background-position: 0 0, 0 0, 0 0;
                    background-repeat: no-repeat;
                    position: relative;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                }
                .qr-mini::before {
                    content: '';
                    position: absolute;
                    width: 6px;
                    height: 6px;
                    background: #fff;
                    top: 1px;
                    right: 1px;
                    border-radius: 1px;
                    box-shadow: 
                        8px 0 0 #fff,
                        0 8px 0 #fff,
                        8px 8px 0 #fff,
                        0 6px 0 #fff,
                        8px 0 0 #fff;
                }
                .qr-mini::after {
                    content: '';
                    display: none;
                }

                .search {
                    height: 34px;
                    border-radius: 999px;
                    border: none;
                    background: rgba(244, 244, 244, 0.9);
                    color: #8e8e8e;
                    font-size: 12px;
                    display: flex;
                    align-items: center;
                    padding: 0 10px;
                    gap: 5px;
                }
                .search-ico { font-size: 14px; opacity: 0.5; }
                .search-text { font-size: 12px; opacity: 0.48; }

                .msg-box {
                    width: 24px;
                    height: 24px;
                    border-radius: 5px;
                    border: 1.5px solid rgba(255, 255, 255, 0.9);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 13px;
                    position: relative;
                    cursor: pointer;
                }
                .msg-count {
                    position: absolute;
                    top: -8px;
                    right: -7px;
                    width: 18px;
                    height: 18px;
                    border-radius: 999px;
                    background: #ff4444;
                    color: #fff;
                    font-size: 10px;
                    line-height: 18px;
                    text-align: center;
                }

                .msg-list {
                    display: none;
                    margin: 8px 2px 0;
                    background: rgba(255, 255, 255, 0.94);
                    color: #646464;
                    border-radius: 12px;
                    padding: 8px 10px;
                    font-size: 12px;
                    line-height: 1.65;
                }

                .content-wrap {
                    margin-top: -2px;
                    padding: 8px 10px 10px;
                }

                .stats {
                    background: #fff;
                    border-radius: 14px;
                    overflow: hidden;
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    text-align: center;
                    padding: 12px 2px;
                }
                .stats-grid + .stats-grid { border-top: 1px solid #ececec; }
                .stats-num { font-size: 22px; font-weight: 700; color: #3f3f3f; }
                .stats-label { margin-top: 4px; font-size: 12px; color: #666; }

                .tools {
                    margin-top: 10px;
                    padding: 0 6px;
                }

                .tool-scroll {
                    display: flex;
                    overflow-x: auto;
                    scroll-snap-type: x mandatory;
                    scrollbar-width: none;
                }
                .tool-scroll::-webkit-scrollbar { display: none; }
                .tool-page {
                    min-width: 100%;
                    scroll-snap-align: start;
                    display: grid;
                    grid-template-columns: repeat(5, 1fr);
                    row-gap: 14px;
                    column-gap: 8px;
                }

                .tool {
                    text-align: center;
                    font-size: 11px;
                    color: #666;
                }
                .tool-ico {
                    width: 40px;
                    height: 40px;
                    margin: 0 auto 6px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #fff;
                    font-size: 24px;
                    font-weight: 700;
                }
                .ico-o { background: linear-gradient(135deg, #ff9a2f, #ffbe57); }
                .ico-g { background: linear-gradient(135deg, #19be88, #65d7b1); }
                .ico-b { background: linear-gradient(135deg, #1f83ef, #62b2ff); }
                .tool-name { white-space: nowrap; }

                .dots {
                    display: flex;
                    justify-content: center;
                    gap: 6px;
                    margin-top: 8px;
                }
                .dot {
                    width: 6px;
                    height: 6px;
                    background: #a8c4f2;
                    border-radius: 999px;
                }
                .dot.active { width: 16px; background: #2d7bf2; }

                .brief {
                    margin-top: 10px;
                    background: #ececec;
                    border-radius: 10px;
                    height: 42px;
                    padding: 0 14px;
                    display: flex;
                    align-items: center;
                    font-size: 13px;
                    font-weight: 600;
                    color: #8a8a8a;
                }

                .metrics {
                    margin-top: 10px;
                    background: #ededed;
                    border-radius: 12px;
                    overflow-x: auto;
                    scrollbar-width: none;
                }
                .metrics::-webkit-scrollbar { display: none; }
                .metric-row {
                    display: flex;
                    min-width: max-content;
                }
                .metric {
                    width: 82px;
                    text-align: center;
                    padding: 10px 0;
                    border-right: 1px solid #d7d7d7;
                    font-size: 13px;
                }
                .metric:last-child { border-right: none; }
                .metric-num { font-size: 18px; color: #525252; }
                .metric-name { margin-top: 2px; white-space: nowrap; color: #6a6a6a; }

                .cards {
                    margin-top: 10px;
                    display: flex;
                    gap: 8px;
                    overflow-x: auto;
                    scrollbar-width: none;
                }
                .cards::-webkit-scrollbar { display: none; }
                .card {
                    flex: 0 0 115px;
                    background: #ececec;
                    border-radius: 9px;
                    height: 58px;
                    padding: 0 8px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    font-size: 13px;
                    font-weight: 600;
                    color: #828282;
                }
                .card-left { display: flex; align-items: center; gap: 6px; white-space: nowrap; }

                .card-unread-dot {
                    width: 7px;
                    height: 7px;
                    border-radius: 50%;
                    background: #ff4d4f;
                    flex-shrink: 0;
                }

                .banner {
                    margin-top: 10px;
                    border-radius: 12px;
                    overflow: hidden;
                    height: 84px;
                    position: relative;
                    background: linear-gradient(110deg, #ffb000, #ff7f00);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 16px;
                    color: #fff;
                    font-weight: 700;
                }
                .banner-big { font-size: 44px; text-shadow: 0 3px 0 rgba(146, 46, 0, 0.35); }
                .banner-sub { font-size: 12px; margin-top: 2px; }
                .banner-people { font-size: 30px; }

                .code {
                    text-align: center;
                    color: #8d8d8d;
                    font-size: 11px;
                    margin: 20px 0 8px;
                }

                .qr-modal {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.45);
                    display: none;
                    align-items: center;
                    justify-content: center;
                    z-index: 10;
                }
                .qr-card {
                    width: 220px;
                    background: #fff;
                    border-radius: 14px;
                    padding: 14px;
                    text-align: center;
                }
                .qr-big {
                    width: 160px;
                    height: 160px;
                    margin: 10px auto;
                    background:
                        repeating-linear-gradient(90deg, #222 0, #222 8px, #fff 8px, #fff 16px),
                        repeating-linear-gradient(0deg, #222 0, #222 8px, #fff 8px, #fff 16px);
                    border-radius: 8px;
                }
                .close-btn {
                    border: none;
                    background: #2a7cf3;
                    color: #fff;
                    padding: 6px 14px;
                    border-radius: 999px;
                    font-size: 13px;
                    cursor: pointer;
                }

                @keyframes ticker {
                    from { transform: translateX(0); }
                    to { transform: translateX(-130%); }
                }
            </style>

            <div class="top-grad">
                <div class="status">
                    <div class="status-time">14:02 ☾</div>
                    <div class="status-right">◫◫◫ ᯤ 89</div>
                </div>

                <div class="headline">
                    <button class="improve" id="improveBtn">改进<br>建议</button>
                    <div class="rolling"><span>丨本，感谢客户和员工对韵达的支持和厚爱</span></div>
                    <div class="status-dot"></div>
                </div>

                <div class="weather-search">
                    <div class="weather">28°C<small>多云</small></div>
                    <button class="qr-mini" id="qrMiniBtn" aria-label="二维码"></button>
                    <div class="search"><span class="search-ico">◯</span><span class="search-text">输入运单号查询</span></div>
                    <button class="msg-box" id="msgBtn">💬<span class="msg-count">20</span></button>
                </div>
                <div class="msg-list" id="msgList">
                    10:10 待签收提醒：2 票即将超时<br>
                    09:45 客户催件：单号 YD20260531001<br>
                    08:50 运营通知：今日线路优化已生效
                </div>
            </div>

            <div class="content-wrap">
                <section class="stats">
                    <div class="stats-grid">
                        <div><div class="stats-num">2</div><div class="stats-label">待签收</div></div>
                        <div><div class="stats-num">0</div><div class="stats-label">派件跟踪</div></div>
                        <div><div class="stats-num">0</div><div class="stats-label">问题件</div></div>
                        <div><div class="stats-num">0</div><div class="stats-label">已签收</div></div>
                    </div>
                    <div class="stats-grid">
                        <div><div class="stats-num">1</div><div class="stats-label">待揽收</div></div>
                        <div><div class="stats-num">0</div><div class="stats-label">预约单</div></div>
                        <div><div class="stats-num">3</div><div class="stats-label">待收款</div></div>
                        <div><div class="stats-num">1</div><div class="stats-label">收件跟踪</div></div>
                    </div>
                </section>

                <section class="tools">
                    <div class="tool-scroll" id="toolScroll">
                        <div class="tool-page">
                            <div class="tool"><div class="tool-ico ico-o">分</div><div class="tool-name">分发扫描</div></div>
                            <div class="tool"><div class="tool-ico ico-o">到</div><div class="tool-name">到派扫描</div></div>
                            <div class="tool"><div class="tool-ico ico-o">签</div><div class="tool-name">签收扫描</div></div>
                            <div class="tool"><div class="tool-ico ico-o">揽</div><div class="tool-name">揽件扫描</div></div>
                            <div class="tool"><div class="tool-ico ico-b">三</div><div class="tool-name">现场打单</div></div>
                            <div class="tool"><div class="tool-ico ico-g">查</div><div class="tool-name">快件查询</div></div>
                            <div class="tool"><div class="tool-ico ico-g">☎</div><div class="tool-name">打电话</div></div>
                            <div class="tool"><div class="tool-ico ico-b">信</div><div class="tool-name">发消息</div></div>
                            <div class="tool"><div class="tool-ico ico-g">↑</div><div class="tool-name">待上传</div></div>
                            <div class="tool"><div class="tool-ico ico-o">¤</div><div class="tool-name">隐私面单查询</div></div>
                        </div>
                        <div class="tool-page">
                            <div class="tool"><div class="tool-ico ico-b">工</div><div class="tool-name">工具中心</div></div>
                            <div class="tool"><div class="tool-ico ico-g">统</div><div class="tool-name">统计看板</div></div>
                            <div class="tool"><div class="tool-ico ico-o">服</div><div class="tool-name">服务评价</div></div>
                            <div class="tool"><div class="tool-ico ico-b">账</div><div class="tool-name">账单核对</div></div>
                            <div class="tool"><div class="tool-ico ico-g">设</div><div class="tool-name">功能设置</div></div>
                            <div class="tool"><div class="tool-ico ico-o">站</div><div class="tool-name">站点管理</div></div>
                            <div class="tool"><div class="tool-ico ico-b">客</div><div class="tool-name">客户档案</div></div>
                            <div class="tool"><div class="tool-ico ico-g">路</div><div class="tool-name">线路导航</div></div>
                            <div class="tool"><div class="tool-ico ico-o">异</div><div class="tool-name">异常件库</div></div>
                            <div class="tool"><div class="tool-ico ico-b">调</div><div class="tool-name">运力调度</div></div>
                        </div>
                    </div>
                    <div class="dots" id="toolDots"><span class="dot active"></span><span class="dot"></span></div>
                </section>

                <div class="brief">🔊 读懂【复盘日报】，工作更高效</div>

                <section class="metrics">
                    <div class="metric-row">
                        <div class="metric"><div class="metric-num">0</div><div class="metric-name">派前电联</div></div>
                        <div class="metric"><div class="metric-num">1</div><div class="metric-name">送货上门</div></div>
                        <div class="metric"><div class="metric-num">0</div><div class="metric-name">贴画上传</div></div>
                        <div class="metric"><div class="metric-num">0</div><div class="metric-name">客户预警</div></div>
                        <div class="metric"><div class="metric-num">0</div><div class="metric-name">我的工单</div></div>
                    </div>
                </section>

                <section class="cards">
                    <div class="card"><div class="card-left">🗓 待办</div><div>›</div></div>
                    <div class="card" id="reviewDailyCard" role="button" tabindex="0"><div class="card-left">🧾 复盘日报<span class="card-unread-dot" aria-hidden="true"></span></div><div>›</div></div>
                    <div class="card"><div class="card-left">🎓 学院</div><div>›</div></div>
                    <div class="card"><div class="card-left">✅ 质检</div><div>›</div></div>
                    <div class="card"><div class="card-left">⏰ 提醒</div><div>›</div></div>
                </section>

                <section class="banner">
                    <div>
                        <div class="banner-big">双者荣耀</div>
                        <div class="banner-sub">2026年韵达第四届快递员岗位技能大赛</div>
                    </div>
                    <div class="banner-people">🏃🏃</div>
                </section>

                <div class="code">201866|1063|05|V8.96.0</div>
            </div>

            <div class="qr-modal" id="qrModal">
                <div class="qr-card">
                    <div>扫描进入工作台</div>
                    <div class="qr-big"></div>
                    <button class="close-btn" id="closeQrBtn">关闭</button>
                </div>
            </div>
        </section>
    `;

    const improveBtn = document.getElementById('improveBtn');
    const qrMiniBtn = document.getElementById('qrMiniBtn');
    const qrModal = document.getElementById('qrModal');
    const closeQrBtn = document.getElementById('closeQrBtn');
    const msgBtn = document.getElementById('msgBtn');
    const msgList = document.getElementById('msgList');
    const toolScroll = document.getElementById('toolScroll');
    const toolDots = document.getElementById('toolDots');
    const reviewDailyCard = document.getElementById('reviewDailyCard');

    if (improveBtn) {
        improveBtn.addEventListener('click', () => showToast('改进建议入口'));
    }

    if (msgBtn && msgList) {
        msgBtn.addEventListener('click', () => {
            msgList.style.display = msgList.style.display === 'block' ? 'none' : 'block';
        });
    }

    if (qrMiniBtn && qrModal) {
        qrMiniBtn.addEventListener('click', () => {
            qrModal.style.display = 'flex';
        });
    }

    if (closeQrBtn && qrModal) {
        closeQrBtn.addEventListener('click', () => {
            qrModal.style.display = 'none';
        });
    }

    if (qrModal) {
        qrModal.addEventListener('click', (event) => {
            if (event.target === qrModal) qrModal.style.display = 'none';
        });
    }

    if (toolScroll && toolDots) {
        const dots = Array.from(toolDots.querySelectorAll('.dot'));
        toolScroll.addEventListener('scroll', () => {
            const index = Math.round(toolScroll.scrollLeft / toolScroll.clientWidth);
            dots.forEach((dot, i) => {
                if (i === index) dot.classList.add('active');
                else dot.classList.remove('active');
            });
        });
    }

    if (reviewDailyCard) {
        const jumpToReviewDaily = () => {
            if (typeof navigateTo === 'function') {
                navigateTo('reviewDaily');
            } else {
                showToast('复盘日报');
            }
        };

        reviewDailyCard.addEventListener('click', jumpToReviewDaily);
        reviewDailyCard.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                jumpToReviewDaily();
            }
        });
    }
}