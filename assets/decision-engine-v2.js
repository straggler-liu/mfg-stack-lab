(() => {
  const $ = (selector) => document.querySelector(selector);
  const value = (form, key) => String(new FormData(form).get(key) || '');
  const escapeHtml = (input) => String(input).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  })[character]);

  function validUrl(input) {
    try {
      const url = new URL(input);
      return /^https?:$/.test(url.protocol);
    } catch {
      return false;
    }
  }

  function buildMap(stack, pain, model, time) {
    let path = 'Keep the stack lightweight for now';
    let why = 'Your current facts do not yet justify adding ERP weight.';
    let risk = 'Do not buy a larger system before the operating constraint is isolated.';
    const pilot = 'Test one quote/order through purchasing, material issue, production status and actual cost.';
    let missing = 'How many BOM levels and production steps must the system plan?';

    if (stack === 'quickbooks' || stack === 'spreadsheets') {
      if (pain === 'inventory') {
        path = 'Inventory-first system, with manufacturing kept light';
        why = 'The first boundary appears to be purchasing, stock visibility and shortage control rather than deep production planning.';
        risk = 'Adding a full ERP can create migration and process overhead before the inventory problem is solved.';
        missing = 'Do you need multi-level BOM planning or mainly reliable stock/purchasing?';
      }

      if (['planning', 'costing', 'traceability'].includes(pain) || ['mto', 'batch', 'complex'].includes(model)) {
        path = 'Light-to-full MRP evaluation';
        why = 'The operating problem has crossed from accounting/inventory into production execution, planning, traceability or actual-cost control.';
        risk = 'A light inventory app may improve stock visibility but still leave scheduling, WIP or costing outside the system.';
        missing = 'Do routings/capacity or multi-level BOM explosions materially drive purchasing and delivery dates?';
      }
    }

    if (stack === 'inventory') {
      path = ['planning', 'costing', 'traceability'].includes(pain)
        ? 'MRP evaluation'
        : 'Strengthen the inventory layer before ERP';
      why = path === 'MRP evaluation'
        ? 'The constraint sits downstream of inventory visibility and now requires production control.'
        : 'The current evidence still points to inventory discipline rather than full manufacturing planning.';
      risk = path === 'MRP evaluation'
        ? 'Do not assume the current inventory tool can become a production system through workarounds.'
        : 'Avoid replacing the whole stack if purchasing, locations and replenishment are the real problem.';
      missing = 'Which production decision is still being managed outside the inventory system?';
    }

    if (stack === 'mrp') {
      path = pain === 'stabilization' || pain === 'integration'
        ? 'Stabilize and integrate the current MRP before replacement'
        : 'Test current MRP gaps before considering deeper ERP';
      why = 'A system already exists, so replacement should require evidence that the remaining problem is structural rather than implementation, data or process ownership.';
      risk = 'Replacing a workable MRP can reset master data and adoption without fixing ownership problems.';
      missing = 'Which specific workflow still requires spreadsheets, manual re-entry or offline decisions?';
    }

    if (stack === 'erp') {
      path = 'ERP implementation / process-control review before replacement';
      why = 'The default hypothesis is not "buy another ERP". The first question is whether rollout, master data, integration, adoption or process ownership is creating the gap.';
      risk = 'A replacement project can reproduce the same governance failure at higher cost.';
      missing = 'Is the failure primarily configuration, data, integration, adoption or an actual product capability gap?';
    }

    if (model === 'complex' && ['spreadsheets', 'quickbooks', 'inventory'].includes(stack)) {
      path = 'Deeper MRP / ERP evaluation';
      why = 'Multi-site or complex manufacturing raises the coordination burden across planning, inventory, costing and master data.';
      risk = 'A lightweight layer may become a new reconciliation point rather than the system of record.';
    }

    const urgency = time === 'now'
      ? 'Active 0–30 day decision'
      : time === 'soon'
        ? 'Active 31–90 day evaluation'
        : 'Research stage';

    return { path, why, risk, pilot, missing, urgency };
  }

  function buildReview(host, map, form) {
    const lines = [
      'MFG Decision Map review request',
      `Company: ${host}`,
      `Current stack: ${value(form, 'stack')}`,
      `Primary constraint: ${value(form, 'pain')}`,
      `Manufacturing model: ${value(form, 'model')}`,
      `Decision timing: ${value(form, 'time')}`,
      `Initial path: ${map.path}`,
      `Missing fact: ${map.missing}`,
      '',
      'Please review this initial map and send me a concise 3-point fit/non-fit note.'
    ];
    const subject = `Decision Map review | ${host}`;
    const body = lines.join('\n');

    return {
      body,
      href: `mailto:liuambition982+mfgstacklab@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    };
  }

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
  }

  function render() {
    const form = $('#de-form');
    const result = $('#de-result');
    const companyUrl = $('#company-url').value.trim();
    const required = ['stack', 'pain', 'model', 'time'];

    if (!validUrl(companyUrl) || required.some((key) => !value(form, key))) {
      result.style.display = 'block';
      result.innerHTML = '<b>Enter a valid company URL and answer all four operating questions.</b>';
      return;
    }

    const decisionMap = buildMap(
      value(form, 'stack'),
      value(form, 'pain'),
      value(form, 'model'),
      value(form, 'time')
    );
    let host = 'the company';

    try {
      host = new URL(companyUrl).hostname.replace(/^www\./, '');
    } catch {}

    const review = buildReview(host, decisionMap, form);
    result.style.display = 'block';
    result.innerHTML = `
      <span class="tag">${escapeHtml(decisionMap.urgency)}</span>
      <h2>${escapeHtml(decisionMap.path)}</h2>
      <p><b>Company anchor:</b> ${escapeHtml(host)}</p>
      <p><b>First decision boundary:</b> ${escapeHtml(decisionMap.why)}</p>
      <p><b>Do not over-buy:</b> ${escapeHtml(decisionMap.risk)}</p>
      <p><b>Best next pilot:</b> ${escapeHtml(decisionMap.pilot)}</p>
      <p><b>One missing fact that could change the recommendation:</b> ${escapeHtml(decisionMap.missing)}</p>
      <div class="actions">
        <a class="btn btn-primary" href="${review.href}">Open free review request</a>
        <button type="button" class="btn btn-secondary" id="de-copy-review">Copy review request</button>
        <a class="btn btn-secondary" href="fit-check.html?utm_source=decision-engine-v2&utm_campaign=initial-map">Run the deeper fit check</a>
      </div>
      <p class="fine">Send the copied request to <b>liuambition982+mfgstacklab@gmail.com</b>. Nothing is transmitted unless you choose to send it. This initial map uses only the facts entered in this browser; no company website content was fetched.</p>
    `;

    $('#de-copy-review')?.addEventListener('click', async (event) => {
      const button = event.currentTarget;
      try {
        await copyText(review.body);
        button.textContent = 'Copied — paste into your email';
      } catch {
        button.textContent = 'Copy failed — select the email address below';
      }
    });

    result.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.dispatchEvent(new CustomEvent('mfg:v2', {
      detail: {
        event: 'MAP_COMPLETED_LOCAL',
        host,
        path: decisionMap.path,
        time: value(form, 'time')
      }
    }));
  }

  document.addEventListener('DOMContentLoaded', () => {
    $('#de-run')?.addEventListener('click', render);
    window.dispatchEvent(new CustomEvent('mfg:v2', {
      detail: { event: 'LANDING_VIEW', page: 'decision-engine-v2' }
    }));
  });
})();
