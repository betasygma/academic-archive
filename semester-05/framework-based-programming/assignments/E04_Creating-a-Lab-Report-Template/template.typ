#let template(
  title:"",
  event:[],
  author: (),
  author-desc: [],
  body,
) = {
  set text(
    font: "Libertinus Serif",
    size: 9pt,
    tracking: -.01pt,
  )
  set heading(numbering: "1.")
  show heading.where(level: 1): it => {
    set text(
      weight: "bold",
      fill: rgb("#0077c8"),
    )
    it
  }
  show figure.where(kind: table): set figure.caption(position: top)
  show figure.caption: set text(size: 8pt)
  set figure(placement: top)
  set bibliography(style: "apa")

  show figure.caption: it => [
    #text(fill: rgb("#0077c8"), weight: "bold")[
      #it.supplement
      #it.counter.display(it.numbering).
    ]
    #it.body
  ]

  set page(
    footer: context {
      line(length: 100%, stroke: 0.5pt)
      let n = here().page()
      let footer-left = [
        #author.join(", ") – #author-desc
      ]

      if calc.odd(n) {
        grid(
          columns: (1fr, auto),
          footer-left,
          align(right)[#n],
        )
      } else {
        grid(
          columns: (auto, 1fr),
          [#n],
          align(right)[#title],
        )
      }
    }
  )

  grid(
    columns: (2.2cm, 1fr),

    image("res/its-logo.png", width: 1.75cm),

    stack(
      dir: ttb,
      spacing: .75em,
      text(size: 15pt, weight: "bold", tracking: -0.75pt)[#title],
      text(size: 9pt)[#event],
      text(size: 10pt)[#author.join(", ")],
      text(size: 10pt)[#author-desc],
    )
  )

  set par(
    justify: true,
    leading: .8em,
  )
  line(
    length: 100%,
    stroke: 0.1em,
  )
  linebreak()
  body
}