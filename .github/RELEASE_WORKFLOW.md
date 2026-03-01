# 发布工作流程图

## 完整发布流程

```mermaid
graph TD
    A[开始发布] --> B{检查代码状态}
    B -->|有未提交更改| C[提交或暂存更改]
    B -->|干净| D[运行测试套件]
    C --> D
    
    D --> E{测试通过?}
    E -->|失败| F[修复问题]
    F --> D
    E -->|通过| G[更新版本号]
    
    G --> H[更新 CHANGELOG.md]
    H --> I[构建和打包]
    I --> J[提交更改]
    J --> K[创建 Git Tag]
    K --> L[推送到 GitHub]
    
    L --> M[GitHub Actions 触发]
    M --> N[Release 工作流]
    M --> O[Publish 工作流]
    
    N --> P[创建 GitHub Release]
    P --> Q[上传 .vsix 文件]
    
    O --> R[发布到 VSCode 市场]
    R --> S[市场审核]
    S --> T[发布完成]
    
    Q --> T
    T --> U[通知用户]
```

## 自动化工作流详解

### 1. CI 工作流 (持续集成)

```mermaid
graph LR
    A[Push/PR] --> B[Checkout 代码]
    B --> C[安装依赖]
    C --> D[Lint 检查]
    D --> E[格式检查]
    E --> F[类型检查]
    F --> G[运行测试]
    G --> H[构建扩展]
    H --> I[打包 .vsix]
    I --> J{所有检查通过?}
    J -->|是| K[上传构建产物]
    J -->|否| L[失败通知]
```

**触发条件:**
- Push 到 main 或 develop 分支
- Pull Request 到 main 或 develop 分支

**执行矩阵:**
- 操作系统: Ubuntu, Windows, macOS
- Node.js: 18.x, 20.x

### 2. Release 工作流 (创建发布)

```mermaid
graph TD
    A[推送 Tag v*.*.*] --> B[触发 Release 工作流]
    B --> C[Checkout 代码]
    C --> D[安装依赖]
    D --> E[运行测试]
    E --> F{测试通过?}
    F -->|否| G[工作流失败]
    F -->|是| H[构建和打包]
    H --> I[提取版本号]
    I --> J[从 CHANGELOG 提取说明]
    J --> K[创建 GitHub Release]
    K --> L[上传 .vsix 文件]
    L --> M[Release 创建完成]
```

**触发条件:**
- 推送格式为 `v*.*.*` 的 tag

**输出:**
- GitHub Release 页面
- 附带 .vsix 文件下载

### 3. Publish 工作流 (发布到市场)

```mermaid
graph TD
    A[GitHub Release 发布] --> B[触发 Publish 工作流]
    B --> C[Checkout 代码]
    C --> D[安装依赖]
    D --> E[运行测试]
    E --> F{测试通过?}
    F -->|否| G[工作流失败]
    F -->|是| H[构建扩展]
    H --> I[验证版本号]
    I --> J{版本匹配?}
    J -->|否| K[版本不匹配错误]
    J -->|是| L[打包扩展]
    L --> M[使用 VSCE_PAT 发布]
    M --> N{发布成功?}
    N -->|否| O[发布失败通知]
    N -->|是| P[上传 .vsix 到 Release]
    P --> Q[发布成功通知]
```

**触发条件:**
- GitHub Release 状态变为 "published"

**要求:**
- GitHub Secret: `VSCE_PAT` (Azure DevOps Personal Access Token)
- package.json 中的 publisher 字段正确

## 版本管理策略

```mermaid
graph LR
    A[开发分支] -->|功能完成| B[Pull Request]
    B -->|代码审查| C[合并到 main]
    C -->|准备发布| D[更新版本]
    D -->|Patch| E[0.1.0 → 0.1.1]
    D -->|Minor| F[0.1.0 → 0.2.0]
    D -->|Major| G[0.1.0 → 1.0.0]
    E --> H[创建 Tag]
    F --> H
    G --> H
    H --> I[自动发布]
```

### 语义化版本规范

- **Patch (0.0.X)**: Bug 修复，向后兼容
- **Minor (0.X.0)**: 新功能，向后兼容
- **Major (X.0.0)**: 破坏性变更，不向后兼容

## 发布时间线

```mermaid
gantt
    title 发布流程时间线
    dateFormat  mm:ss
    
    section 本地操作
    运行测试           :a1, 00:00, 30s
    更新版本           :a2, after a1, 5s
    构建打包           :a3, after a2, 10s
    提交推送           :a4, after a3, 10s
    
    section GitHub Actions
    Release 工作流     :b1, after a4, 60s
    Publish 工作流     :b2, after b1, 90s
    
    section 市场审核
    VSCode 市场审核    :c1, after b2, 1800s
```

**预计总时间:**
- 本地操作: ~1 分钟
- GitHub Actions: ~2-3 分钟
- 市场审核: 5-30 分钟

## 错误处理流程

```mermaid
graph TD
    A[发布过程] --> B{遇到错误?}
    B -->|测试失败| C[修复代码]
    B -->|构建失败| D[检查依赖]
    B -->|版本冲突| E[更新版本号]
    B -->|发布失败| F[检查 PAT]
    B -->|无错误| G[发布成功]
    
    C --> H[重新运行]
    D --> H
    E --> H
    F --> H
    H --> A
    
    G --> I[监控反馈]
    I --> J{发现问题?}
    J -->|是| K[创建 Hotfix]
    J -->|否| L[继续开发]
    K --> A
```

## 回滚策略

```mermaid
graph TD
    A[发现严重问题] --> B{问题类型?}
    B -->|市场未审核| C[撤回发布]
    B -->|已发布| D[发布 Hotfix]
    
    C --> E[删除 Release]
    E --> F[删除 Tag]
    F --> G[修复问题]
    
    D --> H[创建修复分支]
    H --> I[快速修复]
    I --> J[发布 Patch 版本]
    
    G --> K[重新发布]
    J --> K
```

**回滚命令:**
```bash
# 撤回市场发布
npx vsce unpublish publisher.extension@version

# 删除 GitHub Release
gh release delete v0.1.0

# 删除 Git Tag
git tag -d v0.1.0
git push origin :refs/tags/v0.1.0
```

## 监控和维护

```mermaid
graph LR
    A[发布完成] --> B[监控下载量]
    A --> C[监控错误报告]
    A --> D[收集用户反馈]
    
    B --> E[分析使用趋势]
    C --> F[优先修复]
    D --> G[规划新功能]
    
    E --> H[优化策略]
    F --> I[发布更新]
    G --> I
    H --> I
    
    I --> A
```

## 最佳实践

### 发布前
- ✅ 运行完整测试套件
- ✅ 更新所有文档
- ✅ 检查代码覆盖率
- ✅ 本地测试扩展功能

### 发布中
- ✅ 使用语义化版本
- ✅ 编写清晰的 CHANGELOG
- ✅ 验证自动化工作流
- ✅ 监控发布进度

### 发布后
- ✅ 验证市场页面
- ✅ 测试安装和更新
- ✅ 监控用户反馈
- ✅ 准备下一个版本

---

**参考文档:**
- [QUICK_START_PUBLISHING.md](../QUICK_START_PUBLISHING.md)
- [PUBLISHING_GUIDE.md](../PUBLISHING_GUIDE.md)
- [DEPLOYMENT_SUMMARY.md](../DEPLOYMENT_SUMMARY.md)
