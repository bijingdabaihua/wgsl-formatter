# Change Log

All notable changes to the "wgsl-formatter" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2024-01-15

### Added

#### Core Formatting Features
- **Document Formatting**: Format entire WGSL documents with a single command
- **Range Formatting**: Format selected code ranges while preserving surrounding code
- **Format on Save**: Automatic formatting when saving WGSL files (respects `editor.formatOnSave`)

#### Formatting Rules
- **Indentation**: Configurable indentation with support for spaces (default: 4) or tabs
- **Operator Spacing**: Automatic spacing around operators (`+`, `-`, `*`, `/`, `==`, etc.)
- **Comma Spacing**: Consistent spacing after commas in parameter lists and arrays
- **Struct Field Alignment**: Automatic alignment of struct field types for improved readability
- **Blank Line Management**: Preserve logical grouping with normalized blank lines (max 1 consecutive)
- **Trailing Whitespace Removal**: Automatic removal of trailing spaces and tabs
- **Final Newline**: Ensures files end with exactly one newline character

#### Line Wrapping
- **Automatic Line Wrapping**: Smart line wrapping for long lines (configurable, default: 100 characters)
- **Function Signature Wrapping**: Multi-line formatting for long function signatures with proper indentation
- **Expression Wrapping**: Intelligent wrapping of long expressions at operator boundaries
- **Configurable Max Line Length**: Customize the maximum line length threshold

#### Configuration Options
- `wgslFormatter.indentSize`: Set indentation size (default: 4 spaces)
- `wgslFormatter.useTabs`: Use tabs instead of spaces (default: false)
- `wgslFormatter.maxLineLength`: Maximum line length before wrapping (default: 100)
- `wgslFormatter.enableLineWrapping`: Enable/disable automatic line wrapping (default: true)

#### Error Handling
- **Syntax Error Recovery**: Gracefully handles syntax errors and formats valid portions
- **Error Reporting**: Detailed error messages in the Output panel
- **Timeout Protection**: Automatic timeout for long-running operations (2 seconds)
- **Cancellation Support**: Respect VSCode's cancellation tokens for responsive UI

#### Performance
- **Fast Formatting**: Sub-500ms formatting for files under 1000 lines
- **Progress Indicators**: Progress notifications for large files (>5000 lines)
- **Efficient Parsing**: Optimized recursive descent parser with error recovery

#### Platform Support
- **Cross-Platform**: Full support for Windows, macOS, and Linux
- **Line Ending Preservation**: Maintains CRLF (Windows) or LF (Unix) line endings
- **VSCode Compatibility**: Compatible with VSCode 1.75.0 and higher

#### Language Support
- **WGSL File Recognition**: Automatic activation for `.wgsl` files
- **Language Configuration**: Bracket matching, comment toggling, and auto-closing pairs
- **Syntax Structure Support**: Functions, structs, variables, attributes, comments, and expressions

### Technical Details
- Built with TypeScript for type safety and maintainability
- Comprehensive test suite with unit tests and property-based tests using fast-check
- AST-based formatting for accurate code transformation
- Modular architecture with pluggable formatting rules

### Known Limitations
- Very large files (>10,000 lines) may experience slower formatting
- Complex nested expressions may not always wrap at optimal points
- Some edge cases in WGSL syntax may not be fully supported

---

## Future Releases

### Planned Features
- Custom formatting profiles
- Additional formatting rules (e.g., brace style options)
- Improved expression wrapping heuristics
- Support for WGSL language server integration
- Configuration presets for common coding styles
