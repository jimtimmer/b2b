// =============================================
//  BACK2BASICS — Hoofd JavaScript
// =============================================

// --- Hulpfuncties ---

const MAANDEN = ['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'];
const MAANDEN_LANG = ['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'];

function formatDatum(datumString) {
  const d = new Date(datumString + 'T00:00:00');
  return {
    dag: d.getDate(),
    maand: MAANDEN[d.getMonth()],
    maandLang: MAANDEN_LANG[d.getMonth()],
    jaar: d.getFullYear(),
    weekdag: ['zondag','maandag','dinsdag','woensdag','donderdag','vrijdag','zaterdag'][d.getDay()]
  };
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// --- Sidebar injectie & navigatie ---

function laadSidebar() {
  const huidigePagina = window.location.pathname.split('/').pop() || 'index.html';

  const navItems = [
    { href: 'index.html',      icoon: '🏠', label: 'Home' },
    { href: 'agenda.html',     icoon: '📅', label: 'Agenda' },
    { href: 'wie-zijn-wij.html', icoon: '👥', label: 'Wie zijn wij' },
    { href: 'nieuws.html',     icoon: '📰', label: 'Nieuws' },
    { href: 'contact.html',    icoon: '✉️', label: 'Contact' },
  ];

  const navHTML = navItems.map(item => {
    const actief = huidigePagina === item.href ? 'actief' : '';
    return `
      <li>
        <a href="${item.href}" class="${actief}">
          <span class="nav-icoon">${item.icoon}</span>
          ${item.label}
        </a>
      </li>
    `;
  }).join('');

  const sidebarHTML = `
    <a href="index.html" class="sidebar-logo">
      <div class="logo-icoon">
        <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Kruis -->
          <rect x="15" y="4" width="4" height="26" rx="2" fill="#C4622D"/>
          <rect x="6" y="11" width="22" height="4" rx="2" fill="#C4622D"/>
          <!-- Cirkel eromheen -->
          <circle cx="17" cy="17" r="15.5" stroke="rgba(253,250,245,0.2)" stroke-width="1.5" fill="none"/>
        </svg>
        <div>
          <div class="logo-naam">Back<span>2</span>Basics</div>
        </div>
      </div>
      <div class="logo-ondertitel">Gemeente &mdash; Beverwijk</div>
    </a>
    <nav class="sidebar-nav">
      <ul>${navHTML}</ul>
    </nav>
    <div class="sidebar-footer">
      &copy; ${new Date().getFullYear()} Back2Basics<br>
      Alle zijn welkom
    </div>
  `;

  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.innerHTML = sidebarHTML;

  // Paginatitel instellen
  const paginaTitels = {
    'index.html': 'Dashboard',
    'agenda.html': 'Agenda',
    'wie-zijn-wij.html': 'Wie zijn wij',
    'nieuws.html': 'Nieuws',
    'contact.html': 'Contact',
  };

  const titelEl = document.getElementById('pagina-titel');
  if (titelEl) titelEl.textContent = paginaTitels[huidigePagina] || 'Back2Basics';

  // Datum in header
  const datumEl = document.getElementById('header-datum');
  if (datumEl) {
    const nu = new Date();
    const weekdagen = ['zondag','maandag','dinsdag','woensdag','donderdag','vrijdag','zaterdag'];
    datumEl.textContent = `${weekdagen[nu.getDay()]} ${nu.getDate()} ${MAANDEN_LANG[nu.getMonth()]} ${nu.getFullYear()}`;
  }
}

// --- Data ophalen ---

async function haalData(pad) {
  const response = await fetch(pad);
  if (!response.ok) throw new Error(`Kan ${pad} niet laden`);
  return response.json();
}

// --- Homepage Dashboard ---

async function laadDashboard() {
  try {
    const [agenda, nieuws] = await Promise.all([
      haalData('data/agenda.json'),
      haalData('data/nieuws.json')
    ]);

    laadEerstvolgendeDienst(agenda);
    laadAgendaLijst(agenda);
    laadNieuwsLijst(nieuws);

  } catch (err) {
    console.error('Fout bij laden dashboard:', err);
  }
}

function laadEerstvolgendeDienst(agenda) {
  const container = document.getElementById('eerstvolgende-dienst');
  if (!container) return;

  const vandaag = new Date();
  vandaag.setHours(0,0,0,0);

  const komend = agenda.find(item => new Date(item.datum + 'T00:00:00') >= vandaag);

  if (!komend) {
    container.innerHTML = '<p class="laad-tekst">Geen komende diensten gevonden.</p>';
    return;
  }

  const d = formatDatum(komend.datum);

  container.innerHTML = `
    <div class="dienst-datum-blok">
      <div class="dienst-dag">${d.dag}</div>
      <div class="dienst-maand">${d.maand}</div>
    </div>
    <div class="dienst-info">
      <h3>${escapeHTML(komend.titel)}</h3>
      <p class="dienst-thema">"${escapeHTML(komend.thema)}"</p>
      <div class="dienst-meta">
        <div class="dienst-meta-item">🎤 <span>Spreker: <strong>${escapeHTML(komend.spreker)}</strong></span></div>
        <div class="dienst-meta-item">🕙 <span><strong>${komend.tijd} uur</strong></span></div>
        <div class="dienst-meta-item">📍 <span>${escapeHTML(komend.locatie)}</span></div>
      </div>
    </div>
  `;
}

function laadAgendaLijst(agenda) {
  const container = document.getElementById('agenda-lijst');
  if (!container) return;

  const vandaag = new Date();
  vandaag.setHours(0,0,0,0);

  const komend = agenda
    .filter(item => new Date(item.datum + 'T00:00:00') >= vandaag)
    .slice(0, 5);

  if (komend.length === 0) {
    container.innerHTML = '<p class="laad-tekst">Geen komende diensten.</p>';
    return;
  }

  container.innerHTML = komend.map(item => {
    const d = formatDatum(item.datum);
    return `
      <div class="agenda-item">
        <div class="agenda-datum-mini">
          <div class="dag">${d.dag}</div>
          <div class="mnd">${d.maand}</div>
        </div>
        <div class="agenda-info">
          <h4>${escapeHTML(item.titel)}</h4>
          <div class="spreker-naam">${escapeHTML(item.spreker)}</div>
        </div>
        <div class="agenda-tijd">${item.tijd}</div>
      </div>
    `;
  }).join('');
}

function laadNieuwsLijst(nieuws) {
  const container = document.getElementById('nieuws-lijst');
  if (!container) return;

  const recent = [...nieuws]
    .sort((a, b) => new Date(b.datum) - new Date(a.datum))
    .slice(0, 3);

  container.innerHTML = recent.map(item => {
    const d = formatDatum(item.datum);
    return `
      <div class="nieuws-item">
        <h4>${escapeHTML(item.titel)}</h4>
        <p>${escapeHTML(item.samenvatting)}</p>
        <div class="nieuws-datum">${d.dag} ${d.maandLang} ${d.jaar} &mdash; ${escapeHTML(item.auteur)}</div>
      </div>
    `;
  }).join('');
}

// --- Agenda pagina ---

async function laadAgendaPagina() {
  const container = document.getElementById('agenda-container');
  if (!container) return;

  container.innerHTML = '<p class="laad-tekst">Agenda laden...</p>';

  try {
    const agenda = await haalData('data/agenda.json');

    const vandaag = new Date();
    vandaag.setHours(0,0,0,0);

    const gesorteerd = [...agenda].sort((a, b) => new Date(a.datum) - new Date(b.datum));

    // Groepeer per maand
    const perMaand = {};
    gesorteerd.forEach(item => {
      const d = new Date(item.datum + 'T00:00:00');
      const sleutel = `${d.getFullYear()}-${d.getMonth()}`;
      if (!perMaand[sleutel]) {
        perMaand[sleutel] = {
          label: `${MAANDEN_LANG[d.getMonth()]} ${d.getFullYear()}`,
          items: []
        };
      }
      perMaand[sleutel].items.push(item);
    });

    let html = '';
    Object.values(perMaand).forEach(maand => {
      html += `<div class="agenda-maand-titel">${maand.label}</div>`;
      maand.items.forEach(item => {
        const d = formatDatum(item.datum);
        const verleden = new Date(item.datum + 'T00:00:00') < vandaag;
        html += `
          <div class="agenda-kaart" style="${verleden ? 'opacity:0.55' : ''}">
            <div class="datum-zijde">
              <div class="dag">${d.dag}</div>
              <div class="mnd">${d.maand}</div>
            </div>
            <div class="info-zijde">
              <h3>${escapeHTML(item.titel)}</h3>
              <p class="thema">"${escapeHTML(item.thema)}"</p>
              <div class="meta-rij">
                <span>🎤 Spreker: <strong>${escapeHTML(item.spreker)}</strong></span>
                <span>🕙 <strong>${item.tijd} uur</strong></span>
                <span>📍 ${escapeHTML(item.locatie)}</span>
              </div>
            </div>
          </div>
        `;
      });
    });

    container.innerHTML = html;

  } catch (err) {
    container.innerHTML = '<p class="laad-tekst">Fout bij laden agenda.</p>';
    console.error(err);
  }
}

// --- Nieuws pagina ---

async function laadNieuwsPagina() {
  const container = document.getElementById('nieuws-container');
  if (!container) return;

  container.innerHTML = '<p class="laad-tekst">Nieuws laden...</p>';

  try {
    const nieuws = await haalData('data/nieuws.json');

    const gesorteerd = [...nieuws].sort((a, b) => new Date(b.datum) - new Date(a.datum));

    container.innerHTML = gesorteerd.map(item => {
      const d = formatDatum(item.datum);
      return `
        <div class="nieuws-kaart fade-in">
          <div class="nieuws-meta">
            <span class="nieuws-datum-badge">${d.dag} ${d.maandLang} ${d.jaar}</span>
            <span class="nieuws-auteur">door ${escapeHTML(item.auteur)}</span>
          </div>
          <h2>${escapeHTML(item.titel)}</h2>
          <p class="samenvatting">${escapeHTML(item.samenvatting)}</p>
          <p class="volledige-tekst">${escapeHTML(item.tekst)}</p>
        </div>
      `;
    }).join('');

  } catch (err) {
    container.innerHTML = '<p class="laad-tekst">Fout bij laden nieuws.</p>';
    console.error(err);
  }
}

// --- Contact formulier ---

function laadContactFormulier() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    const melding = document.getElementById('form-melding');
    if (melding) {
      melding.style.display = 'block';
      form.reset();
      setTimeout(() => { melding.style.display = 'none'; }, 5000);
    }
  });
}

// --- Initialisatie ---

document.addEventListener('DOMContentLoaded', () => {
  laadSidebar();
  laadDashboard();
  laadAgendaPagina();
  laadNieuwsPagina();
  laadContactFormulier();
});
