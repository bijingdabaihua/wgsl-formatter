# WGSL Formatter - CLAUDE.md

## 项目概述

WGSL (WebGPU Shading Language) 代码格式化 VSCode 扩展。

## 开发流程 (!!!重要!!!)

本项目采用 **规范驱动 + 测试驱动 (Spec-Driven TDD)** 开发模式。

### 核心工作流程

```
SPEC.md (格式化规范)
    ↓
测试用例 (input → expected output)  ← 基于规范生成
    ↓
核心格式化逻辑实现
    ↓
运行测试验证
    ↓
测试通过？→ 是 → 完成
    ↓ 否
修复代码
    ↓
重新验证
```

### 关键原则

1. **规范先行**: 所有格式化决策定义在 `SPEC.md` 中
2. **测试驱动**: 测试用例定义期望行为，代码实现去满足测试
3. **幂等性**: 对已格式化的代码再次格式化应产生相同输出
4. **错误恢复**: 解析失败时返回原始内容，不破坏用户代码

### 问题处理流程

当用户使用中遇到问题时：

1. 先判断是否为用户的 WGSL 代码问题
2. 检查用户意图是否与 `SPEC.md` 规范冲突
3. 若无冲突 → 作为 bug 记录，添加测试用例
4. 若有冲突 → 向用户提出，讨论规范是否需要修改

### 测试文件结构

- `tests/fixtures/valid/` - 符合规范的 WGSL 代码（期望输出）
- `tests/fixtures/invalid/` - 语法错误的 WGSL 代码
- `tests/unit/` - 单元测试
- `tests/integration/` - 集成测试，包括 `spec-driven.test.ts`

## 项目状态

- 版本: 0.1.1
- 核心格式化引擎: 基于 AST 的递归下降
- 测试框架: Vitest
- 构建工具: esbuild

## 技术备注

- TypeScript 严格模式
- VSCode 扩展 API v1.75+
- 所有 VSCode 依赖在测试中通过 `vi.mock('vscode')` 模拟
- 格式化器核心 (`formatter.ts`) 不直接依赖 VSCode API
