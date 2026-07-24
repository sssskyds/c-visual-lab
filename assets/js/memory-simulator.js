/* C Visual Lab — memory-simulator.js
   Struct layout engine + Memory Bug Toggle.
   Renders the interactive memory visualizer on structs-memory.html
*/
"use strict";
(function () {

  /* ---------- arch definitions ---------- */
  const ARCHS = {
    arm32: { name: "32-bit ARM",  sizes: { char:1, bool:1, short:2, int:4, long:4, float:4, double:8, ptr:4, uint8_t:1, uint16_t:2, uint32_t:4 }, ptr:4 },
    x64:   { name: "64-bit x64",  sizes: { char:1, bool:1, short:2, int:4, long:8, float:4, double:8, ptr:8, uint8_t:1, uint16_t:2, uint32_t:4, uint64_t:8 }, ptr:8 },
    avr8:  { name: "8-bit AVR",   sizes: { char:1, bool:1, short:2, int:2, long:4, float:4, double:4, ptr:2, uint8_t:1, uint16_t:2, uint32_t:4 }, ptr:2 }
  };

  const COLORS = ["f-cyan","f-purple","f-green","f-orange","f-red"];
  const EXAMPLES = {
    bad:    "typedef struct {\n    char    flag;\n    int     count;\n    char    mode;\n} BadLayout;",
    better: "typedef struct {\n    int     count;\n    char    flag;\n    char    mode;\n} BetterLayout;",
    frame:  "typedef struct {\n    uint8_t  id;\n    uint16_t len;\n    uint8_t  payload[4];\n    uint16_t crc;\n} Frame;"
  };

  function parseStruct(src, arch, packed) {
    const sizes = arch.sizes;
    // Extract field declarations with simple type + name (ignores arrays for now)
    const fieldRe = /([a-zA-Z_][a-zA-Z0-9_]*)\s+([a-zA-Z_][a-zA-Z0-9_]*)(\[\d+\])?\s*;/g;
    let m; const fields = [];
    while ((m = fieldRe.exec(src)) !== null) {
      const type = m[1], name = m[2], arrStr = m[3];
      const elemSize = sizes[type] || 1;
      const count = arrStr ? parseInt(arrStr.slice(1,-1)) : 1;
      fields.push({ type, name, elemSize, count, size: elemSize * count });
    }
    if (!fields.length) return null;
    // Layout
    let offset = 0; const laid = [];
    fields.forEach(function (f) {
      const align = packed ? 1 : Math.min(f.elemSize, arch.ptr);
      const pad = (align - (offset % align)) % align;
      if (pad) laid.push({ pad: true, bytes: pad, offset });
      offset += pad;
      laid.push({ ...f, offset });
      offset += f.size;
    });
    // tail padding
    const maxAlign = packed ? 1 : Math.max(...fields.map(f => Math.min(f.elemSize, arch.ptr)));
    const tail = (maxAlign - (offset % maxAlign)) % maxAlign;
    if (tail) laid.push({ pad: true, bytes: tail, offset });
    return { fields: laid, total: offset + tail };
  }

  function renderGrid(layout) {
    const grid = document.getElementById("ms-grid");
    const legend = document.getElementById("ms-legend");
    const tbl = document.getElementById("ms-table-wrap");
    if (!grid) return;
    if (!layout) { grid.innerHTML = '<span style="color:var(--orange);font-size:0.8rem">Could not parse struct — check your syntax.</span>'; legend.innerHTML=""; tbl.innerHTML=""; return; }

    let gridHtml = "", legendHtml = "", tableHtml = "", addr = 0, ci = 0;
    const fieldMap = {};
    layout.fields.forEach(function (f) {
      if (f.pad) {
        for (let i = 0; i < f.bytes; i++) {
          gridHtml += '<div class="mem-byte pad"><span class="addr">0x' + (f.offset+i).toString(16).padStart(2,'0') + '</span><span class="val">pad</span></div>';
        }
      } else {
        const color = COLORS[ci % COLORS.length];
        if (!fieldMap[f.name]) { fieldMap[f.name] = color; ci++; }
        for (let i = 0; i < f.size; i++) {
          const lbl = i===0 ? f.name + (f.count>1?'[0]':'') : (i===1&&f.size>2?'\u2026':'');
          gridHtml += '<div class="mem-byte '+color+'"><span class="addr">+' + (f.offset+i) + '</span><span class="val">' + (lbl||'') + '</span></div>';
        }
        legendHtml += '<span class="key"><span class="swatch '+color+'"></span>' + f.name + ' (' + f.type + ', ' + f.size + 'B)</span> ';
        tableHtml += '<tr><td class="mono">' + f.name + '</td><td class="mono">' + f.type + '</td><td>+' + f.offset + '</td><td>' + f.size + '</td></tr>';
      }
    });
    grid.innerHTML = gridHtml;
    legend.innerHTML = legendHtml;
    tbl.innerHTML = '<table class="data"><thead><tr><th>Field</th><th>Type</th><th>Offset</th><th>Size</th></tr></thead><tbody>' + tableHtml + '</tbody><tfoot><tr><td colspan="3"><strong>Total sizeof</strong></td><td><strong>' + layout.total + ' bytes</strong></td></tr></tfoot></table>';
  }

  /* ---------- bug toggle ---------- */
  const BUG_MODES = {
    valid:   { code: "SensorData d = { .id=1, .temp=23.5f };\nd.id = 2;  /* ok: direct field access */",   ok: true,  label: "Valid access",        msg: "Direct field access on a local or global struct is always safe." },
    arrow:   { code: "SensorData *p = &d;\np->temp = 24.0f;  /* ok: valid pointer */",                   ok: true,  label: "Valid pointer",        msg: "Arrow operator on a valid, non-null pointer is fine." },
    nullptr: { code: "SensorData *p = NULL;\np->id = 5;  /* CRASH: NULL dereference */",                 ok: false, label: "NULL dereference",     msg: "Dereferencing NULL is undefined behavior. On embedded: hard fault or data corruption depending on the MCU." },
    uninit:  { code: "SensorData *p;  /* not initialised */\np->id = 5;  /* CRASH: garbage address */",    ok: false, label: "Uninitialised pointer", msg: "An uninitialised pointer holds whatever was on the stack. Write goes to a random address." },
    overrun: { code: "uint8_t buf[4];\nbuf[7] = 0xFF;  /* overrun: writes past buf */",                   ok: false, label: "Buffer overrun",        msg: "Writing past the array end corrupts adjacent memory — possibly other variables or the return address." },
    dangling:{ code: "SensorData *p = malloc(sizeof *p);\nfree(p);\np->id = 9;  /* use-after-free */",    ok: false, label: "Dangling pointer",     msg: "Memory was freed but the pointer still holds the old address. Write goes to reclaimed or reallocated memory." }
  };

  function renderBug() {
    const sel = document.getElementById("bug-mode");
    if (!sel) return;
    const mode = BUG_MODES[sel.value];
    const codeDiv = document.getElementById("bug-code");
    const bytesDiv = document.getElementById("bug-bytes");
    const verdict = document.getElementById("bug-verdict");
    if (!codeDiv) return;
    if (window.CVL && CVL.renderCode) CVL.renderCode(codeDiv, mode.code, "bug-demo.c");
    else codeDiv.innerHTML = '<pre class="code-card"><code>' + mode.code + '</code></pre>';
    const bytes = mode.ok
      ? ['<div class="mem-byte f-green"><span class="addr">id</span><span class="val">ok</span></div>',
         '<div class="mem-byte f-green"><span class="addr">temp</span><span class="val">ok</span></div>']
      : ['<div class="mem-byte f-red pulse-danger"><span class="addr">???</span><span class="val">!</span></div>',
         '<div class="mem-byte f-red pulse-danger"><span class="addr">???</span><span class="val">!</span></div>'];
    bytesDiv.innerHTML = bytes.join("");
    verdict.className = 'verdict ' + (mode.ok ? 'v-ok' : 'v-err');
    verdict.innerHTML = '<b>' + mode.label + '</b><p style="margin:4px 0 0">' + mode.msg + '</p>';
  }

  document.addEventListener("DOMContentLoaded", function () {
    const archSel = document.getElementById("ms-arch");
    const exSel   = document.getElementById("ms-example");
    const input   = document.getElementById("ms-input");
    const packed  = document.getElementById("ms-packed");
    const bugSel  = document.getElementById("bug-mode");

    function runLayout() {
      if (!input) return;
      const arch = ARCHS[archSel ? archSel.value : "arm32"];
      const pk   = packed ? packed.checked : false;
      renderGrid(parseStruct(input.value, arch, pk));
    }

    if (archSel)  archSel.addEventListener("change", runLayout);
    if (packed)   packed.addEventListener("change", runLayout);
    if (input)    input.addEventListener("input", runLayout);
    if (exSel)    exSel.addEventListener("change", function () {
      if (exSel.value && EXAMPLES[exSel.value]) { input.value = EXAMPLES[exSel.value]; runLayout(); }
    });
    if (bugSel)   bugSel.addEventListener("change", renderBug);
    runLayout();
    renderBug();
  });
})();