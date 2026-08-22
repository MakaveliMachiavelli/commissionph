/* CommissionPH — PH real-estate commission take-home calculator. Vanilla JS, no deps. */
'use strict';

const PRO_CODES = ['COMMISSION-149', 'CP-DEMO'];
const LS = { pro: 'cp_pro', draft: 'cp_draft', trk: 'cp_trk' };
let pro = localStorage.getItem(LS.pro) === '1';
let deals = [];

const $ = (id) => document.getElementById(id);
const peso = (n) => '₱' + Math.round(n).toLocaleString('en-PH');
const num = (id) => Number($(id).value) || 0;

/* ============ engine (pure — tested) ============ */
function calc() {
  const price = num('price');
  const ratePct = Number($('commRate').value);
  const referral = num('referral');
  const mySharePct = Number($('myShare').value);
  const companyCutPct = Number($('companyCut').value);
  const vatReg = $('vatMode').value === 'vat';
  const cwtOn = $('cwtOn').checked;

  const gross = price * ratePct / 100;
  const afterReferral = Math.max(0, gross - referral);
  const myGrossShare = afterReferral * mySharePct / 100;
  const coBrokeShare = afterReferral - myGrossShare;
  const companyCut = myGrossShare * companyCutPct / 100;
  const net = myGrossShare - companyCut;
  const vat = vatReg ? net * 0.12 : 0;            // billed on top + remitted (net unchanged)
  const cwt = cwtOn ? net * 0.05 : 0;             // creditable withholding (2307)
  const cash = net - cwt;
  return { price, ratePct, gross, referral, afterReferral, myGrossShare, coBrokeShare,
           companyCutPct, companyCut, net, vatReg, vat, cwtOn, cwt, cash };
}

function render() {
  const c = calc();
  $('stGross').textContent = peso(c.gross);
  $('stNet').textContent = peso(c.net);
  $('stCash').textContent = peso(c.cash);
  $('p_deal').textContent = peso(c.price) + ' deal';

  const rows = [
    ['Gross commission (' + c.ratePct + '% × ' + peso(c.price) + ')', peso(c.gross)],
  ];
  if (c.referral > 0) rows.push(['Less: referral fee', '−' + peso(c.referral)]);
  if (c.myGrossShare < c.afterReferral) rows.push(['Co-broker share (' + (100 - Number($('myShare').value)) + '%)', '−' + peso(c.coBrokeShare)]);
  if (c.companyCut > 0) rows.push(['Broker-of-record / company cut (' + c.companyCutPct + '%)', '−' + peso(c.companyCut)]);
  rows.push(['<b>NET COMMISSION — sa\'yo</b>', '<b>' + peso(c.net) + '</b>']);
  if (c.cwtOn) rows.push(['Less: 5% creditable withholding (BIR 2307)', '−' + peso(c.cwt)]);
  rows.push(['<b>CASH IN HAND</b>', '<b>' + peso(c.cash) + '</b>']);
  $('p_rows').innerHTML = rows.map(([l, v]) => `<tr><td>${l}</td><td class="r">${v}</td></tr>`).join('');

  const vatNote = $('vatNote');
  if (c.vatReg) {
    vatNote.classList.remove('hidden');
    vatNote.innerHTML = `🧾 VAT-registered: mag-bill ka ng <b>+${peso(c.vat)} VAT</b> (12%) on top — remitted iyan, hindi kita. Lilitaw sa official invoice mo (<a href="https://makavelimachiavelli.github.io/invoiceph/" style="color:#92400e">InvoicePH</a>).`;
  } else vatNote.classList.add('hidden');

  const cwtNote = $('cwtNote');
  if (c.cwtOn && c.cwt > 0) {
    cwtNote.classList.remove('hidden');
    cwtNote.innerHTML = `📋 <b>2307 credit mo: ${peso(c.cwt)}</b> — kaltas ngayon, pero credit sa income tax. Hingin ang BIR Form 2307 sa payer; i-enter sa <a href="https://makavelimachiavelli.github.io/taxcalcph/" style="color:#92400e">TaxCalcPH</a> sa filing.`;
  } else cwtNote.classList.add('hidden');

  save();
}

/* ============ tracker (PRO) ============ */
function getTrk() { try { return JSON.parse(localStorage.getItem(LS.trk) || '[]'); } catch (e) { return []; } }
function setTrk(rows) { localStorage.setItem(LS.trk, JSON.stringify(rows)); renderTracker(); }
function openPay() { $('payModal').classList.remove('hidden'); $('codeMsg').textContent = ''; }
function addToTracker() {
  if (!pro) { openPay(); return; }
  const c = calc();
  const rows = getTrk();
  rows.push({ at: new Date().toISOString().slice(0, 10), price: c.price, net: c.net, cwt: c.cwt });
  setTrk(rows);
  $('trackerBox').classList.remove('hidden');
  toast('Deal naitala — sa tracker na.');
}
function renderTracker() {
  const rows = getTrk();
  if (!pro || !rows.length) { if (!pro) return; }
  $('trackerBox').classList.remove('hidden');
  $('trkBody').innerHTML = rows.map((r, i) =>
    `<tr><td>${r.at}</td><td class="r">${peso(r.price)}</td><td class="r">${peso(r.net)}</td>` +
    `<td class="r">${peso(r.cwt)}</td><td><button class="row-x" data-i="${i}">✕</button></td></tr>`).join('');
  const totNet = rows.reduce((s, r) => s + r.net, 0);
  const totCwt = rows.reduce((s, r) => s + r.cwt, 0);
  $('trkTotal').textContent = `${rows.length} deals · total net ${peso(totNet)} · total 2307 credits ${peso(totCwt)} (para sa 1701).`;
}
function trkCsv() {
  const rows = [['Date', 'Price', 'Net commission', '2307 credit']]
    .concat(getTrk().map(r => [r.at, r.price.toFixed(2), r.net.toFixed(2), r.cwt.toFixed(2)]));
  const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g,'""')}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
  a.download = 'commissionph-deals.csv'; a.click();
}

let toastT;
function toast(msg) {
  let el = $('toastEl');
  if (!el) { el = document.createElement('div'); el.id = 'toastEl'; el.className = 'save-box'; el.style.cssText = 'position:fixed;bottom:1.5rem;left:50%;transform:translateX(-50%);z-index:300'; document.body.appendChild(el); }
  el.textContent = msg; el.style.display = 'block';
  clearTimeout(toastT); toastT = setTimeout(() => el.style.display = 'none', 2200);
}

/* ============ persistence ============ */
function save() {
  try {
    localStorage.setItem(LS.draft, JSON.stringify({
      p: $('price').value, r: $('commRate').value, f: $('referral').value,
      m: $('myShare').value, c: $('companyCut').value, v: $('vatMode').value, w: $('cwtOn').checked
    }));
  } catch (e) {}
}
function load() {
  try {
    const d = JSON.parse(localStorage.getItem(LS.draft) || 'null');
    if (!d) return;
    $('price').value = d.p ?? 3000000; $('commRate').value = d.r ?? '5';
    $('referral').value = d.f ?? 0; $('myShare').value = d.m ?? '100';
    $('companyCut').value = d.c ?? '0'; $('vatMode').value = d.v ?? 'nonvat';
    $('cwtOn').checked = d.w !== false;
  } catch (e) {}
}

function applyPro() {
  $('proBadge').classList.toggle('hidden', !pro);
  $('csvBtn').classList.toggle('hidden', !pro);
}

document.addEventListener('DOMContentLoaded', () => {
  load(); applyPro(); render(); renderTracker();

  ['price','commRate','referral','myShare','companyCut','vatMode','cwtOn'].forEach(id => $(id).addEventListener('input', render));

  $('printBtn').addEventListener('click', () => window.print());
  $('trackBtn').addEventListener('click', addToTracker);
  $('csvBtn').addEventListener('click', trkCsv);
  $('clearTrk').addEventListener('click', () => { if (confirm('Burahin ang lahat ng deals?')) setTrk([]); });
  $('trkBody').addEventListener('click', e => {
    if (e.target.classList.contains('row-x')) { const rows = getTrk(); rows.splice(+e.target.dataset.i, 1); setTrk(rows); }
  });

  $('proBtn').addEventListener('click', openPay);
  $('proBtn2').addEventListener('click', openPay);
  $('payClose').addEventListener('click', () => $('payModal').classList.add('hidden'));
  $('codeBtn').addEventListener('click', () => {
    const code = $('codeInput').value.trim().toUpperCase();
    if (PRO_CODES.map(c => c.toUpperCase()).includes(code)) {
      pro = true; localStorage.setItem(LS.pro, '1'); applyPro(); renderTracker();
      $('codeMsg').textContent = '✓ PRO unlocked — deal tracker + CSV active.';
      $('codeMsg').className = 'code-msg ok';
      setTimeout(() => $('payModal').classList.add('hidden'), 1500);
    } else {
      $('codeMsg').textContent = 'Mali ang code — check ang GCash confirmation.';
      $('codeMsg').className = 'code-msg bad';
    }
  });
  $('codeInput').addEventListener('keydown', e => { if (e.key === 'Enter') $('codeBtn').click(); });
  document.querySelectorAll('.modal').forEach(m => m.addEventListener('click', e => { if (e.target === m) m.classList.add('hidden'); }));
});
