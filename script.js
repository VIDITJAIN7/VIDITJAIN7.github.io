(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const syncMotion = () => document.documentElement.classList.toggle('motion-enabled', !reducedMotion.matches);
  syncMotion();
  reducedMotion.addEventListener('change', syncMotion);

  // Draw each explanatory diagram once when it enters the reading area.
  // All text and diagrams remain visible without JavaScript.
  const figures = document.querySelectorAll('.process-figure, .fusion-figure');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    }, { threshold: .25 });
    figures.forEach(figure => observer.observe(figure));
  }

  const sections = [...document.querySelectorAll('.entries > .entry')];
  const entries = document.querySelector('.entries');
  const links = [...document.querySelectorAll('.contents a')];
  const readingTrack = document.querySelector('.reading-track');
  if (!sections.length) return;

  if (!reducedMotion.matches && 'IntersectionObserver' in window) {
    entries.classList.add('has-scroll-state');
    const cardObserver = new IntersectionObserver((observations) => {
      for (const observation of observations) {
        if (observation.isIntersecting) {
          sections.forEach(section => section.classList.toggle('is-current', section === observation.target));
        }
      }
    }, { rootMargin: '-38% 0px -38% 0px', threshold: 0 });
    sections.forEach(section => cardObserver.observe(section));
  }

  let queued = false;
  const updateReadingPosition = () => {
    const threshold = window.innerWidth <= 760 ? 180 : 170;
    let current = sections[0];
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= threshold) current = section;
    }
    for (const link of links) {
      if (link.hash === '#' + current.id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
    const first = sections[0].getBoundingClientRect().top + window.scrollY;
    const last = sections[sections.length - 1].getBoundingClientRect().bottom + window.scrollY;
    const progress = Math.min(1, Math.max(0, (window.scrollY + threshold - first) / Math.max(1, last - first - window.innerHeight + threshold)));
    if (readingTrack) readingTrack.style.setProperty('--read-progress', progress);
    queued = false;
  };
  const queueUpdate = () => {
    if (!queued) { queued = true; requestAnimationFrame(updateReadingPosition); }
  };
  window.addEventListener('scroll', queueUpdate, { passive: true });
  window.addEventListener('resize', queueUpdate);
  window.addEventListener('load', queueUpdate);
  document.querySelectorAll('details').forEach(detail => detail.addEventListener('toggle', queueUpdate));
  updateReadingPosition();
})();
