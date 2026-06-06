export async function render(containerId, { navigateTo, showToast } = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // 从明细页切回汇总页时，容器可能保留了 overflow:hidden；这里显式恢复可滚动布局。
    container.style.display = 'block';
    container.style.flexDirection = '';
    container.style.height = '100%';
    container.style.minHeight = '0';
    container.style.overflow = 'auto';

    container.innerHTML = `
        <section class="review-page">
            <style>
                .review-page {
                    height: 100%;
                    min-height: 0;
                    background: #eef0f4;
                    color: #1f2329;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', sans-serif;
                    padding-bottom: 18px;
                    overflow-y: auto;
                    -webkit-overflow-scrolling: touch;
                    --indicator-size: 14px;
                }

                .review-topbar {
                    background: linear-gradient(105deg, #1f4bea 0%, #3c76ff 48%, #57b6ff 100%);
                    position: sticky;
                    top: 0;
                    overflow: hidden;
                    z-index: 5;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 10px 34px 13px;
                    min-height: 60px;
                    margin-bottom: 0;
                }

                .summary-switch-btn {
                    position: absolute;
                    right: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    border: 1px solid rgba(255, 255, 255, 0.45);
                    background: rgba(255, 255, 255, 0.16);
                    color: rgba(255, 255, 255, 0.95);
                    border-radius: 999px;
                    padding: 6px 10px;
                    font-size: 13px;
                    font-weight: 600;
                    line-height: 1;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    flex-shrink: 0;
                    gap: 4px;
                }

                .summary-switch-caret {
                    width: 0;
                    height: 0;
                    border-left: 4px solid transparent;
                    border-right: 4px solid transparent;
                    border-top: 5px solid rgba(255, 255, 255, 0.95);
                }

                .review-back {
                    position: absolute;
                    left: 0;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 28px;
                    height: 28px;
                    border: none;
                    background: transparent;
                    border-radius: 999px;
                    font-size: 24px;
                    line-height: 1;
                    color: #fff;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                }

                .title-wrap {
                    display: flex;
                    flex-direction: column;
                    gap: 3px;
                    align-items: center;
                    text-align: center;
                }

                .title {
                    font-size: 21px;
                    font-weight: 400;
                    color: #fff;
                    letter-spacing: -0.2px;
                    line-height: 1.25;
                }

                .title-sub {
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.88);
                    line-height: 1.45;
                }

                .review-banner {
                    padding: 16px 18px 14px;
                    background: linear-gradient(105deg, #1f4bea 0%, #3c76ff 48%, #57b6ff 100%);
                    position: relative;
                    overflow: hidden;
                }

                .review-banner::after {
                    content: '';
                    position: absolute;
                    right: -24px;
                    top: -18px;
                    width: 170px;
                    height: 130px;
                    border-radius: 36px;
                    background: radial-gradient(circle at 32% 45%, rgba(255,255,255,0.45), rgba(255,255,255,0.08) 65%, transparent 66%);
                    opacity: 0.95;
                }

                .review-banner-title {
                    position: relative;
                    z-index: 1;
                    font-size: 24px;
                    line-height: 1;
                    font-weight: 700;
                    color: #fff;
                    letter-spacing: 0;
                }

                .review-banner-title small {
                    display: inline-flex;
                    gap: 6px;
                    margin-left: 8px;
                    vertical-align: middle;
                }

                .review-date-btn {
                    border: 1px solid rgba(255, 255, 255, 0.45);
                    background: rgba(255, 255, 255, 0.16);
                    color: rgba(255, 255, 255, 0.9);
                    font-size: 12px;
                    font-weight: 600;
                    line-height: 1;
                    border-radius: 999px;
                    padding: 6px 10px;
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .review-date-btn:hover {
                    background: rgba(255, 255, 255, 0.24);
                }

                .review-date-btn.is-active {
                    background: #fff;
                    color: #1f4bea;
                    border-color: #fff;
                    box-shadow: 0 2px 6px rgba(14, 33, 86, 0.22);
                }

                .review-date-time {
                    display: none;
                    font-size: 11px;
                    padding: 2px 6px;
                    border-radius: 999px;
                    background: rgba(31, 75, 234, 0.1);
                }

                .review-date-btn.is-active[data-day='today'] .review-date-time {
                    display: inline-flex;
                }

                .review-banner-sub {
                    position: relative;
                    z-index: 1;
                    margin-top: 8px;
                    color: #f4fbff;
                    font-size: 14px;
                    font-weight: 600;
                }

                .review-main {
                    margin-top: -8px;
                    padding: 0 14px 24px;
                }

                .panel {
                    background: #fff;
                    border-radius: 20px;
                    padding: 14px 12px;
                    margin-bottom: 12px;
                    box-shadow: 0 2px 8px rgba(18, 45, 96, 0.04);
                }

                .panel-title {
                    display: flex;
                    align-items: baseline;
                    justify-content: space-between;
                    margin-bottom: 12px;
                    font-size: 17px;
                    font-weight: 700;
                }

                .panel-title-sub {
                    font-size: 12px;
                    color: #8a8f9b;
                    font-weight: 500;
                }

                .income-grid {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr) auto minmax(0, 1fr);
                    gap: 4px;
                    align-items: start;
                }

                .income-cell {
                    text-align: left;
                }

                .income-name {
                    font-size: 13px;
                    color: #2e3341;
                    margin-bottom: 4px;
                }

                .income-main {
                    font-size: calc(var(--indicator-size) + 4px);
                    font-weight: 700;
                    line-height: 1.15;
                }

                .income-main small {
                    font-size: 12px;
                    font-weight: 700;
                    margin-left: 2px;
                }

                .income-est,
                .income-yesterday {
                    margin-top: 4px;
                    font-size: 12px;
                    color: #5a6072;
                }

                .income-est strong,
                .income-yesterday strong {
                    color: #202738;
                }

                .income-op {
                    font-size: 20px;
                    color: #8a8f9b;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    line-height: 1;
                    padding-top: 22px;
                }

                .exception-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 8px;
                }

                .exception-col-title {
                    font-size: 12px;
                    color: #65708a;
                    margin-bottom: 6px;
                    font-weight: 600;
                }

                .exception-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin: 6px 0;
                    font-size: 12px;
                }

                .exception-item strong,
                .exception-item a {
                    font-size: var(--indicator-size);
                    line-height: 1;
                    font-weight: 700;
                }

                .detail-jump {
                    color: #2f7dff;
                    text-decoration: none;
                    cursor: pointer;
                }

                .settle-main {
                    font-size: 11px;
                    color: #656f84;
                }

                .settle-note {
                    font-size: 10px;
                    color: #7f889a;
                }

                .quality-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 6px;
                    margin-top: 4px;
                }

                .quality-item {
                    text-align: center;
                }

                .quality-name {
                    font-size: 12px;
                    color: #626c84;
                    margin-bottom: 4px;
                }

                .quality-num {
                    font-size: var(--indicator-size);
                    font-weight: 700;
                    line-height: 1;
                }

                .risk-grid {
                    display: grid;
                    grid-template-columns: 2fr 3fr;
                    gap: 8px;
                    margin-bottom: 8px;
                }

                .risk-card {
                    border: 1px solid #e6ebf2;
                    border-radius: 14px;
                    overflow: hidden;
                    background: #fff;
                }

                .risk-head {
                    background: #f4f7fb;
                    text-align: center;
                    font-size: 14px;
                    color: #313847;
                    font-weight: 600;
                    padding: 8px;
                }

                .risk-body {
                    padding: 10px 12px;
                    color: #2f3645;
                    font-size: 12px;
                    line-height: 1.5;
                }

                .risk-tip {
                    color: #8e95a4;
                    font-size: 11px;
                }

                .two-col {
                    display: grid;
                    grid-template-columns: 2fr 3fr;
                    gap: 8px;
                    margin-bottom: 8px;
                }

                .stat-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin: 4px 0;
                    font-size: 12px;
                }

                .stat-row strong {
                    font-size: var(--indicator-size);
                    line-height: 1;
                    font-weight: 700;
                }

                .stat-row a {
                    color: #2f7dff;
                    text-decoration: underline;
                    cursor: pointer;
                    font-weight: 700;
                    font-size: var(--indicator-size);
                    line-height: 1;
                }

                .warn-line {
                    margin-top: 8px;
                    color: #ff5d58;
                    font-size: 12px;
                }

                .board {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 8px;
                }

                .board-col {
                    border-right: 1px solid #e7ebf2;
                    padding-right: 6px;
                }

                .board-col:last-child {
                    border-right: none;
                    padding-left: 8px;
                    padding-right: 0;
                }

                .board-label {
                    font-size: 13px;
                    color: #2c3240;
                    margin-bottom: 6px;
                }

                .board-value {
                    font-size: var(--indicator-size);
                    line-height: 1;
                    font-weight: 700;
                }

                .board-note {
                    margin-top: 6px;
                    font-size: 12px;
                    color: #555d6e;
                    line-height: 1.4;
                }

                .emoji {
                    font-size: 30px;
                    margin-left: 6px;
                }

                .progress {
                    margin-top: 8px;
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 6px;
                }

                .progress span {
                    height: 8px;
                    border-radius: 999px;
                    background: #d7dce6;
                    overflow: hidden;
                }

                .progress .active::after {
                    content: '';
                    display: block;
                    width: 74%;
                    height: 100%;
                    background: #46bf8f;
                }

                .overview-list {
                    margin: 0;
                    padding: 0;
                    list-style: none;
                    color: #232a38;
                }

                .overview-list li {
                    position: relative;
                    padding-left: 18px;
                    margin: 12px 0;
                    font-size: 13px;
                    line-height: 1.45;
                }

                .overview-list li::before {
                    content: '';
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    position: absolute;
                    left: 0;
                    top: 10px;
                }

                .overview-list li:nth-child(1)::before { background: #2f7dff; }
                .overview-list li:nth-child(2)::before { background: #f8b500; }
                .overview-list li:nth-child(3)::before { background: #ff4c44; }

                .rank-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10px;
                }

                .rank-level {
                    font-size: 14px;
                    color: #202633;
                }

                .rank-stars {
                    color: #ffb800;
                    letter-spacing: 2px;
                    margin-left: 5px;
                }

                .rank-link {
                    color: #9199a8;
                    font-size: 12px;
                    cursor: pointer;
                }

                .rank-text {
                    font-size: 12px;
                    color: #373e4d;
                    line-height: 1.5;
                    margin-top: 2px;
                }

                .advice-wrap {
                    background: linear-gradient(180deg, #ffffff 0%, #d7e9ff 83%, #b8d7ff 100%);
                    border-radius: 20px;
                    padding-bottom: 10px;
                }

                .advice-lead {
                    font-size: 12px;
                    line-height: 1.55;
                    color: #404654;
                    margin-bottom: 10px;
                }

                .advice-list {
                    margin: 0;
                    padding: 0;
                    list-style: none;
                }

                .advice-list li {
                    display: flex;
                    align-items: flex-start;
                    gap: 8px;
                    margin: 8px 0;
                    font-size: 13px;
                    color: #2e3544;
                    line-height: 1.45;
                }

                .advice-icon {
                    font-size: 22px;
                    line-height: 1;
                    margin-top: 2px;
                }

                .advice-note {
                    margin-top: 8px;
                    padding-top: 8px;
                    border-top: 1px dashed rgba(114, 131, 164, 0.35);
                    color: #7a879f;
                    font-size: 11px;
                }
            </style>

            <header class="review-topbar">
                <button class="review-back" id="reviewBack" aria-label="返回首页">‹</button>
                <div class="title-wrap">
                    <div class="title">复盘日报</div>
                </div>
                <button class="summary-switch-btn" type="button" id="switchTodayBtn">昨日<span class="summary-switch-caret"></span></button>
            </header>

            <section class="review-banner">
                <div class="review-banner-title">
                    复盘日报
                </div>
                <div class="review-banner-sub">全面分析自我，高效提升突破</div>
            </section>

            <main class="review-main">
                <section class="panel">
                    <div class="panel-title">业务量与预估收入 <span class="panel-title-sub">!</span></div>
                    <div class="income-grid">
                        <div class="income-cell">
                            <div class="income-name">散单揽件</div>
                            <div class="income-main">30<small>票</small></div>
                            <div class="income-est">预估收入 <strong>80元</strong></div>
                            <div class="income-yesterday">较昨日 <strong>20元</strong> ↗</div>
                        </div>
                        <div class="income-op">+</div>
                        <div class="income-cell">
                            <div class="income-name">派件</div>
                            <div class="income-main">500<small>票</small></div>
                            <div class="income-est">预估收入 <strong>400元</strong></div>
                            <div class="income-yesterday">较昨日 <strong>10元</strong> ↘</div>
                        </div>
                        <div class="income-op">=</div>
                        <div class="income-cell">
                            <div class="income-name">合计</div>
                            <div class="income-main">530<small>票</small></div>
                            <div class="income-est">预估收入 <strong>480元</strong></div>
                            <div class="income-yesterday">较昨日 <strong>10元</strong> ↗</div>
                        </div>
                    </div>
                </section>

                <section class="panel">
                    <div class="panel-title">
                        <span>潜在风险追踪</span>
                        <span class="panel-title-sub">单位:票</span>
                    </div>

                    <div class="risk-grid">
                        <article class="risk-card">
                            <div class="risk-head">高风险客户</div>
                            <div class="risk-body">
                                3121111111111989，上海市青浦区盈港东路6679号，张三.
                                <div class="risk-tip">(有投诉，派签需电联)</div>
                            </div>
                        </article>

                        <article class="risk-card">
                            <div class="risk-head">待处理异常</div>
                            <div class="risk-body">
                                <div class="exception-grid">
                                    <div>
                                        <div class="exception-col-title">散单</div>
                                        <div class="exception-item"><span>超时揽收</span><strong class="detail-jump" data-detail-main="scatter" data-detail-sub="timeout">86</strong></div>
                                        <div class="exception-item"><span>未取件</span><strong class="detail-jump" data-detail-main="scatter" data-detail-sub="notPicked">67</strong></div>
                                    </div>
                                    <div>
                                        <div class="exception-col-title">派件</div>
                                        <div class="exception-item"><span>未电联</span><a class="detail-jump" data-detail-main="scatter" data-detail-sub="noCall">10</a></div>
                                        <div class="exception-item"><span>未上门签收</span><a class="detail-jump" data-detail-main="scatter" data-detail-sub="noDoor">12</a></div>
                                    </div>
                                </div>
                            </div>
                        </article>
                    </div>

                    <div class="two-col">
                        <article class="risk-card">
                            <div class="risk-head">结算风险</div>
                            <div class="risk-body">
                                <div class="settle-main">6天未出库</div>
                                <div class="stat-row" style="margin-top:8px;"><a class="detail-jump" data-detail-main="sixDays">30</a><span class="settle-note">(将影响结算)</span></div>
                            </div>
                        </article>
                        <article class="risk-card">
                            <div class="risk-head">服务质量</div>
                            <div class="risk-body">
                                <div class="quality-grid">
                                    <div class="quality-item">
                                        <div class="quality-name">虚假签收</div>
                                        <div class="quality-num detail-jump" data-detail-main="quality" data-detail-sub="fakeSign">10</div>
                                    </div>
                                    <div class="quality-item">
                                        <div class="quality-name">破损</div>
                                        <div class="quality-num detail-jump" data-detail-main="quality" data-detail-sub="broken">28</div>
                                    </div>
                                    <div class="quality-item">
                                        <div class="quality-name">遗失</div>
                                        <div class="quality-num detail-jump" data-detail-main="quality" data-detail-sub="lost">36</div>
                                    </div>
                                </div>
                            </div>
                        </article>
                    </div>

                    <div class="warn-line">请及时处理，延误将影响收入与客户体验。</div>
                </section>

                <section class="panel">
                    <div class="panel-title">时效与效率看板</div>
                    <div class="board">
                        <div class="board-col">
                            <div class="board-label">1030签收率</div>
                            <div class="board-value detail-jump" data-detail-main="timeliness">60%</div>
                            <div class="board-note">较昨日 <strong>23%</strong> ↘ <span class="emoji">😟</span></div>
                        </div>
                        <div class="board-col">
                            <div class="board-label">派签时长</div>
                            <div class="board-value detail-jump" data-detail-main="duration">1.2H</div>
                            <div class="board-note">(已落后全网30%的业务员，请优化流程)</div>
                            <div class="progress"><span class="active"></span><span></span><span></span><span></span></div>
                        </div>
                    </div>
                </section>

                <section class="panel">
                    <div class="panel-title">今日核心概览</div>
                    <ul class="overview-list">
                        <li><strong>收入表现:</strong> 预估总收入提升 <strong>80 元</strong>，值得肯定！</li>
                        <li><strong>服务表现:</strong> 投诉量下降，全链路工单减少 <strong>2 单</strong>，进步显著。</li>
                        <li><strong>风险提示:</strong> 催件 <strong>3 单</strong>，需加强跟进，防止升级。</li>
                    </ul>
                </section>

                <section class="panel">
                    <div class="rank-top">
                        <div class="panel-title" style="margin:0;">当前等级与权益</div>
                        <a class="rank-link" id="rankDetail">查看详情 ›</a>
                    </div>
                    <div class="rank-level">您是【四星】业务员 <span class="rank-stars">★★★★☆</span></div>
                    <p class="rank-text">在揽派件的路上，您是最棒的达人，请继续保持！</p>
                    <p class="rank-text">您的专属权益：优先派单、补贴奖励、优先派单、补贴奖等。记得去平台权益中心使用哦！</p>
                </section>

                <section class="panel advice-wrap">
                    <div class="panel-title">明日行动建议</div>
                    <p class="advice-lead">聚焦三点，持续精进。每一天都是新起点，复盘是为了更好出发。明天我们可以:</p>
                    <ul class="advice-list">
                        <li><span class="advice-icon">🛡️</span><span>重点防御：针对某某小区等高投诉风险区域，提前<strong>电联</strong>。</span></li>
                        <li><span class="advice-icon">📈</span><span>效率优化：规划更优<strong>路线</strong>，力争签收率再创新高。</span></li>
                        <li><span class="advice-icon">🪙</span><span>收入保障：<strong>及时处理</strong>滞留件与异常工单，确保收入安全。</span></li>
                    </ul>
                    <div class="advice-note">【备注: “-” 表示数据稍后更新】</div>
                </section>
            </main>
        </section>
    `;

    const backBtn = document.getElementById('reviewBack');
    const rankDetail = document.getElementById('rankDetail');
    const switchTodayBtn = document.getElementById('switchTodayBtn');
    const summaryDetailLinks = Array.from(container.querySelectorAll('[data-detail-main]'));

    const jumpToYesterdayDetail = (mainId, subId = null) => {
        if (typeof navigateTo === 'function') {
            navigateTo('reviewDaily', {
                day: 'yesterday',
                    switchLabel: '昨日',
                switchTarget: 'reviewDaily',
                hideMustSign: true,
                    backTarget: 'reviewDailyYd',
                initialLargeMetricId: mainId,
                initialSubMetricId: subId || null
            });
            return;
        }

        if (typeof showToast === 'function') {
            showToast('跳转昨日明细页');
        }
    };

    if (backBtn) {
        backBtn.addEventListener('click', () => {
            if (typeof navigateTo === 'function') {
                navigateTo('home');
            }
        });
    }

    if (switchTodayBtn) {
        switchTodayBtn.addEventListener('click', () => {
            if (typeof navigateTo === 'function') {
                navigateTo('reviewDaily');
            }
        });
    }

    if (rankDetail) {
        rankDetail.addEventListener('click', (event) => {
            event.preventDefault();
            if (typeof showToast === 'function') {
                showToast('等级权益详情开发中');
            }
        });
    }

    summaryDetailLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const mainId = link.getAttribute('data-detail-main');
            const subId = link.getAttribute('data-detail-sub');
            if (!mainId) return;
            jumpToYesterdayDetail(mainId, subId);
        });
    });
}
