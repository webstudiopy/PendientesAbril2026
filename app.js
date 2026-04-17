
const rows = window.APP_DATA || [];

const gs = n => `Gs. ${new Intl.NumberFormat('es-PY').format(Number(n || 0))}`;
const formatDate = iso => {
  const [y,m,d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

const total = rows.reduce((sum, row) => sum + Number(row.plan || 0), 0);
document.getElementById('heroTotal').textContent = gs(total);

const avgDelay = Math.round(rows.reduce((sum, row) => sum + row.atraso_dias, 0) / rows.length);
const maxDelay = Math.max(...rows.map(r => r.atraso_dias));
const withNotes = rows.filter(r => String(r.observacion || '').trim()).length;

const metricData = [
  { label:'Clientes pendientes', value: rows.length, sub:'Registros cargados' },
  { label:'Monto total pendiente', value: gs(total), sub:'Suma general' },
  { label:'Atraso promedio', value: `${avgDelay} días`, sub:'Promedio estimado' },
  { label:'Con observación', value: withNotes, sub:'Casos con seguimiento' },
];

document.getElementById('metrics').innerHTML = metricData.map(item => `
  <article class="metric">
    <div class="metric-label">${item.label}</div>
    <div class="metric-value">${item.value}</div>
    <div class="metric-sub">${item.sub}</div>
  </article>
`).join('');

const buckets = [
  { name:'1 a 3 días', min:1, max:3 },
  { name:'4 a 7 días', min:4, max:7 },
  { name:'8 a 14 días', min:8, max:14 },
  { name:'15+ días', min:15, max:999 },
];

const bucketData = buckets.map(bucket => ({
  ...bucket,
  count: rows.filter(r => r.atraso_dias >= bucket.min && r.atraso_dias <= bucket.max).length
}));
const maxBucket = Math.max(...bucketData.map(b => b.count), 1);

document.getElementById('delayBuckets').innerHTML = bucketData.map(b => `
  <div class="bucket-item">
    <div class="bucket-label">${b.name}</div>
    <div class="bucket-track">
      <div class="bucket-fill" style="width:${(b.count / maxBucket) * 100}%"></div>
    </div>
    <div class="bucket-count">${b.count} cliente${b.count === 1 ? '' : 's'}</div>
  </div>
`).join('');

const planCounts = Object.entries(rows.reduce((acc, row) => {
  acc[row.plan] = (acc[row.plan] || 0) + 1;
  return acc;
}, {}))
.map(([plan, count]) => ({ plan:Number(plan), count }))
.sort((a,b) => b.plan - a.plan);

document.getElementById('planCards').innerHTML = planCounts.map(item => `
  <div class="plan-card">
    <div>
      <div class="plan-price">${gs(item.plan)}</div>
      <div class="plan-meta">${item.count} cliente${item.count === 1 ? '' : 's'}</div>
    </div>
    <div class="plan-total">${gs(item.plan * item.count)}</div>
  </div>
`).join('');

const urgent = [...rows].sort((a,b) => b.atraso_dias - a.atraso_dias).slice(0,5);
const getBadgeClass = days => days >= 10 ? 'badge-high' : days >= 4 ? 'badge-mid' : 'badge-low';

document.getElementById('urgentList').innerHTML = urgent.map(item => `
  <div class="urgent-item">
    <div class="urgent-top">
      <div>
        <div class="name">${item.cliente}</div>
        <div class="meta">Vence: ${formatDate(item.vencimiento)} · Plan: ${gs(item.plan)}</div>
      </div>
      <span class="badge-delay ${getBadgeClass(item.atraso_dias)}">${item.atraso_dias} días</span>
    </div>
  </div>
`).join('');

const notes = rows.filter(r => String(r.observacion || '').trim());
document.getElementById('notesList').innerHTML = notes.map(item => `
  <div class="note-item">
    <div class="note-top">
      <div>
        <div class="name">${item.cliente}</div>
        <div class="meta">Plan: ${gs(item.plan)} · Atraso: ${item.atraso_dias} días</div>
      </div>
    </div>
    <div class="note-text">${item.observacion}</div>
  </div>
`).join('') || `<div class="note-item"><div class="note-text">No hay observaciones cargadas.</div></div>`;

function delayPill(days){
  if (days >= 10) return 'delay-red';
  if (days >= 4) return 'delay-amber';
  return 'delay-blue';
}

function renderTable(term=''){
  const q = term.trim().toLowerCase();
  const filtered = rows.filter(row => (`${row.cliente} ${row.observacion} ${row.plan}`).toLowerCase().includes(q));

  const tbody = document.getElementById('tableBody');
  if (!filtered.length){
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center; padding:28px; color:#64748b;">No se encontraron resultados.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(row => `
    <tr>
      <td><div class="client-name">${row.cliente}</div></td>
      <td>${formatDate(row.vencimiento)}</td>
      <td><span class="delay-pill ${delayPill(row.atraso_dias)}">${row.atraso_dias} día${row.atraso_dias === 1 ? '' : 's'}</span></td>
      <td><span class="amount">${gs(row.plan)}</span></td>
      <td class="${row.observacion ? '' : 'obs-empty'}">${row.observacion || 'Sin observación'}</td>
    </tr>
  `).join('');
}

renderTable();
document.getElementById('searchInput').addEventListener('input', e => renderTable(e.target.value));
