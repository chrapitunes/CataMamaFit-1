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

  // ---------- 5. Cliente Supabase (compartido) ----------
  const SUPABASE_URL = 'https://qmhhumtnvgocktacgxao.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_ioHeTOusppm0RkqiELhwAg_IftXD6Vk';
  const supa = window.supabase
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
    : null;

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // ---------- 5a. Formulario de suscripción ----------
  const subscribeForm  = document.getElementById('subscribeForm');
  const subscribeMsg   = document.getElementById('subscribeMsg');
  const subscribeInput = document.getElementById('subscribeEmail');

  if (subscribeForm && supa) {
    const button = subscribeForm.querySelector('button');
    const originalLabel = button.textContent;

    const showMsg = (text, color) => {
      subscribeMsg.textContent = text;
      subscribeMsg.style.color = color;
    };

    subscribeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = subscribeInput.value.trim();

      if (!email || !isValidEmail(email)) {
        showMsg('Por favor ingresa un correo válido.', 'crimson');
        return;
      }

      button.disabled = true;
      button.textContent = 'Enviando…';
      showMsg('', '');

      const { error } = await supa.from('suscriptores').insert({ email });

      if (error) {
        if (error.code === '23505') {
          button.textContent = 'Ya registrado ✓';
          showMsg('Este correo ya está en nuestra lista. ¡Gracias!', '#2a8c5f');
          subscribeInput.value = '';
          return;
        }
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

  // ---------- 6. Carrito de compras ----------
  const cart = [];
  const cartButton    = document.getElementById('cartButton');
  const cartCount     = document.getElementById('cartCount');
  const cartModal     = document.getElementById('cartModal');
  const cartList      = document.getElementById('cartList');
  const cartEmpty     = document.getElementById('cartEmpty');
  const cartTotalEl   = document.getElementById('cartTotal');
  const cartTotalWrap = document.getElementById('cartTotalWrap');
  const cartForm      = document.getElementById('cartForm');
  const cartEmail     = document.getElementById('cartEmail');
  const cartSubmit    = document.getElementById('cartSubmit');
  const cartMsg       = document.getElementById('cartMsg');
  const planButtons   = document.querySelectorAll('.plan__cta');

  const updateBadge = () => {
    cartCount.hidden = cart.length === 0;
    cartCount.textContent = cart.length;
  };

  const updatePlanButtons = () => {
    planButtons.forEach(btn => {
      const inCart = cart.some(item => item.plan === btn.dataset.plan);
      btn.disabled = inCart;
      btn.textContent = inCart ? '✓ En el carrito' : 'Añadir al carrito';
      btn.classList.toggle('is-in-cart', inCart);
    });
  };

  const renderCartItems = () => {
    cartList.innerHTML = '';

    if (cart.length === 0) {
      cartEmpty.hidden = false;
      cartTotalWrap.hidden = true;
      cartForm.hidden = true;
      return;
    }

    cartEmpty.hidden = true;
    cartTotalWrap.hidden = false;
    cartForm.hidden = false;

    let total = 0;
    cart.forEach((item, idx) => {
      total += item.price;
      const row = document.createElement('div');
      row.className = 'cart-item';
      row.innerHTML = `
        <div class="cart-item__info">
          <span class="cart-item__name">Plan ${item.plan}</span>
          <span class="cart-item__price">$${item.price} / mes</span>
        </div>
        <button type="button" class="cart-item__remove" data-remove="${idx}" aria-label="Quitar del carrito">✕</button>
      `;
      cartList.appendChild(row);
    });

    cartTotalEl.textContent = total;
  };

  const refreshCart = () => {
    updateBadge();
    updatePlanButtons();
    renderCartItems();
  };

  const openCart = () => {
    cartModal.hidden = false;
    requestAnimationFrame(() => cartModal.classList.add('is-open'));
    cartModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
  };

  const closeCart = () => {
    cartModal.classList.remove('is-open');
    cartModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    setTimeout(() => { cartModal.hidden = true; }, 350);
  };

  if (cartButton && cartModal) {
    planButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const plan = btn.dataset.plan;
        const price = Number(btn.dataset.price);
        if (cart.some(item => item.plan === plan)) return;
        cart.push({ plan, price });
        refreshCart();
      });
    });

    cartList.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('[data-remove]');
      if (!removeBtn) return;
      cart.splice(Number(removeBtn.dataset.remove), 1);
      refreshCart();
    });

    cartButton.addEventListener('click', openCart);
    cartModal.addEventListener('click', (e) => {
      if (e.target.matches('[data-close-modal]')) closeCart();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !cartModal.hidden) closeCart();
    });

    if (cartForm && supa) {
      cartForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (cart.length === 0) return;

        const email = cartEmail.value.trim();
        if (!email || !isValidEmail(email)) {
          cartMsg.textContent = 'Ingresa un correo válido.';
          cartMsg.style.color = 'crimson';
          return;
        }

        const total = cart.reduce((sum, item) => sum + item.price, 0);

        cartSubmit.disabled = true;
        cartSubmit.textContent = 'Enviando…';
        cartMsg.textContent = '';

        const { error } = await supa.from('pedidos').insert({
          email,
          planes: cart.map(item => ({ plan: item.plan, price: item.price })),
          total
        });

        if (error) {
          console.error('[Supabase pedidos]', error);
          cartSubmit.disabled = false;
          cartSubmit.textContent = 'Confirmar pedido';
          cartMsg.textContent = 'Error al enviar. Intenta de nuevo.';
          cartMsg.style.color = 'crimson';
          return;
        }

        cartSubmit.textContent = 'Enviado ✓';
        cartMsg.textContent = '¡Pedido recibido! Te contactaremos pronto.';
        cartMsg.style.color = '#2a8c5f';
        cart.length = 0;
        cartEmail.value = '';
        setTimeout(() => {
          refreshCart();
          closeCart();
          cartSubmit.disabled = false;
          cartSubmit.textContent = 'Confirmar pedido';
          cartMsg.textContent = '';
        }, 2200);
      });
    }
  }

  // ---------- 7. Autenticación (Supabase Auth) ----------
  const authButton    = document.getElementById('authButton');
  const userMenu      = document.getElementById('userMenu');
  const userTrigger   = document.getElementById('userTrigger');
  const userEmailEl   = document.getElementById('userEmail');
  const userDropdown  = document.getElementById('userDropdown');
  const logoutButton  = document.getElementById('logoutButton');
  const authModal     = document.getElementById('authModal');
  const authTabs      = document.querySelectorAll('[data-auth-tab]');
  const loginForm     = document.getElementById('loginForm');
  const signupForm    = document.getElementById('signupForm');
  const authMsg       = document.getElementById('authMsg');

  const showAuthMsg = (text, color) => {
    authMsg.textContent = text;
    authMsg.style.color = color || '';
  };

  const reflectSession = (session) => {
    const user = session?.user;
    if (user) {
      authButton.hidden = true;
      userMenu.hidden = false;
      userEmailEl.textContent = user.email;
    } else {
      authButton.hidden = false;
      userMenu.hidden = true;
      userDropdown.hidden = true;
      userTrigger?.setAttribute('aria-expanded', 'false');
    }
  };

  const openAuth = () => {
    authModal.hidden = false;
    requestAnimationFrame(() => authModal.classList.add('is-open'));
    authModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
  };

  const closeAuth = () => {
    authModal.classList.remove('is-open');
    authModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    setTimeout(() => { authModal.hidden = true; }, 350);
    showAuthMsg('', '');
  };

  const switchTab = (tab) => {
    authTabs.forEach(t => {
      const active = t.dataset.authTab === tab;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    loginForm.hidden  = tab !== 'login';
    signupForm.hidden = tab !== 'signup';
    showAuthMsg('', '');
  };

  if (authButton && authModal && supa) {
    // Estado inicial
    supa.auth.getSession().then(({ data }) => reflectSession(data.session));
    supa.auth.onAuthStateChange((_event, session) => reflectSession(session));

    // Abrir / cerrar modal
    authButton.addEventListener('click', () => {
      switchTab('login');
      openAuth();
    });
    authModal.addEventListener('click', (e) => {
      if (e.target.matches('[data-close-auth]')) closeAuth();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !authModal.hidden) closeAuth();
    });

    // Tabs
    authTabs.forEach(tab => {
      tab.addEventListener('click', () => switchTab(tab.dataset.authTab));
    });

    // Login
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = loginForm.email.value.trim();
      const password = loginForm.password.value;

      if (!isValidEmail(email)) {
        showAuthMsg('Ingresa un correo válido.', 'crimson');
        return;
      }

      const button = loginForm.querySelector('button');
      button.disabled = true;
      button.textContent = 'Entrando…';
      showAuthMsg('', '');

      const { error } = await supa.auth.signInWithPassword({ email, password });

      button.disabled = false;
      button.textContent = 'Entrar';

      if (error) {
        console.error('[Auth login]', error);
        showAuthMsg('Correo o contraseña incorrectos.', 'crimson');
        return;
      }

      showAuthMsg('¡Bienvenida!', '#2a8c5f');
      loginForm.reset();
      setTimeout(closeAuth, 800);
    });

    // Signup
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = signupForm.email.value.trim();
      const password = signupForm.password.value;

      if (!isValidEmail(email)) {
        showAuthMsg('Ingresa un correo válido.', 'crimson');
        return;
      }
      if (password.length < 6) {
        showAuthMsg('La contraseña debe tener al menos 6 caracteres.', 'crimson');
        return;
      }

      const button = signupForm.querySelector('button');
      button.disabled = true;
      button.textContent = 'Creando cuenta…';
      showAuthMsg('', '');

      const { data, error } = await supa.auth.signUp({ email, password });

      button.disabled = false;
      button.textContent = 'Crear cuenta';

      if (error) {
        console.error('[Auth signup]', error);
        if (error.message?.toLowerCase().includes('registered')) {
          showAuthMsg('Este correo ya tiene una cuenta. Inicia sesión.', 'crimson');
        } else {
          showAuthMsg('No se pudo crear la cuenta. Intenta de nuevo.', 'crimson');
        }
        return;
      }

      if (data.session) {
        showAuthMsg('¡Cuenta creada! Entrando…', '#2a8c5f');
        signupForm.reset();
        setTimeout(closeAuth, 800);
      } else {
        showAuthMsg('Revisa tu correo para confirmar la cuenta.', '#2a8c5f');
        signupForm.reset();
      }
    });

    // Dropdown usuario
    userTrigger?.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = userDropdown.hidden;
      userDropdown.hidden = !open;
      userTrigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    document.addEventListener('click', (e) => {
      if (!userMenu.contains(e.target)) {
        userDropdown.hidden = true;
        userTrigger?.setAttribute('aria-expanded', 'false');
      }
    });

    // Logout
    logoutButton?.addEventListener('click', async () => {
      await supa.auth.signOut();
    });
  }

})();