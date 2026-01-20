# YouTube Subtitle Enhancer

A Chrome extension that enhances YouTube subtitles with Chinese translations for English learners.

## Features

- 🎯 Automatically downloads YouTube video subtitles
- 📚 Identifies unknown English words based on user's English level
- 🔤 Provides contextual Chinese translations using LLM APIs (OpenAI/Claude)
- ✨ Displays enhanced subtitles with inline translations
- 🧠 Smart lemmatization to recognize word variations (run/runs/running/ran)
- 📝 Vocabulary management with mastered/focus word lists
- 💾 CSV import/export for vocabulary backup and cross-device sync
- 🖱️ Interactive word marking when video is paused

## Tech Stack

- **Framework**: WXT (Modern Chrome Extension Framework)
- **Language**: TypeScript
- **Build Tool**: Vite
- **Testing**: Vitest + Playwright
- **LLM Integration**: DeepSeek (default) / OpenAI GPT-4o-mini / Claude-3.5-haiku
- **Lemmatization**: wink-lemmatizer
- **CSV Processing**: PapaParse

## Quick Start

### Configuration

⚙️ **Configure API Key**: The extension uses LLM APIs for translations. See [Configuration Guide](docs/CONFIGURATION.md) for details.

Quick setup:
```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your DeepSeek API Key
# OPENAI_API_KEY=your_key_here

# The API key will be automatically injected during build
```

**Supported LLM Providers**:
- 🌟 **DeepSeek** (default, recommended) - Cost-effective, OpenAI-compatible
- OpenAI GPT-4o-mini
- Claude-3.5-haiku

📖 **Full configuration guide**: See [docs/CONFIGURATION.md](docs/CONFIGURATION.md)

### Installation

```bash
# Install dependencies
make install
# or
pnpm install
```

### Development

```bash
# Start development server with hot reload
make dev

# Or use pnpm directly
pnpm run dev
```

### Building

```bash
# Build for production
make build

# Build and show loading instructions
make load-chrome
```

### Testing

```bash
# Run all tests
make test

# Run tests in watch mode
make test-watch

# Run tests with coverage
make test-coverage
```

### Common Commands

```bash
make help          # Show all available commands
make info          # Show project information
make size          # Show build output size
make release       # Full release workflow (check + test + build + zip)
```

📖 **Full Makefile documentation**: See [docs/MAKEFILE_USAGE.md](docs/MAKEFILE_USAGE.md)

## Project Status

### ✅ Phase 1: Project Setup (Completed)

- [x] WXT project structure initialized
- [x] All dependencies installed (core + dev dependencies)
- [x] TypeScript configured with strict mode
- [x] Vitest configured with 60% coverage threshold
- [x] Playwright configured for Chrome extension E2E testing
- [x] ESLint + Prettier configured
- [x] Project directory structure created
- [x] WXT manifest configuration (Manifest V3 compliant)
- [x] Test directory structure and setup file with Chrome API mocks
- [x] .gitignore configured

**Build Verification**: ✅ Extension builds successfully with `pnpm run build`

### 📋 Next Steps

- Phase 2: Infrastructure Layer (Data models, storage, word difficulty, i18n)
- Phase 3: User Story 1 - MVP (Basic subtitle enhancement)
- Phase 4: User Story 2 - Configuration UI
- Phase 5: User Story 3 - Vocabulary Management
- Phase 6: User Story 4 - Interactive Marking
- Phase 7: Polish & Release

## Development

### Prerequisites

- Node.js 18+ (recommended: use nvm)
- pnpm (recommended package manager)
- Chrome 88+ for testing

### Installation

```bash
# Install dependencies
pnpm install

# Run development server
pnpm run dev

# Build for production
pnpm run build

# Run tests
pnpm run test

# Run E2E tests (requires build first)
pnpm run build && pnpm run test:e2e

# Check test coverage
pnpm run test:coverage

# Lint code
pnpm run lint

# Format code
pnpm run format
```

### Project Structure

```
LearnEnglishByWebVideo/
├── entrypoints/              # WXT entrypoints
│   ├── background/           # Service Worker
│   ├── content.ts            # Content Script (YouTube injection)
│   └── popup/                # Extension popup
├── src/                      # Source code
│   ├── lib/                  # Shared libraries
│   ├── types/                # TypeScript type definitions
│   └── assets/               # Static assets
│       ├── icons/            # Extension icons
│       ├── dictionaries/     # COCA word frequency data
│       └── _locales/         # i18n messages (en, zh_CN)
├── tests/                    # Test files
│   ├── unit/                 # Unit tests
│   ├── integration/          # Integration tests
│   └── e2e/                  # End-to-end tests
├── specs/                    # Feature specifications
│   └── 001-youtube-subtitle-enhancer/
│       ├── spec.md           # Feature specification
│       ├── plan.md           # Implementation plan
│       ├── tasks.md          # Task breakdown
│       ├── research.md       # Technical research
│       ├── data-model.md     # Data models
│       ├── quickstart.md     # Developer quickstart
│       └── contracts/        # API contracts
└── .output/                  # Build output
```

## Testing

This project follows strict testing requirements:

- **Overall Coverage**: 60% minimum (enforced by Vitest)
- **Core Logic Coverage**: 80% minimum for critical components
  - LLM services
  - Subtitle processing
  - Word identification
  - Lemmatization
- **E2E Testing**: Playwright for real Chrome extension scenarios

Run tests:
```bash
pnpm test              # Run all unit/integration tests
pnpm test:coverage     # Generate coverage report
pnpm test:e2e          # Run end-to-end tests
```

## Code Quality

- **JSDoc Comments**: All functions have detailed JSDoc comments
- **TypeScript**: Strict mode enabled with no implicit any
- **ESLint**: TypeScript-aware linting rules
- **Prettier**: Consistent code formatting
- **Manifest V3**: Full compliance with Chrome Extension standards

## Architecture

### Manifest V3 Compliance

- ✅ Service Worker architecture (no background pages)
- ✅ Minimal permissions (storage, scripting)
- ✅ Host permissions limited to YouTube only
- ✅ Content Security Policy enforced
- ✅ No inline scripts

### Data Flow

```
YouTube Page → Content Script → Service Worker → LLM API
                     ↓                   ↓
              Enhanced Subtitles    chrome.storage.local
```

## License

Copyright (c) 2026 YouTube Subtitle Enhancer Team. All rights reserved.

See [LICENSE](LICENSE) for details.

## Contributing

This project follows the specifications defined in `/specs/001-youtube-subtitle-enhancer/`.

Before contributing:
1. Read the [specification](specs/001-youtube-subtitle-enhancer/spec.md)
2. Check the [implementation plan](specs/001-youtube-subtitle-enhancer/plan.md)
3. Review [tasks.md](specs/001-youtube-subtitle-enhancer/tasks.md) for current status
4. Ensure tests pass and coverage meets requirements

## Support

For issues and feature requests, please refer to the project repository.

---

**Project Status**: 🚧 In Development - Phase 1 Complete  
**Target Release**: MVP available after Phase 3 completion  
**Last Updated**: 2026-01-20
