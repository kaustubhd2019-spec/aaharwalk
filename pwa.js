/* AaharWalk — service worker registration and the install prompt. */
(function () {
  "use strict";

  var standalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;

  if ("serviceWorker" in navigator && window.isSecureContext) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () { /* offline support unavailable */ });
    });
  }

  var deferred = null;
  var card = null;
  var button = null;

  function nodes() {
    card = card || document.getElementById("installCard");
    button = button || document.getElementById("installAppButton");
  }

  window.addEventListener("beforeinstallprompt", function (event) {
    event.preventDefault();
    deferred = event;
    nodes();
    if (card && !standalone) card.hidden = false;
  });

  window.addEventListener("appinstalled", function () {
    deferred = null;
    nodes();
    if (card) card.hidden = true;
  });

  document.addEventListener("DOMContentLoaded", function () {
    nodes();
    var dismiss = document.getElementById("installDismiss");
    if (dismiss) {
      dismiss.addEventListener("click", function () { if (card) card.hidden = true; });
    }
    if (!button) return;
    button.addEventListener("click", function () {
      if (!deferred) return;
      deferred.prompt();
      deferred.userChoice.then(function () {
        deferred = null;
        if (card) card.hidden = true;
      });
    });
  });
})();
