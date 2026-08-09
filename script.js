/* =====================================================================
   Two-Plant Economic Dispatch — Base/Peak Identification
   Same method as the course project's Python script: approximating the
   annual load duration curve as a straight line and minimising total
   cost with respect to the base/peak switch-over point gives a
   closed-form result for the peak plant's operating hours:

        t1 = (C_base - C_peak) / (R_peak - R_base)

   Everything below runs entirely in the browser — no server needed.
===================================================================== */

const HOURS_PER_YEAR = 8760;

/**
 * Core solver. Mirrors identify_base_and_peak() from the Python version.
 * Only needs each plant's fixed cost (Rs/kW/yr) and running cost
 * (paise/kWh) -- the answer doesn't depend on demand or load factor.
 */
function identifyBaseAndPeak({ c1, r1p, c2, r2p }) {
  const r1 = r1p / 100;   // paise -> rupees per kWh
  const r2 = r2p / 100;

  let base, peak;
  if (c1 > c2 && r1p < r2p) {
    base = { name: 'Plant 1', C: c1, R: r1 };
    peak = { name: 'Plant 2', C: c2, R: r2 };
  } else if (c2 > c1 && r2p < r1p) {
    base = { name: 'Plant 2', C: c2, R: r2 };
    peak = { name: 'Plant 1', C: c1, R: r1 };
  } else {
    const cheaper = (c1 <= c2 && r1p <= r2p) ? 'Plant 1' : 'Plant 2';
    return {
      error: `${cheaper} is cheaper on both fixed AND running cost — there's no economic case for a second plant.`
    };
  }

  // optimum switch-over point (screening-curve result)
  let t1 = (base.C - peak.C) / (peak.R - base.R);
  t1 = Math.min(Math.max(t1, 0), HOURS_PER_YEAR);

  return {
    basePlant: base.name,
    peakPlant: peak.name,
    baseHours: HOURS_PER_YEAR,
    peakHours: t1,
  };
}

/* =====================================================================
   FORM WIRING
===================================================================== */
const form = document.getElementById('dispatchForm');
const resultsPanel = document.getElementById('resultsPanel');
const readoutGrid = document.getElementById('readoutGrid');
const formError = document.getElementById('formError');

function readInputs() {
  return {
    c1: parseFloat(document.getElementById('c1').value),
    r1p: parseFloat(document.getElementById('r1').value),
    c2: parseFloat(document.getElementById('c2').value),
    r2p: parseFloat(document.getElementById('r2').value),
  };
}

function renderResults(result) {
  readoutGrid.innerHTML = '';
  resultsPanel.classList.add('is-visible');

  if (result.error) {
    readoutGrid.innerHTML = `<div class="readout readout--error">${result.error}</div>`;
    return;
  }

  const cards = [
    { label: 'Base load plant', value: result.basePlant, cls: 'cyan', sub: `runs ${result.baseHours.toLocaleString()} h/yr (the full year)` },
    { label: 'Peak load plant', value: result.peakPlant, cls: 'amber', sub: `runs ${Math.round(result.peakHours).toLocaleString()} h/yr` },
  ];

  for (const c of cards) {
    const el = document.createElement('div');
    el.className = 'readout';
    el.innerHTML = `
      <span class="readout__label">${c.label}</span>
      <span class="readout__value${c.cls ? ' readout__value--' + c.cls : ''}">${c.value}</span>
      ${c.sub ? `<div class="readout__sub">${c.sub}</div>` : ''}
    `;
    readoutGrid.appendChild(el);
  }
}

function runDispatch(e, { scroll = true } = {}) {
  if (e) e.preventDefault();
  const inputs = readInputs();

  if (Object.values(inputs).some((v) => Number.isNaN(v))) {
    formError.textContent = 'Please fill in every field with a number before computing.';
    return;
  }
  formError.textContent = '';

  const result = identifyBaseAndPeak(inputs);
  renderResults(result);
  if (scroll) resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

form.addEventListener('submit', runDispatch);

// compute once on load using the pre-filled example, so the result shows
// something meaningful right away (no need to scroll down for this one)
window.addEventListener('DOMContentLoaded', () => runDispatch(null, { scroll: false }));
