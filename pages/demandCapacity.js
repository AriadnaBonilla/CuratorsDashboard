// Page 8 — Demand vs Capacity

import { computeDemandCapacity, computeWorkloadByQuarter, computeTeamMetrics } from '../data/transformations.js';
import { renderBarChart, renderLineChart, renderHorizontalBar, destroyPageCharts } from '../components/charts.js';
import { fmt } from '../utils/formatters.js';

export function renderDemandCapacity(container, requests, capacityMap = {}) {
  destroyPageCharts('dc-');
  const hasDueDate = requests.some(r => r.dueDate);
  const workload = computeWorkloadByQuarter(requests);
  const teamData = computeTeamMetrics(requests, []);
  const demand = computeDemandCapacity(requests, capacityMap);
  const hasCapacity = Object.keys(capacityMap).length > 0;

  // Per-member open workload
  const openByMember = teamData.map(m => ({
    name: m.name,
    open: m.inProgress,
    overdue: m.overdue,
    avgDelivery: m.avgDelivery
  }));

  container.innerHTML = `
    <div>
      <p class="page-title">Demand vs Capacity</p>
      <p class="page-subtitle">Team workload distribution, open requests, and delivery trends</p>

      ${!hasCapacity ? `
      <div style="background:#EBF1FA;border:1px solid #C7D9F0;border-radius:6px;padding:12px 16px;margin-bottom:16px;font-size:13px;color:#354A5E">
        <strong>Capacity not configured.</strong> To enable utilization views, add a capacity map in <code>src/app.js</code>:
        <code style="display:block;margin-top:6px;background:#fff;padding:6px 10px;border-radius:4px;font-size:12px">
          const CAPACITY_MAP = { "Sarah Chen": 10, "Marcus Johnson": 8, ... }; // requests per quarter
        </code>
      </div>` : ''}

      <div class="section-grid section-grid-2" style="margin-bottom:16px">
        <div class="card">
          <div class="card-header"><span class="card-title">Submissions vs Completions by Quarter</span></div>
          <div class="card-body"><div class="chart-container"><canvas id="dc-quarterly"></canvas></div></div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Open Workload by Quarter</span></div>
          <div class="card-body"><div class="chart-container"><canvas id="dc-open"></canvas></div></div>
        </div>
      </div>

      <div class="section-grid section-grid-2" style="margin-bottom:16px">
        <div class="card">
          <div class="card-header"><span class="card-title">Open Requests by Team Member</span></div>
          <div class="card-body"><div class="chart-container"><canvas id="dc-open-member"></canvas></div></div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Avg Delivery Time Trend</span></div>
          <div class="card-body"><div class="chart-container"><canvas id="dc-delivery-trend"></canvas></div></div>
        </div>
      </div>

      <div class="card" style="margin-bottom:16px">
        <div class="card-header">
          <span class="card-title">Workload by Team Member × Quarter</span>
          ${!hasCapacity ? '<span style="font-size:11px;color:#6A7380">Add capacity to see utilization %</span>' : ''}
        </div>
        <div class="card-body" style="padding:0">
          <div class="data-table-wrap">
            <table class="data-table">
              <thead><tr>
                <th>Team Member</th>
                <th>Quarter</th>
                <th>Submitted</th>
                <th>Completed</th>
                <th>Open</th>
                ${hasDueDate ? '<th>Overdue</th>' : ''}
                <th>Avg Delivery</th>
                ${hasCapacity ? '<th>Capacity</th>' : ''}
                ${hasCapacity ? '<th>Utilization</th>' : ''}
              </tr></thead>
              <tbody>${demand.map(d => `
                <tr>
                  <td>${d.name}</td>
                  <td>${d.quarter}</td>
                  <td>${d.requests}</td>
                  <td>${d.completed}</td>
                  <td>${d.open > 0 ? `<span class="badge badge-in-progress">${d.open}</span>` : d.open}</td>
                  ${hasDueDate ? `<td>${d.overdue > 0 ? `<span class="badge badge-overdue">${d.overdue}</span>` : '0'}</td>` : ''}
                  <td>${d.avgDelivery ? fmt.days(d.avgDelivery) : '—'}</td>
                  ${hasCapacity ? `<td>${d.capacity || '—'}</td>` : ''}
                  ${hasCapacity ? `<td>
                    ${d.utilizationPct != null ? `
                      <div style="display:flex;align-items:center;gap:6px">
                        <div class="progress-bar" style="width:80px">
                          <div class="progress-fill" style="width:${Math.min(100,d.utilizationPct).toFixed(0)}%;background:${d.utilizationPct > 90 ? '#BB0000' : d.utilizationPct > 70 ? '#DF6E0C' : '#107E3E'}"></div>
                        </div>
                        <span>${fmt.pct(d.utilizationPct)}</span>
                      </div>` : '—'}
                  </td>` : ''}
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><span class="card-title">Capacity Placeholder — Add Real Capacity Data</span></div>
        <div class="card-body">
          <div class="placeholder-section">
            Edit <code>CAPACITY_MAP</code> in <code>src/app.js</code> to define how many requests each team member can handle per quarter. This enables utilization %, capacity risk indicators, and over/under-capacity alerts.
          </div>
        </div>
      </div>
    </div>`;

  renderBarChart('dc-quarterly', {
    labels: workload.map(d => d.label),
    datasets: [
      { label: 'Submitted', data: workload.map(d => d.submitted), backgroundColor: '#93C5FD' },
      { label: 'Completed', data: workload.map(d => d.completed), backgroundColor: '#0070F2' }
    ],
    height: 260
  });

  renderLineChart('dc-open', {
    labels: workload.map(d => d.label),
    datasets: [{ label: 'Open Requests', data: workload.map(d => d.open), borderColor: '#DF6E0C', backgroundColor: '#DF6E0C20', fill: true }],
    height: 260
  });

  renderHorizontalBar('dc-open-member', {
    labels: openByMember.map(m => m.name),
    data: openByMember.map(m => m.open),
    color: '#6200EA'
  });

  // Delivery trend by quarter (avg across team)
  const deliveryByQtr = {};
  requests.filter(r => r.status === 'Completed' && r.submittedDate && r.completedDate).forEach(r => {
    const q = fmt.quarter(r.submittedDate);
    if (!deliveryByQtr[q]) deliveryByQtr[q] = [];
    deliveryByQtr[q].push(Math.round((new Date(r.completedDate) - new Date(r.submittedDate)) / 86400000));
  });
  const qLabels = Object.keys(deliveryByQtr).sort((a, b) => { const pa = a.split(' '), pb = b.split(' '); return pa[1]-pb[1] || pa[0].localeCompare(pb[0]); });
  const avgDelivery = qLabels.map(q => { const arr = deliveryByQtr[q]; return arr.length ? Math.round(arr.reduce((a,b)=>a+b,0)/arr.length) : null; });

  renderLineChart('dc-delivery-trend', {
    labels: qLabels,
    datasets: [{ label: 'Avg Delivery Days', data: avgDelivery, borderColor: '#107E3E' }],
    height: 260
  });
}
