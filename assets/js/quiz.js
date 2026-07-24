/* C Visual Lab — quiz.js  (final quiz engine) */
"use strict";

(function () {
  const QUESTIONS = [
    { q: "What does <code>typedef</code> do in C?", opts: ["Creates a new type at runtime", "Gives an existing type a new name", "Allocates memory for a struct", "Declares a function pointer"], ans: 1, exp: "<code>typedef</code> creates an alias for an existing type — it does not create a new type at the language level." },
    { q: "In a struct with fields <code>char, int, char</code> on a typical 32-bit system, how many padding bytes are inserted?", opts: ["0", "3", "6", "2"], ans: 2, exp: "3 bytes after the first char (to align int to 4 bytes) and 3 bytes after the last char (to pad the struct to a multiple of 4). Total: 6." },
    { q: "An <code>enum</code> value in C is stored as which underlying type?", opts: ["uint8_t", "int (signed)", "unsigned long", "The compiler decides freely with no guarantees"], ans: 1, exp: "The C standard says enum values are stored as <code>int</code> (signed) unless the implementation chooses otherwise, but the common and spec-safe expectation is <code>int</code>." },
    { q: "What is an opaque handle?", opts: ["A void pointer to anything", "A pointer to a struct whose definition is hidden from callers", "A macro that hides implementation detail", "An uninitialized pointer variable"], ans: 1, exp: "An opaque handle is a pointer to a struct that is declared but not defined in the public header. Callers can hold and pass the pointer but cannot dereference it directly." },
    { q: "A function pointer stores:", opts: ["The return value of a function", "A copy of the function\'s code", "The memory address of a function", "The stack frame of a function"], ans: 2, exp: "A function pointer holds the address in memory where the function\'s code begins. Calling through it performs an indirect jump to that address." },
    { q: "What keyword prevents a struct from having padding?", opts: ["__aligned__", "__packed__ / __attribute__((packed))", "__nopad__", "volatile"], ans: 1, exp: "<code>__attribute__((packed))</code> (GCC/Clang) removes padding. This creates unaligned fields which can cause faults or slow access on some architectures." },
    { q: "In the ops-table (vtable) pattern, what does the <code>context</code> pointer represent?", opts: ["The ops table itself", "The specific object instance the function should operate on", "The return value storage", "A mutex protecting the device"], ans: 1, exp: "<code>context</code> (or <code>self</code>) is a <code>void *</code> that points to the concrete data for this instance — the equivalent of <code>this</code> in C++." },
    { q: "A dangling pointer is:", opts: ["A pointer set to NULL", "A pointer to memory that has been freed or is out of scope", "A pointer to a const variable", "A double-indirection pointer"], ans: 1, exp: "A dangling pointer still holds the old address after the memory it pointed to was freed or the variable went out of scope. Dereferencing it is undefined behavior." },
    { q: "Composition in C means:", opts: ["Using macros to inherit struct fields", "Embedding one struct as a named member inside another", "Casting parent pointers unsafely", "Using unions to share struct layouts"], ans: 1, exp: "Composition embeds the shared (base) struct as an explicit named member. This is type-safe and avoids the undefined behavior of unsafe pointer casts." },
    { q: "A callback in embedded C is typically:", opts: ["A blocking wait for hardware", "A function pointer registered by the application and called by the driver when an event occurs", "An interrupt service routine", "A DMA transfer completion register"], ans: 1, exp: "A callback is a function pointer the caller registers. When the driver detects an event (e.g., UART RX complete), it calls whatever function the application registered." },
    { q: "<code>sizeof(union { uint8_t a; uint32_t b; })</code> is:", opts: ["1", "5", "4", "8"], ans: 2, exp: "A union is sized to its largest member. <code>uint32_t</code> is 4 bytes, so the union is 4 bytes (plus possible padding for alignment)." },
    { q: "On a little-endian 32-bit system, the least-significant byte of a 4-byte integer is stored at:", opts: ["The highest address", "The lowest address", "A random address", "The same address as the next field"], ans: 1, exp: "Little-endian means the least-significant byte has the lowest address. Big-endian is the opposite. This matters when casting byte buffers directly to integers." },
    { q: "Why should protocol data not be mapped directly to a struct?", opts: ["Structs are too slow to copy", "Padding and endianness are compiler- and architecture-dependent", "The compiler will reject it", "Structs cannot hold arrays"], ans: 1, exp: "Struct padding is implementation-defined and endianness varies by CPU. Byte-for-byte mapping assumes a specific layout that may not match another device or compiler." },
    { q: "What is a tagged union used for?", opts: ["Storing multiple values simultaneously in the same memory", "Safely identifying which union member is currently active", "Replacing enums with raw integers", "Eliminating padding in a struct"], ans: 1, exp: "A tagged union pairs a union with an enum (the \u2018tag\u2019) that records which member is currently valid. Accessing the wrong member without checking the tag is undefined behavior." }
  ];

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  function render() {
    const container = document.getElementById("final-quiz");
    if (!container) return;
    const questions = shuffle(QUESTIONS);
    const state = questions.map(function () { return null; });
    let score = 0; let answered = 0;

    function renderAll() {
      let html = '';
      questions.forEach(function (q, qi) {
        const picked = state[qi];
        html += '<div class="quiz-box" id="fq-' + qi + '">';
        html += '<div class="quiz-tag">Q ' + (qi + 1) + ' of ' + questions.length + '</div>';
        html += '<p class="quiz-q">' + q.q + '</p><div class="quiz-opts">';
        q.opts.forEach(function (opt, oi) {
          let cls = 'quiz-opt';
          if (picked !== null) {
            if (oi === q.ans) cls += ' correct';
            else if (oi === picked) cls += ' wrong';
          }
          const dis = picked !== null ? ' disabled' : '';
          html += '<button class="' + cls + '"' + dis + ' data-qi="' + qi + '" data-oi="' + oi + '">' + opt + '</button>';
        });
        html += '</div>';
        if (picked !== null) {
          const ok = picked === q.ans;
          html += '<div class="quiz-explain ' + (ok ? 'ok' : '') + '">' + (ok ? '\u2714 Correct — ' : '\u2716 Incorrect — ') + '<span class="exp-body">' + q.exp + '</span></div>';
        }
        html += '</div>';
      });
      if (answered === questions.length) {
        html += '<div class="verdict ' + (score >= questions.length * 0.8 ? 'v-ok' : score >= questions.length * 0.5 ? 'v-warn' : 'v-err') + '" style="margin-top:20px">';
        html += '<b>Quiz complete: ' + score + ' / ' + questions.length + '</b><p style="margin:4px 0 0">Your score has been saved to the dashboard.</p></div>';
        html += '<div class="btn-row"><button class="btn btn-primary" id="fq-retry">Retry (new shuffle)</button></div>';
        if (window.CVL && CVL.store) CVL.store.saveQuiz(score, questions.length);
      }
      container.innerHTML = html;
      container.querySelectorAll(".quiz-opt:not([disabled])").forEach(function (btn) {
        btn.addEventListener("click", function () {
          const qi = +btn.getAttribute("data-qi");
          const oi = +btn.getAttribute("data-oi");
          if (state[qi] !== null) return;
          state[qi] = oi;
          if (oi === questions[qi].ans) score++;
          answered++;
          renderAll();
        });
      });
      const retryBtn = document.getElementById("fq-retry");
      if (retryBtn) retryBtn.addEventListener("click", render);
    }
    renderAll();
  }

  document.addEventListener("DOMContentLoaded", render);
})();