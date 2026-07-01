/* AaharWalk install helper */
(function () {
  "use strict";

  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;

  function $(id) {
    return document.getElementById(id);
  }

  function showInstallCard(message) {
    const card = $("installCard");
    if (!card || isStandalone) return;
    card.hidden = false;
    const note = $("installHelp");
    if (note && message) note.textContent = message;
  }

  function hideInstallCard() {
    const card = $("installCard");
    if (card) card.hidden = true;
  }

  if ("serviceWorker" in navigator && window.isSecureContext) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(() => {
        showInstallCard("App install works after this folder is hosted on HTTPS, such as Netlify, GitHub Pages, or your own website.");
      });
    });
  } else if (!isStandalone) {
    showInstallCard("For normal app installation, host this folder on HTTPS, then open it in Chrome or Safari and choose Install/Add to Home Screen.");
  }

  let deferredPrompt = null;

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    deferredPrompt = event;
    showInstallCard("Tap Install app to add AaharWalk to your phone like a normal app.");
    const button = $("installAppButton");
    if (button) button.disabled = false;
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    hideInstallCard();
  });

  document.addEventListener("DOMContentLoaded", () => {
    const button = $("installAppButton");
    if (button) {
      button.addEventListener("click", async () => {
        if (!deferredPrompt) {
          showInstallCard("Open this hosted site in Chrome and use browser menu → Install app. On iPhone, Safari → Share → Add to Home Screen.");
          return;
        }

        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        deferredPrompt = null;
      });
    }

    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (isIOS && !isStandalone) {
      showInstallCard("On iPhone: open in Safari, tap Share, then Add to Home Screen.");
    }
  });
})();
