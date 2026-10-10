const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const root = process.cwd();
const out = path.join(root, "dist");
const data = JSON.parse(fs.readFileSync(path.join(root, "content", "site.json"), "utf8"));

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function absoluteUrl(value, base) {
  if (!value) return base;
  if (/^https?:\/\//i.test(value)) return value;
  return new URL(String(value).replace(/^\/+/, ""), base).href;
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

async function optimiseImages() {
  const imageMeta = new Map();
  const assetsDir = path.join(out, "assets");
  const sourceImages = walk(assetsDir).filter(file => /\.(jpe?g|png)$/i.test(file));

  for (const file of sourceImages) {
    const rel = path.relative(out, file).split(path.sep).join("/");
    try {
      const image = sharp(file, { failOn: "none" }).rotate();
      const meta = await image.metadata();
      imageMeta.set(rel, { width: meta.width || null, height: meta.height || null });

      const webpFile = file.replace(/\.(jpe?g|png)$/i, ".webp");
      await image.webp({ quality: 82, effort: 4 }).toFile(webpFile);
      const webpRel = path.relative(out, webpFile).split(path.sep).join("/");
      imageMeta.set(webpRel, { width: meta.width || null, height: meta.height || null });
    } catch (error) {
      console.warn("Image optimisation skipped:", rel, error.message);
    }
  }
  return imageMeta;
}

function webpPath(value) {
  if (!value || /^https?:\/\//i.test(value)) return value;
  if (!/\.(jpe?g|png)$/i.test(value)) return value;
  return value.replace(/\.(jpe?g|png)$/i, ".webp");
}

function dimensionsFor(imageMeta, value) {
  if (!value || /^https?:\/\//i.test(value)) return "";
  const key = value.replace(/^\/+/, "");
  const meta = imageMeta.get(key) || imageMeta.get(webpPath(key));
  if (!meta || !meta.width || !meta.height) return "";
  return ' width="' + meta.width + '" height="' + meta.height + '"';
}

async function main() {
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });

  for (const dir of ["admin", "assets", "content"]) {
    const src = path.join(root, dir);
    if (fs.existsSync(src)) fs.cpSync(src, path.join(out, dir), { recursive: true });
  }
  fs.copyFileSync(path.join(root, "index.html"), path.join(out, "index.html"));

  const imageMeta = await optimiseImages();

  const seo = data.seo || {};
  const analytics = data.analytics || {};
  const property = data.property || {};
  const contact = data.contact || {};
  const booking = data.booking || {};

  const canonical = (seo.canonicalUrl || "https://koolapalmsbargara.au/").replace(/\/?$/, "/");
  const title = seo.title || "Koola Palms Bargara | Apartment 101 Beach Accommodation";
  const description = seo.description || "Stay at Koola Palms Apartment 101 in Bargara: a fully renovated two-bedroom ground-floor apartment near the beach.";
  const socialTitle = seo.socialTitle || title;
  const socialDescription = seo.socialDescription || description;
  const socialImage = absoluteUrl(seo.socialImage || "assets/final/hero-living.jpg", canonical);
  const verification = String(seo.searchConsoleVerification || "").trim();

  const allImages = []
    .concat(data.propertyGallery || [])
    .concat(data.localGallery || [])
    .map(item => absoluteUrl(item.image, canonical))
    .filter(Boolean);

  const schema = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    "name": property.name || "Koola Palms Bargara – Apartment 101",
    "description": description,
    "url": canonical,
    "image": allImages.slice(0, 12),
    "telephone": contact.phoneDisplay || "",
    "email": contact.email || "",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": property.streetAddress || "52 Johnson Street",
      "addressLocality": property.addressLocality || "Bargara",
      "addressRegion": property.addressRegion || "QLD",
      "postalCode": property.postalCode || "4670",
      "addressCountry": property.addressCountry || "AU"
    },
    "sameAs": [booking.bookingComUrl, booking.directUrl].filter(Boolean),
    "amenityFeature": [
      "Wi-Fi", "Air conditioning", "Kitchen", "Laundry", "Swimming pool", "Spa", "Parking"
    ].map(name => ({
      "@type": "LocationFeatureSpecification",
      "name": name,
      "value": true
    }))
  };

  const lat = Number(property.latitude);
  const lng = Number(property.longitude);
  if (Number.isFinite(lat) && Number.isFinite(lng) && property.latitude !== "" && property.longitude !== "") {
    schema.geo = { "@type": "GeoCoordinates", latitude: lat, longitude: lng };
  }

  const seoBlock = [
    "<!-- SEO:START -->",
    "  <title>" + esc(title) + "</title>",
    '  <meta name="description" content="' + esc(description) + '" />',
    '  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" />',
    '  <link rel="canonical" href="' + esc(canonical) + '" />',
    verification ? '  <meta name="google-site-verification" content="' + esc(verification) + '" />' : "",
    '  <meta property="og:locale" content="en_AU" />',
    '  <meta property="og:type" content="website" />',
    '  <meta property="og:title" content="' + esc(socialTitle) + '" />',
    '  <meta property="og:description" content="' + esc(socialDescription) + '" />',
    '  <meta property="og:url" content="' + esc(canonical) + '" />',
    '  <meta property="og:image" content="' + esc(socialImage) + '" />',
    '  <meta property="og:site_name" content="Koola Palms Bargara" />',
    '  <meta name="twitter:card" content="summary_large_image" />',
    '  <meta name="twitter:title" content="' + esc(socialTitle) + '" />',
    '  <meta name="twitter:description" content="' + esc(socialDescription) + '" />',
    '  <meta name="twitter:image" content="' + esc(socialImage) + '" />',
    '  <script type="application/ld+json">' + JSON.stringify(schema).replace(/</g, "\\u003c") + "</script>",
    "  <!-- SEO:END -->"
  ].filter(Boolean).join("\n");

  let analyticsBlock = "<!-- ANALYTICS:START -->\n";
  const ga4 = String(analytics.ga4MeasurementId || "").trim();
  if (/^G-[A-Z0-9]+$/i.test(ga4)) {
    analyticsBlock += '  <script async src="https://www.googletagmanager.com/gtag/js?id=' + esc(ga4) + '"></script>\n';
    analyticsBlock += '  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag("js",new Date());gtag("config","' + esc(ga4) + '");</script>\n';
  } else {
    analyticsBlock += "  <!-- Add a GA4 Measurement ID in the CMS to enable analytics. -->\n";
  }
  analyticsBlock += "  <!-- ANALYTICS:END -->";

  let html = fs.readFileSync(path.join(out, "index.html"), "utf8");
  html = html.replace(/<!-- SEO:START -->[\s\S]*?<!-- SEO:END -->/, seoBlock);
  html = html.replace(/<!-- ANALYTICS:START -->[\s\S]*?<!-- ANALYTICS:END -->/, analyticsBlock);

  function replaceText(id, value) {
    if (value == null) return;
    const re = new RegExp('(<[^>]+id="' + id + '"[^>]*>)[\\s\\S]*?(<\\/[^>]+>)');
    html = html.replace(re, "$1" + esc(value) + "$2");
  }

  replaceText("cms-hero-eyebrow", data.hero && data.hero.eyebrow);
  replaceText("cms-hero-headline", data.hero && data.hero.headline);
  replaceText("cms-hero-accent", data.hero && data.hero.headlineAccent);
  replaceText("cms-hero-lead", data.hero && data.hero.lead);
  replaceText("cms-contact-address", contact.address);

  if (data.hero && data.hero.mainImage) {
    const hero = webpPath(data.hero.mainImage);
    html = html.replace(
      /(<img id="cms-hero-main" src=")[^"]*("[^>]*)(>)/,
      (_, a, b, c) => a + esc(hero) + b.replace(/\swidth="[^"]*"\sheight="[^"]*"/g, "") + dimensionsFor(imageMeta, hero) + c
    );
  }
  if (data.hero && data.hero.secondaryImage) {
    const hero2 = webpPath(data.hero.secondaryImage);
    html = html.replace(
      /(<img id="cms-hero-secondary" src=")[^"]*("[^>]*)(>)/,
      (_, a, b, c) => a + esc(hero2) + b.replace(/\swidth="[^"]*"\sheight="[^"]*"/g, "") + dimensionsFor(imageMeta, hero2) + c
    );
  }
  if (booking.directUrl) {
    html = html.replace(/(id="cms-direct-booking" href=")[^"]*(")/, "$1" + esc(booking.directUrl) + "$2");
  }
  if (booking.bookingComUrl) {
    html = html.replace(/(id="cms-booking-com" href=")[^"]*(")/, "$1" + esc(booking.bookingComUrl) + "$2");
  }

  if (contact.phoneDisplay && contact.phoneLink) {
    html = html.replace(
      /<a class="cms-contact-phone" href="tel:[^"]*">[^<]*<\/a>/g,
      '<a class="cms-contact-phone" href="tel:' + esc(contact.phoneLink) + '">' + esc(contact.phoneDisplay) + "</a>"
    );
  }
  if (contact.email) {
    html = html.replace(
      /<a class="cms-contact-email" href="mailto:[^"]*">[^<]*<\/a>/g,
      '<a class="cms-contact-email" href="mailto:' + esc(contact.email) + '">' + esc(contact.email) + "</a>"
    );
  }

  function photoCards(items, allowFeatured) {
    return (items || []).map((item, index) => {
      const featured = allowFeatured && (item.featured === true || (index === 0 && !(items || []).some(x => x.featured === true)));
      const image = webpPath(item.image);
      return [
        '        <a class="photo-card' + (featured ? " photo-feature" : "") + ' reveal" href="' + esc(image) + '" data-lightbox data-caption="' + esc(item.lightboxCaption || item.caption || item.title || "") + '">',
        '          <img src="' + esc(image) + '" alt="' + esc(item.alt || item.title || "Koola Palms Bargara") + '"' + dimensionsFor(imageMeta, image) + (featured ? "" : ' loading="lazy"') + ' decoding="async" />',
        '          <div class="photo-copy"><h3>' + esc(item.title || "") + '</h3><p>' + esc(item.caption || "") + "</p></div>",
        "        </a>"
      ].join("\n");
    }).join("\n\n");
  }

  html = html.replace(
    /<!-- CMS_PROPERTY_GALLERY_START -->[\s\S]*?<!-- CMS_PROPERTY_GALLERY_END -->/,
    "<!-- CMS_PROPERTY_GALLERY_START -->\n" + photoCards(data.propertyGallery, true) + "\n        <!-- CMS_PROPERTY_GALLERY_END -->"
  );
  html = html.replace(
    /<!-- CMS_LOCAL_GALLERY_START -->[\s\S]*?<!-- CMS_LOCAL_GALLERY_END -->/,
    "<!-- CMS_LOCAL_GALLERY_START -->\n" + photoCards(data.localGallery, false) + "\n        <!-- CMS_LOCAL_GALLERY_END -->"
  );

  // Convert remaining local image references in the public page to generated WebP files.
  html = html.replace(
    /(src|poster)="(assets\/[^"]+\.(?:jpe?g|png))"/gi,
    (_, attr, value) => attr + '="' + esc(webpPath(value)) + '"'
  );

  fs.writeFileSync(path.join(out, "index.html"), html);

  const robots = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin/",
    "Sitemap: " + canonical + "sitemap.xml",
    ""
  ].join("\n");
  fs.writeFileSync(path.join(out, "robots.txt"), robots);

  const today = new Date().toISOString().slice(0, 10);
  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    "  <url>",
    "    <loc>" + esc(canonical) + "</loc>",
    "    <lastmod>" + today + "</lastmod>",
    "    <changefreq>weekly</changefreq>",
    "    <priority>1.0</priority>",
    "  </url>",
    "</urlset>",
    ""
  ].join("\n");
  fs.writeFileSync(path.join(out, "sitemap.xml"), sitemap);

  console.log("Built Koola Palms with CMS prerendering, SEO, analytics hooks and WebP optimisation.");
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
