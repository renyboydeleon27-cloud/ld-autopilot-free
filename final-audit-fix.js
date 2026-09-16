(() => {
  function stageCards() {
    return [...document.querySelectorAll('#stages .stage-card')];
  }

  function decorateLastStageButton() {
    const cards = stageCards();
    if (!cards.length) return;

    cards.forEach((card, index) => {
      const btn = card.querySelector('.next-stage-btn');
      if (!btn) return;
      const isLast = index === cards.length - 1;
      const label = isLast ? 'Final audit' : 'Next stage';
      const flag = isLast ? 'true' : 'false';

      if (btn.textContent !== label) btn.textContent = label;
      if (btn.dataset.finalAudit !== flag) btn.dataset.finalAudit = flag;
    });
  }

  function openFinalAudit() {
    const cards = stageCards();
    const auditCard = document.getElementById('auditCard');
    const completeBanner = document.getElementById('completeBanner');

    const allDone = cards.length > 0 && cards.every(card => {
      const toggle = card.querySelector('.done-toggle');
      return !!(toggle && toggle.checked);
    });

    if (auditCard) {
      auditCard.classList.remove('hidden');
      requestAnimationFrame(() => {
        auditCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    if (completeBanner) {
      completeBanner.classList.toggle('hidden', !allDone);
    }

    const auditStatus = document.getElementById('auditStatus');
    const requiredStatus = document.getElementById('requiredStatus');
    const remainingStages = document.getElementById('remainingStages');

    if (allDone) {
      if (auditStatus) auditStatus.textContent = 'Audit passed';
      if (requiredStatus) requiredStatus.textContent = `${cards.length}/${cards.length} ready`;
      if (remainingStages) remainingStages.textContent = 'No remaining stages. All required fields are present and every stage is marked Done.';
    }
  }

  document.addEventListener('click', event => {
    const btn = event.target.closest('.next-stage-btn');
    if (!btn) return;

    const card = btn.closest('.stage-card');
    if (!card) return;

    const nextCard = card.nextElementSibling;
    if (!nextCard || btn.dataset.finalAudit === 'true') {
      event.preventDefault();
      event.stopImmediatePropagation();
      openFinalAudit();
    }
  }, true);

  const stages = document.getElementById('stages');
  if (stages) {
    const observer = new MutationObserver(mutations => {
      if (mutations.some(m => m.type === 'childList' && m.target === stages)) {
        decorateLastStageButton();
      }
    });
    observer.observe(stages, { childList: true });
  }

  window.addEventListener('load', () => {
    decorateLastStageButton();
    setTimeout(decorateLastStageButton, 50);
  });
})();
