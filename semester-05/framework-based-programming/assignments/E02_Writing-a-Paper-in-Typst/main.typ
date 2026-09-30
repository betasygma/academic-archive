#import "@preview/juti:0.1.1"
#import "setup.typ": *

/**
 * Contribution References
 * 0. Conceptualization
 * 1. Methodology
 * 2. Software
 * 3. Validation
 * 4. Formal analysis
 * 5. Investigation
 * 6. Resources
 * 7. Data Curation
 * 8. Writing -- Original Draft
 * 9. Writing -- Review & Editing
 * 10. Visualization
 * 11. Supervision
 * 12. Project Administration
 * 13. Funding Acquisition
 **/

#let authors = juti.init-authors((
  (
    name: "Elena R. Vance",
    institution-ref: (0),
    contribution-refs: (0, 1, 4, 5, 8, 9, 11, 13, 12),
  ),
  (
    name: "Marcus T. Oyelaran",
    institution-ref: 1,
    contribution-refs: (1, 2, 4, 7, 10, 9),
  ),
  (
    name: "Priya S. Khandekar",
    institution-ref: 0,
    contribution-refs: (5, 3, 6, 7, 9),
  ),
))

#let institutions = (
  (
    name: "Department of Theoretical Chemistry, University of Atheria",
    address: "Atheria 90210",
  ),
  (
    name: "Institute for Applied Fictology, Northbridge Polytechnic",
    address: "Northbridge 40040",
  ),
)

#show: juti.template.with(
  title: "Kinetics of Luminate Decay in Synthetic Aetherol Solutions: Evidence for Catalytic Acceleration by Trace Vermillium",
  authors: authors,
  corresponding-ref: 2,
  corresponding-email: "e.vance@univ-atheria.example.edu",
  institutions: institutions,
  abstract: [
    We report the first systematic study of luminate decay kinetics in synthetic aetherol solutions. Using time-resolved spectrophotometry, we measured concentration profiles over 10 hours in the presence and absence of trace vermillium (10 ppm). Decay followed first-order kinetics in both conditions, with the rate constant increasing from $0.302 plus.minus 0.011 h^(−1)$ to $0.498 plus.minus 0.014 h^(−1)$ upon vermillium addition $(p < 0.001)$, a 65% acceleration. An Arrhenius analysis yields an apparent activation energy of 48.2 kJ/mol, consistent with a surface-mediated catalytic pathway. These results establish vermillium as a potent catalyst for luminate degradation and suggest design constraints for long-lived luminate-based photonic media.
  ],
  keywords: (
    "luminate",
    "aetherol",
    "reaction kinetics",
    "catalysis",
    "vermillium",
  ),
  bib: bibliography("references.bib"),
  ..setup,
)

= Introduction

Luminate compounds have attracted sustained interest as candidate storage media for high-density optical memory @moroz2019optical @tanaka2021luminate. Their utility, however, is limited by spontaneous decay in solution, the mechanism of which remains contested. Early work by Farrow and Li @farrow2015thermal proposed a purely thermal pathway, while more recent studies implicate trace-metal catalysis @duval2023trace. The role of vermillium — a common impurity in commercial aetherol — has never been isolated experimentally.
In this work we address three questions: _(i)_ does luminate decay in purified aetherol follow simple first-order kinetics; _(ii)_ does trace vermillium measurably accelerate decay; and _(iii)_ is the acceleration consistent with a catalytic rather than stoichiometric mechanism?

= Materials and Methods

== Sample preparation

Synthetic aetherol (99.98% purity, Solvix Ltd.) was degassed under argon for 30 min. Luminate stock (25 mmol/L) was prepared fresh daily and diluted to a working concentration of 2.5 mmol/L. For treated samples, vermillium(III) chloride was added to a final concentration of 10 ppm. All experiments were performed in triplicate at 298.15 K.

== Kinetic model

Concentration–time data were fit to the integrated first-order rate law,

$ C(t) = C_0 e^(-k t) $ <eq-kinetic>

where $C_0$ is the initial concentration and k the first-order rate constant. Half-lives were computed as $t_(1/2) = ln 2 / k$. Temperature dependence was analysed with the Arrhenius equation,

$ k = A e^(− (E a) / (R T)) $ <eq-arrhenius>

Nonlinear least-squares fits were performed in SciPy 1.14 using the Levenberg–Marquardt algorithm; uncertainties are reported as standard errors of the fit.

= Results

@img-fig-1 shows representative decay curves for control and vermillium-treated solutions. Both datasets are well described by @eq-kinetic $(R^2 >= 0.99)$. Fitted parameters are summarised in @tab-kinetic.

Addition of 10 ppm vermillium increased $k$ by 64.9% while leaving $C_0$ statistically unchanged, ruling out a stoichiometric consumption mechanism. #footnote[Addition of 10 ppm vermillium increased k by 64.9% while leaving C0 statistically unchanged, ruling out a stoichiometric consumption mechanism.]

#figure(
  image("Picture1.png", width: 50%),
  caption: [Luminate concentration versus time for control (circles) and vermillium-treated (squares) solutions at 298.15 K. Lines are first-order fits.],
) <img-fig-1>

#figure(
  table(
    columns: 5,

    align: (x, y) => if x == 0 { left } else { center },

    table.hline(),

    table.header(
      [*Parameter*],
      [*Control*],
      [*Treated*],
      [*$Delta$ (%)*],
      [*p-value*],
    ),

    table.hline(),

    [$k (h^(-1))$],
    [$0.302 plus.minus 0.011$],
    [$0.498 plus.minus 0.014$],
    [$+64.9$],
    [$< 0.001$],

    [$C_0$ (mmol/L)],
    [$2.51 plus.minus 0.04$],
    [$2.49 plus.minus 0.05$],
    [$-0.8$],
    [$0.62$],

    [$t_(1/2)$ (h)],
    [$2.29 plus.minus 0.08$],
    [$1.39 plus.minus 0.04$],
    [$-39.3$],
    [$< 0.001$],

    [$R^2$],
    [$0.994$],
    [$0.991$],
    [—],
    [—],

    table.hline(),
  ),

  caption: [
    Fitted kinetic parameters (mean $plus.minus$ SE, $n = 3$).
  ],
) <tab-kinetic>

= Discussion

Three lines of evidence support a catalytic role for vermillium:

-	the rate enhancement is disproportionate to the vermillium concentration (10 ppm producing a 65% acceleration);
-	the initial concentration is unaffected, indicating vermillium is not consumed;
-	the apparent activation energy (48.2 kJ/mol) is markedly lower than the uncatalysed value of 71.5 kJ/mol reported by Duval et al. @duval2023trace.

These observations are consistent with the surface-complexation model of Hearn @hearn2024surface, in which vermillium coordinates transiently to the luminate π-system and lowers the barrier to ring opening. We note, however, that our experiments cannot distinguish homogeneous from colloidal catalysis; dynamic light scattering studies are planned.

= Conclusion

Trace vermillium at 10 ppm accelerates luminate decay in synthetic aetherol by 65% via an apparently catalytic pathway. Purification protocols for luminate-based photonic media should therefore target sub-ppm vermillium levels. Future work will extend the temperature range and examine other trace metals common in commercial aetherol.

#set heading(numbering: none)

= Acknowledgement

This work was supported by the Atherian Research Council (grant AR-2025-1187). We thank D. Whitcombe for assistance with spectrophotometry.

= CRediT authorship contribution statement

#juti.credits(authors)

= Data availability

The datasets generated and analyzed during the current study, together with all analysis scripts, are openly available in the Atheria Open Research repository at #link("https://doi.org/10.5555/aor.2026.LUM-1187",)[https://doi.org/10.5555/aor.2026.LUM-1187] (fictitious DOI).
