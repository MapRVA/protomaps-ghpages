# Protomaps Github Pages

> [!CAUTION]
> Due to a regression in Github Pages, the output of this repo does not work on firefox. See here for more info: https://github.com/bdon/ghpages-firefox-range-bug

This repo contains scripts and Github Actions configuration to create a Protomaps extract for the
area defined in `region.geojson` and styles to go along with it.

This allows you to very easily host your own basemap for a small to medium sized area with Github
Pages.

The default region is the state of Virginia in the United State of America.

To create your own Github Pages hosted basemap:

- Fork this repository
- Configure Github Pages to use Github Actions
- Enable Github Actions on your fork
- Replace `region.geojson` with the region of your choice
- Push your updated region
