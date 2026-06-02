const consultData = {
	title: '咨询服务',
	subtitle: '快速了解服务内容，选择适合您的咨询方式',
	quickEntries: [
		{
			title: '在线咨询',
			desc: '提交问题后，平台会尽快安排顾问回复',
			tag: '推荐'
		},
		{
			title: '电话咨询',
			desc: '工作日 09:00 - 18:00 提供人工咨询服务',
			tag: '高效'
		},
		{
			title: '预约咨询',
			desc: '提前预约时间，获取更有针对性的沟通服务',
			tag: '便捷'
		}
	],
	faqList: [
		{
			question: '咨询前需要准备什么？',
			answer: '建议提前整理您的需求、问题描述以及相关资料，方便顾问快速了解情况。'
		},
		{
			question: '提交后多久可以得到回复？',
			answer: '一般情况下会在工作时间内尽快处理，复杂问题会在沟通后安排专人跟进。'
		},
		{
			question: '是否支持多次咨询？',
			answer: '支持，您可以根据实际情况继续补充问题，顾问会结合上下文持续提供帮助。'
		}
	],
	process: ['填写需求', '平台受理', '顾问联系', '持续跟进'],
	notice: '如需紧急协助，请优先选择电话咨询。'
};

function getConsultData() {
	return JSON.parse(JSON.stringify(consultData));
}

function buildConsultHtml(data) {
	const entries = data.quickEntries
		.map(
			(item) => `
				<div class="consult-card">
					<div class="consult-card__tag">${item.tag}</div>
					<div class="consult-card__title">${item.title}</div>
					<div class="consult-card__desc">${item.desc}</div>
				</div>`
		)
		.join('');

	const process = data.process
		.map(
			(item, index) => `
				<div class="consult-step">
					<div class="consult-step__index">${index + 1}</div>
					<div class="consult-step__text">${item}</div>
				</div>`
		)
		.join('');

	const faq = data.faqList
		.map(
			(item) => `
				<div class="consult-faq-item">
					<div class="consult-faq-item__q">Q：${item.question}</div>
					<div class="consult-faq-item__a">A：${item.answer}</div>
				</div>`
		)
		.join('');

	return `
		<section class="consult-page">
			<style>
				.consult-page{padding:16px;background:#f6f8fb;min-height:100%;box-sizing:border-box;font-family:Arial,"PingFang SC","Microsoft YaHei",sans-serif;color:#1f2937}
				.consult-banner{background:linear-gradient(135deg,#2f80ed,#56ccf2);color:#fff;border-radius:16px;padding:20px 18px;box-shadow:0 10px 24px rgba(47,128,237,.18)}
				.consult-banner__title{font-size:22px;font-weight:700;margin-bottom:8px}
				.consult-banner__subtitle{font-size:14px;line-height:1.6;opacity:.95}
				.consult-section{margin-top:16px;background:#fff;border-radius:16px;padding:16px;box-shadow:0 6px 20px rgba(15,23,42,.05)}
				.consult-section__title{font-size:16px;font-weight:700;margin-bottom:12px}
				.consult-card-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}
				.consult-card{position:relative;background:#f8fbff;border:1px solid #e7f0fb;border-radius:12px;padding:14px}
				.consult-card__tag{display:inline-block;padding:2px 8px;border-radius:999px;background:#e8f3ff;color:#2f80ed;font-size:12px;margin-bottom:10px}
				.consult-card__title{font-size:15px;font-weight:700;margin-bottom:6px}
				.consult-card__desc,.consult-faq-item__a,.consult-step__text,.consult-notice{font-size:13px;line-height:1.7;color:#4b5563}
				.consult-step-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px}
				.consult-step{display:flex;align-items:center;background:#f9fafb;border-radius:12px;padding:12px}
				.consult-step__index{width:28px;height:28px;border-radius:50%;background:#2f80ed;color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;margin-right:10px;flex-shrink:0}
				.consult-faq-item{padding:12px 0;border-top:1px solid #eef2f7}
				.consult-faq-item:first-child{border-top:none;padding-top:0}
				.consult-faq-item__q{font-size:14px;font-weight:700;margin-bottom:6px}
				.consult-notice{padding:12px 14px;background:#fff8e8;border:1px solid #ffe7a8;border-radius:12px;color:#8a5a00}
			</style>
			<div class="consult-banner">
				<div class="consult-banner__title">${data.title}</div>
				<div class="consult-banner__subtitle">${data.subtitle}</div>
			</div>
			<div class="consult-section">
				<div class="consult-section__title">咨询方式</div>
				<div class="consult-card-list">${entries}</div>
			</div>
			<div class="consult-section">
				<div class="consult-section__title">服务流程</div>
				<div class="consult-step-list">${process}</div>
			</div>
			<div class="consult-section">
				<div class="consult-section__title">常见问题</div>
				${faq}
			</div>
			<div class="consult-section">
				<div class="consult-section__title">温馨提示</div>
				<div class="consult-notice">${data.notice}</div>
			</div>
		</section>`;
}

function resolveContainer(container) {
	if (container) return container;
	if (typeof document === 'undefined') return null;
	return (
		document.querySelector('[data-module="consult"]') ||
		document.getElementById('consult') ||
		document.getElementById('app') ||
		document.querySelector('main') ||
		document.body
	);
}

function renderConsultContent(container) {
	const target = resolveContainer(container);
	const data = getConsultData();
	if (target && typeof target.innerHTML !== 'undefined') {
		target.innerHTML = buildConsultHtml(data);
	}
	return data;
}

export async function render(containerId) {
	const target = document.getElementById(containerId);
	if (!target) return;
	renderConsultContent(target);
}
