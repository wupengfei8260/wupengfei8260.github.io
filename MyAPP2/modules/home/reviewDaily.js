export async function render(containerId, { navigateTo, showToast, routeParams = {} } = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const isTodaySelected = routeParams.day !== 'yesterday';
    const hideMustSign = Boolean(routeParams.hideMustSign);
    const switchLabel = routeParams.switchLabel || (isTodaySelected ? '今日' : '昨日');
    const switchTarget = routeParams.switchTarget || (isTodaySelected ? 'reviewDailyYd' : 'reviewDaily');
    const switchTargetParams = routeParams.switchTargetParams || {};
    const backTarget = routeParams.backTarget || 'home';
    const backTargetParams = routeParams.backTargetParams || {};
    const initialLargeMetricId = routeParams.initialLargeMetricId || 'scatter';
    const initialSubMetricId = routeParams.initialSubMetricId || null;

    const previousContainerStyle = {
        height: container.style.height,
        overflow: container.style.overflow,
        display: container.style.display,
        flexDirection: container.style.flexDirection,
        minHeight: container.style.minHeight
    };

    container.style.height = '100%';
    container.style.minHeight = '0';
    container.style.overflow = 'hidden';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';

    container.innerHTML = `
        <section class="review-yd-page">
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                    -webkit-tap-highlight-color: transparent;
                }

                .review-yd-page {
                    --header-sticky-height: 72px;
                    background: #f5f7fb;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                    height: 100%;
                    min-height: 0;
                    overflow: hidden;
                    color: #1e2a3a;
                }

                .app-container {
                    width: 100%;
                    max-width: 430px;
                    margin: 0 auto;
                    height: 100%;
                    min-height: 0;
                    background: #fff;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }

                .main-content {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    padding: 0 12px 24px;
                    -webkit-overflow-scrolling: touch;
                }

                .top-fixed-shell {
                    background: #fff;
                    padding: 12px 12px 10px;
                    margin: 0 -12px 10px;
                    position: relative;
                    overflow: hidden;
                    flex-shrink: 0;
                }

                .top-fixed-shell::after {
                    content: none;
                }

                .header {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 10px 34px 13px;
                    min-height: 60px;
                    margin-bottom: 10px;
                    position: relative;
                    background: transparent;
                    z-index: 1;
                }

                .page-back-btn {
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
                    color: #1e2a3a;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                }

                .title {
                    font-size: 21px;
                    font-weight: 400;
                    color: #1e2a3a;
                    letter-spacing: -0.2px;
                    line-height: 1.25;
                }

                .title-wrap {
                    display: flex;
                    flex-direction: column;
                    gap: 3px;
                    align-items: center;
                    text-align: center;
                }

                .title-sub {
                    font-size: 12px;
                    color: #7f8ca3;
                    line-height: 1.45;
                }

                .date-switch {
                    position: absolute;
                    right: 0;
                    top: 50%;
                    transform: translateY(-50%);
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    border: 1px solid #d8e0ed;
                    background: #f3f6fb;
                    color: #6f7c8f;
                    border-radius: 999px;
                    padding: 6px 10px;
                    cursor: pointer;
                    z-index: 1;
                }

                .date-today {
                    font-size: 13px;
                    font-weight: 600;
                    color: inherit;
                    background: transparent;
                    padding: 0;
                    border-radius: 0;
                    line-height: 1;
                }

                .date-caret {
                    width: 0;
                    height: 0;
                    border-left: 4px solid transparent;
                    border-right: 4px solid transparent;
                    border-top: 5px solid #7b889f;
                    transition: transform 0.2s ease;
                }

                .date-switch.is-yesterday .date-caret {
                    transform: rotate(180deg);
                }

                .metric-board {
                    background: #f8f9fd;
                    border: 1px solid #e8edf5;
                    border-radius: 16px;
                    padding: 10px;
                    margin-bottom: 0;
                    flex-shrink: 0;
                    position: relative;
                    z-index: 1;
                }

                #metricContent {
                    flex: 1;
                    min-height: 0;
                    overflow-y: auto;
                    -webkit-overflow-scrolling: touch;
                }

                .main-tabs {
                    display: grid;
                    grid-template-columns: repeat(4, minmax(0, 1fr));
                    gap: 8px 10px;
                }

                .main-tab {
                    border: none;
                    background: transparent;
                    color: #5a677d;
                    font-size: 14px;
                    font-weight: 400;
                    border-radius: 0;
                    padding: 3px 0 4px;
                    min-height: 0;
                    cursor: pointer;
                    display: flex;
                    align-items: baseline;
                    justify-content: center;
                    gap: 2px;
                }

                .main-tab.active {
                    background: transparent;
                    color: #2f6fff;
                    font-weight: 500;
                }

                .main-tab-text {
                    line-height: 1.1;
                }

                .main-tab[data-main-id="sixDays"] .main-tab-text {
                    font-size: 13px;
                }

                .main-tab[data-main-id="duration"] .main-tab-text,
                .main-tab[data-main-id="income"] .main-tab-text {
                    font-size: 13px;
                }

                .main-tab-count {
                    font-size: 12px;
                    line-height: 1;
                    opacity: 1;
                    font-weight: 700;
                    color: #8a96aa;
                }

                .main-tab.active .main-tab-count {
                    color: #2f6fff;
                }

                .sub-tabs {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    margin-top: 8px;
                    padding-top: 8px;
                    border-top: 1px dashed #d9e2ee;
                }

                .sub-tab {
                    border: 1px solid #dfe7f2;
                    background: #fff;
                    color: #5b6a81;
                    font-size: 12px;
                    font-weight: 600;
                    border-radius: 999px;
                    padding: 4px 10px;
                    white-space: nowrap;
                    cursor: pointer;
                }

                .sub-tab.active {
                    background: #eaf1ff;
                    color: #2f6fff;
                    border-color: #bfd2ff;
                }

                .sub-tab-count {
                    margin-left: 2px;
                    opacity: 0.86;
                }

                .panel {
                    background: #fff;
                    border-radius: 16px;
                    border: 1px solid #ebeff6;
                    padding: 12px;
                    margin-bottom: 10px;
                    box-shadow: 0 1px 4px rgba(25, 38, 69, 0.04);
                }

                .panel-title {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    font-size: 16px;
                    font-weight: 700;
                    margin-bottom: 10px;
                }

                .panel-subtitle {
                    font-size: 12px;
                    color: #7f8ca3;
                    font-weight: 500;
                }

                .income-grid {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr) auto minmax(0, 1fr);
                    gap: 6px;
                    align-items: start;
                }

                .income-cell {
                    text-align: left;
                }

                .income-name {
                    color: #303b4d;
                    font-size: 13px;
                    margin-bottom: 2px;
                }

                .income-main {
                    font-size: 26px;
                    line-height: 1;
                    font-weight: 700;
                    color: #121b2b;
                }

                .income-main small {
                    font-size: 18px;
                    font-weight: 700;
                    margin-left: 2px;
                }

                .income-est,
                .income-yesterday {
                    margin-top: 4px;
                    color: #5f6b80;
                    font-size: 12px;
                }

                .income-est strong,
                .income-yesterday strong {
                    color: #1d2536;
                }

                .income-op {
                    font-size: 24px;
                    line-height: 1;
                    color: #8a93a3;
                    margin-top: 24px;
                }

                .risk-plain {
                    margin-top: 4px;
                    font-size: 13px;
                    line-height: 1.7;
                    color: #2f3748;
                }

                .risk-title {
                    font-weight: 700;
                    color: #1f2a3b;
                }

                .risk-tip {
                    color: #8a94a6;
                    font-size: 12px;
                }

                .exception-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 8px;
                }

                .exception-col-title {
                    font-size: 12px;
                    color: #63728a;
                    margin-bottom: 6px;
                    font-weight: 600;
                }

                .exception-item {
                    display: flex;
                    justify-content: space-between;
                    margin: 6px 0;
                    font-size: 12px;
                }

                .exception-item strong {
                    font-weight: 700;
                    color: #1f2a3b;
                }

                .warn-line {
                    margin-top: 8px;
                    font-size: 12px;
                    color: #ff5d58;
                }

                .metric-kpi {
                    display: grid;
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                    gap: 8px;
                }

                .kpi-item {
                    background: #f7f9fc;
                    border: 1px solid #e7edf6;
                    border-radius: 12px;
                    padding: 10px;
                    text-align: center;
                }

                .kpi-label {
                    color: #73829a;
                    font-size: 12px;
                    margin-bottom: 6px;
                }

                .kpi-value {
                    font-size: 22px;
                    font-weight: 700;
                    color: #1f2a3b;
                    line-height: 1;
                }

                .kpi-unit {
                    font-size: 12px;
                    color: #73829a;
                    margin-left: 2px;
                }

                .duration-plain {
                    text-align: left;
                }

                .duration-plain .kpi-label {
                    margin-bottom: 4px;
                }

                .duration-note {
                    margin-top: 6px;
                    font-size: 13px;
                    line-height: 1.55;
                    color: #4c5a72;
                }

                .tip-line {
                    background: #f7fafc;
                    border: 1px solid #e6edf5;
                    border-radius: 12px;
                    padding: 12px;
                    font-size: 12px;
                    color: #4d5a71;
                    line-height: 1.6;
                    margin-bottom: 10px;
                }

                .six-days-badge {
                    display: inline-flex;
                    background: #ff5d58;
                    color: #fff;
                    padding: 4px 10px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: 600;
                    margin-bottom: 10px;
                }

                .jump-line {
                    background: #f7fafc;
                    border: 1px solid #e6edf5;
                    border-radius: 12px;
                    padding: 12px;
                    font-size: 13px;
                    color: #4d5a71;
                    line-height: 1.6;
                }

                .jump-num {
                    color: #1e6f5c;
                    font-size: 24px;
                    font-weight: 700;
                    cursor: pointer;
                    text-decoration: underline;
                }

                .stats-summary {
                    background: #f8f9fe;
                    border-radius: 14px;
                    padding: 10px;
                    margin-bottom: 10px;
                    display: grid;
                    grid-template-columns: repeat(4, minmax(0, 1fr));
                    gap: 8px;
                    border: 1px solid #edf1f8;
                }

                .stat-item {
                    text-align: center;
                }

                .stat-label {
                    font-size: 11px;
                    color: #7f8c9b;
                    margin-bottom: 4px;
                }

                .stat-number {
                    font-size: 16px;
                    font-weight: 700;
                    color: #1e2a3a;
                    line-height: 1.2;
                }

                .detail-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0;
                }

                .record-card {
                    background: transparent;
                    border: none;
                    border-bottom: 1px solid #e8eef5;
                    border-radius: 0;
                    padding: 12px 0;
                }

                .record-card:last-child {
                    border-bottom: none;
                }

                .record-card-with-action {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 12px;
                    background: transparent;
                    border: none;
                    border-bottom: 1px solid #e8eef5;
                    padding: 12px 0;
                }

                .record-card-with-action:last-child {
                    border-bottom: none;
                }

                .record-card-content {
                    flex: 1;
                    background: transparent;
                    border: none;
                    border-radius: 0;
                    padding: 0;
                }

                .deal-action {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    color: #7ea6ff;
                    font-size: 12px;
                    cursor: pointer;
                    user-select: none;
                    white-space: nowrap;
                    flex-shrink: 0;
                }

                .field-row {
                    margin-bottom: 8px;
                    line-height: 1.4;
                    font-size: 13px;
                    display: flex;
                    flex-wrap: wrap;
                    align-items: baseline;
                }

                .field-row:last-child {
                    margin-bottom: 0;
                }

                .field-label {
                    color: #8e9aab;
                    font-weight: 400;
                    margin-right: 8px;
                }

                .field-value {
                    color: #1e2a3a;
                    font-weight: 500;
                    word-break: break-word;
                    flex: 1;
                }

                .address-value {
                    font-weight: 600;
                    font-size: 14px;
                }

                .contact-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    background: #fbfcfe;
                    padding: 8px 10px;
                    border-radius: 10px;
                    margin: 6px 0 10px;
                }

                .mustsign-call-btn {
                    border: 1px solid #d9e3f6;
                    background: #eef3ff;
                    color: #2f6fff;
                    border-radius: 999px;
                    padding: 2px 8px;
                    font-size: 12px;
                    line-height: 1.4;
                    cursor: pointer;
                    white-space: nowrap;
                }

                .contact-info {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    flex-wrap: wrap;
                }

                .contact-name,
                .phone-number {
                    font-size: 13px;
                    color: #2c3e4e;
                }

                .eye-icon {
                    font-size: 16px;
                    cursor: pointer;
                    user-select: none;
                    line-height: 1;
                    opacity: 0.6;
                }

                .tracking-clickable {
                    cursor: pointer;
                    text-decoration: none;
                }

                .empty-state {
                    text-align: center;
                    padding: 28px 16px;
                    border-radius: 14px;
                    border: 1px dashed #dce4f0;
                    color: #8f9aab;
                    font-size: 13px;
                }

                .rank-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                }

                .rank-link {
                    color: #8b96a9;
                    font-size: 13px;
                    cursor: pointer;
                }

                .rank-level {
                    font-size: 28px;
                    font-weight: 700;
                    line-height: 1;
                }

                .rank-level small {
                    font-size: 22px;
                    font-weight: 700;
                }

                .rank-stars {
                    font-size: 20px;
                    margin-left: 6px;
                    letter-spacing: 1px;
                }

                .rank-text {
                    margin-top: 8px;
                    font-size: 13px;
                    color: #374052;
                    line-height: 1.6;
                }

                .advice-wrap {
                    background: linear-gradient(180deg, #ffffff 0%, #d8eaff 82%, #bddbff 100%);
                }

                .advice-lead {
                    font-size: 13px;
                    line-height: 1.6;
                    color: #404654;
                    margin-bottom: 8px;
                }

                .advice-list {
                    list-style: none;
                    margin: 0;
                    padding: 0;
                }

                .advice-list li {
                    display: flex;
                    align-items: flex-start;
                    gap: 8px;
                    margin: 8px 0;
                    font-size: 13px;
                    color: #2e3544;
                    line-height: 1.5;
                }

                .advice-note {
                    margin-top: 8px;
                    padding-top: 8px;
                    border-top: 1px dashed rgba(114, 131, 164, 0.35);
                    color: #7a879f;
                    font-size: 12px;
                }

                .overview-list {
                    margin: 0;
                    padding: 0;
                    list-style: none;
                    color: #232a38;
                }

                .overview-list li {
                    position: relative;
                    padding-left: 16px;
                    margin: 10px 0;
                    font-size: 13px;
                    line-height: 1.5;
                }

                .overview-list li::before {
                    content: '';
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    position: absolute;
                    left: 0;
                    top: 10px;
                }

                .overview-list li:nth-child(1)::before { background: #2f7dff; }
                .overview-list li:nth-child(2)::before { background: #f8b500; }
                .overview-list li:nth-child(3)::before { background: #ff4c44; }

                .detail-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: #f5f7fb;
                    z-index: 1000;
                    overflow-y: auto;
                    transform: translateX(100%);
                    transition: transform 0.3s ease;
                }

                .detail-overlay.show {
                    transform: translateX(0);
                }

                .detail-header {
                    background: #1e6f5c;
                    color: #fff;
                    padding: 16px 12px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    position: sticky;
                    top: 0;
                    z-index: 10;
                }

                .back-btn {
                    background: rgba(255, 255, 255, 0.2);
                    border: none;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: #fff;
                    font-size: 18px;
                }

                .detail-title {
                    font-size: 17px;
                    font-weight: 600;
                    flex: 1;
                }

                .detail-card {
                    background: #fff;
                    margin: 12px;
                    border-radius: 14px;
                    padding: 12px;
                    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
                }

                .info-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 10px 0;
                    border-bottom: 1px solid #eef2f6;
                    gap: 8px;
                }

                .info-label {
                    color: #8e9aab;
                    font-size: 13px;
                    flex-shrink: 0;
                }

                .info-value {
                    font-weight: 500;
                    color: #1e2a3a;
                    text-align: right;
                    word-break: break-word;
                }

                .timeline-node {
                    display: flex;
                    gap: 10px;
                    padding: 10px 0;
                    border-left: 2px solid #e9edf4;
                    margin-left: 8px;
                    padding-left: 14px;
                    position: relative;
                }

                .timeline-dot {
                    position: absolute;
                    left: -5px;
                    top: 14px;
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #1e6f5c;
                }

                .timeline-time {
                    font-size: 12px;
                    color: #8e9aab;
                    min-width: 72px;
                }

                .timeline-desc {
                    font-size: 13px;
                    color: #1e2a3a;
                    line-height: 1.5;
                }
            </style>

            <div class="app-container">
                <div class="main-content">
                    <div class="top-fixed-shell">
                        <div class="header">
                            <button class="page-back-btn" id="pageBackBtn" aria-label="返回上一页">&lt;</button>
                            <div class="title-wrap">
                                <div class="title">复盘日报</div>
                            </div>
                            <button class="date-switch" id="dateSwitch" type="button" aria-label="切换日期">
                                <span class="date-today" id="dateDisplay">06/02 17:30</span>
                                <span class="date-caret"></span>
                            </button>
                        </div>

                        <section class="metric-board">
                            <div class="main-tabs" id="mainTabs"></div>
                            <div class="sub-tabs" id="subTabs" style="display:none;"></div>
                        </section>
                    </div>

                    <div id="metricContent"></div>
                </div>
            </div>

            <div id="trackDetailOverlay" class="detail-overlay">
                <div class="detail-header">
                    <button class="back-btn" id="closeDetailBtn">←</button>
                    <div class="detail-title">物流详情</div>
                    <div style="width: 32px;"></div>
                </div>
                <div id="trackDetailContent"></div>
            </div>
        </section>
    `;

    const appNav = document.querySelector('.app-nav');
    const previousNavDisplay = appNav ? appNav.style.display : '';

    const yesterdayCountMap = {
        timeout: 1,
        notPicked: 2,
        noCall: 2,
        noDoor: 3,
        fakeSign: 3,
        broken: 2,
        lost: 1
    };

    function setAppNavVisible(visible) {
        if (!appNav) return;
        appNav.style.display = visible ? (previousNavDisplay || '') : 'none';
    }

    function handlePageBack() {
        container.style.height = previousContainerStyle.height;
        container.style.overflow = previousContainerStyle.overflow;
        container.style.display = previousContainerStyle.display;
        container.style.flexDirection = previousContainerStyle.flexDirection;
        container.style.minHeight = previousContainerStyle.minHeight;
        setAppNavVisible(true);
        if (typeof navigateTo === 'function') {
            navigateTo(backTarget, backTargetParams);
            return;
        }
        window.history.back();
    }

    const prefixes = ['320', '43', '46', '312'];

    function generateTrackingNo() {
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const remainingLen = 15 - prefix.length;
        let suffix = '';
        for (let i = 0; i < remainingLen; i++) suffix += Math.floor(Math.random() * 10);
        return prefix + suffix;
    }

    function ensureTrackingNumbers(detailsArray) {
        if (!detailsArray) return;
        detailsArray.forEach((item) => {
            if (!item.trackingNo || item.trackingNo.length !== 15 || !/^\d+$/.test(item.trackingNo)) {
                item.trackingNo = generateTrackingNo();
            } else {
                const prefixValid = prefixes.some((p) => item.trackingNo.startsWith(p));
                if (!prefixValid || item.trackingNo.length !== 15) item.trackingNo = generateTrackingNo();
            }
        });
    }

    function maskName(name) {
        if (!name) return '';
        if (name.length <= 2) return name.charAt(0) + '*';
        return name.charAt(0) + '**';
    }

    function maskPhone(phone) {
        if (!phone) return '';
        return phone.slice(0, 3) + '****' + phone.slice(-4);
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/[&<>]/g, (m) => (m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;'));
    }

    function makePhoneCall(phoneNumber) {
        if (!phoneNumber) {
            if (typeof showToast === 'function') showToast('号码无效');
            return;
        }
        window.location.href = `tel:${phoneNumber}`;
    }

    function getMockLogisticDetail(trackingNo, senderName, senderPhone, receiverName, receiverPhone, currentAddress) {
        const nodes = [
            { time: '2026-05-28 08:30:22', status: '【杭州市】快件已到达杭州萧山转运中心' },
            { time: '2026-05-28 06:15:10', status: '【杭州市】快件已从杭州西湖营业部发出' },
            { time: '2026-05-27 22:40:05', status: '【杭州市】快件已揽收，揽收员【张师傅】' }
        ];

        if (Math.random() > 0.5) {
            nodes.unshift({ time: '2026-05-29 09:20:00', status: `【${currentAddress.substring(0, 6)}】快件正在派送中，预计今日送达` });
        }

        return {
            trackingNo,
            sender: { name: senderName || '张明', phone: senderPhone || '13812345678', address: '浙江省杭州市西湖区文三路100号' },
            receiver: { name: receiverName || '李芳', phone: receiverPhone || '15987654321', address: currentAddress || '未知地址' },
            currentStatus: '运输中',
            timeline: nodes
        };
    }

    function showTrackDetail(trackingNo, itemData) {
        const overlay = container.querySelector('#trackDetailOverlay');
        const contentDiv = container.querySelector('#trackDetailContent');
        if (!overlay || !contentDiv) return;

        const senderName = itemData.senderName || '发件人';
        const senderPhone = itemData.senderPhone || '13812345678';
        const receiverName = itemData.name || '收件人';
        const receiverPhone = itemData.phone || '15987654321';
        const address = itemData.address || '未知地址';
        const detail = getMockLogisticDetail(trackingNo, senderName, senderPhone, receiverName, receiverPhone, address);

        contentDiv.innerHTML = `
            <div class="detail-card">
                <div class="info-row"><span class="info-label">运单号</span><span class="info-value">${detail.trackingNo}</span></div>
                <div class="info-row"><span class="info-label">当前状态</span><span class="info-value">${detail.currentStatus}</span></div>
            </div>
            <div class="detail-card">
                <div style="font-weight:600; margin-bottom:10px;">寄件人信息</div>
                <div class="info-row"><span class="info-label">姓名</span><span class="info-value">${detail.sender.name}</span></div>
                <div class="info-row"><span class="info-label">电话</span><span class="info-value">${detail.sender.phone}</span></div>
                <div class="info-row"><span class="info-label">地址</span><span class="info-value">${detail.sender.address}</span></div>
            </div>
            <div class="detail-card">
                <div style="font-weight:600; margin-bottom:10px;">收件人信息</div>
                <div class="info-row"><span class="info-label">姓名</span><span class="info-value">${detail.receiver.name}</span></div>
                <div class="info-row"><span class="info-label">电话</span><span class="info-value">${detail.receiver.phone}</span></div>
                <div class="info-row"><span class="info-label">地址</span><span class="info-value">${detail.receiver.address}</span></div>
            </div>
            <div class="detail-card">
                <div style="font-weight:600; margin-bottom:10px;">物流轨迹</div>
                ${detail.timeline.map((node) => `
                    <div class="timeline-node">
                        <div class="timeline-dot"></div>
                        <div class="timeline-time">${node.time}</div>
                        <div class="timeline-desc">${node.status}</div>
                    </div>
                `).join('')}
            </div>
        `;

        overlay.classList.add('show');
    }

    function closeTrackDetail() {
        const overlay = container.querySelector('#trackDetailOverlay');
        if (overlay) overlay.classList.remove('show');
    }

    const timeoutPickupData = { count: 8, details: [{ address: '阳光花园12栋304室', name: '张明', phone: '13812345678', trackingNo: '320123456789012' }, { address: '香榭丽都B座2102', name: '李芳', phone: '15987654321', trackingNo: '431234567890123' }, { address: '滨江公馆3单元806', name: '王磊', phone: '18765432109', trackingNo: '461234567890123' }] };
    const notPickedData = { count: 5, details: [{ address: '翠湖天地9栋105', name: '陈敏', phone: '15233445566', trackingNo: '320987654321098' }, { address: '世纪新城22-1104', name: '赵敏', phone: '17788990011', trackingNo: '438765432109876' }] };
    const fakeSignData = { fakeCount: 12, totalSignCount: 436, fakeRate: '2.75', details: [{ trackingNo: '320556677889901', signTime: '2026/05/28 14:23:10', complaintType: '客户投诉', signType: '驿站类', signContent: '宝龙城市广场站点' }] };
    const lostData = { count: 3, details: [{ trackingNo: '320901234567890', dispatchTime: '2026/05/25 10:30:22', lostSource: '操作仲裁', respLink: '派送无签收', penalty: 20 }] };
    const brokenData = { count: 4, details: [{ trackingNo: '312112233445566', dispatchTime: '2026/05/27 11:15:40', brokenSource: '仲裁', respLink: '签收后异常', penalty: 20 }] };
    const mustSignData = { count: 6, details: [{ trackingNo: '320700100200300', name: '李明', phone: '13812340001', address: '杭州市西湖区文二路88号5幢1201室' }, { trackingNo: '431700100200301', name: '王芳', phone: '13812340002', address: '杭州市滨江区江南大道66号2单元902室' }, { trackingNo: '461700100200302', name: '张强', phone: '13812340003', address: '杭州市拱墅区上塘路120号3幢701室' }] };
    const sixDaysNoOutData = { count: 100 };
    const noCallData = { count: 6, details: [{ trackingNo: '439988776655443', dispatchTime: '2026/05/27 14:20:00', signTime: '2026/05/27 20:15:00', signPerson: '家人代收', typeTag: '智橙网' }] };
    const noDoorData = { count: 7, details: [{ trackingNo: '312776655443322', dispatchTime: '2026/05/28 09:10:00', signTime: '2026/05/28 18:45:00', signPerson: '本人', typeTag: '智橙网' }] };

    function padDetails(list, targetCount, factory) {
        if (!Array.isArray(list)) return;
        while (list.length < targetCount) {
            list.push(factory(list.length));
        }
    }

    padDetails(timeoutPickupData.details, timeoutPickupData.count, (idx) => ({
        address: `超时揽收补充地址${idx + 1}号`,
        name: `客户${idx + 1}`,
        phone: `1390000${String(1000 + idx).slice(-4)}`,
        trackingNo: generateTrackingNo()
    }));

    padDetails(notPickedData.details, notPickedData.count, (idx) => ({
        address: `未取件补充地址${idx + 1}号`,
        name: `用户${idx + 1}`,
        phone: `1370000${String(1000 + idx).slice(-4)}`,
        trackingNo: generateTrackingNo()
    }));

    padDetails(noCallData.details, noCallData.count, (idx) => ({
        trackingNo: generateTrackingNo(),
        dispatchTime: `2026/05/${String(28 - (idx % 5)).padStart(2, '0')} 09:1${idx % 10}:00`,
        signTime: `2026/05/${String(28 - (idx % 5)).padStart(2, '0')} 18:2${idx % 10}:00`,
        signPerson: idx % 2 === 0 ? '本人' : '家人代收',
        typeTag: idx % 2 === 0 ? '客户声音' : '智橙网'
    }));

    padDetails(noDoorData.details, noDoorData.count, (idx) => ({
        trackingNo: generateTrackingNo(),
        dispatchTime: `2026/05/${String(28 - (idx % 5)).padStart(2, '0')} 10:0${idx % 10}:00`,
        signTime: `2026/05/${String(28 - (idx % 5)).padStart(2, '0')} 19:3${idx % 10}:00`,
        signPerson: idx % 2 === 0 ? '本人' : '驿站代收',
        typeTag: idx % 2 === 0 ? '智橙网' : '客户声音'
    }));

    padDetails(fakeSignData.details, fakeSignData.fakeCount, (idx) => ({
        trackingNo: generateTrackingNo(),
        signTime: `2026/05/${String(28 - (idx % 6)).padStart(2, '0')} 14:${String(10 + idx).padStart(2, '0')}:10`,
        complaintType: idx % 2 === 0 ? '客户投诉' : '服务体验',
        signType: idx % 2 === 0 ? '驿站类' : '代收点类',
        signContent: '宝龙城市广场站点'
    }));

    padDetails(brokenData.details, brokenData.count, (idx) => ({
        trackingNo: generateTrackingNo(),
        dispatchTime: `2026/05/${String(27 - (idx % 4)).padStart(2, '0')} 11:${String(10 + idx).padStart(2, '0')}:40`,
        brokenSource: idx % 2 === 0 ? '仲裁' : '客户反馈',
        respLink: idx % 2 === 0 ? '签收后异常' : '包装破损',
        penalty: idx % 2 === 0 ? 20 : 30
    }));

    padDetails(lostData.details, lostData.count, (idx) => ({
        trackingNo: generateTrackingNo(),
        dispatchTime: `2026/05/${String(25 - (idx % 3)).padStart(2, '0')} 10:${String(20 + idx).padStart(2, '0')}:22`,
        lostSource: idx % 2 === 0 ? '操作仲裁' : '客户投诉',
        respLink: idx % 2 === 0 ? '派送无签收' : '中转异常',
        penalty: idx % 2 === 0 ? 20 : 50
    }));

    padDetails(mustSignData.details, mustSignData.count, (idx) => ({
        trackingNo: generateTrackingNo(),
        name: `必签客户${idx + 1}`,
        phone: `1360000${String(1000 + idx).slice(-4)}`,
        address: `杭州市必签路${idx + 1}号${idx + 2}单元${600 + idx}室`
    }));

    [timeoutPickupData, notPickedData, fakeSignData, lostData, brokenData, noCallData, noDoorData, mustSignData].forEach((ref) => {
        if (ref.details) ensureTrackingNumbers(ref.details);
    });

    const largeMetrics = [
        {
            id: 'scatter',
            label: '揽派异常',
            subMetrics: [
                { id: 'timeout', label: '超时揽收', type: 'addressPhone', dataRef: timeoutPickupData },
                { id: 'notPicked', label: '未取件', type: 'addressPhone', dataRef: notPickedData },
                { id: 'noCall', label: '未电联', type: 'callDoorDetail', dataRef: noCallData },
                { id: 'noDoor', label: '未上门签收', type: 'callDoorDetail', dataRef: noDoorData }
            ]
        },
        {
            id: 'quality',
            label: '服务质量',
            subMetrics: [
                { id: 'fakeSign', label: '虚假签收', type: 'fakeDetail', dataRef: fakeSignData },
                { id: 'broken', label: '破损', type: 'lostBrokenDetail', dataRef: brokenData },
                { id: 'lost', label: '遗失', type: 'lostBrokenDetail', dataRef: lostData }
            ]
        },
        { id: 'mustSign', label: '今日必签' },
        { id: 'sixDays', label: '未出库' },
        { id: 'risk', label: '潜在风险' },
        { id: 'timeliness', label: '时效看板' },
        { id: 'duration', label: '派签时长1.2' },
        { id: 'income', label: '预估收入410' },
        { id: 'rank', label: '当前等级5' },
        { id: 'advice', label: '行动建议' },
        { id: 'overview', label: '核心概览' }
    ];

    const plainTextMap = new Map();
    let currentLargeMetricId = initialLargeMetricId;
    let currentSubMetricId = initialSubMetricId;
    const hiddenTodayMetricIds = new Set(['rank', 'advice', 'overview']);

    function getVisibleMetrics() {
        return largeMetrics.filter((metric) => {
            if (metric.id === 'mustSign' && hideMustSign) return false;
            if (isTodaySelected && hiddenTodayMetricIds.has(metric.id)) return false;
            return true;
        });
    }

    function renderDate() {
        const el = container.querySelector('#dateDisplay');
        if (!el) return;
        el.innerText = switchLabel;
    }

    function getSubMetricCount(subMetric) {
        const ref = subMetric?.dataRef;
        if (!ref) return null;

        if (!isTodaySelected && yesterdayCountMap[subMetric.id] !== undefined) {
            return yesterdayCountMap[subMetric.id];
        }

        if (typeof ref.count === 'number') return ref.count;
        if (typeof ref.fakeCount === 'number') return ref.fakeCount;
        if (Array.isArray(ref.details)) return ref.details.length;
        return null;
    }

    function getLargeMetricTotal(metric) {
        if (!metric?.subMetrics?.length) return null;
        return metric.subMetrics.reduce((sum, sub) => {
            const count = getSubMetricCount(sub);
            return sum + (typeof count === 'number' ? count : 0);
        }, 0);
    }

    function getMainMetricCount(metric) {
        if (!metric) return null;
        if (metric.id === 'mustSign') return mustSignData.count;
        if (metric.id === 'sixDays') return sixDaysNoOutData.count;
        if (metric.subMetrics?.length) return getLargeMetricTotal(metric);
        return null;
    }

    function renderMainTabs() {
        const mainTabs = container.querySelector('#mainTabs');
        if (!mainTabs) return;

        const visibleMetrics = getVisibleMetrics();

        mainTabs.innerHTML = visibleMetrics.map((metric) => {
            const mainCount = getMainMetricCount(metric);
            return `
            <button class="main-tab ${metric.id === currentLargeMetricId ? 'active' : ''}" data-main-id="${metric.id}">
                <span class="main-tab-text">${metric.label}</span>
                ${typeof mainCount === 'number' ? `<span class="main-tab-count">${mainCount}</span>` : ''}
            </button>
        `;
        }).join('');

        mainTabs.querySelectorAll('.main-tab').forEach((btn) => {
            btn.addEventListener('click', () => {
                currentLargeMetricId = btn.getAttribute('data-main-id');
                const activeLarge = largeMetrics.find((m) => m.id === currentLargeMetricId);
                currentSubMetricId = activeLarge?.subMetrics?.[0]?.id || null;
                renderMainTabs();
                renderSubTabs();
                renderMetricContent();
            });
        });
    }

    function renderSubTabs() {
        const subTabs = container.querySelector('#subTabs');
        if (!subTabs) return;

        const activeLarge = largeMetrics.find((m) => m.id === currentLargeMetricId);
        if (!activeLarge?.subMetrics?.length) {
            subTabs.style.display = 'none';
            subTabs.innerHTML = '';
            return;
        }

        if (!currentSubMetricId) {
            currentSubMetricId = activeLarge.subMetrics[0].id;
        }

        subTabs.style.display = 'flex';
        subTabs.innerHTML = activeLarge.subMetrics.map((sub) => `
            <button class="sub-tab ${sub.id === currentSubMetricId ? 'active' : ''}" data-sub-id="${sub.id}">${sub.label}<span class="sub-tab-count">${getSubMetricCount(sub)}</span></button>
        `).join('');

        subTabs.querySelectorAll('.sub-tab').forEach((btn) => {
            btn.addEventListener('click', () => {
                currentSubMetricId = btn.getAttribute('data-sub-id');
                renderSubTabs();
                renderMetricContent();
            });
        });
    }

    function renderIncomeCard() {
        return `
            <section class="panel">
                <div class="panel-title">业务量与预估收入 <span class="panel-subtitle">!</span></div>
                <div class="income-grid">
                    <div class="income-cell">
                        <div class="income-name">散单揽件</div>
                        <div class="income-main">20<small>票</small></div>
                        <div class="income-est">预估收入 <strong>60元</strong></div>
                        <div class="income-yesterday">较昨日提升 <strong>10元</strong></div>
                    </div>
                    <div class="income-op">+</div>
                    <div class="income-cell">
                        <div class="income-name">派件</div>
                        <div class="income-main">500<small>票</small></div>
                        <div class="income-est">预估收入 <strong>350元</strong></div>
                        <div class="income-yesterday">较昨日提升 <strong>30元</strong></div>
                    </div>
                    <div class="income-op">=</div>
                    <div class="income-cell">
                        <div class="income-name">合计</div>
                        <div class="income-main">520<small>票</small></div>
                        <div class="income-est">预估收入 <strong>410元</strong></div>
                        <div class="income-yesterday">较昨日提升 <strong>40元</strong></div>
                    </div>
                </div>
            </section>
        `;
    }

    function renderRiskCard() {
        return `
            <section class="panel">
                <div class="panel-title">
                    <span>潜在风险</span>
                    <span class="panel-subtitle">单位:票</span>
                </div>

                <div class="risk-plain">
                    <div class="risk-title">高风险客户信息</div>
                    <div>近期暂无虚假签收投诉单。</div>
                    <div class="risk-tip">有投诉，派签需电联。</div>
                </div>
            </section>
        `;
    }

    function renderSixDaysCard() {
        return `
            <section class="panel">
                <div class="tip-line">超6天未出库件，请尽快通知用户取出</div>
                <div class="jump-line">
                    当前未出库单量：
                    <span class="jump-num" id="jumpToThirdList">${sixDaysNoOutData.count}</span>
                    ，点击数量跳转第三方列表。
                </div>
            </section>
        `;
    }

    function renderMustSignCard() {
        const details = mustSignData.details || [];
        const listHtml = details.map((item, idx) => {
            const mapKey = `mustSign_${idx}`;
            const isPlain = plainTextMap.get(mapKey) || false;
            const displayName = isPlain ? item.name : maskName(item.name);
            const displayPhone = isPlain ? item.phone : maskPhone(item.phone);
            return `<div class="record-card-with-action"><div class="record-card-content"><div class="field-row"><span class="field-label">单号</span><span class="field-value"><span class="tracking-clickable" data-tracking="${item.trackingNo}" data-address="${escapeHtml(item.address)}" data-name="${item.name}" data-phone="${item.phone}">${item.trackingNo}</span></span></div><div class="contact-row"><div class="contact-info"><span class="contact-name">${displayName}</span><span class="phone-number">${displayPhone}</span><span class="eye-icon" data-sub-id="mustSign" data-idx="${idx}">👁</span></div><button class="mustsign-call-btn" data-mustsign-phone="${item.phone}">打电话</button></div><div class="field-row"><span class="field-value address-value">${escapeHtml(item.address)}</span></div></div><span class="deal-action" data-action="deal-mustsign" data-sub-id="mustSign">去处理</span></div>`;
        }).join('');

        return `
            <section class="panel">
                <div class="detail-list">${listHtml}</div>
            </section>
        `;
    }

    function renderTimelinessCard() {
        const timelinessItems = [
            { label: '1030签收率', value: '60' },
            { label: '1400签收率', value: '72' }
        ];

        if (!isTodaySelected) {
            timelinessItems.push({ label: '2359签收率', value: '94' });
        }

        return `
            <section class="panel">
                <div class="panel-title">时效看板</div>
                <div class="metric-kpi">
                    ${timelinessItems.map((item) => `
                        <div class="kpi-item">
                            <div class="kpi-label">${item.label}</div>
                            <div class="kpi-value">${item.value}<span class="kpi-unit">%</span></div>
                        </div>
                    `).join('')}
                </div>
            </section>
        `;
    }

    function renderDurationCard() {
        return `
            <section class="panel">
                <div class="panel-title">派签时长</div>
                <div class="duration-plain">
                    <div class="kpi-label">平均派签时长</div>
                    <div class="kpi-value">1.2<span class="kpi-unit">h</span></div>
                    <div class="duration-note">您已经落后全网30%的业务员，请优化流程</div>
                </div>
            </section>
        `;
    }

    function renderRankCard() {
        return `
            <section class="panel">
                <div class="rank-top">
                    <div class="panel-title" style="margin:0;">当前等级</div>
                    <a class="rank-link" id="rankDetail">查看详情 ›</a>
                </div>
                <div class="rank-level"><span class="rank-stars">⭐ ⭐ ⭐ ⭐ ⭐</span></div>
                <p class="rank-text">在揽派件的路上，您是最棒的达人，请继续保持！</p>
                <p class="rank-text">您的专属权益：APP内免费发短信、APP内免费打电话等。记得去平台权益中心使用哦！</p>
            </section>
        `;
    }

    function renderAdviceCard() {
        return `
            <section class="panel advice-wrap">
                <div class="panel-title">行动建议</div>
                <p class="advice-lead">聚焦三点，持续精进。每一天都是新起点，复盘是为了更好出发。明天我们可以:</p>
                <ul class="advice-list">
                    <li><span>🛡️</span><span>重点防御：针对某某小区等高投诉风险区域，提前<strong>电联</strong>。</span></li>
                    <li><span>📈</span><span>效率优化：规划更优<strong>路线</strong>，力争提升签收率。</span></li>
                    <li><span>🪙</span><span>收入保障：<strong>及时揽派签操作</strong>，确保收入安全。</span></li>
                </ul>
                <div class="advice-note">【备注: “-” 表示数据稍后更新】</div>
            </section>
        `;
    }

    function renderOverviewCard() {
        return `
            <section class="panel">
                <div class="panel-title">核心概览</div>
                <ul class="overview-list">
                    <li><strong>收入表现:</strong> 预估总收入提升 <strong>一元</strong>，值得肯定！</li>
                    <li><strong>服务表现:</strong> 投诉量上升 <strong>一单</strong>，全链路工单增加 <strong>一单</strong>，继续努力。</li>
                    <li><strong>风险提示:</strong> 催派工单 <strong>一个</strong>，需加强跟进，防止升级。</li>
                </ul>
            </section>
        `;
    }

    function renderDetailList(subMetric) {
        const ref = subMetric.dataRef;
        const rawDetails = ref?.details || [];
        const detailCount = getSubMetricCount(subMetric);
        const details = typeof detailCount === 'number' ? rawDetails.slice(0, detailCount) : rawDetails;

        let topStatsHtml = '';
        if (subMetric.id === 'fakeSign') {
            topStatsHtml = '';
        }

        if (details.length === 0) {
            return `${topStatsHtml}<div class="empty-state">暂无明细数据</div>`;
        }

        let cardsHtml = '<div class="detail-list">';

        if (subMetric.type === 'addressPhone') {
            details.forEach((item, idx) => {
                const mapKey = `${subMetric.id}_${idx}`;
                const isPlain = plainTextMap.get(mapKey) || false;
                const displayName = isPlain ? item.name : maskName(item.name);
                const displayPhone = isPlain ? item.phone : maskPhone(item.phone);
                cardsHtml += `<div class="record-card-with-action"><div class="record-card-content"><div class="field-row"><span class="field-value address-value">${escapeHtml(item.address)}</span></div><div class="contact-row"><div class="contact-info"><span class="contact-name">${displayName}</span><span class="phone-number">${displayPhone}</span><span class="eye-icon" data-sub-id="${subMetric.id}" data-idx="${idx}">👁</span></div></div><div class="field-row"><span class="field-label">运单号</span><span class="field-value"><span class="tracking-clickable" data-tracking="${item.trackingNo}" data-address="${escapeHtml(item.address)}" data-name="${item.name}" data-phone="${item.phone}">${item.trackingNo}</span></span></div></div><span class="deal-action" data-action="deal-pickup" data-sub-id="${subMetric.id}">去处理</span></div>`;
            });
        } else if (subMetric.type === 'fakeDetail') {
            details.forEach((item) => {
                cardsHtml += `<div class="record-card-with-action"><div class="record-card-content"><div class="field-row"><span class="field-label">单号</span><span class="field-value"><span class="tracking-clickable" data-tracking="${item.trackingNo}">${item.trackingNo}</span></span></div><div class="field-row"><span class="field-label">签收时间</span><span class="field-value">${item.signTime}</span></div><div class="field-row"><span class="field-label">投诉类型</span><span class="field-value">${item.complaintType}</span></div><div class="field-row"><span class="field-label">签收类型</span><span class="field-value">${item.signType}</span></div><div class="field-row"><span class="field-label">签收内容</span><span class="field-value">${item.signContent}</span></div></div><span class="deal-action" data-action="deal-workorder">去处理</span></div>`;
            });
        } else if (subMetric.type === 'callDoorDetail') {
            details.forEach((item) => {
                cardsHtml += `<div class="record-card"><div class="field-row"><span class="field-label">单号</span><span class="field-value"><span class="tracking-clickable" data-tracking="${item.trackingNo}">${item.trackingNo}</span></span></div><div class="field-row"><span class="field-label">分发时间</span><span class="field-value">${item.dispatchTime}</span></div><div class="field-row"><span class="field-label">签收时间</span><span class="field-value">${item.signTime}</span></div><div class="field-row"><span class="field-label">签收人</span><span class="field-value">${item.signPerson}</span></div><div class="field-row"><span class="field-label">类型</span><span class="field-value">${item.typeTag}</span></div></div>`;
            });
        } else {
            const isLost = subMetric.id === 'lost';
            details.forEach((item) => {
                cardsHtml += `<div class="record-card-with-action"><div class="record-card-content"><div class="field-row"><span class="field-label">单号</span><span class="field-value"><span class="tracking-clickable" data-tracking="${item.trackingNo}">${item.trackingNo}</span></span></div><div class="field-row"><span class="field-label">分发时间</span><span class="field-value">${item.dispatchTime}</span></div><div class="field-row"><span class="field-label">${isLost ? '遗失来源' : '破损来源'}</span><span class="field-value">${isLost ? item.lostSource : item.brokenSource}</span></div><div class="field-row"><span class="field-label">责任环节</span><span class="field-value">${item.respLink}</span></div><div class="field-row"><span class="field-label">考核金额(元)</span><span class="field-value">${item.penalty}</span></div></div><span class="deal-action" data-action="deal-workorder">去处理</span></div>`;
            });
        }

        cardsHtml += '</div>';
        return topStatsHtml + cardsHtml;
    }

    function bindTrackingClick() {
        container.querySelectorAll('.tracking-clickable').forEach((el) => {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                const trackingNo = el.getAttribute('data-tracking');
                const address = el.getAttribute('data-address') || '';
                const name = el.getAttribute('data-name') || '';
                const phone = el.getAttribute('data-phone') || '';
                showTrackDetail(trackingNo, { address, name, phone, senderName: '发件方', senderPhone: '13812345678' });
            });
        });
    }

    function bindEyeToggle() {
        container.querySelectorAll('.eye-icon').forEach((icon) => {
            icon.addEventListener('click', (e) => {
                e.stopPropagation();
                const subId = icon.getAttribute('data-sub-id');
                const idx = parseInt(icon.getAttribute('data-idx'), 10);
                const key = `${subId}_${idx}`;
                const current = plainTextMap.get(key) || false;
                plainTextMap.set(key, !current);
                renderMetricContent();
            });
        });
    }

    function bindDealAction() {
        container.querySelectorAll('.deal-action').forEach((actionEl) => {
            actionEl.addEventListener('click', (event) => {
                event.stopPropagation();
                const action = actionEl.getAttribute('data-action');
                const subId = actionEl.getAttribute('data-sub-id');
                
                if (action === 'deal-pickup') {
                    // 超时揽收或未取件
                    if (subId === 'timeout') {
                        // 跳转到待揽收-已取件列表
                        if (typeof showToast === 'function') {
                            showToast('跳转到待揽收-已取件列表');
                        }
                    } else if (subId === 'notPicked') {
                        // 跳转到待揽收-待取件列表
                        if (typeof showToast === 'function') {
                            showToast('跳转到待揽收-未取件列表');
                        }
                    }
                } else if (action === 'deal-workorder') {
                    // 虚假签收、破损、遗失 -> 我的工单
                    if (typeof showToast === 'function') {
                        showToast('跳转到我的工单列表');
                    }
                } else if (action === 'deal-mustsign') {
                    // 今日必签 -> 待签收列表
                    if (typeof showToast === 'function') {
                        showToast('跳转到待签收列表');
                    }
                }
            });
        });
    }

    function bindMustSignCall() {
        container.querySelectorAll('.mustsign-call-btn').forEach((btn) => {
            btn.addEventListener('click', (event) => {
                event.stopPropagation();
                const phone = btn.getAttribute('data-mustsign-phone');
                if (phone) makePhoneCall(phone);
            });
        });
    }

    function renderMetricContent() {
        const panel = container.querySelector('#metricContent');
        if (!panel) return;

        const visibleMetrics = getVisibleMetrics();
        if (!visibleMetrics.some((metric) => metric.id === currentLargeMetricId)) {
            currentLargeMetricId = visibleMetrics[0]?.id || null;
            currentSubMetricId = visibleMetrics[0]?.subMetrics?.[0]?.id || null;
        }

        const largeMetric = largeMetrics.find((m) => m.id === currentLargeMetricId);
        if (!largeMetric) return;

        let html = '';

        if (largeMetric.id === 'income') {
            html = renderIncomeCard();
        } else if (largeMetric.id === 'mustSign') {
            html = renderMustSignCard();
        } else if (largeMetric.id === 'risk') {
            html = renderRiskCard();
        } else if (largeMetric.id === 'sixDays') {
            html = renderSixDaysCard();
        } else if (largeMetric.id === 'timeliness') {
            html = renderTimelinessCard();
        } else if (largeMetric.id === 'duration') {
            html = renderDurationCard();
        } else if (largeMetric.id === 'rank') {
            html = renderRankCard();
        } else if (largeMetric.id === 'advice') {
            html = renderAdviceCard();
        } else if (largeMetric.id === 'overview') {
            html = renderOverviewCard();
        } else {
            const subMetric = largeMetric.subMetrics?.find((s) => s.id === currentSubMetricId) || largeMetric.subMetrics?.[0];
            if (subMetric) {
                const hideSubTitle = ['quality', 'scatter'].includes(largeMetric.id);
                const titleHtml = hideSubTitle ? '' : `<div class="panel-title">${largeMetric.label} / ${subMetric.label}</div>`;
                html = `<section class="panel">${titleHtml}${renderDetailList(subMetric)}</section>`;
            }
        }

        panel.innerHTML = html;

        if (largeMetric.id === 'sixDays') {
            panel.querySelector('#jumpToThirdList')?.addEventListener('click', () => {
                if (typeof showToast === 'function') showToast('已跳转第三方列表');
            });
        }

        if (largeMetric.id === 'rank') {
            panel.querySelector('#rankDetail')?.addEventListener('click', (event) => {
                event.preventDefault();
                if (typeof showToast === 'function') showToast('等级权益详情开发中');
            });
        }

        bindTrackingClick();
        bindEyeToggle();
        bindDealAction();
        bindMustSignCall();
    }

    function init() {
        setAppNavVisible(false);
        renderDate();
        const visibleMetrics = getVisibleMetrics();
        if (!visibleMetrics.some((metric) => metric.id === currentLargeMetricId)) {
            currentLargeMetricId = visibleMetrics[0]?.id || 'scatter';
        }
        if (!currentSubMetricId) {
            currentSubMetricId = largeMetrics.find((m) => m.id === currentLargeMetricId)?.subMetrics?.[0]?.id || null;
        }
        renderMainTabs();
        renderSubTabs();
        renderMetricContent();

        container.querySelector('#closeDetailBtn')?.addEventListener('click', closeTrackDetail);
        container.querySelector('#pageBackBtn')?.addEventListener('click', handlePageBack);
        container.querySelector('#dateSwitch')?.addEventListener('click', () => {
            if (typeof navigateTo === 'function') {
                navigateTo(switchTarget, switchTargetParams);
            }
        });

        container.addEventListener('click', (event) => {
            const callBtn = event.target.closest('.detail-card .call-icon');
            if (!callBtn) return;
            const phone = callBtn.getAttribute('data-phone');
            if (phone) makePhoneCall(phone);
        });
    }

    init();
}
