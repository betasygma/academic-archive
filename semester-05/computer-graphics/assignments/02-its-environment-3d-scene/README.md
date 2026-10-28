# ITS Environment 3D Scene

A WebGL-based 3D scene and animation project that represents selected objects and locations within the Institut Teknologi Sepuluh Nopember (ITS) campus, outside the Informatics Engineering Department. The project applies 3D transformations, camera, lighting, texture, and hierarchical modelling.

[![WebGL 2](https://img.shields.io/badge/WebGL-2.0-blue?logo=webgl)](https://www.khronos.org/webgl/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6%2B-yellow?logo=javascript)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![HTML5](https://img.shields.io/badge/HTML5-Canvas-orange?logo=html5)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-Layout-blue?logo=css3)](https://developer.mozilla.org/en-US/docs/Web/CSS)

**Course:** Computer Graphics — Assignment 2  
**Semester:** 5  
**Academic Year:** 2026/2027  
**Institution:** Institut Teknologi Sepuluh Nopember (ITS), Surabaya, Indonesia  
**Contributors:** Mikail Ibrahim Hakim (SID 5025241046) and Bara Semangat Rohmani (SID 5025241144)

---

## Table of Contents

- [Overview](#overview)
- [Objectives](#objectives)
- [Features](#features)
- [Scene and Objects](#scene-and-objects)
- [Animation](#animation)
- [Implementation](#implementation)
- [Hierarchical Modelling](#hierarchical-modelling)
- [Visual Documentation](#visual-documentation)
- [Task Distribution](#task-distribution)
- [Project Structure](#project-structure)
- [Requirements](#requirements)
- [Running the Project](#running-the-project)
- [Learning Outcomes](#learning-outcomes)
- [Limitations](#limitations)
- [References](#references)

---

## Overview

This project is developed as part of Assignment 2 for the Computer Graphics course. It aims to recreate selected objects or an area within the ITS campus environment, excluding the Informatics Engineering Department, as an animated 3D scene using WebGL.

The implementation focuses on representing the selected real-world environment through 3D modelling, transformations, camera configuration, lighting, textures, and hierarchical relationships between objects.

**Selected Location:** *[Location Name]*  
**Project Status:** In Development


## Objectives

The objectives of this project are to:

- Recreate selected objects from the ITS campus environment in a 3D scene.
- Apply 3D transformations to position, rotate, and scale objects.
- Implement camera configuration and scene viewing.
- Apply lighting and textures to improve visual representation.
- Use hierarchical modelling to define relationships between objects.
- Develop animations for selected objects or scene elements.


## Features

<!-- Update this checklist as the corresponding features are implemented and verified. -->

- [ ] 3D scene representing a selected ITS campus location.
- [ ] Custom 3D object modelling.
- [ ] Translation, rotation, and scaling.
- [ ] Camera configuration.
- [ ] Lighting implementation.
- [ ] Texture mapping.
- [ ] Hierarchical modelling.
- [ ] Object animation.
- [ ] Reference photographs and videos.
- [ ] Hierarchical object tree diagram.
- [ ] Main application page with a WebGL canvas.


## Scene and Objects

This section describes the real-world location and objects represented in the scene.

**Location:** *[Location Name]*  
**Description:** *[Brief description of the selected area and its main characteristics.]*

### Object List

| No. | Object | Description | Implementation Status |
|---|---|---|---|
| 1 | [Object Name] | [Object description] | Planned |
| 2 | [Object Name] | [Object description] | Planned |
| 3 | [Object Name] | [Object description] | Planned |

### Reference Photographs

<!-- Add the original photographs used as modelling references. -->

| Object or Location | Reference Image |
|---|---|
| [Object 1] | [Image or relative file path] |
| [Object 2] | [Image or relative file path] |

### Reference Videos

<!-- Add links to videos showing the actual objects or location. -->

- **[Video Title]:** [Video URL]


## Animation

This section describes the animated elements and their behaviour.

| Object | Animation Type | Description |
|---|---|---|
| [Object 1] | [Animation Type] | [Animation description] |
| [Object 2] | [Animation Type] | [Animation description] |

**Animation Method:** *[Describe the animation loop, timing, and transformations used.]*


## Implementation

The project is implemented using WebGL and supporting web technologies.

### Technologies

| Technology | Purpose |
|---|---|
| WebGL 2 | Rendering the 3D scene. |
| JavaScript | Scene logic, object management, transformations, and animation. |
| HTML5 | Application structure and canvas element. |
| CSS3 | Application layout and presentation. |

### 3D Transformations

*[Describe how translation, rotation, and scaling are applied to the objects.]*

### Camera

*[Describe the camera configuration, viewing direction, and projection method.]*

### Lighting

*[Describe the lighting model, light sources, and their effects on the scene.]*

### Textures

*[Describe the textures used, their sources, and how they are mapped onto objects.]*


## Hierarchical Modelling

The scene uses hierarchical modelling to represent relationships between objects and their components.

<!-- Add the hierarchical object tree diagram below. -->

```text
[Scene Root]
├── [Parent Object 1]
│   ├── [Child Object 1]
│   └── [Child Object 2]
└── [Parent Object 2]
    ├── [Child Object 3]
    └── [Child Object 4]
```

*[Explain how parent-child relationships affect object transformations and positioning.]*


## Visual Documentation

### Application Screenshot

<!-- Add a screenshot of the completed application. -->

![Application Screenshot](assets/screenshots/scene.png)

### WebGL Canvas

<!-- Add a screenshot or link demonstrating the rendered 3D scene. -->

[Canvas Demonstration](#)

### Comparison with the Real Environment

<!-- Place the actual reference image and the rendered scene near each other. -->

| Actual Environment | WebGL Implementation |
|---|---|
| [Reference Image] | [Rendered Scene Image] |

### Animation Demonstration

- **Video:** [Animation Video URL]
- **Format:** [MP4 or other format]


## Task Distribution

The work is divided between group members as follows.

| Member | SID | Responsibilities | Contribution |
|---|---|---|---|
| Mikail Ibrahim Hakim | 5025241046 | [Assigned tasks] | [Description of contribution] |
| Bara Semangat Rohmani | 5025241144 | [Assigned tasks] | [Description of contribution] |


## Project Structure

<!-- Adjust this structure to match the actual repository. Remove directories and files that are not used. -->

```text
02-its-environment-3d-scene/
├── README.md
├── ASSIGNMENT.md
├── index.html
├── assets/
│   ├── reference-images/
│   ├── reference-videos/
│   └── screenshots/
└── docs/
    └── scene-hierarchy.md
```


## Requirements

- A modern web browser with WebGL 2 support.
- A local web server for serving the application files, if required by the implementation.


## Running the Project

1. Clone or download this repository.
2. Open the project directory.
3. Start a local web server if required.
4. Open the application through the local server URL.
5. View the rendered scene and its animations.

**Local URL:** [e.g. http://localhost:8000]

[*Add any project-specific setup instructions here.]*

## Learning Outcomes

Through this project, the group aims to demonstrate an understanding of:

- 3D graphics rendering with WebGL.
- Geometric transformations and coordinate systems.
- Camera configuration and projection.
- Lighting and texture mapping.
- Hierarchical modelling and object relationships.
- Time-based animation.
- Translating real-world visual references into a 3D scene.

## Limitations

- [Describe any modelling limitations.]
- [Describe any differences between the real environment and the implementation.]
- [Describe any technical limitations or incomplete features.]

## References

- [WebGL 2 Specification](https://www.khronos.org/webgl/)
- [MDN WebGL API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API)
<!-- - [Additional references, tutorials, or modelling resources] -->