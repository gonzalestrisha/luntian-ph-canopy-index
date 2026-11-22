# Repository Guidelines

## Project Structure & Module Organization

This is a React 18 single-page app built with Vite. Application code lives in `src/`: `components/` contains the map, telemetry panel, controls, and explainer; `constants/` holds city presets and policy thresholds; `utils/` contains spatial, color, and location calculations; and `test/` contains Vitest tests. `src/App.jsx` coordinates shared state. Root files configure Vite, Tailwind, and PostCSS. Static public files belong in `public/` if added; imported assets can live beside the component that uses them.

## Build, Test, and Development Commands

Use pnpm, matching `pnpm-lock.yaml`:

- `pnpm install` installs dependencies.
- `pnpm dev` starts the local Vite server.
- `pnpm test` runs the Vitest suite once; `pnpm test:watch` runs it interactively.
- `pnpm build` creates the production bundle in `dist/`.
- `pnpm preview` serves the production build locally for a deployment check.

For GitHub Pages project hosting, set `VITE_BASE_PATH` to the repository path, for example `/luntian-ph-canopy-index/`; `vite.config.js` uses this variable as Vite's base path.

## Coding Style & Naming Conventions

Use JavaScript/JSX with ES modules and two-space indentation, matching existing files. Name React components in PascalCase (`MapMaquette.jsx`), utilities and hooks in camelCase, and constants in uppercase or descriptive camelCase exports. Keep data and policy values in `src/constants/`, spatial operations in `src/utils/spatial.js`, and presentational UI in components. Use Tailwind utilities for component layout and `src/index.css` for shared visual tokens and global styles. No formatter or linter is currently configured.

## Testing Guidelines

Tests use Vitest, jsdom, and React Testing Library. Add or update tests under `src/test/` with the `*.test.js` or `*.test.jsx` suffix. Cover calculations in unit tests and user-visible interactions in component tests. Run `pnpm test` and `pnpm build` before submitting changes that affect behavior or rendering.

## Commit & Pull Request Guidelines

Never commit directly to `main`. Create or switch to a topic branch before making changes, verify the current branch before committing, and merge changes into `main` through a pull request.

Prefer short imperative commit subjects, using the repository's conventional prefixes where appropriate, such as `feat:`, `fix:`, `style:`, and `docs:`. Keep commits focused by category. Pull requests should explain the user-visible change, note relevant tests/build results, link related issues when available, and include screenshots for visual changes. Call out configuration changes needed for GitHub Pages deployment.

## Architecture & Configuration Notes

The map is rendered with MapLibre GL and OpenFreeMap vector tiles; Turf.js provides client-side spatial calculations. Keep map layer and interaction changes in `MapMaquette.jsx`, and preserve the existing React prop/state boundaries unless a feature requires a documented interface change. Never commit API secrets; current map tiles do not require an API key.
