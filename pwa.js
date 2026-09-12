/* AaharWalk — service worker registration and the install prompt. */
(function () {
  "use strict";

  var standalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;

  // Inside the Android app every file already ships in the APK, and the shell
  // list would not resolve against the asset loader, so there is nothing for a
  // service worker to do.
  var inAndroidApp = typeof window.AndroidSteps !== "undefined";

  if (!inAndroidApp && "serviceWorker" in navigator && window.isSecureContext) {
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
    if (inAndroidApp) { return; }   // already a real installed app
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
