(function () {
  function normalizePath(path) {
    if (!path) return "";
    return path.startsWith("/") ? path : path;
  }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el && typeof value === "string") el.textContent = value;
  }

  function setImage(id, value) {
    var el = document.getElementById(id);
    if (el && value) el.src = normalizePath(value);
  }

  function buildPhotoCard(item, isFeatured) {
    var link = document.createElement("a");
    link.className = "photo-card reveal" + (isFeatured ? " photo-feature" : "");
    link.href = normalizePath(item.image);
    link.setAttribute("data-lightbox", "");
    link.setAttribute("data-caption", item.lightboxCaption || item.caption || item.title || "");

    var img = document.createElement("img");
    if (Number.isInteger(item.width) && item.width > 0 && Number.isInteger(item.height) && item.height > 0) {
      img.width = item.width;
      img.height = item.height;
    }
    img.src = normalizePath(item.image);
    img.alt = item.alt || item.title || "Koola Palms Bargara";
    img.decoding = "async";
    if (!isFeatured) img.loading = "lazy";

    var copy = document.createElement("div");
    copy.className = "photo-copy";
    var h3 = document.createElement("h3");
    h3.textContent = item.title || "";
    var p = document.createElement("p");
    p.textContent = item.caption || "";
    copy.appendChild(h3);
    copy.appendChild(p);

    link.appendChild(img);
    link.appendChild(copy);
    return link;
  }

  function renderGallery(id, items, allowFeatured) {
    var grid = document.getElementById(id);
    if (!grid || !Array.isArray(items) || !items.length) return;
    grid.innerHTML = "";
    items.forEach(function (item, index) {
      var featured = allowFeatured && (item.featured === true || index === 0 && !items.some(function (x) { return x.featured === true; }));
      grid.appendChild(buildPhotoCard(item, featured));
    });
  }

  function applyContent(data) {
    if (data.hero) {
      setText("cms-hero-eyebrow", data.hero.eyebrow);
      setText("cms-hero-headline", data.hero.headline);
      setText("cms-hero-accent", data.hero.headlineAccent);
      setText("cms-hero-lead", data.hero.lead);
      setImage("cms-hero-main", data.hero.mainImage);
      setImage("cms-hero-secondary", data.hero.secondaryImage);
    }

    renderGallery("cms-property-gallery", data.propertyGallery, true);
    renderGallery("cms-local-gallery", data.localGallery, false);

    if (data.booking) {
      var direct = document.getElementById("cms-direct-booking");
      var booking = document.getElementById("cms-booking-com");
      if (direct && data.booking.directUrl) direct.href = data.booking.directUrl;
      if (booking && data.booking.bookingComUrl) booking.href = data.booking.bookingComUrl;
    }

    if (data.contact) {
      document.querySelectorAll(".cms-contact-phone").forEach(function (phone) {
        if (data.contact.phoneDisplay) phone.textContent = data.contact.phoneDisplay;
        if (data.contact.phoneLink) phone.href = "tel:" + data.contact.phoneLink;
      });
      document.querySelectorAll(".cms-contact-email").forEach(function (email) {
        if (data.contact.email) {
          email.textContent = data.contact.email;
          email.href = "mailto:" + data.contact.email;
        }
      });
      setText("cms-contact-address", data.contact.address);
    }

    document.dispatchEvent(new CustomEvent("koolaCmsContentReady"));
  }

  fetch("content/site.json", { cache: "no-store" })
    .then(function (response) {
      if (!response.ok) throw new Error("Unable to load CMS content");
      return response.json();
    })
    .then(applyContent)
    .catch(function (error) {
      console.warn("Koola Palms CMS content fallback in use:", error);
      document.dispatchEvent(new CustomEvent("koolaCmsContentReady"));
    });
})();
