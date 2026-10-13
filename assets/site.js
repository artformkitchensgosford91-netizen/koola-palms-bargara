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


function koolaTrackEvent(name, params = {}) {
  if (typeof window.gtag === 'function') {
    window.gtag('event', name, params);
  }
}

// One delegated implementation for booking interest and contact intent.
// These clicks do not establish an enquiry submission or a confirmed reservation.
function trackBookingEnquiryClick(event) {
  if (event.defaultPrevented || (event.type === 'auxclick' && event.button !== 1)) return;
  const anchor = event.target?.closest?.('a[href]');
  if (!anchor) return;

  const href = anchor.getAttribute('href') || '';
  const params = {
    booking_property: 'koola_palms_apartment_101',
    interaction_location: anchor.closest('#book') ? 'booking' : 'contact',
    transport_type: 'beacon'
  };
  let name;
  if (anchor.id === 'cms-direct-booking') {
    name = 'direct_booking_click';
    params.booking_channel = 'direct';
    params.intent_type = 'booking_interest';
  } else if (anchor.id === 'cms-booking-com') {
    name = 'booking_com_click';
    params.booking_channel = 'booking_com';
    params.intent_type = 'booking_interest';
  } else if (/^tel:/i.test(href)) {
    name = 'phone_click';
    params.contact_method = 'phone';
    params.intent_type = 'contact_interest';
  } else if (/^mailto:/i.test(href)) {
    name = 'email_click';
    params.contact_method = 'email';
    params.intent_type = 'contact_interest';
  } else {
    return;
  }
  // Do not send full URLs, email subjects/bodies or phone numbers as parameters.
  // Keep normal browser navigation, new tabs and contact applications intact.
  koolaTrackEvent(name, params);
}
document.addEventListener('click', trackBookingEnquiryClick);
document.addEventListener('auxclick', trackBookingEnquiryClick);

videoPlay?.addEventListener('click', () => {
  koolaTrackEvent('video_play', { video_name: 'apartment_walkthrough' });
});

