/**
 * shared-config.js
 * 관리자 페이지(admin.html) localStorage 설정을 모든 템플릿에 반영
 * config.js 다음, script.js 이전에 로드됨
 */
(function () {
  if (typeof CONFIG === 'undefined') return;

  /* ── 기본정보 → CONFIG 반영 ── */
  const info = JSON.parse(localStorage.getItem('wedding_info') || 'null');
  if (info) {
    CONFIG.groom.name   = info.groom   || CONFIG.groom.name;
    CONFIG.groom.father = info.groomFather || CONFIG.groom.father;
    CONFIG.groom.mother = info.groomMother || CONFIG.groom.mother;
    CONFIG.bride.name   = info.bride   || CONFIG.bride.name;
    CONFIG.bride.father = info.brideFather || CONFIG.bride.father;
    CONFIG.bride.mother = info.brideMother || CONFIG.bride.mother;
    if (CONFIG.wedding) {
      CONFIG.wedding.date    = info.date    || CONFIG.wedding.date;
      CONFIG.wedding.time    = info.time    || CONFIG.wedding.time;
      CONFIG.wedding.venue   = info.venue   || CONFIG.wedding.venue;
      CONFIG.wedding.hall    = info.hall    || CONFIG.wedding.hall;
      CONFIG.wedding.address = info.address || CONFIG.wedding.address;
    }
    if (CONFIG.greeting) {
      CONFIG.greeting.content = info.greeting     || CONFIG.greeting.content;
      CONFIG.greeting.title   = info.greetingTitle|| CONFIG.greeting.title;
    }
    if (CONFIG.story) {
      CONFIG.story.title   = info.storyTitle || CONFIG.story.title;
      CONFIG.story.content = info.story      || CONFIG.story.content;
    }
    if (info.kakao || info.naver) {
      if (!CONFIG.wedding.mapLinks) CONFIG.wedding.mapLinks = {};
      if (info.kakao) CONFIG.wedding.mapLinks.kakao = info.kakao;
      if (info.naver) CONFIG.wedding.mapLinks.naver = info.naver;
    }
  }

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

  /* ── 갤러리 사진 ── */
  var GH_BASE = 'https://yururu422.github.io/Wedding/';
  var GH_API  = 'https://api.github.com/repos/yururu422/Wedding/contents/photos';

  function fixGalleryUrl(path) {
    if (path.startsWith('http')) return path;
    var name = decodeURIComponent(path.split('/').pop());
    return GH_BASE + 'photos/' + encodeURIComponent(name);
  }

  var gallery = JSON.parse(localStorage.getItem('gallery_order') || 'null');
  if (gallery && gallery.length) {
    window.__ADMIN_GALLERY = gallery.map(fixGalleryUrl);
  } else {
    // localStorage 없으면 GitHub API에서 자동 로드
    // Promise로 설정해도 템플릿이 Promise.resolve()로 감싸므로 그대로 작동
    window.__ADMIN_GALLERY = fetch(GH_API)
      .then(function(r){ return r.json(); })
      .then(function(files){
        return files
          .filter(function(f){ return /\.(jpg|jpeg|png|gif|webp)$/i.test(f.name); })
          .map(function(f){ return GH_BASE + 'photos/' + encodeURIComponent(f.name); });
      })
      .catch(function(){ return []; });
  }

  /* ── 표지 사진 ── */
  var heroUrl = localStorage.getItem('hero_img_url');
  if (heroUrl) {
    window.__ADMIN_HERO = heroUrl;
  } else {
    // localStorage 없으면 GitHub API 첫 번째 사진으로 자동 설정
    window.__ADMIN_HERO_PROMISE = fetch(GH_API)
      .then(function(r){ return r.json(); })
      .then(function(files){
        var imgs = files.filter(function(f){ return /\.(jpg|jpeg|png|gif|webp)$/i.test(f.name); });
        return imgs.length ? GH_BASE + 'photos/' + encodeURIComponent(imgs[0].name) : null;
      })
      .catch(function(){ return null; });
  }

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

    /* ── 표지 사진 강제 적용 (script.js initHero 이후) ── */
    function applyHero(url) {
      if (!url) return;
      var el = document.getElementById('heroPhoto') || document.getElementById('hero-img');
      if (el) el.src = url;
    }
    setTimeout(function() {
      if (window.__ADMIN_HERO) {
        applyHero(window.__ADMIN_HERO);
      } else if (window.__ADMIN_HERO_PROMISE) {
        window.__ADMIN_HERO_PROMISE.then(applyHero);
      }
    }, 0);

    /* ── 음악 플레이어 ── */
    var musicUrl = localStorage.getItem('music_url');
    if (musicUrl) {
      var audio = document.createElement('audio');
      audio.id = 'bgm'; audio.loop = true; audio.preload = 'none';
      audio.src = musicUrl;
      document.body.appendChild(audio);

      var mBtn = document.createElement('button');
      mBtn.id = 'music-btn';
      mBtn.textContent = '♪';
      mBtn.style.cssText = 'position:fixed;bottom:84px;right:18px;z-index:9999;width:44px;height:44px;border-radius:50%;border:none;cursor:pointer;background:rgba(100,100,100,.75);backdrop-filter:blur(8px);color:#fff;font-size:18px;box-shadow:0 2px 12px rgba(0,0,0,.2);display:flex;align-items:center;justify-content:center;';
      document.body.appendChild(mBtn);

      var _started = false;
      function _startOnce(){ if(_started)return; _started=true; audio.play().catch(function(){}); }
      document.addEventListener('touchstart', _startOnce, {once:true});
      document.addEventListener('click',      _startOnce, {once:true});
      mBtn.addEventListener('click', function(e){
        e.stopPropagation();
        if(audio.paused){ audio.play(); mBtn.textContent='♪'; }
        else            { audio.pause(); mBtn.textContent='♩'; }
      });
    }

    /* 사진 저장/확대 차단 */
    var style = document.createElement('style');
    style.textContent = 'img{-webkit-touch-callout:none;-webkit-user-select:none;user-select:none;pointer-events:none;}';
    document.head.appendChild(style);
    document.addEventListener('contextmenu', function(e){ if(e.target.tagName==='IMG') e.preventDefault(); });
    document.addEventListener('dragstart',   function(e){ if(e.target.tagName==='IMG') e.preventDefault(); });
    document.addEventListener('selectstart', function(e){ if(e.target.tagName==='IMG') e.preventDefault(); });
  });
})();
