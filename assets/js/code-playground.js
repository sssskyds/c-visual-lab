/* C Visual Lab — code-playground.js
   Guided design playground: generates C code and a simulated trace.
*/
"use strict";
(function () {

  const SCENARIOS = {
    led: {
      label: "LED device",
      gen: function(opts) {
        const opaque = opts.opaque, staticPool = opts.static;
        let header = "/* led.h */\n";
        if (opaque) {
          header += "typedef struct LedState LedState;  /* opaque: internals hidden */\n";
        } else {
          header += "typedef struct {\n    uint8_t id;\n    uint8_t brightness;\n    bool    on;\n} LedState;\n";
        }
        header += "\nLedState *Led_Create(uint8_t id);\nvoid      Led_SetBrightness(LedState *self, uint8_t v);\nvoid      Led_Toggle(LedState *self);\nvoid      Led_Destroy(LedState *self);\n";

        let impl = "/* led.c */\n";
        if (opaque) impl += "struct LedState { uint8_t id; uint8_t brightness; bool on; };\n";
        if (staticPool) {
          impl += "\n#define POOL_SIZE 4\nstatic LedState _pool[POOL_SIZE];\nstatic bool     _used[POOL_SIZE];\n\nLedState *Led_Create(uint8_t id) {\n    for (int i = 0; i < POOL_SIZE; i++) {\n        if (!_used[i]) {\n            _used[i] = true;\n            _pool[i] = (LedState){ .id=id, .brightness=100, .on=false };\n            return &_pool[i];\n        }\n    }\n    return NULL; /* pool exhausted */\n}\nvoid Led_Destroy(LedState *self) {\n    for (int i = 0; i < POOL_SIZE; i++)\n        if (&_pool[i] == self) { _used[i]=false; return; }\n}\n";
        } else {
          impl += "\nLedState *Led_Create(uint8_t id) {\n    LedState *s = malloc(sizeof *s);\n    if (!s) return NULL;\n    *s = (LedState){ .id=id, .brightness=100, .on=false };\n    return s;\n}\nvoid Led_Destroy(LedState *self) { free(self); }\n";
        }
        impl += "\nvoid Led_SetBrightness(LedState *self, uint8_t v) { self->brightness = v; }\nvoid Led_Toggle(LedState *self) { self->on = !self->on; }\n";

        const main = "/* main.c */\nint main(void) {\n    LedState *led = Led_Create(1);\n    Led_SetBrightness(led, 80);\n    Led_Toggle(led);  /* on  */\n    Led_Toggle(led);  /* off */\n    Led_Destroy(led);\n    return 0;\n}\n";

        const trace = [
          staticPool ? "Pool[0] allocated for id=1" : "malloc() → 0x2000 for id=1",
          "Led_SetBrightness: brightness=80",
          "Led_Toggle: on=true",
          "Led_Toggle: on=false",
          staticPool ? "Pool[0] freed" : "free(0x2000)",
          "main() returned 0"
        ];
        return { files: { "led.h": header, "led.c": impl, "main.c": main }, trace };
      }
    },
    iface: {
      label: "Multi-device interface",
      gen: function() {
        const header = "/* device.h */\ntypedef struct {\n    void (*init)(void *ctx);\n    void (*set_enabled)(void *ctx, bool en);\n    void (*deinit)(void *ctx);\n} DeviceOps;\n\ntypedef struct {\n    void           *context;\n    const DeviceOps *ops;\n} Device;\n\nvoid Device_SetEnabled(Device *d, bool en);\n";
        const impl = "/* device.c */\nvoid Device_SetEnabled(Device *d, bool en) {\n    if (d && d->ops && d->ops->set_enabled)\n        d->ops->set_enabled(d->context, en);\n}\n\n/* led_device.c */\nstatic void led_set(void *ctx, bool on) { ((LedState*)ctx)->on = on; }\nconst DeviceOps LED_OPS = { led_init, led_set, led_deinit };\n\n/* buzzer_device.c */\nstatic void buzz_set(void *ctx, bool on) { ((BuzzerState*)ctx)->tone = on?2000u:0u; }\nconst DeviceOps BUZZ_OPS = { buzz_init, buzz_set, buzz_deinit };\n";
        const main = "/* main.c */\nint main(void) {\n    Device led  = { &led_state,  &LED_OPS  };\n    Device buzz = { &buzz_state, &BUZZ_OPS };\n\n    Device_SetEnabled(&led,  true);  /* routes to led_set  */\n    Device_SetEnabled(&buzz, true);  /* routes to buzz_set */\n    return 0;\n}\n";
        const trace = [
          "Device_SetEnabled(&led, true)",
          "  ops->set_enabled → led_set(ctx, true)",
          "  LedState.on = true",
          "Device_SetEnabled(&buzz, true)",
          "  ops->set_enabled → buzz_set(ctx, true)",
          "  BuzzerState.tone = 2000"
        ];
        return { files: { "device.h": header, "device.c + drivers": impl, "main.c": main }, trace };
      }
    },
    callback: {
      label: "UART callback",
      gen: function() {
        const header = "/* uart.h */\ntypedef void (*UartRxCb)(const uint8_t *data, uint8_t len, void *ctx);\nvoid Uart_Init(uint32_t baud);\nvoid Uart_RegisterRxCallback(UartRxCb cb, void *user_ctx);\n";
        const impl = "/* uart.c */\nstatic UartRxCb  _cb  = NULL;\nstatic void     *_ctx = NULL;\n\nvoid Uart_RegisterRxCallback(UartRxCb cb, void *ctx) {\n    _cb = cb; _ctx = ctx;\n}\n\n/* Called from ISR */\nvoid UART_IRQHandler(void) {\n    uint8_t buf[16]; uint8_t len = hw_read(buf);\n    if (_cb) _cb(buf, len, _ctx);\n}\n";
        const main = "/* app.c */\nstatic void on_rx(const uint8_t *d, uint8_t len, void *ctx) {\n    /* parse frame, set flag, etc. */\n}\n\nint main(void) {\n    Uart_Init(115200);\n    Uart_RegisterRxCallback(on_rx, NULL);\n    while (1) { /* main loop */ }\n}\n";
        const trace = [
          "Uart_Init(115200): HW configured",
          "RegisterRxCallback: _cb = on_rx",
          "[time passes]",
          "UART ISR fires: 8 bytes received",
          "_cb != NULL → on_rx(data, 8, NULL)",
          "App frame handler runs"
        ];
        return { files: { "uart.h": header, "uart.c": impl, "app.c": main }, trace };
      }
    }
  };

  function renderPlayground() {
    const scenSel = document.getElementById("pg-scenario");
    const runBtn  = document.getElementById("pg-run");
    const resetBtn= document.getElementById("pg-reset");
    const codeDiv = document.getElementById("pg-code");
    const console_= document.getElementById("pg-console");
    const ledOpts = document.getElementById("pg-led-opts");
    if (!runBtn) return;

    scenSel.addEventListener("change", function() {
      if (ledOpts) ledOpts.style.display = scenSel.value==="led" ? "" : "none";
    });

    runBtn.onclick = function() {
      const scen = SCENARIOS[scenSel.value];
      const opts = {
        opaque: document.getElementById("pg-opaque") ? document.getElementById("pg-opaque").checked : true,
        static: document.getElementById("pg-static") ? document.getElementById("pg-static").checked : true
      };
      const result = scen.gen(opts);
      let tabsHtml = '<div data-tabs><div class="tab-list" role="tablist">';
      const fileNames = Object.keys(result.files);
      fileNames.forEach(function(name, i) {
        tabsHtml += '<button class="tab-btn" role="tab" aria-selected="' + (i===0?'true':'false') + '" tabindex="' + (i===0?0:-1) + '">' + name + '</button>';
      });
      tabsHtml += '</div>';
      fileNames.forEach(function(name, i) {
        tabsHtml += '<div class="tab-panel" role="tabpanel"' + (i!==0?' hidden':'') + '>';
        const card = document.createElement('div');
        if (window.CVL && CVL.renderCode) {
          CVL.renderCode(card, result.files[name], name);
          tabsHtml += card.outerHTML;
        } else {
          tabsHtml += '<pre class="code-card"><code>' + result.files[name].replace(/&/g,'&amp;').replace(/</g,'&lt;') + '</code></pre>';
        }
        tabsHtml += '</div>';
      });
      tabsHtml += '</div>';
      codeDiv.innerHTML = tabsHtml;
      if (window.CVL && CVL.initTabs) CVL.initTabs(codeDiv);

      let traceHtml = '';
      result.trace.forEach(function(line) {
        traceHtml += '<span class="c-ok">&#x25b6;</span> ' + line + '\n';
      });
      console_.innerHTML = traceHtml || '// done';
    };

    resetBtn.onclick = function() {
      codeDiv.innerHTML = '';
      console_.textContent = '// press \u201cBuild & Run (simulated)\u201d to trace this design';
    };
  }

  document.addEventListener("DOMContentLoaded", renderPlayground);
})();