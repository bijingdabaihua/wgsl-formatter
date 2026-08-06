# WGSL Formatter — 协作开发流程

> 适用场景：在 **Prism 工程** 中使用 WGSL Formatter 格式化时遇到问题，按此流程处理。

---

## 问题触发方式

用户只需提供：
- **Prism 工程中问题 WGSL 文件的相对路径**（例：`src/components/renderer/raytrace/path_trace/bvh.wgsl`）
- 简短的问题描述（格式化报错 / 输出不对等）

---

## 自动执行流程（无需用户额外操作）

### Step 1 — 复制为测试用例
从 Prism 工程读取该文件，复制到 `tests/prism/` 下作为测试输入。

### Step 2 — 生成期望输出（.out 文件）
根据 `SPEC.md` 规范，手动推导该文件格式化后的正确输出，生成对应的 `.out.wgsl` 文件。

### Step 3 — 问题分类（三选一）
对比实际输出与期望输出，判断问题性质：

| 情形 | 判定 | 处理方式 |
|------|------|----------|
(a) | `SPEC.md` 对该语法无描述 | **规范不完全** → 告知用户，并询问是否补充规范 |
(b) | 实际输出与 `SPEC.md` 要求矛盾 | **Bug** → 直接进入 Step 4 修复 |
(c) | 实际输出与 `SPEC.md` 一致，但用户觉得不美观 | **规范行为** → 告知用户，询问是否修改规范 |

### Step 4 — 修复（仅对 Bug）
- 修改 `src/parser.ts`、`src/formatter.ts`、`src/ast.ts` 等源文件
- 添加/更新 `tests/*.in.wgsl` + `tests/*.out.wgsl` 配对测试
- 运行全量测试：`npm test`（含 `tests/prism.test.ts` 批量测试）
- 全部通过 → 进入 Step 5

### Step 5 — 构建版本
- 按版本号规则更新 `package.json`（修复 bug → patch +1）
- 执行 `npm run build` + `npx vsce package`
- 输出 `.vsix` 文件供用户本地安装测试

### Step 6 — 用户本地验证
用户安装新构建的 `.vsix`，在 Prism 工程中验证该文件是否已正常格式化。

---

## 发布策略

- **当前阶段**：不自动发布，仅手动构建 `.vsix` 本地测试
- **稳定后**：再考虑手动发布一个稳定版本到 VS Code Marketplace
- 版本号：修复 bug 只升 patch（如 `0.1.2 → 0.1.3`），新增规则升 minor

---

## 测试策略

- 单元测试：`tests/*.in.wgsl` + `tests/*.out.wgsl` 配对（传统测试）
- 集成测试：`tests/prism.test.ts` — 批量测试 Prism 工程中所有 `.wgsl` 文件
- 回归测试：每次修改后跑全部测试，确保已有文件不受影响
