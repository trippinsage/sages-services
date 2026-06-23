(function () {
  "use strict";

  document.documentElement.classList.add("has-js");

  const header = document.querySelector("[data-header]");
  const navToggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".site-nav");
  const menuLabel = document.querySelector("[data-menu-label]");
  const mobileMenu = window.matchMedia("(max-width: 900px)");
  const pageRegions = document.querySelectorAll("main, footer, .site-header .brand");

  const setMenuState = (isOpen, returnFocus) => {
    if (!nav || !navToggle) return;
    nav.classList.toggle("is-open", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
    nav.inert = mobileMenu.matches && !isOpen;
    document.body.classList.toggle("nav-open", isOpen);
    pageRegions.forEach((region) => {
      region.inert = mobileMenu.matches && isOpen;
    });
    if (menuLabel) menuLabel.textContent = isOpen ? "Close navigation" : "Open navigation";
    if (isOpen) {
      nav.querySelector("a")?.focus();
    } else if (returnFocus) {
      navToggle.focus();
    }
  };

  const closeNav = (returnFocus) => {
    setMenuState(false, returnFocus);
  };

  if (nav && navToggle) {
    setMenuState(false, false);
    window.requestAnimationFrame(() => {
      document.documentElement.classList.add("nav-ready");
    });

    navToggle.addEventListener("click", () => {
      const willOpen = navToggle.getAttribute("aria-expanded") !== "true";
      setMenuState(willOpen, false);
    });

    nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => closeNav(false)));
    document.addEventListener("keydown", (event) => {
      if (!nav.classList.contains("is-open")) return;

      if (event.key === "Escape") {
        closeNav(true);
        return;
      }

      if (event.key === "Tab") {
        const focusable = [navToggle, ...nav.querySelectorAll("a[href]")];
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });
    document.addEventListener("click", (event) => {
      if (!nav.classList.contains("is-open")) return;
      if (!nav.contains(event.target) && !navToggle.contains(event.target)) closeNav(false);
    });
    mobileMenu.addEventListener("change", () => setMenuState(false, false));
  }

  if (header) {
    const updateHeader = () => header.classList.toggle("is-scrolled", window.scrollY > 18);
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
  }

  if (nav && "IntersectionObserver" in window) {
    const sectionLinks = Array.from(nav.querySelectorAll('a[href^="#"]:not(.button)'));
    const sections = sectionLinks
      .map((link) => document.querySelector(link.getAttribute("href")))
      .filter(Boolean);

    const setCurrentSection = (sectionId) => {
      sectionLinks.forEach((link) => {
        const isCurrent = link.getAttribute("href") === `#${sectionId}`;
        link.classList.toggle("is-current", isCurrent);
        if (isCurrent) {
          link.setAttribute("aria-current", "location");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    };

    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setCurrentSection(entry.target.id);
      });
    }, { rootMargin: "-30% 0px -60%", threshold: 0 });

    sections.forEach((section) => sectionObserver.observe(section));
  }

  const emailForm = document.querySelector("[data-email-form]");
  if (emailForm) {
    const submitButton = emailForm.querySelector("[data-submit-button]");
    const formStatus = emailForm.querySelector("[data-form-status]");
    const nameInput = emailForm.elements.namedItem("name");
    const emailInput = emailForm.elements.namedItem("email");
    const messageInput = emailForm.elements.namedItem("message");
    const formEndpoint = emailForm.action;
    let isSubmitting = false;

    const setFormStatus = (message, state) => {
      if (!formStatus) return;
      formStatus.textContent = message;
      if (state) {
        formStatus.dataset.state = state;
      } else {
        delete formStatus.dataset.state;
      }
    };

    emailForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (isSubmitting || !emailForm.reportValidity()) return;

      const data = new FormData(emailForm);
      const name = String(data.get("name") || "").trim();
      const email = String(data.get("email") || "").trim();
      const business = String(data.get("business") || "").trim();
      const interest = String(data.get("interest") || "Project inquiry").trim();
      const message = String(data.get("message") || "").trim();

      if (!name) {
        nameInput?.setCustomValidity("Please enter your name.");
        nameInput?.reportValidity();
        return;
      }
      if (!message) {
        messageInput?.setCustomValidity("Please add a few project details.");
        messageInput?.reportValidity();
        return;
      }

      data.set("name", name);
      data.set("email", email);
      data.set("business", business);
      data.set("interest", interest);
      data.set("message", message);
      data.set("subject", `${interest} inquiry from ${business || name}`);
      const payload = Object.fromEntries(data.entries());

      isSubmitting = true;
      emailForm.setAttribute("aria-busy", "true");
      submitButton?.setAttribute("disabled", "");
      if (submitButton) submitButton.textContent = "Sending…";
      setFormStatus("Sending your message…", "pending");

      try {
        const response = await fetch(formEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify(payload)
        });
        const result = await response.json().catch(() => ({}));

        if (!response.ok || result.success !== true) {
          throw new Error("Submission rejected");
        }

        emailForm.reset();
        setFormStatus("Message sent. We’ll reply as soon as possible.", "success");
      } catch (error) {
        setFormStatus("We couldn’t send your message. Please try again or email contact@sages.services.", "error");
      } finally {
        isSubmitting = false;
        emailForm.removeAttribute("aria-busy");
        submitButton?.removeAttribute("disabled");
        if (submitButton) submitButton.textContent = "Send message";
      }
    });

    [nameInput, emailInput, messageInput].forEach((input) => {
      input?.addEventListener("input", () => input.setCustomValidity(""));
    });
  }

  document.querySelectorAll("[data-year]").forEach((item) => {
    item.textContent = String(new Date().getFullYear());
  });
})();
