/**
 * shared-config.js
 * 관리자 페이지(admin.html) localStorage 설정을 모든 템플릿에 반영
 * config.js 다음, script.js 이전에 로드됨
 */
(function () {
  if (typeof CONFIG === 'undefined') return;

  /* ── 연락처 → CONFIG 반영 ── */
  const contact = JSON.parse(localStorage.getItem('contact_info') || 'null');
  if (contact) {
    if (contact.groom[0]) CONFIG.groom.name   = contact.groom[0].name;
    if (contact.groom[1]) CONFIG.groom.father = contact.groom[1].name;
    if (contact.groom[2]) CONFIG.groom.mother = contact.groom[2].name;
    if (contact.bride[0]) CONFIG.bride.name   = contact.bride[0].name;
    if (contact.bride[1]) CONFIG.bride.father = contact.bride[1].name;
    if (contact.bride[2]) CONFIG.bride.mother = contact.bride[2].name;
  }

  /* ── 계좌 → CONFIG 반영 ── */
  const account = JSON.parse(localStorage.getItem('account_info') || 'null');
  if (account && CONFIG.accounts) {
    CONFIG.accounts.groom = account.groom.map(a => ({
      role: a.relation, name: a.name, bank: a.bank, number: a.number
    }));
    CONFIG.accounts.bride = account.bride.map(a => ({
      role: a.relation, name: a.name, bank: a.bank, number: a.number
    }));
  }

  /* ── 갤러리 사진 (GitHub raw URL) ── */
  const gallery = JSON.parse(localStorage.getItem('gallery_order') || 'null');
  if (gallery && gallery.length) {
    window.__ADMIN_GALLERY = gallery.map(function (path) {
      return path.startsWith('http') ? path
        : 'https://raw.githubusercontent.com/yururu422/Wedding/main/' + path;
    });
  }

  /* ── 표지 사진 ── */
  const heroUrl = localStorage.getItem('hero_img_url');
  if (heroUrl) window.__ADMIN_HERO = heroUrl;

  /* ── 사진 회전 (MutationObserver로 모든 템플릿에 자동 적용) ── */
  const rots = JSON.parse(localStorage.getItem('photo_rotations') || '{}');
  window.__ADMIN_ROTATIONS = rots;

  function applyRotationToImg(img) {
    if (!img.src) return;
    const name = decodeURIComponent(img.src.split('/').pop().split('?')[0]);
    const deg = rots[name];
    if (deg) img.style.transform = 'rotate(' + deg + 'deg)';
  }

  const rotObserver = new MutationObserver(function (mutations) {
    mutations.forEach(function (m) {
      m.addedNodes.forEach(function (node) {
        if (node.nodeType !== 1) return;
        if (node.tagName === 'IMG') applyRotationToImg(node);
        node.querySelectorAll && node.querySelectorAll('img').forEach(applyRotationToImg);
      });
    });
  });

  document.addEventListener('DOMContentLoaded', function () {
    rotObserver.observe(document.body, { childList: true, subtree: true });
    document.querySelectorAll('img').forEach(applyRotationToImg);
  });
})();
