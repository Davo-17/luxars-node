/* ============================================================
   LUXARS — LIQUID GLASS SCRIPT
   ============================================================ */

// ----- Mock Data -----
let photographers = [];

// Carga los fotografos desde el backend (fallback: vacio si no responde)
async function loadPhotographers() {
  try {
    const res = await fetch('/api/photographers');
    if (res.ok) photographers = await res.json();
  } catch (err) {
    console.error('[LuxArs] No se pudieron cargar los fotografos', err);
  }
}

// ----- Render helpers -----
function createCard(photographer) {
  const hasPromo = photographer.id === 2 || photographer.id === 4 || photographer.id === 5;
  return `
    <article class="card photographer-card" data-id="${photographer.id}">
      ${hasPromo ? '<div class="promo-badge"></div>' : ''}
      <div class="card__img" style="background-image: url('${photographer.portfolio[0]}');"></div>
      <div class="card_link" role="button" tabindex="0">
        <div class="card__img--hover" style="background-image: url('${photographer.portfolio[0]}');"></div>
      </div>
      <div class="card__info">
        <div class="card__info-header">
          <span class="card__category"><i class="fas fa-camera"></i> ${photographer.specialty}</span>
          <div class="card__rating">
            ${'<i class="fas fa-star"></i>'.repeat(Math.floor(photographer.rating))}
            ${photographer.rating % 1 >= 0.5 ? '<i class="fas fa-star-half-alt"></i>' : ''}
            <span>${photographer.rating}</span>
          </div>
        </div>
        <h3 class="card__title">${photographer.name}</h3>
        <div class="card__by">
          <span class="card__price">Desde $${photographer.price}.000 COP</span>
        </div>
        <div class="card__actions">
          <button class="btn btn-primary view-profile"><i class="fas fa-user"></i> Ver perfil</button>
          <button class="btn btn-outline book-now"><i class="fas fa-calendar-plus"></i> Reservar</button>
        </div>
      </div>
    </article>
  `;
}

// ----- Blob Button Initializer -----
function initBlobButtons() {
  document.querySelectorAll('.btn:not(.blob-initialized)').forEach(btn => {
    btn.classList.add('blob-initialized');
    const inner = btn.innerHTML;
    btn.innerHTML = `
      <span class="btn-text">${inner}</span>
      <span class="blob-btn__inner">
        <span class="blob-btn__blobs">
          <span class="blob-btn__blob"></span>
          <span class="blob-btn__blob"></span>
          <span class="blob-btn__blob"></span>
          <span class="blob-btn__blob"></span>
        </span>
      </span>
    `;
  });
}

function renderGrid(containerId, data) {
  const grid = document.getElementById(containerId);
  if (!grid) return;
  grid.innerHTML = data.map(createCard).join('');
  initBlobButtons();
}

// ----- Navigation -----
const navLinks = document.querySelectorAll('[data-page]');
const pages = document.querySelectorAll('.page');
const hamburger = document.getElementById('hamburger');
const navPanel = document.getElementById('navPanel');
const navPanelClose = document.getElementById('navPanelClose');

const ACCESS_RULES = {
  reservas: { auth: true, roles: null, msg: 'Debes iniciar sesión para acceder a Reservas.' },
  portafolio: { auth: true, roles: ['photographer', 'admin'], msg: 'Solo fotógrafos pueden acceder a Portafolio. Inicia sesión como fotógrafo.' },
};

function hasAccess(page) {
  const rule = ACCESS_RULES[page];
  if (!rule) return true;
  if (!rule.auth) return true;
  if (!currentUser) return false;
  if (rule.roles && !rule.roles.includes(currentUser.role)) return false;
  return true;
}

function showAccessModal(msg) {
  const modal = document.getElementById('accessModal');
  const msgEl = document.getElementById('accessModalMsg');
  if (modal && msgEl) {
    msgEl.textContent = msg;
    modal.style.display = 'flex';
  }
}

function closeAccessModal() {
  const modal = document.getElementById('accessModal');
  if (modal) modal.style.display = 'none';
}

function navigateTo(pageId, pushHistory) {
  if (pageId !== 'auth' && !hasAccess(pageId)) {
    const rule = ACCESS_RULES[pageId];
    showAccessModal(rule ? rule.msg : 'Acceso denegado.');
    return;
  }
  pages.forEach(p => p.classList.remove('active'));
  const target = document.getElementById(`page-${pageId}`);
  if (target) target.classList.add('active');

  navLinks.forEach(l => l.classList.remove('active'));
  document.querySelectorAll(`[data-page="${pageId}"]`).forEach(l => l.classList.add('active'));

  navPanel.classList.remove('open');
  hamburger.classList.remove('active');
  document.getElementById('navbar').removeAttribute('data-panel-open');

  if (pushHistory !== false) {
    history.pushState({ page: pageId }, '', '#' + pageId);
  }
  if (pageId === 'reservas' && window.MONGODB_ENABLED) {
    loadMyReservations();
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ----- Smooth scroll to landing section -----
function scrollToSection(sectionId, pushHistory) {
  const el = document.getElementById(sectionId);
  if (!el) return;
  // Ensure we're on the home page
  const homePage = document.getElementById('page-home');
  if (homePage && !homePage.classList.contains('active')) {
    pages.forEach(p => p.classList.remove('active'));
    homePage.classList.add('active');
    navLinks.forEach(l => l.classList.remove('active'));
    document.querySelectorAll('[data-page="home"]').forEach(l => l.classList.add('active'));
  }
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });

  if (pushHistory !== false) {
    history.pushState({ section: sectionId }, '', '#' + sectionId);
  }

  navLinks.forEach(l => l.classList.remove('active'));
  document.querySelectorAll(`[data-section="${sectionId}"]`).forEach(l => l.classList.add('active'));
  document.querySelectorAll(`[data-page="home"]`).forEach(l => l.classList.add('active'));

  navPanel.classList.remove('open');
  hamburger.classList.remove('active');
  document.getElementById('navbar').removeAttribute('data-panel-open');
}

// Handle popstate for browser back/forward
window.addEventListener('popstate', (e) => {
  const state = e.state;
  if (state && state.page) {
    navigateTo(state.page, false);
    // scrollTo top is handled inside navigateTo
  } else if (state && state.section) {
    const el = document.getElementById(state.section);
    if (el) {
      // Ensure home page is active
      const homePage = document.getElementById('page-home');
      if (homePage && !homePage.classList.contains('active')) {
        pages.forEach(p => p.classList.remove('active'));
        homePage.classList.add('active');
        navLinks.forEach(l => l.classList.remove('active'));
        document.querySelectorAll('[data-page="home"]').forEach(l => l.classList.add('active'));
      }
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  } else {
    // No state — go to home top
    const homePage = document.getElementById('page-home');
    if (homePage && !homePage.classList.contains('active')) {
      pages.forEach(p => p.classList.remove('active'));
      homePage.classList.add('active');
      navLinks.forEach(l => l.classList.remove('active'));
      document.querySelectorAll('[data-page="home"]').forEach(l => l.classList.add('active'));
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

// Bind clicks on both data-page and data-section nav links
document.querySelectorAll('[data-page], [data-section]').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const section = link.dataset.section;
    if (section) {
      scrollToSection(section);
      return;
    }
    const page = link.dataset.page;
    if (page === 'auth') {
      document.querySelector('.auth-tab[data-tab="login"]').click();
    }
    navigateTo(page);
    hamburger.classList.remove('active');
    navPanel.classList.remove('open');
  });
});

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('active');
  navPanel.classList.toggle('open');
  if (navPanel.classList.contains('open')) {
    document.getElementById('navbar').setAttribute('data-panel-open', '');
  } else {
    document.getElementById('navbar').removeAttribute('data-panel-open');
  }
});

navPanelClose.addEventListener('click', () => {
  hamburger.classList.remove('active');
  navPanel.classList.remove('open');
  document.getElementById('navbar').removeAttribute('data-panel-open');
});

document.getElementById('accessModalClose')?.addEventListener('click', closeAccessModal);
document.getElementById('accessModal')?.addEventListener('click', function (e) {
  if (e.target === this || e.target.classList.contains('access-modal-backdrop')) closeAccessModal();
});

// Close panel on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && navPanel.classList.contains('open')) {
    hamburger.classList.remove('active');
    navPanel.classList.remove('open');
    document.getElementById('navbar').removeAttribute('data-panel-open');
  }
});

// Close panel on backdrop click
navPanel.addEventListener('click', (e) => {
  if (e.target === navPanel) {
    hamburger.classList.remove('active');
    navPanel.classList.remove('open');
    document.getElementById('navbar').removeAttribute('data-panel-open');
  }
});

// ----- Category card clicks -----
document.querySelectorAll('.category-card').forEach(card => {
  card.addEventListener('click', function (e) {
    e.preventDefault();
    navigateTo('catalog');
    const filter = document.getElementById('filterSpecialty');
    if (filter) { filter.value = this.dataset.filter; applyFilters(); }
    document.getElementById('clearFilterBtn').style.display = 'none';
  });
});

// ----- Touch card toggle (show actions on tap) -----
if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
  document.addEventListener('click', function (e) {
    const card = e.target.closest('.card');
    if (!card || e.target.closest('.card__actions, a, button')) return;
    document.querySelectorAll('.card.card-tapped').forEach(c => {
      if (c !== card) c.classList.remove('card-tapped');
    });
    card.classList.toggle('card-tapped');
  });
}

// ----- Catalog filters -----
function applyFilters() {
  const specialty = document.getElementById('filterSpecialty').value;
  const maxPrice = parseInt(document.getElementById('filterPrice').value);

  let filtered = photographers;
  if (specialty) filtered = filtered.filter(p => p.specialty === specialty);
  filtered = filtered.filter(p => p.price <= maxPrice);

  renderGrid('catalogGrid', filtered);
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('clearFilterBtn').style.display = specialty ? 'inline-flex' : 'none';
}

function clearFilters() {
  document.getElementById('filterSpecialty').value = '';
  document.getElementById('filterPrice').value = 500;
  document.getElementById('priceValue').textContent = '500';
  applyFilters();
}

document.getElementById('applyFilters').addEventListener('click', applyFilters);
document.getElementById('clearFilterBtn').addEventListener('click', clearFilters);

document.getElementById('filterPrice').addEventListener('input', function () {
  document.getElementById('priceValue').textContent = this.value;
});

// Sidebar toggle (mobile)
document.getElementById('sidebarToggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.add('open');
});
// Close sidebar: X button or backdrop click
document.getElementById('sidebar').addEventListener('click', function (e) {
  if (e.target === this || e.target.closest('.sidebar-close')) {
    this.classList.remove('open');
  }
});

// ----- Profile view -----
document.addEventListener('click', e => {
  const card = e.target.closest('.photographer-card');
  if (!card) return;

  // Book-now button → dashboard
  if (e.target.closest('.book-now')) {
    navigateTo('dashboard');
    return;
  }

  // Any click on the card opens the profile (except .card__actions buttons)
  if (e.target.closest('.card__actions')) return;

  const id = parseInt(card.dataset.id);
  const p = photographers.find(x => x.id === id);
  if (!p) return;

  const gallery = p.portfolio.map(url =>
    `<img src="${url}" alt="Portfolio" />`
  ).join('');

  document.getElementById('profileContent').innerHTML = `
    <div class="glass-card profile-header">
      <img class="avatar" src="${p.avatar}" alt="${p.name}" />
      <div class="info">
        <h1>${p.name}</h1>
        <div class="meta">
          <span><i class="fas fa-camera"></i> ${p.specialty}</span>
          <span><i class="fas fa-map-marker-alt"></i> ${p.location}</span>
          <span><i class="fas fa-briefcase"></i> ${p.experience}</span>
          <span><i class="fas fa-star" style="color:#FF0000"></i> ${p.rating}</span>
        </div>
        <p style="color:var(--text-secondary);margin-top:8px;">${p.bio}</p>
      </div>
    </div>
    <div class="glass-card">
      <h3 style="margin-bottom:16px;"><i class="fas fa-images"></i> Portafolio</h3>
      <div class="profile-gallery">${gallery}</div>
    </div>
    <div class="glass-card profile-details">
      <div>
        <h3>Detalles del servicio</h3>
        <div class="detail-item"><h4>Precio desde</h4><p style="font-size:1.4rem;font-weight:700;color:#FF0000;">$${p.price}.000 COP</p></div>
        <div class="detail-item"><h4>Tiempo de entrega</h4><p>${p.deliveries}</p></div>
        <div class="detail-item"><h4>Ubicación</h4><p>${p.location}, Valle de Aburrá</p></div>
      </div>
      <div>
        <h3>Disponibilidad</h3>
        <div class="detail-item">
          <p style="color:var(--text-secondary);margin-bottom:12px;">Selecciona una fecha para verificar disponibilidad:</p>
          <input type="date" style="width:100%;padding:12px 16px;border-radius:var(--radius-sm);background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:var(--text-primary);outline:none;" />
          <button class="btn btn-primary" style="margin-top:12px;width:100%;justify-content:center;" onclick="navigateTo('dashboard')">
            <i class="fas fa-calendar-check"></i> Solicitar reserva
          </button>
        </div>
      </div>
    </div>
  `;

  navigateTo('profile');
  initBlobButtons();
});

// Back button
document.getElementById('backToCatalog').addEventListener('click', () => {
  navigateTo('catalog');
  initBlobButtons();
});

// ----- Auth tabs -----
document.querySelectorAll('.auth-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    document.getElementById(`auth-${tab.dataset.tab}`).classList.add('active');
  });
});

document.querySelectorAll('.auth-alt a').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const tab = link.dataset.tab;
    document.querySelector(`.auth-tab[data-tab="${tab}"]`).click();
  });
});

// ----- Quote form -----
document.getElementById('quoteForm').addEventListener('submit', e => {
  e.preventDefault();
  luxAlert('Solicitud de cotización enviada con éxito. El fotógrafo te contactará pronto.', { type: 'success', title: 'Solicitud enviada' });
});

// ----- Scroll navbar effect -----
window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 60);
});

// ----- Carousel auto-slide -----
(function initCarousel() {
  const track = document.querySelector('.carousel-track');
  if (!track) return;
  const slides = track.querySelectorAll('.carousel-slide');
  const dotsContainer = document.querySelector('.carousel-dots');
  let current = 0;
  const total = slides.length;
  let interval;

  // Create dots
  slides.forEach((_, i) => {
    const dot = document.createElement('span');
    if (i === 0) dot.classList.add('active');
    dot.addEventListener('click', () => goTo(i));
    dotsContainer.appendChild(dot);
  });

  function goTo(index) {
    slides[current].classList.remove('active');
    dotsContainer.children[current].classList.remove('active');
    current = (index + total) % total;
    slides[current].classList.add('active');
    dotsContainer.children[current].classList.add('active');
  }

  function next() { goTo(current + 1); }

  function startAuto() { interval = setInterval(next, 4000); }
  function stopAuto() { clearInterval(interval); }

  // Pause on hover
  const carousel = document.querySelector('.carousel');
  carousel.addEventListener('mouseenter', stopAuto);
  carousel.addEventListener('mouseleave', startAuto);

  startAuto();
})();

// ----- Booking System (Reservas Module) -----
const occupiedSlots = [
  { photographerId: 1, date: '2026-05-15', time: '14:00' },
  { photographerId: 3, date: '2026-05-20', time: '10:00' },
  { photographerId: 2, date: '2026-06-01', time: '16:00' }
];
let myReservations = [];
let pendingBooking = null;
let bookingIdCounter = 100;

async function bookingApi(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (supabaseClient) {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session && session.access_token) {
      headers.Authorization = 'Bearer ' + session.access_token;
    }
  } else if (currentUser) {
    headers['x-demo-user'] = currentUser.email;
  }

  const response = await fetch('/api/bookings' + path, { ...options, headers });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'No se pudo completar la solicitud.');
  return result;
}

async function loadMyReservations() {
  try {
    const result = await bookingApi('/mine');
    myReservations = result.bookings;
    renderMyReservations();
  } catch (error) {
    luxAlert(error.message, { title: 'No se pudieron cargar las reservas' });
  }
}

function sanitizeInput(str) {
  if (!str) return '';
  return String(str).replace(/[<>"';&\\]/g, '').trim();
}

function detectSQLInjection(str) {
  const sqlPatterns = /('|--|;|\bDROP\b|\bDELETE\b|\bINSERT\b|\bUPDATE\b|\bUNION\b|\bSELECT\b|\bOR\b|\bAND\b|\bEXEC\b|\bxp_)/i;
  return sqlPatterns.test(str);
}

// ----- Custom DatePicker & TimePicker -----
const DIAS_LABEL = ['Do','Lu','Ma','Mi','Ju','Vi','Sa'];
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
let pickerDate = new Date();
let selectedDate = null;
let selectedHour = null;
let selectedMinute = null;

function initCustomPickers() {
  const trigger = document.getElementById('datepickerTrigger');
  if (!trigger) return;

  // --- DatePicker ---
  renderDatePickerGrid();

  document.getElementById('datepickerTrigger').addEventListener('click', function (e) {
    e.stopPropagation();
    const pop = document.getElementById('datepickerPopover');
    const isOpen = pop.classList.contains('open');
    closeAllPickers();
    if (!isOpen) pop.classList.add('open');
  });

  document.querySelectorAll('.datepicker-nav-btn').forEach(btn => {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      const dir = parseInt(this.dataset.dir);
      pickerDate = new Date(pickerDate.getFullYear(), pickerDate.getMonth() + dir, 1);
      renderDatePickerGrid();
    });
  });

  // --- TimePicker ---
  renderTimePickerLists();

  document.getElementById('timepickerTrigger').addEventListener('click', function (e) {
    e.stopPropagation();
    const pop = document.getElementById('timepickerPopover');
    const isOpen = pop.classList.contains('open');
    closeAllPickers();
    if (!isOpen) pop.classList.add('open');
  });

  // Close on outside click
  document.addEventListener('click', closeAllPickers);
}

function closeAllPickers() {
  document.getElementById('datepickerPopover')?.classList.remove('open');
  document.getElementById('timepickerPopover')?.classList.remove('open');
}

function renderDatePickerGrid() {
  const year = pickerDate.getFullYear();
  const month = pickerDate.getMonth();

  document.getElementById('datepickerMonthYear').textContent = MESES[month] + ' ' + year;

  const grid = document.getElementById('datepickerGrid');
  grid.innerHTML = '';

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysPrevMonth = new Date(year, month, 0).getDate();

  const cells = [];
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: daysPrevMonth - i, other: true, offset: -1 });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, other: false, offset: 0 });
  let next = 1;
  while (cells.length % 7 !== 0) cells.push({ day: next++, other: true, offset: 1 });

  cells.forEach(cell => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'datepicker-day';
    btn.textContent = cell.day;
    if (cell.other) btn.classList.add('other-month');

    const fecha = new Date(year, month + cell.offset, cell.day);
    if (selectedDate && fecha.toDateString() === selectedDate.toDateString()) {
      btn.classList.add('selected');
    }
    const today = new Date();
    if (fecha.toDateString() === today.toDateString()) btn.classList.add('today');

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      selectedDate = fecha;
      const dd = String(fecha.getDate()).padStart(2,'0');
      const mm = String(fecha.getMonth()+1).padStart(2,'0');
      const yyyy = fecha.getFullYear();
      document.getElementById('bookDate').value = `${yyyy}-${mm}-${dd}`;
      document.getElementById('datepickerText').textContent = `${dd}/${mm}/${yyyy}`;
      document.getElementById('datepickerPopover').classList.remove('open');
      renderDatePickerGrid();
    });

    grid.appendChild(btn);
  });
}

function renderTimePickerLists() {
  const hoursContainer = document.getElementById('timepickerHours');
  const minsContainer = document.getElementById('timepickerMinutes');
  if (!hoursContainer) return;

  hoursContainer.innerHTML = '';
  minsContainer.innerHTML = '';

  for (let h = 6; h <= 22; h++) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = String(h).padStart(2,'0') + ':00';
    if (selectedHour === h) btn.classList.add('selected');
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      selectedHour = h;
      updateTimeValue();
      document.getElementById('timepickerHours').querySelectorAll('button').forEach(b => b.classList.remove('selected'));
      this.classList.add('selected');
    });
    hoursContainer.appendChild(btn);
  }

  for (let m = 0; m < 60; m += 5) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = ':' + String(m).padStart(2,'0');
    if (selectedMinute === m) btn.classList.add('selected');
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      selectedMinute = m;
      updateTimeValue();
      document.getElementById('timepickerMinutes').querySelectorAll('button').forEach(b => b.classList.remove('selected'));
      this.classList.add('selected');
    });
    minsContainer.appendChild(btn);
  }
}

function updateTimeValue() {
  if (selectedHour === null || selectedMinute === null) return;
  const timeStr = String(selectedHour).padStart(2,'0') + ':' + String(selectedMinute).padStart(2,'0');
  document.getElementById('bookTime').value = timeStr;
  document.getElementById('timepickerText').textContent = timeStr;
  document.getElementById('timepickerPopover').classList.remove('open');
}

function initBookingSystem() {
  const container = document.getElementById('photographerSelector');
  if (!container) return;

  // Render photographer mini-card grid
  photographers.forEach(p => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'photo-option';
    card.dataset.id = p.id;
    card.innerHTML = `
      <img src="${p.avatar}" alt="${p.name}" />
      <strong>${p.name}</strong>
      <span>${p.specialty}</span>
    `;
    card.addEventListener('click', () => selectPhotographer(p.id));
    container.appendChild(card);
  });

  document.getElementById('bookingForm').addEventListener('submit', handleBookingSubmit);
  document.getElementById('btnConfirmPayment').addEventListener('click', handleConfirmPayment);
  document.getElementById('btnCancelPayment').addEventListener('click', () => {
    document.getElementById('paymentStep').style.display = 'none';
    document.getElementById('bookingForm').style.display = 'block';
  });
}

function selectPhotographer(id) {
  const prev = document.querySelector('.photo-option.selected');
  if (prev) prev.classList.remove('selected');
  const card = document.querySelector(`.photo-option[data-id="${id}"]`);
  if (card) card.classList.add('selected');
  document.getElementById('bookPhotographer').value = id;

  const p = photographers.find(x => x.id === id);
  if (!p) return;

  const preview = document.getElementById('photographerPreview');
  preview.style.display = 'flex';
  const stars = '<i class="fas fa-star" style="color:#FF0000"></i>'.repeat(Math.floor(p.rating));
  preview.innerHTML = `
    <img src="${p.avatar}" alt="${p.name}" />
    <div class="preview-info">
      <h4>${p.name}</h4>
      <div class="preview-meta">
        <span><i class="fas fa-camera"></i> ${p.specialty}</span>
        <span><i class="fas fa-map-marker-alt"></i> ${p.location}</span>
        <span><i class="fas fa-briefcase"></i> ${p.experience}</span>
        <span>${stars} ${p.rating}</span>
      </div>
      <p>${p.bio}</p>
    </div>
  `;
}

function handleBookingSubmit(e) {
  e.preventDefault();
  const feedback = document.getElementById('bookingFeedback');
  feedback.className = 'booking-feedback';
  feedback.style.display = 'none';

  const photographerId = parseInt(document.getElementById('bookPhotographer').value);
  const dateStr = document.getElementById('bookDate').value;
  const timeStr = document.getElementById('bookTime').value;
  const eventType = document.getElementById('bookEventType').value;
  const location = document.getElementById('bookLocation').value;
  const notes = document.getElementById('bookNotes').value;

  // --- Validation ---

  // Required fields
  if (!photographerId || !dateStr || !timeStr || !eventType || !location) {
    feedback.textContent = '⚠️ Todos los campos obligatorios deben completarse.';
    feedback.className = 'booking-feedback error';
    feedback.style.display = 'block';
    return;
  }

  // Sanitize inputs
  const sanitizedLocation = sanitizeInput(location);
  const sanitizedNotes = sanitizeInput(notes);

  // SQL Injection detection
  if (detectSQLInjection(sanitizedLocation) || detectSQLInjection(sanitizedNotes) || detectSQLInjection(eventType)) {
    feedback.textContent = '🚫 Datos inválidos detectados. Por favor ingresa información válida.';
    feedback.className = 'booking-feedback error';
    feedback.style.display = 'block';
    return;
  }

  // Validate date/time format (no letters)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const timeRegex = /^\d{2}:\d{2}$/;
  if (!dateRegex.test(dateStr)) {
    feedback.textContent = '⚠️ La fecha contiene caracteres inválidos. Usa el formato AAAA-MM-DD.';
    feedback.className = 'booking-feedback error';
    feedback.style.display = 'block';
    return;
  }
  if (!timeRegex.test(timeStr)) {
    feedback.textContent = '⚠️ La hora contiene caracteres inválidos. Usa el formato HH:MM.';
    feedback.className = 'booking-feedback error';
    feedback.style.display = 'block';
    return;
  }

  // Year validation: must be current year
  const currentYear = new Date().getFullYear();
  const year = parseInt(dateStr.split('-')[0]);
  if (year !== currentYear) {
    feedback.textContent = `⚠️ Solo se permiten reservas en el año actual (${currentYear}). El año ingresado es ${year}.`;
    feedback.className = 'booking-feedback error';
    feedback.style.display = 'block';
    return;
  }

  const selectedDate = new Date(dateStr + 'T' + timeStr);
  const now = new Date();

  // Past date validation
  if (selectedDate < now) {
    feedback.textContent = '⚠️ No puedes reservar una fecha u hora anterior al momento actual.';
    feedback.className = 'booking-feedback error';
    feedback.style.display = 'block';
    return;
  }

  // Same date+time as current moment
  const diffMs = Math.abs(selectedDate - now);
  if (diffMs < 60000) {
    feedback.textContent = '⚠️ No puedes reservar para el mismo minuto en que realizas la reserva. Elige otro horario.';
    feedback.className = 'booking-feedback error';
    feedback.style.display = 'block';
    return;
  }

  // CP001: Check availability (occupied slot)
  const isOccupied = !window.MONGODB_ENABLED && occupiedSlots.some(s =>
    s.photographerId === photographerId && s.date === dateStr && s.time === timeStr
  );
  if (isOccupied) {
    feedback.textContent = '⚠️ Este horario ya no se encuentra disponible. Por favor selecciona otra fecha u horario.';
    feedback.className = 'booking-feedback error';
    feedback.style.display = 'block';
    return;
  }

  // CP001: Check against own reservations
  const ownOccupied = !window.MONGODB_ENABLED && myReservations.some(r =>
    r.photographerId === photographerId && r.date === dateStr && r.time === timeStr && r.status !== 'Cancelada'
  );
  if (ownOccupied) {
    feedback.textContent = '⚠️ Ya tienes una reserva activa en este horario con este fotógrafo.';
    feedback.className = 'booking-feedback error';
    feedback.style.display = 'block';
    return;
  }

  // All validations passed → proceed to payment (CP003)
  const photographer = photographers.find(p => p.id === photographerId);
  pendingBooking = {
    photographerId, photographerName: photographer.name,
    photographerAvatar: photographer.avatar, photographerSpecialty: photographer.specialty,
    date: dateStr, time: timeStr, eventType, location: sanitizedLocation,
    notes: sanitizedNotes, price: photographer.price
  };

  showPaymentStep(pendingBooking);
}

function showPaymentStep(booking) {
  document.getElementById('bookingForm').style.display = 'none';
  document.getElementById('bookingFeedback').style.display = 'none';

  const details = document.getElementById('paymentDetails');
  details.innerHTML = `
    <div class="payment-detail-item"><span>Fotógrafo</span><span><strong>${booking.photographerName}</strong></span></div>
    <div class="payment-detail-item"><span>Servicio</span><span>${booking.eventType}</span></div>
    <div class="payment-detail-item"><span>Fecha</span><span>${booking.date}</span></div>
    <div class="payment-detail-item"><span>Hora</span><span>${booking.time}</span></div>
    <div class="payment-detail-item"><span>Ubicación</span><span>${booking.location}</span></div>
    <div class="payment-detail-item"><span>Notas</span><span>${booking.notes || '—'}</span></div>
    <div class="payment-detail-item" style="border-bottom:none;font-weight:700;">
      <span>Total</span><span style="color:var(--accent-red);font-size:1.1rem;">$${booking.price}.000 COP</span>
    </div>
  `;

  document.getElementById('paymentStep').style.display = 'block';
  document.getElementById('paymentStep').scrollIntoView({ behavior: 'smooth' });
}

async function handleConfirmPayment() {
  if (!pendingBooking) return;
  const feedback = document.getElementById('bookingFeedback');

  if (window.MONGODB_ENABLED) {
    try {
      const result = await bookingApi('', {
        method: 'POST',
        body: JSON.stringify(pendingBooking)
      });
      myReservations.unshift(result.booking);
      document.getElementById('paymentStep').style.display = 'none';
      document.getElementById('bookingForm').style.display = 'block';
      document.getElementById('bookingForm').reset();
      feedback.textContent = '✅ ¡Reserva confirmada con éxito! Revisa los detalles en "Mis reservas".';
      feedback.className = 'booking-feedback success';
      feedback.style.display = 'block';
      renderMyReservations();
      pendingBooking = null;
      feedback.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      feedback.textContent = error.message;
      feedback.className = 'booking-feedback error';
      feedback.style.display = 'block';
    }
    return;
  }

  bookingIdCounter++;
  const id = 'RES-' + bookingIdCounter;

  const reservation = {
    id,
    ...pendingBooking,
    status: 'Confirmada',
    createdAt: new Date().toISOString()
  };

  myReservations.unshift(reservation);

  // Block the slot
  occupiedSlots.push({
    photographerId: reservation.photographerId,
    date: reservation.date,
    time: reservation.time
  });

  document.getElementById('paymentStep').style.display = 'none';
  document.getElementById('bookingForm').style.display = 'block';
  document.getElementById('bookingForm').reset();

  feedback.textContent = '✅ ¡Reserva confirmada con éxito! Revisa los detalles en "Mis reservas".';
  feedback.className = 'booking-feedback success';
  feedback.style.display = 'block';

  renderMyReservations();
  pendingBooking = null;

  feedback.scrollIntoView({ behavior: 'smooth' });
}

function renderMyReservations() {
  const container = document.getElementById('reservasListContainer');
  const stats = document.getElementById('reservasStatsMini');

  const active = myReservations.filter(r => r.status === 'Confirmada').length;
  const pending = myReservations.filter(r => r.status === 'Pendiente').length;
  const canceled = myReservations.filter(r => r.status === 'Cancelada').length;

  stats.innerHTML = `
    <span><strong>${active}</strong> Activas</span>
    <span><strong>${pending}</strong> Pendientes</span>
    <span><strong>${canceled}</strong> Canceladas</span>
  `;

  if (myReservations.length === 0) {
    container.innerHTML = `
      <div class="reservas-empty">
        <i class="fas fa-calendar"></i>
        <p>Aún no tienes reservas. Usa el formulario para agendar tu primera sesión.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = myReservations.map(r => {
    const statusClass = r.status === 'Confirmada' ? 'confirmed' : r.status === 'Cancelada' ? 'pending' : 'pending';
    return `
      <div class="reservas-item" data-res-id="${r.id}">
        <img src="${r.photographerAvatar}" alt="" />
        <div class="reservas-item-info">
          <strong>${r.photographerName}</strong>
          <span>${r.eventType} · ${r.date} a las ${r.time} · ${r.location}</span>
        </div>
        <span class="status-badge ${statusClass}">${r.status}</span>
        <div class="reservas-item-actions">
          ${r.status !== 'Cancelada' ? `<button class="btn-cancel" data-res-id="${r.id}">Cancelar</button>` : ''}
        </div>
      </div>
    `;
  }).join('');

  // CP002: Cancel handler
  container.querySelectorAll('.btn-cancel').forEach(btn => {
  btn.addEventListener('click', async function () {
      const resId = this.dataset.resId;
      const res = myReservations.find(r => r.id === resId);
      if (!res) return;

      if (!confirm('¿Estás seguro de cancelar esta reserva?')) return;

    if (window.MONGODB_ENABLED) {
      try {
        const result = await bookingApi('/' + encodeURIComponent(resId) + '/cancel', {
          method: 'POST'
        });
        const index = myReservations.findIndex(r => r.id === resId);
        if (index !== -1) myReservations[index] = result.booking;
        renderMyReservations();
      } catch (error) {
        luxAlert(error.message, { title: 'No se pudo cancelar la reserva' });
      }
      return;
    }

    res.status = 'Cancelada';

      // CP002: Free the slot in occupiedSlots
      const idx = occupiedSlots.findIndex(s =>
        s.photographerId === res.photographerId && s.date === res.date && s.time === res.time
      );
      if (idx !== -1) occupiedSlots.splice(idx, 1);

      renderMyReservations();
    });
  });
}
// ----- Lux Alert (custom modal) -----
function luxAlert(message, opts = {}) {
  const overlay = document.getElementById('luxAlert');
  const icon = document.getElementById('luxAlertIcon');
  const kicker = document.getElementById('luxAlertKicker');
  const title = document.getElementById('luxAlertTitle');
  const msg = document.getElementById('luxAlertMessage');
  if (!overlay) return;

  const o = Object.assign({ type: 'error', title: 'Aviso' }, opts);
  const icons = {
    error: '<i class="fas fa-exclamation"></i>',
    success: '<i class="fas fa-check"></i>',
    info: '<i class="fas fa-info"></i>'
  };
  const kickers = {
    error: 'Lo sentimos',
    success: 'Excelente',
    info: 'Aviso'
  };

  icon.className = 'lux-alert-icon ' + o.type;
  icon.innerHTML = icons[o.type];
  kicker.textContent = kickers[o.type];
  title.textContent = o.title;
  msg.textContent = message;

  overlay.classList.add('show');
  overlay.setAttribute('aria-hidden', 'false');
}

function closeLuxAlert() {
  const overlay = document.getElementById('luxAlert');
  if (!overlay) return;
  overlay.classList.remove('show');
  overlay.setAttribute('aria-hidden', 'true');
}

document.getElementById('luxAlertClose')?.addEventListener('click', closeLuxAlert);
document.getElementById('luxAlert')?.addEventListener('click', function (e) {
  if (e.target === this) closeLuxAlert();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeLuxAlert();
});

// ----- Session System / Supabase Auth -----
const SUPABASE_CONFIGURED = !!(window.SUPABASE_URL && window.SUPABASE_ANON_KEY);
let supabaseClient = null;
if (SUPABASE_CONFIGURED && window.supabase) {
  supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
}

// Usuarios demo (solo cuando NO hay Supabase configurado)
const APP_USERS = [
  { email: 'admin@luxars.com', pass: 'admin123', role: 'admin', name: 'Admin LuxArs', avatar: 'https://i.pravatar.cc/100?img=68' },
  { email: 'foto@luxars.com', pass: 'foto123', role: 'photographer', name: 'Fotógrafo Test', avatar: 'https://i.pravatar.cc/100?img=55' }
];
let currentUser = null;

function saveSession(user) {
  currentUser = user;
  localStorage.setItem('luxars_session', JSON.stringify(user));
  updateNavbarUI();
}

async function fetchProfile(sessionUser) {
  if (!supabaseClient) return null;
  const { data } = await supabaseClient
    .from('profiles')
    .select('name, role, avatar_url')
    .eq('id', sessionUser.id)
    .maybeSingle();
  return data;
}

function applyProfile(sessionUser, profile) {
  const avatar = (profile && profile.avatar_url) || 'https://i.pravatar.cc/100?u=' + encodeURIComponent(sessionUser.email || sessionUser.id);
  currentUser = {
    id: sessionUser.id,
    email: sessionUser.email,
    name: (profile && profile.name) || (sessionUser.email ? sessionUser.email.split('@')[0] : 'Usuario'),
    role: (profile && profile.role) || 'client',
    avatar: avatar
  };
  updateNavbarUI();
  const status = document.getElementById('uploaderStatus');
  if (status) {
    status.textContent = `✅ Sesión iniciada como ${currentUser.name} (${currentUser.role}).`;
    status.className = 'uploader-status success';
    status.style.display = 'block';
    setTimeout(() => { status.style.display = 'none'; }, 4000);
  }
}

async function restoreSession() {
  // Modo demo (sin Supabase)
  if (!supabaseClient) {
    const raw = localStorage.getItem('luxars_session');
    if (raw) {
      try {
        const user = JSON.parse(raw);
        const valid = APP_USERS.find(u => u.email === user.email);
        if (valid) {
          currentUser = valid;
          updateNavbarUI();
        } else {
          localStorage.removeItem('luxars_session');
        }
      } catch { localStorage.removeItem('luxars_session'); }
    }
    return;
  }

  // Modo Supabase
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session && session.user) {
    const profile = await fetchProfile(session.user);
    applyProfile(session.user, profile);
  }

  supabaseClient.auth.onAuthStateChange(async (_event, session) => {
    if (session && session.user) {
      const profile = await fetchProfile(session.user);
      applyProfile(session.user, profile);
    } else {
      currentUser = null;
      updateNavbarUI();
    }
  });
}

async function logoutSession() {
  if (supabaseClient) {
    await supabaseClient.auth.signOut();
  }
  currentUser = null;
  localStorage.removeItem('luxars_session');
  updateNavbarUI();
  // Hide uploader status
  const status = document.getElementById('uploaderStatus');
  if (status) status.style.display = 'none';
}

function updateNavbarUI() {
  const badge = document.getElementById('userBadge');
  const loginBtn = document.getElementById('loginBtn');
  const panelLoginBtn = document.getElementById('panelLoginBtn');
  const panelUser = document.getElementById('panelUser');
  const panelLogoutBtn = document.getElementById('panelLogoutBtn');
  const heroText = document.getElementById('heroText');
  if (!badge || !loginBtn) return;

  if (currentUser) {
    badge.style.display = 'block';
    loginBtn.style.display = 'none';
    document.getElementById('userAvatar').src = currentUser.avatar;
    document.getElementById('userName').textContent = currentUser.name;
    if (panelLoginBtn) panelLoginBtn.style.display = 'none';
    if (panelUser) {
      panelUser.style.display = 'flex';
      document.getElementById('panelAvatar').src = currentUser.avatar;
      document.getElementById('panelName').textContent = currentUser.name;
    }
    if (panelLogoutBtn) panelLogoutBtn.style.display = 'flex';
    if (heroText) heroText.style.display = 'none';
  } else {
    badge.style.display = 'none';
    loginBtn.style.display = 'inline-flex';
    if (panelLoginBtn) panelLoginBtn.style.display = 'flex';
    if (panelUser) panelUser.style.display = 'none';
    if (panelLogoutBtn) panelLogoutBtn.style.display = 'none';
    if (heroText) heroText.style.display = '';
  }

  // Toggle lock state on restricted nav links
  document.querySelectorAll('.nav-panel .nav-links .link').forEach(link => {
    const page = link.dataset.page;
    if (ACCESS_RULES[page]) {
      const denied = !currentUser || (ACCESS_RULES[page].roles && !ACCESS_RULES[page].roles.includes(currentUser.role));
      link.classList.toggle('locked', denied);
    } else {
      link.classList.remove('locked');
    }
  });
}

// ----- Upload System (Portafolio Module) -----
const UPLOAD_USERS = APP_USERS;
let selectedFile = null;

function initUploadSystem() {
  const btnUpload = document.getElementById('btnUploadImages');
  if (!btnUpload) return;

  // "Subir imágenes" → check auth
  btnUpload.addEventListener('click', () => {
    if (currentUser) {
      openUploadModal();
    } else {
      document.getElementById('uploadAuthOverlay').style.display = 'flex';
    }
  });

  // "Nuevo proyecto" → same auth check
  document.getElementById('btnNewProject').addEventListener('click', () => {
    if (currentUser) {
      openUploadModal();
    } else {
      document.getElementById('uploadAuthOverlay').style.display = 'flex';
    }
  });

  // Auth form submit
  document.getElementById('uploadAuthForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const email = document.getElementById('uploadAuthEmail').value.trim();
    const pass = document.getElementById('uploadAuthPass').value.trim();
    const errorEl = document.getElementById('uploadAuthError');

    // Modo demo
    if (!supabaseClient) {
      const user = UPLOAD_USERS.find(u => u.email === email && u.pass === pass);
      if (!user) {
        errorEl.textContent = 'Credenciales incorrectas. Solo administradores y fotógrafos pueden subir contenido.';
        errorEl.style.display = 'block';
        return;
      }
      saveSession(user);
      errorEl.style.display = 'none';
      document.getElementById('uploadAuthOverlay').style.display = 'none';
      openUploadModal();
      return;
    }

    // Modo Supabase
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password: pass });
    if (error) {
      errorEl.textContent = 'Credenciales incorrectas. Verifica tu correo y contraseña.';
      errorEl.style.display = 'block';
      return;
    }
    errorEl.style.display = 'none';
    document.getElementById('uploadAuthOverlay').style.display = 'none';

    const profile = await fetchProfile(data.user);
    applyProfile(data.user, profile);
    if (currentUser.role !== 'photographer' && currentUser.role !== 'admin') {
      luxAlert('Solo administradores y fotógrafos pueden subir contenido.', { title: 'Permiso denegado' });
      return;
    }
    openUploadModal();
  });

  // Close auth overlay
  document.getElementById('uploadAuthClose').addEventListener('click', () => {
    document.getElementById('uploadAuthOverlay').style.display = 'none';
  });
  document.getElementById('uploadAuthOverlay').addEventListener('click', function (e) {
    if (e.target === this) this.style.display = 'none';
  });

  // Modal controls
  document.getElementById('uploadModalClose').addEventListener('click', closeUploadModal);
  document.getElementById('uploadModalCancel').addEventListener('click', closeUploadModal);
  document.getElementById('uploadModalOverlay').addEventListener('click', function (e) {
    if (e.target === this) closeUploadModal();
  });

  // Type selector
  document.querySelectorAll('.upload-type-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.upload-type-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      selectedFile = null;
      document.getElementById('uploadFileName').style.display = 'none';
      document.getElementById('uploadPreview').style.display = 'none';

      const accept = this.dataset.type === 'imagen'
        ? 'image/jpeg,image/png,image/webp'
        : 'video/mp4,video/quicktime';
      document.getElementById('uploadFileInput').accept = accept;
    });
  });

  // Drop zone
  const dropzone = document.getElementById('uploadDropzone');
  const fileInput = document.getElementById('uploadFileInput');

  dropzone.addEventListener('click', () => fileInput.click());

  dropzone.addEventListener('dragover', e => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });
  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
  });
  dropzone.addEventListener('drop', e => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  });

  fileInput.addEventListener('change', function () {
    if (this.files[0]) handleFileSelect(this.files[0]);
  });

  // Submit
  document.getElementById('uploadSubmit').addEventListener('click', handleUploadSubmit);
}

function handleFileSelect(file) {
  const maxBytes = 50 * 1024 * 1024;
  if (file.size > maxBytes) {
    luxAlert('El archivo supera el máximo permitido de 50MB.', { title: 'Archivo demasiado grande' });
    return;
  }
  selectedFile = file;
  document.getElementById('uploadFileName').textContent = '📎 ' + file.name;
  document.getElementById('uploadFileName').style.display = 'block';

  // Preview
  const preview = document.getElementById('uploadPreview');
  const activeType = document.querySelector('.upload-type-btn.active');
  if (activeType && activeType.dataset.type === 'imagen' && file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = e => {
      preview.innerHTML = `<img src="${e.target.result}" alt="Preview" />`;
      preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
  } else if (activeType && activeType.dataset.type === 'video' && file.type.startsWith('video/')) {
    const reader = new FileReader();
    reader.onload = e => {
      preview.innerHTML = `<video src="${e.target.result}" controls></video>`;
      preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
  } else {
    preview.style.display = 'none';
  }
}

function openUploadModal() {
  document.getElementById('uploadTitle').value = '';
  document.getElementById('uploadDesc').value = '';
  document.getElementById('uploadTags').value = '';
  document.getElementById('uploadFileName').style.display = 'none';
  document.getElementById('uploadPreview').style.display = 'none';
  document.getElementById('uploadFeedback').style.display = 'none';
  selectedFile = null;
  document.getElementById('uploadModalOverlay').style.display = 'flex';
}

function closeUploadModal() {
  document.getElementById('uploadModalOverlay').style.display = 'none';
}

function handleUploadSubmit() {
  const feedback = document.getElementById('uploadFeedback');
  feedback.style.display = 'none';

  const title = document.getElementById('uploadTitle').value.trim();
  const desc = document.getElementById('uploadDesc').value.trim();
  const tagsStr = document.getElementById('uploadTags').value.trim();

  if (!title) {
    feedback.textContent = '⚠️ El título es obligatorio.';
    feedback.className = 'upload-feedback error';
    feedback.style.display = 'block';
    return;
  }

  if (!selectedFile) {
    feedback.textContent = '⚠️ Debes seleccionar un archivo.';
    feedback.className = 'upload-feedback error';
    feedback.style.display = 'block';
    return;
  }

  const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [];
  const type = document.querySelector('.upload-type-btn.active')?.dataset?.type || 'imagen';

  // Modo demo (sin Supabase) — simula la subida local
  if (!supabaseClient || !currentUser) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const container = document.getElementById('uploadedItems');
      const imgUrl = type === 'imagen' ? e.target.result : 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400&h=300&fit=crop';
      const item = document.createElement('div');
      item.className = 'portfolio-item uploaded-item';
      item.innerHTML = `
        <img src="${imgUrl}" alt="${title}" />
        <div class="portfolio-overlay">
          <h4>${title}</h4>
          <span>${desc ? desc.substring(0, 30) + (desc.length > 30 ? '...' : '') : 'Subido recientemente'}</span>
        </div>
      `;
      container.appendChild(item);

      feedback.textContent = '✅ Contenido subido exitosamente al portafolio.';
      feedback.className = 'upload-feedback success';
      feedback.style.display = 'block';

      setTimeout(() => {
        closeUploadModal();
        feedback.style.display = 'none';
      }, 1500);
    };

    if (type === 'imagen') {
      reader.readAsDataURL(selectedFile);
    } else {
      reader.onload({ target: { result: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400&h=300&fit=crop' } });
    }
    return;
  }

  // Modo Supabase — sube el archivo real a Storage
  feedback.textContent = 'Subiendo contenido...';
  feedback.className = 'upload-feedback';
  feedback.style.display = 'block';
  document.getElementById('uploadSubmit').disabled = true;

  supabaseUpload(selectedFile, title, desc, tags, type, feedback);
}

async function supabaseUpload(file, title, desc, tags, type, feedback) {
  const ext = (file.name.split('.').pop() || (type === 'imagen' ? 'jpg' : 'mp4')).toLowerCase();
  const filePath = `${currentUser.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: upError } = await supabaseClient.storage
    .from('portfolios')
    .upload(filePath, file, { cacheControl: '3600', upsert: false });

  if (upError) {
    feedback.textContent = '⚠️ Error al subir el archivo: ' + upError.message;
    feedback.className = 'upload-feedback error';
    feedback.style.display = 'block';
    document.getElementById('uploadSubmit').disabled = false;
    return;
  }

  const { data: urlData } = supabaseClient.storage.from('portfolios').getPublicUrl(filePath);
  const fileUrl = urlData.publicUrl;

  const { error: dbError } = await supabaseClient.from('portfolio_items').insert({
    user_id: currentUser.id,
    title,
    description: desc || null,
    tags,
    type,
    file_url: fileUrl
  });

  if (dbError) {
    feedback.textContent = '⚠️ Error al guardar en la base de datos: ' + dbError.message;
    feedback.className = 'upload-feedback error';
    feedback.style.display = 'block';
    document.getElementById('uploadSubmit').disabled = false;
    return;
  }

  feedback.textContent = '✅ Contenido subido exitosamente al portafolio.';
  feedback.className = 'upload-feedback success';
  feedback.style.display = 'block';
  document.getElementById('uploadSubmit').disabled = false;

  await loadPortfolio();

  setTimeout(() => {
    closeUploadModal();
    feedback.style.display = 'none';
  }, 1500);
}

async function loadPortfolio() {
  const container = document.getElementById('uploadedItems');
  if (!container || !supabaseClient) return;

  const { data, error } = await supabaseClient
    .from('portfolio_items')
    .select('id, title, description, type, file_url, created_at')
    .order('created_at', { ascending: false });

  if (error) return;

  container.innerHTML = '';
  data.forEach(item => {
    const el = document.createElement('div');
    el.className = 'portfolio-item uploaded-item';
    const media = item.type === 'video'
      ? `<video src="${item.file_url}" muted playsinline preload="metadata"></video>`
      : `<img src="${item.file_url}" alt="${item.title}" loading="lazy" />`;
    const shortDesc = item.description
      ? item.description.substring(0, 30) + (item.description.length > 30 ? '...' : '')
      : 'Subido recientemente';
    el.innerHTML = `
      ${media}
      <div class="portfolio-overlay">
        <h4>${item.title}</h4>
        <span>${shortDesc}</span>
      </div>
    `;
    container.appendChild(el);
  });
}
async function initApp() {
  await loadPhotographers();
  renderGrid('featuredGrid', photographers.slice(0, 3));
  renderGrid('catalogGrid', photographers);
  initBlobButtons();
  initBookingSystem();
  initCustomPickers();
  initUploadSystem();
  loadPortfolio();
  animateCounters();
}
initApp();

// ----- Back to Top -----
const backToTop = document.getElementById('backToTop');
if (backToTop) {
  window.addEventListener('scroll', () => {
    const hero = document.getElementById('hero');
    if (hero) {
      backToTop.classList.toggle('visible', window.scrollY > hero.offsetHeight * 0.6);
    }
  }, { passive: true });
  backToTop.addEventListener('click', () => {
    scrollToSection('hero');
  });
}

// ----- Animated Counters -----
function animateCounters() {
  const counters = document.querySelectorAll('.stat-counter-number[data-target]');
  if (!counters.length) return;

  const speed = 40;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const counter = entry.target;
      observer.unobserve(counter);
      const target = parseFloat(counter.dataset.target);
      const isDecimal = target % 1 !== 0;
      const increment = target / speed;
      let current = 0;

      function update() {
        current += increment;
        if (current < target) {
          counter.textContent = isDecimal ? current.toFixed(1) : Math.ceil(current);
          requestAnimationFrame(update);
        } else {
          counter.textContent = isDecimal ? target.toFixed(1) : target;
        }
      }
      update();
    });
  }, { threshold: 0.5 });

  counters.forEach(c => observer.observe(c));
}

// ----- History API: set initial state & deep-link -----
(function() {
  const hash = location.hash.replace('#', '');
  if (hash && document.getElementById(hash)) {
    // Deep-link: push the section state so back returns to home top
    const sectionId = hash;
    history.replaceState(null, '', location.pathname + location.search);
    requestAnimationFrame(() => {
      document.getElementById(sectionId).scrollIntoView({ behavior: 'instant', block: 'start' });
    });
  } else {
    // No hash: set initial null state
    history.replaceState(null, '', location.pathname + location.search);
  }
})();

// ----- Session UI Events -----
restoreSession();

document.getElementById('userBadgeBtn').addEventListener('click', function (e) {
  e.stopPropagation();
  document.getElementById('userDropdown').classList.toggle('open');
});

document.getElementById('logoutBtn').addEventListener('click', function (e) {
  e.preventDefault();
  document.getElementById('userDropdown').classList.remove('open');
  logoutSession();
  // Navigate to home
  document.querySelector('[data-page="home"]')?.click();
  hamburger.classList.remove('active');
  navPanel.classList.remove('open');
  document.getElementById('navbar').removeAttribute('data-panel-open');
});

document.getElementById('panelLogoutBtn').addEventListener('click', function (e) {
  e.preventDefault();
  logoutSession();
  document.querySelector('[data-page="home"]')?.click();
  hamburger.classList.remove('active');
  navPanel.classList.remove('open');
  document.getElementById('navbar').removeAttribute('data-panel-open');
});

document.addEventListener('click', function () {
  document.getElementById('userDropdown')?.classList.remove('open');
});

// Main auth page login
document.querySelector('#page-auth #auth-login form').addEventListener('submit', async function (e) {
  e.preventDefault();
  const btn = this.querySelector('button[type="submit"]');
  const email = this.querySelector('input[type="email"]').value.trim();
  const pass = this.querySelector('input[type="password"]').value.trim();
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Ingresando'; }

  // Modo demo
  if (!supabaseClient) {
    const user = APP_USERS.find(u => u.email === email && u.pass === pass);
    if (user) {
      saveSession(user);
      document.querySelector('[data-page="home"]')?.click();
    } else {
      luxAlert('Las credenciales no corresponden a ningún usuario registrado. Verifica tu correo y contraseña.', { title: 'Acceso denegado' });
    }
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-arrow-right"></i> Ingresar'; }
    return;
  }

  // Modo Supabase
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password: pass });
  if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-arrow-right"></i> Ingresar'; }

  if (error) {
    // Normaliza el mensaje real de Supabase (código HTTP incluido) para poder
    // diagnosticar y mostrar al usuario la causa exacta del rechazo del login.
    const rawMsg = (typeof error.message === 'string' ? error.message : '') + (error.status ? ' (' + error.status + ')' : '');

    // Mensaje por defecto: credenciales incorrectas (causa más común).
    let msg = rawMsg || 'Las credenciales no corresponden a ningún usuario registrado. Verifica tu correo y contraseña.';
    let title = 'Acceso denegado';

    // Caso 1: la cuenta existe pero el correo aún no se confirma.
    // Ocurre cuando Supabase tiene 'Confirm email' activado (por defecto).
    if (/email not confirmed|email_not_confirmed/i.test(rawMsg)) {
      msg = 'Todavía no confirmas tu correo. Revisa tu bandeja de entrada (y spam) y haz clic en el enlace de confirmación, o elimina el requisito de confirmación en Supabase.';
      title = 'Correo sin confirmar';
    }

    // Caso 2: el usuario/contraseña no existen (o están bloqueados por confirmación).
    if (/invalid login credentials|invalid_credentials/i.test(rawMsg)) {
      msg = 'Usuario no registrado o contraseña incorrecta. Si te registraste, confirma antes tu correo.';
      title = 'Usuario no registrado';
    }

    // Caso 3: Supabase limitó el envío de correos (plan gratuito) y bloquea login/registro.
    if (/rate limit|over_email_send_rate_limit|429/i.test(rawMsg)) {
      msg = 'Supabase está limitando el envío de correos. Desactiva "Confirm email" (o revisa el límite de emails) en el panel de Supabase para poder registrar/entrar.';
      title = 'Límite de envío de correos';
    }

    // Depuración: si hay flag LUX_DEBUG o un code, vuelca el objeto completo a la consola.
    if (window.LUX_DEBUG || error.code) {
      console.error('[LuxArs login]', error);
    }

    luxAlert(msg, { title });
    return;
  }

  const profile = await fetchProfile(data.user);
  applyProfile(data.user, profile);
  document.querySelector('[data-page="home"]')?.click();
});

// Main auth page register
document.querySelector('#page-auth #auth-register form').addEventListener('submit', async function (e) {
  e.preventDefault();
  const btn = this.querySelector('button[type="submit"]');
  const name = this.querySelector('input[type="text"]').value.trim();
  const email = this.querySelector('input[type="email"]').value.trim();
  const pass = this.querySelector('input[type="password"]').value.trim();
  const role = (this.querySelector('input[name="role"]:checked') || {}).value || 'client';
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creando cuenta'; }

  // Modo demo
  if (!supabaseClient) {
    if (APP_USERS.some(u => u.email === email)) {
      luxAlert('Ya existe una cuenta con este correo. Inicia sesión.', { title: 'Correo en uso' });
    } else {
      APP_USERS.push({ email, pass, role, name, avatar: 'https://i.pravatar.cc/100?u=' + encodeURIComponent(email) });
      luxAlert('Cuenta creada. Ahora inicia sesión.', { type: 'success', title: 'Cuenta creada' });
      document.querySelector('.auth-tab[data-tab="login"]').click();
    }
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-user-check"></i> Crear cuenta'; }
    return;
  }

  // Modo Supabase
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password: pass,
    options: { data: { name, role } }
  });
  if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-user-check"></i> Crear cuenta'; }

  if (error) {
    let msg = error.message;
    let title = 'No se pudo crear la cuenta';
    if (error.code === 'email_exists' || /already registered/i.test(error.message)) {
      msg = 'Ya existe una cuenta con este correo. Inicia sesión.';
      title = 'Correo en uso';
    }
    luxAlert(msg, { title });
    return;
  }

  if (data.user) {
    await supabaseClient.from('profiles').upsert({
      id: data.user.id,
      email: data.user.email,
      name,
      role,
      avatar_url: null
    });
  }

  if (data.session) {
    const profile = await fetchProfile(data.user);
    applyProfile(data.user, profile);
    luxAlert('Tu cuenta fue creada e inició sesión correctamente.', { type: 'success', title: 'Bienvenido a LuxArs' });
    document.querySelector('[data-page="home"]')?.click();
  } else {
    luxAlert('Cuenta creada. Revisa tu correo para confirmar la cuenta antes de iniciar sesión.', { type: 'success', title: 'Cuenta creada' });
    document.querySelector('.auth-tab[data-tab="login"]').click();
  }
});
