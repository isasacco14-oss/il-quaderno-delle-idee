
/* Il Quaderno delle Idee - Convertitore quantità */

(function () {
  'use strict';

  const misure = {
    g: ['g', 1, 'peso'],
    gr: ['g', 1, 'peso'],
    grammi: ['g', 1, 'peso'],
    kg: ['g', 1000, 'peso'],
    ml: ['ml', 1, 'volume'],
    l: ['ml', 1000, 'volume'],
    litro: ['ml', 1000, 'volume'],
    litri: ['ml', 1000, 'volume'],
    oz: ['g', 28.3495, 'peso'],
    lb: ['g', 453.592, 'peso'],
    lbs: ['g', 453.592, 'peso'],
    tsp: ['ml', 5, 'volume'],
    tbsp: ['ml', 15, 'volume'],
    cup: ['ml', 240, 'volume'],
    cups: ['ml', 240, 'volume']
  };

  const densita = {
    farina: 125 / 240,
    zucchero: 200 / 240,
    latte: 1.03,
    acqua: 1,
    olio: 0.92,
    burro: 227 / 240,
    miele: 340 / 240,
    riso: 185 / 240
  };

  function numero(n) {
    return Number(n.toFixed(2)).toLocaleString('it-IT');
  }

  function convertiIngrediente(testo, fattore, unitaItaliane) {
    const match = String(testo).trim().match(
      /^(\d+(?:[.,]\d+)?|\d+\/\d+)\s*(.*)$/i
    );

    if (!match) {
      return { testo, nota: 'Quantità non specificata' };
    }

    const valore = match[1].includes('/')
      ? match[1].split('/').reduce((a, b) => Number(a) / Number(b))
      : Number(match[1].replace(',', '.'));

    if (!Number.isFinite(valore)) {
      return { testo, nota: 'Quantità non riconosciuta' };
    }

    let resto = match[2];
    const trovato = resto.match(/^([a-zA-Z]+)\b\s*(.*)$/);
    const unita = trovato ? trovato[1].toLowerCase() : '';
    const misura = misure[unita];

    if (!misura) {
      return { testo: numero(valore * fattore) + ' ' + resto };
    }

    if (!unitaItaliane) {
      return { testo: numero(valore * fattore) + ' ' + resto };
    }

    let quantita = valore * fattore * misura[1];
    let nuovaUnita = misura[0];
    const ingrediente = trovato[2].replace(/^di\s+/i, '').toLowerCase();

    if (misura[2] === 'volume') {
      const nome = Object.keys(densita).find(x => ingrediente.includes(x));
      if (nome && ['cup', 'cups', 'tbsp', 'tsp'].includes(unita)) {
        quantita *= densita[nome];
        nuovaUnita = 'g';
      }
    }

    if (nuovaUnita === 'g' && quantita >= 1000) {
      quantita /= 1000;
      nuovaUnita = 'kg';
    } else if (nuovaUnita === 'ml' && quantita >= 1000) {
      quantita /= 1000;
      nuovaUnita = 'l';
    }

    return {
      testo: numero(quantita) + ' ' + nuovaUnita + ' ' + trovato[2],
      nota: ['cup', 'cups', 'tbsp', 'tsp'].includes(unita)
        ? 'Conversione indicativa'
        : ''
    };
  }

  window.apriConvertitore = function (id) {
    const ricetta = recipes.find(r => String(r.id) === String(id));
    if (!ricetta) return;

    const originali = Array.isArray(ricetta.ingredients)
      ? ricetta.ingredients
      : [];

    const porzioniOriginali = Number(
      String(ricetta.servings || '').match(/\d+(?:[.,]\d+)?/)?.[0]
        ?.replace(',', '.')
    );

    const base = porzioniOriginali > 0 ? porzioniOriginali : 1;

    const sfondo = document.createElement('div');
    sfondo.style.cssText =
      'position:fixed;inset:0;z-index:99999;background:rgba(45,30,18,.65);' +
      'display:flex;align-items:center;justify-content:center;padding:18px';

    const pannello = document.createElement('div');
    pannello.style.cssText =
      'background:#f5e9cf;color:#624630;border:3px double #a68a62;' +
      'border-radius:12px;padding:24px;max-width:560px;width:100%;' +
      'max-height:85vh;overflow:auto;font-family:Georgia,serif';

    const titolo = document.createElement('h2');
    titolo.textContent = '✿ Adatta le quantità ✿';
    titolo.style.textAlign = 'center';

    const descrizione = document.createElement('p');
    descrizione.textContent =
      porzioniOriginali > 0
        ? 'Ricetta originale: ' + ricetta.servings
        : 'Porzioni originali non indicate: usa 1 come riferimento.';
    
    const etichetta = document.createElement('label');
    etichetta.textContent = 'Porzioni desiderate';

    const input = document.createElement('input');
    input.type = 'number';
    input.min = '0.5';
    input.max = '100';
    input.step = '0.5';
    input.value = String(base);
    input.style.cssText =
      'width:100%;padding:10px;margin:10px 0;color:#624630';

    const opzione = document.createElement('label');
    opzione.style.cssText =
      'display:flex;align-items:center;gap:10px;margin:15px 0';

    const check = document.createElement('input');
    check.type = 'checkbox';
    check.style.width = 'auto';

    opzione.append(check, document.createTextNode(
      'Converti anche le misure in unità italiane'
    ));

    const lista = document.createElement('ul');
    lista.style.lineHeight = '1.9';

    const avviso = document.createElement('p');
    avviso.style.fontSize = '13px';
    avviso.textContent =
      'Le quantità sono indicative. Controlla soprattutto uova, ' +
      'lievito, spezie e tempi di cottura. La ricetta originale ' +
      'non verrà modificata.';

    const chiudi = document.createElement('button');
    chiudi.type = 'button';
    chiudi.textContent = '✿ Torna alla ricetta ✿';
    chiudi.className = 'action';

    function aggiorna() {
      lista.replaceChildren();

      const nuovePorzioni = Number(input.value);
      if (!(nuovePorzioni > 0 && nuovePorzioni <= 100)) {
        const errore = document.createElement('li');
        errore.textContent = 'Inserisci un numero di porzioni valido.';
        lista.append(errore);
        return;
      }

      const fattore = nuovePorzioni / base;

      originali.forEach(ingrediente => {
        const risultato = convertiIngrediente(
          ingrediente, fattore, check.checked
        );

        const riga = document.createElement('li');
        riga.textContent = risultato.testo;

        if (risultato.nota) {
          const nota = document.createElement('small');
          nota.textContent = ' (' + risultato.nota + ')';
          nota.style.opacity = '.7';
          riga.append(nota);
        }

        lista.append(riga);
      });
    }

    input.addEventListener('input', aggiorna);
    check.addEventListener('change', aggiorna);
    chiudi.onclick = () => sfondo.remove();
    sfondo.onclick = e => {
      if (e.target === sfondo) sfondo.remove();
    };

    pannello.append(
      titolo, descrizione, etichetta, input,
      opzione, lista, avviso, chiudi
    );
    sfondo.append(pannello);
    document.body.append(sfondo);

    aggiorna();
  };
})();
