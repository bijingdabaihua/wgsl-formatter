# WGSL Formatter

A Visual Studio Code extension that provides intelligent code formatting for WebGPU Shading Language (WGSL) files. Keep your shader code clean, consistent, and readable with automatic formatting that follows best practices.

## Features

- **Automatic Code Formatting**: Format entire documents or selected ranges with a single command
- **Format on Save**: Automatically format your WGSL files when you save them
- **Smart Indentation**: Configurable indentation with support for spaces or tabs
- **Operator Spacing**: Consistent spacing around operators and after commas
- **Struct Field Alignment**: Automatically align struct field types for better readability
- **Line Length Control**: Automatic line wrapping for long function signatures and expressions
- **Blank Line Management**: Preserve logical grouping with normalized blank lines
- **Trailing Whitespace Removal**: Clean up unnecessary whitespace at line ends
- **Error Recovery**: Gracefully handles syntax errors and formats valid portions
- **Cross-Platform**: Works seamlessly on Windows, macOS, and Linux
- **Fast Performance**: Formats files under 1000 lines in less than 500ms

## Installation

1. Open Visual Studio Code
2. Press `Ctrl+P` (Windows/Linux) or `Cmd+P` (macOS) to open Quick Open
3. Type `ext install wgsl-formatter` and press Enter
4. Reload VSCode when prompted

Alternatively, search for "WGSL Formatter" in the Extensions view (`Ctrl+Shift+X` or `Cmd+Shift+X`).

## Usage

### Format Entire Document

1. Open a `.wgsl` file in VSCode
2. Use the format document command:
   - Windows/Linux: `Shift+Alt+F`
   - macOS: `Shift+Option+F`
   - Or right-click and select "Format Document"

### Format Selection

1. Select the code you want to format
2. Use the format selection command:
   - Windows/Linux: `Ctrl+K Ctrl+F`
   - macOS: `Cmd+K Cmd+F`
   - Or right-click and select "Format Selection"

### Format on Save

Enable automatic formatting when you save files by adding this to your VSCode settings:

```json
{
  "editor.formatOnSave": true,
  "[wgsl]": {
    "editor.defaultFormatter": "wgsl-formatter.wgsl-formatter"
  }
}
```

## Configuration

This extension provides the following configuration options. Access them through VSCode settings (`File > Preferences > Settings` or `Ctrl+,`).

### `wgslFormatter.indentSize`

- **Type**: `number`
- **Default**: `4`
- **Description**: Number of spaces used for each indentation level

Example:
```json
{
  "wgslFormatter.indentSize": 2
}
```

### `wgslFormatter.useTabs`

- **Type**: `boolean`
- **Default**: `false`
- **Description**: Use tabs instead of spaces for indentation

Example:
```json
{
  "wgslFormatter.useTabs": true
}
```

### `wgslFormatter.maxLineLength`

- **Type**: `number`
- **Default**: `100`
- **Description**: Maximum line length before automatic line wrapping is applied

Example:
```json
{
  "wgslFormatter.maxLineLength": 120
}
```

### `wgslFormatter.enableLineWrapping`

- **Type**: `boolean`
- **Default**: `true`
- **Description**: Enable automatic line wrapping for long lines (function signatures, expressions)

Example:
```json
{
  "wgslFormatter.enableLineWrapping": false
}
```

### Inherited VSCode Settings

The formatter also respects these standard VSCode editor settings:

- `editor.insertFinalNewline`: Ensures files end with a newline
- `editor.trimTrailingWhitespace`: Removes trailing whitespace from lines

## Formatting Examples

### Before Formatting

```wgsl
fn computeShading(position:vec3<f32>,normal:vec3<f32>,lightDir:vec3<f32>,viewDir:vec3<f32>)->vec3<f32>{
let diffuse=max(dot(normal,lightDir),0.0);
let specular=pow(max(dot(reflect(-lightDir,normal),viewDir),0.0),32.0);
return diffuse+specular;
}

struct VertexOutput{
@builtin(position) position:vec4<f32>,
@location(0) color:vec3<f32>,
}
```

### After Formatting

```wgsl
fn computeShading(
    position: vec3<f32>,
    normal: vec3<f32>,
    lightDir: vec3<f32>,
    viewDir: vec3<f32>
) -> vec3<f32>
{
    let diffuse = max(dot(normal, lightDir), 0.0);
    let specular = pow(max(dot(reflect(-lightDir, normal), viewDir), 0.0), 32.0);
    return diffuse + specular;
}

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0)       color:    vec3<f32>,
}
```

## Requirements

- Visual Studio Code version 1.75.0 or higher
- No additional dependencies required

## Known Issues

- Very large files (>10,000 lines) may experience slower formatting times
- Complex nested expressions may not always wrap at the most optimal points

## Troubleshooting

### Formatter Not Working

1. Ensure the file has a `.wgsl` extension
2. Check that no other formatter is set as default for WGSL files
3. Look for error messages in the Output panel (View > Output, select "WGSL Formatter")

### Formatting Errors

If you encounter formatting errors:

1. Check the Output panel for detailed error messages
2. Verify your WGSL syntax is valid
3. Try formatting a smaller section to isolate the issue

### Performance Issues

For large files:

1. Consider disabling line wrapping for better performance
2. Format specific sections instead of the entire document
3. Check the Output panel for timeout warnings

## Development

### Setup

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/wgsl-formatter.git
cd wgsl-formatter

# Install dependencies
npm install

# Run tests
npm test

# Build extension
npm run build

# Watch mode for development
npm run watch
```

### Testing Locally

```bash
# Package the extension
npm run package

# Install in VSCode
code --install-extension wgsl-formatter-0.1.0.vsix
```

## Contributing

Found a bug or have a feature request? Please open an issue on our [GitHub repository](https://github.com/wgsl-formatter/wgsl-formatter).

### Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Publishing

See [QUICK_START_PUBLISHING.md](QUICK_START_PUBLISHING.md) for quick publishing guide or [PUBLISHING_GUIDE.md](PUBLISHING_GUIDE.md) for detailed instructions.

## Release Notes

See [CHANGELOG.md](CHANGELOG.md) for detailed release notes.

## License

MIT License - see LICENSE file for details

---

**Enjoy cleaner WGSL code!** 🚀
