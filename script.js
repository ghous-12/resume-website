(function () {
  "use strict";

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [
    ...scope.querySelectorAll(selector),
  ];
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  const yearEl = $("#footer-year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  const navToggle = $("#nav-toggle");
  const navMenu = $("#nav-menu");

  function setMenuOpen(isOpen) {
    if (!navToggle || !navMenu) return;
    navMenu.classList.toggle("is-open", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggle.setAttribute(
      "aria-label",
      isOpen ? "Close navigation menu" : "Open navigation menu",
    );
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", () => {
      const willOpen = navToggle.getAttribute("aria-expanded") !== "true";
      setMenuOpen(willOpen);
    });

    $$("a[href^='#']", navMenu).forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });
  }

  const themeToggle = $("#theme-toggle");
  const root = document.documentElement;
  const THEME_KEY = "resume-theme";

  function applyTheme(theme) {
    const next = theme === "light" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    localStorage.setItem(THEME_KEY, next);

    if (themeToggle) {
      themeToggle.setAttribute(
        "aria-label",
        next === "dark" ? "Switch to light mode" : "Switch to dark mode",
      );
    }
  }

  const savedTheme = localStorage.getItem(THEME_KEY) || "dark";
  applyTheme(savedTheme);

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const current =
        root.getAttribute("data-theme") === "light" ? "light" : "dark";
      applyTheme(current === "dark" ? "light" : "dark");
    });
  }

  const header = $(".site-header");
  const navLinks = $$('.nav-menu a[href^="#"]');
  const sections = navLinks
    .map((link) => {
      const id = link.getAttribute("href");
      return id && id !== "#" ? document.querySelector(id) : null;
    })
    .filter(Boolean);

  function getHeaderOffset() {
    return header ? header.offsetHeight + 8 : 0;
  }

  function scrollToSection(target) {
    if (!target) return;
    const top =
      target.getBoundingClientRect().top + window.scrollY - getHeaderOffset();
    window.scrollTo({
      top,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }

  function handleAnchorClick(event, link) {
    const href = link.getAttribute("href");
    if (!href || href === "#") return;
    const target = document.querySelector(href);
    if (!target) return;
    event.preventDefault();
    scrollToSection(target);
    history.pushState(null, "", href);
  }

  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => handleAnchorClick(event, link));
  });

  $$('a[href^="#"]').forEach((link) => {
    if (navLinks.includes(link)) return;
    link.addEventListener("click", (event) => handleAnchorClick(event, link));
  });

  function updateActiveNav() {
    const scrollPos = window.scrollY + getHeaderOffset() + 40;
    let currentId = sections[0] ? sections[0].id : "";

    sections.forEach((section) => {
      if (section.offsetTop <= scrollPos) {
        currentId = section.id;
      }
    });

    navLinks.forEach((link) => {
      const isActive = link.getAttribute("href") === `#${currentId}`;
      link.classList.toggle("active", isActive);
    });
  }

  window.addEventListener("scroll", updateActiveNav, { passive: true });
  updateActiveNav();

  const form = $("#contact-form");
  const feedback = $("#form-feedback");

  function showFieldError(input, errorEl, message) {
    input.classList.add("invalid");
    input.setAttribute("aria-invalid", "true");
    errorEl.textContent = message;
    errorEl.hidden = false;
  }

  function clearFieldError(input, errorEl) {
    input.classList.remove("invalid");
    input.removeAttribute("aria-invalid");
    errorEl.textContent = "";
    errorEl.hidden = true;
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function showFormFeedback(message, type) {
    if (!feedback) return;
    feedback.hidden = false;
    feedback.textContent = message;
    feedback.classList.remove("success", "error");
    feedback.classList.add(type);
  }

  if (form) {
    const nameInput = $("#contact-name");
    const emailInput = $("#contact-email");
    const messageInput = $("#contact-message");
    const nameError = $("#name-error");
    const emailError = $("#email-error");
    const messageError = $("#message-error");

    const submitBtn = form.querySelector('button[type="submit"]');

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      let isValid = true;

      clearFieldError(nameInput, nameError);
      clearFieldError(emailInput, emailError);
      clearFieldError(messageInput, messageError);
      if (feedback) {
        feedback.hidden = true;
        feedback.textContent = "";
      }

      const nameValue = nameInput.value.trim();
      const emailValue = emailInput.value.trim();
      const messageValue = messageInput.value.trim();

      if (!nameValue) {
        showFieldError(nameInput, nameError, "Please enter your name.");
        isValid = false;
      }

      if (!emailValue) {
        showFieldError(
          emailInput,
          emailError,
          "Please enter your email address.",
        );
        isValid = false;
      } else if (!isValidEmail(emailValue)) {
        showFieldError(
          emailInput,
          emailError,
          "Please enter a valid email address.",
        );
        isValid = false;
      }

      if (!messageValue) {
        showFieldError(messageInput, messageError, "Please enter a message.");
        isValid = false;
      } else if (messageValue.length < 10) {
        showFieldError(
          messageInput,
          messageError,
          "Message should be at least 10 characters.",
        );
        isValid = false;
      }

      if (!isValid) {
        showFormFeedback("Please fix the errors above and try again.", "error");
        const firstInvalid = form.querySelector(".invalid");
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      // Send to Formspree after client side validation passes
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Sending...";
      }

      try {
        const response = await fetch(form.action, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" },
        });

        if (!response.ok) {
          throw new Error("Formspree request failed");
        }

        showFormFeedback(
          "Thanks! Your message was sent successfully.",
          "success",
        );
        form.reset();
      } catch (error) {
        showFormFeedback(
          "Could not send your message. Please try again or email me directly.",
          "error",
        );
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Send Message";
        }
      }
    });

    [
      [nameInput, nameError],
      [emailInput, emailError],
      [messageInput, messageError],
    ].forEach(([input, errorEl]) => {
      input.addEventListener("input", () => clearFieldError(input, errorEl));
    });
  }

  const revealItems = $$("[data-reveal]");

  function showReveal(el) {
    el.classList.add("is-visible");
  }

  if (prefersReducedMotion) {
    revealItems.forEach(showReveal);
  } else if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          showReveal(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );

    revealItems.forEach((el) => revealObserver.observe(el));
  } else {
    revealItems.forEach(showReveal);
  }

  const skillFills = $$(".skill-bar-fill[data-skill-level]");

  skillFills.forEach((fill) => {
    const level = Number(fill.getAttribute("data-skill-level")) || 0;
    fill.style.setProperty("--skill-level", `${level}%`);
  });

  function animateSkillBar(fill) {
    fill.classList.add("is-animated");
  }

  if (prefersReducedMotion) {
    skillFills.forEach(animateSkillBar);
  } else if ("IntersectionObserver" in window) {
    const skillObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animateSkillBar(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.35 },
    );

    skillFills.forEach((fill) => skillObserver.observe(fill));
  } else {
    skillFills.forEach(animateSkillBar);
  }
})();
