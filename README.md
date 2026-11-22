# LUNTIAN 2.5D

**Explore urban green cover and heat resilience in an interactive 2.5D map.**

[Open the live app](https://gonzalestrisha.github.io/luntian-ph-canopy-index/)

LUNTIAN lets you inspect a 600 m × 600 m neighborhood, explore selected sites across Metro Manila and Singapore, and see how green areas, built volume, and simulated El Niño drought stress shape a neighborhood-level resilience estimate. You can plant virtual pocket parks and compare results with policy and public-health benchmarks.

The map uses a blueprint-inspired visual style. Move the map to inspect another block, select a city preset to jump to a site, and open the telemetry panel for the current estimate. The drought controls simulate reduced canopy cooling. Pocket parks are temporary additions in the current session.

## About the estimates

Measurements are calculated in the browser from rendered OpenFreeMap map features. They are neighborhood-level estimates for exploration, not official inventories, site surveys, or planning determinations. Map coverage and rendering affect the values. The El Niño control is a scenario for comparing relative effects, not a forecast.

## Run locally

Install dependencies and start the Vite development server:

```sh
pnpm install
pnpm dev
```

Run tests and create a production build with:

```sh
pnpm test
pnpm build
```

The app uses React, MapLibre GL, Turf.js, and OpenFreeMap vector tiles. It has no backend or application API key requirement.

## Deployment

The public app is hosted on GitHub Pages at [gonzalestrisha.github.io/luntian-ph-canopy-index](https://gonzalestrisha.github.io/luntian-ph-canopy-index/). The GitHub Actions workflow builds the Vite app with the project-page base path and deploys the `dist/` output.
