import {
	getMoreActionsMenuHtml as getBaseMoreActionsMenuHtml,
	createTabFeatureController as createBaseTabFeatureController
} from '../zcw/index.js';

const TAB_ID = 'dispatch';

export function getWaybillDetailProfile() {
	return {
		title: '运单详情',
		incentiveText: '',
		submitText: '提交'
	};
}

export function getMoreActionsMenuHtml() {
	return getBaseMoreActionsMenuHtml();
}

export function createTabFeatureController(context) {
	// 先复用基础实现，后续可在当前tab内补充独立交互。
	return createBaseTabFeatureController({
		...context,
		routeParams: {
			...(context.routeParams || {}),
			__tabId: TAB_ID
		}
	});
}
