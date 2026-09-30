#import "template.typ": template

#show: template.with(
  title: [Effects of Lunar Phase on Bioluminescent Fungi Growth Rate],
  event: [Xenobotany Lab Report],
  author: ("R. Aldergrove", "T. Vance", "M. Okoro"),
  author-desc: [Department of Xenobotany, Institute for Applied Mycology],
)

= Abstract

We investigated the correlation between lunar phase and radial growth rate of
_Luminomyces noctifera_, a bioluminescent fungus native to the Kessel Wetlands,
in order to determine whether the faint, cyclically varying illumination cast
by the moon is itself sufficient to act as an environmental cue for fungal
growth, independent of the temperature and humidity fluctuations that
typically accompany lunar-linked field observations. Over a 28-day observation
cycle spanning one complete synodic month, colony diameter was measured daily
across three controlled terraria under identical temperature and humidity
conditions, with only ambient light exposure varying according to a simulated
lunar cycle driven by a programmable LED array; this design allowed us to
isolate illumination intensity as the sole independent variable and to
separate any light-driven response from the confounding seasonal and
meteorological factors that limit the interpretability of purely
observational field reports. Results indicate a statistically significant
increase in growth rate during the new-moon phase and a correspondingly sharp
suppression of growth during the full-moon phase, a pattern that was absent
in both the constant-illumination and constant-darkness control terraria and
that therefore cannot be attributed to total cumulative light dose alone,
suggesting instead a photoinhibitory response mediated by an as-yet
undescribed cryptochrome-like pigment sensitive even to sub-lux light
intensities. These findings support the hypothesis that _L. noctifera_
regulates its luminescence and growth cycles in direct response to
low-intensity light rather than to temperature alone, and they motivate
further molecular work aimed at isolating the photoreceptor responsible for
this behavior.

= Introduction

Bioluminescent fungi have long been documented in folklore under names such as
"foxfire," a glow attributed variously to spirits, decaying wood, and
atmospheric electricity long before its biochemical basis was understood, yet
even today the mechanisms governing the growth cycles of these organisms
remain poorly characterized relative to their better-studied vascular plant
counterparts. _Luminomyces noctifera_ was first cataloged in 2019 during a
biodiversity survey of the Kessel Wetlands, where it was found colonizing
decaying root systems in permanently shaded understory patches, and it has
since become a model organism for studying light-independent circadian
rhythms in fungi precisely because its luminescence and growth appear to
track environmental light cues despite the species possessing no known
image-forming or even light-directional sensory structures
@aldergrove2019cataloging. The wetlands themselves experience minimal
canopy-filtered moonlight even during the clearest full-moon nights, which
initially led early observers to assume that lunar phase could not plausibly
serve as a meaningful signal for an organism buried in leaf litter and rotting
wood.

Prior observational reports from field researchers nonetheless noted that
colony blooms, visible as clusters of newly luminescent fruiting bodies,
appeared more frequently during the darker portion of the lunar cycle and
seemed comparatively suppressed around the full moon, a pattern that
recurred across multiple field seasons and multiple survey sites within the
wetlands; however, because these observations were uncontrolled, no prior
study had succeeded in isolating lunar illumination as a variable independent
of the seasonal temperature swings, rainfall patterns, and humidity changes
that also happen to correlate loosely with lunar phase in this region
@vance2023circadian. Without a controlled laboratory setting in which
temperature, humidity, and nutrient availability could be held constant while
only ambient illumination was varied, it remained impossible to determine
whether the fungus was responding to moonlight itself, to some correlated
seasonal variable, or merely to chance. This study aims to resolve that
ambiguity by testing, under fully controlled conditions, the hypothesis that
simulated lunar light intensity alone, in the complete absence of any
correlated changes in temperature or humidity, is sufficient to modulate the
radial growth rate of _L. noctifera_ colonies.
@fig-colony illustrates the characteristic radial growth habit used to
define colony diameter in this study.

#figure(
  image("res/fig1_colony.png", width: 70%),
  caption: [A mature _L. noctifera_ colony under low ambient light, showing
    radial hyphal strands terminating in glowing fruiting nodes.],
) <fig-colony>

= Materials and Methods

== Specimen Preparation

Three genetically identical colony fragments of _L. noctifera_ (Strain
KW-7), each subcultured from a single parent isolate maintained in the
Institute's spore bank since 2021, were cultured on standardized nutrient
agar plates formulated to match the carbon and nitrogen content of the
Kessel Wetlands substrate before being transferred into sealed glass
terraria (Terraria A, B, and C) maintained at a constant 22.0°C and 85%
relative humidity throughout the entire 28-day observation period. Using
clonal fragments of a single strain, rather than distinct field-collected
specimens, was intended to minimize genotype-driven variation in baseline
growth rate, so that any differences observed between terraria could be
attributed with greater confidence to the differing light regimes rather
than to underlying genetic variability between individual colonies.
Temperature and humidity were logged continuously throughout the study
using in-terrarium sensors, and no terrarium deviated from the target
setpoints by more than 0.3°C or 2% relative humidity at any point during
the trial.

== Lunar Simulation

Each terrarium was fitted with a programmable LED array, spectrally
calibrated with a diffusing filter to approximate the color temperature of
natural moonlight rather than raw white light, and driven by a
microcontroller schedule that emitted light intensity matching the natural
lunar cycle, ranging continuously from $0.001$ lux at new moon to $0.25$
lux at full moon and back down again, following the same 28-day period
used for the observation window as a whole. Terrarium A received this full
simulated lunar cycle without modification, providing the primary
experimental condition against which the two control terraria were
compared. Terrarium B received constant illumination fixed at the cycle's
time-averaged mean intensity, which served as a control for total
cumulative light dose while removing any phase-dependent variation, so
that if growth suppression were driven purely by total light received
rather than by its timing, Terrarium B would be expected to show
intermediate, phase-independent growth throughout. Terrarium C was kept in
constant, uninterrupted darkness for the full duration of the trial,
serving as a control for the zero-light baseline against which both other
conditions could be measured. All three terraria were cultivated using the
same substrate composition, airflow, and handling protocol, following
standard terrarium protocols for terrarium-based fungal cultivation
@iam2024protocols, so that light exposure remained the only variable that
differed systematically between conditions.

== Measurement

Colony diameter was measured daily at 06:00, immediately before the
onset of the terraria's simulated daylight period so that active
luminescence and any transient light-induced hyphal contraction would not
confound the reading, using calibrated digital calipers oriented along the
colony's longest visible radial axis and recorded to the nearest $0.1$
millimeter. Each measurement was taken twice in immediate succession by
the same observer to check for reading consistency, with the pair of
readings averaged when they differed by more than $0.1$ millimeter. Growth
rate was then calculated for each terrarium as the difference in mean
diameter between consecutive days, and these daily figures were in turn
averaged within each of the four lunar phase windows described below to
produce the summary statistics reported in the Results section.

= Results

@growth-table summarizes mean daily growth rate across the four lunar phase
windows (new moon, first quarter, full moon, last quarter), averaged over
the four weeks of observation for each of the three terraria; each entry in
the table therefore represents roughly seven days of daily measurements
pooled together, which smooths out the modest day-to-day measurement noise
inherent in manual caliper readings while still preserving the
phase-to-phase structure that is the central object of interest in this
study.

#figure(
  table(
    columns: 4,
    align: center,
    [*Lunar Phase*], [*Terrarium A (mm/day)*], [*Terrarium B (mm/day)*], [*Terrarium C (mm/day)*],
    [New Moon], [3.8], [2.1], [3.9],
    [First Quarter], [2.6], [2.0], [3.8],
    [Full Moon], [1.2], [2.2], [3.7],
    [Last Quarter], [2.5], [2.1], [3.9],
  ),
  caption: [Mean daily growth rate by lunar phase and terrarium condition.],
) <growth-table>

Terrarium A, exposed to the full simulated lunar cycle, showed growth
rates ranging from $1.2$ mm/day at full moon to $3.8$ mm/day at new moon,
a more than threefold difference between the two extremes of the cycle,
with the intervening first-quarter and last-quarter windows falling at
intermediate values ($2.6$ and $2.5$ mm/day respectively) that traced a
smooth rise and fall in step with the illumination schedule rather than
jumping abruptly between two fixed states. Terrarium B, held at constant
mean illumination equal to the time-averaged intensity of the full lunar
cycle, showed comparatively flat growth across all four windows,
fluctuating only narrowly between $2.0$ and $2.2$ mm/day, which is
consistent with the absence of any phase structure in its light input and
suggests that total cumulative light dose alone does not reproduce the
pattern seen in Terrarium A. Terrarium C, kept in constant, uninterrupted
darkness for the full duration of the trial, showed the highest and most
stable growth rate throughout the entire study, ranging only from $3.7$ to
$3.9$ mm/day, a level closely matching the peak new-moon growth rate
observed in Terrarium A and indicating that even the very low light levels
present during Terrarium A's simulated new moon were not fully equivalent
to true darkness in their effect on the colony.

#figure(
  image("res/fig2_growth_chart.png", width: 90%),
  caption: [Mean daily growth rate by lunar phase for each terrarium
    condition, plotted from the data in @growth-table.],
) <fig-growth-chart>

As shown in @fig-growth-chart, only Terrarium A exhibits phase-locked
suppression of growth at full moon, tracing a pronounced dip that aligns
precisely with the peak of the simulated lunar illumination schedule and
then recovering symmetrically as illumination wanes toward the following
new moon, while the constant-light and constant-dark controls remain
comparatively flat and show no corresponding dip at any point during the
same four-week window, a contrast that would not be expected if growth
rate were governed primarily by temperature, humidity, nutrient depletion,
or any other variable shared equally across all three terraria.

= Discussion

The marked suppression of growth in Terrarium A during the full-moon
window, which is entirely absent in both control terraria despite those
terraria being cultivated under otherwise identical conditions, indicates
that growth rate in _L. noctifera_ is modulated specifically by
low-intensity light exposure rather than by total cumulative light dose
received over the course of the cycle. If total light dose alone were the
operative variable, Terrarium B, which received the same average
intensity as Terrarium A spread evenly across the cycle, would be expected
to show a growth rate intermediate between Terrarium A's new-moon peak and
full-moon trough; instead it showed almost no variation at all, which
argues strongly for a mechanism sensitive to the timing and rate of change
of illumination rather than to its accumulated total. The near-identical
growth rates between Terrarium A at new moon and Terrarium C in constant
darkness further support this conclusion, since if darkness itself were
somehow required for maximal growth beyond what the new-moon light level
already provides, Terrarium A's new-moon growth rate would be expected to
fall measurably short of Terrarium C's; the fact that it does not suggests
that even the faint illumination present during full moon, on the order of
only $0.25$ lux and far dimmer than any level of light a human observer
would consciously register, is nonetheless sufficient on its own to trigger
a measurable inhibitory response in this organism.

We propose that this photoinhibition is mediated by a putative
cryptochrome-like photoreceptor, tentatively named "noctopsin," which has
not yet been isolated at the molecular level but which, based on the
dose-response behavior observed here, would need to be sensitive to
sub-lux light intensities well below the thresholds typically reported for
characterized fungal photoreceptors, and which may operate through a
signaling pathway distinct from the blue-light-responsive white-collar
proteins described in other filamentous fungi. Future work should focus on
identifying the pigment responsible, for instance through targeted
knockdown or knockout experiments once a candidate gene can be identified,
and on determining whether the growth response documented here reflects a
true circadian entrainment mechanism, in which the fungus anticipates and
prepares for the coming light phase in advance, or instead a more direct
photoinhibitory reflex that simply responds to instantaneous light levels
without any predictive or anticipatory component.

== Limitations

The sample size of one colony per condition limits the statistical power
of this study considerably, since any single colony may carry idiosyncratic
growth characteristics unrelated to the light treatment it received, and
replication across multiple independent colony fragments per condition, run
either in parallel or across successive lunar cycles, would be needed
before the effect sizes reported here could be treated as fully
generalizable to the species as a whole rather than to this particular
strain and these particular specimens. Additionally, although the LED
array used in this study was fitted with a diffusing filter intended to
approximate the color temperature of natural moonlight, it may not
perfectly replicate the full spectral composition, polarization, or subtle
temporal flicker characteristics of true lunar illumination as it would be
filtered through the wetlands' canopy in the field, and any of these
differences could in principle influence the fungal photoreceptor response
differently than genuine moonlight would, meaning that confirmatory
observations under natural field conditions remain a necessary complement
to the controlled results presented here.

= Conclusion

Simulated lunar phase significantly affects the radial growth rate of
_Luminomyces noctifera_, with growth suppressed during high-illumination
phases such as the full moon and maximized during low-illumination phases
such as the new moon, a relationship that held consistently across the
full 28-day observation cycle and that was not reproduced in either the
constant-illumination or constant-darkness control terraria. Because the
effect appeared specifically in the terrarium exposed to the varying lunar
schedule and not in either control, and because it tracked the timing of
illumination rather than its cumulative total, these results support a
light-mediated, rather than purely temperature- or humidity-mediated,
regulatory mechanism in this species. Taken together with the prior field
observations that first motivated this study, the findings reported here
suggest that _L. noctifera_ possesses a previously undocumented,
highly light-sensitive regulatory pathway linking ambient illumination to
growth and, presumably, to the timing of luminescent fruiting body
production, and they merit further molecular investigation aimed at
isolating the photoreceptor responsible and clarifying its relationship to
better-characterized fungal light-response systems.

#bibliography("res/refs.bib", title: [References])
