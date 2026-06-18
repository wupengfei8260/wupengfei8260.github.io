export async function render(containerId, { navigateTo, showToast, routeParams = {} } = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const previousContainerStyle = {
        height: container.style.height,
        overflow: container.style.overflow,
        display: container.style.display,
        flexDirection: container.style.flexDirection,
        minHeight: container.style.minHeight
    };

    const tabs = [
        { id: 'dispatch', label: '派签量' },
        { id: 'pickup', label: '揽件量' }
    ];

    const presetRanges = {
        lastSeven: { label: '近七天', startOffset: -6, endOffset: 0 },
        lastWeek: { label: '上周', startOffset: -13, endOffset: -7 },
        thisMonth: { label: '本月', startDate: 'monthStart', endDate: 'today' },
        lastMonth: { label: '上月', startDate: 'lastMonthStart', endDate: 'lastMonthEnd' }
    };

    const today = new Date();
    const todayKey = toDateKey(today);
    const datasetStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const allDateKeys = buildDateKeys(datasetStart, today);
    const recordCache = new Map();

    const defaultPresetId = presetRanges[routeParams.rangeId] ? routeParams.rangeId : 'lastSeven';
    const defaultTabId = tabs.some((tab) => tab.id === routeParams.tab) ? routeParams.tab : 'dispatch';
    const defaultRange = getPresetRange(defaultPresetId);

    const state = {
        activeTabId: defaultTabId,
        activePresetId: defaultPresetId,
        startDate: routeParams.startDate || defaultRange.startDate,
        endDate: routeParams.endDate || defaultRange.endDate,
        detailTargetKey: null
    };

    normalizeRangeState();

    function escapeHtml(value) {
        if (value === null || value === undefined) return '';
        return String(value).replace(/[&<>]/g, (match) => {
            if (match === '&') return '&amp;';
            if (match === '<') return '&lt;';
            return '&gt;';
        });
    }

    function toDateKey(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function buildDateKeys(startDate, endDate) {
        const keys = [];
        const current = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        const last = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

        while (current <= last) {
            keys.push(toDateKey(current));
            current.setDate(current.getDate() + 1);
        }

        return keys;
    }

    function parseDateKey(dateKey) {
        const [year, month, day] = dateKey.split('-').map(Number);
        return new Date(year, month - 1, day);
    }

    function formatCompactDate(dateKey) {
        const [, month, day] = dateKey.split('-');
        return `${month}-${day}`;
    }

    function formatSlashDate(dateKey) {
        const [, month, day] = dateKey.split('-');
        return `${month}/${day}`;
    }

    function getRangeLabel(startDate, endDate) {
        return `${formatCompactDate(startDate)} 至 ${formatCompactDate(endDate)}`;
    }

    function getPresetRange(presetId) {
        const preset = presetRanges[presetId] || presetRanges.lastSeven;

        if (preset.startOffset !== undefined && preset.endOffset !== undefined) {
            return {
                startDate: shiftDateKey(todayKey, preset.startOffset),
                endDate: shiftDateKey(todayKey, preset.endOffset)
            };
        }

        if (presetId === 'lastWeek') {
            const thisWeekMonday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const weekday = thisWeekMonday.getDay();
            const offsetToMonday = weekday === 0 ? 6 : weekday - 1;
            thisWeekMonday.setDate(thisWeekMonday.getDate() - offsetToMonday);

            const lastWeekMonday = new Date(thisWeekMonday);
            lastWeekMonday.setDate(lastWeekMonday.getDate() - 7);

            const lastWeekSunday = new Date(thisWeekMonday);
            lastWeekSunday.setDate(lastWeekSunday.getDate() - 1);

            return {
                startDate: toDateKey(lastWeekMonday),
                endDate: toDateKey(lastWeekSunday)
            };
        }

        if (preset.startDate === 'monthStart' && preset.endDate === 'today') {
            return {
                startDate: toDateKey(new Date(today.getFullYear(), today.getMonth(), 1)),
                endDate: todayKey
            };
        }

        if (preset.startDate === 'lastMonthStart' && preset.endDate === 'lastMonthEnd') {
            const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
            return {
                startDate: toDateKey(lastMonthStart),
                endDate: toDateKey(lastMonthEnd)
            };
        }

        return {
            startDate: shiftDateKey(todayKey, -6),
            endDate: todayKey
        };
    }

    function shiftDateKey(dateKey, offsetDays) {
        const date = parseDateKey(dateKey);
        date.setDate(date.getDate() + offsetDays);
        return toDateKey(date);
    }

    function normalizeRangeState() {
        if (!state.startDate || !state.endDate) {
            const presetRange = getPresetRange(state.activePresetId);
            state.startDate = presetRange.startDate;
            state.endDate = presetRange.endDate;
            return;
        }

        if (state.startDate > state.endDate) {
            const temp = state.startDate;
            state.startDate = state.endDate;
            state.endDate = temp;
        }

        const matchedPreset = Object.entries(presetRanges).find(([presetId]) => {
            const presetRange = getPresetRange(presetId);
            return presetRange.startDate === state.startDate && presetRange.endDate === state.endDate;
        });

        state.activePresetId = matchedPreset ? matchedPreset[0] : 'custom';
    }

    function getVisibleDateKeys() {
        return allDateKeys.filter((dateKey) => dateKey >= state.startDate && dateKey <= state.endDate);
    }

    function getTabMeta(tabId) {
        return tabs.find((tab) => tab.id === tabId) || tabs[0];
    }

    function hashString(value) {
        let hash = 0;
        for (let index = 0; index < value.length; index += 1) {
            hash = (hash * 33 + value.charCodeAt(index)) % 2147483647;
        }
        return hash;
    }

    function buildBills(dateKey, tabId, count) {
        const prefix = tabId === 'dispatch' ? 'DP' : 'PK';
        const compactKey = dateKey.replace(/-/g, '');
        return Array.from({ length: count }, (_, index) => ({
            billNo: `YD${prefix}${compactKey}${String(index + 1).padStart(2, '0')}`,
            status: index % 3 === 0 ? '正常' : index % 3 === 1 ? '已签收' : '异常签收'
        }));
    }

    function buildDailyRecord(dateKey, tabId) {
        const cacheKey = `${tabId}:${dateKey}`;
        if (recordCache.has(cacheKey)) {
            return recordCache.get(cacheKey);
        }

        const seed = hashString(cacheKey);
        const baseDispatch = tabId === 'dispatch' ? 78 : 52;
        const spreadDispatch = tabId === 'dispatch' ? 34 : 28;
        const dispatchCount = baseDispatch + (seed % spreadDispatch);
        const signPenalty = 4 + (seed % 8);
        const signCount = Math.max(dispatchCount - signPenalty, Math.floor(dispatchCount * 0.58));
        const abnormalCount = Math.max(0, Math.min(signCount, (seed % 6) + (tabId === 'dispatch' ? 2 : 1)));
        const billCount = Math.min(10, 5 + (seed % 4));
        const bills = buildBills(dateKey, tabId, billCount);

        const record = {
            dateKey,
            displayDate: formatCompactDate(dateKey),
            displayDateAlt: formatSlashDate(dateKey),
            dispatchCount,
            signCount,
            abnormalCount,
            bills
        };

        recordCache.set(cacheKey, record);
        return record;
    }

    function getRangeRecords() {
        return getVisibleDateKeys().map((dateKey) => buildDailyRecord(dateKey, state.activeTabId));
    }

    function getTotals(records) {
        return records.reduce((totals, record) => {
            totals.dispatchCount += record.dispatchCount;
            totals.signCount += record.signCount;
            totals.abnormalCount += record.abnormalCount;
            totals.billCount += record.bills.length;
            return totals;
        }, { dispatchCount: 0, signCount: 0, abnormalCount: 0, billCount: 0 });
    }

    function getDetailPayload(targetKey) {
        const records = getRangeRecords();
        if (targetKey === '__total__') {
            const totalBills = records.flatMap((record) => record.bills.map((bill, index) => ({
                ...bill,
                billNo: `${bill.billNo}-${String(index + 1).padStart(2, '0')}`
            })));

            return {
                title: '总计单号明细',
                subtitle: `${getTabMeta(state.activeTabId).label} · ${getRangeLabel(state.startDate, state.endDate)}`,
                bills: totalBills,
                counts: getTotals(records)
            };
        }

        const record = records.find((item) => item.dateKey === targetKey) || null;
        if (!record) return null;

        return {
            title: `${record.displayDate} 单号明细`,
            subtitle: `${getTabMeta(state.activeTabId).label} · ${record.displayDateAlt}`,
            bills: record.bills,
            counts: {
                dispatchCount: record.dispatchCount,
                signCount: record.signCount,
                abnormalCount: record.abnormalCount,
                billCount: record.bills.length
            }
        };
    }

    function setContainerBaseStyle() {
        container.style.height = '100%';
        container.style.minHeight = '0';
        container.style.overflow = 'hidden';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
    }

    function restoreContainerBaseStyle() {
        container.style.height = previousContainerStyle.height;
        container.style.overflow = previousContainerStyle.overflow;
        container.style.display = previousContainerStyle.display;
        container.style.flexDirection = previousContainerStyle.flexDirection;
        container.style.minHeight = previousContainerStyle.minHeight;
    }

    function applyPreset(presetId) {
        const range = getPresetRange(presetId);
        state.activePresetId = presetId;
        state.startDate = range.startDate;
        state.endDate = range.endDate;
        state.detailTargetKey = null;
        renderView();
    }

    function updateRange(startDate, endDate) {
        state.startDate = startDate;
        state.endDate = endDate;
        normalizeRangeState();
        state.detailTargetKey = null;
        renderView();
    }

    function openDetail(targetKey) {
        state.detailTargetKey = targetKey;
        renderView();
    }

    function closeDetail() {
        state.detailTargetKey = null;
        renderView();
    }

    function renderTabButton(tab) {
        const isActive = tab.id === state.activeTabId;
        return `<button class="sr-tab ${isActive ? 'active' : ''}" type="button" data-tab-id="${tab.id}">${tab.label}</button>`;
    }

    function renderPresetButton(presetId, preset) {
        const isActive = presetId === state.activePresetId;
        return `<button class="sr-preset ${isActive ? 'active' : ''}" type="button" data-preset-id="${presetId}">${preset.label}</button>`;
    }

    function renderTableRows(records) {
        const totals = getTotals(records);
        const rows = [
            {
                key: '__total__',
                displayDate: '总计',
                dispatchCount: totals.dispatchCount,
                signCount: totals.signCount,
                abnormalCount: totals.abnormalCount,
                actionLabel: '查看',
                isTotal: true
            },
            ...records.map((record) => ({
                key: record.dateKey,
                displayDate: record.displayDate,
                displayDateAlt: record.displayDateAlt,
                dispatchCount: record.dispatchCount,
                signCount: record.signCount,
                abnormalCount: record.abnormalCount,
                actionLabel: '查看',
                isTotal: false
            }))
        ];

        return rows.map((row) => `
            <div class="sr-table-row ${row.isTotal ? 'total' : ''}">
                <span class="sr-time-cell">
                    <strong>${escapeHtml(row.displayDate)}</strong>
                    ${row.displayDateAlt ? `<small>${escapeHtml(row.displayDateAlt)}</small>` : '<small>范围汇总</small>'}
                </span>
                <span class="sr-count-cell"><strong>${row.dispatchCount}</strong></span>
                <span class="sr-count-cell"><strong>${row.signCount}</strong></span>
                <span class="sr-count-cell"><strong>${row.abnormalCount}</strong></span>
                <button class="sr-view-btn" type="button" data-detail-key="${row.key}">${row.actionLabel}</button>
            </div>
        `).join('');
    }

    function renderDetailPanel(detailPayload) {
        if (!detailPayload) return '';

        return `
            <section class="sr-card sr-detail-card">
                <div class="sr-detail-head">
                    <div>
                        <div class="sr-card-title">${escapeHtml(detailPayload.title)}</div>
                        <div class="sr-card-subtitle">${escapeHtml(detailPayload.subtitle)}</div>
                    </div>
                    <button class="sr-close-btn" type="button" id="srCloseDetail">收起</button>
                </div>
                <div class="sr-detail-grid">
                    <div><span>分发量</span><strong>${detailPayload.counts.dispatchCount}</strong></div>
                    <div><span>签收量</span><strong>${detailPayload.counts.signCount}</strong></div>
                    <div><span>异常签收</span><strong>${detailPayload.counts.abnormalCount}</strong></div>
                    <div><span>单号数</span><strong>${detailPayload.counts.billCount}</strong></div>
                </div>
                <div class="sr-bill-list">
                    ${detailPayload.bills.slice(0, 8).map((bill) => `
                        <div class="sr-bill-item">
                            <strong>${escapeHtml(bill.billNo)}</strong>
                            <span>${escapeHtml(bill.status)}</span>
                        </div>
                    `).join('')}
                </div>
            </section>
        `;
    }

    function renderView() {
        setContainerBaseStyle();

        const rangeRecords = getRangeRecords();
        const totals = getTotals(rangeRecords);
        const activeTab = getTabMeta(state.activeTabId);
        const detailPayload = state.detailTargetKey ? getDetailPayload(state.detailTargetKey) : null;

        container.innerHTML = `
            <section class="signed-report-page">
                <style>
                    * { box-sizing: border-box; }
                    .signed-report-page {
                        min-height: 100%;
                        height: 100%;
                        overflow: hidden;
                        background: linear-gradient(180deg, #eef6ff 0%, #f7fafc 24%, #f8fbfe 100%);
                        color: #152033;
                        font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Segoe UI', sans-serif;
                    }
                    .sr-shell {
                        height: 100%;
                        overflow-y: auto;
                        padding: 12px 12px 18px;
                        -webkit-overflow-scrolling: touch;
                    }
                    .sr-header {
                        display: grid;
                        grid-template-columns: 34px minmax(0, 1fr) auto;
                        align-items: center;
                        gap: 10px;
                        margin-bottom: 12px;
                    }
                    .sr-back, .sr-tab, .sr-preset, .sr-view-btn, .sr-close-btn, .sr-chip-btn, .sr-date-input { border: none; outline: none; }
                    .sr-back {
                        width: 34px;
                        height: 34px;
                        border-radius: 12px;
                        background: rgba(255, 255, 255, 0.9);
                        color: #20314a;
                        font-size: 28px;
                        line-height: 1;
                        box-shadow: 0 6px 16px rgba(31, 111, 255, 0.08);
                        cursor: pointer;
                    }
                    .sr-title-wrap { min-width: 0; text-align: center; }
                    .sr-title-line { display: inline-flex; align-items: center; gap: 8px; flex-wrap: wrap; justify-content: center; }
                    .sr-title { font-size: 20px; font-weight: 800; color: #142033; letter-spacing: -0.2px; }
                    .sr-badge { padding: 5px 10px; border-radius: 999px; background: #e8f1ff; color: #1f6fff; font-size: 12px; font-weight: 700; }
                    .sr-subtitle { margin-top: 3px; font-size: 12px; color: #748296; line-height: 1.4; }
                    .sr-body-card, .sr-card, .sr-date-card, .sr-table-card {
                        background: rgba(255, 255, 255, 0.96);
                        border: 1px solid rgba(220, 230, 243, 0.92);
                        border-radius: 18px;
                        box-shadow: 0 10px 26px rgba(19, 42, 92, 0.05);
                    }
                    .sr-card, .sr-table-card { padding: 14px; margin-bottom: 12px; }
                    .sr-tab-bar { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-bottom: 12px; }
                    .sr-tab {
                        height: 42px;
                        border-radius: 14px;
                        background: #eef4ff;
                        color: #5c6b7d;
                        font-size: 14px;
                        font-weight: 700;
                        cursor: pointer;
                    }
                    .sr-tab.active {
                        background: linear-gradient(135deg, #1f6fff 0%, #18b3a7 100%);
                        color: #fff;
                        box-shadow: 0 10px 24px rgba(31, 111, 255, 0.2);
                    }
                    .sr-preset-bar { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; margin-bottom: 12px; }
                    .sr-preset {
                        height: 36px;
                        border-radius: 999px;
                        background: #edf3ff;
                        color: #5d6d82;
                        font-size: 12px;
                        font-weight: 700;
                        cursor: pointer;
                    }
                    .sr-preset.active { background: #1f6fff; color: #fff; }
                    .sr-date-card { padding: 14px; margin-bottom: 12px; }
                    .sr-range-preview { display: grid; grid-template-columns: minmax(0, 1fr) 24px minmax(0, 1fr); gap: 8px; align-items: center; }
                    .sr-range-preview-text { display: flex; flex-direction: column; gap: 4px; }
                    .sr-range-label { font-size: 12px; color: #7b889a; }
                    .sr-chip-btn {
                        width: 100%;
                        padding: 10px 12px;
                        border-radius: 14px;
                        background: linear-gradient(180deg, #f8fbff 0%, #edf4ff 100%);
                        color: #1e3354;
                        cursor: pointer;
                        text-align: left;
                        box-shadow: inset 0 0 0 1px rgba(31, 111, 255, 0.08);
                    }
                    .sr-chip-btn strong { display: block; margin-top: 2px; font-size: 15px; }
                    .sr-arrow { text-align: center; font-size: 18px; color: #9aabc0; font-weight: 700; }
                    .sr-range-inputs { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-top: 12px; }
                    .sr-date-field { display: flex; flex-direction: column; gap: 6px; }
                    .sr-date-field span { font-size: 12px; color: #748296; font-weight: 700; }
                    .sr-date-input {
                        width: 100%;
                        height: 42px;
                        border-radius: 14px;
                        padding: 0 12px;
                        background: #f8fbff;
                        color: #1e3354;
                        border: 1px solid #e0e9f5;
                        font-size: 14px;
                    }
                    .sr-table-head { display: grid; grid-template-columns: 1.2fr 0.84fr 0.84fr 0.92fr 0.52fr; align-items: stretch; border-radius: 14px 14px 0 0; overflow: hidden; }
                    .sr-head-cell {
                        padding: 11px 10px;
                        background: #f1f5fb;
                        color: #708096;
                        font-size: 12px;
                        font-weight: 700;
                        border-right: 1px solid #edf2f8;
                    }
                    .sr-head-cell:last-child { border-right: none; }
                    .sr-table-row {
                        display: grid;
                        grid-template-columns: 1.2fr 0.84fr 0.84fr 0.92fr 0.52fr;
                        align-items: stretch;
                        border-top: 1px solid #edf2f8;
                        background: #fff;
                    }
                    .sr-table-row.total {
                        background: linear-gradient(180deg, #f7fbff 0%, #eef6ff 100%);
                    }
                    .sr-table-row span, .sr-table-row button {
                        padding: 12px 10px;
                        min-width: 0;
                        border-right: 1px solid #edf2f8;
                    }
                    .sr-table-row span:last-child, .sr-table-row button:last-child { border-right: none; }
                    .sr-time-cell { display: flex; flex-direction: column; justify-content: center; gap: 3px; }
                    .sr-time-cell strong { font-size: 13px; color: #1a2940; }
                    .sr-time-cell small { font-size: 11px; color: #7a8798; }
                    .sr-count-cell {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 14px;
                        color: #24344c;
                    }
                    .sr-count-cell strong { font-size: 15px; }
                    .sr-view-btn {
                        background: transparent;
                        color: #1f6fff;
                        font-size: 13px;
                        font-weight: 800;
                        cursor: pointer;
                    }
                    .sr-table-wrap { overflow: hidden; border-radius: 14px; border: 1px solid #e6edf7; }
                    .sr-table-summary { margin-top: 10px; font-size: 12px; color: #7a8798; }
                    .sr-detail-card { margin-top: 12px; }
                    .sr-detail-head { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
                    .sr-card-title { font-size: 15px; font-weight: 800; color: #152033; }
                    .sr-card-subtitle { margin-top: 4px; font-size: 12px; color: #79869a; line-height: 1.45; }
                    .sr-close-btn {
                        flex: 0 0 auto;
                        border-radius: 999px;
                        padding: 8px 12px;
                        background: #edf3ff;
                        color: #1f6fff;
                        font-size: 12px;
                        font-weight: 700;
                        cursor: pointer;
                    }
                    .sr-detail-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; margin-top: 12px; }
                    .sr-detail-grid div { background: #f8fbff; border-radius: 14px; padding: 10px 8px; text-align: center; }
                    .sr-detail-grid span { display: block; font-size: 11px; color: #7a8798; }
                    .sr-detail-grid strong { display: block; margin-top: 4px; font-size: 18px; color: #1a2940; }
                    .sr-bill-list { display: grid; gap: 8px; margin-top: 12px; }
                    .sr-bill-item { display: flex; justify-content: space-between; gap: 10px; align-items: center; padding: 10px 12px; border-radius: 14px; background: #f8fbff; }
                    .sr-bill-item strong { font-size: 13px; color: #20314a; word-break: break-all; }
                    .sr-bill-item span { flex: 0 0 auto; font-size: 12px; color: #5b6d82; }
                    @media (max-width: 390px) {
                        .sr-preset-bar { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                        .sr-detail-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                        .sr-table-head, .sr-table-row { grid-template-columns: 1.15fr 0.76fr 0.76fr 0.82fr 0.5fr; }
                    }
                </style>

                <div class="sr-shell">
                    <header class="sr-header">
                        <button class="sr-back" type="button" id="srBackHome" aria-label="返回首页">‹</button>
                        <div class="sr-title-wrap">
                            <div class="sr-title-line">
                                <div class="sr-title">汇总数据</div>
                                <div class="sr-badge">子账号汇总</div>
                            </div>
                            <div class="sr-subtitle">默认展示派签量，支持按日期范围切换查看单号明细</div>
                        </div>
                        <div></div>
                    </header>

                    <section class="sr-tab-bar">
                        ${tabs.map((tab) => renderTabButton(tab)).join('')}
                    </section>

                    <section class="sr-preset-bar">
                        ${Object.entries(presetRanges).map(([presetId, preset]) => renderPresetButton(presetId, preset)).join('')}
                    </section>

                    <section class="sr-date-card">
                        <div class="sr-range-preview">
                            <button class="sr-chip-btn" type="button" data-open-date-input="start">
                                <span class="sr-range-label">开始日期</span>
                                <strong>${escapeHtml(formatCompactDate(state.startDate))}</strong>
                            </button>
                            <div class="sr-arrow">至</div>
                            <button class="sr-chip-btn" type="button" data-open-date-input="end">
                                <span class="sr-range-label">结束日期</span>
                                <strong>${escapeHtml(formatCompactDate(state.endDate))}</strong>
                            </button>
                        </div>
                        <div class="sr-range-inputs">
                            <label class="sr-date-field">
                                <span>开始日期</span>
                                <input class="sr-date-input" id="srStartDate" type="date" value="${escapeHtml(state.startDate)}" />
                            </label>
                            <label class="sr-date-field">
                                <span>结束日期</span>
                                <input class="sr-date-input" id="srEndDate" type="date" value="${escapeHtml(state.endDate)}" />
                            </label>
                        </div>
                    </section>

                    <section class="sr-table-card">
                        <div class="sr-table-head">
                            <div class="sr-head-cell">时间</div>
                            <div class="sr-head-cell">分发量</div>
                            <div class="sr-head-cell">签收量</div>
                            <div class="sr-head-cell">异常签收</div>
                            <div class="sr-head-cell">操作</div>
                        </div>
                        <div class="sr-table-wrap">
                            ${renderTableRows(rangeRecords)}
                        </div>
                        <div class="sr-table-summary">${activeTab.label} · ${getRangeLabel(state.startDate, state.endDate)} · 共 ${rangeRecords.length} 天</div>
                    </section>

                    ${renderDetailPanel(detailPayload)}
                </div>
            </section>
        `;

        const backHomeBtn = container.querySelector('#srBackHome');
        if (backHomeBtn) {
            backHomeBtn.addEventListener('click', () => {
                restoreContainerBaseStyle();
                if (typeof navigateTo === 'function') {
                    navigateTo('home');
                }
            });
        }

        container.querySelectorAll('.sr-tab').forEach((button) => {
            button.addEventListener('click', () => {
                const tabId = button.getAttribute('data-tab-id');
                if (tabId && tabId !== state.activeTabId) {
                    state.activeTabId = tabId;
                    state.detailTargetKey = null;
                    renderView();
                }
            });
        });

        container.querySelectorAll('.sr-preset').forEach((button) => {
            button.addEventListener('click', () => {
                const presetId = button.getAttribute('data-preset-id');
                if (presetId) applyPreset(presetId);
            });
        });

        const startInput = container.querySelector('#srStartDate');
        const endInput = container.querySelector('#srEndDate');

        if (startInput) {
            startInput.addEventListener('change', () => {
                updateRange(startInput.value || state.startDate, endInput ? endInput.value || state.endDate : state.endDate);
            });
        }

        if (endInput) {
            endInput.addEventListener('change', () => {
                updateRange(startInput ? startInput.value || state.startDate : state.startDate, endInput.value || state.endDate);
            });
        }

        container.querySelectorAll('[data-open-date-input]').forEach((button) => {
            button.addEventListener('click', () => {
                const target = button.getAttribute('data-open-date-input');
                const input = target === 'start' ? startInput : endInput;
                if (!input) return;
                if (typeof input.showPicker === 'function') {
                    input.showPicker();
                    return;
                }
                input.focus();
                input.click();
            });
        });

        container.querySelectorAll('.sr-view-btn').forEach((button) => {
            button.addEventListener('click', () => {
                const detailKey = button.getAttribute('data-detail-key');
                if (detailKey) openDetail(detailKey);
            });
        });

        const closeDetailBtn = container.querySelector('#srCloseDetail');
        if (closeDetailBtn) {
            closeDetailBtn.addEventListener('click', () => closeDetail());
        }
    }

    renderView();
}