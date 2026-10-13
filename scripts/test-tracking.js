const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'assets/site.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const listeners = {};
const calls = [];
const window = { gtag: (...args) => calls.push(args), addEventListener() {} };
const document = {
  querySelector: () => null, querySelectorAll: () => [], getElementById: () => null,
  addEventListener(type, fn) { (listeners[type] ||= []).push(fn); }
};
vm.runInNewContext(source, { document, window });

// Fixtures come from the real homepage, including both contact placements.
const anchors = [...html.matchAll(/<a\b([^>]*)>/g)].map(([, attrs]) => {
  const get = key => attrs.match(new RegExp('(?:^|\\s)' + key + '="([^"]*)"'))?.[1] || '';
  return { id: get('id'), href: get('href'), classes: get('class') };
});
const tracked = anchors.filter(a => /cms-(direct-booking|booking-com)/.test(a.id) || /^(tel|mailto):/.test(a.href));
assert.equal(tracked.length, 6);
function activate(a, type = 'click', options = {}) {
  const anchor = {
    id: a.id, getAttribute: () => a.href,
    closest: selector => selector === '#book' && options.inBook ? anchor : null
  };
  // Clicking a nested span must resolve the surrounding anchor.
  const event = {
    type, button: type === 'auxclick' ? 1 : 0, defaultPrevented: false,
    target: { closest: selector => selector === 'a[href]' ? anchor : null },
    preventDefault() { throw new Error('Tracking must not cancel navigation'); },
    ...options
  };
  const before = calls.length;
  for (const fn of listeners[type] || []) fn(event);
  return calls.slice(before);
}
for (const a of tracked) {
  const expected = a.id === 'cms-direct-booking' ? 'direct_booking_click'
    : a.id === 'cms-booking-com' ? 'booking_com_click'
    : a.href.startsWith('tel:') ? 'phone_click' : 'email_click';
  const result = activate(a, 'click', { inBook: true });
  assert.equal(result.length, 1, 'Exactly one custom event per activation');
  assert.equal(result[0][0], 'event');
  assert.equal(result[0][1], expected);
  const params = result[0][2];
  assert.equal(params.booking_property, 'koola_palms_apartment_101');
  assert.equal(params.interaction_location, 'booking');
  assert.equal(params.intent_type, a.id ? 'booking_interest' : 'contact_interest');
  assert.equal(params.booking_channel || params.contact_method,
    a.id === 'cms-direct-booking' ? 'direct' : a.id === 'cms-booking-com' ? 'booking_com'
      : a.href.startsWith('tel:') ? 'phone' : 'email');
  assert.equal(params.transport_type, 'beacon');
  assert.equal(params.link_url, undefined);
  assert.equal(activate(a, 'auxclick').length, 1, 'Middle-click tracked once');
  assert.equal(activate(a, 'auxclick', { button: 2 }).length, 0);
  assert.equal(activate(a, 'click', { defaultPrevented: true }).length, 0);
}
assert.equal(activate(tracked[2])[0][2].interaction_location, 'contact');
for (const a of anchors.filter(a => !tracked.includes(a))) assert.equal(activate(a).length, 0);
for (const fn of listeners.click.filter(fn => fn.name === 'trackBookingEnquiryClick')) {
  fn({ type: 'click', target: {} });
}
delete window.gtag;
for (const a of tracked) assert.equal(activate(a).length, 0, 'Analytics absence does not break links');
// The real build must inject exactly one GA4 config and preserve script versioning.
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'koola-tracking-'));
try {
  fs.mkdirSync(path.join(tmp, 'content'));
  fs.copyFileSync(path.join(root, 'content/site.json'), path.join(tmp, 'content/site.json'));
  fs.writeFileSync(path.join(tmp, 'index.html'), html);
  const build = path.join(root, 'scripts/optimise-meta.js');
  execFileSync(process.execPath, [build], { cwd: tmp });
  execFileSync(process.execPath, [build], { cwd: tmp });
  const built = fs.readFileSync(path.join(tmp, 'index.html'), 'utf8');
  assert.equal((built.match(/gtag\/js\?id=G-KWZ9BC90E0/g) || []).length, 1);
  assert.equal((built.match(/gtag\("config","G-KWZ9BC90E0"/g) || []).length, 1);
  assert.equal((built.match(/<script src="assets\/site.js\?v=tracking-20261013"/g) || []).length, 1);
  assert.ok(!built.includes('booking-enquiry-tracking.js'));
  assert.equal(built.split('<body>')[1], html.split('<body>')[1]);
} finally { fs.rmSync(tmp, { recursive: true, force: true }); }
console.log('PASS: six booking/contact links, nested targets, keyboard-equivalent click, middle-click, unrelated/cancelled clicks, missing analytics, single build injection and unchanged page body.');
