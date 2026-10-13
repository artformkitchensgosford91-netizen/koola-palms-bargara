# Apartment 101 analytics

`assets/site.js` is the sole booking/contact tracking implementation. The obsolete
`assets/booking-enquiry-tracking.js` has been removed. Do not load another click
tracker or create GA4 derived events that duplicate these event names.

| Event | Meaning | Channel parameter |
| --- | --- | --- |
| `direct_booking_click` | Open direct booking/availability page | `booking_channel=direct` |
| `booking_com_click` | Open the Booking.com listing | `booking_channel=booking_com` |
| `phone_click` | Activate a telephone link | `contact_method=phone` |
| `email_click` | Activate an email link | `contact_method=email` |

Each custom event includes `booking_property=koola_palms_apartment_101`,
`intent_type=booking_interest` or `contact_interest`, and
`interaction_location=booking` or `contact`. No full destination URLs, phone
numbers, email addresses, subjects or bodies are added as custom parameters.
Primary/touch/keyboard activations and middle-clicks are supported. Navigation
is not cancelled or delayed. CMS link updates remain supported by delegation.

## Configuration and reporting

Netlify runs `node scripts/optimise-meta.js`. The script injects the GA4 tag from
`content/site.json` (currently `G-KWZ9BC90E0`) into the analytics marker in
`index.html`. Do not add a second hard-coded tag. The versioned `site.js` URL
refreshes the formerly hour-cached script when this change deploys.

Report the two booking events as **booking interest** and the two contact events
as **contact intent / potential enquiries**. Neither proves a completed enquiry,
a phone conversation, a sent email or a reservation. Do not send `purchase`,
`generate_lead`, revenue, transaction IDs or booking-completion events for clicks.
Confirmed reservations require evidence from the external booking systems.

For weekly reporting use the four exact event names with event count and users
or sessions, split by source/medium and channel. Event counts are actions, not
guest counts. Users can click repeatedly or use several channels; do not sum
channel user counts to claim a total number of unique potential guests.
GA4's enhanced-measurement outbound `click` event may also be present; exclude it
from these custom-event totals. Exclude the unused historical name
`booking_direct_click` from new-event reporting; document any historical naming
changes rather than silently merging them as confirmed bookings.

If these are marked as key events, label them as interest/contact intent and use
once-per-session counting for a session-level interest KPI. Verify the property
settings rather than assuming a key-event configuration exists. Register the
channel/property/intent/location parameters as event-scoped custom dimensions
only if they are needed in reports.

## Verification

Run `node scripts/test-tracking.js`. This dependency-free handler/build regression
test covers all six actual homepage booking/contact anchors, nested click
targets, middle-click, unrelated links, cancelled events, absent analytics,
single GA4 configuration after repeated builds, and unchanged page body.
It does not establish Google collection or GA4 reporting receipt.

After deployment, check the published page loads the versioned script and one
GA4 tag. Activate each booking button and both placements of phone/email links.
Verify destinations without submitting a reservation, email or phone call.
With GA4 access, open Realtime or DebugView for the matching property, verify
each of the four event names and parameters, and compare the collection
requests against measurement ID `G-KWZ9BC90E0`. A loaded tag or queued browser
event alone is not proof of GA4 receipt. Test traffic should be identified or
excluded from business performance conclusions. Consent settings, blockers,
network failures and GA4 filters can affect collection.
