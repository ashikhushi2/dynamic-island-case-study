// Reveal-on-scroll
const revealEls = document.querySelectorAll("[data-reveal]");

if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.05 }
  );
  revealEls.forEach((el) => io.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add("is-visible"));
}

// TOC active-section highlight
const tocLinks = Array.from(document.querySelectorAll("[data-toc]"));
const sections = tocLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

// ---------- Improvement mockup: auto-cycle Music → Maps → Call when in view ----------
(function () {
  const stage = document.getElementById("improvement-mockup");
  if (!stage) return;

  const states = ["music", "maps", "call"];
  let idx = 0;
  let cycleTimer = null;
  let isPlaying = false;

  const compactRow = stage.querySelector(".island-compact-row");
  const compactIsland = stage.querySelector(".island--compact");
  const expandedIsland = stage.querySelector(".island--expanded");
  const compactStates = stage.querySelectorAll(".island--compact .island-state");
  const expandedCards = stage.querySelectorAll(".island--expanded .island-card");
  const touches = stage.querySelectorAll(".touch-circle");

  let currentName = "music";

  function setActive(name) {
    const prev = currentName;
    if (prev === name) return;
    currentName = name;

    if (compactRow) compactRow.dataset.current = name;
    if (compactIsland) compactIsland.dataset.current = name;
    if (expandedIsland) expandedIsland.dataset.current = name;

    const updateOne = (el) => {
      const state = el.dataset.state;
      el.classList.remove("is-active", "is-leaving");
      if (state === name) el.classList.add("is-active");
      else if (state === prev) el.classList.add("is-leaving");
    };
    compactStates.forEach(updateOne);
    expandedCards.forEach(updateOne);
  }

  function playTouchOnce() {
    touches.forEach((el) => {
      el.classList.remove("is-active");
      void el.offsetWidth; // restart the keyframe animation
      el.classList.add("is-active");
    });
  }

  function nextStep() {
    playTouchOnce();
    setTimeout(() => {
      idx = (idx + 1) % states.length;
      setActive(states[idx]);
    }, 800);
  }

  function startCycle() {
    if (isPlaying) return;
    isPlaying = true;
    setActive(states[idx]);
    setTimeout(playTouchOnce, 800);
    cycleTimer = setInterval(nextStep, 3000);
  }

  function stopCycle() {
    isPlaying = false;
    if (cycleTimer) {
      clearInterval(cycleTimer);
      cycleTimer = null;
    }
  }

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) startCycle();
          else stopCycle();
        });
      },
      { threshold: 0.4 }
    );
    io.observe(stage);
  } else {
    startCycle();
  }
})();

if ("IntersectionObserver" in window && sections.length) {
  const tocList = document.querySelector(".toc__list");
  const indicator = document.querySelector(".toc__indicator");

  const moveIndicatorTo = (li) => {
    if (!indicator || !li) return;
    indicator.style.top = `${li.offsetTop}px`;
    indicator.style.height = `${li.offsetHeight}px`;
    indicator.classList.add("is-visible");
  };

  const setActive = (id) => {
    let activeLi = null;
    tocLinks.forEach((link) => {
      const li = link.parentElement;
      if (link.getAttribute("href") === `#${id}`) {
        li.classList.add("is-active");
        activeLi = li;
      } else {
        li.classList.remove("is-active");
      }
    });
    moveIndicatorTo(activeLi);
  };

  const tocIO = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible[0]) setActive(visible[0].target.id);
    },
    { rootMargin: "-30% 0px -50% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
  );
  sections.forEach((s) => tocIO.observe(s));

  // Reposition on resize so the indicator tracks layout changes.
  let resizeRaf = 0;
  window.addEventListener("resize", () => {
    if (resizeRaf) cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => {
      const activeLi = document.querySelector(".toc__list li.is-active");
      if (activeLi) {
        // Disable transition during resize so it snaps without lag
        indicator.style.transition = "none";
        moveIndicatorTo(activeLi);
        // Re-enable next frame
        requestAnimationFrame(() => {
          indicator.style.transition = "";
        });
      }
    });
  });

  // On click, animate to the destination immediately for snappier UX.
  tocLinks.forEach((link) => {
    link.addEventListener("click", () => {
      const li = link.parentElement;
      tocLinks.forEach((l) => l.parentElement.classList.remove("is-active"));
      li.classList.add("is-active");
      moveIndicatorTo(li);
    });
  });
}
