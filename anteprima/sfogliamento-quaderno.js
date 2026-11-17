
/* Il Quaderno delle Idee
   Sfogliamento vintage migliorato */
(function () {
  'use strict';

  const style = document.createElement('style');
  style.textContent = `
    /* Disattiva le vecchie animazioni */
    .book-shell.open .book-pages > article,
    .book-pages > article.sfoglia {
      animation: none !important;
    }

    .book-pages > article {
      position: relative;
      isolation: isolate;
      perspective: 2200px;
    }

    .quaderno-foglio {
      position: absolute;
      inset: 0;
      z-index: 30;
      pointer-events: none;
      transform-origin: left center;
      transform-style: preserve-3d;
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
      background: #f4e7cf;
      border-radius: 0 9px 9px 0;
      box-shadow:
        inset 12px 0 20px rgba(74,46,26,.18),
        8px 8px 20px rgba(53,36,24,.16);
      overflow: hidden;
      will-change: transform;
    }

    /* Ombre e riflessi sulla carta */
    .quaderno-foglio::before {
      content: '';
      position: absolute;
      inset: 0;
      z-index: 3;
      pointer-events: none;
      background: linear-gradient(
        90deg,
        rgba(67,42,22,.26) 0%,
        rgba(255,249,225,.12) 11%,
        transparent 34%,
        rgba(255,255,245,.28) 76%,
        rgba(93,59,32,.26) 98%
      );
      animation: cartaLuce 1.55s ease-in-out both;
    }

    /* Bordo della pagina che si incurva */
    .quaderno-foglio::after {
      content: '';
      position: absolute;
      top: 0;
      bottom: 0;
      right: 0;
      width: 11%;
      z-index: 4;
      pointer-events: none;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255,255,245,.75) 35%,
        rgba(100,65,38,.24) 100%
      );
      transform-origin: right center;
      animation: bordoCarta 1.55s ease-in-out both;
    }

    .quaderno-foglio.gira {
      animation: giraFoglio 1.55s
        cubic-bezier(.55,.02,.20,1) both;
    }

    .quaderno-foglio-contenuto {
      padding: 25px 25px 40px;
      height: 100%;
      overflow: hidden;
    }

    .quaderno-foglio-contenuto > section {
      display: block !important;
    }

    @keyframes giraFoglio {
      0% {
        transform: rotateY(0deg) skewY(0deg) scaleX(1);
        filter: brightness(1);
      }
      18% {
        transform: rotateY(-16deg) skewY(-.35deg) scaleX(.99);
        filter: brightness(1.02);
      }
      42% {
        transform: rotateY(-68deg) skewY(-1.3deg) scaleX(.96);
        filter: brightness(.96);
      }
      62% {
        transform: rotateY(-113deg) skewY(-1.1deg) scaleX(.95);
        filter: brightness(.88);
      }
      84% {
        transform: rotateY(-164deg) skewY(-.25deg) scaleX(.99);
        filter: brightness(.85);
      }
      100% {
        transform: rotateY(-179deg) skewY(0deg) scaleX(1);
        filter: brightness(.84);
      }
    }

    @keyframes cartaLuce {
      0% { opacity: .20; }
      45% { opacity: .90; }
      65% { opacity: .98; }
      100% { opacity: .30; }
    }

    @keyframes bordoCarta {
      0%, 100% {
        transform: scaleX(.3);
        opacity: .25;
      }
      42%, 62% {
        transform: scaleX(1.5);
        opacity: .9;
      }
    }

    @media (max-width:650px) {
      .quaderno-foglio-contenuto {
        padding: 15px;
      }
    }

    @media (prefers-reduced-motion:reduce) {
      .quaderno-foglio.gira,
      .quaderno-foglio::before,
      .quaderno-foglio::after {
        animation: none !important;
      }
    }
  `;

  document.head.appendChild(style);

  const originalShowTab = window.showTab;
  if (typeof originalShowTab !== 'function') return;

  let turning = false;

  window.showTab = function (tab) {
    const article = document.querySelector(
      '.book-pages > article'
    );
    const oldSection = article &&
      article.querySelector('main section:not(.hidden)');
    const nextSection = document.getElementById(tab);

    const reduceMotion = window.matchMedia &&
      window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;

    if (
      !article ||
      !oldSection ||
      !nextSection ||
      oldSection === nextSection ||
      reduceMotion ||
      !document.getElementById('bookShell')
        ?.classList.contains('open')
    ) {
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

    snapshot.querySelectorAll('[id]').forEach(
      el => el.removeAttribute('id')
    );

    snapshot.querySelectorAll(
      'input,button,textarea,select,a'
    ).forEach(el => {
      el.setAttribute('tabindex', '-1');
      el.disabled = true;
    });

    contents.appendChild(snapshot);
    paper.appendChild(contents);
    article.appendChild(paper);

    originalShowTab.call(this, tab);

    requestAnimationFrame(() => {
      paper.classList.add('gira');
    });

    setTimeout(() => {
      paper.remove();
      turning = false;
    }, 1650);
  };
})();
