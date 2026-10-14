/* C Visual Lab — deep-dive.js
   Interactive simulators for the in-depth Core C lessons:
   foundations.html, pointers.html, memory-lifetime.html,
   preprocessor-build.html. Dependency-free, defensive: every
   init returns early when its page elements are absent.
*/
"use strict";
(function () {

  /* ---------- Foundations: type sizes + integer promotion ---------- */
  function initTypeExplorer() {
    var sel = document.getElementById("te-arch");
    var out = document.getElementById("te-table");
    if (!sel || !out) return;
    // Typical sizes only — the C standard fixes minimum ranges,
    // not exact sizes. ILP32 = most 32-bit embedded ABIs, LP64 = most 64-bit Linux/macOS.
    var MODELS = {
      ilp32: { label: "ILP32 — typical 32-bit (ARM Cortex-M, AVR32, x86-32)", sizes: { char: 1, short: 2, int: 4, long: 4, "long long": 8, float: 4, double: 8, "pointer": 4 } },
      lp64:  { label: "LP64 — typical 64-bit (x86-64 Linux/macOS)", sizes: { char: 1, short: 2, int: 4, long: 8, "long long": 8, float: 4, double: 8, "pointer": 8 } }
    };
    var RANGES = {
      char: "at least -127..127 (signed) or 0..255", short: "-32,767..32,767",
      int: "-2,147,483,647..2,147,483,647", long: "ILP32: as int · LP64: ±9.2e18",
      "long long": "±9.2e18 (at least)", float: "~6 decimal digits, ~1e±38",
      double: "~15 decimal digits, ~1e±308", "pointer": "address width of the target"
    };
    function render() {
      var m = MODELS[sel.value] || MODELS.ilp32;
      var html = "<p style=\"font-size:0.85rem;color:var(--muted)\">" + m.label +
        ". <strong>Typical, not guaranteed</strong> — verify with <code>sizeof</code> on your toolchain.</p>";
      html += "<table class=\"data\"><thead><tr><th>Type</th><th>sizeof</th><th>Minimum range (C standard)</th></tr></thead><tbody>";
      Object.keys(m.sizes).forEach(function (t) {
        html += "<tr><td class=\"mono\">" + t + "</td><td class=\"mono\">" + m.sizes[t] + " byte" +
          (m.sizes[t] === 1 ? "" : "s") + "</td><td>" + RANGES[t] + "</td></tr>";
      });
      html += "</tbody></table>";
      html += "<div class=\"callout idea\"><span class=\"co-icon\">💡</span><p><strong>Embedded rule:</strong> never assume " +
        "<code>int</code> is 32 bits. For exact widths use <code>&lt;stdint.h&gt;</code>: " +
        "<code>int32_t</code>, <code>uint16_t</code>, <code>intptr_t</code> for a pointer-sized integer.</p></div>";
      out.innerHTML = html;
    }
    sel.addEventListener("change", render);
    render();
  }

  function initPromotionDemo() {
    var btn = document.getElementById("promo-run");
    var sel = document.getElementById("promo-case");
    var out = document.getElementById("promo-out");
    if (!btn || !sel || !out) return;
    var CASES = {
      small: {
        title: "uint8_t 200 + uint8_t 100",
        body: "Both operands are <strong>promoted to <code>int</code></strong> before the <code>+</code> runs, " +
          "so the sum is <strong>300</strong> (type <code>int</code>), not 44. The wrap only happens when you " +
          "store it back into a <code>uint8_t</code>: <code>(uint8_t)(200 + 100) == 44</code>.",
        warn: "Promotion saves you here — but the narrowing assignment afterwards is where the bug hides."
      },
      compare: {
        title: "-1 &lt; 1U ?",
        body: "The <code>int</code> -1 is converted to <code>unsigned int</code> (usual arithmetic conversions), " +
          "becoming a huge value (4,294,967,295 on 32-bit). So <code>-1 &lt; 1U</code> is <strong>false</strong>. " +
          "Mixed signed/unsigned comparisons are a classic embedded bug — enable <code>-Wsign-compare</code>.",
        warn: "Never mix signed and unsigned in a comparison without thinking about conversion first."
      },
      shift: {
        title: "1 &lt;&lt; 31 on 32-bit int",
        body: "Shifting a signed 1 into the sign bit is <strong>undefined behavior</strong> in C. " +
          "Write <code>1U &lt;&lt; 31</code> or <code>(uint32_t)1 &lt;&lt; 31</code> for a well-defined bit mask. " +
          "Same rule: never shift by a negative count, or by &ge; the width of the type.",
        warn: "Bit manipulation belongs in unsigned types. Always."
      },
      div: {
        title: "5 / 2 vs 5.0 / 2",
        body: "<code>5 / 2 == 2</code> (integer division truncates toward zero). <code>5.0 / 2 == 2.5</code> " +
          "because the <code>int</code> 2 converts to <code>double</code>. If you expected 2.5 from " +
          "<code>5 / 2</code>, the bug is the operand types, not the division.",
        warn: "Averaging sensor samples? Cast one operand: <code>(float)sum / count</code>."
      }
    };
    btn.addEventListener("click", function () {
      var c = CASES[sel.value] || CASES.small;
      out.innerHTML = "<div class=\"verdict v-info\"><b>" + c.title + "</b><p style=\"margin:4px 0 0\">" +
        c.body + "</p></div><div class=\"callout warn\"><span class=\"co-icon\">⚠︎</span><p>" + c.warn + "</p></div>";
    });
  }

  /* ---------- Pointers: pointer arithmetic visualizer ---------- */
  function initPointerSim() {
    var typeSel = document.getElementById("ptr-type");
    var idxSel = document.getElementById("ptr-index");
    var out = document.getElementById("ptr-out");
    if (!typeSel || !idxSel || !out) return;
    var VALUES = [10, 20, 30, 40, 50, 60];
    var TYPES = { u8: { name: "uint8_t", size: 1 }, u16: { name: "uint16_t", size: 2 }, u32: { name: "uint32_t", size: 4 } };
    function render() {
      var t = TYPES[typeSel.value] || TYPES.u32;
      var i = parseInt(idxSel.value, 10);
      var base = 0x2000;
      var addr = base + i * t.size;
      var cells = VALUES.map(function (v, j) {
        var cls = j === i ? " f-cyan" : "";
        var addrTxt = "+0x" + (j * t.size).toString(16);
        return "<div class=\"mem-byte" + cls + "\"><span class=\"addr\">" + addrTxt + "</span><span class=\"val\">" + v + "</span></div>";
      }).join("");
      out.innerHTML =
        "<div class=\"mem-grid\">" + cells + "</div>" +
        "<table class=\"data\"><tbody>" +
        "<tr><td class=\"mono\">p</td><td>base address</td><td class=\"mono\">0x" + base.toString(16) + "</td></tr>" +
        "<tr><td class=\"mono\">sizeof(*p)</td><td>element size for <code>" + t.name + "</code></td><td class=\"mono\">" + t.size + " byte" + (t.size === 1 ? "" : "s") + "</td></tr>" +
        "<tr><td class=\"mono\">p + " + i + "</td><td>address arithmetic</td><td class=\"mono\">0x" + addr.toString(16) + " = 0x" + base.toString(16) + " + " + i + " × " + t.size + "</td></tr>" +
        "<tr><td class=\"mono\">*(p + " + i + ") == p[" + i + "]</td><td>value at that slot</td><td class=\"mono\">" + VALUES[i] + "</td></tr>" +
        "</tbody></table>" +
        "<p style=\"font-size:0.85rem;color:var(--muted)\">Pointer arithmetic scales by the <strong>pointed-to type</strong>, " +
        "not by 1 byte. That is why <code>int *p; p + 1</code> moves 4 bytes on a typical 32-bit target, while " +
        "<code>char *p; p + 1</code> moves 1 byte.</p>";
    }
    typeSel.addEventListener("change", render);
    idxSel.addEventListener("change", render);
    render();
  }

  /* ---------- Memory: heap timeline simulator ---------- */
  function initHeapSim() {
    var btnA = document.getElementById("heap-alloc-a");
    var btnB = document.getElementById("heap-alloc-b");
    var btnFree = document.getElementById("heap-free-a");
    var btnReset = document.getElementById("heap-reset");
    var out = document.getElementById("heap-out");
    if (!btnA || !out) return;
    var state;
    function fresh() { return { a: null, b: null, freedA: false, doubleFree: false, log: ["Heap is empty."] }; }
    function render() {
      var blocks = "";
      blocks += "<div class=\"mem-byte " + (state.a ? "f-cyan" : "pad") + "\"><span class=\"addr\">A · 32B</span><span class=\"val\">" + (state.a ? "live" : "—") + "</span></div>";
      blocks += "<div class=\"mem-byte " + (state.b ? "f-purple" : "pad") + "\"><span class=\"addr\">B · 64B</span><span class=\"val\">" + (state.b ? "live" : "—") + "</span></div>";
      var liveBytes = (state.a ? 32 : 0) + (state.b ? 64 : 0);
      var leak = state.a && state.b === "lost" ? "Leak: B was overwritten without free()." : "";
      var html = "<div class=\"mem-grid\">" + blocks + "</div>" +
        "<p style=\"font-size:0.85rem\">Live heap: <strong>" + liveBytes + " bytes</strong>" +
        (state.doubleFree ? " · <strong style=\"color:var(--red)\">DOUBLE-FREE — heap corruption, undefined behavior</strong>" : "") +
        (leak ? " · <strong style=\"color:var(--orange)\">" + leak + "</strong>" : "") + "</p>" +
        "<ol class=\"trace\">" + state.log.map(function (l) { return "<li>" + l + "</li>"; }).join("") + "</ol>";
      out.innerHTML = html;
    }
    function log(m) { state.log.push(m); if (state.log.length > 6) state.log.shift(); render(); }
    btnA.addEventListener("click", function () {
      if (state.a) { log("A already allocated — allocating again without free() would leak the first block."); return; }
      state.a = true; state.freedA = false; log("a = malloc(32); → block A live (32 bytes)");
    });
    if (btnB) btnB.addEventListener("click", function () {
      if (state.b === true) { log("B already allocated."); return; }
      if (state.b === "lost") { log("B was already lost — this second pointer cannot recover it."); return; }
      state.b = true; log("b = malloc(64); → block B live (64 bytes)");
    });
    if (btnFree) btnFree.addEventListener("click", function () {
      if (!state.a) {
        if (state.freedA) { state.doubleFree = true; log("free(a) again → DOUBLE-FREE. Undefined behavior."); }
        else log("free(a) with a == NULL is safe (no-op) — but here a was never allocated.");
        return;
      }
      state.a = null; state.freedA = true; log("free(a); a = NULL; → block A returned. Always NULL the pointer.");
    });
    if (btnReset) btnReset.addEventListener("click", function () { state = fresh(); render(); });
    state = fresh(); render();
  }

  /* ---------- Preprocessor: macro expansion playground ---------- */
  function initMacroSim() {
    var sel = document.getElementById("macro-pick");
    var arg = document.getElementById("macro-arg");
    var btn = document.getElementById("macro-run");
    var out = document.getElementById("macro-out");
    if (!sel || !btn || !out) return;
    function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
    btn.addEventListener("click", function () {
      var a = (arg.value || "2+3").trim();
      var n = parseInt(a, 10);
      var html = "";
      if (sel.value === "square-bad") {
        html = "<div class=\"code-card bad\"><div class=\"code-title\">#define SQUARE(x) x * x — no parentheses</div><pre><code>SQUARE(" + esc(a) + ")  →  " + esc(a) + " * " + esc(a) + "</code></pre></div>" +
          "<p><code>SQUARE(2+3)</code> expands to <code>2+3 * 2+3</code> = <strong>11</strong>, not 25. Precedence strikes.</p>";
      } else if (sel.value === "square-good") {
        html = "<div class=\"code-card good\"><div class=\"code-title\">#define SQUARE(x) ((x) * (x)) — fully parenthesised</div><pre><code>SQUARE(" + esc(a) + ")  →  ((" + esc(a) + ") * (" + esc(a) + "))</code></pre></div>" +
          "<p><code>SQUARE(2+3)</code> expands to <code>((2+3) * (2+3))</code> = <strong>25</strong>. Parenthesise every parameter and the whole body.</p>";
      } else if (sel.value === "double-eval") {
        html = "<div class=\"code-card bad\"><div class=\"code-title\">double evaluation — even the \"good\" macro has this trap</div><pre><code>int i = 3;\nSQUARE(i++);  →  ((i++) * (i++))  /* i incremented TWICE */</code></pre></div>" +
          "<p>Result is <strong>undefined</strong> (two unsequenced modifications of <code>i</code>). Macros are text substitution, " +
          "not functions — never pass <code>++</code>, assignments, or function calls with side effects to a macro that uses its argument more than once.</p>";
      } else {
        var v = isNaN(n) ? "?" : Math.max(1, Math.min(2, n));
        html = "<div class=\"code-card\"><div class=\"code-title\">#define MAX(a, b) (((a) &gt; (b)) ? (a) : (b))</div><pre><code>MAX(" + esc(a) + ", 5)  →  (((" + esc(a) + ") &gt; (5)) ? (" + esc(a) + ") : (5))</code></pre></div>" +
          "<p>Correctly parenthesised — but <code>MAX(x++, 5)</code> still evaluates <code>x++</code> twice when <code>x++ &gt; 5</code>. " +
          "For side-effect-safe code, prefer a <code>static inline</code> function.</p>";
      }
      out.innerHTML = html;
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initTypeExplorer();
    initPromotionDemo();
    initPointerSim();
    initHeapSim();
    initMacroSim();
  });
})();
