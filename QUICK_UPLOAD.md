# 快速上传到 GitHub

## 一键上传命令

```bash
# 1. 添加所有文件
git add .

# 2. 提交
git commit -m "Initial commit: WGSL Formatter v0.1.1"

# 3. 添加远程仓库（如果还没添加）
git remote add origin https://github.com/bijingdabaihua/wgsl-formatter.git

# 4. 推送到 GitHub
git push -u origin main
```

## 如果遇到错误

### 错误 1: "remote origin already exists"
```bash
# 删除旧的 remote
git remote remove origin

# 重新添加
git remote add origin https://github.com/bijingdabaihua/wgsl-formatter.git
```

### 错误 2: "failed to push some refs"
```bash
# 强制推送（如果确定要覆盖远程仓库）
git push -u origin main --force
```

### 错误 3: "src refspec main does not match any"
```bash
# 确保在 main 分支
git branch -M main

# 再次推送
git push -u origin main
```

## 验证上传成功

访问: https://github.com/bijingdabaihua/wgsl-formatter

应该能看到所有文件已上传。

## 下一步

1. ✅ 在 GitHub 上添加 Topics: `vscode-extension`, `wgsl`, `webgpu`, `formatter`
2. ✅ 创建第一个 Release: v0.1.1
3. ✅ 配置 GitHub Actions 的 VSCE_PAT secret（用于自动发布）

详细步骤见 `GITHUB_SETUP.md`
