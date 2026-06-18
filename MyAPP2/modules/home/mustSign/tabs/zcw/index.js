const moreActionItems = [
    { key: 'aiCall', label: 'AI电联代打' },
    { key: 'smsVoice', label: '发短信/语音' }
];

const defaultReasons = [
    { key: 'noDoor', label: '地址不详未具体到门牌' },
    { key: 'noEntry', label: '地址禁止快递员进入' },
    { key: 'risk', label: '有丢件风险' },
    { key: 'delivered', label: '告知客户已送货上门' },
    { key: 'fragile', label: '贵重/易碎等物品' },
    { key: 'other', label: '其他（手动输入原因）' }
];

export function getWaybillDetailProfile() {
    return {
        title: '送货上门件',
        incentiveText: '额外获得0.8元 激励派费(仅标准上门字段签收)',
        submitText: '上门签收'
    };
}

export function getMoreActionsMenuHtml() {
    return moreActionItems
        .map((item) => `<button class="ms-more-menu-item" type="button" data-more-action="${item.key}">${item.label}</button>`)
        .join('');
}

export function createTabFeatureController({
    pageEl,
    moreBtn,
    moreMenu,
    moreMask,
    selectedIds,
    getRows,
    getActiveTab,
    apiBridge,
    routeParams,
    pageToast,
    modal,
    mask,
    panel,
    optionsEl,
    customWrap,
    input,
    inputClear,
    clearBtn,
    cancelBtn,
    confirmBtn,
    getCurrentItemById,
    nightDialPrompt
}) {
    let moreMenuVisible = false;
    const callReportState = {
        visible: false,
        itemId: '',
        selectedKey: '',
        customText: '',
        reasons: defaultReasons
    };
    let inputLimitToastShown = false;

    function getSelectedRowsInActiveTab() {
        const rows = getRows();
        return rows.filter((item) => selectedIds.has(item.id));
    }

    function positionMoreMenu() {
        if (!moreMenu || !moreBtn || !pageEl) return;

        const pageRect = pageEl.getBoundingClientRect();
        const btnRect = moreBtn.getBoundingClientRect();
        const menuRect = moreMenu.getBoundingClientRect();
        const pagePadding = 8;
        const gap = 8;

        let left = btnRect.right - pageRect.left - menuRect.width;
        const maxLeft = pageRect.width - menuRect.width - pagePadding;
        left = Math.max(pagePadding, Math.min(left, maxLeft));

        let top = btnRect.top - pageRect.top - menuRect.height - gap;
        if (top < pagePadding) top = pagePadding;

        moreMenu.style.left = `${left}px`;
        moreMenu.style.top = `${top}px`;
    }

    function setMoreMenuVisible(visible) {
        moreMenuVisible = visible;
        if (moreMenu) moreMenu.hidden = !visible;
        if (moreMask) moreMask.hidden = !visible;
        if (moreBtn) moreBtn.textContent = visible ? '更多操作 v' : '更多操作 ^';
        if (visible) {
            requestAnimationFrame(() => {
                positionMoreMenu();
            });
        }
    }

    function handleMoreAction(actionKey) {
        const selectedRows = getSelectedRowsInActiveTab();
        if (!selectedRows.length) {
            pageToast('请先勾选至少1条运单', 3000);
            return;
        }

        if (typeof apiBridge.onMoreAction === 'function') {
            apiBridge.onMoreAction({ actionKey, rows: selectedRows, activeTab: getActiveTab() });
        }
        if (typeof routeParams.onMoreAction === 'function') {
            routeParams.onMoreAction({ actionKey, rows: selectedRows, activeTab: getActiveTab() });
        }

        if (actionKey === 'aiCall') {
            pageToast(`已触发AI电联代打（${selectedRows.length}条）`, 3000);
            return;
        }

        if (actionKey === 'smsVoice') {
            pageToast(`已触发发短信/语音（${selectedRows.length}条）`, 3000);
            return;
        }

        pageToast(`更多操作：${selectedRows.length}条`, 3000);
    }

    function normalizeReasons(inputReasons) {
        if (!Array.isArray(inputReasons)) return [];
        return inputReasons
            .map((item, index) => {
                if (typeof item === 'string') {
                    return { key: `reason-${index + 1}`, label: item };
                }
                if (item && typeof item === 'object') {
                    const label = item.label || item.name || item.text || '';
                    if (!label) return null;
                    return {
                        key: item.key || item.id || `reason-${index + 1}`,
                        label
                    };
                }
                return null;
            })
            .filter(Boolean);
    }

    function getDefaultReasons() {
        return defaultReasons.map((reason) => ({ ...reason }));
    }

    async function loadCallReportReasons(item) {
        try {
            if (Array.isArray(apiBridge.callReportReasons)) {
                const reasons = normalizeReasons(apiBridge.callReportReasons);
                return reasons.length ? reasons : getDefaultReasons();
            }

            if (typeof apiBridge.getCallReportReasons === 'function') {
                const result = await apiBridge.getCallReportReasons(item);
                const reasons = normalizeReasons(result);
                return reasons.length ? reasons : getDefaultReasons();
            }

            if (apiBridge.callReportReasonsUrl) {
                const url = typeof apiBridge.callReportReasonsUrl === 'function'
                    ? apiBridge.callReportReasonsUrl(item)
                    : apiBridge.callReportReasonsUrl;
                const response = await fetch(url, { method: 'GET' });
                if (response.ok) {
                    const data = await response.json();
                    const reasons = normalizeReasons(data?.data || data?.reasons || data);
                    if (reasons.length) return reasons;
                }
            }
        } catch (error) {
            // 演示场景下静默兜底到本地原因，不打断操作。
        }

        return getDefaultReasons();
    }

    function isTargetReasonItem(item) {
        return Boolean(
            item &&
            item.callTag === '电话勿扰' &&
            item.tags?.some((tag) => tag.text === '韵达智橙网') &&
            item.tags?.some((tag) => tag.text === '多多专送')
        );
    }

    function renderCallReportOptions(reasons) {
        if (!optionsEl) return;
        optionsEl.innerHTML = reasons
            .map((reason) => `<button class="ms-modal-option" type="button" data-reason-key="${reason.key}" data-reason-label="${reason.label}">${reason.label}</button>`)
            .join('');
    }

    function updateCallReportSelection(selectedKey) {
        callReportState.selectedKey = selectedKey;
        if (optionsEl) {
            optionsEl.querySelectorAll('.ms-modal-option').forEach((btn) => {
                btn.classList.toggle('active', btn.dataset.reasonKey === selectedKey);
            });
        }

        if (selectedKey === 'other') {
            if (customWrap) customWrap.hidden = false;
            if (input) input.focus();
            if (panel) {
                requestAnimationFrame(() => {
                    panel.scrollTop = panel.scrollHeight;
                });
            }
            return;
        }

        callReportState.customText = '';
        if (input) input.value = '';
        if (customWrap) customWrap.hidden = true;
        if (panel) panel.scrollTop = 0;
    }

    function bindCallReportOptionEvents() {
        if (!optionsEl) return;
        optionsEl.querySelectorAll('.ms-modal-option').forEach((btn) => {
            btn.addEventListener('click', () => {
                updateCallReportSelection(btn.dataset.reasonKey || '');
            });
        });
    }

    function resetOtherReasonMode() {
        callReportState.selectedKey = '';
        callReportState.customText = '';
        inputLimitToastShown = false;
        if (input) input.value = '';
        if (input) input.classList.remove('limit-hit');
        if (customWrap) customWrap.hidden = true;
        if (panel) panel.scrollTop = 0;
        if (optionsEl) {
            optionsEl.querySelectorAll('.ms-modal-option').forEach((btn) => btn.classList.remove('active'));
        }
    }

    function closeCallReportModal() {
        callReportState.visible = false;
        callReportState.itemId = '';
        callReportState.selectedKey = '';
        callReportState.customText = '';
        callReportState.reasons = getDefaultReasons();
        inputLimitToastShown = false;
        if (input) input.value = '';
        if (customWrap) customWrap.hidden = true;
        if (optionsEl) {
            optionsEl.querySelectorAll('.ms-modal-option').forEach((btn) => btn.classList.remove('active'));
        }
        if (modal) {
            modal.classList.remove('show');
            modal.setAttribute('aria-hidden', 'true');
        }
    }

    function openCallReportModal(item) {
        callReportState.visible = true;
        callReportState.itemId = item.id;
        callReportState.selectedKey = '';
        callReportState.customText = '';
        inputLimitToastShown = false;
        callReportState.reasons = getDefaultReasons();
        if (input) input.value = '';
        if (customWrap) customWrap.hidden = true;
        if (modal) {
            modal.classList.add('show');
            modal.setAttribute('aria-hidden', 'false');
        }
        renderCallReportOptions(callReportState.reasons);
        bindCallReportOptionEvents();

        void (async () => {
            const reasons = await loadCallReportReasons(item);
            if (!callReportState.visible || callReportState.itemId !== item.id) return;
            callReportState.reasons = reasons;
            renderCallReportOptions(reasons);
            bindCallReportOptionEvents();
        })();
    }

    async function submitCallReportReason(item, reasonLabel, reasonText) {
        const payload = {
            itemId: item.id,
            trackingNo: item.trackingNo,
            reasonLabel,
            reasonText: reasonText || reasonLabel,
            callTag: item.callTag,
            platform: item.platform
        };

        try {
            if (typeof apiBridge.submitCallReportReason === 'function') {
                await apiBridge.submitCallReportReason(payload, item);
            } else if (apiBridge.submitCallReportReasonUrl) {
                const submitUrl = typeof apiBridge.submitCallReportReasonUrl === 'function'
                    ? apiBridge.submitCallReportReasonUrl(item)
                    : apiBridge.submitCallReportReasonUrl;
                const response = await fetch(submitUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!response.ok) throw new Error('submit-failed');
            }
        } catch (error) {
            // 演示模式下忽略接口失败，继续拨号流程。
        }

        pageToast(`已上报：${reasonText || reasonLabel}`, 3000);
        if (typeof apiBridge.onDial === 'function') {
            apiBridge.onDial(item);
        } else if (typeof routeParams.onDial === 'function') {
            routeParams.onDial(item);
        }
    }

    async function handleCallAction(item) {
        if (typeof nightDialPrompt === 'function') {
            const guarded = await nightDialPrompt(item, async () => {
                if (isTargetReasonItem(item)) {
                    openCallReportModal(item);
                    return;
                }

                if (typeof apiBridge.onDial === 'function') {
                    apiBridge.onDial(item);
                } else if (typeof routeParams.onDial === 'function') {
                    routeParams.onDial(item);
                }
            });
            if (guarded) return;
        }

        if (isTargetReasonItem(item)) {
            openCallReportModal(item);
            return;
        }

        if (typeof apiBridge.onDial === 'function') {
            apiBridge.onDial(item);
        } else if (typeof routeParams.onDial === 'function') {
            routeParams.onDial(item);
        }
    }

    if (moreBtn) {
        moreBtn.addEventListener('click', () => {
            setMoreMenuVisible(!moreMenuVisible);
        });
    }

    if (moreMask) {
        moreMask.addEventListener('click', () => {
            setMoreMenuVisible(false);
        });
    }

    if (moreMenu) {
        moreMenu.querySelectorAll('.ms-more-menu-item').forEach((btn) => {
            btn.addEventListener('click', () => {
                setMoreMenuVisible(false);
                handleMoreAction(btn.dataset.moreAction || '');
            });
        });
    }

    window.addEventListener('resize', () => {
        if (moreMenuVisible) positionMoreMenu();
    });

    if (mask) {
        mask.addEventListener('click', closeCallReportModal);
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeCallReportModal);
    }

    if (inputClear) {
        inputClear.addEventListener('click', () => {
            if (input) input.value = '';
            callReportState.customText = '';
            if (input) input.focus();
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            resetOtherReasonMode();
        });
    }

    if (input) {
        input.addEventListener('input', () => {
            const value = input.value.replace(/\s+/g, ' ').trimStart();
            input.value = value;
            callReportState.customText = value;

            if (value.length >= 50) {
                input.classList.add('limit-hit');
                if (!inputLimitToastShown) {
                    pageToast('最多输入50个字', 3000);
                    inputLimitToastShown = true;
                }
            } else {
                input.classList.remove('limit-hit');
                inputLimitToastShown = false;
            }
        });
    }

    if (confirmBtn) {
        confirmBtn.addEventListener('click', async () => {
            const item = getCurrentItemById(callReportState.itemId);
            if (!item) {
                closeCallReportModal();
                return;
            }

            if (!callReportState.selectedKey) {
                pageToast('请选择上报原因', 3000);
                return;
            }

            const selectedReason = callReportState.reasons.find((reason) => reason.key === callReportState.selectedKey);
            if (!selectedReason) {
                pageToast('请选择上报原因', 3000);
                return;
            }

            if (selectedReason.key === 'other') {
                const text = (input?.value || '').trim();
                if (text.length < 3) {
                    pageToast('请输入至少3个字', 3000);
                    return;
                }

                closeCallReportModal();
                await submitCallReportReason(item, selectedReason.label, text);
                return;
            }

            closeCallReportModal();
            await submitCallReportReason(item, selectedReason.label, selectedReason.label);
        });
    }

    return {
        onTabChange() {
            setMoreMenuVisible(false);
        },
        handleCallAction
    };
}
