const navToggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.main-nav');
if (navToggle && nav) {
  navToggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(open));
  });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  }));
}

let revealObserver = null;
if ('IntersectionObserver' in window) {
  revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
}

function observeReveals(root = document) {
  root.querySelectorAll('.reveal:not(.visible)').forEach(el => {
    if (revealObserver) revealObserver.observe(el);
    else el.classList.add('visible');
  });
}
observeReveals();
document.addEventListener('koolaCmsContentReady', () => observeReveals());

const walkthroughVideo = document.getElementById('walkthrough-video');
const videoPlay = document.getElementById('video-play');
videoPlay?.addEventListener('click', async () => {
  if (!walkthroughVideo) return;
  walkthroughVideo.scrollIntoView({ behavior: 'smooth', block: 'center' });
  try { await walkthroughVideo.play(); } catch (_) { /* native controls remain available */ }
});

const lightbox = document.getElementById('lightbox');
const lightboxImage = document.querySelector('.lightbox-image');
const lightboxCaption = document.querySelector('.lightbox-caption');
const lightboxClose = document.querySelector('.lightbox-close');

function closeLightbox() {
  if (!lightbox) return;
  lightbox.hidden = true;
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

document.addEventListener('click', event => {
  const link = event.target.closest('[data-lightbox]');
  if (!link || !lightbox || !lightboxImage || !lightboxCaption) return;
  event.preventDefault();
  lightboxImage.src = link.getAttribute('href');
  lightboxImage.alt = link.querySelector('img')?.alt || '';
  lightboxCaption.textContent = link.dataset.caption || '';
  lightbox.hidden = false;
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
});

lightboxClose?.addEventListener('click', closeLightbox);
lightbox?.addEventListener('click', event => {
  if (event.target === lightbox) closeLightbox();
});
window.addEventListener('keydown', event => {
  if (event.key === 'Escape' && lightbox && !lightbox.hidden) closeLightbox();
});
