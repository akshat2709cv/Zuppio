const body = document.body;
const siteHeader = document.querySelector(".site-header");
const menuButton = document.querySelector("#menuButton");
const navbar = document.querySelector("#navbar");
const drawerScrim = document.querySelector("#drawerScrim");
const loaderScreen = document.querySelector("#loaderScreen");
const scrollProgress = document.querySelector("#scrollProgress");
const cursorGlow = document.querySelector("#cursorGlow");
const switchPack = document.querySelector("#switchPack");
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
  const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;

  if (siteHeader) siteHeader.classList.toggle("scrolled", scrollTop > 12);
  if (scrollProgress) scrollProgress.style.width = `${Math.min(progress, 100)}%`;
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

document.querySelectorAll("[data-pack-side]").forEach(function (button) {
  button.addEventListener("click", function () {
    if (!switchPack) return;
    switchPack.classList.toggle("back", button.dataset.packSide === "back");
  });
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

document.querySelectorAll(".faq-item button").forEach(function (button) {
  button.addEventListener("click", function () {
    const item = button.closest(".faq-item");
    const isOpen = item.classList.toggle("open");
    button.setAttribute("aria-expanded", String(isOpen));
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

  window.addEventListener("pointermove", function (event) {
    const x = event.clientX / window.innerWidth - 0.5;
    const y = event.clientY / window.innerHeight - 0.5;

    document.querySelectorAll("[data-depth]").forEach(function (item) {
      const depth = Number(item.dataset.depth || 0.04);
      window.gsap.to(item, {
        x: x * depth * 180,
        y: y * depth * 120,
        duration: 0.8,
        ease: "power2.out"
      });
    });
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
