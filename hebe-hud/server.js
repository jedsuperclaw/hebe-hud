const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const PORT = process.env.PORT || 4782;
const PUBLIC_DIR = path.join(__dirname, 'public');

function safeExec(command) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 4000 }).trim();
  } catch {
    return null;
  }
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

function bytesToHuman(bytes) {
  if (!Number.isFinite(bytes)) return 'n/a';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  return `${n.toFixed(n >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

function getDisk() {
  const out = safeExec("df -B1 / | tail -1");
  if (!out) return null;
  const parts = out.split(/\s+/);
  return {
    filesystem: parts[0],
    size: Number(parts[1]),
    used: Number(parts[2]),
    available: Number(parts[3]),
    usePercent: parts[4],
    mount: parts[5]
  };
}

function getMemory() {
  const total = os.totalmem();
  const free = os.freemem();
  return {
    total,
    free,
    used: total - free,
    usedPercent: Math.round(((total - free) / total) * 100)
  };
}

function getCpu() {
  const load = os.loadavg();
  const tempRaw = safeExec("for z in /sys/class/thermal/thermal_zone*/temp; do [ -f \"$z\" ] && cat \"$z\" && break; done");
  const tempC = tempRaw ? Math.round(Number(tempRaw) / 1000) : null;
  return {
    cores: os.cpus().length,
    model: os.cpus()[0]?.model || 'unknown',
    load1: Number(load[0].toFixed(2)),
    load5: Number(load[1].toFixed(2)),
    load15: Number(load[2].toFixed(2)),
    temperatureC: Number.isFinite(tempC) ? tempC : null
  };
}

function getNet() {
  const ips = [];
  const nets = os.networkInterfaces();
  for (const [name, entries] of Object.entries(nets)) {
    for (const entry of entries || []) {
      if (!entry.internal && entry.family === 'IPv4') {
        ips.push({ iface: name, address: entry.address });
      }
    }
  }
  return ips;
}

function getOpenClawConfigSummary() {
  const cfg = readJson(path.join(os.homedir(), '.openclaw', 'openclaw.json'));
  if (!cfg) return null;
  const providers = Object.keys(cfg.models?.providers || {});
  const currentAgent = cfg.agents?.list?.find(a => a.id === 'main') || null;
  return {
    primaryModel: cfg.agents?.defaults?.model?.primary || null,
    fallbackModels: cfg.agents?.defaults?.model?.fallbacks || [],
    providers,
    channels: Object.entries(cfg.channels || {}).map(([name, val]) => ({ name, enabled: !!val.enabled })),
    currentAgentModel: currentAgent?.model || null
  };
}

function getGatewayStatus() {
  const status = safeExec('openclaw gateway status');
  if (!status) return { ok: false, text: 'unavailable' };
  return {
    ok: !/stopped|not running/i.test(status),
    text: status.slice(0, 1200)
  };
}

function getProcessInfo() {
  const ps = safeExec("ps -eo pid,comm,%cpu,%mem --sort=-%cpu | head -n 8");
  return ps ? ps.split('\n').slice(1).map(line => {
    const parts = line.trim().split(/\s+/, 4);
    return { pid: parts[0], command: parts[1], cpu: parts[2], mem: parts[3] };
  }) : [];
}

function getGitInfo() {
  const branch = safeExec('git -C /home/jed/.openclaw/workspace branch --show-current');
  const status = safeExec('git -C /home/jed/.openclaw/workspace status --short');
  return {
    branch,
    dirty: !!status,
    changes: status ? status.split('\n').filter(Boolean).slice(0, 20) : []
  };
}

function getHealth(overall) {
  if (!overall.gateway.ok) return { level: 'RED', reason: 'Gateway unavailable' };
  if (overall.memory.usedPercent >= 90) return { level: 'RED', reason: 'Memory pressure high' };
  if (parseInt(overall.disk.usePercent, 10) >= 90) return { level: 'RED', reason: 'Disk nearly full' };
  if (overall.memory.usedPercent >= 75 || parseInt(overall.disk.usePercent, 10) >= 80) return { level: 'YELLOW', reason: 'Resource pressure rising' };
  return { level: 'GREEN', reason: 'Nominal' };
}

function buildStatus() {
  const memory = getMemory();
  const disk = getDisk();
  const cpu = getCpu();
  const gateway = getGatewayStatus();
  const openclaw = getOpenClawConfigSummary();
  const git = getGitInfo();
  const overall = { 
    host: os.hostname(),
    platform: `${os.type()} ${os.release()}`,
    uptimeSeconds: os.uptime(),
    memory,
    disk,
    cpu,
    gateway,
    openclaw,
    git,
    network: getNet(),
    topProcesses: getProcessInfo(),
    generatedAt: new Date().toISOString()
  };
  overall.health = getHealth(overall);
  overall.human = {
    memoryUsed: bytesToHuman(memory.used),
    memoryTotal: bytesToHuman(memory.total),
    diskUsed: disk ? bytesToHuman(disk.used) : 'n/a',
    diskSize: disk ? bytesToHuman(disk.size) : 'n/a'
  };
  return overall;
}

function sendJson(res, data) {
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(data, null, 2));
}

function serveStatic(req, res) {
  let target = req.url === '/' ? '/index.html' : req.url;
  target = path.normalize(target).replace(/^\.\.+/, '');
  const file = path.join(PUBLIC_DIR, target);
  if (!file.startsWith(PUBLIC_DIR)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }
  fs.readFile(file, (err, buf) => {
    if (err) {
      res.writeHead(404); res.end('Not found'); return;
    }
    const ext = path.extname(file);
    const type = ext === '.html' ? 'text/html; charset=utf-8'
      : ext === '.css' ? 'text/css; charset=utf-8'
      : ext === '.js' ? 'application/javascript; charset=utf-8'
      : 'text/plain; charset=utf-8';
    res.writeHead(200, { 'Content-Type': type });
    res.end(buf);
  });
}

http.createServer((req, res) => {
  if (req.url === '/api/status') return sendJson(res, buildStatus());
  serveStatic(req, res);
}).listen(PORT, () => {
  console.log(`Hebe HUD listening on http://127.0.0.1:${PORT}`);
});
