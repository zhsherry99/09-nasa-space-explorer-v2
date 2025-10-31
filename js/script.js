// Use this URL to fetch NASA APOD JSON data.
const apodData = 'https://cdn.jsdelivr.net/gh/GCA-Classroom/apod/data.json';

// Simple beginner-friendly code: fetch the dataset when the user clicks the
// "Fetch Space Images" button and render up to 9 images in a 3x3 grid.

const gallery = document.getElementById('gallery');
const getImageBtn = document.getElementById('getImageBtn');
const startDateInput = document.getElementById('startDate');
const endDateInput = document.getElementById('endDate');
let cachedData = null;

// "Did You Know?" facts: pick one at random on each page load
const didYouKnowText = document.getElementById('didYouKnowText');
const spaceFacts = [
	'A day on Venus is longer than a year on Venus — it rotates very slowly.',
	'There are more stars in the observable universe than grains of sand on all Earth\'s beaches.',
	'Neutron stars can spin hundreds of times per second and are so dense a teaspoon would weigh billions of tons.',
	'A spoonful of a white dwarf would weigh about a million tons on Earth.',
	'Saturn could float in water because it\'s mostly made of gas and is less dense than water.',
	'Jupiter\'s Great Red Spot is a storm larger than Earth that has been raging for centuries.',
	'Space is not completely empty — it contains tiny amounts of gas, dust, and cosmic rays.',
	'The footprints left on the Moon will likely remain for millions of years because there is no wind to erase them.'
];

function showRandomFact() {
	try {
		if (!didYouKnowText) return;
		const fact = spaceFacts[Math.floor(Math.random() * spaceFacts.length)];
		didYouKnowText.textContent = fact;
	} catch (e) {
		// no-op on errors — facts are optional
	}
}

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
		// When user clicks fetch, apply the selected date range
		displayRange();
	});
}

// Filter items by inclusive date range. Dates use YYYY-MM-DD so string compare works.
function filterByRange(items, start, end) {
	if (!items) return [];
	if (!start && !end) return items;
	return items.filter(item => {
		const d = item.date || '';
		if (!d) return false;
		if (start && d < start) return false;
		if (end && d > end) return false;
		return true;
	});
}

// Validate date inputs (YYYY-MM-DD). Returns {ok, message}
function validateRange(start, end) {
	if (start && end && start > end) return { ok: false, message: 'Start date must be before or equal to end date.' };
	return { ok: true };
}

// Main: load data (cached), apply date filter, and render
async function displayRange() {
	const start = startDateInput && startDateInput.value ? startDateInput.value : '';
	const end = endDateInput && endDateInput.value ? endDateInput.value : '';

	const valid = validateRange(start, end);
	if (!valid.ok) {
		showError(valid.message);
		return;
	}

	try {
		showLoading();
		if (!cachedData) await fetchAndDisplay();
		const filtered = filterByRange(cachedData, start, end);
		renderGallery(filtered);
	} catch (err) {
		showError(err.message || err);
	}
}

// Auto-update when the user changes dates
if (startDateInput) startDateInput.addEventListener('change', () => displayRange());
if (endDateInput) endDateInput.addEventListener('change', () => displayRange());

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

	// Show a random "Did You Know?" fact on initial load
	showRandomFact();
