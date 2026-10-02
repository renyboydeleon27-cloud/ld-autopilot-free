(() => {
  const stages = document.getElementById('stages');

  function cards() {
    return Array.from(document.querySelectorAll('#stages .stage-card'));
  }

  function topic() {
    return String(
      document.getElementById('topic')?.value ||
      document.getElementById('projectTitle')?.textContent ||
      ''
    ).trim();
  }

  function format() {
    return document.getElementById('format')?.value || 'shorts';
  }

  function allDone() {
    const list = cards();
    return list.length > 0 && list.every(card => {
      const box = card.querySelector('.done-toggle');
      return box && box.checked;
    });
  }

  function productionReady() {
    if (!allDone()) return false;
    const list = cards();
    const required = document.getElementById('requiredStatus');
    if (!required) return true;
    return String(required.textContent || '').includes(list.length + '/' + list.length + ' ready');
  }

  function narrationApproved() {
    return !!window.LDNarrationApproval?.isApproved?.();
  }

  function hash(value) {
    const s = String(value || '');
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(36);
  }

  function finalAuditSignature() {
    const stageParts = cards().map(card => [
      card.dataset.stage || '',
      card.querySelector('.done-toggle')?.checked ? '1' : '0',
      card.querySelector('.narration')?.value || '',
      card.querySelector('.image-prompt')?.value || '',
      card.querySelector('.flow-prompt')?.value || '',
      card.dataset.textVideoPrompt || '',
      card.dataset.videoScene || '',
      card.dataset.textVideoSignature || ''
    ].join('\u241f'));
    const narrationSignature = window.LDNarrationApproval?.signature?.() || '';
    const locks = JSON.stringify(window.ldProjectLocks || {});
    return hash([topic(), format(), narrationSignature, locks, ...stageParts].join('\u241e'));
  }

  function isPassed() {
    const state = window.ldFinalAuditState;
    return !!state &&
      state.topic === topic() &&
      state.format === format() &&
      state.signature === finalAuditSignature() &&
      narrationApproved() &&
      productionReady();
  }

  function saveState() {
    try { window.LDCore?.saveCurrent?.(); } catch {}
  }

  function emitState() {
    window.dispatchEvent(new CustomEvent('ld:final-audit-changed', {
      detail: {
        passed: isPassed(),
        state: window.ldFinalAuditState || null
      }
    }));
  }

  function clearPassedState() {
    if (!window.ldFinalAuditState) return;
    window.ldFinalAuditState = null;
    saveState();
    emitState();
  }

  function markPassed() {
    window.ldFinalAuditState = {
      version: '1.0',
      topic: topic(),
      format: format(),
      signature: finalAuditSignature(),
      passedAt: new Date().toISOString()
    };
    saveState();
    emitState();
  }

  function resultBanner() {
    const audit = document.getElementById('auditCard');
    if (!audit) return null;
    let el = document.getElementById('finalAuditResult');
    if (!el) {
      el = document.createElement('div');
      el.id = 'finalAuditResult';
      el.style.cssText = 'margin:12px 0;padding:12px 14px;border-radius:12px;font-weight:700;line-height:1.4;';
      const auditNext = document.getElementById('auditNextBtn');
      if (auditNext?.parentNode === audit) audit.insertBefore(el, auditNext);
      else audit.appendChild(el);
    }
    return el;
  }

  function updateResultBanner() {
    const el = resultBanner();
    if (!el) return;
    if (isPassed()) {
      el.hidden = false;
      el.style.background = 'rgba(34,197,94,.14)';
      el.style.border = '1px solid rgba(34,197,94,.65)';
      el.textContent = '✅ FINAL AUDIT PASSED — Production verified. Ready for backup.';
      return;
    }
    el.hidden = true;
  }

  function sendToNarration() {
    const master = document.getElementById('masterNarrationCard');
    master?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const toast = document.getElementById('toast');
    if (toast) {
      toast.textContent = 'Final Audit is locked until Smart Narration is approved.';
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2200);
    }
  }

  function decorate() {
    if (window.ldFinalAuditState && !isPassed()) {
      const state = window.ldFinalAuditState;
      const stillSameProject = state.topic === topic() && state.format === format();
      if (!stillSameProject || state.signature !== finalAuditSignature() || !narrationApproved() || !productionReady()) {
        window.ldFinalAuditState = null;
        saveState();
        emitState();
      }
    }

    const list = cards();
    list.forEach((card, index) => {
      const btn = card.querySelector('.next-stage-btn');
      if (!btn) return;
      btn.textContent = index === list.length - 1 ? 'Final audit' : 'Next stage';
    });

    const passed = isPassed();
    const approved = narrationApproved();

    const topNext = document.getElementById('nextIncompleteBtn');
    if (topNext && allDone()) {
      topNext.disabled = false;
      topNext.textContent = passed ? '✅ Final audit passed' : (approved ? 'Run final audit' : 'Final audit locked');
      topNext.title = passed ? 'Final Audit passed. Ready for backup.' : (approved ? 'Run the final verification.' : 'Approve Smart Narration first.');
    }

    const auditNext = document.getElementById('auditNextBtn');
    if (auditNext && allDone()) {
      auditNext.disabled = false;
      auditNext.textContent = passed ? '✅ Final audit passed' : (approved ? 'Run final audit' : 'Final audit locked');
      auditNext.title = passed ? 'Final Audit passed. Ready for backup.' : (approved ? 'Run the final verification.' : 'Approve Smart Narration first.');
    }

    updateResultBanner();
  }

  function openAudit() {
    const audit = document.getElementById('auditCard');
    const banner = document.getElementById('completeBanner');
    const list = cards();
    const complete = allDone();

    if (!narrationApproved()) {
      decorate();
      sendToNarration();
      return;
    }

    if (!complete || !productionReady()) {
      if (audit) {
        audit.classList.remove('hidden');
        audit.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      const status = document.getElementById('auditStatus');
      if (status) status.textContent = 'Final audit needs attention';
      const toast = document.getElementById('toast');
      if (toast) {
        toast.textContent = 'Final Audit stopped: finish all required production fields first.';
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2400);
      }
      return;
    }

    markPassed();

    if (audit) {
      audit.classList.remove('hidden');
      audit.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (banner) banner.classList.toggle('hidden', !complete);

    const status = document.getElementById('auditStatus');
    const required = document.getElementById('requiredStatus');
    const remaining = document.getElementById('remainingStages');

    if (status) status.textContent = '✅ FINAL AUDIT PASSED';
    if (required) required.textContent = `${list.length}/${list.length} ready`;
    if (remaining) remaining.textContent = 'Final Audit approved. Production, required fields, Done states, and Smart Narration are complete. Ready for backup.';

    window.LDProductionDNA?.refreshFinalCheck?.();
    window.LDFinalPackage?.refresh?.();
    decorate();

    const toast = document.getElementById('toast');
    if (toast) {
      toast.textContent = '✅ Final Audit passed — ready for backup';
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2600);
    }
  }

  document.addEventListener('click', event => {
    const stageBtn = event.target.closest('.next-stage-btn');
    if (stageBtn) {
      const card = stageBtn.closest('.stage-card');
      if (card && !card.nextElementSibling) {
        event.preventDefault();
        event.stopImmediatePropagation();
        openAudit();
        return;
      }
    }

    const topNext = event.target.closest('#nextIncompleteBtn');
    if (topNext && allDone()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      openAudit();
      return;
    }

    const auditNext = event.target.closest('#auditNextBtn');
    if (auditNext && allDone()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      openAudit();
    }
  }, true);

  function invalidateOnEdit(event) {
    if (!event.target.closest?.('#stages')) return;
    if (!window.ldFinalAuditState) return;
    setTimeout(decorate, 0);
  }

  document.addEventListener('input', invalidateOnEdit);
  document.addEventListener('change', invalidateOnEdit);

  if (stages) {
    new MutationObserver(() => decorate()).observe(stages, { childList: true, subtree: true });
  }

  window.addEventListener('ld:narration-approval-changed', () => {
    if (!narrationApproved()) clearPassedState();
    decorate();
  });
  window.addEventListener('ld:production-built', () => setTimeout(decorate, 80));
  window.addEventListener('load', () => {
    decorate();
    setTimeout(decorate, 100);
    setTimeout(decorate, 500);
  });

  window.LDFinalAudit = {
    run: openAudit,
    isPassed,
    refresh: decorate,
    signature: finalAuditSignature
  };
})();