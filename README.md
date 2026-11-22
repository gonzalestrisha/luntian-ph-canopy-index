# LUNTIAN 2.5D

An interactive urban canopy and heat resilience explorer. Inspect a 600 m neighborhood in a blueprint-style 2.5D map, compare green cover with Philippine and international benchmarks, and simulate El Niño drought stress.

<img width="1920" height="1023" alt="image" src="https://github.com/user-attachments/assets/db1ec3bc-9b91-42c7-9536-d415526d9983" />



## Run locally

```sh
pnpm install
pnpm dev
```

Build for production with `pnpm build`. The app uses React, MapLibre GL, and OpenFreeMap vector tiles; no backend or API key is required.

## Deploy

The app is a static Vite site and can be hosted on GitHub Pages. Set Vite's `base` to the repository path for project pages, then publish the generated `dist/` directory using GitHub Actions.
