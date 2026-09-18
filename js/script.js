document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.querySelector(".header__menu-toggle");
  const mobileNav = document.getElementById("mobileNav");

  if (menuToggle && mobileNav) {
    menuToggle.addEventListener("click", () => {
      const isOpen = mobileNav.classList.toggle("is-open");
      menuToggle.classList.toggle("is-active", isOpen);
      menuToggle.setAttribute("aria-expanded", String(isOpen));
    });
  }

  initHeroSlider();
  initGnbDropdown();
  initSearchOverlay();
  initBestSlider();
  initProductActions();
});

function initProductActions() {
  document.querySelectorAll(".best__action--wish").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isActive = btn.classList.toggle("is-active");
      btn.setAttribute("aria-pressed", String(isActive));
      btn.setAttribute("aria-label", isActive ? "찜 취소하기" : "찜하기");
    });
  });

  document.querySelectorAll(".best__action--cart").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      btn.classList.add("is-active");
      btn.setAttribute("aria-label", "장바구니에 담김");
      window.clearTimeout(btn._cartResetTimer);
      btn._cartResetTimer = window.setTimeout(() => {
        btn.classList.remove("is-active");
        btn.setAttribute("aria-label", "장바구니 담기");
      }, 1200);
    });
  });
}

function initBestSlider() {
  const slider = document.querySelector(".best__slider");
  if (!slider) return;

  const viewport = slider.querySelector(".best__viewport");
  const track = slider.querySelector(".best__track");
  const pageCount = slider.querySelectorAll(".best__page").length;
  const dots = [...document.querySelectorAll(".best__dot")];
  if (!window.gsap || !window.Draggable) return;

  gsap.registerPlugin(Draggable);

  let current = 0;

  function pageWidth() {
    return viewport.getBoundingClientRect().width;
  }

  function goTo(index, duration = 0.5) {
    current = Math.max(0, Math.min(pageCount - 1, index));
    gsap.to(track, { x: -current * pageWidth(), duration, ease: "power2.out" });
    dots.forEach((dot, i) => dot.classList.toggle("is-active", i === current));
  }

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => goTo(index));
  });

  const draggable = Draggable.create(track, {
    type: "x",
    bounds: { minX: -(pageCount - 1) * pageWidth(), maxX: 0 },
    edgeResistance: 0.6,
    onDragEnd: function () {
      const settledX = -current * pageWidth();
      const movedBy = this.x - settledX;
      const threshold = pageWidth() * 0.2;

      if (movedBy < -threshold) goTo(current + 1);
      else if (movedBy > threshold) goTo(current - 1);
      else goTo(current);
    },
  })[0];

  window.addEventListener("resize", () => {
    draggable.applyBounds({ minX: -(pageCount - 1) * pageWidth(), maxX: 0 });
    goTo(current, 0);
  });

  goTo(0, 0);
}

const SEARCHABLE_ITEMS = [
  { label: "NEW", href: "#" },
  { label: "BEST", href: "#" },
  { label: "BASE", href: "#" },
  { label: "EYE", href: "#" },
  { label: "LIP", href: "#" },
  { label: "SKINCARE", href: "#" },
  { label: "TOOLS", href: "#" },
  { label: "COLLECTION", href: "#" },
  { label: "ABOUT", href: "#" },
  { label: "ONLINE STORE", href: "#" },
  { label: "OFFLINE STORE", href: "#" },
];

function initSearchOverlay() {
  const trigger = document.getElementById("searchTrigger");
  const overlay = document.getElementById("searchOverlay");
  if (!trigger || !overlay) return;

  const input = overlay.querySelector(".search-overlay__input");
  const closeBtn = overlay.querySelector(".search-overlay__close");
  const form = overlay.querySelector(".search-overlay__form");
  const resultsEl = overlay.querySelector(".search-overlay__results");

  function renderResults(query) {
    const q = query.trim().toLowerCase();
    resultsEl.innerHTML = "";
    if (!q) return;

    const matches = SEARCHABLE_ITEMS.filter((item) => item.label.toLowerCase().includes(q));

    if (matches.length === 0) {
      const li = document.createElement("li");
      li.className = "search-overlay__empty";
      li.textContent = `"${query}"에 대한 검색 결과가 없습니다.`;
      resultsEl.appendChild(li);
      return;
    }

    matches.forEach((item) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = item.href;
      a.textContent = item.label;
      li.appendChild(a);
      resultsEl.appendChild(li);
    });
  }

  function open() {
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    trigger.setAttribute("aria-expanded", "true");
    input.value = "";
    renderResults("");
    window.requestAnimationFrame(() => input.focus());
    document.addEventListener("keydown", onKeydown);
    document.addEventListener("click", onOutsideClick, true);
  }

  function close() {
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    trigger.setAttribute("aria-expanded", "false");
    document.removeEventListener("keydown", onKeydown);
    document.removeEventListener("click", onOutsideClick, true);
  }

  function onKeydown(e) {
    if (e.key === "Escape") close();
  }

  function onOutsideClick(e) {
    if (!overlay.contains(e.target) && e.target !== trigger) close();
  }

  trigger.addEventListener("click", () => {
    overlay.classList.contains("is-open") ? close() : open();
  });

  closeBtn.addEventListener("click", close);
  form.addEventListener("submit", (e) => e.preventDefault());
  input.addEventListener("input", () => renderResults(input.value));
}

function initGnbDropdown() {
  const items = document.querySelectorAll(".header__nav .has-dropdown");
  const CLOSE_DELAY_MS = 200;

  items.forEach((item) => {
    let closeTimer = null;

    item.addEventListener("mouseenter", () => {
      clearTimeout(closeTimer);
      item.classList.add("is-open");
    });

    item.addEventListener("mouseleave", () => {
      closeTimer = setTimeout(() => {
        item.classList.remove("is-open");
      }, CLOSE_DELAY_MS);
    });
  });
}

function initHeroSlider() {
  const hero = document.querySelector(".hero");
  if (!hero) return;

  const slides = [...hero.querySelectorAll(".hero__slide")];
  const dots = [...hero.querySelectorAll(".hero__dot")];
  const AUTOPLAY_MS = 5000;
  let current = slides.findIndex((slide) => slide.classList.contains("is-active"));
  if (current === -1) current = 0;
  let timer = null;
  let isTransitioning = false;

  function goToSlide(index) {
    if (index === current || isTransitioning) return;
    isTransitioning = true;
    const prevSlide = slides[current];
    const nextSlide = slides[index];

    if (window.gsap) {
      gsap.to(prevSlide, { opacity: 0, duration: 0.8, ease: "power1.inOut" });
      gsap.to(nextSlide, {
        opacity: 1,
        duration: 0.8,
        ease: "power1.inOut",
        onComplete: () => {
          isTransitioning = false;
        },
      });
    } else {
      isTransitioning = false;
    }

    prevSlide.classList.remove("is-active");
    nextSlide.classList.add("is-active");
    dots[current]?.classList.remove("is-active");
    dots[index]?.classList.add("is-active");
    current = index;
  }

  function startAutoplay() {
    stopAutoplay();
    timer = setInterval(() => {
      goToSlide((current + 1) % slides.length);
    }, AUTOPLAY_MS);
  }

  function stopAutoplay() {
    if (timer) clearInterval(timer);
  }

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      goToSlide(index);
      startAutoplay();
    });
  });

  if (slides.length > 1) {
    startAutoplay();
  }
}
