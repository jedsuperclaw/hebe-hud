# Hebe HUD

一个本地可视化控制台，用来同时监控：
- Hebe / 当前会话模型状态
- OpenClaw 配置与 gateway 状态
- Linux Mint 主机资源状态

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
- 主机状态：Node `os` 模块 + `df` / `ps`
- Git 状态：工作区仓库 `git status`

## 已知限制

- 当前没有真正读取“当前会话实时 token/上下文”接口，只显示配置层和系统层信息。
- gateway 状态目前是命令输出摘要，不是结构化 API。
- CPU 使用率目前看 load average，不是每核实时采样。
- 温度读取依赖 `/sys/class/thermal/*`，部分机器可能为空。

## 下一步建议

### v1.1
- [ ] 增加最近错误事件面板
- [ ] 增加 cron / session 数量概览
- [ ] 增加刷新频率控制
- [ ] 增加暗色 HUD 告警动画

### v1.2
- [ ] WebSocket 实时推送
- [ ] 历史趋势图（CPU / 内存 / gateway）
- [ ] 服务状态卡（OpenClaw / gateway / node）
- [ ] 一键操作按钮（重启 gateway、打开日志）

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

这是第一版可用原型，目标是先把“能看、能判断、能扩展”做出来。
后面每次迭代都继续更新这个 README，方便追踪进度和待办。
