# GitHub 设置指南

## 配置步骤

### 1. 设置环境变量

将以下环境变量添加到您的shell配置文件（~/.bashrc 或 ~/.zshrc）：

```bash
export GITHUB_USERNAME="your-username"
export GITHUB_TOKEN="your-personal-access-token"
```

### 2. Git用户配置

```bash
git config --global user.name "your-username"
git config --global user.email "your-username@users.noreply.github.com"
```

### 3. 推送代码

```bash
# 添加远程仓库
git remote add origin "https://$GITHUB_TOKEN@github.com/$GITHUB_USERNAME/ai-agent-platform.git"

# 推送代码
git push -u origin main
```

### 4. 后续更新

```bash
git add .
git commit -m "your commit message"
git push
```

## 注意事项

- 不要在代码中直接暴露Personal Access Token
- 确保 .env 文件已添加到 .gitignore
- 定期更新和轮换访问令牌

## 安全提醒

请妥善保管您的GitHub Personal Access Token，不要在公开的代码库中暴露敏感信息。