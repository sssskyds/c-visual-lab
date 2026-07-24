/* C Visual Lab — navigation.js
   Builds the sticky top nav, lesson sidebar, breadcrumbs and progress indicators
   on every page from one config array.
*/
"use strict";
window.CVL_PAGES = [
  { id: "index",         file: "index.html",         title: "Dashboard",                   short: "Home",       lesson: false },
  { id: "concepts",      file: "concepts.html",      title: "Why Custom Types?",           short: "Concepts",   lesson: true, stage: 1 },
  { id: "custom-types",  file: "custom-types.html",  title: "typedef \u00b7 enum \u00b7 struct \u00b7 union",   short: "Types",      lesson: true, stage: 2 },
  { id: "structs-memory",file: "structs-memory.html",title: "Struct Memory Lab",           short: "Memory",     lesson: true, stage: 3 },
  { id: "oops-in-c",     file: "oops-in-c.html",     title: "OOP in Plain C",              short: "OOP",        lesson: true, stage: 4 },
  { id: "polymorphism",  file: "polymorphism.html",  title: "Interfaces & Polymorphism",  short: "Interfaces", lesson: true, stage: 5 },
  { id: "pitfalls",      file: "pitfalls.html",      title: "Catches & Common Bugs",      short: "Pitfalls",   lesson: true, stage: 6 },
  { id: "playground",    file: "playground.html",    title: "C Design Playground",        short: "Playground", lesson: true, stage: 7 },
  { id: "quiz",          file: "quiz.html",          title: "Final Challenge Quiz",       short: "Quiz",       lesson: true, stage: 8 }
];

(function () {
  const pages = window.CVL_PAGES;
  const currentId = document.documentElement.getAttribute("data-page") || "index";
  const current = pages.find(function (p) { return p.id === currentId; }) || pages[0];

  function progressCounts() {
    const store = window.CVL && CVL.store ? CVL.store.get() : { completed: {} };
    const lessons = pages.filter(function (p) { return p.lesson; });
    const done = lessons.filter(function (p) { return store.completed[p.id]; }).length;
    return { done: done, total: lessons.length };
  }

  function buildTopnav() {
    const nav = document.getElementById("topnav");
    if (!nav) return;
    const c = progressCounts();
    let html = '<a href="index.html" class="brand"><span class="brand-logo">C</span><span class="brand-name">C Visual Lab</span></a>';
    html += '<nav class="nav-links" aria-label="Lessons">';
    pages.forEach(function (p) {
      const cur = p.id === currentId ? ' aria-current="page"' : '';
      html += '<a href="' + p.file + '"' + cur + '>' + p.short + '</a>';
    });
    html += '</nav><span class="nav-spacer"></span>';
    html += '<div class="nav-progress"><b>' + c.done + '</b> / ' + c.total + ' done</div>';
    html += '<button class="icon-btn" data-theme-toggle aria-label="Toggle theme" title="Toggle theme">&#9728;&#65038;</button>';
    nav.innerHTML = html;
  }

  function buildSidebar() {
    const aside = document.getElementById("sidebar");
    if (!aside) return;
    const store = window.CVL && CVL.store ? CVL.store.get() : { completed: {} };
    const lessons = pages.filter(function (p) { return p.lesson; });
    const c = progressCounts();
    const pct = c.total ? Math.round((c.done / c.total) * 100) : 0;
    let html = '<h2>Lessons</h2><ol>';
    lessons.forEach(function (p) {
      const done = !!(store.completed && store.completed[p.id]);
      const cur  = p.id === currentId ? ' aria-current="page"' : '';
      html += '<li><a href="' + p.file + '"' + cur + '>';
      html += '<span class="lesson-dot' + (done ? ' done' : '') + '">' + p.stage + '</span>';
      html += '<span class="lesson-label">' + p.short + '</span></a></li>';
    });
    html += '</ol>';
    html += '<div class="sidebar-progress"><div class="bar-label"><span>Progress</span><span>' + pct + '%</span></div>';
    html += '<div class="progress-track"><div class="progress-fill" style="width:' + pct + '%"></div></div></div>';
    aside.innerHTML = html;
  }

  function refresh() { buildTopnav(); buildSidebar(); }

  document.addEventListener("DOMContentLoaded", refresh);
  document.addEventListener("cvl:progress", refresh);
})();