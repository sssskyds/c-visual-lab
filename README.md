# C Visual Lab — Custom Data Types and Object-Oriented Programming in C

An interactive, dependency-free teaching website about custom data types
(`typedef`, `enum`, `struct`, `union`), memory layout, and OOP-style design
in plain C — with an embedded-systems focus.

## 🌐 Live Site

> **[https://sssskyds.github.io/c-visual-lab/](https://sssskyds.github.io/c-visual-lab/)**

## Running the site locally

No build system, no server, no dependencies. Just open `index.html` in any
modern browser (Chrome, Edge, Firefox, Safari). Everything — styling,
visualizations, quizzes, and progress tracking — runs locally.

Progress and theme preference are stored in `localStorage`
(keys: `cvl-progress-v1`, `cvl-theme`). Clearing site data resets the course.

## File structure

```
/
├── index.html            Learning dashboard: roadmap, progress widgets, C vs C++
├── concepts.html         Stage 1 — Why custom data types? + Data Grouping simulator
├── custom-types.html     Stage 2 — typedef / enum / struct / union / tagged union (tabs)
├── structs-memory.html   Stage 3 — Struct Memory Lab + Memory Bug Toggle
├── oops-in-c.html        Stages 4–5 — OOP thinking, encapsulation, opaque handles
├── polymorphism.html     Stages 6–7 — function pointers, interfaces, callbacks, composition
├── pitfalls.html         Stage 8 — 20 interactive warning cards + severity meter
├── playground.html       Stage 9 — guided design playground with simulated build & run
├── quiz.html             Stage 10 — final challenge quiz (14 questions, shuffled)
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
    │   ├── code-playground.js   Guided design playground: code generation + simulated run
    │   └── quiz.js           Mini-quiz renderer + final quiz engine with saved scores
    └── README.md             This file
```

## Features

- **Dark/light theme** — toggle in the top nav; dark is the default.
- **Progress tracking** — every lesson has a "Mark lesson complete" strip.
- **Interactive simulators** — data grouping, enum state machine, live struct editor, endianness viewer, tagged-union explorer, struct layout lab with architecture selector and packed mode, six-mode memory bug visualizer, polymorphic dispatch and callback traces, design decision tool, 20 runnable pitfall visualizations, and a guided design playground.
- **Mini quizzes** on every lesson page plus a shuffled 14-question final quiz.
- **No dependencies** — hand-rolled syntax highlighting and visualizations; no frameworks, fonts, or images are fetched from the network.

## Educational notes

- Struct layouts shown in the visualizations are typical approximations for teaching.
- The playground's "Build & Run" is a simulated trace, not a real compiler.
- The C examples target C11-era idioms (`stdint.h`, `stdbool.h`, `_Static_assert`) commonly used in embedded firmware.

## Suggested learning flow

1. **Concepts** → why custom types exist.
2. **Custom types** → the four tools and the tagged-union pattern.
3. **Memory lab** → alignment, padding, and pointer bugs.
4. **OOP in C** → objects, methods, `self`, opaque handles, lifecycle.
5. **Polymorphism** → function pointers, ops tables, callbacks, composition.
6. **Pitfalls** → what the language will *not* protect you from.
7. **Playground** → assemble a design and study the generated C.
8. **Final quiz** → confirm it stuck.
