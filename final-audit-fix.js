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
      btn.textContent = isLast ? 'Final audit' : 'Next stage';
      btn.dataset.finalAudit = isLast ? 'true' : 'false';
    });
  }

  function openFinalAudit() {
    const cards = stageCards();
    const auditCard = document.getElementById('auditCard');
    const completeBanner = document.getElementById('completeBanner');

    if (typeof window.updateStats === 'function') {
      window.updateStats();
    }

    if (auditCard) {
      auditCard.classList.remove('hidden');
      auditCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    const allDone = cards.length > 0 && cards.every(card => {
      const toggle = card.querySelector('.done-toggle');
      return toggle && toggle.checked;
    });

    if (allDone && completeBanner) completeBanner.classList.remove('hidden');

    if (typeof window.showToast === 'function') {
      window.showToast(allDone ? 'Final audit passed' : 'Final audit opened');
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
      openFinalAudit();
    }
  }, true);

  const stages = document.getElementById('stages');
  if (stages) {
    new MutationObserver(decorateLastStageButton).observe(stages, {
      childList: true,
      subtree: true
    });
  }

  window.addEventListener('load', () => {
    decorateLastStageButton();
    setTimeout(decorateLastStageButton, 0);
  });
})();
