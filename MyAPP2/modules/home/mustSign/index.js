export async function render(containerId, { navigateTo, showToast, routeParams = {} } = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const apiBridge = routeParams.callReportApi || window.__MUST_SIGN_API__ || {};

    function createMustSignTabData() {
        const tabMeta = [
            { id: 'zcw', label: '智橙网', count: 20 },
            { id: 'dispatch', label: '待派件', count: 14 },
            { id: 'signed', label: '已签收', count: 23 },
            { id: 'abnormal', label: '异常签收', count: 3 },
            { id: 'third', label: '第三方', count: 9 }
        ];

        const listData = {
            zcw: [
                {
                    id: 'zcw-1',
                    contactStatus: '已电联客户 家门口',
                    deadline: '今日 11:20:44 前签收',
                    trackingNo: '432343074439649',
                    platform: 'tb',
                    time: '16:14',
                    nameMasked: '姜荣',
                    nameFull: '姜荣',
                    phoneMasked: '152****1086',
                    phoneFull: '15245641086',
                    callTag: '派前电联',
                    address: '上海市浦东新区邹平路191号',
                    tags: [
                        { text: '韵达智橙网', tone: 'danger' },
                        { text: '送货上门', tone: 'warn' },
                        { text: '多多专送', tone: 'plain' }
                    ]
                },
                {
                    id: 'zcw-2',
                    contactStatus: '已电联客户 家门口',
                    deadline: '今天12点前签收',
                    warning: '分签预警',
                    trackingNo: '432343074439649',
                    platform: 'tb',
                    time: '16:14',
                    nameMasked: '孙菲芸',
                    nameFull: '孙菲芸',
                    phoneMasked: '152****1086',
                    phoneFull: '15245641086',
                    callTag: '电话勿扰',
                    address: '上海市静安区江场三路272、278号市北高新技术服务园区17幢',
                    tags: [
                        { text: '韵达智橙网', tone: 'danger' },
                        { text: '送货上门', tone: 'warn' },
                        { text: '多多专送', tone: 'plain' }
                    ]
                }
            ],
            dispatch: [
                {
                    id: 'dispatch-1',
                    contactStatus: '已电联客户 放门口',
                    deadline: '今日 13:40:12 前签收',
                    trackingNo: '881239047561204',
                    platform: 'jd',
                    time: '15:22',
                    nameMasked: '吴先生',
                    nameFull: '吴先生',
                    phoneMasked: '138****2201',
                    phoneFull: '13876542201',
                    callTag: '派前电联',
                    address: '上海市普陀区真南路150号',
                    tags: [
                        { text: '普通件', tone: 'plain' },
                        { text: '送货上门', tone: 'warn' }
                    ]
                }
            ],
            signed: [],
            abnormal: [],
            third: []
        };

        tabMeta.forEach((tab) => {
            if (Array.isArray(listData[tab.id])) {
                tab.count = listData[tab.id].length;
            }
        });

        return { tabMeta, listData };
    }

    function createFallbackTabModule(tabId, profile = {}) {
        return {
            getWaybillDetailProfile() {
                return {
                    title: profile.title || '运单详情',
                    incentiveText: profile.incentiveText || '',
                    submitText: profile.submitText || '提交'
                };
            },
            getMoreActionsMenuHtml() {
                return [
                    { key: 'aiCall', label: 'AI电联代打' },
                    { key: 'smsVoice', label: '发短信/语音' }
                ]
                    .map((item) => `<button class="ms-more-menu-item" type="button" data-more-action="${item.key}">${item.label}</button>`)
                    .join('');
            },
            createTabFeatureController(context) {
                return {
                    onTabChange() {
                        if (typeof context?.pageToast === 'function') {
                            context.pageToast(`已切换到 ${tabId}`, 1200);
                        }
                    },
                    handleCallAction(item) {
                        if (typeof context?.pageToast === 'function') {
                            context.pageToast(`${item?.nameMasked || '当前运单'} 呼叫中`, 1200);
                        }
                    }
                };
            }
        };
    }

    async function loadTabModule(modulePath, fallbackModule) {
        try {
            const url = new URL(`${modulePath}?t=${Date.now()}`, import.meta.url);
            return await import(url.href);
        } catch (error) {
            console.error(`子模块加载失败: ${modulePath}`, error);
            return fallbackModule;
        }
    }

    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.height = '100%';
    container.style.minHeight = '0';
    container.style.overflow = 'hidden';

    const { tabMeta, listData } = createMustSignTabData();

    const zcwTab = await loadTabModule('./tabs/zcw/index.js', createFallbackTabModule('zcw', {
        title: '送货上门件',
        incentiveText: '额外获得0.8元 激励派费(仅标准上门字段签收)',
        submitText: '上门签收'
    }));
    const dispatchTab = await loadTabModule('./tabs/dispatch/index.js', createFallbackTabModule('dispatch'));
    const signedTab = await loadTabModule('./tabs/signed/index.js', createFallbackTabModule('signed'));
    const abnormalTab = await loadTabModule('./tabs/abnormal/index.js', createFallbackTabModule('abnormal'));
    const thirdTab = await loadTabModule('./tabs/third/index.js', createFallbackTabModule('third'));

    const selectedIds = new Set();
    const revealMap = {};
    let activeTab = tabMeta.some((item) => item.id === routeParams.initialTab) ? routeParams.initialTab : 'dispatch';
    const tabModules = {
        zcw: zcwTab,
        dispatch: dispatchTab,
        signed: signedTab,
        abnormal: abnormalTab,
        third: thirdTab
    };

    function getActiveTabModule() {
        return tabModules[activeTab] || dispatchTab;
    }

    container.innerHTML = `
        <section class="must-sign-page">
            <style>
                .must-sign-page {
                    flex: 1;
                    height: 100%;
                    min-height: 0;
                    background: #f3f4f6;
                    color: #24282f;
                    font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Segoe UI', sans-serif;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    position: relative;
                }

                .ms-status {
                    height: 36px;
                    padding: 0 16px;
                    background: #fff;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-shrink: 0;
                }

                .ms-status-time {
                    font-size: 15px;
                    font-weight: 700;
                    color: #1f242b;
                    letter-spacing: 0.2px;
                }

                .ms-status-icons {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    color: #1f242b;
                    font-size: 12px;
                }

                .ms-signal {
                    display: inline-flex;
                    align-items: flex-end;
                    gap: 2px;
                    height: 12px;
                }

                .ms-signal i {
                    display: block;
                    width: 3px;
                    background: #1f242b;
                    border-radius: 1px;
                }

                .ms-signal i:nth-child(1) { height: 4px; opacity: 0.7; }
                .ms-signal i:nth-child(2) { height: 6px; opacity: 0.8; }
                .ms-signal i:nth-child(3) { height: 9px; opacity: 0.9; }
                .ms-signal i:nth-child(4) { height: 12px; }

                .ms-wifi {
                    font-size: 11px;
                    line-height: 1;
                }

                .ms-battery {
                    width: 20px;
                    height: 10px;
                    border: 1.5px solid #1f242b;
                    border-radius: 2px;
                    position: relative;
                }

                .ms-battery::before {
                    content: '';
                    position: absolute;
                    top: 2px;
                    left: 2px;
                    right: 4px;
                    bottom: 2px;
                    background: #1f242b;
                    border-radius: 1px;
                }

                .ms-battery::after {
                    content: '';
                    position: absolute;
                    right: -3px;
                    top: 2px;
                    width: 2px;
                    height: 4px;
                    background: #1f242b;
                    border-radius: 0 1px 1px 0;
                }

                .ms-top {
                    background: #ffffff;
                    padding: 8px 10px 6px;
                    border-bottom: 1px solid #eceef2;
                    flex-shrink: 0;
                }

                .ms-search-row {
                    display: grid;
                    grid-template-columns: 20px 1fr 28px 46px;
                    align-items: center;
                    gap: 6px;
                    margin-bottom: 8px;
                }

                .ms-back-btn {
                    width: 20px;
                    height: 20px;
                    border: none;
                    background: transparent;
                    color: #2e333a;
                    font-size: 28px;
                    line-height: 1;
                    cursor: pointer;
                    padding: 0;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                }

                .ms-search {
                    height: 32px;
                    border-radius: 9px;
                    border: none;
                    background: #eceef2;
                    display: flex;
                    align-items: center;
                    padding: 0 9px;
                    color: #8b9098;
                    font-size: 13px;
                    gap: 5px;
                    min-width: 0;
                }

                .ms-search span:last-child {
                    font-size: 11px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .ms-icon-btn {
                    border: none;
                    background: transparent;
                    color: #6f757d;
                    cursor: pointer;
                    display: inline-flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 2px;
                    font-size: 9px;
                    line-height: 1;
                    min-width: 0;
                    width: 100%;
                    overflow: hidden;
                }

                .ms-scan-box {
                    width: 18px;
                    height: 18px;
                    border: 1.5px solid #8a9099;
                    border-radius: 4px;
                    position: relative;
                }

                .ms-scan-box::before,
                .ms-scan-box::after {
                    content: '';
                    position: absolute;
                    width: 5px;
                    height: 5px;
                    border-top: 1.5px solid #8a9099;
                    border-left: 1.5px solid #8a9099;
                }

                .ms-scan-box::before {
                    top: -1.5px;
                    left: -1.5px;
                }

                .ms-scan-box::after {
                    right: -1.5px;
                    bottom: -1.5px;
                    transform: rotate(180deg);
                }

                .ms-guide-icon {
                    font-size: 17px;
                    line-height: 1;
                }

                .ms-tab-scroll {
                    display: flex;
                    overflow-x: auto;
                    scrollbar-width: none;
                    border-bottom: 1px solid #eceef2;
                }

                .ms-tab-scroll::-webkit-scrollbar {
                    display: none;
                }

                .ms-tab {
                    flex: 0 0 auto;
                    min-width: 78px;
                    padding: 9px 8px 10px;
                    text-align: center;
                    font-size: 14px;
                    font-weight: 700;
                    color: #232932;
                    border: none;
                    background: transparent;
                    position: relative;
                    cursor: pointer;
                }

                .ms-tab.active::after {
                    content: '';
                    position: absolute;
                    left: 20px;
                    right: 20px;
                    bottom: 0;
                    height: 3px;
                    border-radius: 999px;
                    background: #2f79ff;
                }

                .ms-tab-count {
                    margin-left: 5px;
                    font-weight: 600;
                    color: #3f4650;
                }

                .ms-filter-row {
                    padding: 8px 0 2px;
                    display: flex;
                    gap: 8px;
                    align-items: center;
                    overflow-x: auto;
                    scrollbar-width: none;
                }

                .ms-filter-row::-webkit-scrollbar {
                    display: none;
                }

                .ms-chip {
                    flex: 0 0 auto;
                    border: none;
                    border-radius: 7px;
                    padding: 7px 10px;
                    font-size: 12px;
                    color: #5e646d;
                    background: #eceef2;
                    line-height: 1;
                }

                .ms-chip.light {
                    background: transparent;
                    color: #6d737c;
                    padding: 7px 2px;
                }

                .ms-notice {
                    min-height: 42px;
                    border-top: 1px solid #eceef2;
                    border-bottom: 1px solid #eceef2;
                    background: #fff;
                    display: grid;
                    grid-template-columns: auto 1fr auto auto;
                    align-items: center;
                    gap: 8px;
                    padding: 0 10px;
                    font-size: 12px;
                    color: #303640;
                }

                .ms-notice-left {
                    color: #8c939d;
                }

                .ms-notice-text {
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    font-weight: 600;
                }

                .ms-notice-link {
                    color: #1e74ff;
                    font-weight: 700;
                }

                .ms-list-wrap {
                    flex: 1;
                    min-height: 0;
                    overflow-y: auto;
                    padding: 8px 4px 90px;
                    position: relative;
                }

                .ms-side-badge {
                    position: absolute;
                    bottom: 80px;
                    left: 0;
                    width: 42px;
                    margin-left: 0;
                    margin-bottom: 0;
                    z-index: 4;
                    background: #2f79ff;
                    color: #fff;
                    border-radius: 0 8px 8px 0;
                    text-align: center;
                    padding: 6px 4px;
                    font-size: 12px;
                    font-weight: 700;
                    line-height: 1.2;
                }

                .ms-order-row {
                    display: block;
                    margin-bottom: 10px;
                }

                .ms-order-check {
                    width: 24px;
                    height: 24px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    position: absolute;
                    left: 8px;
                    top: 50%;
                    transform: translateY(-50%);
                    z-index: 3;
                }

                .ms-order-check input {
                    width: 24px;
                    height: 24px;
                    appearance: none;
                    -webkit-appearance: none;
                    border: 2px solid #c7ccd3;
                    border-radius: 50%;
                    background: #fff;
                    cursor: pointer;
                    display: grid;
                    place-content: center;
                }

                .ms-order-check input::after {
                    content: '';
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    background: #2f79ff;
                    transform: scale(0);
                    transition: transform 0.12s ease;
                }

                .ms-order-check input:checked::after {
                    transform: scale(1);
                }

                .ms-card {
                    background: #fff;
                    border-radius: 12px;
                    overflow: hidden;
                    border: 1px solid #eceff3;
                    position: relative;
                }

                .ms-card-flag {
                    background: #fdf0f1;
                    color: #ff4c4f;
                    height: 26px;
                    padding: 0 9px;
                    font-size: 10px;
                    line-height: 1;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    font-weight: 700;
                }

                .ms-card-flag span:last-child {
                    font-size: 10px;
                    flex: 1;
                    min-width: 0;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .ms-card-body {
                    padding: 9px 9px 9px 36px;
                }

                .ms-deadline {
                    background: #f4f5f7;
                    color: #6c737d;
                    border-radius: 8px;
                    min-height: 34px;
                    padding: 0 9px;
                    font-size: 11px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 7px;
                }

                .ms-deadline-warning {
                    color: #ff8a00;
                    font-weight: 700;
                }

                .ms-main-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 3px;
                }

                .ms-track-left {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    min-width: 0;
                }

                .ms-track-no-link {
                    border: none;
                    background: transparent;
                    padding: 0;
                    margin: 0;
                    font: inherit;
                    color: inherit;
                    cursor: pointer;
                    min-width: 0;
                    text-align: left;
                }

                .ms-track-no-link:active {
                    opacity: 0.65;
                }

                .ms-platform {
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    color: #fff;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 13px;
                    font-weight: 700;
                    flex-shrink: 0;
                }

                .ms-platform.tb {
                    background: #ff7d00;
                }

                .ms-platform.jd {
                    background: #e0312f;
                    font-size: 10px;
                    letter-spacing: 0.2px;
                }

                .ms-platform.pdd {
                    background: #de2f67;
                    font-size: 8px;
                }

                .ms-track-no {
                    font-size: 12px;
                    color: #616872;
                    letter-spacing: 0.2px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .ms-time {
                    color: #656c76;
                    font-size: 11px;
                    flex-shrink: 0;
                }

                .ms-contact-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 6px;
                    margin-bottom: 5px;
                }

                .ms-name-box {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    min-width: 0;
                    font-size: 11px;
                    color: #353a41;
                }

                .ms-name-box span {
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .ms-eye {
                    border: none;
                    background: transparent;
                    color: #7f8791;
                    cursor: pointer;
                    font-size: 12px;
                    line-height: 1;
                    padding: 2px;
                }

                .ms-actions {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    flex-shrink: 0;
                    width: 150px;
                    justify-content: flex-end;
                }

                .ms-call-btn {
                    border: none;
                    border-radius: 999px;
                    background: #e9f1ff;
                    color: #2174f3;
                    font-size: 11px;
                    font-weight: 700;
                    padding: 0;
                    line-height: 1;
                    display: inline-flex;
                    align-items: center;
                    cursor: pointer;
                }

                .ms-call-tag {
                    padding: 0 8px;
                    height: 28px;
                    display: inline-flex;
                    align-items: center;
                }

                .ms-call-icon {
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    background: #2174f3;
                    color: #fff;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0;
                    font-weight: 700;
                }

                .ms-call-icon::before {
                    content: '';
                    width: 16px;
                    height: 16px;
                    display: block;
                    background-repeat: no-repeat;
                    background-position: center;
                    background-size: 16px 16px;
                    /* 白色电话机图形，贴近参考图 */
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M7 6h10a2 2 0 0 1 2 2v10'/%3E%3Cpath d='M5 8h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5'/%3E%3Cpath d='M10 18v-3.2a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2V18'/%3E%3C/g%3E%3C/svg%3E");
                }

                .ms-sms-btn {
                    border: none;
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    background: #2174f3;
                    color: #fff;
                    font-size: 0;
                    line-height: 1;
                    cursor: pointer;
                    position: relative;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                }

                .ms-sms-btn::before {
                    content: '';
                    width: 4px;
                    height: 4px;
                    border-radius: 50%;
                    background: #fff;
                    display: inline-block;
                    box-shadow: -6px 0 0 #fff, 6px 0 0 #fff;
                }

                .ms-address {
                    font-size: 12px;
                    font-weight: 700;
                    color: #20252d;
                    line-height: 1.35;
                    margin-bottom: 7px;
                }

                .ms-tags {
                    display: flex;
                    gap: 6px;
                    flex-wrap: wrap;
                }

                .ms-tag {
                    border-radius: 7px;
                    padding: 4px 7px;
                    font-size: 11px;
                    font-weight: 700;
                    line-height: 1;
                    border: 1px solid transparent;
                }

                .ms-tag-danger {
                    background: #ff5b62;
                    color: #fff;
                }

                .ms-tag-warn {
                    background: #ff8a00;
                    color: #fff;
                }

                .ms-tag-plain {
                    background: #fff;
                    color: #818890;
                    border-color: #d5d9df;
                }

                .ms-bottom {
                    position: sticky;
                    bottom: 0;
                    background: #fff;
                    border-top: 1px solid #e8ebf0;
                    display: grid;
                    grid-template-columns: 1fr 1.2fr;
                    align-items: center;
                    gap: 10px;
                    padding: 8px 12px calc(8px + env(safe-area-inset-bottom));
                    flex-shrink: 0;
                }

                .ms-select-all {
                    border: none;
                    background: transparent;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 12px;
                    color: #2a3038;
                    cursor: pointer;
                    justify-content: flex-start;
                }

                .ms-select-dot {
                    width: 16px;
                    height: 16px;
                    border: 2px solid #c5cad1;
                    border-radius: 50%;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                }

                .ms-select-dot.active {
                    border-color: #2f79ff;
                    background: #2f79ff;
                    color: #fff;
                    font-size: 12px;
                }

                .ms-more-btn {
                    border: none;
                    background: #2f79ff;
                    color: #fff;
                    border-radius: 7px;
                    height: 38px;
                    font-size: 13px;
                    font-weight: 700;
                    cursor: pointer;
                }

                .ms-more-menu-mask {
                    position: absolute;
                    inset: 0;
                    background: transparent;
                    z-index: 32;
                }

                .ms-more-menu {
                    position: absolute;
                    width: 200px;
                    border-radius: 14px;
                    background: rgba(23, 27, 32, 0.96);
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.32);
                    overflow: hidden;
                    z-index: 33;
                }

                .ms-more-menu::after {
                    content: '';
                    position: absolute;
                    right: 30px;
                    bottom: -6px;
                    width: 12px;
                    height: 12px;
                    background: rgba(23, 27, 32, 0.96);
                    transform: rotate(45deg);
                }

                .ms-more-menu-item {
                    width: 100%;
                    height: 52px;
                    border: none;
                    background: transparent;
                    color: #fff;
                    font-size: 16px;
                    line-height: 1;
                    letter-spacing: 0.2px;
                    text-align: left;
                    padding: 0 18px;
                    cursor: pointer;
                }

                .ms-more-menu-item + .ms-more-menu-item {
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                }

                .ms-more-menu-item:active {
                    background: rgba(255, 255, 255, 0.08);
                }

                .ms-detail-page {
                    position: absolute;
                    inset: 0;
                    z-index: 34;
                    background: #f5f6f8;
                    overflow-y: auto;
                    padding-bottom: calc(84px + env(safe-area-inset-bottom));
                }

                .ms-logistics-page {
                    position: absolute;
                    inset: 0;
                    z-index: 35;
                    background: #eef2f7;
                    display: flex;
                    flex-direction: column;
                }

                .ms-logistics-page[hidden] {
                    display: none !important;
                }

                .ms-logistics-header {
                    background: #fff;
                    color: #1f242b;
                    padding: 12px 16px 14px;
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    flex-shrink: 0;
                    border-bottom: 1px solid #e9edf3;
                }

                .ms-logistics-status {
                    height: 34px;
                    padding: 0 16px;
                    background: #fff;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    border-bottom: 1px solid #eef2f6;
                }

                .ms-logistics-status-time {
                    font-size: 15px;
                    font-weight: 700;
                    color: #1f242b;
                    letter-spacing: 0.2px;
                }

                .ms-logistics-status-icons {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    color: #1f242b;
                    font-size: 12px;
                }

                .ms-logistics-back {
                    border: none;
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    background: #eef2f6;
                    color: #2e3440;
                    font-size: 24px;
                    line-height: 1;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                }

                .ms-logistics-title {
                    font-size: 17px;
                    font-weight: 700;
                    color: #1f242b;
                }

                .ms-logistics-scroll {
                    flex: 1;
                    min-height: 0;
                    overflow-y: auto;
                    padding: 12px;
                }

                .ms-logistics-card {
                    background: #fff;
                    border-radius: 22px;
                    padding: 18px 16px;
                    margin-bottom: 12px;
                    box-shadow: 0 2px 10px rgba(19, 31, 56, 0.06);
                }

                .ms-logistics-card:last-child {
                    margin-bottom: 0;
                }

                .ms-logistics-section-title {
                    font-size: 16px;
                    font-weight: 800;
                    color: #202733;
                    margin-bottom: 12px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .ms-logistics-row {
                    display: grid;
                    grid-template-columns: 64px 1fr;
                    gap: 12px;
                    align-items: center;
                    padding: 12px 0;
                    border-bottom: 1px solid #edf1f6;
                }

                .ms-logistics-row:last-child {
                    border-bottom: none;
                    padding-bottom: 0;
                }

                .ms-logistics-label {
                    color: #8d96a5;
                    font-size: 14px;
                    font-weight: 600;
                }

                .ms-logistics-value {
                    color: #202733;
                    font-size: 15px;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 8px;
                }

                .ms-logistics-eye {
                    border: none;
                    background: transparent;
                    color: #a2a9b5;
                    cursor: pointer;
                    font-size: 20px;
                    line-height: 1;
                    padding: 0;
                }

                .ms-logistics-call,
                .ms-logistics-sms {
                    border: none;
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    background: #e7edf6;
                    color: #4d5a6c;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                    line-height: 1;
                }

                .ms-logistics-timeline {
                    position: relative;
                    padding-left: 34px;
                }

                .ms-logistics-timeline::before {
                    content: '';
                    position: absolute;
                    left: 12px;
                    top: 4px;
                    bottom: 2px;
                    width: 2px;
                    background: #d7dde7;
                }

                .ms-logistics-node {
                    position: relative;
                    display: grid;
                    grid-template-columns: 92px 1fr;
                    gap: 12px;
                    padding: 0 0 18px;
                }

                .ms-logistics-node:last-child {
                    padding-bottom: 0;
                }

                .ms-logistics-node::before {
                    content: '';
                    position: absolute;
                    left: -27px;
                    top: 7px;
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    background: #23745f;
                }

                .ms-logistics-time {
                    color: #9aa2b0;
                    font-size: 13px;
                    line-height: 1.25;
                }

                .ms-logistics-desc {
                    color: #202733;
                    font-size: 14px;
                    line-height: 1.45;
                    font-weight: 700;
                }

                .ms-detail-header {
                    position: sticky;
                    top: 0;
                    z-index: 2;
                    background: #fff;
                    height: 52px;
                    display: grid;
                    grid-template-columns: 40px 1fr 40px;
                    align-items: center;
                    border-bottom: 1px solid #eceef2;
                }

                .ms-detail-back {
                    border: none;
                    background: transparent;
                    font-size: 28px;
                    color: #2f353d;
                    line-height: 1;
                    cursor: pointer;
                }

                .ms-detail-title {
                    text-align: center;
                    font-size: 15px;
                    font-weight: 700;
                    color: #20252d;
                }

                .ms-detail-card {
                    margin: 10px 8px;
                    border-radius: 10px;
                    border: 1px solid #e8ebef;
                    background: #fff;
                    overflow: hidden;
                }

                .ms-detail-main {
                    padding: 10px;
                }

                .ms-detail-no-row {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 13px;
                    color: #20252d;
                    margin-bottom: 8px;
                }

                .ms-detail-icon {
                    width: 16px;
                    height: 16px;
                    border-radius: 4px;
                    background: #ff8a00;
                    color: #fff;
                    font-size: 11px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                }

                .ms-detail-copy {
                    margin-left: auto;
                    border: 1px solid #d8dde5;
                    background: #fff;
                    border-radius: 999px;
                    height: 24px;
                    padding: 0 10px;
                    font-size: 12px;
                    color: #66707d;
                }

                .ms-detail-contact {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 6px;
                    margin-bottom: 8px;
                    font-size: 13px;
                    color: #2a3038;
                }

                .ms-detail-contact-left {
                    min-width: 0;
                }

                .ms-detail-name-line {
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    margin-bottom: 6px;
                }

                .ms-detail-actions {
                    width: auto;
                    min-width: 136px;
                    gap: 6px;
                }

                .ms-detail-address {
                    color: #39414b;
                    font-size: 13px;
                    margin-bottom: 8px;
                }

                .ms-detail-tags {
                    margin-bottom: 8px;
                }

                .ms-detail-demand {
                    border-top: 1px solid #eff2f6;
                    padding-top: 8px;
                    color: #3068a7;
                    font-size: 13px;
                    line-height: 1.45;
                }

                .ms-detail-tools {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 8px;
                    margin: 8px;
                }

                .ms-detail-tool {
                    height: 34px;
                    border: 1px solid #e1e5ec;
                    border-radius: 6px;
                    background: #fff;
                    font-size: 12px;
                    color: #3d4652;
                }

                .ms-detail-section {
                    margin: 10px 8px;
                    border-radius: 10px;
                    border: 1px solid #e8ebef;
                    background: #fff;
                    padding: 12px 10px;
                }

                .ms-detail-section-head {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10px;
                }

                .ms-detail-section-title {
                    font-size: 16px;
                    font-weight: 700;
                    color: #20252d;
                }

                .ms-detail-sub {
                    color: #8a93a0;
                    font-size: 12px;
                }

                .ms-detail-more {
                    color: #8a93a0;
                    font-size: 12px;
                    font-weight: 600;
                }

                .ms-detail-incentive {
                    margin-top: -3px;
                    margin-bottom: 8px;
                    color: #ea4d4d;
                    font-size: 12px;
                    line-height: 1.4;
                }

                .ms-detail-choice {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 8px;
                }

                .ms-detail-choice button {
                    height: 38px;
                    border-radius: 6px;
                    border: 1px solid #d7dde6;
                    background: #f7f9fc;
                    color: #4a5564;
                    font-size: 16px;
                    font-weight: 600;
                }

                .ms-detail-choice .active {
                    border-color: #2f79ff;
                    color: #2f79ff;
                    background: #eef5ff;
                }

                .ms-detail-chip-row {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 8px;
                    margin-bottom: 8px;
                }

                .ms-detail-chip {
                    height: 34px;
                    border: 1px solid #e1e5ec;
                    border-radius: 6px;
                    background: #f3f5f8;
                    color: #3f4854;
                    font-size: 12px;
                    line-height: 1;
                }

                .ms-detail-chip.active {
                    border-color: #2f79ff;
                    background: #edf4ff;
                    color: #2f79ff;
                    font-weight: 700;
                }

                .ms-detail-chip.long {
                    grid-column: 1 / -1;
                    text-align: left;
                    padding: 0 10px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .ms-detail-point {
                    border: 1px solid #dbe2ec;
                    border-radius: 10px;
                    padding: 8px;
                    color: #3f4957;
                    line-height: 1.4;
                }

                .ms-detail-recommend {
                    background: #f2f4f8;
                    border-radius: 10px;
                    padding: 10px;
                }

                .ms-detail-recommend-title {
                    color: #2f3742;
                    font-size: 14px;
                    margin-bottom: 8px;
                }

                .ms-detail-point.selected {
                    border-color: #2f79ff;
                    position: relative;
                    padding-left: 34px;
                }

                .ms-detail-point.selected::before {
                    content: '✓';
                    position: absolute;
                    left: 10px;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    background: #2f79ff;
                    color: #fff;
                    font-size: 12px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                }

                .ms-detail-bottom {
                    position: sticky;
                    bottom: 0;
                    z-index: 2;
                    background: #f5f6f8;
                    padding: 8px 10px calc(8px + env(safe-area-inset-bottom));
                }

                .ms-detail-submit {
                    width: 100%;
                    height: 46px;
                    border: none;
                    border-radius: 8px;
                    background: #2f79ff;
                    color: #fff;
                    font-size: 18px;
                    font-weight: 700;
                }

                .ms-modal {
                    position: fixed;
                    inset: 0;
                    z-index: 30;
                    display: none;
                    align-items: center;
                    justify-content: center;
                    padding: 18px;
                }

                .ms-modal.show {
                    display: flex;
                }

                .ms-modal-mask {
                    position: absolute;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.42);
                }

                .ms-modal-panel {
                    position: relative;
                    z-index: 1;
                    width: min(100%, 336px);
                    max-height: 82vh;
                    overflow: auto;
                    background: #fff;
                    border-radius: 16px;
                    padding: 18px 16px 14px;
                    box-shadow: 0 10px 32px rgba(0, 0, 0, 0.18);
                }

                .ms-modal-title {
                    text-align: center;
                    font-size: 17px;
                    font-weight: 700;
                    color: #1f242b;
                    margin-bottom: 14px;
                }

                .ms-modal-options {
                    display: grid;
                    gap: 10px;
                    max-height: 42vh;
                    overflow-y: auto;
                    padding-right: 2px;
                }

                .ms-modal-option {
                    width: 100%;
                    border: 1px solid #e2e6ec;
                    background: #fff;
                    border-radius: 12px;
                    padding: 10px 12px;
                    text-align: left;
                    font-size: 14px;
                    line-height: 1.35;
                    color: #2b3138;
                    cursor: pointer;
                }

                .ms-modal-option.active {
                    border-color: #2f79ff;
                    background: #eef5ff;
                    color: #1e5fd2;
                    font-weight: 700;
                }

                .ms-modal-custom {
                    margin-top: 12px;
                    border: 1px solid #e2e6ec;
                    border-radius: 12px;
                    padding: 10px 12px 12px;
                    background: #fafbfd;
                }

                .ms-modal-custom-head {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 6px;
                    font-size: 13px;
                    font-weight: 700;
                    color: #39414b;
                }

                .ms-modal-custom-tip {
                    display: none;
                }

                .ms-modal-clear {
                    border: none;
                    background: transparent;
                    color: #7b8390;
                    font-size: 18px;
                    line-height: 1;
                    cursor: pointer;
                    padding: 0;
                }

                .ms-modal-input-wrap {
                    position: relative;
                }

                .ms-modal-input {
                    width: 100%;
                    min-height: 82px;
                    resize: none;
                    border: 1px solid #d7dce3;
                    border-radius: 10px;
                    background: #fff;
                    padding: 10px 30px 10px 10px;
                    font-size: 13px;
                    line-height: 1.45;
                    color: #1f242b;
                    outline: none;
                }

                .ms-modal-input.limit-hit {
                    border-color: #ff8a00;
                    box-shadow: 0 0 0 2px rgba(255, 138, 0, 0.12);
                }

                .ms-modal-input:focus {
                    border-color: #2f79ff;
                    box-shadow: 0 0 0 2px rgba(47, 121, 255, 0.12);
                }

                .ms-modal-input-clear {
                    position: absolute;
                    right: 8px;
                    top: 8px;
                    width: 18px;
                    height: 18px;
                    border: none;
                    border-radius: 50%;
                    background: #c9d2df;
                    color: #fff;
                    font-size: 12px;
                    line-height: 1;
                    cursor: pointer;
                }

                .ms-modal-tip {
                    display: none;
                }

                .ms-modal-actions {
                    display: flex;
                    gap: 10px;
                    margin-top: 14px;
                }

                .ms-modal-btn {
                    flex: 1;
                    height: 42px;
                    border: none;
                    border-radius: 12px;
                    font-size: 15px;
                    font-weight: 700;
                    cursor: pointer;
                }

                .ms-modal-btn.cancel {
                    background: #eef1f5;
                    color: #5f6772;
                }

                .ms-modal-btn.confirm {
                    background: #2f79ff;
                    color: #fff;
                }

                .ms-night-modal {
                    position: fixed;
                    inset: 0;
                    z-index: 38;
                    display: none;
                    align-items: center;
                    justify-content: center;
                    padding: 18px;
                }

                .ms-night-modal.show {
                    display: flex;
                }

                .ms-night-modal-mask {
                    position: absolute;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.4);
                }

                .ms-night-modal-panel {
                    position: relative;
                    z-index: 1;
                    width: min(100%, 320px);
                    border-radius: 16px;
                    background: #fff;
                    padding: 18px 16px 16px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
                }

                .ms-night-modal-title {
                    font-size: 17px;
                    font-weight: 700;
                    color: #20252d;
                    text-align: center;
                    margin-bottom: 10px;
                }

                .ms-night-modal-body {
                    font-size: 14px;
                    line-height: 1.55;
                    color: #4a5564;
                    text-align: center;
                    margin-bottom: 16px;
                }

                .ms-night-modal-actions {
                    display: flex;
                    gap: 10px;
                }

                .ms-night-modal-btn {
                    flex: 1;
                    height: 42px;
                    border: none;
                    border-radius: 12px;
                    font-size: 15px;
                    font-weight: 700;
                    cursor: pointer;
                }

                .ms-night-modal-btn.cancel {
                    background: #eef1f5;
                    color: #5f6772;
                }

                .ms-night-modal-btn.confirm {
                    background: #2f79ff;
                    color: #fff;
                }

                .ms-toast {
                    position: fixed;
                    left: 50%;
                    bottom: 80px;
                    transform: translateX(-50%) translateY(8px);
                    background: rgba(20, 24, 30, 0.92);
                    color: #fff;
                    padding: 10px 14px;
                    border-radius: 999px;
                    font-size: 13px;
                    line-height: 1.2;
                    opacity: 0;
                    pointer-events: none;
                    transition: opacity 0.18s ease, transform 0.18s ease;
                    z-index: 40;
                    max-width: calc(100% - 40px);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .ms-toast.show {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
            </style>

            <div class="ms-status">
                <span class="ms-status-time">9:41</span>
                <span class="ms-status-icons">
                    <span class="ms-signal"><i></i><i></i><i></i><i></i></span>
                    <span class="ms-wifi">◜◝</span>
                    <span class="ms-battery"></span>
                </span>
            </div>

            <div class="ms-top">
                <div class="ms-search-row">
                    <button class="ms-back-btn" id="mustSignBack" aria-label="返回">‹</button>
                    <div class="ms-search"><span>⌕</span><span>运单号/姓名/地址/电话后4位</span></div>
                    <button class="ms-icon-btn" type="button"><span class="ms-scan-box" aria-hidden="true"></span></button>
                    <button class="ms-icon-btn" type="button"><span class="ms-guide-icon" aria-hidden="true">◫</span><span>派件指南</span></button>
                </div>

                <div class="ms-tab-scroll" id="mustSignTabs"></div>

                <div class="ms-filter-row">
                    <button class="ms-chip" type="button">派前电联·0</button>
                    <button class="ms-chip" type="button">送货上门·0</button>
                    <button class="ms-chip light" type="button">近三天 ▾</button>
                    <button class="ms-chip light" type="button">列表显示 ▾</button>
                    <button class="ms-chip light" type="button">筛选 ▾</button>
                </div>
            </div>

            <div class="ms-notice">
                <span class="ms-notice-left">▣</span>
                <span class="ms-notice-text">智橙网-拼多多送货上门件电联要求超出省...</span>
                <span class="ms-notice-link">查看详情</span>
                <span class="ms-notice-link">✕</span>
            </div>

            <div class="ms-list-wrap" id="mustSignListWrap">
                <div class="ms-side-badge">时效<br>数据</div>
                <div id="mustSignList"></div>
            </div>

            <div class="ms-bottom">
                <button class="ms-select-all" id="mustSignSelectAll" type="button">
                    <span class="ms-select-dot" id="mustSignSelectDot"></span>
                    <span id="mustSignSelectText">全选(已选0)</span>
                </button>
                <button class="ms-more-btn" id="mustSignMore" type="button">更多操作 ^</button>
            </div>

            <div class="ms-more-menu-mask" id="mustSignMoreMask" hidden></div>
            <div class="ms-more-menu" id="mustSignMoreMenu" hidden>
                ${getActiveTabModule().getMoreActionsMenuHtml()}
            </div>

            <div class="ms-detail-page" id="mustSignDetailPage" hidden></div>
            <div class="ms-logistics-page" id="mustSignLogisticsPage" hidden></div>

            <div class="ms-night-modal" id="mustSignNightModal" aria-hidden="true">
                <div class="ms-night-modal-mask" id="mustSignNightModalMask"></div>
                <div class="ms-night-modal-panel" role="dialog" aria-modal="true" aria-labelledby="mustSignNightModalTitle">
                    <div class="ms-night-modal-title" id="mustSignNightModalTitle">晚间电联提示</div>
                    <div class="ms-night-modal-body">晚间致电易打扰客户，请谨慎拨打</div>
                    <div class="ms-night-modal-actions">
                        <button class="ms-night-modal-btn cancel" id="mustSignNightModalCancel" type="button">取消</button>
                        <button class="ms-night-modal-btn confirm" id="mustSignNightModalContinue" type="button">继续拨打</button>
                    </div>
                </div>
            </div>

            <div class="ms-modal" id="callReportModal" aria-hidden="true">
                <div class="ms-modal-mask" id="callReportMask"></div>
                <div class="ms-modal-panel" id="callReportPanel" role="dialog" aria-modal="true" aria-labelledby="callReportTitle">
                    <div class="ms-modal-title" id="callReportTitle">电话勿扰电联需上报原因</div>
                    <div class="ms-modal-body" id="callReportBody">
                        <div class="ms-modal-options" id="callReportOptions"></div>
                        <div class="ms-modal-custom" id="callReportCustomWrap" hidden>
                            <div class="ms-modal-custom-head">
                                <span>其他原因</span>
                                <button class="ms-modal-clear" id="callReportClear" type="button" aria-label="清除输入">×</button>
                            </div>
                            <div class="ms-modal-input-wrap">
                                <textarea class="ms-modal-input" id="callReportInput" maxlength="50" placeholder="请输入原因，至少3个字，最多50个字"></textarea>
                                <button class="ms-modal-input-clear" id="callReportInputClear" type="button" aria-label="清除内容">×</button>
                            </div>
                        </div>
                    </div>
                    <div class="ms-modal-actions">
                        <button class="ms-modal-btn cancel" id="callReportCancel" type="button">取消</button>
                        <button class="ms-modal-btn confirm" id="callReportConfirm" type="button">确认</button>
                    </div>
                </div>
            </div>

            <div class="ms-toast" id="mustSignToast" aria-live="polite"></div>
        </section>
    `;
    const tabsEl = document.getElementById('mustSignTabs');
    const pageEl = container.querySelector('.must-sign-page');
    const listEl = document.getElementById('mustSignList');
    const listWrapEl = document.getElementById('mustSignListWrap');
    const selectTextEl = document.getElementById('mustSignSelectText');
    const selectDotEl = document.getElementById('mustSignSelectDot');
    const selectAllBtn = document.getElementById('mustSignSelectAll');
    const backBtn = document.getElementById('mustSignBack');
    const moreBtn = document.getElementById('mustSignMore');
    const moreMask = document.getElementById('mustSignMoreMask');
    const moreMenu = document.getElementById('mustSignMoreMenu');
    const detailPage = document.getElementById('mustSignDetailPage');
    const logisticsPage = document.getElementById('mustSignLogisticsPage');
    const nightModal = document.getElementById('mustSignNightModal');
    const nightModalMask = document.getElementById('mustSignNightModalMask');
    const nightModalCancel = document.getElementById('mustSignNightModalCancel');
    const nightModalContinue = document.getElementById('mustSignNightModalContinue');
    const callReportModal = document.getElementById('callReportModal');
    const callReportMask = document.getElementById('callReportMask');
    const callReportPanel = document.getElementById('callReportPanel');
    const callReportOptions = document.getElementById('callReportOptions');
    const callReportCustomWrap = document.getElementById('callReportCustomWrap');
    const callReportInput = document.getElementById('callReportInput');
    const callReportInputClear = document.getElementById('callReportInputClear');
    const callReportClear = document.getElementById('callReportClear');
    const callReportCancel = document.getElementById('callReportCancel');
    const callReportConfirm = document.getElementById('callReportConfirm');
    const mustSignToast = document.getElementById('mustSignToast');
    const detailState = {
        visible: false,
        tabId: '',
        itemId: ''
    };
    const logisticsState = {
        visible: false,
        tabId: '',
        itemId: '',
        revealSender: false,
        revealReceiver: false
    };
    const nightDialState = {
        visible: false,
        itemId: '',
        tabId: '',
        continueAction: null,
        slotKey: ''
    };
    let toastTimer = null;

    function getLocalDateKey(date = new Date()) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function hasMultiSendTag(item) {
        return Boolean(item?.tags?.some((tag) => tag.text === '多多专送'));
    }

    function closeNightDialModal() {
        nightDialState.visible = false;
        nightDialState.itemId = '';
        nightDialState.tabId = '';
        nightDialState.continueAction = null;
        nightDialState.slotKey = '';
        if (nightModal) {
            nightModal.classList.remove('show');
            nightModal.setAttribute('aria-hidden', 'true');
        }
    }

    function openNightDialModal(item, tabId, continueAction, slotKey) {
        nightDialState.visible = true;
        nightDialState.itemId = item.id;
        nightDialState.tabId = tabId;
        nightDialState.continueAction = continueAction;
        nightDialState.slotKey = slotKey;
        if (nightModal) {
            nightModal.classList.add('show');
            nightModal.setAttribute('aria-hidden', 'false');
        }
    }

    async function nightDialPrompt(item, continueAction, tabId = activeTab) {
        if (tabId !== 'zcw' || !hasMultiSendTag(item)) return false;

        openNightDialModal(item, tabId, continueAction, 'demo');
        return true;
    }

    function pageToast(message, duration = 3000) {
        if (!mustSignToast) {
            if (typeof showToast === 'function') showToast(message);
            return;
        }

        mustSignToast.textContent = message;
        mustSignToast.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            mustSignToast.classList.remove('show');
        }, duration);
    }

    function getCurrentItemById(itemId) {
        const rows = listData[activeTab] || [];
        return rows.find((item) => item.id === itemId) || null;
    }

    function getDetailItemByState() {
        const rows = listData[detailState.tabId] || [];
        return rows.find((item) => item.id === detailState.itemId) || null;
    }

    function getLogisticsItemByState() {
        const rows = listData[logisticsState.tabId] || [];
        return rows.find((item) => item.id === logisticsState.itemId) || null;
    }

    function canOpenWaybillDetail(tabId) {
        return tabId === 'zcw' || tabId === 'dispatch' || tabId === 'signed' || tabId === 'abnormal' || tabId === 'third';
    }

    function closeWaybillDetail() {
        detailState.visible = false;
        detailState.tabId = '';
        detailState.itemId = '';
        closeNightDialModal();
        if (detailPage) {
            detailPage.hidden = true;
            detailPage.innerHTML = '';
        }
    }

    function maskLogisticsName(name = '') {
        if (!name) return '';
        if (name.length === 1) return `${name}*`;
        return `${name.charAt(0)}*`;
    }

    function buildLogisticsTimeline(item) {
        const addressText = formatAddress(item.address || '') || '目的地';
        return [
            {
                time: '2026-05-29\n09:20:00',
                desc: `【${addressText.slice(0, 8)}】快件正在派送中，预计今日送达`
            },
            {
                time: '2026-05-28\n08:30:22',
                desc: '【杭州市】快件已到达杭州萧山转运中心'
            },
            {
                time: '2026-05-28\n06:15:10',
                desc: '【杭州市】快件已从杭州西湖营业部发出'
            },
            {
                time: '2026-05-27\n22:40:05',
                desc: '【杭州市】快件已揽收，揽收员【张师傅】'
            }
        ];
    }

    function closeLogisticsDetail() {
        logisticsState.visible = false;
        logisticsState.tabId = '';
        logisticsState.itemId = '';
        logisticsState.revealSender = false;
        logisticsState.revealReceiver = false;
        if (logisticsPage) {
            logisticsPage.hidden = true;
            logisticsPage.innerHTML = '';
        }
    }

    function renderLogisticsDetail() {
        if (!logisticsPage) return;
        const item = getLogisticsItemByState();
        if (!logisticsState.visible || !item) {
            closeLogisticsDetail();
            return;
        }

        const senderName = logisticsState.revealSender ? '发件方' : maskLogisticsName('发件方');
        const senderPhone = logisticsState.revealSender ? '13812345678' : '138****5678';
        const receiverName = logisticsState.revealReceiver ? item.nameFull : maskLogisticsName(item.nameFull);
        const receiverPhone = logisticsState.revealReceiver ? item.phoneFull : item.phoneMasked;
        const timeline = buildLogisticsTimeline(item);

        logisticsPage.innerHTML = `
            <div class="ms-logistics-status">
                <div class="ms-logistics-status-time">9:41</div>
                <div class="ms-logistics-status-icons">
                    <span class="ms-signal" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
                    <span class="ms-wifi" aria-hidden="true">◜◝</span>
                    <span class="ms-battery" aria-hidden="true"></span>
                </div>
            </div>
            <div class="ms-logistics-header">
                <button class="ms-logistics-back" id="mustSignLogisticsBack" type="button">←</button>
                <div class="ms-logistics-title">物流详情</div>
            </div>
            <div class="ms-logistics-scroll">
                <section class="ms-logistics-card">
                    <div class="ms-logistics-row">
                        <div class="ms-logistics-label">运单号</div>
                        <div class="ms-logistics-value">${item.trackingNo}</div>
                    </div>
                </section>

                <section class="ms-logistics-card">
                    <div class="ms-logistics-section-title">📦 寄件人信息</div>
                    <div class="ms-logistics-row">
                        <div class="ms-logistics-label">姓名</div>
                        <div class="ms-logistics-value">${senderName}<button class="ms-logistics-eye" data-role="sender" type="button">👁</button></div>
                    </div>
                    <div class="ms-logistics-row">
                        <div class="ms-logistics-label">电话</div>
                        <div class="ms-logistics-value">${senderPhone}<button class="ms-logistics-call" data-action="sender-call" type="button">📞</button><button class="ms-logistics-sms" data-action="sender-sms" type="button">…</button></div>
                    </div>
                    <div class="ms-logistics-row">
                        <div class="ms-logistics-label">地址</div>
                        <div class="ms-logistics-value">浙江省杭州市西湖区文三路100号</div>
                    </div>
                </section>

                <section class="ms-logistics-card">
                    <div class="ms-logistics-section-title">🏠 收件人信息</div>
                    <div class="ms-logistics-row">
                        <div class="ms-logistics-label">姓名</div>
                        <div class="ms-logistics-value">${receiverName}<button class="ms-logistics-eye" data-role="receiver" type="button">👁</button></div>
                    </div>
                    <div class="ms-logistics-row">
                        <div class="ms-logistics-label">电话</div>
                        <div class="ms-logistics-value">${receiverPhone}<button class="ms-logistics-call" data-action="receiver-call" type="button">📞</button><button class="ms-logistics-sms" data-action="receiver-sms" type="button">…</button></div>
                    </div>
                    <div class="ms-logistics-row">
                        <div class="ms-logistics-label">地址</div>
                        <div class="ms-logistics-value">${item.address}</div>
                    </div>
                </section>

                <section class="ms-logistics-card">
                    <div class="ms-logistics-section-title">📋 物流轨迹</div>
                    <div class="ms-logistics-timeline">
                        ${timeline.map((node) => `
                            <div class="ms-logistics-node">
                                <div class="ms-logistics-time">${node.time.replace('\n', '<br>')}</div>
                                <div class="ms-logistics-desc">${node.desc}</div>
                            </div>
                        `).join('')}
                    </div>
                </section>
            </div>
        `;

        logisticsPage.hidden = false;

        const logisticsBackBtn = document.getElementById('mustSignLogisticsBack');
        if (logisticsBackBtn) logisticsBackBtn.addEventListener('click', closeLogisticsDetail);

        logisticsPage.querySelectorAll('.ms-logistics-eye').forEach((btn) => {
            btn.addEventListener('click', (event) => {
                event.stopPropagation();
                const role = btn.dataset.role;
                if (role === 'sender') logisticsState.revealSender = !logisticsState.revealSender;
                if (role === 'receiver') logisticsState.revealReceiver = !logisticsState.revealReceiver;
                renderLogisticsDetail();
            });
        });

        logisticsPage.querySelectorAll('.ms-logistics-call').forEach((btn) => {
            btn.addEventListener('click', () => {
                if (typeof tabFeatureController?.handleCallAction === 'function') {
                    tabFeatureController.handleCallAction(item);
                }
            });
        });

        logisticsPage.querySelectorAll('.ms-logistics-sms').forEach((btn) => {
            btn.addEventListener('click', () => {
                pageToast(`${item.nameMasked} 短信会话`, 3000);
            });
        });
    }

    function openLogisticsDetail(item) {
        if (!item) return;
        logisticsState.visible = true;
        logisticsState.tabId = activeTab;
        logisticsState.itemId = item.id;
        logisticsState.revealSender = false;
        logisticsState.revealReceiver = false;
        renderLogisticsDetail();
    }

    function renderWaybillDetail() {
        if (!detailPage) return;
        const item = getDetailItemByState();
        if (!detailState.visible || !item) {
            closeWaybillDetail();
            return;
        }

        const tabModule = tabModules[detailState.tabId] || dispatchTab;
        const detailProfile = typeof tabModule.getWaybillDetailProfile === 'function'
            ? tabModule.getWaybillDetailProfile(item)
            : {
                title: '运单详情',
                incentiveText: '',
                submitText: '提交'
            };
        const incentiveBlock = detailProfile.incentiveText
            ? `<div class="ms-detail-incentive">${detailProfile.incentiveText}</div>`
            : '';
        const tagsHtml = renderTags(item.tags || []);

        detailPage.innerHTML = `
            <div class="ms-detail-header">
                <button class="ms-detail-back" id="mustSignDetailBack" type="button">‹</button>
                <div class="ms-detail-title">${detailProfile.title || '送货上门件'}</div>
                <span></span>
            </div>

            <section class="ms-detail-card">
                <div class="ms-detail-main">
                    <div class="ms-detail-no-row">
                        <span class="ms-detail-icon">收</span>
                        <strong>${item.trackingNo}</strong>
                        <button class="ms-detail-copy" id="mustSignCopyNo" type="button">复制</button>
                        <span class="ms-detail-sub">在线沟通</span>
                    </div>
                    <div class="ms-detail-contact">
                        <div class="ms-detail-contact-left">
                            <div class="ms-detail-name-line">${item.nameMasked} ${item.phoneMasked}</div>
                            <div class="ms-detail-address">${item.address}</div>
                        </div>
                        <div class="ms-actions ms-detail-actions">
                            <button class="ms-call-btn" type="button"><span class="ms-call-tag">客户声音-上门</span><span class="ms-call-icon" aria-hidden="true"></span></button>
                            <button class="ms-sms-btn" type="button"></button>
                        </div>
                    </div>
                    <div class="ms-detail-tags ms-tags">${tagsHtml}</div>
                    <div class="ms-detail-demand">上门要求：放家门口、不要敲门、别打电话、别按门铃。</div>
                </div>
            </section>

            <div class="ms-detail-tools">
                <button class="ms-detail-tool" type="button">换单退回</button>
                <button class="ms-detail-tool" type="button">客户标注</button>
                <button class="ms-detail-tool" type="button">添加待办</button>
                <button class="ms-detail-tool" type="button">添加电话</button>
            </div>

            <section class="ms-detail-section">
                <div class="ms-detail-section-head">
                    <span class="ms-detail-section-title">电联记录</span>
                    <span class="ms-detail-sub">拨打2次  查看记录</span>
                </div>
            </section>

            <section class="ms-detail-section">
                <div class="ms-detail-section-head">
                    <span class="ms-detail-section-title">选择签收人  ?</span>
                    <span class="ms-detail-sub">✉ 自动发短信</span>
                </div>
                <div class="ms-detail-choice">
                    <button class="active" type="button">正常签收</button>
                    <button type="button">异常签收</button>
                </div>
            </section>

            <section class="ms-detail-section">
                <div class="ms-detail-section-head">
                    <span class="ms-detail-section-title">送货上门</span>
                </div>
                ${incentiveBlock}
                <div class="ms-detail-chip-row">
                    <button class="ms-detail-chip" type="button">本人</button>
                    <button class="ms-detail-chip active" type="button">家人</button>
                    <button class="ms-detail-chip" type="button">家门口</button>
                    <button class="ms-detail-chip" type="button">家门口</button>
                </div>
            </section>

            <section class="ms-detail-section">
                <div class="ms-detail-section-head">
                    <span class="ms-detail-section-title">放到指定位置</span>
                    <span class="ms-detail-more">更多 〉</span>
                </div>
                ${incentiveBlock}
                <div class="ms-detail-chip-row">
                    <button class="ms-detail-chip" type="button">门口电箱</button>
                    <button class="ms-detail-chip" type="button">门口架子上</button>
                    <button class="ms-detail-chip" type="button">一号门丰巢柜</button>
                    <button class="ms-detail-chip long" type="button">二号门丰巢柜二号门丰巢柜二号门丰巢柜</button>
                </div>
            </section>

            <section class="ms-detail-section">
                <div class="ms-detail-section-head">
                    <span class="ms-detail-section-title">放到代收点</span>
                    <span class="ms-detail-more">更多 〉</span>
                </div>
                ${incentiveBlock}
                <div class="ms-detail-recommend">
                    <div class="ms-detail-recommend-title">附近代收点推荐</div>
                    <div class="ms-detail-point selected">东普科技公司前台（推荐）<br>${item.address}</div>
                </div>
            </section>

            <div class="ms-detail-bottom">
                <button class="ms-detail-submit" id="mustSignDetailSubmit" type="button">${detailProfile.submitText || '提交'}</button>
            </div>
        `;

        detailPage.hidden = false;
        const detailBackBtn = document.getElementById('mustSignDetailBack');
        if (detailBackBtn) detailBackBtn.addEventListener('click', closeWaybillDetail);

        const copyBtn = document.getElementById('mustSignCopyNo');
        if (copyBtn) {
            copyBtn.addEventListener('click', async () => {
                try {
                    if (navigator?.clipboard?.writeText) {
                        await navigator.clipboard.writeText(item.trackingNo || '');
                    }
                    pageToast('运单号已复制', 2000);
                } catch (error) {
                    pageToast('复制失败，请手动复制', 2000);
                }
            });
        }

        const detailCallBtn = detailPage.querySelector('.ms-call-btn');
        if (detailCallBtn) {
            detailCallBtn.addEventListener('click', () => {
                if (typeof tabFeatureController?.handleCallAction === 'function') {
                    tabFeatureController.handleCallAction(item);
                }
            });
        }

        const detailSmsBtn = detailPage.querySelector('.ms-sms-btn');
        if (detailSmsBtn) {
            detailSmsBtn.addEventListener('click', () => {
                pageToast(`${item.nameMasked} 短信会话`, 3000);
            });
        }

        const submitBtn = document.getElementById('mustSignDetailSubmit');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                pageToast('已提交上门签收', 2000);
            });
        }
    }

    function openWaybillDetail(item) {
        if (!item || !canOpenWaybillDetail(activeTab)) return;
        detailState.visible = true;
        detailState.tabId = activeTab;
        detailState.itemId = item.id;
        renderWaybillDetail();
    }

    const tabFeatureController = zcwTab.createTabFeatureController({
        pageEl,
        moreBtn,
        moreMenu,
        moreMask,
        selectedIds,
        getRows: () => listData[activeTab] || [],
        getActiveTab: () => activeTab,
        apiBridge,
        routeParams,
        pageToast,
        modal: callReportModal,
        mask: callReportMask,
        panel: callReportPanel,
        optionsEl: callReportOptions,
        customWrap: callReportCustomWrap,
        input: callReportInput,
        inputClear: callReportInputClear,
        clearBtn: callReportClear,
        cancelBtn: callReportCancel,
        confirmBtn: callReportConfirm,
        getCurrentItemById,
        nightDialPrompt: (item, continueAction) => nightDialPrompt(item, continueAction, 'zcw')
    });

    function platformLabel(platform) {
        if (platform === 'tb') return '淘';
        if (platform === 'jd') return 'JD';
        if (platform === 'pdd') return '拼';
        return '快';
    }

    function renderTabs() {
        if (!tabsEl) return;
        tabsEl.innerHTML = tabMeta
            .map((tab) => {
                const activeClass = tab.id === activeTab ? 'active' : '';
                return `<button class="ms-tab ${activeClass}" data-tab-id="${tab.id}" type="button">${tab.label}<span class="ms-tab-count">${tab.count}</span></button>`;
            })
            .join('');

        tabsEl.querySelectorAll('.ms-tab').forEach((btn) => {
            btn.addEventListener('click', () => {
                activeTab = btn.dataset.tabId || 'dispatch';
                tabFeatureController.onTabChange();
                closeWaybillDetail();
                renderTabs();
                renderList();
                if (listWrapEl) listWrapEl.scrollTop = 0;
            });
        });
    }

    function renderTags(tags) {
        return tags
            .map((tag) => {
                const toneClass = tag.tone === 'danger' ? 'ms-tag-danger' : tag.tone === 'warn' ? 'ms-tag-warn' : 'ms-tag-plain';
                return `<span class="ms-tag ${toneClass}">${tag.text}</span>`;
            })
            .join('');
    }

    function formatAddress(address) {
        if (!address) return '';
        const noCity = address.replace(/^上海市/, '');
        const firstDistrictIdx = noCity.indexOf('区');
        if (firstDistrictIdx >= 0 && firstDistrictIdx < noCity.length - 1) {
            return noCity.slice(firstDistrictIdx + 1);
        }
        return noCity;
    }

    function renderList() {
        if (!listEl) return;
        const rows = listData[activeTab] || [];

        if (!rows.length) {
            listEl.innerHTML = '<div style="text-align:center;color:#8d949d;padding:54px 0;">暂无数据</div>';
            updateSelectText();
            return;
        }

        listEl.innerHTML = rows
            .map((item) => {
                const revealed = Boolean(revealMap[item.id]);
                const displayName = revealed ? item.nameFull : item.nameMasked;
                const displayPhone = revealed ? item.phoneFull : item.phoneMasked;
                const checked = selectedIds.has(item.id) ? 'checked' : '';
                const eyeIcon = revealed ? '◉' : '◌';
                return `
                    <div class="ms-order-row" data-row-id="${item.id}">
                        <article class="ms-card">
                            <div class="ms-order-check"><input class="ms-item-check" data-item-id="${item.id}" type="checkbox" ${checked}></div>
                            <div class="ms-card-flag"><span>●</span><span>${item.contactStatus}</span></div>
                            <div class="ms-card-body">
                                <div class="ms-deadline">
                                    <span>${item.deadline}</span>
                                    ${item.warning ? `<span class="ms-deadline-warning">${item.warning}</span>` : ''}
                                </div>
                                <div class="ms-main-row">
                                    <div class="ms-track-left">
                                        <span class="ms-platform ${item.platform}">${platformLabel(item.platform)}</span>
                                        <button class="ms-track-no ms-track-no-link" data-track-item-id="${item.id}" type="button">${item.trackingNo}</button>
                                    </div>
                                    <span class="ms-time">${item.time}</span>
                                </div>
                                <div class="ms-contact-row">
                                    <div class="ms-name-box">
                                        <span>${displayName} ${displayPhone}</span>
                                        <button class="ms-eye ms-privacy-btn" data-item-id="${item.id}" type="button">${eyeIcon}</button>
                                    </div>
                                    <div class="ms-actions">
                                        <button class="ms-call-btn ms-call-action" data-item-id="${item.id}" type="button"><span class="ms-call-tag">${item.callTag}</span><span class="ms-call-icon" aria-hidden="true"></span></button>
                                        <button class="ms-sms-btn ms-sms-action" data-item-id="${item.id}" type="button"></button>
                                    </div>
                                </div>
                                <div class="ms-address">${formatAddress(item.address)}</div>
                                <div class="ms-tags">${renderTags(item.tags)}</div>
                            </div>
                        </article>
                    </div>
                `;
            })
            .join('');

        bindListEvents();
        updateSelectText();
    }

    function bindListEvents() {
        listEl.querySelectorAll('.ms-privacy-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                const itemId = btn.dataset.itemId;
                if (!itemId) return;
                revealMap[itemId] = !revealMap[itemId];
                renderList();
            });
        });

        listEl.querySelectorAll('.ms-item-check').forEach((checkbox) => {
            checkbox.addEventListener('change', () => {
                const itemId = checkbox.dataset.itemId;
                if (!itemId) return;

                if (checkbox.checked) selectedIds.add(itemId);
                else selectedIds.delete(itemId);
                updateSelectText();
            });
        });

        listEl.querySelectorAll('.ms-call-action').forEach((btn) => {
            btn.addEventListener('click', () => {
                const itemId = btn.dataset.itemId;
                const row = getCurrentItemById(itemId);
                if (row) tabFeatureController.handleCallAction(row);
            });
        });

        listEl.querySelectorAll('.ms-sms-action').forEach((btn) => {
            btn.addEventListener('click', () => {
                const itemId = btn.dataset.itemId;
                const rows = listData[activeTab] || [];
                const row = rows.find((item) => item.id === itemId);
                if (row) pageToast(`${row.nameMasked} 短信会话`, 3000);
            });
        });

        listEl.querySelectorAll('.ms-track-no-link').forEach((btn) => {
            btn.addEventListener('click', (event) => {
                event.stopPropagation();
                const itemId = btn.dataset.trackItemId;
                const row = getCurrentItemById(itemId);
                if (row) openLogisticsDetail(row);
            });
        });

        listEl.querySelectorAll('.ms-card').forEach((card) => {
            card.addEventListener('click', (event) => {
                if (event.target.closest('.ms-order-check, .ms-item-check, .ms-actions, .ms-privacy-btn, .ms-track-no-link')) return;
                const rowEl = card.closest('.ms-order-row');
                const rowId = rowEl?.dataset?.rowId;
                if (!rowId) return;
                const row = getCurrentItemById(rowId);
                if (row) openWaybillDetail(row);
            });
        });
    }

    function updateSelectText() {
        const rows = listData[activeTab] || [];
        const inTabCount = rows.filter((item) => selectedIds.has(item.id)).length;
        if (selectTextEl) selectTextEl.textContent = `全选(已选${inTabCount})`;

        if (!selectDotEl) return;
        if (rows.length && inTabCount === rows.length) {
            selectDotEl.classList.add('active');
            selectDotEl.textContent = '✓';
        } else {
            selectDotEl.classList.remove('active');
            selectDotEl.textContent = '';
        }
    }

    if (backBtn) {
        backBtn.addEventListener('click', () => {
            if (logisticsState.visible) {
                closeLogisticsDetail();
                return;
            }
            if (detailState.visible) {
                closeWaybillDetail();
                return;
            }
            if (typeof navigateTo === 'function') {
                navigateTo('home');
            }
        });
    }

    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', () => {
            const rows = listData[activeTab] || [];
            const allSelected = rows.length && rows.every((item) => selectedIds.has(item.id));

            if (allSelected) {
                rows.forEach((item) => selectedIds.delete(item.id));
            } else {
                rows.forEach((item) => selectedIds.add(item.id));
            }

            renderList();
        });
    }

    if (nightModalMask) {
        nightModalMask.addEventListener('click', closeNightDialModal);
    }

    if (nightModalCancel) {
        nightModalCancel.addEventListener('click', closeNightDialModal);
    }

    if (nightModalContinue) {
        nightModalContinue.addEventListener('click', async () => {
            const continueAction = nightDialState.continueAction;
            closeNightDialModal();
            if (typeof continueAction === 'function') {
                await continueAction();
            }
        });
    }

    renderTabs();
    renderList();
}
