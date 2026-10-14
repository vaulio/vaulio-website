/* ===================================================================
   Dispersion aléatoire des images dans .scatter, sans chevauchement.
   - Ne s'exécute que si l'écran est assez large (au-delà de 640px,
     seuil qui bascule .scatter en grille via le CSS).
   - Placement en pourcentage : reste correct si la fenêtre est
     redimensionnée entre deux visites.
   =================================================================== */

(function () {
  var MIN_WIDTH = 640; // en dessous : grille simple (voir style.css)
  var MARGIN = 14;      // marge minimale (px) entre deux images
  var MAX_TRIES = 60;   // essais avant abandon pour une image

  function placeScatter(container) {
    if (window.innerWidth < MIN_WIDTH) {
      container.classList.add("is-flow");
      return;
    }

    var figures = Array.prototype.slice.call(container.querySelectorAll("figure"));
    if (!figures.length) return;

    var cw = container.clientWidth;
    var placed = []; // rectangles déjà posés {x, y, w, h}

    figures.forEach(function (fig) {
      var img = fig.querySelector("img");
      // largeur cible aléatoire, proportionnelle au conteneur
      var w = cw * (0.16 + Math.random() * 0.16); // ~16 à 32% de la largeur
      fig.style.width = w + "px";

      var h = w * (parseFloat(fig.dataset.ratio) || 0.75); // hauteur estimée
      var maxX = Math.max(cw - w, 0);
      var maxY = Math.max(container.clientHeight - h, cw * 0.4); // zone verticale mini

      var x, y, tries = 0, ok = false;
      while (tries < MAX_TRIES && !ok) {
        x = Math.random() * maxX;
        y = Math.random() * maxY;
        ok = placed.every(function (r) {
          return (
            x + w + MARGIN < r.x ||
            x > r.x + r.w + MARGIN ||
            y + h + MARGIN < r.y ||
            y > r.y + r.h + MARGIN
          );
        });
        tries++;
      }

      // repli : empile en colonne si aucune place libre trouvée
      if (!ok) {
        x = Math.random() * maxX;
        y = placed.length ? Math.max.apply(null, placed.map(function (r) { return r.y + r.h; })) + MARGIN : 0;
      }

      fig.style.left = x + "px";
      fig.style.top = y + "px";
      placed.push({ x: x, y: y, w: w, h: h });

      // légère rotation aléatoire pour l'effet "archive" — reste discret
      var tilt = (Math.random() * 4 - 2).toFixed(2);
      fig.style.transform = "rotate(" + tilt + "deg)";
    });

    // ajuste la hauteur du conteneur pour englober toutes les images
    var bottom = Math.max.apply(null, placed.map(function (r) { return r.y + r.h; }));
    container.style.minHeight = (bottom + 40) + "px";
  }

  function init() {
    document.querySelectorAll(".scatter").forEach(placeScatter);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  /* ---------------- Visionneuse plein écran ---------------- */
  var overlay = document.getElementById("overlay");
  var overlayImg = document.getElementById("overlay-img");

  if (overlay && overlayImg) {
    document.querySelectorAll(".zoomable").forEach(function (img) {
      img.addEventListener("click", function () {
        overlayImg.src = img.dataset.full || img.src; // data-full = version HD optionnelle
        overlayImg.alt = img.alt;
        overlay.classList.add("active");
        overlay.setAttribute("aria-hidden", "false");
      });
    });

    var closeOverlay = function () {
      overlay.classList.remove("active");
      overlay.setAttribute("aria-hidden", "true");
    };
    overlay.addEventListener("click", closeOverlay);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeOverlay();
    });
  }

  /* ---------------- Diaporama ---------------- */
  function initSlideshow(root) {
    var track = root.querySelector(".slideshow__track");
    var n = track ? track.children.length : 0;
    if (!track || n < 2) return; // une seule image : rien à contrôler

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var index = 0;          // image courante, mémorisée (indépendante de la largeur)
    var resizing = false;   // évite de recalculer l'index pendant un redimensionnement

    function go(i) {
      index = (i + n) % n; // boucle : après la dernière, retour à la première
      track.scrollTo({ left: index * track.clientWidth, behavior: reduceMotion ? "auto" : "smooth" });
    }

    root.querySelectorAll(".slideshow__btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        go(index + parseInt(btn.dataset.dir, 10));
      });
    });

    // flèches du clavier quand la piste a le focus
    track.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); go(index + 1); }
      if (e.key === "ArrowLeft")  { e.preventDefault(); go(index - 1); }
    });

    // suit le glissement tactile / molette pour garder l'index à jour
    var raf;
    track.addEventListener("scroll", function () {
      if (resizing) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function () {
        index = Math.round(track.scrollLeft / track.clientWidth);
      });
    }, { passive: true });

    // au redimensionnement (ex. passage 1 colonne <-> 2 colonnes) : recale sur l'image courante
    var rt;
    window.addEventListener("resize", function () {
      resizing = true;
      track.scrollTo({ left: index * track.clientWidth, behavior: "auto" });
      clearTimeout(rt);
      rt = setTimeout(function () { resizing = false; }, 150);
    });

    root.classList.add("is-ready");
  }

  document.querySelectorAll(".slideshow").forEach(initSlideshow);

  // recalcule au redimensionnement, avec un léger différé
  var t;
  window.addEventListener("resize", function () {
    clearTimeout(t);
    t = setTimeout(function () {
      document.querySelectorAll(".scatter").forEach(function (c) {
        c.classList.remove("is-flow");
        c.removeAttribute("style");
        placeScatter(c);
      });
    }, 200);
  });
})();
