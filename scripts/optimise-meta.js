const fs = require("fs");
const path = require("path");

const root = process.cwd();
const indexPath = path.join(root, "index.html");
const contentPath = path.join(root, "content", "site.json");

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function absUrl(value, base) {
  if (!value) return base;
  if (/^https?:\/\//i.test(value)) return value;
  return new URL(String(value).replace(/^\/+/, ""), base).href;
}

const data = JSON.parse(fs.readFileSync(contentPath, "utf8"));
let html = fs.readFileSync(indexPath, "utf8");

const seo = data.seo || {};
const analytics = data.analytics || {};
const property = data.property || {};
const contact = data.contact || {};
const booking = data.booking || {};
const hero = data.hero || {};
const gallery = Array.isArray(data.propertyGallery) ? data.propertyGallery : [];

const canonical = (seo.canonicalUrl || "https://koolapalmsbargara.au/").replace(/\/?$/, "/");
const title = seo.title || "Koola Palms Bargara | Apartment 101 Beach Accommodation";
const description = seo.description || "Stay at Koola Palms Apartment 101 in Bargara: a fully renovated two-bedroom coastal apartment close to the beach.";
const socialTitle = seo.socialTitle || title;
const socialDescription = seo.socialDescription || description;
const socialImage = absUrl(seo.socialImage || hero.mainImage || "assets/final/hero-living.jpg", canonical);
const primaryImageAlt = "Renovated open-plan living room and designer kitchen in Koola Palms Apartment 101, Bargara";
const searchVerification = String(seo.searchConsoleVerification || "").trim();

const images = [
  socialImage,
  ...gallery.map(item => item && item.image ? absUrl(item.image, canonical) : null)
].filter(Boolean).filter((value, index, array) => array.indexOf(value) === index).slice(0, 12);

const schema = {
  "@context": "https://schema.org",
  "@type": "VacationRental",
  "identifier": "koola-palms-apartment-101",
  "name": property.name || "Koola Palms Bargara – Apartment 101",
  "description": "Fully renovated, designer-appointed two-bedroom ground-floor holiday apartment in Bargara, Queensland, with two queen beds, a living room sofa bed, designer kitchen and private outdoor entertaining overlooking Nelson Park. Resort pool and spa access; Bargara Beach, cafes and the Surf Club are a short walk away. Sleeps up to five guests.",
  "additionalType": "Apartment",
  "url": canonical,
  "image": [
    {
      "@type": "ImageObject",
      "@id": canonical + "#primaryimage",
      "url": socialImage,
      "contentUrl": socialImage,
      "name": primaryImageAlt,
      "caption": primaryImageAlt,
      "representativeOfPage": true
    },
    ...images.filter(image => image !== socialImage)
  ],
  "subjectOf": {
    "@type": "WebPage",
    "@id": canonical + "#webpage",
    "url": canonical,
    "name": title,
    "description": description,
    "primaryImageOfPage": { "@id": canonical + "#primaryimage" }
  },
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
  "containsPlace": {
    "@type": "Accommodation",
    "additionalType": "EntirePlace",
    "numberOfBathroomsTotal": 1,
    "bed": [
      { "@type": "BedDetails", "numberOfBeds": 2, "typeOfBed": "Queen" },
      { "@type": "BedDetails", "numberOfBeds": 1, "typeOfBed": "SofaBed" }
    ],
    "numberOfBedrooms": Number(property.bedrooms || 2),
    "occupancy": {
      "@type": "QuantitativeValue",
      "value": Number(property.guests || 4)
    },
    "amenityFeature": [
      "Wi-Fi",
      "Air conditioning",
      "Kitchen",
      "Laundry",
      "Swimming pool",
      "Spa",
      "Parking",
      "Beach access"
    ].map(name => ({
      "@type": "LocationFeatureSpecification",
      "name": name,
      "value": true
    }))
  },
  "sameAs": [booking.bookingComUrl, booking.directUrl].filter(Boolean)
};

const lat = Number(property.latitude);
const lng = Number(property.longitude);
if (property.latitude !== "" && property.longitude !== "" && Number.isFinite(lat) && Number.isFinite(lng)) {
  schema.geo = { "@type": "GeoCoordinates", "latitude": lat, "longitude": lng };
  schema.latitude = lat;
  schema.longitude = lng;
}

const seoBlock = [
  "<!-- SEO:START -->",
  "  <title>" + esc(title) + "</title>",
  '  <meta name="description" content="' + esc(description) + '" />',
  '  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" />',
  '  <link rel="canonical" href="' + esc(canonical) + '" />',
  searchVerification ? '  <meta name="google-site-verification" content="' + esc(searchVerification) + '" />' : "",
  '  <meta property="og:locale" content="en_AU" />',
  '  <meta property="og:type" content="website" />',
  '  <meta property="og:title" content="' + esc(socialTitle) + '" />',
  '  <meta property="og:description" content="' + esc(socialDescription) + '" />',
  '  <meta property="og:url" content="' + esc(canonical) + '" />',
  '  <meta property="og:image" content="' + esc(socialImage) + '" />',
  '  <meta property="og:image:alt" content="' + esc(primaryImageAlt) + '" />',
  '  <meta property="og:site_name" content="Koola Palms Bargara" />',
  '  <meta name="twitter:card" content="summary_large_image" />',
  '  <meta name="twitter:title" content="' + esc(socialTitle) + '" />',
  '  <meta name="twitter:description" content="' + esc(socialDescription) + '" />',
  '  <meta name="twitter:image" content="' + esc(socialImage) + '" />',
  '  <meta name="twitter:image:alt" content="' + esc(primaryImageAlt) + '" />',
  '  <script type="application/ld+json">' + JSON.stringify(schema).replace(/</g, "\\u003c") + "</script>",
  '  <link rel="preload" as="image" href="' + esc(socialImage) + '" fetchpriority="high" />',
  "<!-- SEO:END -->"
].filter(Boolean).join("\n");

html = html.replace(/<!-- SEO:START -->[\s\S]*?<!-- SEO:END -->/, seoBlock);

const ga4 = String(analytics.ga4MeasurementId || "").trim();
let analyticsBlock = "<!-- ANALYTICS:START -->\n";
if (/^G-[A-Z0-9]+$/i.test(ga4)) {
  analyticsBlock += '  <script async src="https://www.googletagmanager.com/gtag/js?id=' + esc(ga4) + '"></script>\n';
  analyticsBlock += '  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag("js",new Date());gtag("config","' + esc(ga4) + '",{anonymize_ip:true});</script>\n';
} else {
  analyticsBlock += "  <!-- GA4 will be enabled automatically when a valid G- measurement ID is entered in the CMS. -->\n";
}
analyticsBlock += "<!-- ANALYTICS:END -->";
html = html.replace(/<!-- ANALYTICS:START -->[\s\S]*?<!-- ANALYTICS:END -->/, analyticsBlock);

// Preconnect to the video host without touching the page layout.
if (!html.includes('href="https://www.dropbox.com"')) {
  html = html.replace("</head>", '  <link rel="preconnect" href="https://www.dropbox.com" crossorigin />\n  <link rel="dns-prefetch" href="//www.dropbox.com" />\n</head>');
}

fs.writeFileSync(indexPath, html);

const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync(path.join(root, "robots.txt"), [
  "User-agent: *",
  "Allow: /",
  "Disallow: /admin/",
  "Sitemap: " + canonical + "sitemap.xml",
  ""
].join("\n"));

fs.writeFileSync(path.join(root, "sitemap.xml"), [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
  "  <url>",
  "    <loc>" + esc(canonical) + "</loc>",
  "    <image:image>",
  "      <image:loc>" + esc(socialImage) + "</image:loc>",
  "      <image:title>" + esc(primaryImageAlt) + "</image:title>",
  "    </image:image>",
  "    <lastmod>" + today + "</lastmod>",
  "    <changefreq>weekly</changefreq>",
  "    <priority>1.0</priority>",
  "  </url>",
  "  <url>",
  "    <loc>" + esc(canonical + "bargara-holiday-apartment.html") + "</loc>",
  "    <lastmod>" + today + "</lastmod>",
  "    <changefreq>monthly</changefreq>",
  "    <priority>0.8</priority>",
  "  </url>",
  "</urlset>",
  ""
].join("\n"));

console.log("Koola Palms metadata, schema, analytics hooks, robots.txt and sitemap.xml updated safely.");
