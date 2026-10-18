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
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

function vandaagMiddernacht() {
  const v = new Date();
  v.setHours(0, 0, 0, 0);
  return v;
}

function isGevuld(waarde) {
  return Boolean(waarde) && waarde !== '-' && waarde !== 'n.t.b.';
}

// Extra info per locatie. routeLink overschrijft de standaard Google Maps-route,
// routeLabel de tekst op de knop.
const LOCATIE_INFO = {
  'Stompe toren Spaarnwoude': {
    routeLink: '/img/parkeerplaats-kaart.svg',
    routeLabel: 'Bekijk waar u kunt parkeren'
  }
};

function routeUrl(item) {
  const info = LOCATIE_INFO[item.locatie];
  if (info && info.routeLink) return info.routeLink;
  const bestemming = [item.locatie, isGevuld(item.adres) ? item.adres : ''].filter(Boolean).join(', ');
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(bestemming)}`;
}

function routeLabel(item) {
  const info = LOCATIE_INFO[item.locatie];
  return (info && info.routeLabel) || 'Plan je route';
}

// --- Topmenu & footer ---

const NAV_ITEMS = [
  { href: '/',             label: 'Home' },
  { href: '/agenda',       label: 'Agenda' },
  { href: '/wie-zijn-wij', label: 'Wie zijn wij' },
  { href: '/nieuws',       label: 'Nieuws' },
  { href: '/geven',        label: 'Geven' },
  { href: '/contact',      label: 'Contact' },
];

function huidigPad() {
  return window.location.pathname.replace(/index\.html$/, '').replace(/\.html$/, '').replace(/\/$/, '') || '/';
}

function laadTopmenu() {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  const pad = huidigPad();
  const links = NAV_ITEMS.map(item => {
    const link = item.href === '/' ? '/' : `${item.href}/`;
    const actief = pad === item.href ? ' class="actief" aria-current="page"' : '';
    return `<a href="${link}"${actief}>${item.label}</a>`;
  }).join('');

  const nav = document.createElement('div');
  nav.className = 'site-nav';
  nav.innerHTML = `
    <a href="/" class="brand"><img src="/img/eg_logo.png" alt="Evangelische Gemeente Ecclesia"></a>
    <nav class="hoofdmenu" id="hoofdmenu" aria-label="Hoofdmenu">${links}</nav>
    <button class="menu-knop" id="menu-knop" aria-label="Menu openen" aria-expanded="false" aria-controls="hoofdmenu">
      <span></span><span></span><span></span>
    </button>
  `;
  hero.prepend(nav);

  const knop = nav.querySelector('#menu-knop');

  function menuSluit() {
    document.body.classList.remove('menu-open');
    knop.setAttribute('aria-expanded', 'false');
    knop.setAttribute('aria-label', 'Menu openen');
  }

  knop.addEventListener('click', () => {
    const open = document.body.classList.toggle('menu-open');
    knop.setAttribute('aria-expanded', String(open));
    knop.setAttribute('aria-label', open ? 'Menu sluiten' : 'Menu openen');
  });

  nav.querySelectorAll('.hoofdmenu a').forEach(a => a.addEventListener('click', menuSluit));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') menuSluit(); });
  window.addEventListener('resize', () => { if (window.innerWidth > 860) menuSluit(); });
}

function laadFooter() {
  const footer = document.createElement('footer');
  footer.className = 'site-footer';
  footer.innerHTML = `
    <span>&copy; ${new Date().getFullYear()} Evangelische Gemeente Ecclesia - Kennemerland</span>
    <span class="footer-links"><span class="scheiding">&middot;</span><a href="/anbi/">ANBI</a><span class="scheiding">&middot;</span><a href="/privacy/">Privacy</a><span class="scheiding">&middot;</span><a href="/disclaimer/">Disclaimer</a></span>
  `;
  const script = document.querySelector('body > script');
  document.body.insertBefore(footer, script);
}

// --- Data ophalen ---

async function haalData(pad) {
  const response = await fetch(pad);
  if (!response.ok) throw new Error(`Kan ${pad} niet laden`);
  return response.json();
}

function komendeDiensten(agenda) {
  const vandaag = vandaagMiddernacht();
  return [...agenda.diensten]
    .filter(item => new Date(item.datum + 'T00:00:00') >= vandaag)
    .sort((a, b) => new Date(a.datum) - new Date(b.datum));
}

// --- Homepage ---

async function laadHomepage() {
  if (!document.getElementById('samenkomst')) return;
  try {
    const [agenda, nieuws] = await Promise.all([
      haalData('/data/agenda.json'),
      haalData('/data/nieuws.json')
    ]);
    const komend = komendeDiensten(agenda);
    laadSamenkomst(komend[0]);
    laadAgendaLijst(komend.slice(1, 6));
    laadNieuwsLijst(nieuws);
  } catch (err) {
    console.error('Fout bij laden homepage:', err);
  }
}

function laadSamenkomst(dienst) {
  const container = document.getElementById('samenkomst');
  if (!container) return;

  if (!dienst) {
    container.innerHTML = '<p class="laad-tekst">Er staan op dit moment geen samenkomsten gepland.</p>';
    return;
  }

  const d = formatDatum(dienst.datum);
  const heeftLocatie = isGevuld(dienst.locatie);
  const adresHTML = heeftLocatie && isGevuld(dienst.adres)
    ? `<a class="adres" href="${routeUrl(dienst)}" target="_blank" rel="noopener">${escapeHTML(dienst.adres)}</a>`
    : '';

  container.innerHTML = `
    <div class="samenkomst-body">
      <div class="datum-blok">
        <span class="dag">${d.dag}</span>
        <span class="mnd">${d.maand}</span>
      </div>
      <div class="samenkomst-info">
        <div class="sk-kolom">
          <span class="sk-key">Spreker</span>
          <span class="sk-val">${escapeHTML(dienst.spreker)}</span>
        </div>
        <div class="sk-kolom">
          <span class="sk-key">Tijd</span>
          <span class="sk-val">${escapeHTML(dienst.tijd)} uur</span>
        </div>
        <div class="sk-kolom">
          <span class="sk-key">Locatie</span>
          <span class="sk-val">${heeftLocatie ? escapeHTML(dienst.locatie) : 'Nog niet bekend'}</span>
          ${adresHTML}
        </div>
      </div>
      ${heeftLocatie ? `<a class="route-knop" href="${routeUrl(dienst)}" target="_blank" rel="noopener">${escapeHTML(routeLabel(dienst))}</a>` : ''}
    </div>
  `;
}

function laadAgendaLijst(diensten) {
  const container = document.getElementById('agenda-lijst');
  if (!container) return;

  if (diensten.length === 0) {
    container.innerHTML = '<p class="laad-tekst">Nog geen volgende diensten gepland.</p>';
    return;
  }

  container.innerHTML = diensten.map(item => {
    const d = formatDatum(item.datum);
    return `
      <div class="agenda-rij">
        <span class="ar-datum">${d.dag} ${d.maand}</span>
        <span class="ar-naam">${escapeHTML(item.spreker)}</span>
        <span class="ar-tijd">${escapeHTML(item.tijd)}</span>
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
      <a class="nieuws-rij" href="/nieuws/">
        <div class="nieuws-item-tekst">
          <h3>${escapeHTML(item.titel)}</h3>
          <p>${escapeHTML(item.tekst)}</p>
          <span class="nd">${d.dag} ${d.maandLang} ${d.jaar}</span>
        </div>
      </a>
    `;
  }).join('');
}

// --- Agenda pagina ---

async function laadAgendaPagina() {
  const container = document.getElementById('agenda-container');
  if (!container) return;

  try {
    const agenda = await haalData('/data/agenda.json');
    const vandaag = vandaagMiddernacht();
    const eerstvolgende = komendeDiensten(agenda)[0];

    const gesorteerd = [...agenda.diensten].sort((a, b) => new Date(a.datum) - new Date(b.datum));

    // Groepeer per maand (numerieke sleutel jaar*12+maand)
    const perMaand = {};
    const volgordeSleutels = [];
    gesorteerd.forEach(item => {
      const d = new Date(item.datum + 'T00:00:00');
      const sleutel = d.getFullYear() * 12 + d.getMonth();
      if (!perMaand[sleutel]) {
        perMaand[sleutel] = {
          label: `${MAANDEN_LANG[d.getMonth()]} ${d.getFullYear()}`,
          laatsteDatum: d,
          items: []
        };
        volgordeSleutels.push(sleutel);
      } else if (d > perMaand[sleutel].laatsteDatum) {
        perMaand[sleutel].laatsteDatum = d;
      }
      perMaand[sleutel].items.push(item);
    });

    // Huidige maand staat open: de eerste maand waarvan de laatste dienst nog niet voorbij is.
    const chronologisch = [...volgordeSleutels].sort((a, b) => a - b);
    let actieveSleutel = chronologisch.find(s => perMaand[s].laatsteDatum >= vandaag);
    if (actieveSleutel === undefined) actieveSleutel = chronologisch[chronologisch.length - 1];

    // Komende maanden op volgorde bovenaan, afgelopen maanden daaronder (nieuwste eerst).
    const komendeMaanden = chronologisch.filter(s => s >= actieveSleutel);
    const afgelopenMaanden = chronologisch.filter(s => s < actieveSleutel).reverse();

    const html = [...komendeMaanden, ...afgelopenMaanden].map(sleutel => {
      const maand = perMaand[sleutel];
      const open = sleutel === actieveSleutel;
      const items = [...maand.items].sort((a, b) => new Date(a.datum) - new Date(b.datum)).map(item => {
        const d = formatDatum(item.datum);
        const verleden = new Date(item.datum + 'T00:00:00') < vandaag;
        const isEerstvolgende = eerstvolgende && item === eerstvolgende;
        const heeftLocatie = isGevuld(item.locatie);
        const adres = heeftLocatie && isGevuld(item.adres)
          ? `<a class="adres-klein" href="${routeUrl(item)}" target="_blank" rel="noopener">${escapeHTML(item.adres)}</a>`
          : '';
        return `
          <div class="agenda-kaart${verleden ? ' verleden' : ''}${isEerstvolgende ? ' eerstvolgende' : ''}">
            <div class="datum-zijde">
              <div class="dag">${d.dag}</div>
              <div class="mnd">${d.maand}</div>
            </div>
            <div class="info-zijde">
              <div class="sk-kolom"><span class="sk-key">Spreker</span><span class="sk-val">${escapeHTML(item.spreker)}</span></div>
              <div class="sk-kolom"><span class="sk-key">Tijd</span><span class="sk-val">${escapeHTML(item.tijd)} uur</span></div>
              <div class="sk-kolom"><span class="sk-key">Locatie</span><span class="sk-val">${heeftLocatie ? escapeHTML(item.locatie) : 'Nog niet bekend'}</span>${adres}</div>
            </div>
          </div>
        `;
      }).join('');
      return `
        <details class="agenda-maand-groep"${open ? ' open' : ''}>
          <summary class="agenda-maand-titel">${maand.label}</summary>
          ${items}
        </details>
      `;
    }).join('');

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

  try {
    const nieuws = await haalData('/data/nieuws.json');
    const gesorteerd = [...nieuws.berichten].sort((a, b) => new Date(b.datum) - new Date(a.datum));

    container.innerHTML = gesorteerd.map(item => {
      const d = formatDatum(item.datum);
      const heeftFoto = Boolean(item.afbeelding);
      const inhoud = `
        <div class="nieuws-meta">${d.dag} ${d.maandLang} ${d.jaar}</div>
        <h2>${escapeHTML(item.titel)}</h2>
        <p class="volledige-tekst">${escapeHTML(item.tekst)}</p>
      `;
      return `
        <article class="nieuws-kaart${heeftFoto ? ' nieuws-kaart--met-foto' : ''}">
          ${heeftFoto ? `<img src="${item.afbeelding}" alt="${escapeHTML(item.afbeeldingAlt || item.titel)}" class="nieuws-kaart-foto" tabindex="0" role="button" aria-label="Afbeelding vergroten">` : ''}
          ${heeftFoto ? `<div class="nieuws-kaart-inhoud">${inhoud}</div>` : inhoud}
        </article>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = '<p class="laad-tekst">Fout bij laden nieuws.</p>';
    console.error(err);
  }
}

// --- Nieuws foto lightbox ---

function initNieuwsLightbox() {
  if (!document.getElementById('nieuws-container')) return;

  const overlay = document.createElement('div');
  overlay.className = 'lightbox-overlay';
  overlay.innerHTML = `
    <button class="lightbox-sluiten" aria-label="Sluiten">&times;</button>
    <img class="lightbox-afbeelding" alt="">
  `;
  document.body.appendChild(overlay);

  const afbeelding = overlay.querySelector('.lightbox-afbeelding');

  function lightboxOpen(src, alt) {
    afbeelding.src = src;
    afbeelding.alt = alt || '';
    overlay.classList.add('zichtbaar');
    document.body.style.overflow = 'hidden';
  }

  function lightboxSluit() {
    overlay.classList.remove('zichtbaar');
    document.body.style.overflow = '';
  }

  document.addEventListener('click', e => {
    const foto = e.target.closest('.nieuws-kaart-foto');
    if (foto) { lightboxOpen(foto.src, foto.alt); return; }
    if (e.target === overlay || e.target.closest('.lightbox-sluiten')) lightboxSluit();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { lightboxSluit(); return; }
    if (e.key === 'Enter' || e.key === ' ') {
      const foto = e.target.closest && e.target.closest('.nieuws-kaart-foto');
      if (foto) { e.preventDefault(); lightboxOpen(foto.src, foto.alt); }
    }
  });
}

// --- Initialisatie ---

document.addEventListener('DOMContentLoaded', () => {
  laadTopmenu();
  laadFooter();
  laadHomepage();
  laadAgendaPagina();
  laadNieuwsPagina();
  initNieuwsLightbox();
});
