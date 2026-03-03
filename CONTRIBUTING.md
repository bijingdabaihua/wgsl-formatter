# Contributing to WGSL Formatter

Thank you for your interest in contributing to WGSL Formatter!

## Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/bijingdabaihua/wgsl-formatter.git
   cd wgsl-formatter
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the extension**
   ```bash
   npm run build
   ```

4. **Run tests**
   ```bash
   npm test
   ```

## Development Workflow

### Running in Development Mode

1. Open the project in VSCode
2. Press `F5` to start debugging
3. A new VSCode window will open with the extension loaded
4. Test your changes in the new window

### Making Changes

1. Create a new branch for your feature/fix
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes in the `src/` directory

3. Run tests to ensure everything works
   ```bash
   npm test
   npm run lint
   ```

4. Build and test the extension
   ```bash
   npm run build
   npm run package
   ```

### Code Style

- Follow the existing code style
- Run `npm run lint` to check for issues
- Run `npm run format` to auto-format code
- Ensure all tests pass before submitting

## Testing

### Unit Tests
```bash
npm test
```

### Test Coverage
```bash
npm run test:coverage
```

### Manual Testing
1. Build the extension: `npm run package`
2. Install in VSCode: `code --install-extension wgsl-formatter-*.vsix`
3. Test with WGSL files

## Submitting Changes

1. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

2. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

3. **Create a Pull Request**
   - Go to the GitHub repository
   - Click "New Pull Request"
   - Describe your changes clearly

## Commit Message Guidelines

Follow conventional commits format:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `test:` - Test changes
- `refactor:` - Code refactoring
- `chore:` - Build/tooling changes

Example: `feat: add support for nested struct formatting`

## Reporting Issues

When reporting issues, please include:
- VSCode version
- Extension version
- Sample WGSL code that causes the issue
- Expected vs actual behavior

## Questions?

Feel free to open an issue for any questions or discussions!
