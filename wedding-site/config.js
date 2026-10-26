// The handful of facts the page computes from. Everything else is plain text in index.html.
window.WEDDING = {
  names: "Alex & Jordan",
  // Local time at the venue, ISO format. Drives the countdown and the calendar file.
  start: "2027-06-12T16:00:00",
  durationHours: 7,
  venueName: "Venue Name",
  venueShort: "Venue Name, City",
  venueAddress: "Street Address, City, State",
  rsvpDeadline: "2027-05-01",
  rsvp: {
    // Set one. If `endpoint` is a URL (Formspree, Netlify Forms, your own), the form POSTs JSON there.
    // Otherwise it opens an email to `email` pre-filled with the answers.
    endpoint: "",
    email: "rsvp@example.com",
  },
};
