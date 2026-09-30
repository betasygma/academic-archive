// frontmatter.typ

#let cover(config) = page(
  margin: 0pt, fill: config.cover-fill, header: none, footer: none, {
    set text(fill: config.cover-text)
    if config.cover-image != none {
      place(top + left, image(config.cover-image, width: 100%, height: 100%, fit: "cover"))
    }
    align(center + horizon, {
      text(size: 9pt, tracking: 0.3em, upper(config.author))
      v(0em)
      text(size: 34pt, tracking: 0.08em, upper(config.title))
      v(0em)
      line(length: 2cm, stroke: 0.4pt + config.cover-text)
      v(1.4em)
      text(size: 10.5pt, style: "italic")[Translated by #config.translator]
      v(10em)
    })
  },
)

#let half-title(config) = align(
  center + horizon,
  text(size: 15pt, tracking: config.tracking-caps * 2, smallcaps(config.title)),
)

#let title-page(config) = block(width: 100%, height: 100%, {
  set align(center)
  set par(first-line-indent: 0pt)
  v(18%)
  text(size: config.size-title, tracking: 0.08em, upper(config.title))
  v(1.4em)
  line(length: 1.6cm, stroke: 0.4pt + config.color-muted)
  v(1.4em)
  text(size: 13pt, tracking: config.tracking-caps, smallcaps(config.author))
  linebreak()
  text(size: 10pt, fill: config.color-muted)[#config.author-dates]
  v(1fr)
  text(size: 10.5pt, style: "italic")[Translated by]
  linebreak()
  text(size: 12pt)[#config.translator]
  linebreak()
  text(size: 10pt, fill: config.color-muted)[#config.translation-year]
  v(8%)
})

#let copyright-page(config) = block(width: 100%, height: 100%, {
  set text(size: 8.5pt, fill: config.color-muted)
  set par(justify: false, first-line-indent: 0pt, leading: 0.6em, spacing: 0.9em)
  v(1fr)
  [
    #emph(config.title) by #config.author (#config.author-dates),
    translated by #config.translator (#config.translation-year).

    The text of this translation is in the public domain.

    Digital text based on Project Gutenberg eBook \##config.source-number
    (#config.released; produced by #config.credits).

    Typeset with Typst in #config.font-body. Prepared for personal use.

    #config.typesetter.role #(config.typesetter.name)#if config.typesetter.url != none [ · #(config.typesetter.url)].
  ]
})

#let introduction(config) = {
  heading(level: 1, numbering: none, outlined: false)[Introduction]

  [
    The _Meditations_ are the private notebook of Marcus Aurelius (121–180 CE),
    Roman emperor from 161 until his death. Written in Greek, most likely during
    the military campaigns of his last decade, the twelve books were never meant
    for readers. They are notes addressed to himself, and the Greek title by which
    the work is traditionally known means _To Himself_.

    Their subject is conduct. Again and again Marcus returns to a few Stoic
    lessons: attend to what is in your power, accept what is not, act for the
    common good, and keep death in view without fear.

    This edition reproduces the English translation by George Long, first
    published in 1862. The wording is Long's; only the typography is new.
  ]
}

#let epigraph-page(config) = align(center + horizon, {
  set par(first-line-indent: 0pt, justify: false)
  block(width: 80%, {
    text(style: "italic", size: 11.5pt, config.epigraph.body)
    if config.epigraph.at("source", default: none) != none {
      v(0.8em)
      text(
        size: config.size-running, tracking: config.tracking-caps,
        fill: config.color-muted, smallcaps(config.epigraph.source),
      )
    }
  })
})

#let epigraph-body = [
  "For nowhere either with more quiet or more freedom from trouble does a man
  retire than into his own soul, particularly when he has within him such
  thoughts that by looking into them he is immediately in perfect tranquility;
  and I affirm that tranquility is nothing else than the good ordering of the
  mind. ..."
]

#let back-cover(config) = {
  [#metadata(none) <back-cover>]
  [#metadata(none) <section-start>]
  // latar penuh halaman (halaman genap: margin luar di kiri)
  context place(
    top + left,
    dx: -config.margin.outside, dy: -config.margin.top,
    rect(width: page.width, height: page.height, fill: config.cover-fill, stroke: none),
  )
  block(width: 100%, height: 100%, {
    set text(fill: config.cover-text)
    set par(justify: false, first-line-indent: 0pt, leading: 0.7em)
    set align(center)
    v(22%)
    text(size: 9pt, tracking: 0.3em, upper(config.title))
    v(1.2em)
    line(length: 1.6cm, stroke: 0.4pt + config.cover-text)
    v(1.4em)
    block(width: 82%, text(size: 10pt, style: "italic", config.back-blurb))
    v(1fr)
    text(size: 8pt, tracking: 0.08em)[
      #config.typesetter.role #(config.typesetter.name)
      #if config.typesetter.url != none [ \ #(config.typesetter.url)]
    ]
    v(4%)
  })
}

#let back-blurb = [
  The private notebook of Marcus Aurelius, Roman emperor and Stoic. Written in
  Greek during the campaigns of his last years, the twelve books of the
  _Meditations_ were never meant for readers: notes to himself on duty,
  restraint, and the brevity of life.
]