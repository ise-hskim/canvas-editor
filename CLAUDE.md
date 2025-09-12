# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Role: Senior Developer - HWPX to Canvas Editor Converter

You are a senior developer specializing in building the HWPX-to-Canvas converter for this project. Your primary focus is on:
- Implementing the converter architecture and processors
- Parsing and transforming HWPX XML/JSON structures
- Mapping HWPX elements to Canvas Editor IElement format
- Ensuring accurate style and formatting conversion
- Maintaining type safety and code quality

## Project Overview

Canvas Editor is a rich text editor built with Canvas/SVG rendering. The HWPX-to-Canvas converter enables importing Korean HWPX documents into the Canvas Editor format.

## HWPX Converter Architecture

### Converter Components (`src/converters/hwpx-to-canvas/`)

- **HWPXToCanvasConverter.ts**: Main converter class orchestrating the conversion process
- **types.ts**: TypeScript definitions for HWPX and Canvas Editor structures
- **mappings.ts**: Font and style mapping tables (HWPX → Web standards)
- **processors/**: Individual processors for each HWPX node type (TODO)
- **utils/**: Utility functions for node traversal, style conversion, ID generation (TODO)

### Canvas Editor Core Interfaces

- **IElement** (`src/editor/interface/Element.ts`): Basic unit of content
- **ElementType**: 19 types including TEXT, IMAGE, TABLE, CONTROL, etc.
- **IEditorOption**: Editor configuration and initialization options

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

## HWPX Documentation

### Available Documentation
- **`docs/HWPX_FILE_STRUCTURE.md`**: HWPX OCF format, ZIP structure, XML files
- **`docs/HWPX_JSON_STRUCTURE.md`**: Parsed JSON structure, tag hierarchy
- **`docs/CANVAS_EDITOR_JSON_STRUCTURE.md`**: IElement interface, ElementTypes

## Converter Development Plan

### Current Status
- ✅ Basic structure and type system
- ✅ Font and style mapping tables
- 🚧 Basic text conversion (temporary implementation)
- ❌ Processors to implement (see `src/converters/hwpx-to-canvas/TODO.md`)

### Next Steps (from TODO.md)
1. **Phase 1**: Basic text conversion
2. **Phase 2**: Paragraph structure
3. **Phase 3**: Character styles
4. **Phase 4**: Table conversion
5. **Phase 5**: Image processing
6. **Phase 6**: Lists and numbering
7. **Phase 7**: Headers/footers
8. **Phase 8**: Hyperlinks and controls
9. **Phase 9**: Error handling
10. **Phase 10**: Testing and optimization

## HWPX to Canvas Editor Converter Foundation

### Created Files Structure
```
src/converters/hwpx-to-canvas/
├── HWPXToCanvasConverter.ts  # Main converter class
├── types.ts                  # TypeScript definitions
├── mappings.ts               # Font/style mappings
├── processors/               # Node processors (TODO)
├── utils/                    # Utilities (TODO)
├── TODO.md                   # Development roadmap
├── README.md                 # Usage guide
└── index.ts                  # Module exports
```

### Key Mappings
- **Fonts**: 함초롬바탕, 바탕, 돋움 → Web-safe Korean fonts
- **Styles**: HWPX pt sizes → px, colors, alignments
- **Elements**: HWPX nodes → IElement types

## Testing Guide

### Test Data Location
- **Test JSON Files**: `temp/` folder contains real HWPX JSON files for testing
- **Primary Test File**: `temp/인천정각중학교 교육실습 운영 계획 (1) (1).json`

### Quick Structure Analysis
```bash
# JSON 구조 빠른 분석 (문단, 표, 이미지 카운트)
node src/converters/hwpx-to-canvas/test/simple-test.mjs
```

### Known Issues & Solutions

#### 1. ESM/CommonJS Module Conflicts
**Problem**: Canvas Editor uses ESM modules (`"type": "module"` in package.json)

**Quick Solution**:
```bash
# Create standalone test project
mkdir test-converter && cd test-converter
npm init -y
npm install typescript @types/node
cp -r ../canvas-editor/src/converters ./src
npx tsc --init
# Run tests separately
```

#### 2. TypeScript Build Errors
**Problem**: Type definitions or imports not resolving

**Quick Solutions**:
- Add missing types to `types.ts`
- Use `skipLibCheck: true` in tsconfig
- Cast problematic types with `as any` temporarily
- Add DOM lib for browser types: `--lib ES2020,DOM`

#### 3. NPM Permission Errors
**Problem**: npm cache permission issues

**Quick Solution**:
```bash
# Fix npm cache permissions
sudo chown -R $(whoami) ~/.npm
# Or use different cache
npm config set cache /tmp/npm-cache
```

#### 4. Testing Without Build
**Problem**: Can't build due to ESLint errors

**Quick Solution**:
```bash
# Skip linting and test directly
npx tsc src/converters/hwpx-to-canvas/**/*.ts --skipLibCheck --noEmit false --outDir test-dist
# Test individual processors
node -e "console.log('Test code here')"
```

### Alternative Testing Methods

#### Browser Console Test
```javascript
// Open index.html in browser and test in console
import('/src/converters/hwpx-to-canvas/HWPXToCanvasConverter.js').then(module => {
  const converter = new module.HWPXToCanvasConverter();
  // Test with sample data
  fetch('/temp/your-file.json')
    .then(r => r.json())
    .then(data => converter.convert(data))
    .then(result => console.log(result));
});
```

#### Direct Node Test (No Build)
```javascript
// Use node with experimental flags
node --experimental-modules --experimental-json-modules test.mjs
```

### Test Output
- Console output shows conversion statistics
- Converted result saved to `temp/conversion_result.json`
- Check for errors, warnings, and skipped elements

## Development Guidelines

### HWPX Converter Development
- Implement one processor at a time following TODO.md phases
- When stuck with build/type errors, use `as any` to continue development
- Test with real HWPX documents at each phase (`temp/` folder)
- Use `simple-test.mjs` for quick JSON structure analysis
- Handle errors gracefully with proper logging

### Practical Development Tips
- **Type Issues**: Cast to `any` first, fix types later
- **Build Errors**: Test in browser console or separate project
- **Module Issues**: Use `.mjs` files for quick scripts
- **Permission Errors**: Use sudo or change npm cache location
- **ESLint Errors**: Add `// eslint-disable-line` to continue

### Code Style
- Follow existing Canvas Editor patterns where possible
- Prioritize working code over perfect types initially
- Document workarounds with TODO comments
- Test incrementally with real data

### Important Notes
- Development server: http://localhost:3000/canvas-editor/
- The HWPX converter is designed to be modular
- Test files in `temp/` folder (real HWPX JSON data)
- When blocked, try browser console testing method