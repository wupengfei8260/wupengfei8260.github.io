let styleInjected = false;
let activeOverlay = null;

function injectStyles() {
	if (styleInjected) return;

	const style = document.createElement('style');
	style.id = 'scan-modal-style';
	style.textContent = `
		.scan-modal {
			position: absolute;
			inset: 0;
			z-index: 9999;
			background: #000;
			color: #fff;
			display: flex;
			flex-direction: column;
		}

		.scan-modal-header {
			height: 58px;
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 0 16px;
			background: linear-gradient(180deg, rgba(0,0,0,0.7), rgba(0,0,0,0.1));
			font-size: 16px;
			font-weight: 600;
			letter-spacing: 0.5px;
			flex-shrink: 0;
		}

		.scan-close-btn {
			width: 34px;
			height: 34px;
			border-radius: 999px;
			border: 1px solid rgba(255,255,255,0.4);
			background: rgba(255,255,255,0.12);
			color: #fff;
			font-size: 20px;
			line-height: 1;
			cursor: pointer;
		}

		.scan-stage {
			position: relative;
			flex: 1;
			overflow: hidden;
			display: flex;
			align-items: center;
			justify-content: center;
		}

		.scan-video {
			position: absolute;
			inset: 0;
			width: 100%;
			height: 100%;
			object-fit: cover;
			background: #111;
		}

		.scan-mask {
			position: absolute;
			inset: 0;
			background: radial-gradient(circle at center, transparent 0 28%, rgba(0,0,0,0.58) 30% 100%);
			pointer-events: none;
		}

		.scan-frame {
			width: 220px;
			height: 220px;
			border: 2px solid rgba(255,255,255,0.9);
			border-radius: 18px;
			position: relative;
			z-index: 2;
			box-shadow: 0 0 0 999px rgba(0,0,0,0.35);
		}

		.scan-line {
			position: absolute;
			left: 14px;
			right: 14px;
			top: 18px;
			height: 2px;
			background: linear-gradient(90deg, rgba(39, 209, 255, 0.15), rgba(80, 245, 185, 0.95), rgba(39, 209, 255, 0.15));
			box-shadow: 0 0 10px rgba(80, 245, 185, 0.8);
			animation: scan-move 1.8s linear infinite;
		}

		.scan-tip {
			position: absolute;
			bottom: 20%;
			left: 50%;
			transform: translateX(-50%);
			z-index: 2;
			font-size: 13px;
			color: rgba(255,255,255,0.92);
			text-align: center;
			width: 88%;
			line-height: 1.55;
		}

		.scan-status {
			position: absolute;
			bottom: 12%;
			left: 50%;
			transform: translateX(-50%);
			z-index: 2;
			font-size: 13px;
			color: #9ef7d1;
			text-align: center;
			width: 88%;
			min-height: 20px;
		}

		@keyframes scan-move {
			0% { transform: translateY(0); }
			50% { transform: translateY(180px); }
			100% { transform: translateY(0); }
		}
	`;
	document.head.appendChild(style);
	styleInjected = true;
}

function stopStream(stream) {
	if (!stream) return;
	stream.getTracks().forEach(track => track.stop());
}

export async function openScanModal(options = {}) {
	const mountSelector = options.mountSelector || '.phone-canvas';
	const showToast = options.showToast || (() => {});

	if (activeOverlay) {
		return;
	}

	injectStyles();

	const mountNode = document.querySelector(mountSelector) || document.body;
	const overlay = document.createElement('div');
	overlay.className = 'scan-modal';

	overlay.innerHTML = `
		<div class="scan-modal-header">
			<span>扫码识别</span>
			<button class="scan-close-btn" type="button" aria-label="关闭扫描">×</button>
		</div>
		<div class="scan-stage">
			<video class="scan-video" autoplay playsinline muted></video>
			<div class="scan-mask"></div>
			<div class="scan-frame">
				<div class="scan-line"></div>
			</div>
			<div class="scan-tip">将二维码或条码放入框内，系统将自动识别</div>
			<div class="scan-status"></div>
		</div>
	`;

	mountNode.appendChild(overlay);
	activeOverlay = overlay;

	const closeBtn = overlay.querySelector('.scan-close-btn');
	const video = overlay.querySelector('.scan-video');
	const statusEl = overlay.querySelector('.scan-status');

	let stream = null;
	let detector = null;
	let timer = null;
	let closed = false;

	const closeModal = () => {
		if (closed) return;
		closed = true;

		if (timer) {
			clearInterval(timer);
			timer = null;
		}

		stopStream(stream);
		stream = null;

		if (overlay.parentNode) {
			overlay.parentNode.removeChild(overlay);
		}

		if (activeOverlay === overlay) {
			activeOverlay = null;
		}
	};

	closeBtn.addEventListener('click', closeModal);

	try {
		stream = await navigator.mediaDevices.getUserMedia({
			video: {
				facingMode: { ideal: 'environment' },
				width: { ideal: 1280 },
				height: { ideal: 720 }
			},
			audio: false
		});

		video.srcObject = stream;
		await video.play();

		if (!('BarcodeDetector' in window)) {
			statusEl.textContent = '当前浏览器不支持自动识别，请手动对准后关闭';
			return;
		}

		detector = new BarcodeDetector({
			formats: ['qr_code', 'ean_13', 'ean_8', 'code_128', 'upc_a', 'upc_e']
		});

		timer = setInterval(async () => {
			if (closed) return;

			try {
				const results = await detector.detect(video);
				if (!results || results.length === 0) return;

				const rawValue = results[0].rawValue || '识别成功';
				statusEl.textContent = `识别成功：${rawValue}`;
				showToast(`扫码结果: ${rawValue}`);
				closeModal();
			} catch (detectError) {
				statusEl.textContent = `识别中... ${detectError.message || ''}`;
			}
		}, 500);
	} catch (error) {
		statusEl.textContent = `无法打开摄像头：${error.message}`;
	}
}

