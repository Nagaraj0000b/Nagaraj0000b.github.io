(() => {
  const revealElements = [...document.querySelectorAll("[data-reveal]")];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (!revealElements.length) return;

  if (!reducedMotion.matches && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (entry.intersectionRatio >= 0.08) {
              entry.target.classList.add("is-visible");
            }
            return;
          }

          // Reset only after the element has fully left the viewport, so
          // small scroll adjustments do not interrupt a reveal.
          entry.target.classList.remove("is-visible");
        });
      },
      {
        threshold: [0, 0.08],
      },
    );

    revealElements.forEach((element) => observer.observe(element));

    reducedMotion.addEventListener?.("change", (event) => {
      if (!event.matches) return;
      revealElements.forEach((element) => {
        element.classList.add("is-visible");
        observer.unobserve(element);
      });
    });
  } else {
    revealElements.forEach((element) => element.classList.add("is-visible"));
  }
})();
