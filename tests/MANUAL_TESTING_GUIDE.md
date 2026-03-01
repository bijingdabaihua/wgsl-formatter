# Manual Testing Guide

**Purpose**: This guide provides step-by-step instructions for manually testing the WGSL Formatter VSCode Extension to verify all functionality works correctly in a real VSCode environment.

**Prerequisites**:
- VSCode 1.75.0 or higher installed
- Extension built and ready to test (`npm run build`)

## Setup

### 1. Install the Extension for Testing

```bash
# Build the extension
npm run build

# The extension is now ready in the dist/ folder
# To test in VSCode, you can:
# Option A: Press F5 in VSCode to launch Extension Development Host
# Option B: Package and install: vsce package && code --install-extension wgsl-formatter-0.1.0.vsix
```

### 2. Create Test Files

Create a folder `test-workspace/` with the following WGSL files:

**File: `test-workspace/simple.wgsl`**
```wgsl
fn main(){return;}
```

**File: `test-workspace/complex.wgsl`**
```wgsl
struct Vertex{position:vec3<f32>,normal:vec3<f32>,uv:vec2<f32>,}
fn processVertex(v:Vertex)->vec3<f32>{var result:vec3<f32>=v.position+v.normal;return result;}
fn main(){var x:f32=1.0+2.0*3.0;return;}
```

**File: `test-workspace/with-errors.wgsl`**
```wgsl
fn main( { invalid syntax }
```

**File: `test-workspace/large.wgsl`**
```wgsl
// Generate a file with 6000+ lines for performance testing
fn func0() { return; }
fn func1() { return; }
// ... (repeat for 6000 functions)
```

## Test Cases

### Test 1: Extension Activation
**Validates**: Requirements 1.1, 1.2

**Steps**:
1. Open VSCode
2. Open the `test-workspace/` folder
3. Open `simple.wgsl`
4. Check the Output panel (View → Output)
5. Select "WGSL Formatter" from the dropdown

**Expected Results**:
- ✅ Extension activates automatically when opening .wgsl file
- ✅ Output panel shows: "WGSL Formatter extension is now active"
- ✅ No error messages in the output

**Status**: [ ] Pass [ ] Fail

---

### Test 2: Basic Document Formatting
**Validates**: Requirements 3.1, 4.1-4.7

**Steps**:
1. Open `simple.wgsl`
2. Press `Shift+Alt+F` (Windows/Linux) or `Shift+Option+F` (Mac)
3. Or right-click → "Format Document"

**Expected Results**:
- ✅ Code is formatted with proper indentation
- ✅ Spaces added around operators
- ✅ File ends with a newline
- ✅ No trailing whitespace

**Before**:
```wgsl
fn main(){return;}
```

**After**:
```wgsl
fn main() {
    return;
}
```

**Status**: [ ] Pass [ ] Fail

---

### Test 3: Complex Code Formatting
**Validates**: Requirements 3.2, 4.2, 4.3, 4.4

**Steps**:
1. Open `complex.wgsl`
2. Format the document (`Shift+Alt+F`)

**Expected Results**:
- ✅ Struct fields are aligned
- ✅ Spaces around operators (`+`, `*`, `=`)
- ✅ Spaces after commas
- ✅ Proper indentation (4 spaces by default)
- ✅ Blank lines preserved between declarations

**Before**:
```wgsl
struct Vertex{position:vec3<f32>,normal:vec3<f32>,uv:vec2<f32>,}
fn processVertex(v:Vertex)->vec3<f32>{var result:vec3<f32>=v.position+v.normal;return result;}
```

**After**:
```wgsl
struct Vertex {
    position: vec3<f32>,
    normal:   vec3<f32>,
    uv:       vec2<f32>,
}

fn processVertex(v: Vertex) -> vec3<f32> {
    var result: vec3<f32> = v.position + v.normal;
    return result;
}
```

**Status**: [ ] Pass [ ] Fail

---

### Test 4: Range Formatting
**Validates**: Requirements 5.1, 5.2, 5.3

**Steps**:
1. Open `complex.wgsl`
2. Select only the `processVertex` function (lines 2-3)
3. Right-click → "Format Selection"
4. Or press `Ctrl+K Ctrl+F` (Windows/Linux) or `Cmd+K Cmd+F` (Mac)

**Expected Results**:
- ✅ Only the selected function is formatted
- ✅ Other code remains unchanged
- ✅ If selection is incomplete (e.g., only inside function), range expands to complete function

**Status**: [ ] Pass [ ] Fail

---

### Test 5: Configuration - Indent Size
**Validates**: Requirements 9.1, 9.3

**Steps**:
1. Open VSCode Settings (File → Preferences → Settings)
2. Search for "wgslFormatter.indentSize"
3. Change value to `2`
4. Open `simple.wgsl`
5. Format the document

**Expected Results**:
- ✅ Code is indented with 2 spaces instead of 4
- ✅ Configuration change takes effect immediately

**After (with indentSize: 2)**:
```wgsl
fn main() {
  return;
}
```

**Status**: [ ] Pass [ ] Fail

---

### Test 6: Configuration - Use Tabs
**Validates**: Requirements 9.2, 9.3

**Steps**:
1. Open VSCode Settings
2. Search for "wgslFormatter.useTabs"
3. Enable the checkbox (set to `true`)
4. Open `simple.wgsl`
5. Format the document

**Expected Results**:
- ✅ Code is indented with tabs instead of spaces
- ✅ Configuration change takes effect immediately

**Status**: [ ] Pass [ ] Fail

---

### Test 7: Format on Save
**Validates**: Requirements 6.1, 6.2

**Steps**:
1. Open VSCode Settings
2. Search for "editor.formatOnSave"
3. Enable the checkbox
4. Open `simple.wgsl` and make it unformatted: `fn main(){return;}`
5. Save the file (`Ctrl+S` or `Cmd+S`)

**Expected Results**:
- ✅ File is automatically formatted on save
- ✅ No manual format command needed

**Status**: [ ] Pass [ ] Fail

---

### Test 8: Error Handling - Syntax Errors
**Validates**: Requirements 3.4, 7.1, 7.4

**Steps**:
1. Open `with-errors.wgsl`
2. Try to format the document (`Shift+Alt+F`)
3. Check the Output panel

**Expected Results**:
- ✅ Error message appears in Output panel
- ✅ Error message includes details about the syntax error
- ✅ Original file content is preserved (not corrupted)
- ✅ User-friendly notification appears

**Status**: [ ] Pass [ ] Fail

---

### Test 9: Error Handling - Format on Save with Errors
**Validates**: Requirement 6.3

**Steps**:
1. Ensure "editor.formatOnSave" is enabled
2. Open `with-errors.wgsl`
3. Make a small edit (add a space)
4. Save the file (`Ctrl+S`)

**Expected Results**:
- ✅ File saves successfully (not blocked by formatting error)
- ✅ Warning message appears (not error)
- ✅ Output panel shows warning about formatting failure
- ✅ Original content is preserved

**Status**: [ ] Pass [ ] Fail

---

### Test 10: Performance - Large Files
**Validates**: Requirements 8.1, 8.2, 8.3

**Steps**:
1. Open `large.wgsl` (6000+ lines)
2. Format the document (`Shift+Alt+F`)
3. Observe the formatting time and progress indication

**Expected Results**:
- ✅ Progress notification appears ("Formatting WGSL file...")
- ✅ Formatting completes within reasonable time (< 2 seconds)
- ✅ No timeout errors
- ✅ No memory issues

**Status**: [ ] Pass [ ] Fail

---

### Test 11: Performance - Small Files
**Validates**: Requirement 8.1

**Steps**:
1. Open `simple.wgsl` (< 10 lines)
2. Format the document (`Shift+Alt+F`)
3. Observe the formatting time

**Expected Results**:
- ✅ Formatting completes almost instantly (< 500ms)
- ✅ No progress notification (file is too small)
- ✅ No noticeable delay

**Status**: [ ] Pass [ ] Fail

---

### Test 12: Cross-Platform - Newline Handling (Windows)
**Validates**: Requirement 10.5

**Steps** (Windows only):
1. Create a new file `newline-test.wgsl` with CRLF line endings
2. Add content: `fn main() {\r\n    return;\r\n}`
3. Format the document
4. Check line endings (use a hex editor or VSCode's "Change End of Line Sequence")

**Expected Results**:
- ✅ Line endings remain CRLF after formatting
- ✅ No conversion to LF

**Status**: [ ] Pass [ ] Fail [ ] N/A (not on Windows)

---

### Test 13: Cross-Platform - Newline Handling (Unix/Mac)
**Validates**: Requirement 10.5

**Steps** (Unix/Mac only):
1. Create a new file `newline-test.wgsl` with LF line endings
2. Add content: `fn main() {\n    return;\n}`
3. Format the document
4. Check line endings

**Expected Results**:
- ✅ Line endings remain LF after formatting
- ✅ No conversion to CRLF

**Status**: [ ] Pass [ ] Fail [ ] N/A (not on Unix/Mac)

---

### Test 14: Cancellation
**Validates**: Requirement 7.3

**Steps**:
1. Open `large.wgsl` (6000+ lines)
2. Start formatting (`Shift+Alt+F`)
3. Immediately click "Cancel" on the progress notification

**Expected Results**:
- ✅ Formatting operation is cancelled
- ✅ No changes are applied to the file
- ✅ No error messages

**Status**: [ ] Pass [ ] Fail

---

### Test 15: Multiple Files
**Validates**: General functionality

**Steps**:
1. Open multiple .wgsl files in tabs
2. Format each file individually
3. Switch between tabs and format again

**Expected Results**:
- ✅ Each file formats correctly
- ✅ No interference between files
- ✅ Configuration applies consistently

**Status**: [ ] Pass [ ] Fail

---

### Test 16: Idempotence
**Validates**: Formatting consistency

**Steps**:
1. Open `complex.wgsl`
2. Format the document (`Shift+Alt+F`)
3. Format again immediately
4. Compare results

**Expected Results**:
- ✅ Second format produces identical output
- ✅ No changes after second format
- ✅ Formatting is stable and consistent

**Status**: [ ] Pass [ ] Fail

---

### Test 17: Extension Deactivation
**Validates**: Requirement 1.1

**Steps**:
1. Close all .wgsl files
2. Disable the extension (Extensions → WGSL Formatter → Disable)
3. Check the Output panel

**Expected Results**:
- ✅ Extension deactivates cleanly
- ✅ Output panel shows: "WGSL Formatter extension is now deactivated"
- ✅ No error messages

**Status**: [ ] Pass [ ] Fail

---

## Test Summary

**Total Tests**: 17
**Passed**: ___
**Failed**: ___
**N/A**: ___

**Overall Status**: [ ] All tests passed [ ] Some tests failed

## Notes

Use this section to record any observations, issues, or unexpected behavior:

```
[Add notes here]
```

## Recommendations

Based on manual testing results:

1. **If all tests pass**: Extension is ready for release
2. **If minor issues found**: Document as known issues and plan fixes
3. **If major issues found**: Fix critical bugs before release

## Conclusion

Manual testing verifies that the extension works correctly in a real VSCode environment and meets all functional requirements. Combined with the automated test suite (126 tests), this provides strong confidence in the extension's quality and reliability.

---

**Tester**: _______________
**Date**: _______________
**VSCode Version**: _______________
**OS**: _______________
**Extension Version**: 0.1.0
