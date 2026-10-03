// ==UserScript==
// @name         Letterboxd Services
// @namespace    https://letterboxd.com/
// @version      0.7.2
// @description  Add external movie search links to Letterboxd film pages.
// @match        https://letterboxd.com/film/*
// @match        https://letterboxd.com/*/film/*
// @run-at       document-idle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function () {
  "use strict";

  const MODE_KEY = "serviceMode";
  const MODES = [
    ["external", "External Services Only"],
    ["combine", "Combine Services"],
    ["disabled", "Disabled"],
  ];

  function getQuery() {
    const details = document.querySelector(".details");
    const title = details?.querySelector("h1")?.innerText ?? "";
    const year = details?.querySelector(".releaseyear > a")?.innerText ?? "";
    return `${title} ${year}`.trim();
  }

  function getImdbId() {
    const href = document.querySelector('.micro-button[href*="imdb.com/title/"]')?.href;
    return href?.match(/\/title\/(tt\d+)/)?.[1] ?? "";
  }

  function getServices(query, imdbId) {
    const encodedQuery = encodeURIComponent(query);

    return [
      {
        name: "BT4G",
        url: `https://bt4gprx.com/search?q=${encodedQuery}`,
        icon: "https://bt4gprx.com/static/favicon.ico",
      },
      {
        name: "1337x",
        url: `https://1337x.to/search/${encodedQuery}/1/`,
        icon: "https://a.favicon.im/1337x.to?larger=true",
      },
      {
        name: "Lime Torrents",
        url: `https://www.limetorrents.fun/search/all/${encodedQuery}/`,
        icon: "https://www.limetorrents.fun/favicon.ico",
      },
      {
        name: "Nyaa",
        url: `https://nyaa.si/?f=0&c=0_0&q=${encodedQuery}`,
        icon: "https://nyaa.si/static/favicon.png",
      },
      {
        name: "YouTube",
        url: `https://www.youtube.com/results?search_query=${encodedQuery}`,
        icon: "https://www.youtube.com/favicon.ico",
      },
    ];
  }

  function addService(container, { name, url, icon }) {
    const link = document.createElement("a");
    link.className = "label";
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    const brand = document.createElement("span");
    brand.className = "brand";

    const image = document.createElement("img");
    image.src = icon;
    image.width = 20;
    image.height = 20;
    image.alt = "";
    brand.append(image);

    const title = document.createElement("span");
    title.className = "title";
    title.innerText = name;
    link.append(brand, title);

    const item = document.createElement("p");
    item.className = "service";
    item.dataset.letterboxdService = "true";
    item.append(link);
    container.prepend(item);
  }

  function initialize(container, mode) {
    document
      .querySelectorAll(
        "p.service:nth-child(7), div.other:nth-child(2), div.other:nth-child(3), " +
          ".showmore.js-expand-services.service, .-showmore.js-expand-services.service, " +
          "div.other:nth-child(1)"
      )
      .forEach((element) => element.style.setProperty("display", "none", "important"));

    if (mode === "external") {
      [...container.children].forEach((child) => {
        if (child.id) child.remove();
      });
    }

    if (mode === "disabled") return;

    container.querySelectorAll("[data-letterboxd-service]").forEach((item) => item.remove());
    const services = getServices(getQuery(), getImdbId());
    services.forEach((service) => addService(container, service));

    if (!document.getElementById("letterboxd-services-style")) {
      const style = document.createElement("style");
      style.id = "letterboxd-services-style";
      style.textContent = ".services > .service { display: flex !important; }";
      document.head.append(style);
    }
  }

  function registerModeCommands() {
    const currentMode = GM_getValue(MODE_KEY, "combine");
    MODES.forEach(([mode, label]) => {
      GM_registerMenuCommand(`${currentMode === mode ? "* " : ""}${label}`, () => {
        GM_setValue(MODE_KEY, mode);
        location.reload();
      });
    });
    return currentMode;
  }

  function waitForAvailability(mode) {
    const watch = document.querySelector("#watch");
    const container = watch?.querySelector(".services");
    const unavailable = watch?.querySelector(".js-not-streaming");

    if (!watch || (!container && !unavailable)) {
      window.setTimeout(() => waitForAvailability(mode), 500);
      return;
    }

    if (!container && mode !== "disabled") {
      const services = document.createElement("div");
      services.className = "services";
      initialize(services, mode);
      unavailable.after(services);
      return;
    }

    if (container) initialize(container, mode);
  }

  waitForAvailability(registerModeCommands());
})();
