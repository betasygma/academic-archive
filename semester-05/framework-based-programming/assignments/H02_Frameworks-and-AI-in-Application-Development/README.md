<a name="top"></a>

# 🧠 H02 - Frameworks and AI in Application Development

[![Typst](https://img.shields.io/badge/Document-Typst-239DAD?logo=typst&logoColor=white)](https://typst.app/)

An opinion essay about the role of application frameworks and AI tools in
software development. Take a clear position, support it with reasoned
arguments, and reflect on how these tools affect your growth as a developer.

**Course:** Framework-Based Programming, Assignment H02  
**Document format:** Typst  
**Language:** English for IUP students; Indonesian for regular students  
**Submission:** One ZIP archive containing the source, compiled PDF, and required assets

> [!IMPORTANT]
> The opinions and final argument must be your own and original. AI tools may help with research, outlining, or polishing, but must not decide your position or replace your reasoning.

## Contents

- [Overview](#overview)
- [Essay questions](#essay-questions)
- [Requirements](#requirements)
- [Writing and build workflow](#writing-and-build-workflow)
- [Submission](#submission)
- [Grading rubric](#grading-rubric)
- [Connections to H01 and H03](#connections-to-h01-and-h03)

## Overview

Write a short, opinionated essay addressing two questions:

1. Why do we need frameworks to build applications, and when might we not need
   one?
2. Do we need AI to build applications, and how does using it affect your
   development as a software developer?

There is no single correct conclusion. The essay is assessed on the clarity of
your position, the quality of your reasoning, and how well you address
counterarguments.

## Essay questions

### Part 1: Why do we need frameworks?

Discuss what a framework provides beyond a programming language and its
standard library. Consider the problems it solves and the conventions or
trade-offs it introduces.

Your discussion must address:

- Your preferred framework and the reasons you favor it.
- What the framework does well and what frustrates you about it.
- How it compares with an alternative you have tried or considered.
- Whether frameworks are necessary or mainly convenient, including conditions
  where you would choose not to use one.

### Part 2: Do we need AI to build applications?

Reflect on how code assistants, agents, and generators influence the way you
build software.

Your discussion must address:

- Where AI helps, such as boilerplate, debugging, learning, or test ideas.
- Where AI can hurt, such as incorrect or insecure code, hidden complexity, or
  reduced practice.
- How relying on frameworks and AI may affect the skills you develop, including
  HTTP, SQL, debugging, and design.
- At least one concrete habit or rule you will use to keep learning when using
  these tools.
- Whether you need AI, do not need it, or take an intermediate position, and
  why.

## Requirements

- Write the essay in [Typst](https://typst.app/) using any template. A lab
  report template from the previous assignment is one possible option.
- Include a title, your name, and your student ID.
- Organize the essay into clearly labeled sections, for example: Introduction,
  Frameworks, AI, and Conclusion.
- Use English if you are in IUP; use Indonesian for the regular program.
- State your position clearly and support it with sound reasoning. Examples
  and counterarguments are welcome.
- Keep the writing original. AI may assist your process, but the opinions and
  final reasoning must be yours.

> [!TIP]
> Use examples from your own development experience. H01 and H03 offer a useful
> comparison between building an API without a web framework and implementing
> it with NestJS.

## Writing and build workflow

1. Choose a position on frameworks and a position on AI; they do not have to be
   absolute.
2. Outline reasons, examples, trade-offs, and at least one counterargument for
   each part.
3. Draft the essay in Typst and organize it with clear section headings.
4. Compile the source and review the resulting PDF for missing content and
   layout issues.
5. Package the source, PDF, and any template or asset files the source depends
   on.

Compile from the directory containing the source:

```console
typst compile <student-id>-essay.typ <student-id>-essay.pdf
```

Replace `<student-id>` with your student ID. The source must compile without
errors, and the submitted PDF must be generated from that source.

## Submission

Submit one archive named `<student-id>-essay.zip` containing:

```text
<student-id>-essay.zip
├── <student-id>-essay.typ
├── <student-id>-essay.pdf
└── template and asset files required by the source, if any
```

Before submitting, check that:

- The archive name and both essay filenames use your student ID.
- The source includes the required title, name, student ID, and labeled
  sections.
- The essay uses the language required for your program.
- The PDF compiles from the included Typst source without errors.
- Any template or asset dependencies are included in the ZIP archive.

**Deadline:** 26 October 2026, 23:59 (midnight).

## Grading rubric

| Criterion | Weight |
|---|---:|
| Clear position and argument on frameworks (Part 1) | 25% |
| Clear position on AI, including its effect on growth (Part 2) | 30% |
| Quality of reasoning and counterarguments | 15% |
| Organization, clarity, and writing quality | 15% |
| Correct use of Typst and required title block | 15% |
| **Total** | **100%** |

## Connections to H01 and H03

H02 invites you to reflect on framework trade-offs using practical course
examples:

- [H01 - Life Before Frameworks](../H01_Life-Before-Frameworks/README.md)
  builds a users API directly with Node.js's `node:http` module. It makes
  routing, parsing, validation, and other work visible without a web framework.
- [H03 - NestJS CRUD](../H03_NestJS-CRUD/README.md) implements the users API
  with NestJS, using framework features such as controllers, dependency
  injection, and DTO validation.

These assignments are useful examples for your argument, not a required
conclusion: you may use other frameworks, alternatives, or personal examples.
H02 is a reflection assignment; it does not require changes to the H01 or H03
applications.

## 🧭 Navigation

<table>
  <tr>
    <td align="left">⬅️ <a href="../H01_Life-Before-Frameworks/README.md"><strong>Previous</strong><br>H01 · Life Before Frameworks</a></td>
    <td align="center">🏠 <a href="../../README.md"><strong>Framework-Based Programming</strong></a></td>
    <td align="right"><a href="../H03_NestJS-CRUD/README.md"><strong>Next</strong><br>H03 · NestJS CRUD</a> ➡️</td>
  </tr>
</table>