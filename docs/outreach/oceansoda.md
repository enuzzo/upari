# OceanSODA-ETHZ: ocean acidification

**To:** Dr Luke Gregor and Prof. Nicolas Gruber, Environmental Physics, ETH Zürich (the
addresses are on the group's pages at ETH and in Gregor and Gruber 2021, *Earth System
Science Data* 13, 777–808).
**Subject:** OceanSODA-ETHZ on Upari, a free open-source globe: may we keep it?

---

Dear Dr Gregor, dear Professor Gruber,

I make Upari (https://upari.earth), a 3D globe that tells the Earth as it is today. It is
free, with no ads, no accounts, no tracking and no paid tier, and its code is open source
under the Apache License 2.0 (https://github.com/enuzzo/upari). It shows only open data, and
every source is credited on screen, with a link, wherever its data appear.

Upari has chapters on the warming sea, marine heatwaves and coral bleaching, and the sea
turning more acidic was the one missing. OceanSODA-ETHZ tells it best, so we have added a
chapter built on the v2025 release from NOAA NCEI (accession 0220059):

- **The page:** https://upari.earth/#acido (the layer on its own, with the note on how to
  read it), and the chapter "The sea turning acidic" in the Nature story.
- **What it shows:** the yearly mean of surface pH (total scale), one year every four from
  1982 to 2024, as a colour layer on the globe; the global mean falling from 8.112 to 8.037,
  and the hydrogen ions growing by about 19%. The text calls it a reconstruction guided by
  SOCAT observations, not a direct measurement, and says the uncertainty is higher where
  ships rarely pass.
- **How:** the yearly means were computed once from your file and committed to the
  repository as small images (`scripts/prepare-acidification.py`); the original data are not
  redistributed or downloadable from Upari.
- **The credit**, always visible next to the chapter and the layer, links to the dataset's
  DOI (10.25921/m5wx-ja34); the full citation, with your 2021 ESSD paper, is in the credits
  panel and in the repository's third-party notices.

NCEI distributes the dataset with a citation request but without a licence, and the site
carries the name of my small design studio as a signature (the studio earns nothing from
Upari). So I would rather ask you directly: are you happy for Upari to keep this chapter as
it is? If you would like anything changed, the wording, the credit, the years shown, I will
do it; and if you prefer that we take it down, I will remove it the same day.

If a standard licence is simpler for you, CC BY 4.0 would cover this use exactly. A one-line
reply is enough, and I will record it, with the date, in the project's third-party notices.

Thank you for this work.

With best regards,

[name]
Upari · https://upari.earth
[email]
