/**
 * APEX ENTERPRISE PORTAL — Client Interaction & HubSpot CRM Engine
 * Dedicated client-side JavaScript (Cleanly isolated from chatbot app.js)
 */

(function() {
  'use strict';

  // ══════════════════════════════════════════════════════════════════════════
  // 1. DESK TABS (HubSpot Multi-Channel Interaction)
  // ══════════════════════════════════════════════════════════════════════════
  const deskTabs = document.querySelectorAll('.desk-tab');
  const deskPanes = document.querySelectorAll('.desk-pane');

  deskTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      deskTabs.forEach(t => t.classList.remove('active'));
      deskPanes.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const pane = document.getElementById(`pane-${target}`);
      if (pane) pane.classList.add('active');
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 2. INBOUND FORMS SUBMISSION (Guarded by Sentinel)
  // ══════════════════════════════════════════════════════════════════════════
  
  // A. Inquiry Form
  const inquiryForm = document.getElementById('inquiryForm');
  const inquiryFeedback = document.getElementById('inquiryFeedback');
  if (inquiryForm) {
    inquiryForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = inquiryForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>⚡ Transmitting to Sentinel Shield...</span>';

      const checkedMods = Array.from(inquiryForm.querySelectorAll('input[name="modules"]:checked')).map(cb => cb.value);
      const payload = {
        company: document.getElementById('inqCompany').value.trim(),
        contact_name: document.getElementById('inqContact').value.trim(),
        email: document.getElementById('inqEmail').value.trim(),
        phone: document.getElementById('inqPhone').value.trim(),
        industry: document.getElementById('inqIndustry').value,
        fleet_size: document.getElementById('inqFleet').value.trim(),
        requested_modules: checkedMods,
        notes: document.getElementById('inqNotes').value.trim()
      };

      try {
        const res = await fetch('/api/portal/inquiry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok) {
          inquiryFeedback.className = 'form-feedback success';
          inquiryFeedback.innerHTML = `✅ <strong>Inquiry ${data.inquiry_id} Logged!</strong> ${data.message} Your data is cryptographically protected.`;
          inquiryForm.reset();
        } else {
          throw new Error(data.detail || 'Failed to submit inquiry.');
        }
      } catch (err) {
        inquiryFeedback.className = 'form-feedback error';
        inquiryFeedback.innerHTML = `⚠️ <strong>Notice:</strong> ${err.message}. Please retry or contact emergency support.`;
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span class="btn-icon">⚡</span><span>Submit Inbound Request to APEX Specialists</span>';
      }
    });
  }

  // B. Demo Form
  const demoForm = document.getElementById('demoForm');
  const demoFeedback = document.getElementById('demoFeedback');
  if (demoForm) {
    demoForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = demoForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;

      const payload = {
        company: document.getElementById('demoCompany').value.trim(),
        contact_name: document.getElementById('demoName').value.trim(),
        email: document.getElementById('demoEmail').value.trim(),
        focus_area: document.getElementById('demoFocus').value,
        date: document.getElementById('demoDate').value,
        time: document.getElementById('demoTime').value
      };

      try {
        const res = await fetch('/api/portal/demo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok) {
          demoFeedback.className = 'form-feedback success';
          demoFeedback.innerHTML = `📅 <strong>Demonstration ${data.demo_id} Locked!</strong> Scheduled for ${payload.date} at ${payload.time}. Calendar invites dispatched.`;
          demoForm.reset();
        } else {
          throw new Error(data.detail || 'Demo scheduling failed.');
        }
      } catch (err) {
        demoFeedback.className = 'form-feedback error';
        demoFeedback.innerHTML = `⚠️ <strong>Notice:</strong> ${err.message}`;
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  // C. Support Ticket Form
  const supportForm = document.getElementById('supportForm');
  const supportFeedback = document.getElementById('supportFeedback');
  if (supportForm) {
    supportForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = supportForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;

      const payload = {
        company: document.getElementById('tckCompany').value.trim(),
        email: document.getElementById('tckEmail').value.trim(),
        subject: document.getElementById('tckSubject').value.trim(),
        priority: document.getElementById('tckPriority').value
      };

      try {
        const res = await fetch('/api/portal/ticket', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok) {
          supportFeedback.className = 'form-feedback success';
          supportFeedback.innerHTML = `🎫 <strong>Ticket ${data.ticket_id} Active!</strong> Assigned to Senior Systems Lead under Priority SLA.`;
          supportForm.reset();
        } else {
          throw new Error(data.detail || 'Ticket creation failed.');
        }
      } catch (err) {
        supportFeedback.className = 'form-feedback error';
        supportFeedback.innerHTML = `⚠️ <strong>Notice:</strong> ${err.message}`;
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 3. INTERACTIVE ROI CALCULATOR
  // ══════════════════════════════════════════════════════════════════════════
  const rangeLooms = document.getElementById('rangeLooms');
  const rangeMeters = document.getElementById('rangeMeters');
  const rangeScrap = document.getElementById('rangeScrap');

  const valLooms = document.getElementById('valLooms');
  const valMeters = document.getElementById('valMeters');
  const valScrap = document.getElementById('valScrap');

  const roiMonthlyDollars = document.getElementById('roiMonthlyDollars');
  const roiAnnualDollars = document.getElementById('roiAnnualDollars');
  const roiScrapCut = document.getElementById('roiScrapCut');
  const roiMetersSaved = document.getElementById('roiMetersSaved');
  const roiHoursSaved = document.getElementById('roiHoursSaved');
  const roiPayback = document.getElementById('roiPayback');

  function updateROI() {
    if (!rangeLooms || !rangeMeters || !rangeScrap) return;

    const looms = parseInt(rangeLooms.value, 10);
    const meters = parseFloat(rangeMeters.value);
    const scrap = parseFloat(rangeScrap.value);

    valLooms.textContent = `${looms} Looms`;
    valMeters.textContent = `${meters.toLocaleString()} m`;
    valScrap.textContent = `${scrap.toFixed(1)}%`;

    // 55% reduction via APEX 4-Point
    const newScrap = +(scrap * 0.45).toFixed(2);
    const scrapReduction = +(scrap - newScrap).toFixed(2);
    const monthlyMeters = meters * 26;
    const metersSaved = Math.round(monthlyMeters * (scrapReduction / 100));
    const monthlyDollars = Math.round(metersSaved * 4.20);
    const annualDollars = Math.round(monthlyDollars * 12);
    const hoursSaved = Math.round(looms * 4.5);
    const estInvestment = 4500 + (looms * 25);
    const paybackWeeks = Math.max(1.8, (estInvestment / Math.max(monthlyDollars, 100)) * 4.3).toFixed(1);

    roiMonthlyDollars.textContent = `$${monthlyDollars.toLocaleString()}`;
    roiAnnualDollars.textContent = `$${annualDollars.toLocaleString()}`;
    roiScrapCut.textContent = `${scrap.toFixed(1)}% → ${newScrap.toFixed(1)}%`;
    roiMetersSaved.textContent = `${metersSaved.toLocaleString()} m`;
    roiHoursSaved.textContent = `${hoursSaved.toLocaleString()} hrs / mo`;
    roiPayback.textContent = `${paybackWeeks} Weeks`;
  }

  if (rangeLooms) rangeLooms.addEventListener('input', updateROI);
  if (rangeMeters) rangeMeters.addEventListener('input', updateROI);
  if (rangeScrap) rangeScrap.addEventListener('input', updateROI);
  updateROI();

  // ══════════════════════════════════════════════════════════════════════════
  // 4. INTERACTIVE LIVE API SANDBOX
  // ══════════════════════════════════════════════════════════════════════════
  const sTabs = document.querySelectorAll('.s-tab');
  const sPanels = document.querySelectorAll('.s-panel');

  sTabs.forEach(t => {
    t.addEventListener('click', () => {
      const sim = t.dataset.sim;
      sTabs.forEach(tb => tb.classList.remove('active'));
      sPanels.forEach(p => p.classList.remove('active'));
      t.classList.add('active');
      const targetPanel = document.getElementById(`sim-${sim}`);
      if (targetPanel) targetPanel.classList.add('active');
    });
  });

  // Sandbox 1: Order Tracking
  const btnSimOrder = document.getElementById('btnSimOrder');
  const simOrderId = document.getElementById('simOrderId');
  const simOrderOutput = document.getElementById('simOrderOutput');
  if (btnSimOrder) {
    btnSimOrder.addEventListener('click', async () => {
      const oid = (simOrderId.value || 'ORD-8492').trim();
      simOrderOutput.textContent = `// Querying live ERP bridge for ${oid}...`;
      try {
        const res = await fetch(`/api/erp/track/${encodeURIComponent(oid)}`);
        const data = await res.json();
        simOrderOutput.textContent = JSON.stringify(data, null, 2);
      } catch (err) {
        simOrderOutput.textContent = `// Error querying order: ${err.message}`;
      }
    });
  }

  // Sandbox 2: 4-Point System
  const btnSimFourPoint = document.getElementById('btnSimFourPoint');
  const simDefects = document.getElementById('simDefects');
  const simLength = document.getElementById('simLength');
  const simWidth = document.getElementById('simWidth');
  const simFourPointOutput = document.getElementById('simFourPointOutput');
  if (btnSimFourPoint) {
    btnSimFourPoint.addEventListener('click', async () => {
      const payload = {
        defect_points: parseInt(simDefects.value || '18', 10),
        length_yards: parseFloat(simLength.value || '100'),
        width_inches: parseFloat(simWidth.value || '60')
      };
      simFourPointOutput.textContent = `// Calculating ASTM D5430 metrics...`;
      try {
        const res = await fetch('/api/erp/4point', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        simFourPointOutput.textContent = JSON.stringify(data, null, 2);
      } catch (err) {
        simFourPointOutput.textContent = `// Error calculating: ${err.message}`;
      }
    });
  }

  // Sandbox 3: Delta-E Spectro Match
  const btnSimDeltaE = document.getElementById('btnSimDeltaE');
  const simStdLab = document.getElementById('simStdLab');
  const simBatchLab = document.getElementById('simBatchLab');
  const simDeltaEOutput = document.getElementById('simDeltaEOutput');
  if (btnSimDeltaE) {
    btnSimDeltaE.addEventListener('click', async () => {
      const stdParts = (simStdLab.value || '42.5, 18.2, -24.1').split(',').map(s => parseFloat(s.trim()));
      const batchParts = (simBatchLab.value || '42.8, 18.4, -23.9').split(',').map(s => parseFloat(s.trim()));
      const payload = {
        l_std: stdParts[0] || 42.5,
        a_std: stdParts[1] || 18.2,
        b_std: stdParts[2] || -24.1,
        l_batch: batchParts[0] || 42.8,
        a_batch: batchParts[1] || 18.4,
        b_batch: batchParts[2] || -23.9
      };
      simDeltaEOutput.textContent = `// Computing CMC (2:1) color difference...`;
      try {
        const res = await fetch('/api/erp/delta-e', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        simDeltaEOutput.textContent = JSON.stringify(data, null, 2);
      } catch (err) {
        simDeltaEOutput.textContent = `// Error calculating: ${err.message}`;
      }
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 5. AI SENTINEL HEALTH TELEMETRY MODAL
  // ══════════════════════════════════════════════════════════════════════════
  const sentinelStatusPill = document.getElementById('sentinelStatusPill');
  const footerSentinelLink = document.getElementById('footerSentinelLink');
  const sentinelModal = document.getElementById('sentinelModal');
  const closeSentinelModal = document.getElementById('closeSentinelModal');

  const sentinelSafetyIndex = document.getElementById('sentinelSafetyIndex');
  const sentinelGlitchesHealed = document.getElementById('sentinelGlitchesHealed');
  const sentinelTransactions = document.getElementById('sentinelTransactions');
  const sentinelEventsLog = document.getElementById('sentinelEventsLog');

  async function openSentinelTelemetry() {
    if (!sentinelModal) return;
    sentinelModal.classList.add('open');
    try {
      const res = await fetch('/api/sentinel/health');
      if (res.ok) {
        const data = await res.json();
        if (sentinelSafetyIndex) sentinelSafetyIndex.textContent = `${data.client_data_safety_index}%`;
        if (sentinelGlitchesHealed) sentinelGlitchesHealed.textContent = data.glitches_auto_healed;
        if (sentinelTransactions) sentinelTransactions.textContent = data.atomic_transactions_secured;

        if (sentinelEventsLog && Array.isArray(data.recent_events)) {
          if (data.recent_events.length > 0) {
            sentinelEventsLog.innerHTML = data.recent_events.map(ev =>
              `<div class="log-line">⚡ [${ev.timestamp}] <strong>${ev.component}:</strong> ${ev.action} (${ev.detail})</div>`
            ).join('');
          } else {
            sentinelEventsLog.innerHTML = `<div class="log-line">🟢 Sentinel Active. Zero data anomalies recorded across all operations.</div>`;
          }
        }
      }
    } catch (_) {}
  }

  if (sentinelStatusPill) sentinelStatusPill.addEventListener('click', openSentinelTelemetry);
  if (footerSentinelLink) footerSentinelLink.addEventListener('click', openSentinelTelemetry);
  if (closeSentinelModal) closeSentinelModal.addEventListener('click', () => sentinelModal.classList.remove('open'));
  if (sentinelModal) {
    sentinelModal.addEventListener('click', (e) => {
      if (e.target === sentinelModal) sentinelModal.classList.remove('open');
    });
  }

  // Self-Healing Window Error Guard
  window.addEventListener('error', function(e) {
    console.warn('Sentinel Portal Guard intercepted anomaly:', e.message);
    try {
      fetch('/api/sentinel/report-glitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'PortalClientAnomaly',
          message: e.message || 'Script error',
          context: { source: 'portal.js', lineno: e.lineno }
        })
      }).catch(() => {});
    } catch(_) {}
  });

})();
