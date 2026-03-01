# Packaging Notes

## Package Information

- **Package Name**: wgsl-formatter-0.1.0.vsix
- **Package Size**: ~16 KB (highly optimized)
- **Build Output**: dist/extension.js (30.8 KB before compression)

## Build Process

### Development Build
```bash
npm run build
```

### Watch Mode (for development)
```bash
npm run watch
```

### Create Package
```bash
npm run package
```

This will:
1. Clean previous builds
2. Run TypeScript type checking
3. Build with esbuild (optimized, minified)
4. Create .vsix package file

## Package Contents

The final .vsix package includes only:
- `dist/extension.js` - Bundled and minified extension code
- `README.md` - User documentation
- `CHANGELOG.md` - Version history
- `LICENSE.txt` - MIT license
- `package.json` - Extension manifest
- `language-configuration.json` - WGSL language configuration

## Excluded from Package

The following are excluded via `.vscodeignore`:
- Source files (`src/**`)
- Tests (`tests/**`)
- Development configs (`.eslintrc.json`, `tsconfig.json`, etc.)
- Node modules
- Build tools
- Coverage reports
- Git files

## Bundle Analysis

The extension code is distributed as follows:
- Parser: 28.6% (8.8 KB)
- Formatter: 21.0% (6.5 KB)
- Tokenizer: 13.1% (4.0 KB)
- Provider: 11.4% (3.5 KB)
- Line Wrapping: 6.8% (2.1 KB)
- Error Handling: 5.9% (1.8 KB)
- Other rules: ~10%

## Publishing

### Test Locally
```bash
code --install-extension wgsl-formatter-0.1.0.vsix
```

### Publish to Marketplace
```bash
npm run publish
```

Note: Requires publisher account and personal access token.

## Optimization Features

- **Tree Shaking**: Removes unused code
- **Minification**: Reduces code size
- **No Source Maps in Production**: Smaller package
- **Console/Debugger Removal**: Production builds drop console statements
- **External VSCode API**: VSCode API not bundled (provided by host)

## Performance Metrics

- Build time: ~10ms
- Package size: 16 KB
- Startup time: <100ms
- Format time (1000 lines): <500ms
