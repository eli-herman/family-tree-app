# The Vine

![CI](https://github.com/eli-herman/family-tree-app/actions/workflows/ci.yml/badge.svg)
![Secret scanning](https://img.shields.io/badge/secret%20scanning-enabled-brightgreen)

> "I am the vine; you are the branches." - John 15:5

The Vine is a private Christian family connection app focused on strengthening
relationships across generations. It emphasizes warmth, simplicity, and
meaningful moments rather than social media metrics.

## Highlights

- Family Tree with clean, vine-like connectors
- Family Updates Feed for photos and milestones
- Daily Bible Verse focused on family, unity, and love
- Story Prompts to inspire memory sharing
- Simple, respectful design system grounded in natural colors

## Tech Stack

- React Native (Expo)
- TypeScript
- Firebase (Auth + Firestore + Storage)
- Zustand for state management

## Architecture Snapshot

- Family relationships are derived from canonical family units stored in
  Firestore. Each unit has partner IDs and typed child links with relation
  types (biological, adopted, step, guardian).
- UI reads derived relationships, keeping member docs clean and consistent.

## Getting Started

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and fill Firebase keys
3. Run the app: `npm start`

## Scripts

- `npm start` - Start the Expo dev server
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator
- `npm run web` - Run on web
- `npm run lint` - Lint the codebase
- `npm run format` - Format files with Prettier
- `npm run test` - Run tests
- `npm run typecheck` - Type-check with `tsc`

## Project Structure

- `app/` - Expo Router screens
- `src/components/` - UI components
- `src/stores/` - Zustand stores
- `src/types/` - Shared TypeScript types
- `src/utils/` - Utilities (relationships, verses, mock data)

## Contributing

See `CONTRIBUTING.md` for guidelines.

## Security

Secret scanning is enabled in GitHub settings (Repository Settings → Security & analysis).

## License

MIT - see `LICENSE` for details.
