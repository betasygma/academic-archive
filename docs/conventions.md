# Repository Conventions

This document defines the conventions used throughout the `academic-archive` repository.

The goal is to keep the archive consistent, maintainable, searchable, and understandable as the academic record grows.

---

## 1. Repository Purpose

`academic-archive` is an academic archive and index for the undergraduate Informatics Engineering program.

It serves two related purposes:

1. Preserve academic context and learning materials.
2. Provide a structured gateway to selected portfolio projects.

The repository is not intended to replace dedicated portfolio repositories.

---

## 2. Directory Structure

The primary structure is organized by semester:

```text
academic-archive/
├── docs/
├── semester-01/
├── semester-02/
├── semester-03/
├── semester-04/
├── semester-05/
├── semester-06/
├── semester-07/
└── semester-08/
```

Each semester contains course directories:

```text
semester-05/
├── computer-graphics/
├── framework-based-programming/
├── information-security/
├── knowledge-based-systems-engineering/
├── modeling-and-simulation/
├── multivariate-data-analysis/
├── requirements-engineering/
├── software-evolution/
└── README.md
```

---

## 3. Naming Convention

### Directories

Use:

* lowercase
* kebab-case
* English names

Example:

```text
algorithm-design-and-analysis/
human-computer-interaction/
database-management/
machine-learning/
```

Avoid:

```text
Algorithm Design/
HCI Course/
final_project/
DatabaseManagement/
```

---

## 4. Course Names

Course names should use the canonical English names defined in the academic archive.

Examples:

* `Calculus 1`
* `Fundamental Programming`
* `Data Structures`
* `Object-Oriented Programming`
* `Machine Learning`
* `Human-Computer Interaction`
* `Requirements Engineering`

Folder names should use the corresponding lowercase kebab-case form.

---

## 5. README Convention

Every semester directory should contain:

```text
README.md
```

Every course directory should contain:

```text
README.md
```

The README should provide enough context to understand the contents without opening every file.

A course README should generally include:

* Course overview
* Semester
* Academic domain
* Laboratory affiliation
* Topics
* Coursework
* Technologies
* Repository contents
* Projects
* Learning outcomes
* Notes

---

## 6. Optional Course Subdirectories

Do not create every possible subdirectory automatically.

Only create directories that contain relevant material.

Possible directories include:

```text
assignments/
practicals/
project/
notes/
reports/
datasets/
notebooks/
experiments/
screenshots/
presentations/
resources/
```

For example:

```text
machine-learning/
├── README.md
├── assignments/
├── notebooks/
├── experiments/
└── project/
```

An empty directory is generally unnecessary in Git repositories.

---

## 7. Academic Archive vs Portfolio Repository

The academic archive preserves context.

Portfolio repositories present polished work.

```text
Academic Archive
├── Coursework
├── Assignments
├── Notes
├── Reports
├── Experiments
└── Links to selected projects

Portfolio Repository
├── Polished README
├── Clean source code
├── Documentation
├── Demo
├── Architecture
├── Tests
└── Reproducibility instructions
```

A course project may therefore exist in the archive while its polished version is maintained in a separate repository.

Example:

```text
academic-archive/
└── semester-03/
    └── web-programming/
        └── project/
            └── README.md
```

The README may link to:

```text
github.com/betasygma/<portfolio-repository>
```

The project should not be unnecessarily duplicated across repositories.

---

## 8. Academic Domains

Academic domains should use broadly recognizable Computer Science and Informatics terminology.

Examples:

* Algorithms & Programming
* Computer Systems
* Computer Networks & Cybersecurity
* Distributed & Network Computing
* Data & Information Management
* Software Engineering
* Artificial Intelligence & Machine Learning
* Applied Mathematics & Scientific Computing
* Theoretical Computer Science
* Computer Graphics & Human-Computer Interaction
* Data Analytics

Laboratory affiliation should be stored separately.

---

## 9. Laboratory Affiliations

Laboratory affiliations provide institutional context.

Use the following English names:

| Code   | Laboratory                                       |
| ------ | ------------------------------------------------ |
| AP     | Algorithms and Programming                       |
| NETICS | Network Technology and Intelligent Cybersecurity |
| NCC    | Net-Centric Computing                            |
| IIM    | Information Intelligent Management               |
| SE     | Software Engineering                             |
| ICV    | Intelligent Computing and Vision                 |
| AMC    | Applied Modeling and Computing                   |
| GIGA   | Graphics, Interaction, Games, and Analytics      |

Laboratory affiliation should not determine the academic domain automatically.

---

## 10. Project Classification

A project should have:

* A primary academic domain
* Optional secondary domains
* Relevant technologies
* Course context
* Laboratory affiliation when applicable

Example:

```yaml
academic_domain: Artificial Intelligence & Machine Learning
secondary_domains:
  - Data Analytics
  - Software Engineering
course: Machine Learning
```

---

## 11. Project Promotion

Not every coursework project needs to become a portfolio repository.

A project may be promoted when it provides meaningful evidence of:

* Technical understanding
* Problem solving
* Software engineering practice
* Original implementation
* Interesting technical decisions
* Reproducibility
* Practical or research value

The archive should retain academic context even when a project is promoted elsewhere.

---

## 12. Files and Artifacts

Common academic artifacts may include:

```text
Source Code
Notebooks
Datasets
Reports
Presentations
Screenshots
Experiment Results
Diagrams
Database Schemas
SQL Scripts
Documentation
```

Files should be stored close to the course or project they belong to.

Avoid placing unrelated files in the repository root.

---

## 13. Git and Version Control

Use Git to preserve meaningful development history.

Prefer commits that describe actual changes:

```text
add database schema
implement authentication
add experiment notebook
document algorithm complexity
fix input validation
update project documentation
```

Avoid meaningless commit messages such as:

```text
final
final2
fix
update
asdf
really-final
```

For small academic exercises, commit history does not need to imitate a large software company.

---

## 14. Sensitive Information

Do not commit:

* Passwords
* API keys
* Access tokens
* `.env` files containing secrets
* Private credentials
* Personal identification numbers
* Private datasets without permission
* Restricted academic materials

Use `.gitignore` and `.env.example` where appropriate.

---

## 15. Personal Information

The archive should contain only information relevant to the academic portfolio.

Generally appropriate:

* Program
* Institution
* Degree
* Study period
* GitHub profile

Generally unnecessary:

* Student identification number
* Home address
* Phone number
* Date of birth
* Private contact information

---

## 16. Grades

Grades are intentionally excluded from the academic archive.

The repository documents:

* What was studied
* What was built
* What was practiced
* What technical skills were developed
* What evidence exists

Academic performance can be documented through formal institutional records when required rather than through the public GitHub archive.

---

## 17. Language

English is the primary language for:

* Repository names
* Directory names
* Main README files
* Academic domain names
* Technical documentation

Indonesian may be retained when it is part of original academic materials or when required to preserve course context.

Original assignment documents do not need to be translated solely for the purpose of this repository.

---

## 18. Team Projects

For collaborative work, clearly document individual contributions.

Example:

```markdown
## My Contribution

- Designed the database schema
- Implemented the authentication module
- Developed the REST API
- Wrote integration tests
```

Do not imply sole authorship of collaborative work.

---

## 19. External Resources

External resources should be documented when they are important for:

* Understanding the project
* Reproducing the work
* Giving attribution
* Identifying references
* Explaining dependencies

Use a `resources/` directory when the course requires substantial supporting material.

---

## 20. Reproducibility

Projects intended for reuse or portfolio presentation should aim to provide a clear workflow:

```text
Clone
  ↓
Install dependencies
  ↓
Configure environment
  ↓
Prepare database / dataset
  ↓
Run
  ↓
Test
```

Not every small academic exercise needs full production-level reproducibility.

The required level of documentation should match the project's complexity.

---

## 21. Archive Principle

The repository follows a simple principle:

> **Preserve context, not clutter.**

Academic materials should be retained when they provide useful evidence of learning, development, experimentation, or project history.

Materials that add no meaningful context may be omitted.

The goal is to build a useful academic record, not a digital landfill.
