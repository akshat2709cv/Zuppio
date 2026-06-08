const body = document.body;
const siteHeader = document.querySelector(".site-header");
const menuButton = document.querySelector("#menuButton");
const navbar = document.querySelector("#navbar");
const drawerScrim = document.querySelector("#drawerScrim");
const loaderScreen = document.querySelector("#loaderScreen");
const cursorGlow = document.querySelector("#cursorGlow");
const backToTop = document.querySelector("#backToTop");

function closeDrawer() {
  if (!navbar || !menuButton) return;
  navbar.classList.remove("open");
  body.classList.remove("drawer-open");
  menuButton.setAttribute("aria-expanded", "false");
}

function openDrawer() {
  if (!navbar || !menuButton) return;
  navbar.classList.add("open");
  body.classList.add("drawer-open");
  menuButton.setAttribute("aria-expanded", "true");
}

if (menuButton && navbar) {
  menuButton.addEventListener("click", function () {
    if (navbar.classList.contains("open")) {
      closeDrawer();
    } else {
      openDrawer();
    }
  });
}

document.querySelectorAll("[data-drawer-close], .navbar a").forEach(function (item) {
  item.addEventListener("click", closeDrawer);
});

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") closeDrawer();
});

window.addEventListener("load", function () {
  window.setTimeout(function () {
    body.classList.remove("loading");
    if (loaderScreen) loaderScreen.classList.add("hidden");
  }, 420);
});

function updateScrollUi() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;

  if (siteHeader) siteHeader.classList.toggle("scrolled", scrollTop > 12);
  if (backToTop) backToTop.classList.toggle("show", scrollTop > 420);
}

updateScrollUi();
window.addEventListener("scroll", updateScrollUi, { passive: true });

if (backToTop) {
  backToTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

if (cursorGlow && window.matchMedia("(pointer: fine)").matches) {
  window.addEventListener("pointermove", function (event) {
    cursorGlow.style.opacity = "1";
    cursorGlow.style.left = `${event.clientX}px`;
    cursorGlow.style.top = `${event.clientY}px`;
  });

  window.addEventListener("pointerleave", function () {
    cursorGlow.style.opacity = "0";
  });
}

if (window.Lenis && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const lenis = new Lenis({
    duration: 1.05,
    smoothWheel: true,
    wheelMultiplier: 0.82
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }

  requestAnimationFrame(raf);
}

if (window.lucide) {
  window.lucide.createIcons();
}

if (window.Swiper) {
  document.querySelectorAll(".product-suggestion-swiper").forEach(function (slider) {
    const hasMultipleSlides = slider.querySelectorAll(".swiper-slide").length > 1;

    new Swiper(slider, {
      slidesPerView: 1,
      spaceBetween: 0,
      speed: 720,
      loop: hasMultipleSlides,
      grabCursor: hasMultipleSlides,
      autoplay: hasMultipleSlides
        ? {
            delay: 3800,
            disableOnInteraction: false
          }
        : false,
      pagination: hasMultipleSlides
        ? {
            el: slider.querySelector(".suggestion-pagination"),
            clickable: true
          }
        : false,
      navigation: hasMultipleSlides
        ? {
            nextEl: slider.querySelector(".suggestion-next"),
            prevEl: slider.querySelector(".suggestion-prev")
          }
        : false
    });
  });

  if (document.querySelector(".flavor-swiper")) {
    new Swiper(".flavor-swiper", {
      slidesPerView: 1,
      spaceBetween: 18,
      speed: 560,
      rewind: true,
      grabCursor: true,
      pagination: {
        el: ".flavor-pagination",
        clickable: true
      },
      navigation: {
        nextEl: ".flavor-next",
        prevEl: ".flavor-prev"
      },
      breakpoints: {
        768: {
          slidesPerView: 2
        },
        992: {
          slidesPerView: 3
        }
      }
    });
  }

  new Swiper(".testimonial-swiper", {
    slidesPerView: 1,
    spaceBetween: 18,
    speed: 620,
    rewind: true,
    autoplay: {
      delay: 3600,
      disableOnInteraction: false
    },
    breakpoints: {
      768: {
        slidesPerView: 2
      },
      992: {
        slidesPerView: 3
      }
    }
  });
}

document.querySelectorAll(".product-suggestion-swiper:not(.swiper-initialized)").forEach(function (slider) {
  const wrapper = slider.querySelector(".swiper-wrapper");
  const slides = Array.from(slider.querySelectorAll(".product-suggestion-slide"));
  const prevButton = slider.querySelector(".suggestion-prev");
  const nextButton = slider.querySelector(".suggestion-next");
  const pagination = slider.querySelector(".suggestion-pagination");

  if (!wrapper || slides.length < 2) return;

  let activeIndex = 0;
  let autoplayTimer;

  slider.classList.add("product-slider-ready");

  const bullets = slides.map(function (_slide, index) {
    const bullet = document.createElement("button");
    bullet.className = "swiper-pagination-bullet";
    bullet.type = "button";
    bullet.setAttribute("aria-label", `Go to suggestion ${index + 1}`);
    bullet.addEventListener("click", function () {
      goToSlide(index);
      restartAutoplay();
    });
    if (pagination) pagination.appendChild(bullet);
    return bullet;
  });

  function render() {
    wrapper.style.transform = `translateX(-${activeIndex * 100}%)`;
    slides.forEach(function (slide, index) {
      slide.classList.toggle("swiper-slide-active", index === activeIndex);
      slide.setAttribute("aria-hidden", String(index !== activeIndex));
    });
    bullets.forEach(function (bullet, index) {
      bullet.classList.toggle("swiper-pagination-bullet-active", index === activeIndex);
      bullet.setAttribute("aria-current", index === activeIndex ? "true" : "false");
    });
  }

  function goToSlide(index) {
    activeIndex = (index + slides.length) % slides.length;
    render();
  }

  function nextSlide() {
    goToSlide(activeIndex + 1);
  }

  function restartAutoplay() {
    window.clearInterval(autoplayTimer);
    autoplayTimer = window.setInterval(nextSlide, 3800);
  }

  if (prevButton) {
    prevButton.addEventListener("click", function () {
      goToSlide(activeIndex - 1);
      restartAutoplay();
    });
  }

  if (nextButton) {
    nextButton.addEventListener("click", function () {
      nextSlide();
      restartAutoplay();
    });
  }

  slider.addEventListener("pointerenter", function () {
    window.clearInterval(autoplayTimer);
  });

  slider.addEventListener("pointerleave", restartAutoplay);

  render();
  restartAutoplay();
});

document.querySelectorAll(".flavor-card").forEach(function (card) {
  card.addEventListener("mousemove", function (event) {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const box = card.getBoundingClientRect();
    const x = event.clientX - box.left;
    const y = event.clientY - box.top;
    const rotateX = (y / box.height - 0.5) * -3;
    const rotateY = (x / box.width - 0.5) * 3;
    card.style.transform = `translateY(-7px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.01)`;
  });

  card.addEventListener("mouseleave", function () {
    card.style.transform = "";
  });
});

document.querySelectorAll(".policy-card").forEach(function (card) {
  card.addEventListener("mousemove", function (event) {
    const box = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${event.clientX - box.left}px`);
    card.style.setProperty("--my", `${event.clientY - box.top}px`);
  });
});

const categoryCards = document.querySelectorAll(".category-card");

function closeCategoryMenus(exceptCard) {
  categoryCards.forEach(function (card) {
    if (card === exceptCard) return;
    const button = card.querySelector(".category-menu-toggle");
    const menu = card.querySelector(".category-product-menu");
    card.classList.remove("menu-open");
    if (button) button.setAttribute("aria-expanded", "false");
    if (menu) menu.hidden = true;
  });
}

categoryCards.forEach(function (card) {
  const button = card.querySelector(".category-menu-toggle");
  const menu = card.querySelector(".category-product-menu");
  if (!button || !menu) return;

  button.addEventListener("click", function (event) {
    event.stopPropagation();
    const isOpen = card.classList.toggle("menu-open");
    button.setAttribute("aria-expanded", String(isOpen));
    menu.hidden = !isOpen;
    if (isOpen) closeCategoryMenus(card);
  });
});

document.addEventListener("click", function (event) {
  if (!event.target.closest(".category-card")) closeCategoryMenus();
});

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") closeCategoryMenus();
});

function setChevronIcon(button, iconName) {
  const icon = button.querySelector("svg, i");
  if (!icon) return;

  const nextIcon = document.createElement("i");
  nextIcon.setAttribute("data-lucide", iconName);
  icon.replaceWith(nextIcon);
  if (window.lucide) window.lucide.createIcons();
}

document.querySelectorAll(".faq-item button").forEach(function (button) {
  button.addEventListener("click", function () {
    const item = button.closest(".faq-item");
    const isOpen = item.classList.toggle("open");
    button.setAttribute("aria-expanded", String(isOpen));
    setChevronIcon(button, isOpen ? "chevron-up" : "chevron-down");
  });
});

document.querySelectorAll("[data-faq-show-more]").forEach(function (button) {
  const section = button.closest(".faq-section");
  const extraItems = section ? section.querySelectorAll(".faq-item-extra") : [];

  button.addEventListener("click", function () {
    const isExpanded = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!isExpanded));
    button.setAttribute("aria-label", isExpanded ? "Show more FAQs" : "Show fewer FAQs");
    button.classList.toggle("open", !isExpanded);

    extraItems.forEach(function (item) {
      item.hidden = isExpanded;

      if (isExpanded) {
        item.classList.remove("open");
        const faqButton = item.querySelector("button");
        if (faqButton) {
          faqButton.setAttribute("aria-expanded", "false");
          setChevronIcon(faqButton, "chevron-down");
        }
      }
    });

    setChevronIcon(button, isExpanded ? "chevron-down" : "chevron-up");
  });
});

const revealItems = document.querySelectorAll(".scroll-reveal");

if (revealItems.length) {
  const revealObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16, rootMargin: "0px 0px -40px" }
  );

  revealItems.forEach(function (item) {
    revealObserver.observe(item);
  });
}

if (window.gsap && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  window.gsap.from(".hero-content > *", {
    y: 18,
    opacity: 0,
    duration: 0.7,
    stagger: 0.08,
    ease: "power2.out",
    delay: 0.25
  });
}

document.querySelectorAll(".snack-drop-form").forEach(function (form) {
  const status = form.querySelector(".newsletter-status");

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    if (!status) return;

    const submitButton = form.querySelector("button");
    const formData = new FormData(form);
    const email = String(formData.get("email") || "").trim();

    status.className = "newsletter-status";
    status.textContent = "Sending confirmation...";
    submitButton.disabled = true;

    try {
      const response = await fetch(form.action, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({ email })
      });

      const result = await response.json();
      status.textContent = result.message;
      status.classList.add(result.ok ? "success" : "error");

      if (result.ok) form.reset();
    } catch (_error) {
      status.textContent = "Something went wrong. Please try again later.";
      status.classList.add("error");
    } finally {
      submitButton.disabled = false;
    }
  });
});

document.querySelectorAll(".contact-message-form").forEach(function (form) {
  const status = form.querySelector(".newsletter-status");

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    if (!status) return;

    const submitButton = form.querySelector("button[type='submit']");
    const formData = new FormData(form);
    status.className = "newsletter-status";
    status.textContent = "Sending message...";
    if (submitButton) submitButton.disabled = true;

    try {
      const response = await fetch(form.action, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          name: String(formData.get("name") || "").trim(),
          email: String(formData.get("email") || "").trim(),
          phone: String(formData.get("phone") || "").trim(),
          subject: String(formData.get("subject") || "").trim(),
          message: String(formData.get("message") || "").trim()
        })
      });
      const result = await response.json();
      status.textContent = result.message;
      status.classList.add(result.ok ? "success" : "error");
      if (result.ok) form.reset();
    } catch (_error) {
      status.textContent = "Something went wrong. Please try again later.";
      status.classList.add("error");
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
});

document.querySelectorAll(".dealer-inquiry-form, .wholesale-inquiry-form").forEach(function (form) {
  const status = form.querySelector(".newsletter-status");

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    if (!status) return;

    const submitButton = form.querySelector("button[type='submit']");
    const formData = new FormData(form);
    const payload = {};
    formData.forEach(function (value, key) {
      payload[key] = String(value || "").trim();
    });

    status.className = "newsletter-status";
    status.textContent = "Sending inquiry...";
    if (submitButton) submitButton.disabled = true;

    try {
      const response = await fetch(form.action, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      status.textContent = result.message;
      status.classList.add(result.ok ? "success" : "error");
      if (result.ok) form.reset();
    } catch (_error) {
      status.textContent = "Something went wrong. Please try again later.";
      status.classList.add("error");
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
});

document.querySelectorAll("form:not([action])").forEach(function (form) {
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    const button = form.querySelector("button[type='submit']");
    if (!button) return;
    const originalText = button.textContent.trim();
    button.textContent = "Submitted";
    window.setTimeout(function () {
      button.textContent = originalText;
      if (window.lucide) window.lucide.createIcons();
    }, 1600);
  });
});
