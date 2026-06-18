import { createMustSignTabData as createMustSignSummaryData } from './mustSign/tabs/data.js';

export async function render(containerId, { showToast, navigateTo }) {
    // 子模块注册表（路径相对于本文件）
    const subModules = {
        reviewDaily:  { file: './dailyReview/index.js',     hideNav: false },
        reviewDailyYd:{ file: './dailyReview/yesterday.js', hideNav: false },
        signedReport:  { file: './signedReport/index.js',    hideNav: false },
    };

    // 子路由分发：已知子页面在内部处理，其余转发给 index.html
    const localNavigateTo = async (moduleId, routeParams = {}) => {
        if (moduleId === 'home') {
            const nav = document.querySelector('.app-nav');
            if (nav) nav.style.display = 'flex';
            await render(containerId, { showToast, navigateTo });
            return;
        }
        if (subModules[moduleId]) {
            const sub = subModules[moduleId];
            const nav = document.querySelector('.app-nav');
            if (nav) nav.style.display = sub.hideNav ? 'none' : 'flex';
            try {
                const url = new URL(`${sub.file}?t=${Date.now()}`, import.meta.url);
                const mod = await import(url.href);
                if (mod.render) {
                    await mod.render(containerId, {
                        navigateTo: localNavigateTo,
                        showToast,
                        routeParams,
                    });
                }
            } catch (e) {
                console.error('子模块加载失败:', e);
            }
            return;
        }
        navigateTo(moduleId, routeParams);
    };

    const container = document.getElementById(containerId);

    const mustSignSummary = createMustSignSummaryData();
    const mustSignCount = (mustSignSummary.tabMeta || [])
        .filter((item) => item.id === 'zcw' || item.id === 'dispatch')
        .reduce((total, item) => total + Number(item.count || 0), 0);
    const reviewDailyMetricsToday = [
        { label: '揽收超时', count: 8, mainId: 'scatter', subId: 'timeout' },
        { label: '未取件', count: 5, mainId: 'scatter', subId: 'notPicked' },
        { label: '虚假签收', count: 12, mainId: 'quality', subId: 'fakeSign' },
        { label: '遗失', count: 3, mainId: 'quality', subId: 'lost' },
        { label: '破损', count: 4, mainId: 'quality', subId: 'broken' },
        { label: '今日必签', count: 6, mainId: 'mustSign', subId: 'mustSign' },
        { label: '未电联', count: 6, mainId: 'scatter', subId: 'noCall' },
        { label: '未上门', count: 7, mainId: 'scatter', subId: 'noDoor' }
    ];
    const reviewDailyMetricsYesterday = [
        { label: '揽收超时', count: 86, mainId: 'scatter', subId: 'timeout' },
        { label: '未取件', count: 67, mainId: 'scatter', subId: 'notPicked' },
        { label: '虚假签收', count: 10, mainId: 'quality', subId: 'fakeSign' },
        { label: '遗失', count: 36, mainId: 'quality', subId: 'lost' },
        { label: '破损', count: 28, mainId: 'quality', subId: 'broken' },
        { label: '6日未出库', count: 30, mainId: 'mustSign', subId: null },
        { label: '未电联', count: 10, mainId: 'scatter', subId: 'noCall' },
        { label: '未上门', count: 12, mainId: 'scatter', subId: 'noDoor' }
    ];

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
                .stats-grid > div[role="button"] { cursor: pointer; }
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

                .review-daily-module {
                    margin-top: 10px;
                    background: #fff;
                    border-radius: 14px;
                    padding: 12px;
                    box-shadow: 0 1px 4px rgba(25, 38, 69, 0.06);
                }

                .review-daily-head {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 10px;
                    margin-bottom: 10px;
                }

                .review-daily-title {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 16px;
                    font-weight: 700;
                    color: #2f2f2f;
                }

                .review-daily-date {
                    display: inline-flex;
                    border-radius: 999px;
                    overflow: hidden;
                    border: 1px solid #dfe6f0;
                    background: #f6f8fc;
                }

                .review-daily-date span {
                    padding: 5px 10px;
                    font-size: 12px;
                    color: #738099;
                    line-height: 1;
                    cursor: pointer;
                }

                .review-daily-date .active {
                    background: #2d7bf2;
                    color: #fff;
                }

                .review-daily-grid {
                    display: grid;
                    grid-template-columns: repeat(4, minmax(0, 1fr));
                    gap: 8px;
                }

                .review-daily-item {
                    border: 1px solid #e4ebf4;
                    border-radius: 12px;
                    background: linear-gradient(180deg, #fbfdff 0%, #f4f8ff 100%);
                    padding: 10px 6px 9px;
                    text-align: center;
                    color: #4a566b;
                    cursor: pointer;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 4px;
                    min-height: 68px;
                    border-radius: 12px;
                }

                .review-daily-item:active {
                    transform: scale(0.99);
                }

                .review-daily-count {
                    font-size: 20px;
                    line-height: 1;
                    font-weight: 700;
                    color: #2d7bf2;
                }

                .review-daily-label {
                    font-size: 12px;
                    line-height: 1.2;
                    white-space: nowrap;
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

                .review-preview-modal {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.12);
                    z-index: 20;
                    display: none;
                    align-items: center;
                    justify-content: center;
                    padding: 24px;
                }

                .review-preview-shell {
                    width: 75%;
                    height: 70%;
                    min-width: 240px;
                    min-height: 360px;
                    max-width: 328px;
                    max-height: 675px;
                    border-radius: 16px;
                    background: #fff;
                    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.26);
                    position: relative;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }

                .review-preview-close {
                    width: 40px;
                    height: 40px;
                    border: 2px solid #d8e0ed;
                    border-radius: 50%;
                    background: #fff;
                    color: #1e2a3a;
                    font-size: 26px;
                    line-height: 1;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .review-preview-close-wrap {
                    position: absolute;
                    left: 50%;
                    bottom: 24px;
                    transform: translateX(-50%);
                }

                .review-preview-viewport {
                    width: 100%;
                    height: 100%;
                    overflow: auto;
                    background: #f4f5f8;
                }

                .review-preview-stage {
                    width: calc(100% / 0.7);
                    min-height: calc(100% / 0.7);
                    transform: scale(0.7);
                    transform-origin: top left;
                }

                .review-preview-content {
                    min-height: 100%;
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
                        <div id="mustSignStat" role="button" tabindex="0"><div class="stats-num">${mustSignCount}</div><div class="stats-label">待签收</div></div>
                        <div><div class="stats-num">0</div><div class="stats-label">派件跟踪</div></div>
                        <div><div class="stats-num">0</div><div class="stats-label">问题件</div></div>
                            <div id="signedStat" role="button" tabindex="0"><div class="stats-num">23</div><div class="stats-label">汇总数据</div></div>
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
                    <div class="card"><div class="card-left">🎓 学院</div><div>›</div></div>
                    <div class="card"><div class="card-left">✅ 质检</div><div>›</div></div>
                    <div class="card"><div class="card-left">⏰ 提醒</div><div>›</div></div>
                </section>

                <section class="review-daily-module" id="reviewDailyModule">
                    <div class="review-daily-head">
                        <div class="review-daily-title">复盘日报</div>
                        <div class="review-daily-date">
                            <span id="reviewDailyYesterdayTab">昨日</span>
                            <span id="reviewDailyTodayTab" class="active">今日</span>
                        </div>
                    </div>
                    <div class="review-daily-grid" id="reviewDailyGrid">
                        ${reviewDailyMetricsToday.map((item) => `
                            <button class="review-daily-item" type="button" data-review-main="${item.mainId}" data-review-sub="${item.subId}">
                                <span class="review-daily-count">${item.count}</span>
                                <span class="review-daily-label">${item.label}</span>
                            </button>
                        `).join('')}
                    </div>
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

            <div class="review-preview-modal" id="reviewPreviewModal" aria-label="复盘日报预览">
                <div class="review-preview-shell" id="reviewPreviewShell">
                    <div class="review-preview-viewport" id="reviewPreviewViewport">
                        <div class="review-preview-stage">
                            <div class="review-preview-content" id="reviewPreviewContent"></div>
                        </div>
                    </div>
                </div>
                <div class="review-preview-close-wrap">
                    <button class="review-preview-close" id="reviewPreviewClose" aria-label="关闭预览">×</button>
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
    const reviewDailyModule = document.getElementById('reviewDailyModule');
    const reviewDailyGrid = document.getElementById('reviewDailyGrid');
    const reviewDailyYesterdayTab = document.getElementById('reviewDailyYesterdayTab');
    const reviewDailyTodayTab = document.getElementById('reviewDailyTodayTab');
    const mustSignStat = document.getElementById('mustSignStat');
    const signedStat = document.getElementById('signedStat');
    const reviewPreviewModal = document.getElementById('reviewPreviewModal');
    const reviewPreviewShell = document.getElementById('reviewPreviewShell');
    const reviewPreviewClose = document.getElementById('reviewPreviewClose');
    const reviewPreviewContent = document.getElementById('reviewPreviewContent');

    let activeReviewDay = 'today';

    const jumpToReviewDaily = (mainId, subId = null, day = activeReviewDay) => {
        if (typeof localNavigateTo === 'function') {
            if (day === 'yesterday') {
                localNavigateTo('reviewDaily', {
                    day: 'yesterday',
                    switchLabel: '昨日',
                    switchTarget: 'reviewDaily',
                    hideMustSign: true,
                    backTarget: 'home',
                    initialLargeMetricId: mainId,
                    initialSubMetricId: subId || null
                });
            } else {
                localNavigateTo('reviewDaily', {
                    initialLargeMetricId: mainId,
                    initialSubMetricId: subId || null
                });
            }
            return;
        }

        showToast('复盘日报');
    };

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

    const renderReviewDailyGrid = () => {
        if (!reviewDailyGrid) return;
        const metrics = activeReviewDay === 'yesterday' ? reviewDailyMetricsYesterday : reviewDailyMetricsToday;
        reviewDailyGrid.innerHTML = metrics.map((item) => `
            <button class="review-daily-item" type="button" data-review-main="${item.mainId}" data-review-sub="${item.subId || ''}">
                <span class="review-daily-count">${item.count}</span>
                <span class="review-daily-label">${item.label}</span>
            </button>
        `).join('');

        Array.from(reviewDailyGrid.querySelectorAll('[data-review-main]')).forEach((item) => {
            item.addEventListener('click', () => {
                const mainId = item.getAttribute('data-review-main');
                const subId = item.getAttribute('data-review-sub') || null;
                jumpToReviewDaily(mainId, subId, activeReviewDay);
            });

            item.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    const mainId = item.getAttribute('data-review-main');
                    const subId = item.getAttribute('data-review-sub') || null;
                    jumpToReviewDaily(mainId, subId, activeReviewDay);
                }
            });
        });
    };

    const updateReviewDayTabs = () => {
        if (reviewDailyYesterdayTab) reviewDailyYesterdayTab.classList.toggle('active', activeReviewDay === 'yesterday');
        if (reviewDailyTodayTab) reviewDailyTodayTab.classList.toggle('active', activeReviewDay === 'today');
    };

    if (reviewDailyModule) {
        if (reviewDailyYesterdayTab) {
            reviewDailyYesterdayTab.addEventListener('click', () => {
                activeReviewDay = 'yesterday';
                updateReviewDayTabs();
                renderReviewDailyGrid();
            });
        }

        if (reviewDailyTodayTab) {
            reviewDailyTodayTab.addEventListener('click', () => {
                activeReviewDay = 'today';
                updateReviewDayTabs();
                renderReviewDailyGrid();
            });
        }

        updateReviewDayTabs();
        renderReviewDailyGrid();
    }

    if (mustSignStat) {
        const jumpToMustSign = () => {
            if (typeof localNavigateTo === 'function') {
                localNavigateTo('mustSign', { initialTab: 'dispatch' });
            } else {
                showToast('待签收');
            }
        };

        mustSignStat.addEventListener('click', jumpToMustSign);
        mustSignStat.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                jumpToMustSign();
            }
        });
    }

    if (signedStat) {
        const jumpToSignedReport = () => {
            if (typeof localNavigateTo === 'function') {
                localNavigateTo('signedReport', {
                    view: 'summary',
                    selectedDateKey: '2026-06-03',
                    courierId: 'all'
                });
            } else {
                showToast('已签收汇总');
                            showToast('汇总数据');
            }
        };

        signedStat.addEventListener('click', jumpToSignedReport);
        signedStat.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                jumpToSignedReport();
            }
        });
    }

    const closeReviewPreview = () => {
        if (reviewPreviewModal) reviewPreviewModal.style.display = 'none';
    };

    const openReviewDailyFullScreen = () => {
        closeReviewPreview();
        localNavigateTo('reviewDailyYd');
    };

    const mountReviewPreview = async () => {
        if (!reviewPreviewModal || !reviewPreviewContent) return;

        reviewPreviewModal.style.display = 'flex';

        try {
            const url = new URL(`./dailyReview/yesterday.js?t=${Date.now()}`, import.meta.url);
            const mod = await import(url.href);
            if (mod.render) {
                await mod.render('reviewPreviewContent', {
                    navigateTo: localNavigateTo,
                    showToast,
                    routeParams: {
                        fromHomePreview: true
                    }
                });
            }
        } catch (error) {
            console.error('昨日复盘日报预览加载失败:', error);
            reviewPreviewContent.innerHTML = '<div style="padding:24px;color:#666;">昨日复盘日报预览加载失败</div>';
        }

        if (reviewPreviewClose) {
            reviewPreviewClose.addEventListener('click', (event) => {
                event.stopPropagation();
                closeReviewPreview();
            });
        }

        if (reviewPreviewShell) {
            reviewPreviewShell.addEventListener('click', (event) => {
                if (event.target === reviewPreviewClose || event.target.closest('#reviewPreviewClose')) {
                    return;
                }
                openReviewDailyFullScreen();
            });
        }
    };

    await mountReviewPreview();
}