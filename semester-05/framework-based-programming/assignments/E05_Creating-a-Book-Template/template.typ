// template.typ
#import "content.typ": cover, half-title, title-page, copyright-page, introduction, epigraph-page,  epigraph-body, back-cover, back-blurb
#import "@preview/droplet:0.3.1": dropcap

// ───────────── 1. CONFIG & TEMA ─────────────
#let config = (
  // metadata
  title: "Meditations",
  author: "Marcus Aurelius",
  author-dates: "121–180 CE",
  translator: "George Long",
  translation-year: "1862",
  source-number: "2680",
  released: "June 2001",
  credits: "J. Boulton and David Widger",
  keywords: ("Stoicism", "philosophy", "Marcus Aurelius"),
  lang: "en",

  // halaman (A5, margin cermin)
  paper: "a5",
  margin: (top: 18mm, bottom: 20mm, inside: 22mm, outside: 16mm),

  // cover
  size-title: 30pt,
  cover-image: "cover.png",
  cover-fill: rgb("#1f1d1a"),
  cover-text: rgb("#e9e2d0"),

  // tipografi
  font-body: "EB Garamond",
  font-heading: "EB Garamond",
  size-body: 10pt,
  leading: 0.72em,
  indent: 1.2em,
  size-book-label: 15pt,
  size-book-desc: 10pt,
  size-running: 8.5pt,
  tracking-caps: 0.12em,
  header-rule: none,
  number-type: "old-style",

  // warna
  color-text: rgb("#1c1c1c"),
  color-muted: rgb("#6b6b6b"),

  // feature flags
  drop-cap: true,
  ornament: true,
  dropcap-lines: 3,
  validate-books: true,

  // kredit dan konten tambahan
  typesetter: (role: "Typeset and designed by", name: "Bara S. Rohmani", url: none),
  epigraph: (body: epigraph-body, source: "Marcus Aurelius, Meditations, Book IV"),
  back-blurb: back-blurb
)

// ───────────── 2. HELPER & PARSER ─────────────
// Ubah content menjadi string agar heading dapat diproses sebagai teks biasa.
#let to-str(c) = {
  if type(c) == str { c }
  else if c.func() == [ ].func() { " " }
  else if c.has("text") { c.text }
  else if c.has("children") { c.children.map(to-str).join() }
  else { "" }
}

// Pecah heading Book jadi label dan deskripsi.
// "BOOK ONE: Written among the Quadi, on the Granua."
// -> (label: "BOOK ONE", description: "Written among the Quadi, on the Granua.")
#let parse-book-heading(body) = {
  let s = to-str(body).trim()
  let m = s.match(regex("^(BOOK\\s+[A-Z]+)\\s*:\\s*(.+)$"))
  if m == none {
    panic(
      "Heading tidak sesuai pola 'BOOK <NOMOR>: <deskripsi>'. Ditemukan: \"" + s + "\""
    )
  }
  (label: m.captures.at(0), description: m.captures.at(1).trim())
}

// Awal tiap Book ada di halaman recto.
// Sisipkan verso kosong jika perlu.
// <pre-break> ditaruh di akhir konten sebelumnya, penanda halaman terakhir yang berisi teks.
#let recto-break(weak: true) = {
  [#metadata(none) <pre-break>]
  pagebreak(to: "odd", weak: weak)
}

// Tandai awal bagian yang digunakan untuk hitung posisi halaman.
#let mark-section() = [#metadata(none) <section-start>]

// Deteksi halaman kosong yang sengaja muncul tepat sebelum awal Book
// (tidak ada <pre-break>).
#let is-blank-page(pg) = {
  let starts = (query(<book-start>) + query(<section-start>)).map(m => m.location().page())
  let ends = query(<pre-break>).map(m => m.location().page())
  starts.contains(pg + 1) and not ends.contains(pg) and not starts.contains(pg)
}

// ───────────── 3. PAGE SETUP ─────────────
#let apply-page-setup(doc) = {
  // metadata PDF
  set document(
    title: config.title + " — " + config.author,
    author: config.author,
    keywords: config.keywords,
  )
  // ukuran page dan bahasa
  set page(paper: config.paper, margin: config.margin)
  set text(lang: config.lang)
  doc
}

// ───────────── 4. TEKS & PARAGRAF ─────────────
#let apply-text-style(doc) = {
  // tipografi
  set text(
    font: config.font-body,
    size: config.size-body,
    fill: config.color-text,
    hyphenate: true,
    ligatures: true,
    // penalti pemenggalan page
    costs: (hyphenation: 110%, runt: 150%, widow: 200%, orphan: 200%),
  )
  set par(
    justify: true,
    leading: config.leading,
    spacing: config.leading,          // tanpa jarak antarparagraf; pembeda = indent
    first-line-indent: config.indent, // paragraf pertama setelah heading otomatis tanpa indent
  )
  // quote blok sedikit lebih kecil
  show quote.where(block: true): it => pad(
    x: 1.6em, y: 0.4em,
    text(size: 0.95em, it.body),
  )
  doc
}

// ───────────── 5. HEADING BOOK ─────────────
#let apply-book-heading(doc) = {
  show heading.where(level: 1): it => {
    if it.numbering == none {   // heading front matter (Contents, Introduction)
      return block(width: 100%, above: 0pt, below: 2em, {
        v(12%)
        align(center, text(
          size: config.size-book-label,
          tracking: config.tracking-caps,
          smallcaps(it.body),
        ))
      })
    }
    // heading Book di-parsing & dimulai pada page recto
    let p = parse-book-heading(it.body)
    recto-break()
    [#metadata(p) <book-start>]
    // Book pertama = awal penomoran Arab
    context if counter(heading).get().first() == 1 { counter(page).update(1) }
    // opening Book gunakan align center dengan space vertikal besar
    block(width: 100%, sticky: true, {
      v(22%)
      align(center)[
        #text(
          font: config.font-heading,
          size: config.size-book-label,
          tracking: config.tracking-caps,
          p.label,
        )
        #v(0.7em)
        #text(
          size: config.size-book-desc,
          style: "italic",
          fill: config.color-muted,
          p.description,
        )
        #if config.ornament { v(1.2em); line(length: 1.2cm, stroke: 0.4pt + config.color-muted) }
      ]
      v(2.2em)
    })
  }
  doc
}

// ───────────── 6-7. HEADER, FOOTER, PENOMORAN ─────────────
// tentukan jenis halaman berdasar marker, bukan state.
// tidak melihat state yang berubah di badan halaman yang sama.
//   bare  = cover, half-title, title, copyright (tanpa header & nomor)
//   front = TOC, intro (tanpa header, nomor romawi)
//   main  = isi buku (header, nomor Arab)
#let first-page-of(lbl) = {
  let q = query(lbl)
  if q.len() == 0 { none } else { q.first().location().page() }
}

#let matter-of(pg) = {
  let main-pg = first-page-of(<book-start>)
  let front-pg = first-page-of(<front-start>)
  if main-pg != none and pg >= main-pg { "main" }
  else if front-pg != none and pg >= front-pg { "front" }
  else { "bare" }
}

// periksa apa marker tertentu ada pada page 
#let on-page(lbl) = query(lbl).any(m => m.location().page() == here().page())

#let running-header() = context {
  let pg = here().page()
  if matter-of(pg) != "main" { return none }
  if is-blank-page(pg) or on-page(<book-start>) or on-page(<back-cover>) { return none }  // header hilang pada blank page, pembuka Book, back cover

  let label = if calc.odd(pg) {
    // recto: Book yang sedang berjalan
    let marks = query(selector(<book-start>).before(here()))
    if marks.len() == 0 { return none }
    marks.last().value.label
  } else {
    // verso: judul karya
    config.title
  }

  let items = (
    text(
      size: config.size-running,
      tracking: config.tracking-caps,
      fill: config.color-muted,
      smallcaps(lower(label)),
    ),
  )
  // header line opsional
  if config.header-rule != none {
    items.push(line(length: 100%, stroke: config.header-rule))
  }
  align(center, stack(dir: ttb, spacing: 0.45em, ..items))
}

#let running-footer() = context {
  let pg = here().page()
  let mt = matter-of(pg)
  // bare page, blank page, dan back cover tidak memiliki nomor.
  if mt == "bare" or is-blank-page(pg) or on-page(<back-cover>) { return none }

  // front matter = angka Romawi; main matter = angka Arab.
  let fmt = if mt == "front" { "i" } else { "1" }
  let num = text(
    size: config.size-running,
    fill: config.color-muted,
    counter(page).display(fmt),
  )
  // nomor di sisi luar: recto kanan, verso kiri
  align(if calc.odd(pg) { right } else { left }, num)

  let num = text(
    size: config.size-running,
    fill: config.color-muted,
    number-type: config.number-type,
    counter(page).display(fmt),
  )
}

#let apply-running-page(doc) = {
  // header dan footer gunakan context
  set page(
    header: running-header(),
    footer: running-footer(),
    header-ascent: 35%,
    footer-descent: 35%,
  )
  doc
}

// ───────────── 8. FRONT MATTER & BACK COVER ─────────────
#let contents-page() = {
  recto-break()
  mark-section()
  [#metadata(none) <front-start>]
  counter(page).update(1)
  heading(level: 1, numbering: none, outlined: false)[Contents]

  // entry level Book diberi format label, dot leader, nomor halaman, dan deskripsi di bawahnya.
  show outline.entry.where(level: 1): it => {
    let p = parse-book-heading(it.element.body)
    block(above: 1.35em, link(it.element.location(), {
      grid(
        columns: (auto, 1fr, auto), column-gutter: 0.6em,
        text(tracking: config.tracking-caps, p.label),
        repeat(gap: 0.35em, text(fill: config.color-muted)[.]),
        text(number-type: config.number-type, it.page()),
      )
      text(size: config.size-book-desc, style: "italic", fill: config.color-muted, p.description)
    }))
  }
  // hanya heading Book level 1 yang masuk ke daftar isi.
  outline(title: none, target: heading.where(numbering: "1"), depth: 1)
}

#let front-matter() = {
  // urutan front matter ikuti struktur buku fisik:
  // cover → half-title → title page → copyright → epigraph → contents → introduction.
  cover(config)
  
  recto-break(weak: false); mark-section()
  half-title(config)
  
  recto-break(); mark-section()
  title-page(config)
  
  pagebreak()                        // verso: copyright
  copyright-page(config)
  
  if config.epigraph != none {
    recto-break(); mark-section()
    epigraph-page(config)
  }
  
  contents-page()
  
  recto-break(); mark-section()
  introduction(config)
}

#let back-cover-page() = {
  // back cover pada page terakhir verso.
  [#metadata(none) <pre-break>]
  pagebreak(to: "even")
  back-cover(config)
}

// ───────────── 9. DROP CAP & VALIDASI ─────────────
#let with-dropcaps(doc) = {
  if not config.drop-cap or not doc.has("children") { return doc }

  let kids = doc.children
  let space-fn = [ ].func()
  let out = ()
  let pending = false
  let i = 0

  while i < kids.len() {
    let c = kids.at(i)
    let f = c.func()

    // setelah heading, paragraf pertama jadi kandidat drop cap.
    if f == heading {
      out.push(c)
      pending = true
      i += 1
    // abaikan whitespace atau parbreak sebelum paragraf pertama.
    } else if pending and (f == space-fn or f == parbreak) {
      out.push(c)
      i += 1
    } else if pending {
      pending = false
      // ambil seluruh elemen paragraf pertama sampai parbreak berikutnya.
      let j = i
      while j < kids.len() and kids.at(j).func() != parbreak { j += 1 }
      let run = kids.slice(i, j)
      let first = run.first()
      let cl = if first.func() == text { first.text.clusters() } else { () }

      // drop cap hanya diterapkan jika karakter pertama berupa huruf.
      if cl.len() > 0 and cl.first().match(regex("\\p{L}")) != none {
        let rest = (cl.slice(1).join(), ..run.slice(1)).join()
        
        out.push({
          set par(first-line-indent: 0pt)
          
          dropcap(
            height: config.dropcap-lines,
            gap: 8pt,
            justify: true,
            hanging-indent: 0pt,
            font: config.font-heading,
            style: "italic",
            cl.first(),
            rest,
          )
        })
      } else {
        // bukan huruf, biarkan normal tanpa drop cap
        out.push(run.join())
      }
      i = j
    } else {
      out.push(c)
      i += 1
    }
  }
  out.join()
}

#let book-numbers = (
  "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX",
  "SEVEN", "EIGHT", "NINE", "TEN", "ELEVEN", "TWELVE",
)

// validasi jumlah, nama dan urutan Book.
#let validate-books() = context {
  let found = query(<book-start>).map(m => m.value.label.replace(regex("\\s+"), " "))
  let expected = book-numbers.map(n => "BOOK " + n)
  if found != expected {
    panic(
      "Urutan Book tidak sesuai. Ditemukan " + str(found.len()) + " Book: "
        + found.join(", ") + ". Diharapkan: BOOK ONE ... BOOK TWELVE."
    )
  }
}

// ───────────── 10. ENTRY POINT ─────────────
#let meditations(doc) = {
  // terapkan seluruh layer template.
  show: apply-page-setup
  show: apply-text-style
  show: apply-running-page
  show: apply-book-heading
  
  // render front matter.
  front-matter()
  
  // nomor Book pakai numbering heading (penanda, tak ditampilkan), drop cap diterapkan pada text.
  set heading(numbering: "1")
  with-dropcaps(doc)
  
  // validasi struktur Book jika fitur aktif.
  if config.validate-books { validate-books() }
  
  // render back cover.
  back-cover-page()
}