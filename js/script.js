(function () {
  'use strict';

  var clamp = function (v, min, max) { return Math.min(max, Math.max(min, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var mapRange = function (v, inMin, inMax, outMin, outMax) {
    var t = clamp((v - inMin) / (inMax - inMin), 0, 1);
    return lerp(outMin, outMax, t);
  };

  /* ---------------- header nav toggle ---------------- */
  var navToggle = document.getElementById('nav-toggle');
  var mainNav = document.getElementById('main-nav');
  if (navToggle && mainNav) {
    navToggle.addEventListener('click', function () {
      var open = mainNav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    mainNav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        mainNav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------------- header shadow / condense on scroll ---------------- */
  var header = document.getElementById('site-header');
  var lastY = window.scrollY;
  window.addEventListener('scroll', function () {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 10);
    lastY = window.scrollY;
  }, { passive: true });

  /* ---------------- menu tabs ---------------- */
  var tabs = document.querySelectorAll('.menu-tab');
  var panels = document.querySelectorAll('.menu-panel');
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) { t.classList.remove('is-active'); t.setAttribute('aria-selected', 'false'); });
      panels.forEach(function (p) { p.classList.remove('is-active'); p.hidden = true; });
      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');
      var panel = document.getElementById(tab.getAttribute('aria-controls'));
      if (panel) { panel.hidden = false; panel.classList.add('is-active'); }
    });
  });

  /* ---------------- hero scrollytelling burger ---------------- */
  var hero = document.getElementById('hero');
  if (!hero) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var stage = document.getElementById('burger-stage');
  var layers = hero.querySelectorAll('.burger__layer');
  var callouts = hero.querySelectorAll('.callout');
  var titleA = hero.querySelector('.hero__title--a');
  var titleB = hero.querySelector('.hero__title--b');
  var kicker = hero.querySelector('.hero__kicker');
  var hint = document.getElementById('hero-hint');
  var tempValue = document.getElementById('temp-value');
  var tempLabel = document.getElementById('temp-label');
  var tempBox = hero.querySelector('.hero__temp');
  var recTime = document.getElementById('rec-time');
  var chronoFill = document.getElementById('chrono-fill');
  var chronoTag = document.getElementById('chrono-tag');
  var chronoSteps = hero.querySelectorAll('.hero__chrono-steps li');

  var STAGES = [
    { name: 'Marinade', from: 0, to: 0.18 },
    { name: 'Panure maison', from: 0.18, to: 0.36 },
    { name: 'Friture 180°C', from: 0.36, to: 0.50 },
    { name: 'Dressage', from: 0.50, to: 1.0 }
  ];

  function formatTime(totalSeconds) {
    var m = Math.floor(totalSeconds / 60);
    var s = Math.floor(totalSeconds % 60);
    return (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
  }

  if (reduceMotion) {
    hero.classList.add('no-motion');
    if (tempValue) tempValue.textContent = '180';
    if (tempLabel) tempLabel.textContent = '180°C atteints';
    if (titleB) titleB.style.opacity = '0';
    layers.forEach(function (layer) {
      var dy = parseFloat(layer.getAttribute('data-dy')) || 0;
      var dx = parseFloat(layer.getAttribute('data-dx')) || 0;
      layer.style.transform = 'translate(calc(-50% + ' + dx + 'px),' + dy + 'px)';
    });
    return; // no scroll-linked animation for reduced-motion users
  }

  var ticking = false;

  function update() {
    ticking = false;
    var rect = hero.getBoundingClientRect();
    var total = hero.offsetHeight - window.innerHeight;
    var scrolled = -rect.top;
    var p = clamp(total > 0 ? scrolled / total : 0, 0, 1);

    /* burger stage: zoom in, zoom out, settle */
    var scale, rotate;
    if (p < 0.28) {
      scale = mapRange(p, 0, 0.28, 0.55, 1.55);
      rotate = mapRange(p, 0, 0.28, -7, 0);
    } else if (p < 0.48) {
      scale = mapRange(p, 0.28, 0.48, 1.55, 1.0);
      rotate = 0;
    } else {
      scale = mapRange(p, 0.48, 1, 1.0, 0.82);
      rotate = 0;
    }
    if (stage) stage.style.transform = 'scale(' + scale.toFixed(3) + ') rotate(' + rotate.toFixed(2) + 'deg)';

    /* explode layers */
    var explode = mapRange(p, 0.50, 0.94, 0, 1);
    layers.forEach(function (layer) {
      var dy = (parseFloat(layer.getAttribute('data-dy')) || 0) * explode;
      var dx = (parseFloat(layer.getAttribute('data-dx')) || 0) * explode;
      layer.style.transform = 'translate(calc(-50% + ' + dx.toFixed(1) + 'px),' + dy.toFixed(1) + 'px)';
    });

    /* callouts stagger in */
    callouts.forEach(function (tag) {
      var i = parseInt(tag.getAttribute('data-tag'), 10) || 0;
      var start = 0.54 + i * 0.07;
      var end = start + 0.14;
      var op = mapRange(p, start, end, 0, 1);
      var ty = mapRange(p, start, end, 10, 0);
      tag.style.opacity = op;
      tag.style.transform = 'translateY(' + ty.toFixed(1) + 'px)';
    });

    /* headline crossfade */
    var aOpacity = 1 - mapRange(p, 0.28, 0.42, 0, 1);
    if (titleA) titleA.style.opacity = aOpacity;
    if (kicker) kicker.style.opacity = aOpacity;
    if (titleB) titleB.style.opacity = mapRange(p, 0.32, 0.44, 0, 1) * (1 - mapRange(p, 0.9, 1, 0, 1));

    if (hint) hint.style.opacity = 1 - mapRange(p, 0, 0.05, 0, 1);

    /* temperature readout: 24°C -> 180°C by p=0.50, then holds */
    var temp = Math.round(mapRange(p, 0, 0.50, 24, 180));
    if (tempValue) tempValue.textContent = temp;
    if (tempBox) tempBox.classList.toggle('is-hot', p >= 0.50);
    if (tempLabel) tempLabel.textContent = p >= 0.50 ? '180°C atteints' : 'Huile en chauffe';

    /* cook timer, scroll-linked (not wall clock) */
    if (recTime) recTime.textContent = formatTime(p * 150);

    /* chrono ruler + active stage */
    if (chronoFill) chronoFill.style.width = (p * 100).toFixed(1) + '%';
    var activeIndex = 0;
    STAGES.forEach(function (s, i) { if (p >= s.from) activeIndex = i; });
    chronoSteps.forEach(function (li, i) {
      li.classList.toggle('is-active', i === activeIndex);
      li.classList.toggle('is-done', i < activeIndex);
    });
    if (chronoTag) chronoTag.textContent = '// ' + STAGES[activeIndex].name;
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(update);
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
})();
