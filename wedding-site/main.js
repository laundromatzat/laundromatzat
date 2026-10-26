// Everything here is enhancement. The page reads fine without it.
(function () {
  "use strict";
  var W = window.WEDDING || {};
  var root = document.documentElement;
  var fallback = root.classList.contains("sd-fallback");
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  // ── Facts from config.js ──────────────────────────────────────
  var start = W.start ? new Date(W.start) : null;
  var dateFmt = { year: "numeric", month: "long", day: "numeric" };

  if (start) {
    $$("[data-wedding-date]").forEach(function (el) {
      el.textContent = start.toLocaleDateString("en-US", dateFmt);
      if (el.tagName === "TIME") el.dateTime = W.start.slice(0, 10);
    });
  }
  $$("[data-venue-short]").forEach(function (el) { if (W.venueShort) el.textContent = W.venueShort; });
  $$("[data-venue-name]").forEach(function (el) { if (W.venueName) el.textContent = W.venueName; });
  $$("[data-rsvp-deadline]").forEach(function (el) {
    if (!W.rsvpDeadline) return;
    el.dateTime = W.rsvpDeadline;
    el.textContent = new Date(W.rsvpDeadline + "T12:00:00").toLocaleDateString("en-US", dateFmt);
  });

  // ── Countdown ─────────────────────────────────────────────────
  var count = $("[data-countdown]");
  if (count && start) {
    var days = Math.ceil((start - Date.now()) / 864e5);
    count.textContent =
      days > 1 ? days + " days to go" : days === 1 ? "Tomorrow" : days === 0 ? "Today" : "Thank you for celebrating with us";
  }

  // ── Add to calendar (.ics generated in the browser) ───────────
  var calBtn = $("[data-add-to-calendar]");
  if (calBtn && start) {
    calBtn.addEventListener("click", function () {
      var end = new Date(start.getTime() + (W.durationHours || 6) * 36e5);
      var stamp = function (d) {
        // Floating local time, so guests see the venue's clock.
        var p = function (n) { return String(n).padStart(2, "0"); };
        return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + "T" + p(d.getHours()) + p(d.getMinutes()) + "00";
      };
      var esc = function (s) { return String(s || "").replace(/[,;\\]/g, "\\$&"); };
      var ics = [
        "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//wedding-site//EN", "BEGIN:VEVENT",
        "UID:" + stamp(start) + "@wedding-site",
        "DTSTAMP:" + stamp(new Date()),
        "DTSTART:" + stamp(start), "DTEND:" + stamp(end),
        "SUMMARY:" + esc((W.names || "Our") + " wedding"),
        "LOCATION:" + esc([W.venueName, W.venueAddress].filter(Boolean).join(", ")),
        "END:VEVENT", "END:VCALENDAR",
      ].join("\r\n");
      var a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
      a.download = "wedding.ics";
      a.click();
      URL.revokeObjectURL(a.href);
    });
  }

  // ── Chapter dots: mark whichever section is mid-screen ────────
  var links = $$(".chapters a");
  var byId = {};
  links.forEach(function (a) { byId[a.dataset.target] = a; });
  if ("IntersectionObserver" in window && links.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.removeAttribute("aria-current"); });
        var a = byId[e.target.id];
        if (a) a.setAttribute("aria-current", "true");
      });
    }, { rootMargin: "-45% 0px -45% 0px" });
    Object.keys(byId).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
  }

  // ── Fallback engine: only when CSS scroll-driven animations are missing ──
  if (fallback) {
    // Reveals, blooms and the schedule line fire once when they enter.
    if ("IntersectionObserver" in window) {
      var seen = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add("in"); seen.unobserve(e.target); }
        });
      }, { threshold: 0.15 });
      $$(".reveal, .bloom, [data-observe]").forEach(function (el) { seen.observe(el); });
    } else {
      $$(".reveal, .bloom, [data-observe]").forEach(function (el) { el.classList.add("in"); });
    }

    // Story progress (--p) and page progress (--page-p), one rAF-throttled listener.
    var story = $(".story");
    var beats = $$(".beat");
    var ticking = false;
    var clamp01 = function (n) { return Math.min(1, Math.max(0, n)); };

    var update = function () {
      ticking = false;
      var doc = root.scrollHeight - innerHeight;
      root.style.setProperty("--page-p", doc > 0 ? clamp01(scrollY / doc) : 0);
      if (!story) return;
      var top = story.getBoundingClientRect().top + scrollY;
      var p = clamp01((scrollY - top) / (story.offsetHeight - innerHeight));
      story.style.setProperty("--p", p);
      story.dataset.ready = "";
      var active = Math.min(beats.length - 1, Math.floor(p * beats.length));
      beats.forEach(function (b, i) { b.classList.toggle("is-active", i === active); });
    };
    var onScroll = function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    update();
  }

  // ── RSVP ──────────────────────────────────────────────────────
  var form = $("[data-rsvp]");
  if (form) {
    var status = $(".form__status", form);
    var say = function (msg, state) { status.textContent = msg; status.dataset.state = state || ""; };

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var data = Object.fromEntries(new FormData(form).entries());
      if (!data.name || !data.email || !data.attending) {
        say("Please add your name, email, and whether you can make it.", "error");
        return;
      }
      var cfg = W.rsvp || {};
      if (cfg.endpoint) {
        say("Sending…");
        fetch(cfg.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(data),
        })
          .then(function (r) {
            if (!r.ok) throw new Error(r.status);
            form.reset();
            say("Thank you! Your RSVP is in.");
          })
          .catch(function () { say("That didn’t go through. Please try again, or email us directly.", "error"); });
      } else if (cfg.email) {
        var body = Object.keys(data).map(function (k) { return k + ": " + data[k]; }).join("\n");
        location.href = "mailto:" + cfg.email + "?subject=" + encodeURIComponent("RSVP — " + data.name) +
          "&body=" + encodeURIComponent(body);
        say("Opening your email app to send the RSVP…");
      } else {
        say("RSVP isn’t connected yet. Set rsvp.endpoint or rsvp.email in config.js.", "error");
      }
    });
  }
})();
