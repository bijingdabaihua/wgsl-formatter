# Project Structure

```
wgsl-formatter/
├── .github/
│   └── workflows/          # GitHub Actions CI/CD
│       ├── ci.yml          # Continuous Integration
│       ├── release.yml     # Release automation
│       └── publish.yml     # Marketplace publishing
├── scripts/
│   ├── release.sh          # Release script (Unix)
│   └── release.ps1         # Release script (Windows)
├── src/
│   ├── rules/              # Formatting rules
│   │   ├── alignment.ts    # Struct field alignment
│   │   ├── blankline.ts    # Blank line management
│   │   ├── finalnewline.ts # Final newline handling
│   │   ├── indentation.ts  # Indentation rules
│   │   ├── linewrapping.ts # Line wrapping logic
│   │   ├── spacing.ts      # Operator spacing
│   │   └── trailingwhitespace.ts # Whitespace cleanup
│   ├── ast.ts              # Abstract Syntax Tree definitions
│   ├── config.ts           # Configuration management
│   ├── errors.ts           # Error handling
│   ├── extension.ts        # VSCode extension entry point
│   ├── formatter.ts        # Main formatter logic
│   ├── parser.ts           # WGSL parser
│   ├── provider.ts         # VSCode formatting provider
│   └── tokenizer.ts        # WGSL tokenizer
├── tests/
│   ├── fixtures/           # Test fixtures
│   │   ├── valid/          # Valid WGSL files
│   │   └── invalid/        # Invalid WGSL files
│   ├── integration/        # Integration tests
│   ├── property/           # Property-based tests
│   ├── unit/               # Unit tests
│   └── README.md           # Testing documentation
├── .eslintrc.json          # ESLint configuration
├── .gitignore              # Git ignore rules
├── .prettierrc.json        # Prettier configuration
├── .vscodeignore           # VSCode packaging ignore
├── CHANGELOG.md            # Version history
├── CONTRIBUTING.md         # Contribution guidelines
├── esbuild.config.js       # Build configuration
├── language-configuration.json # WGSL language config
├── LICENSE                 # MIT License
├── package.json            # NPM package configuration
├── README.md               # Project documentation
├── tsconfig.json           # TypeScript configuration
└── vitest.config.ts        # Test configuration
```

## Key Directories

### `src/`
Contains all source code for the extension:
- **rules/**: Individual formatting rules (modular design)
- **Core files**: Tokenizer, parser, formatter, and VSCode integration

### `tests/`
Comprehensive test suite:
- **unit/**: Unit tests for individual components
- **integration/**: End-to-end tests
- **property/**: Property-based tests for correctness
- **fixtures/**: Sample WGSL files for testing

### `.github/workflows/`
Automated CI/CD pipelines:
- **ci.yml**: Runs tests on every push/PR
- **release.yml**: Creates GitHub releases
- **publish.yml**: Publishes to VSCode Marketplace

## Build Artifacts

The following are generated during build (not in git):
- `dist/` - Compiled JavaScript output
- `node_modules/` - NPM dependencies
- `*.vsix` - Extension package files
- `coverage/` - Test coverage reports

## Configuration Files

- **package.json**: Extension metadata, dependencies, and scripts
- **tsconfig.json**: TypeScript compiler options
- **esbuild.config.js**: Production build configuration
- **vitest.config.ts**: Test runner configuration
- **.eslintrc.json**: Code linting rules
- **.prettierrc.json**: Code formatting rules
