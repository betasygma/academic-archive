#import "@preview/vantage-cv:1.0.0": vantage-cv, styled-link, term, skill
#let configuration = yaml("configuration.yaml")

// Only include a link entry if its value is a non-empty string.
// Prevents "Expected string, dictionary, location, or label, found none"
// when a contact field (e.g. website) is left blank in the yaml.
#let optional-link(name, url, display: none) = {
  if url != none and url != "" {
    ((name: name, link: url, display: display),)
  } else {
    ()
  }
}

#vantage-cv(
  name: configuration.contacts.name,
  position: configuration.position,
  links: (
    (name: "email", link: "mailto:" + configuration.contacts.email),
    ..optional-link("website", configuration.contacts.website.url, display: configuration.contacts.website.displayText),
    ..optional-link("github", configuration.contacts.github.url, display: configuration.contacts.github.displayText),
    ..optional-link("linkedin", configuration.contacts.linkedin.url, display: configuration.contacts.linkedin.displayText),
    ..optional-link("location", "", display: configuration.contacts.address),
  ),
  tagline: (configuration.tagline),
  [

    == Experience

    #for job in configuration.jobs [
      === #job.position \
      #if job.company.link != "" [
        _#link(job.company.link)[#job.company.name]_ \
      ] else [
        _job.company.name_
      ]
      #term[#job.from --- #job.to][#job.location]

      #for point in job.description [
        - #point
      ]
    ]

    == Aspiration

    #configuration.aspiration

    == Perspective on Education

    #configuration.education_critique \ \

    == Favorite Movies / Series

    #for pick in configuration.media_picks [
      === #pick.title (#emph(pick.romanized) / #text(font: "Noto Sans")[#pick.original] ) - #emph(pick.medium)
      \ #pick.why \
    ]
  ],
  [
    == Objective

    #configuration.objective


    == Education

    #for edu in configuration.education [
      === #if edu.place.link != "" [
        #link(edu.place.link)[#edu.place.name]\
      ] else [
        #edu.place.name\
      ]

      #edu.from - #edu.to #h(1fr) #edu.location

      #edu.degree, #edu.major

    ]

    == Skills

    #for skill_item in configuration.skills [
      • #skill_item \
    ]

    == Languages

    #for lang in configuration.technical_expertise [
      #skill(lang.name, lang.level)
    ]

    == Soft Skills

    #for method in configuration.methodology [
      • #method \
    ] \

    == Notable Contributions

    #for item in configuration.contributions [
      === #item.name #h(1fr) #item.year \
      #item.description \
    ]
  ]
)
