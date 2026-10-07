(() => {
  const btn = document.getElementById('backupBtn');
  if (!btn) return;

  function safeName(value) {
    return (value || 'living-disaster')
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase() || 'living-disaster';
  }

  function getState() {
    const raw = localStorage.getItem('ld-autopilot-free-v1');
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }

  function showMessage(text) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add('show');
    clearTimeout(showMessage.t);
    showMessage.t = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  btn.addEventListener('click', async (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();

    const state = getState();
    if (!state || !state.stages || !Object.keys(state.stages).length) {
      showMessage('No production yet');
      return;
    }

    const filename = `${safeName(state.topic)}-backup.json`;
    const json = JSON.stringify(state, null, 2);

    try {
      const dataUrl = `data:application/json;charset=utf-8,${encodeURIComponent(json)}`;
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      link.remove();
      showMessage(`Saved as ${filename}`);
    } catch (error) {
      try {
        await navigator.clipboard.writeText(json);
        showMessage('Download blocked — backup copied instead');
      } catch {
        showMessage('Backup failed');
      }
    }
  }, true);
})();

/* Core 4 compatibility bootstrap.
   Approval persistence is global business logic, not a Halabja/P7 hotfix.
   This temporary loader can move into index.html when Core 4 owns bootstrap. */
(() => {
  if (window.NERApprovalPersistence4 || document.querySelector('script[data-ner-approval-persistence]')) return;
  const script = document.createElement('script');
  script.src = 'ner-approval-persistence-v4.js?v=4.0.7';
  script.async = false;
  script.dataset.nerApprovalPersistence = '4.0.7';
  script.onload = () => {
    const version = document.querySelector('.version');
    if (version) version.textContent = 'v4.0.7';
    window.NERApprovalPersistence4?.restore?.();
  };
  script.onerror = () => console.warn('Core 4 approval persistence failed to load.');
  document.head.appendChild(script);
})();
