document.addEventListener('click', function (e) {
  const btn = e.target.closest('.btn-primary');
  if (!btn) return;

  const ripple = document.createElement('span');
  ripple.classList.add('ripple');

  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  ripple.style.width  = ripple.style.height = size + 'px';
  ripple.style.left   = (e.clientX - rect.left - size / 2) + 'px';
  ripple.style.top    = (e.clientY - rect.top  - size / 2) + 'px';

  btn.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove());
});


window.setLoading = function (el, isLoading, message = 'Processing') {
  if (isLoading) {
    el.dataset.prevHtml = el.innerHTML;
    el.innerHTML = `
      <div class="ai-loading">
        <div class="ai-loading-spinner"></div>
        <span class="ai-loading-dots">
          ${message}<span>.</span><span>.</span><span>.</span>
        </span>
      </div>`;
  } else {
    if (el.dataset.prevHtml !== undefined) {
      el.innerHTML = el.dataset.prevHtml;
      delete el.dataset.prevHtml;
    }
  }
};


window.setBtnLoading = function (btn, isLoading) {
  if (isLoading) {
    btn.dataset.originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `
      <span style="display:inline-flex;align-items:center;gap:8px;justify-content:center;">
        <span style="width:16px;height:16px;border:2px solid rgba(255,255,255,0.4);
          border-top-color:#fff;border-radius:50%;
          display:inline-block;animation:spin 0.7s linear infinite;"></span>
        Processing...
      </span>`;
  } else {
    btn.disabled = false;
    if (btn.dataset.originalText) {
      btn.innerHTML = btn.dataset.originalText;
      delete btn.dataset.originalText;
    }
  }
};