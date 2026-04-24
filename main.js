(() => {
  'use strict';

  // ---------- 1. Scroll progress bar ----------
  const progressBar = document.getElementById('scrollProgress');
  const rotator = document.querySelector('.scroll-rotator');

  let ticking = false;

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(updateScrollEffects);
      ticking = true;
    }
  }

  function updateScrollEffects() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = Math.min(scrollTop / docHeight, 1);

    // Barra de progreso
    progressBar.style.width = (progress * 100) + '%';

    // Elemento tipográfico rotatorio: rota hasta 540deg y escala suavemente
    // A medida que se avanza el scroll, el elemento "fit." gira y crece.
    if (rotator) {
      const rotation = progress * 540; // 1.5 vueltas completas
      const scale = 1 + progress * 0.4; // de 1 a 1.4
      const opacity = 0.08 + progress * 0.09;
      rotator.style.setProperty('--scroll-rot', rotation + 'deg');
      rotator.style.setProperty('--scroll-scale', scale);
      rotator.style.opacity = opacity;
    }

    ticking = false;
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  updateScrollEffects();

  // ---------- 2. Scroll-triggered reveal (IntersectionObserver) ----------
  const revealTargets = document.querySelectorAll('.reveal, .reveal-stagger');

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -60px 0px'
  });

  revealTargets.forEach(el => io.observe(el));

  // ---------- 2b. Pesas flotantes: fade in/out según scroll ----------
  const floatTargets = document.querySelectorAll('.float-weight');
  const floatIO = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      entry.target.classList.toggle('is-visible', entry.isIntersecting);
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -10% 0px'
  });
  floatTargets.forEach(el => floatIO.observe(el));

  // ---------- 3. Cursor follower (solo en hover devices) ----------
  const cursor = document.getElementById('cursor');
  const isHoverDevice = window.matchMedia('(hover: hover)').matches;

  if (isHoverDevice && cursor) {
    let mouseX = 0, mouseY = 0;
    let curX = 0, curY = 0;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    function animateCursor() {
      curX += (mouseX - curX) * 0.18;
      curY += (mouseY - curY) * 0.18;
      cursor.style.left = curX + 'px';
      cursor.style.top = curY + 'px';
      requestAnimationFrame(animateCursor);
    }
    animateCursor();

    // Escalar cursor al pasar sobre elementos interactivos
    document.querySelectorAll('a, button, .service, .pillar').forEach(el => {
      el.addEventListener('mouseenter', () => {
        cursor.style.transform = 'translate(-50%, -50%) scale(1.8)';
        cursor.style.background = 'var(--fg)';
      });
      el.addEventListener('mouseleave', () => {
        cursor.style.transform = 'translate(-50%, -50%) scale(1)';
        cursor.style.background = 'var(--accent)';
      });
    });
  }

  // ---------- 4. Smooth anchor scroll con offset ----------
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ---------- 5. Formulario de suscripción (Supabase) ----------
  const SUPABASE_URL = 'https://qmhhumtnvgocktacgxao.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_ioHeTOusppm0RkqiELhwAg_IftXD6Vk';

  const subscribeForm  = document.getElementById('subscribeForm');
  const subscribeMsg   = document.getElementById('subscribeMsg');
  const subscribeInput = document.getElementById('subscribeEmail');

  if (subscribeForm && window.supabase) {
    const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    const button = subscribeForm.querySelector('button');
    const originalLabel = button.textContent;

    const showMsg = (text, color) => {
      subscribeMsg.textContent = text;
      subscribeMsg.style.color = color;
    };

    subscribeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = subscribeInput.value.trim();

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showMsg('Por favor ingresa un correo válido.', 'crimson');
        return;
      }

      button.disabled = true;
      button.textContent = 'Enviando…';
      showMsg('', '');

      const { error } = await client
        .from('suscriptores')
        .insert({ email });

      if (error) {
        console.error('[Supabase]', error);
        button.disabled = false;
        button.textContent = originalLabel;
        showMsg('Hubo un problema al enviar. Intenta de nuevo.', 'crimson');
        return;
      }

      button.textContent = 'Enviado ✓';
      showMsg('¡Gracias! Te contactaremos pronto.', '#2a8c5f');
      subscribeInput.value = '';
    });
  }

})();