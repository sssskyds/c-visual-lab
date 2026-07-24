/* C Visual Lab — app.js
   Theme toggle, progress store, C syntax highlighter, copy buttons, tabs, mark-complete strip.
*/
"use strict";
window.CVL = window.CVL || {};

CVL.store = (function () {
  const KEY = "cvl-progress-v1";
  function read()  { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch(e) { return {}; } }
  function write(d){ try { localStorage.setItem(KEY, JSON.stringify(d)); } catch(e) {} }
  return {
    get() { const d = read(); d.completed = d.completed||{}; d.quiz = d.quiz||{best:null,last:null,total:null}; return d; },
    markComplete(id, done) { const d=this.get(); if(done) d.completed[id]=true; else delete d.completed[id]; write(d); document.dispatchEvent(new CustomEvent("cvl:progress")); },
    isComplete(id) { return !!this.get().completed[id]; },
    saveQuiz(score, total) { const d=this.get(); d.quiz.last=score; d.quiz.total=total; if(d.quiz.best===null||score>d.quiz.best) d.quiz.best=score; write(d); document.dispatchEvent(new CustomEvent("cvl:progress")); },
    reset() { write({}); document.dispatchEvent(new CustomEvent("cvl:progress")); }
  };
})();

CVL.theme = (function () {
  const KEY = "cvl-theme";
  function apply(mode) {
    document.documentElement.setAttribute("data-theme", mode);
    document.querySelectorAll("[data-theme-toggle]").forEach(function(btn){
      btn.textContent = mode==="dark" ? "\u2600\uFE0E" : "\u263D";
      btn.setAttribute("aria-label", mode==="dark" ? "Switch to light theme" : "Switch to dark theme");
    });
  }
  function current() { try { return localStorage.getItem(KEY)||"dark"; } catch(e){return"dark";} }
  return {
    init()   { apply(current()); },
    toggle() { const next = current()==="dark"?"light":"dark"; try{localStorage.setItem(KEY,next);}catch(e){} apply(next); }
  };
})();

CVL.highlightC = function(src) {
  const KW   = new Set(["if","else","for","while","do","switch","case","default","break","continue","return","goto","typedef","struct","union","enum","sizeof","static","extern","const","volatile","register","inline","restrict","signed","unsigned","NULL","true","false"]);
  const TYPES= new Set(["void","char","short","int","long","float","double","bool","_Bool","uint8_t","int8_t","uint16_t","int16_t","uint32_t","int32_t","uint64_t","int64_t","size_t","uintptr_t","ptrdiff_t"]);
  function esc(s){return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
  const re=/(\/\*[\s\S]*?\*\/|\/\/[^\n]*)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')|(^[ \t]*#[^\n]*)|(\b0[xX][0-9a-fA-F]+\b|\b\d+(?:\.\d+)?[uUlLfF]*\b)|([A-Za-z_][A-Za-z0-9_]*)/gm;
  let out="",last=0,m;
  while((m=re.exec(src))!==null){
    out+=esc(src.slice(last,m.index)); last=re.lastIndex;
    if(m[1])      out+='<span class="tok-com">'+esc(m[1])+"</span>";
    else if(m[2]) out+='<span class="tok-str">'+esc(m[2])+"</span>";
    else if(m[3]) out+='<span class="tok-pre">'+esc(m[3])+"</span>";
    else if(m[4]) out+='<span class="tok-num">'+esc(m[4])+"</span>";
    else if(m[5]){
      const w=m[5];
      if(KW.has(w))    out+='<span class="tok-kw">'+w+"</span>";
      else if(TYPES.has(w)) out+='<span class="tok-type">'+w+"</span>";
      else if(src[re.lastIndex]==="(") out+='<span class="tok-fn">'+w+"</span>";
      else out+=w;
    }
  }
  out+=esc(src.slice(last)); return out;
};

CVL.addCopyButton = function(card, rawText) {
  let btn=card.querySelector(".copy-btn");
  if(!btn){ btn=document.createElement("button"); btn.className="copy-btn"; btn.type="button"; btn.textContent="copy"; btn.setAttribute("aria-label","Copy code"); card.appendChild(btn); }
  btn.onclick=function(){
    const text=rawText!==undefined?rawText:(card.querySelector("code")||card).textContent;
    function done(){ btn.textContent="copied \u2713"; btn.classList.add("copied"); setTimeout(function(){btn.textContent="copy";btn.classList.remove("copied");},1400); }
    if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done,done);
    else{ const ta=document.createElement("textarea"); ta.value=text; document.body.appendChild(ta); ta.select(); try{document.execCommand("copy");}catch(e){} document.body.removeChild(ta); done(); }
  };
};

CVL.initTabs = function(root){
  (root||document).querySelectorAll("[data-tabs]").forEach(function(widget){
    const btns=Array.prototype.slice.call(widget.querySelectorAll(".tab-btn"));
    const panels=Array.prototype.slice.call(widget.querySelectorAll(".tab-panel"));
    function select(i,focus){
      btns.forEach(function(b,j){ b.setAttribute("aria-selected",i===j?"true":"false"); b.tabIndex=i===j?0:-1; });
      panels.forEach(function(p,j){ p.hidden=i!==j; });
      if(focus) btns[i].focus();
    }
    btns.forEach(function(b,i){
      b.addEventListener("click",function(){select(i);});
      b.addEventListener("keydown",function(e){
        if(e.key==="ArrowRight"){e.preventDefault();select((i+1)%btns.length,true);}
        if(e.key==="ArrowLeft"){e.preventDefault();select((i-1+btns.length)%btns.length,true);}
      });
    });
    select(0);
  });
};

CVL.refreshDashboard = function(){
  const lessons=(window.CVL_PAGES||[]).filter(function(p){return p.lesson;});
  const d=CVL.store.get();
  const done=lessons.filter(function(p){return d.completed[p.id];}).length;
  const pct=lessons.length?Math.round((done/lessons.length)*100):0;
  const set=function(sel,txt){document.querySelectorAll(sel).forEach(function(el){el.textContent=txt;});};
  set("[data-stat-progress]",pct+"%");
  set("[data-stat-done]",done+" / "+lessons.length);
  set("[data-stat-quiz]",d.quiz.best===null?"\u2014":d.quiz.best+" / "+d.quiz.total);
  document.querySelectorAll("[data-progress-fill]").forEach(function(el){el.style.width=pct+"%";});
  const next=lessons.find(function(p){return !d.completed[p.id];})||lessons[0];
  document.querySelectorAll("[data-continue-btn]").forEach(function(btn){
    btn.setAttribute("href",next.file);
    const label=btn.querySelector("[data-continue-label]");
    if(label) label.textContent=done===0?"Start learning":"Continue: "+next.title;
  });
  document.querySelectorAll("[data-roadmap-page]").forEach(function(cardEl){
    const id=cardEl.getAttribute("data-roadmap-page");
    const isDone=!!d.completed[id];
    cardEl.classList.toggle("done",isDone);
    const check=cardEl.querySelector(".done-check");
    if(check) check.style.display=isDone?"":"none";
  });
};

CVL.initCompleteStrip = function(){
  const strip=document.querySelector("[data-complete-strip]");
  if(!strip) return;
  const pageId=document.documentElement.getAttribute("data-page");
  const btn=strip.querySelector("button");
  const msg=strip.querySelector(".cs-msg");
  function render(){
    const done=CVL.store.isComplete(pageId);
    btn.textContent=done?"\u2713 Completed \u2014 mark as not done":"Mark lesson complete";
    btn.className=done?"btn":"btn btn-primary";
    msg.textContent=done?"Great work. This module is counted in your dashboard progress.":"Finished this module? Mark it complete to track your progress on the dashboard.";
  }
  btn.addEventListener("click",function(){CVL.store.markComplete(pageId,!CVL.store.isComplete(pageId));render();});
  document.addEventListener("cvl:progress",render);
  render();
};

document.addEventListener("DOMContentLoaded", function(){
  CVL.theme.init();
  document.addEventListener("click",function(e){
    const t=e.target.closest("[data-theme-toggle]");
    if(t) CVL.theme.toggle();
  });
  document.querySelectorAll(".code-card pre code").forEach(function(code){
    const raw=code.textContent;
    code.innerHTML=CVL.highlightC(raw);
    CVL.addCopyButton(code.closest(".code-card"),raw);
  });
  document.querySelectorAll(".term").forEach(function(el){
    if(!el.hasAttribute("tabindex")) el.setAttribute("tabindex","0");
  });
  CVL.initTabs(document);
  CVL.initCompleteStrip();
  CVL.refreshDashboard();
  document.addEventListener("cvl:progress",CVL.refreshDashboard);
});