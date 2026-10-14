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

const overlay = document.getElementById('overlay');
const overlayImg = document.getElementById('overlay-img');
const zoomableImages = document.querySelectorAll('.zoomable');

zoomableImages.forEach(img => {
  img.addEventListener('click', () => {
    overlayImg.src = img.src;
    overlayImg.alt = img.alt;
    overlay.classList.add('active');
  });
});

// Click anywhere on overlay to close
overlay.addEventListener('click', () => {
  overlay.classList.remove('active');
});

// Optional: close with Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    overlay.classList.remove('active');
  }
});

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
