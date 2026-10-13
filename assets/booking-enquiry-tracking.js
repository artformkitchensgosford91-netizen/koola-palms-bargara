// Koola Palms Apartment 101: outbound booking and enquiry tracking.
// A click indicates interest, not a confirmed booking.
(function () {
  "use strict";
  document.addEventListener("click", function (event) {
    var anchor = event.target.closest && event.target.closest("a[href]");
    if (!anchor || typeof window.gtag !== "function") return;
    var href = anchor.getAttribute("href") || "";
    var name = "";
    var channel = "";
    if (anchor.id === "cms-direct-booking") {
      name = "booking_direct_click"; channel = "direct_booking";
    } else if (anchor.id === "cms-booking-com") {
      name = "booking_com_click"; channel = "booking_com";
    } else if (/^tel:/i.test(href)) {
      name = "phone_click"; channel = "phone";
    } else if (/^mailto:/i.test(href)) {
      name = "email_click"; channel = "email";
    }
    if (!name) return;
    window.gtag("event", name, {
      booking_property: "koola_palms_apartment_101",
      enquiry_channel: channel,
      link_url: anchor.href,
      transport_type: "beacon"
    });
  });
})();
