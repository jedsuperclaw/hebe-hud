function el(id) { return document.getElementById(id); }
function setText(id, value) { el(id).textContent = value ?? '--'; }
function pct(barId, n) { el(barId).style.width = `${Math.max(0, Math.min(100, n || 0))}%`; }
function fmtUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
}
function renderList(id, items, mapFn) {
  const node = el(id); node.innerHTML = '';
  for (const item of items || []) {
    const li = document.createElement('li');
    li.textContent = mapFn(item);
    node.appendChild(li);
  }
  if (!node.children.length) {
    const li = document.createElement('li');
    li.textContent = '—';
    node.appendChild(li);
  }
}
async function refresh() {
  const res = await fetch('/api/status', { cache: 'no-store' });
  const s = await res.json();
  setText('healthBadge', `${s.health.level} · ${s.health.reason}`);
  el('healthBadge').className = `badge ${s.health.level.toLowerCase()}`;
  setText('generatedAt', new Date(s.generatedAt).toLocaleString());
  setText('model', s.openclaw?.primaryModel || 'n/a');
  setText('fallbacks', `fallbacks: ${(s.openclaw?.fallbackModels || []).join(' · ') || 'none'}`);
  setText('gateway', s.gateway?.ok ? 'ONLINE' : 'OFFLINE');
  setText('gatewayText', s.gateway?.text || 'n/a');
  setText('host', s.host);
  setText('platform', s.platform);
  setText('memory', `${s.human.memoryUsed} / ${s.human.memoryTotal} (${s.memory.usedPercent}%)`);
  pct('memoryBar', s.memory.usedPercent);
  setText('disk', `${s.human.diskUsed} / ${s.human.diskSize} (${s.disk?.usePercent || 'n/a'})`);
  pct('diskBar', parseInt(s.disk?.usePercent || '0', 10));
  setText('cpu', `${s.cpu.load1} / ${s.cpu.load5} / ${s.cpu.load15}  (${s.cpu.cores} cores)`);
  setText('temp', s.cpu.temperatureC ? `${s.cpu.temperatureC}°C` : 'n/a');
  setText('primaryModel', s.openclaw?.primaryModel || 'n/a');
  setText('agentModel', s.openclaw?.currentAgentModel || 'n/a');
  setText('providers', (s.openclaw?.providers || []).join(', ') || 'n/a');
  setText('hostname', s.host);
  setText('uptime', fmtUptime(s.uptimeSeconds));
  setText('branch', s.git?.branch || 'n/a');
  setText('dirty', s.git?.dirty ? 'DIRTY' : 'CLEAN');
  renderList('channels', s.openclaw?.channels || [], c => `${c.name}: ${c.enabled ? 'enabled' : 'disabled'}`);
  renderList('network', s.network || [], n => `${n.iface}: ${n.address}`);
  renderList('changes', s.git?.changes || [], c => c);
  const tbody = el('processes');
  tbody.innerHTML = '';
  for (const p of s.topProcesses || []) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${p.pid}</td><td>${p.command}</td><td>${p.cpu}</td><td>${p.mem}</td>`;
    tbody.appendChild(tr);
  }
}
refresh().catch(console.error);
setInterval(() => refresh().catch(console.error), 5000);
