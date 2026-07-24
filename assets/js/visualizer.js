/* C Visual Lab — visualizer.js
   Page-specific interactive simulations for concepts.html,
   oops-in-c.html, polymorphism.html, pitfalls.html
*/
"use strict";
(function () {

  /* ---- Concepts: enum state machine ---- */
  function initEnumSim() {
    const wrap = document.getElementById("enum-sim");
    if (!wrap) return;
    const STATES = ["IDLE","MEASURING","DATA_READY","ERROR"];
    const TRANS = { IDLE:"MEASURING", MEASURING:"DATA_READY", DATA_READY:"IDLE", ERROR:"IDLE" };
    let current = 0;
    function render() {
      let html = '<div class="sim"><div class="sim-head"><h3>\ud83e\uddea Enum state machine</h3></div><div class="sim-body">';
      html += '<div class="sm-wrap">';
      STATES.forEach(function(s, i) {
        html += '<div class="sm-node' + (i===current?' active'+(s==="ERROR"?' err':''): '') + '">' + s + '</div>';
        if (i < STATES.length-1) html += '<span class="sm-arrow">&rarr;</span>';
      });
      html += '</div>';
      html += '<div class="btn-row"><button class="btn btn-primary" id="sm-next">Advance state</button>';
      html += '<button class="btn" id="sm-err">Inject ERROR</button>';
      html += '<button class="btn btn-sm" id="sm-reset">Reset</button></div></div></div>';
      wrap.innerHTML = html;
      document.getElementById("sm-next").onclick = function() { current = STATES.indexOf(TRANS[STATES[current]]); render(); };
      document.getElementById("sm-err").onclick  = function() { current = 3; render(); };
      document.getElementById("sm-reset").onclick= function() { current = 0; render(); };
    }
    render();
  }

  /* ---- Polymorphism: dispatch demo ---- */
  function initDispatchDemo() {
    const dp = document.getElementById("dp-led-view");
    if (!dp) return;
    let ledOn=false, buzzOn=false;
    const trace = [];
    function addTrace(msg) { trace.unshift(msg); if(trace.length>6) trace.pop(); }
    function updateViews() {
      document.getElementById("dp-led-view").innerHTML  = '\ud83d\udca1 LED: <b style="color:var(--' + (ledOn?'green':'faint') + ')">' + (ledOn?"ON":"OFF") + '</b>';
      document.getElementById("dp-buzz-view").innerHTML = '\ud83d\udd14 Buzzer: <b style="color:var(--' + (buzzOn?'orange':'faint') + ')">' + (buzzOn?"TONE 2000Hz":"SILENT") + '</b>';
      const tEl = document.getElementById("dp-trace");
      tEl.innerHTML = trace.map(function(t){return'<li>'+t+'</li>';}).join("");
    }
    document.getElementById("dp-led-toggle").onclick = function() {
      ledOn=!ledOn;
      addTrace('Device_SetEnabled(led, '+ledOn+') &rarr; <span class="tok-fn">led_set</span>(ctx, '+ledOn+')');
      updateViews();
    };
    document.getElementById("dp-buzz-toggle").onclick = function() {
      buzzOn=!buzzOn;
      addTrace('Device_SetEnabled(buzz, '+buzzOn+') &rarr; <span class="tok-fn">buzzer_set</span>(ctx, '+buzzOn+')');
      updateViews();
    };
    document.getElementById("dp-reset").onclick = function() { ledOn=false; buzzOn=false; trace.length=0; updateViews(); };
    updateViews();
  }

  /* ---- Polymorphism: callback demo ---- */
  function initCallbackDemo() {
    const btn = document.getElementById("cb-fire");
    if (!btn) return;
    const steps = [
      'ISR fires: UART RX buffer full',
      'Driver reads bytes from hardware register',
      '<span class="tok-fn">RxCallback</span> pointer is not NULL \u2714',
      'cb(data, length, user_ctx) called',
      'App handler runs: parses frame, sets flag',
      'ISR returns; main loop sees flag on next tick'
    ];
    let t = [];
    document.getElementById("cb-reset").onclick = function() { t=[]; document.getElementById("cb-trace").innerHTML='<li style="opacity:0.4;padding:6px 0">Press button to simulate a UART receive interrupt\u2026</li>'; };
    btn.onclick = function() {
      t = []; const trace = document.getElementById("cb-trace"); trace.innerHTML="";
      let i=0;
      function next() { if(i>=steps.length) return; t.push(steps[i++]); trace.innerHTML=t.map(function(s,j){return'<li>'+s+'</li>';}).join(""); setTimeout(next,350); }
      next();
    };
  }

  /* ---- Polymorphism: design decision tool ---- */
  function initDecisionTool() {
    const btn = document.getElementById("dt-run");
    if (!btn) return;
    const RECS = {
      single:   '<div class="verdict v-ok"><b>\u2714 Direct struct + static functions</b><p>No abstraction overhead. Simple, fast, easy to debug.</p></div>',
      swappable:'<div class="verdict v-info"><b>\u2139 Ops-table interface (DeviceOps)</b><p>Define an ops struct. Each driver fills it in. Generic code calls through the table. Best for HALs and plugin architectures.</p></div>',
      'hide-data':'<div class="verdict v-info"><b>\u2139 Opaque handle</b><p>Forward-declare the struct in the header; define it only in the .c. Callers hold a pointer but cannot touch internals.</p></div>',
      fixed:    '<div class="verdict v-ok"><b>\u2714 Inline functions or macros</b><p>No indirection. The compiler inlines the call. Use only when profiling proves the ops-table cost matters.</p></div>',
      embedded: '<div class="verdict v-info"><b>\u2139 Static pool + opaque handle</b><p>Allocate from a fixed array at init time. No heap, deterministic timing, no fragmentation.</p></div>'
    };
    btn.onclick = function() {
      const v = document.getElementById("dt-scenario").value;
      document.getElementById("dt-answer").innerHTML = RECS[v] || '';
    };
  }

  /* ---- Playground (code-playground.js handles the main sim, this adds nothing here) ---- */

  document.addEventListener("DOMContentLoaded", function () {
    initEnumSim();
    initDispatchDemo();
    initCallbackDemo();
    initDecisionTool();
  });
})();