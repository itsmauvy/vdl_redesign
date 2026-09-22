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
  initDropdownCategories();
  initSearchOverlay();
  initBestSlider();
  initProductActions();
  initOptionModal();
  initCartPanel();
});

let cartItems = [];

/* Real shipping policy from vdlcosmetics.com product pages */
const FREE_SHIPPING_THRESHOLD = 15000;
const SHIPPING_FEE = 2100;

/* "함께쓰면 좋은 제품" cross-sell pairs, sourced from each product's real detail page */
const PRODUCT_RECS = {
  cushion: "primer",
  primer: "foundation",
  foundation: "blusherbalm",
  blusherbalm: "cushion",
  liquidblush: "cushion",
  prepbase: "cushion",
};

function updateCartBadge() {
  const badge = document.getElementById("cartCount");
  if (!badge) return;
  const totalQty = cartItems.reduce((sum, item) => sum + item.qty, 0);
  badge.textContent = String(totalQty);
}

function addItemsToCart(product, selectedEntries) {
  selectedEntries.forEach((entry) => {
    const key = product.name + "__" + entry.option.name;
    const existing = cartItems.find((item) => item.key === key);
    if (existing) {
      existing.qty += entry.qty;
    } else {
      cartItems.push({
        key,
        pid: product.pid,
        name: product.name,
        price: product.price,
        img: product.img,
        optionName: entry.option.name,
        qty: entry.qty,
      });
    }
  });
  updateCartBadge();
  renderCartPanel();
}

function renderCartPanel() {
  const list = document.getElementById("cartPanelList");
  const countEl = document.getElementById("cartPanelCount");
  const totalEl = document.getElementById("cartPanelTotal");
  if (!list) return;

  list.innerHTML = "";
  let totalPrice = 0;
  let totalQty = 0;

  cartItems.forEach((item, index) => {
    totalPrice += item.price * item.qty;
    totalQty += item.qty;

    const li = document.createElement("li");
    li.className = "cart-panel__item";
    li.innerHTML = `
      <div class="cart-panel__thumb"><img src="${item.img}" alt="${item.name}"></div>
      <div class="cart-panel__info">
        <p class="cart-panel__name">${item.name}</p>
        <p class="cart-panel__option">${item.optionName}</p>
        <span class="cart-panel__qty">
          <button type="button" data-action="dec">−</button>
          <span>${item.qty}</span>
          <button type="button" data-action="inc">+</button>
        </span>
      </div>
      <div class="cart-panel__side">
        <button type="button" class="cart-panel__remove" aria-label="삭제">
          <svg viewBox="0 -960 960 960" fill="currentColor"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg>
        </button>
        <p class="cart-panel__price">${(item.price * item.qty).toLocaleString()}원</p>
      </div>`;

    li.querySelector('[data-action="dec"]').addEventListener("click", () => {
      item.qty = Math.max(1, item.qty - 1);
      updateCartBadge();
      renderCartPanel();
    });
    li.querySelector('[data-action="inc"]').addEventListener("click", () => {
      item.qty += 1;
      updateCartBadge();
      renderCartPanel();
    });
    li.querySelector(".cart-panel__remove").addEventListener("click", () => {
      cartItems.splice(index, 1);
      updateCartBadge();
      renderCartPanel();
    });

    list.appendChild(li);
  });

  const shipping = totalPrice > 0 && totalPrice < FREE_SHIPPING_THRESHOLD ? SHIPPING_FEE : 0;
  const shippingEl = document.getElementById("cartPanelShipping");
  const noteEl = document.getElementById("cartShippingNote");

  if (shippingEl) shippingEl.textContent = shipping === 0 ? "무료" : `${shipping.toLocaleString()}원`;

  if (noteEl) {
    if (totalPrice === 0) {
      noteEl.textContent = "";
    } else if (shipping === 0) {
      noteEl.textContent = "무료배송 조건을 충족했어요!";
      noteEl.classList.add("is-free");
    } else {
      const remaining = FREE_SHIPPING_THRESHOLD - totalPrice;
      noteEl.textContent = `${remaining.toLocaleString()}원 더 담으면 무료배송!`;
      noteEl.classList.remove("is-free");
    }
  }

  if (countEl) countEl.textContent = String(totalQty);
  if (totalEl) totalEl.textContent = `${(totalPrice + shipping).toLocaleString()}원`;

  renderCartRecommendation();
}

function renderCartRecommendation() {
  const wrap = document.getElementById("cartReco");
  if (!wrap) return;

  if (cartItems.length === 0) {
    wrap.hidden = true;
    return;
  }

  const lastItem = cartItems[cartItems.length - 1];
  const recPid = PRODUCT_RECS[lastItem.pid];
  const recInfo = recPid && PRODUCT_INFO[recPid];
  const alreadyInCart = recInfo && cartItems.some((item) => item.pid === recPid);

  if (!recInfo || alreadyInCart) {
    wrap.hidden = true;
    return;
  }

  wrap.hidden = false;
  document.getElementById("cartRecoImg").src = recInfo.img;
  document.getElementById("cartRecoImg").alt = recInfo.name;
  document.getElementById("cartRecoName").textContent = recInfo.name;
  document.getElementById("cartRecoPrice").textContent = `${recInfo.price.toLocaleString()}원`;

  const addBtn = document.getElementById("cartRecoAdd");
  addBtn.onclick = () => {
    const firstOption = recInfo.options[0];
    addItemsToCart(recInfo, [{ option: firstOption, qty: 1 }]);
  };
}

function initCartPanel() {
  const panel = document.getElementById("cartPanel");
  const trigger = document.getElementById("cartTrigger");
  if (!panel) return;

  window.openCartPanel = () => {
    renderCartPanel();
    panel.classList.add("is-open");
    panel.setAttribute("aria-hidden", "false");
  };

  function closeCartPanel() {
    panel.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
  }

  trigger?.addEventListener("click", () => window.openCartPanel());

  panel.querySelectorAll("[data-cart-close]").forEach((el) => {
    el.addEventListener("click", closeCartPanel);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && panel.classList.contains("is-open")) closeCartPanel();
  });
}

/* Real shade/option data pulled from vdlcosmetics.com product detail pages */
const PRODUCT_OPTIONS = {
  cushion: {
    options: [
      { name: "M01" },
      { name: "A00 (Cool · 13호)" }, { name: "A01 (Cool · 17호)" }, { name: "A02 (Cool · 21호)" }, { name: "A03 (Cool · 23호)" },
      { name: "N01 (Neutral · 17호)", isNew: true }, { name: "N02 (Neutral · 21호)", isNew: true }, { name: "N03 (Neutral · 23호)", isNew: true },
      { name: "V02 (Warm · 21호)" }, { name: "V03 (Warm · 23호)" },
    ],
  },
  foundation: {
    options: [
      { name: "N00 (Neutral · 15호)" }, { name: "N01 (Neutral · 17호)" }, { name: "N02 (Neutral · 21호)" }, { name: "N03 (Neutral · 23호)" },
      { name: "A00 (Cool · 13호)" }, { name: "A01 (Cool · 17호)" }, { name: "A02 (Cool · 21호)" }, { name: "A03 (Cool · 23호)" },
      { name: "V01 (Warm · 17호)" }, { name: "V02 (Warm · 21호)" }, { name: "V03 (Warm · 23호)" },
      { name: "Olive (Olive · 21호)", isNew: true },
    ],
  },
  primer: {
    options: [
      { name: "00 클리어", color: "#f4f1ea" },
      { name: "01 민트", color: "#b9e4d0" },
      { name: "02 로즈쿼츠", color: "#f3c6c9" },
      { name: "03 세레니티", color: "#c9d6f0" },
      { name: "04 크림옐로우", color: "#f5e3b3" },
    ],
  },
  blusherbalm: {
    options: [
      { name: "01 바운싱 피치밤", color: "#f2a89c" },
      { name: "02 토스트 피치밤", color: "#e8927e" },
      { name: "03 바닐라 밀크밤", color: "#f3e0cf" },
      { name: "04 핑크 샌드밤", color: "#eec3bd" },
      { name: "05 페일 피그밤", color: "#e8b9ae" },
      { name: "06 아몬드 로즈밤", color: "#d9968f" },
      { name: "07 더스티 로즈밤", color: "#c17b74" },
    ],
  },
  liquidblush: {
    options: [
      { name: "01 피치 리치", color: "#f0a58f" },
      { name: "02 보니 피치", color: "#eb9c86" },
      { name: "03 소피 라일락", color: "#c9a0c9" },
      { name: "04 디어 모브", color: "#b98a95" },
      { name: "05 로즈 폼", color: "#e6a8ab" },
      { name: "06 오트 애프리콧", color: "#e0a37a" },
      { name: "07 코코아 무스", color: "#a97a63" },
      { name: "08 포지 베라", color: "#c76b7a" },
    ],
  },
  prepbase: {
    options: [{ name: "기본 옵션" }],
  },
  powder: {
    options: [
      { name: "01 퓨어 클라우드", color: "#eef1f5" },
      { name: "02 크림 옐로우", color: "#f2e3b0" },
    ],
  },
  eyeduo: {
    options: [{ name: "베이직 브라운", color: "#8b6552" }],
  },
  liptint: {
    options: [{ name: "플레인 피치", color: "#e8a68f" }],
  },
};

const PRODUCT_INFO = {};

function initProductActions() {
  document.querySelectorAll(".best__item[data-pid]").forEach((item) => {
    const pid = item.dataset.pid;
    const data = PRODUCT_OPTIONS[pid];
    if (!data) return;

    PRODUCT_INFO[pid] = {
      pid,
      name: item.querySelector(".best__name")?.textContent.trim() || "",
      price: parseInt(
        (item.querySelector(".best__price")?.textContent || "0").replace(/[^0-9]/g, ""),
        10
      ),
      img: item.querySelector(".best__thumb img")?.getAttribute("src") || "",
      options: data.options,
    };
  });

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

      const item = btn.closest(".best__item");
      const pid = item?.dataset.pid;
      const info = PRODUCT_INFO[pid];
      if (!info) return;

      window.openOptionModal({ ...info, triggerBtn: btn });
    });
  });
}

function initOptionModal() {
  const modal = document.getElementById("optionModal");
  if (!modal) return;

  const thumb = document.getElementById("optionModalThumb");
  const nameEl = document.getElementById("optionModalName");
  const toggle = document.getElementById("optionToggle");
  const toggleLabel = document.getElementById("optionToggleLabel");
  const list = document.getElementById("optionList");
  const selectedList = document.getElementById("optionSelected");
  const totalEl = document.getElementById("optionModalTotal");
  const submitBtn = document.getElementById("optionModalSubmit");

  let currentProduct = null;
  let selected = [];

  function render() {
    selectedList.innerHTML = "";
    let totalQty = 0;
    let totalPrice = 0;

    selected.forEach((entry, index) => {
      totalQty += entry.qty;
      totalPrice += entry.qty * currentProduct.price;

      const li = document.createElement("li");
      li.className = "option-modal__selected-row";

      const dot = entry.option.color
        ? `<span class="option-modal__dot" style="background:${entry.option.color}"></span>`
        : "";

      li.innerHTML = `
        ${dot}
        <span class="option-modal__selected-name">${entry.option.name}</span>
        <span class="option-modal__qty">
          <button type="button" data-action="dec">−</button>
          <span>${entry.qty}</span>
          <button type="button" data-action="inc">+</button>
        </span>
        <span class="option-modal__selected-price">${(entry.qty * currentProduct.price).toLocaleString()}원</span>
        <button type="button" class="option-modal__remove" aria-label="옵션 삭제">
          <svg viewBox="0 -960 960 960" fill="currentColor"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg>
        </button>`;

      li.querySelector('[data-action="dec"]').addEventListener("click", () => {
        entry.qty = Math.max(1, entry.qty - 1);
        render();
      });
      li.querySelector('[data-action="inc"]').addEventListener("click", () => {
        entry.qty += 1;
        render();
      });
      li.querySelector(".option-modal__remove").addEventListener("click", () => {
        selected.splice(index, 1);
        render();
      });

      selectedList.appendChild(li);
    });

    totalEl.textContent = `${totalPrice.toLocaleString()}원 (${totalQty}개)`;
    submitBtn.disabled = selected.length === 0;
    toggleLabel.textContent = selected.length === 0 ? "[필수] 옵션을 선택해 주세요" : "옵션을 추가로 선택하실 수 있어요";
  }

  function closeOptionList() {
    list.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  }

  toggle.addEventListener("click", () => {
    const isOpen = list.classList.contains("is-open");
    list.classList.toggle("is-open", !isOpen);
    toggle.setAttribute("aria-expanded", String(!isOpen));
  });

  window.openOptionModal = (product) => {
    currentProduct = product;
    selected = [];

    thumb.src = product.img;
    thumb.alt = product.name;
    nameEl.textContent = product.name;

    list.innerHTML = "";
    product.options.forEach((option) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "option-modal__item";

      const dot = option.color ? `<span class="option-modal__dot" style="background:${option.color}"></span>` : "";
      const newBadge = option.isNew ? `<span class="option-modal__new">NEW</span>` : "";
      btn.innerHTML = `${dot}<span>${option.name}</span>${newBadge}`;

      btn.addEventListener("click", () => {
        const existing = selected.find((s) => s.option.name === option.name);
        if (existing) {
          existing.qty += 1;
        } else {
          selected.push({ option, qty: 1 });
        }
        closeOptionList();
        render();
      });

      li.appendChild(btn);
      list.appendChild(li);
    });

    closeOptionList();
    render();

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
  };

  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    closeOptionList();
  }

  modal.querySelectorAll("[data-modal-close]").forEach((el) => {
    el.addEventListener("click", closeModal);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal();
  });

  submitBtn.addEventListener("click", () => {
    if (selected.length === 0) return;

    addItemsToCart(currentProduct, selected);

    if (currentProduct?.triggerBtn) {
      const btn = currentProduct.triggerBtn;
      btn.classList.add("is-active");
      btn.setAttribute("aria-label", "장바구니에 담김");
      window.clearTimeout(btn._cartResetTimer);
      btn._cartResetTimer = window.setTimeout(() => {
        btn.classList.remove("is-active");
        btn.setAttribute("aria-label", "장바구니 담기");
      }, 1200);
    }

    closeModal();
    window.openCartPanel?.();
  });
}

function initBestSlider() {
  const slider = document.querySelector(".best__slider");
  if (!slider) return;

  const viewport = slider.querySelector(".best__viewport");
  const track = slider.querySelector(".best__track");
  const pageCount = slider.querySelectorAll(".best__page").length;
  const dots = [...document.querySelectorAll(".best__dot")];
  const prevBtn = document.getElementById("bestPrev");
  const nextBtn = document.getElementById("bestNext");
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
    if (prevBtn) prevBtn.disabled = current === 0;
    if (nextBtn) nextBtn.disabled = current === pageCount - 1;
  }

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => goTo(index));
  });

  prevBtn?.addEventListener("click", () => goTo(current - 1));
  nextBtn?.addEventListener("click", () => goTo(current + 1));

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

function initDropdownCategories() {
  document.querySelectorAll(".dropdown").forEach((dropdown) => {
    const cats = dropdown.querySelectorAll(".dropdown__cat");
    const plainCats = dropdown.querySelectorAll(".dropdown__cat--plain");
    if (cats.length === 0) return;

    const panels = dropdown.querySelectorAll(".dropdown__visuals");

    cats.forEach((cat) => {
      cat.addEventListener("mouseenter", () => {
        cats.forEach((c) => c.classList.toggle("is-active", c === cat));
        panels.forEach((panel) => {
          panel.classList.toggle("is-active", panel.dataset.panel === cat.dataset.cat);
        });
      });
    });

    plainCats.forEach((plain) => {
      plain.addEventListener("mouseenter", () => {
        cats.forEach((c) => c.classList.remove("is-active"));
        panels.forEach((panel) => panel.classList.remove("is-active"));
      });
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
