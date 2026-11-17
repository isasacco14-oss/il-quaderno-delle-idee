
/* Il Quaderno delle Idee | Sfogliamento v1
   File aggiuntivo: non modifica ricette, calendario o dati salvati. */
(function () {
  'use strict';
  const style = document.createElement('style');
  style.textContent = `
    /* Disattiva i due vecchi effetti di prova. */
    .book-shell.open .book-pages > article { animation: none !important; }
    .book-pages > article.sfoglia { animation: none !important; }
    .book-pages > article { position: relative; isolation: isolate; perspective: 1800px; }
    .quaderno-foglio {
      position: absolute; inset: 0; z-index: 30; pointer-events: none;
      transform-origin: left center; transform-style: preserve-3d;
      backface-visibility: hidden; -webkit-backface-visibility: hidden;
      background: #f4e7cf; border-radius: 1px 9px 9px 1px;
      box-shadow: inset 12px 0 18px rgba(88,57,27,.14), 8px 8px 17px rgba(59,39,22,.20);
      overflow: hidden; will-change: transform;
    }
    .quaderno-foglio::after {
      content: ''; position: absolute; inset: 0; pointer-events: none;
      background: linear-gradient(90deg, rgba(70,45,23,.24), transparent 17%, transparent 78%, rgba(255,250,226,.25));
      opacity: 0; animation: ombraCarta .94s ease-in-out forwards;
    }
    .quaderno-foglio.gira { animation: giraFoglio .94s cubic-bezier(.42,0,.20,1) forwards; }
    .quaderno-foglio-contenuto { padding: 25px 25px 40px; height: 100%; overflow: hidden; }
    .quaderno-foglio-contenuto > section { display: block !important; }
    @keyframes giraFoglio {
      0% { transform: rotateY(0deg); filter: brightness(1); }
      35% { transform: rotateY(-62deg) skewY(-1deg); filter: brightness(.93); }
      72% { transform: rotateY(-142deg); filter: brightness(.76); }
      100% { transform: rotateY(-179deg); filter: brightness(.72); }
    }
    @keyframes ombraCarta { 0% { opacity: .12; } 50% { opacity: .95; } 100% { opacity: .55; } }
    @media (max-width:650px) { .quaderno-foglio-contenuto { padding: 15px; } }
    @media (prefers-reduced-motion: reduce) {
      .quaderno-foglio.gira, .quaderno-foglio::after { animation: none !important; }
    }
  `;
  document.head.appendChild(style);

  const originalShowTab = window.showTab;
  if (typeof originalShowTab !== 'function') return;
  let turning = false;
  window.showTab = function (tab) {
    const article = document.querySelector('.book-pages > article');
    const oldSection = article && article.querySelector('main section:not(.hidden)');
    const nextSection = document.getElementById(tab);
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!article || !oldSection || !nextSection || oldSection === nextSection || reduceMotion ||
        !document.getElementById('bookShell')?.classList.contains('open')) {
      return originalShowTab.apply(this, arguments);
    }
    if (turning) return;
    turning = true;
    const paper = document.createElement('div');
    paper.className = 'quaderno-foglio';
    paper.setAttribute('aria-hidden', 'true');
    const contents = document.createElement('div');
    contents.className = 'quaderno-foglio-contenuto';
    const snapshot = oldSection.cloneNode(true);
    snapshot.removeAttribute('id');
    snapshot.classList.remove('hidden');
    snapshot.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
    snapshot.querySelectorAll('input,button,textarea,select,a').forEach(el => {
      el.setAttribute('tabindex', '-1');
      el.disabled = true;
    });
    contents.appendChild(snapshot);
    paper.appendChild(contents);
    article.appendChild(paper);
    originalShowTab.call(this, tab);
    // La pagina vecchia copre la nuova finché non viene girata.
    requestAnimationFrame(() => paper.classList.add('gira'));
    setTimeout(() => { paper.remove(); turning = false; }, 1000);
  };
})();
