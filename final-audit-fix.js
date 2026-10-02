(() => {
  function cards() {
    return Array.from(document.querySelectorAll('#stages .stage-card'));
  }

  function allDone() {
    const list = cards();
    return list.length > 0 && list.every(card => {
      const box = card.querySelector('.done-toggle');
      return box && box.checked;
    });
  }

  function hookIsSilent() {
    const card = document.querySelector('#stages .stage-card[data-stage="HOOK"]');
    if (!card) return false;
    const corpus = [
      card.querySelector('.flow-prompt')?.value,
      card.querySelector('.text-video-prompt')?.value,
      card.dataset.textVideoPrompt,
      card.querySelector('.image-prompt')?.value,
      card.querySelector('.scene-role')?.textContent,
      card.dataset.videoScene
    ].filter(Boolean).join('\n');
    return /\bNO\s+(?:VOICE[- ]?OVER|VO|NARRATION)\b|\bSILENT\s+HOOK\b/i.test(corpus);
  }

  function narrationApproved() {
    return !!window.LDNarrationApproval?.isApproved?.();
  }

  function sendToNarration() {
    const master = document.getElementById('masterNarrationCard');
    master?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const toast = document.getElementById('toast');
    if (toast) {
      toast.textContent = 'Review and approve Smart Narration before Final Audit.';
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 1800);
    }
  }

  function decorate() {
    const list = cards();
    list.forEach((card, index) => {
      const btn = card.querySelector('.next-stage-btn');
      if (!btn) return;
      btn.textContent = index === list.length - 1 ? 'Final audit' : 'Next stage';
    });

    const topNext = document.getElementById('nextIncompleteBtn');
    if (topNext && allDone()) {
      topNext.textContent = 'Final audit';
      topNext.disabled = !narrationApproved();
      topNext.title = narrationApproved() ? '' : 'Approve Smart Narration first.';
    }

    const auditNext = document.getElementById('auditNextBtn');
    if (auditNext && allDone()) {
      auditNext.textContent = narrationApproved() ? 'Audit complete' : 'Final audit locked';
      auditNext.disabled = !narrationApproved();
      auditNext.title = narrationApproved() ? '' : 'Approve Smart Narration first.';
    }
  }

  function openAudit() {
    if (!narrationApproved()) {
      sendToNarration();
      return;
    }
    const audit = document.getElementById('auditCard');
    const banner = document.getElementById('completeBanner');
    const list = cards();
    const complete = allDone();

    if (audit) {
      audit.classList.remove('hidden');
      audit.scrollIntoView({ block: 'start' });
    }

    if (banner) banner.classList.toggle('hidden', !complete);

    const status = document.getElementById('auditStatus');
    const required = document.getElementById('requiredStatus');
    const remaining = document.getElementById('remainingStages');

    if (complete) {
      if (status) status.textContent = 'Audit passed';
      if (required) required.textContent = `${list.length}/${list.length} ready`;
      if (remaining) remaining.textContent = 'No remaining stages. All required fields are present and every stage is marked Done.';
    }

    const toast = document.getElementById('toast');
    if (toast) {
      toast.textContent = complete ? 'Final audit passed' : 'Final audit opened';
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 1600);
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

  const stages = document.getElementById('stages');
  if (stages) {
    new MutationObserver(decorate).observe(stages, { childList: true });
  }

  window.addEventListener('load', () => {
    decorate();
    setTimeout(decorate, 100);
    setTimeout(decorate, 500);
  });

  window.addEventListener('ld:narration-approval-changed', decorate);
})();
