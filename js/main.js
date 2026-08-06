// =============================================
//  ECCLESIA — Hoofd JavaScript
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

function formatLocatie(item) {
  const locatie = item.locatie && item.locatie !== '-' ? item.locatie : '';
  const adres = item.adres && item.adres !== '-' ? item.adres : '';
  return [locatie, adres].filter(Boolean).join(', ') || '-';
}

// --- Sidebar injectie & navigatie ---

function laadSidebar() {
  const huidigPad = window.location.pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';

  const navItems = [
    { href: '/',              icoon: '<i class="ph ph-house"></i>',     label: 'Home' },
    { href: '/agenda',        icoon: '<i class="ph ph-calendar"></i>',  label: 'Agenda' },
    { href: '/wie-zijn-wij',  icoon: '<i class="ph ph-users"></i>',     label: 'Wie zijn wij' },
    { href: '/nieuws',        icoon: '<i class="ph ph-newspaper"></i>', label: 'Nieuws' },
    { href: '/contact',       icoon: '<i class="ph ph-envelope"></i>',  label: 'Contact' },
    { href: '/anbi',          icoon: '<i class="ph ph-certificate"></i>', label: 'ANBI' },
  ];

  const navHTML = navItems.map(item => {
    const actief = huidigPad === item.href ? 'actief' : '';
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
    <div class="sidebar-logo-rij">
      <a href="/" class="sidebar-logo">
        <div class="logo-rij">
          <img src="/img/eg_logo.png" alt="Evangelische Gemeente Ecclesia" class="logo-afbeelding">
          <div class="logo-naam">
            <span>Evangelische</span>
            <span>Gemeente</span>
            <span>Ecclesia</span>
          </div>
        </div>
      </a>
      <button class="sidebar-sluit" id="sidebar-sluit" aria-label="Menu sluiten">✕</button>
    </div>
    <nav class="sidebar-nav">
      <ul>${navHTML}</ul>
    </nav>
    <div class="sidebar-footer">
      &copy; ${new Date().getFullYear()} Evangelische Gemeente Ecclesia - Kennemerland
    </div>
  `;

  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.innerHTML = sidebarHTML;

  // Aanbouw banner bovenaan pagina-inhoud
  const inhoud = document.getElementById('inhoud');
  if (inhoud && !document.querySelector('.aanbouw-banner')) {
    const banner = document.createElement('div');
    banner.className = 'aanbouw-banner';
    banner.innerHTML = '<i class="ph ph-warning"></i> <span><strong>Website in aanbouw</strong> &mdash; Teksten zijn tijdelijke placeholders en worden binnenkort aangevuld.</span>';
    inhoud.insertBefore(banner, inhoud.firstChild);
  }

  // Paginatitel instellen
  const paginaTitels = {
    '/':             'Home',
    '/agenda':       'Agenda',
    '/wie-zijn-wij': 'Wie zijn wij',
    '/nieuws':       'Nieuws',
    '/contact':      'Contact',
    '/anbi':         'ANBI',
  };

  const titelEl = document.getElementById('pagina-titel');
  if (titelEl) titelEl.textContent = paginaTitels[huidigPad] || 'Ecclesia';

  // Datum in header
  const datumEl = document.getElementById('header-datum');
  if (datumEl) {
    const nu = new Date();
    const weekdagen = ['zondag','maandag','dinsdag','woensdag','donderdag','vrijdag','zaterdag'];
    datumEl.textContent = `${weekdagen[nu.getDay()]} ${nu.getDate()} ${MAANDEN_LANG[nu.getMonth()]} ${nu.getFullYear()}`;
  }

  // Hamburger menu logica
  voegHamburgerToe();
}

function voegHamburgerToe() {
  // Maak hamburger knop aan
  const knop = document.createElement('button');
  knop.className = 'hamburger-knop';
  knop.id = 'hamburger-knop';
  knop.setAttribute('aria-label', 'Menu openen');
  knop.innerHTML = '<span></span><span></span><span></span>';
  document.body.appendChild(knop);

  // Maak overlay aan
  const overlay = document.createElement('div');
  overlay.className = 'menu-overlay';
  overlay.id = 'menu-overlay';
  document.body.appendChild(overlay);

  const sidebar = document.getElementById('sidebar');

  function menuOpen() {
    sidebar.classList.add('open');
    knop.classList.add('open');
    overlay.classList.add('zichtbaar');
    document.body.style.overflow = 'hidden';
  }

  function menuSluit() {
    sidebar.classList.remove('open');
    knop.classList.remove('open');
    overlay.classList.remove('zichtbaar');
    document.body.style.overflow = '';
  }

  // Hamburger knop toggle
  knop.addEventListener('click', () => {
    sidebar.classList.contains('open') ? menuSluit() : menuOpen();
  });

  // Overlay klik sluit menu
  overlay.addEventListener('click', menuSluit);

  // Sluit-knop in sidebar
  document.addEventListener('click', (e) => {
    if (e.target.id === 'sidebar-sluit') menuSluit();
  });

  // Navigatielinks sluiten menu op mobiel
  document.querySelectorAll('.sidebar-nav a').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 768) menuSluit();
    });
  });

  // ESC toets sluit menu
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') menuSluit();
  });
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

  const vandaag2 = new Date();
  vandaag2.setHours(0,0,0,0);
  const komend2 = agenda.diensten.find(item => new Date(item.datum + 'T00:00:00') >= vandaag2);

  if (!komend2) {
    container.innerHTML = '<p class="laad-tekst">Geen komende diensten gevonden.</p>';
    return;
  }

  const d = formatDatum(komend2.datum);

  container.innerHTML = `
    <div class="dienst-datum-blok">
      <div class="dienst-dag">${d.dag}</div>
      <div class="dienst-maand">${d.maand}</div>
    </div>
    <div class="dienst-info">
      <h3>${escapeHTML(komend2.titel)}</h3>
      <div class="dienst-meta">
        <div class="dienst-meta-item"><i class="ph ph-microphone"></i> <span>Spreker: <strong>${escapeHTML(komend2.spreker)}</strong></span></div>
        <div class="dienst-meta-item"><i class="ph ph-clock"></i> <span><strong>${komend2.tijd} uur</strong></span></div>
        <div class="dienst-meta-item"><i class="ph ph-map-pin"></i> <span>${escapeHTML(formatLocatie(komend2))}</span></div>
      </div>
    </div>
  `;
}

function laadAgendaLijst(agenda) {
  const container = document.getElementById('agenda-lijst');
  if (!container) return;

  const vandaag = new Date();
  vandaag.setHours(0,0,0,0);

  const komend = agenda.diensten
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

  const recent = [...nieuws.berichten]
    .sort((a, b) => new Date(b.datum) - new Date(a.datum))
    .slice(0, 3);

  container.innerHTML = recent.map(item => {
    const d = formatDatum(item.datum);
    return `
      <div class="nieuws-item">
        <h4>${escapeHTML(item.titel)}</h4>
        <p>${escapeHTML(item.samenvatting)}</p>
        <div class="nieuws-datum">${d.dag} ${d.maandLang} ${d.jaar}</div>
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

    const gesorteerd = [...agenda.diensten].sort((a, b) => new Date(a.datum) - new Date(b.datum));

    const huidigeSleutel = `${vandaag.getFullYear()}-${vandaag.getMonth()}`;

    // Groepeer per maand
    const perMaand = {};
    gesorteerd.forEach(item => {
      const d = new Date(item.datum + 'T00:00:00');
      const sleutel = `${d.getFullYear()}-${d.getMonth()}`;
      if (!perMaand[sleutel]) {
        perMaand[sleutel] = {
          label: `${MAANDEN_LANG[d.getMonth()]} ${d.getFullYear()}`,
          verleden: sleutel < huidigeSleutel,
          items: []
        };
      }
      perMaand[sleutel].items.push(item);
    });

    // Huidige/toekomstige maanden bovenaan (open), afgelopen maanden onderaan (dichtgeklapt)
    const alleMaanden = Object.values(perMaand);
    const huidigEnToekomst = alleMaanden.filter(m => !m.verleden);
    const afgelopen = alleMaanden.filter(m => m.verleden).reverse();
    const volgorde = [...huidigEnToekomst, ...afgelopen];

    let html = '';
    volgorde.forEach(maand => {
      html += `<details class="agenda-maand-groep" ${maand.verleden ? '' : 'open'}>`;
      html += `<summary class="agenda-maand-titel">${maand.label}</summary>`;
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
              <div class="meta-rij">
                <span><i class="ph ph-microphone"></i> Spreker: <strong>${escapeHTML(item.spreker)}</strong></span>
                <span><i class="ph ph-clock"></i> <strong>${item.tijd} uur</strong></span>
                <span><i class="ph ph-map-pin"></i> ${escapeHTML(formatLocatie(item))}</span>
              </div>
            </div>
          </div>
        `;
      });
      html += `</details>`;
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

    const gesorteerd = [...nieuws.berichten].sort((a, b) => new Date(b.datum) - new Date(a.datum));

    container.innerHTML = gesorteerd.map(item => {
      const d = formatDatum(item.datum);
      return `
        <div class="nieuws-kaart fade-in">
          <div class="nieuws-meta">
            <span class="nieuws-datum-badge">${d.dag} ${d.maandLang} ${d.jaar}</span>
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