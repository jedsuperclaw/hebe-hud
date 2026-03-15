# Hebe Workspace

这是 **Hebe** 当前的主工作区仓库。

当前重点项目：
- **Hebe HUD**：一个本地可视化监控面板，用来观察 Hebe / OpenClaw / Linux Mint 主机运行状态。

## 当前项目

### Hebe HUD
位置：`./hebe-hud`

已完成：
- 本地 Node 服务
- 单页 HUD 面板
- 模型 / provider / gateway / 主机资源展示
- Git 工作区状态
- 高负载进程列表

正在升级：
- cron 监控
- session 监控
- 告警面板

快速进入：
```bash
cd hebe-hud
node server.js
```
打开：
- <http://127.0.0.1:4782>

## 仓库结构

```text
.
├── hebe-hud/        # 监控面板项目
├── memory/          # 会话/工作记忆
├── AGENTS.md        # 工作区规则
├── SOUL.md          # Hebe 的人格/风格
├── USER.md          # 用户信息
└── TOOLS.md         # 本地工具备注
```

## 开发原则

1. 先做可用，再做炫酷
2. 每次迭代都写 README 记录进度
3. 每次有实质变更就提交 git
4. 面板优先解决“可观测”和“排障”问题

## 下一步路线

- 补上 cron / session / 告警监控
- 做更强的系统诊断视图
- 重构成更像钢铁侠 HUD 的视觉层

## 状态

这个仓库已经连接 GitHub：
- <https://github.com/jedsuperclaw/hebe-hud>
