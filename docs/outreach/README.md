# Letters to data providers

Drafts for the maintainer to send, one per provider whose data Upari would like to show but
cannot yet: the licence is missing, unclear, or reserved to non-profit research. Each letter
describes the project the same way (see below), asks one precise question and proposes how
the data would appear, so a yes can be given in one line.

Before sending: fill in the signature, check the recipient address on the provider's own
site (the addresses below were read on 28 October 2026), and keep the reply. A written yes
goes into `THIRD_PARTY_NOTICES.md` with its date and the name of who gave it.

| Provider | Data | Why a letter | Letter |
| --- | --- | --- | --- |
| ETH Zürich, Gregor and Gruber | OceanSODA-ETHZ, ocean acidification since 1982 | Public on NCEI with a citation, but no licence | [oceansoda.md](oceansoda.md) |
| UNEP-WCMC | WDPA, the world's protected areas | Commercial use and redistribution need written permission; the definition of commercial is broad | [wdpa.md](wdpa.md) |
| OpenSky Network | Aircraft positions | Licence limited to non-profit research and education | [opensky.md](opensky.md) |
| Blitzortung.org | Lightning everywhere, in near real time | Data reserved to station operators, non-commercial | [blitzortung.md](blitzortung.md) |
| Utrecht University / PBL | HYDE 3.5, 12,000 years of people and land use | Licence not stated where the files are | [hyde.md](hyde.md) |
| TeleGeography | Submarine cables | Geocoded data are sold | [telegeography.md](telegeography.md) |

No letter is needed for GDACS: every GDACS resource carries the notice "European Union (CC BY
4.0), reuse is allowed, provided appropriate credit to GDACS is given", and the cyclone
forecasts are now on the site with that credit.

## The project, in the words every letter uses

Upari (https://upari.earth) is a 3D globe that tells the Earth as it is today: winds, sea,
fires, earthquakes, ice, people, the sky above. It is free, with no ads, no accounts, no
tracking and no paid tier, and it never will have one. Its code is open source under the
Apache License 2.0 (https://github.com/enuzzo/upari). It uses only open data, refreshed
every morning by a public build, and every source is credited on the page that shows it
and in the repository's third-party notices. Data reach the reader only as pictures already
drawn on the globe (images and aggregated grids, never the raw records), so nobody can
download a dataset from Upari. The site carries the name of Netmilk Studio, the small design
studio of its author, as a signature: it sells nothing through Upari and earns nothing from
it.
