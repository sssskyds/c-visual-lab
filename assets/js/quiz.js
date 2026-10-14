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
    { q: "What is a tagged union used for?", opts: ["Storing multiple values simultaneously in the same memory", "Safely identifying which union member is currently active", "Replacing enums with raw integers", "Eliminating padding in a struct"], ans: 1, exp: "A tagged union pairs a union with an enum (the \u2018tag\u2019) that records which member is currently valid. Accessing the wrong member without checking the tag is undefined behavior." },
    { q: "What does the C standard guarantee about <code>sizeof(int)</code>?", opts: ["It is always 4", "It is always 2", "Only a minimum range (at least 16 bits); the exact size is implementation-defined", "It equals sizeof(long) on every target"], ans: 2, exp: "C guarantees minimum ranges, not exact sizes. Use <code>&lt;stdint.h&gt;</code> types (int32_t, uint16_t, ...) when the width matters." },
    { q: "<code>uint8_t a = 200, b = 100; uint8_t c = a + b;</code> — what is <code>c</code>?", opts: ["300", "44", "0", "Undefined behavior"], ans: 1, exp: "a + b is computed in int (promotion) as 300, then narrowed to uint8_t on assignment, keeping the low 8 bits: 300 - 256 = 44." },
    { q: "What is the value of <code>-1 &lt; 1U</code> in C?", opts: ["true, because -1 is less than 1", "false — the -1 converts to a large unsigned value", "It does not compile", "Undefined behavior"], ans: 1, exp: "In a mixed signed/unsigned comparison the signed operand converts to unsigned, so -1 becomes a huge value (4294967295 on 32-bit) and the comparison is false." },
    { q: "For <code>int *p</code> on a typical 32-bit target, how far does <code>p + 1</code> move?", opts: ["1 byte", "4 bytes (sizeof(int))", "8 bytes", "It depends on the value stored at *p"], ans: 1, exp: "Pointer arithmetic scales by sizeof(*p). For int* that is typically 4 bytes; for char* it is 1 byte." },
    { q: "Inside <code>void f(int a[])</code>, what does <code>sizeof a</code> give?", opts: ["The number of elements in the array", "The total byte size of the array", "The size of a pointer (4 or 8 bytes)", "0"], ans: 2, exp: "Array parameters decay to pointers. sizeof gives the pointer size, not the array size — pass the length as a separate parameter." },
    { q: "What does <code>const int *p</code> mean?", opts: ["p cannot be changed, but *p can", "The int pointed to cannot be modified through p, but p itself can move", "Neither p nor *p can ever change", "p points to read-only memory"], ans: 1, exp: "Read right-to-left: pointer to const int. *p is read-only through p; p itself can be reassigned. It does not make the data immutable via other pointers." },
    { q: "What is wrong with <code>int *f(void) { int x = 5; return &amp;x; }</code>?", opts: ["Nothing — it returns 5", "It returns the address of a local that ceases to exist when f returns (dangling pointer)", "It leaks memory", "It returns NULL"], ans: 1, exp: "x has automatic storage duration. Its stack frame is gone when f returns, so the returned pointer dangles. Return the value, take an out-pointer, or allocate." },
    { q: "Why should <code>realloc</code> be assigned to a temporary first?", opts: ["realloc is slower otherwise", "On failure realloc returns NULL and the original block is still valid — assigning directly would lose it", "realloc always moves the block", "It is required by the C standard to use a temporary"], ans: 1, exp: "Use <code>void *tmp = realloc(p, n); if (tmp) p = tmp;</code> so a failed realloc does not orphan the original allocation." },
    { q: "What does <code>volatile</code> tell the compiler?", opts: ["The variable is a constant", "The variable may change outside the program — do not cache it or drop reads/writes", "The variable is thread-safe", "The variable lives in flash"], ans: 1, exp: "volatile stops the compiler caching a value (hardware registers, ISR-shared flags). It is not a concurrency primitive: it does not make access atomic or replace a mutex." },
    { q: "With <code>#define SQUARE(x) x * x</code>, what is <code>SQUARE(2 + 3)</code>?", opts: ["25", "11", "10", "It does not compile"], ans: 1, exp: "Macros paste text: 2 + 3 * 2 + 3 = 11. Parenthesise every parameter and the whole body: #define SQUARE(x) ((x) * (x))." },
    { q: "What is wrong with <code>SQUARE(i++)</code> even with a fully parenthesised macro?", opts: ["Nothing — it is safe", "i is incremented twice and the result is undefined behavior (double evaluation)", "It returns 0", "Macros cannot take expressions"], ans: 1, exp: "The macro expands to ((i++) * (i++)), modifying i twice without a sequence point. Never pass side effects to a macro that uses its argument more than once." },
    { q: "What does <code>static</code> mean for a function or variable at file scope?", opts: ["It keeps its value between calls", "Internal linkage — visible only within this translation unit (.c file)", "It is stored on the stack", "It is a constant"], ans: 1, exp: "At file scope, static means internal linkage: the name is private to that .c file. That is C's module boundary." }
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