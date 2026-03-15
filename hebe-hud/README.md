# Hebe HUD

一个本地可视化控制台，用来同时监控：
- Hebe / 当前会话模型状态
- OpenClaw 配置与 gateway 状态
- Linux Mint 主机资源状态
- cron / session / 告警 / 最近事件

## 当前进度

### v1 已完成
- [x] 本地 Node HTTP 服务
- [x] `/api/status` 状态接口
- [x] HUD 风格单页界面
- [x] 主模型 / fallback / provider 展示
- [x] gateway 状态摘要
- [x] CPU / 内存 / 磁盘 / 温度 / uptime 展示
- [x] 网络 IP 展示
- [x] Git 工作区状态展示
- [x] 高负载进程列表

### v1.1 已完成
- [x] cron 任务统计面板
- [x] 最近 session 活动面板（基于 commands.log 观测）
- [x] 告警面板
- [x] 最近配置/系统事件面板
- [x] 根目录 README 补全

### 当前文件结构

```text
hebe-hud/
├── README.md
├── server.js
└── public/
    ├── index.html
    ├── app.js
    └── styles.css
```

## 启动方式

```bash
cd /home/jed/.openclaw/workspace/hebe-hud
node server.js
```

默认地址：
- <http://127.0.0.1:4782>

## 数据来源

- OpenClaw gateway 状态：`openclaw gateway status`
- OpenClaw 配置：`~/.openclaw/openclaw.json`
- cron 任务：`~/.openclaw/cron/jobs.json`
- recent sessions：`~/.openclaw/logs/commands.log`
- recent events：`~/.openclaw/logs/config-audit.jsonl`
- 主机状态：Node `os` 模块 + `df` / `ps`
- Git 状态：工作区仓库 `git status`

## 当前告警逻辑

目前会检查：
- gateway 不可用
- 内存占用过高
- 磁盘占用过高
- CPU 温度偏高
- 工作区未提交改动
- 没有 cron 任务
- 最近没有观测到 session 活动

## 已知限制

- session 面板目前是**基于 commands.log 的最近活动观测**，不是官方实时 session API。
- gateway 状态目前仍然是命令输出摘要，不是结构化 API。
- CPU 使用率目前看 load average，不是每核实时采样。
- 温度读取依赖 `/sys/class/thermal/*`，部分机器可能为空。
- 告警规则现在还是启发式，后续可以做可配置阈值。

## 下一步建议

### v1.2
- [ ] 刷新频率控制
- [ ] 过滤/折叠低优先级告警
- [ ] 插件状态面板
- [ ] OpenClaw / gateway 服务级状态卡

### v1.3
- [ ] WebSocket 实时推送
- [ ] 历史趋势图（CPU / 内存 / gateway）
- [ ] 一键操作按钮（重启 gateway、打开日志）
- [ ] 更强的 session 结构化统计

### v2
- [ ] 真正的“钢铁侠 HUD”视觉重构
- [ ] 多层告警系统
- [ ] 可折叠诊断视图
- [ ] 面向移动端的简化版面板

## 修改建议

后续如果要改进，建议优先顺序：
1. **先补结构化数据**，再做更酷的视觉
2. **先补实时告警**，再补历史趋势
3. **先让面板能排障**，再让它更像电影道具

## 备注

这是一个持续迭代的监控面板项目。
每次功能升级后，都继续更新这个 README，用来记录“现在做到哪里了”和“下一步该做什么”。
