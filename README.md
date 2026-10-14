# C Visual Lab — In-Depth C, from Foundations to OOP in C

An interactive, dependency-free teaching website about C in depth — from
foundations (types, promotion, pointers, lifetime) through custom data types
(`typedef`, `enum`, `struct`, `union`), memory layout, preprocessor/modules,
and OOP-style design in plain C — with an embedded-systems focus.

## 🌐 Live Site

> **[https://sssskyds.github.io/c-visual-lab/](https://sssskyds.github.io/c-visual-lab/)**

## Running the site locally

No build system, no server, no dependencies. Just open `index.html` in any
modern browser (Chrome, Edge, Firefox, Safari). Everything — styling,
visualizations, quizzes, and progress tracking — runs locally.

Progress and theme preference are stored in `localStorage`
(keys: `cvl-progress-v1`, `cvl-theme`). Clearing site data resets the course.
Progress is keyed by lesson id, so existing completions survive stage renumbering.

## File structure

```
/
├── index.html            Learning dashboard: roadmap, progress widgets
├── foundations.html      Stage 1 — C foundations: types, promotion, operators, control, functions, arrays/strings
├── pointers.html         Stage 2 — Pointers, arrays & strings + pointer-arithmetic visualizer
├── memory-lifetime.html  Stage 3 — Memory & lifetime: stack/heap/static, malloc/free, heap timeline
├── concepts.html         Stage 4 — Why custom data types? + types as correctness tool
├── custom-types.html     Stage 5 — typedef / enum / struct / union / tagged union (deepened)
├── structs-memory.html   Stage 6 — Struct Memory Lab + Memory Bug Toggle
├── oops-in-c.html        Stage 7 — OOP thinking, encapsulation, opaque handles
├── polymorphism.html     Stage 8 — function pointers, interfaces, callbacks, composition
├── pitfalls.html         Stage 9 — 20 interactive warning cards + severity meter
├── preprocessor-build.html Stage 10 — Headers, macros, conditional compilation, const/volatile/static, bits, build
├── playground.html       Stage 11 — guided design playground with simulated build & run
├── quiz.html             Stage 12 — final challenge quiz (26 questions, shuffled)
└── assets/
    ├── css/
    │   ├── style.css         Design tokens, dark/light themes, layout, typography, nav
    │   ├── components.css    Cards, buttons, tabs, memory grids, consoles, quiz UI, etc.
    │   └── animations.css    Keyframes + motion utilities (honors prefers-reduced-motion)
    ├── js/
    │   ├── app.js            Core: progress store, theme toggle, C syntax highlighter
    │   ├── navigation.js     Sticky top nav, learning-progress sidebar, breadcrumbs
    │   ├── visualizer.js     Page visualizations
    │   ├── memory-simulator.js  Struct layout engine + Memory Bug Toggle
    │   ├── deep-dive.js      Core-C simulators: type sizes, promotion, pointers, heap, macros
    │   ├── code-playground.js   Guided design playground: code generation + simulated run
    │   └── quiz.js           Mini-quiz renderer + final quiz engine with saved scores
    └── README.md             This file
```

## Features

- **Dark/light theme** — toggle in the top nav; dark is the default.
- **Progress tracking** — every lesson has a "Mark lesson complete" strip.
- **Interactive simulators** — type-size explorer, promotion predictor, pointer-arithmetic
  visualizer, heap timeline, macro-expansion playground, enum state machine,
  struct layout lab with architecture selector and packed mode, six-mode memory
  bug visualizer, polymorphic dispatch and callback traces, design decision tool,
  20 runnable pitfall visualizations, and a guided design playground.
- **Mini quizzes** on every lesson page plus a shuffled 26-question final quiz.
- **No dependencies** — hand-rolled syntax highlighting and visualizations; no frameworks, fonts, or images are fetched from the network.

## Educational notes

- Struct layouts and type sizes shown in the visualizations are typical approximations for teaching.
  Exact layout depends on the compiler, ABI, architecture, and packing attributes — verify with
  `sizeof` / `offsetof` on your real toolchain.
- The playground's "Build & Run" is a simulated trace, not a real compiler.
- The C examples target C11-era idioms (`stdint.h`, `stdbool.h`, `_Static_assert`) commonly used in embedded firmware.

## Suggested learning flow

1. **Foundations** → types, promotion, operators, control flow, functions, arrays/strings.
2. **Pointers** → `&`/`*`, arithmetic, decay, `const` pointers, pointers to pointers.
3. **Memory & lifetime** → stack/heap/static, `malloc`/`free` ownership, lifetime bugs.
4. **Concepts** → why custom types exist.
5. **Custom types** → the four tools and the tagged-union pattern.
6. **Memory lab** → alignment, padding, and pointer bugs.
7. **OOP in C** → objects, methods, `self`, opaque handles, lifecycle.
8. **Polymorphism** → function pointers, ops tables, callbacks, composition.
9. **Pitfalls** → what the language will *not* protect you from.
10. **Preprocessor & build** → headers, macros, `const`/`volatile`/`static`, bits, build pipeline.
11. **Playground** → assemble a design and study the generated C.
12. **Final quiz** → confirm it stuck.
