// Use this URL to fetch NASA APOD JSON data.
const apodData = 'https://cdn.jsdelivr.net/gh/GCA-Classroom/apod/data.json';

// Simple beginner-friendly code: fetch the dataset when the user clicks the
// "Fetch Space Images" button and render up to 9 images in a 3x3 grid.

const gallery = document.getElementById('gallery');
const getImageBtn = document.getElementById('getImageBtn');
let cachedData = null;

function el(tag, className, text) {
	const e = document.createElement(tag);
	if (className) e.className = className;
	if (text) e.textContent = text;
	return e;
}

function createCard(item) {
	const card = el('article', 'card');

	// Title and date
	const header = el('div', 'card-header');
	const title = el('h3', 'card-title', item.title || 'Untitled');
	const date = el('time', 'card-date', item.date || '');
	header.appendChild(title);
	header.appendChild(date);

	// Media
	const media = el('div', 'card-media');
	const img = document.createElement('img');
	img.src = item.hdurl || item.url || '';
	img.alt = item.title || 'NASA Image';
	img.loading = 'lazy';
	media.appendChild(img);

	// Explanation / caption (shortened for gallery)
	const caption = el('p', 'card-caption', item.explanation ? (item.explanation.slice(0, 140) + (item.explanation.length > 140 ? '…' : '')) : '');

	card.appendChild(header);
	card.appendChild(media);
	card.appendChild(caption);

	// Open modal when a card is clicked
	card.addEventListener('click', (e) => {
		openModal(item);
	});

	return card;
}

function renderGallery(items) {
	gallery.innerHTML = ''; // clear existing content

	if (!items || items.length === 0) {
		const msg = el('div', 'placeholder', 'No images found.');
		gallery.appendChild(msg);
		return;
	}

	const grid = el('div', 'grid');
	// Show up to 9 images for a 3x3 grid
	const toShow = items.filter(i => !i.media_type || i.media_type === 'image').slice(0, 9);
	toShow.forEach(item => {
		const url = item.hdurl || item.url;
		if (!url) return;
		const card = createCard(item);
		grid.appendChild(card);
	});

	gallery.appendChild(grid);
}

function showLoading() {
	gallery.innerHTML = '';
	const loader = el('div', 'loading', 'Loading images…');
	gallery.appendChild(loader);
}

function showError(err) {
	console.error('Error fetching APOD data:', err);
	gallery.innerHTML = '';
	const errBox = el('div', 'error');
	errBox.textContent = 'Sorry — could not load images. Try again later.';
	gallery.appendChild(errBox);
}

async function fetchAndDisplay() {
	try {
		showLoading();
		if (!cachedData) {
			const resp = await fetch(apodData, { cache: 'reload' });
			if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
			const data = await resp.json();
			cachedData = Array.isArray(data) ? data.slice().sort((a, b) => (b.date || '').localeCompare(a.date || '')) : [];
		}

		renderGallery(cachedData);
	} catch (err) {
		showError(err);
	}
}

if (getImageBtn) {
	getImageBtn.addEventListener('click', () => {
		fetchAndDisplay();
	});
}

// Modal implementation
function openModal(item) {
	// overlay
	const overlay = el('div', 'modal-overlay');

	// modal container
	const modal = el('div', 'modal');

	// close button
	const closeBtn = el('button', 'modal-close', '×');
	closeBtn.setAttribute('aria-label', 'Close');

	// header (title + date)
	const header = el('div', 'modal-header');
	const title = el('h2', 'modal-title', item.title || 'Untitled');
	const date = el('time', 'modal-date', item.date || '');
	header.appendChild(title);
	header.appendChild(date);

	// media (large image or embedded video)
	const media = el('div', 'modal-media');
	if (item.media_type === 'video' && item.url) {
		const iframe = document.createElement('iframe');
		iframe.src = item.url;
		iframe.width = '100%';
		iframe.height = '480';
		iframe.frameBorder = '0';
		iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
		iframe.allowFullscreen = true;
		media.appendChild(iframe);
	} else {
		const img = document.createElement('img');
		img.src = item.hdurl || item.url || '';
		img.alt = item.title || 'NASA Image';
		img.loading = 'eager';
		media.appendChild(img);
	}

	// explanation
	const explanation = el('div', 'modal-explanation', item.explanation || '');

	// assemble
	modal.appendChild(closeBtn);
	modal.appendChild(header);
	modal.appendChild(media);
	modal.appendChild(explanation);
	overlay.appendChild(modal);

	// add to DOM
	document.body.appendChild(overlay);

	// small open animation
	requestAnimationFrame(() => overlay.classList.add('open'));

	// focus management: focus close button
	closeBtn.focus();

	function closeModal() {
		overlay.classList.remove('open');
		// wait for animation then remove
		setTimeout(() => {
			if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
		}, 200);
		document.removeEventListener('keydown', onKeyDown);
	}

	function onKeyDown(e) {
		if (e.key === 'Escape') closeModal();
	}

	// close handlers
	closeBtn.addEventListener('click', closeModal);
	overlay.addEventListener('click', (ev) => {
		if (ev.target === overlay) closeModal();
	});
	document.addEventListener('keydown', onKeyDown);
}
