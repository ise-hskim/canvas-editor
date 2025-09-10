# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Canvas Editor is a rich text editor built with Canvas/SVG rendering. It's a TypeScript library that provides comprehensive text editing capabilities with support for tables, images, controls, and various formatting options.

## Core Architecture

### Main Components

- **Editor Core** (`src/editor/core/`): The heart of the editor containing drawing, event handling, and command execution
  - `Draw` class: Main rendering engine that handles canvas drawing operations
  - `Command` class: Command pattern implementation for all editor operations
  - `CanvasEvent` & `GlobalEvent`: Event handling system for user interactions
  - `HistoryManager`: Manages undo/redo operations
  
- **Element System** (`src/editor/interface/Element.ts`): Elements are the basic units of content (text, images, tables, etc.)

- **Particle System** (`src/editor/core/draw/particle/`): Specialized rendering for different element types (text, image, table, latex, etc.)

- **Control System** (`src/editor/core/draw/control/`): Form controls like text inputs, checkboxes, date pickers

- **Plugin Architecture** (`src/editor/core/plugin/`): Extensible plugin system for adding custom functionality

### Key Design Patterns

- **Command Pattern**: All editor operations go through the Command class for consistency and undo/redo support
- **Observer Pattern**: Used for event handling and state updates
- **Particle Rendering**: Each element type has its own particle renderer for specialized drawing logic

## Development Commands

```bash
# Install dependencies
yarn

# Start development server
npm run dev

# Build library for distribution
npm run lib

# Build demo application
npm run build

# Run linting
npm run lint

# Type checking
npm run type:check

# Run Cypress E2E tests
npm run cypress:open  # Interactive mode
npm run cypress:run   # Headless mode

# Documentation development
npm run docs:dev
npm run docs:build
```

## Git Commit Convention

This project enforces conventional commits with the following format:
`type(scope): description`

Valid types: `feat`, `fix`, `docs`, `dx`, `style`, `refactor`, `perf`, `test`, `workflow`, `build`, `ci`, `chore`, `types`, `wip`, `release`, `improve`

Examples:
- `feat: add page header`
- `fix: IME position error #155`

## Testing

The project uses Cypress for E2E testing. Test files are located in `cypress/e2e/`.

## Important Considerations

- The editor uses Canvas API for rendering, so performance considerations are crucial
- Element formatting and positioning calculations are complex - changes to Draw class should be carefully tested
- The project supports multiple rendering modes (Canvas and SVG - under development)
- Git hooks run linting and type checking before commits