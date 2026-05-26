// Page 5 — Team Impact (constructive, performance-focused view)

import { computeTeamMetrics } from '../data/transformations.js';
import { renderBarChart, renderHorizontalBar, destroyPageCharts } from '../components/charts.js';
import { fmt } from '../utils/formatters.js';
import { openDrilldown, statusBadge } from '../components/uiComponents.js';

export function renderTeamImpact(container, requests, pipelineRecords) {
  destroyPageCharts('ti-');
  const metrics = computeTeamMetrics(requests, pipelineRecords);
  const hasPipeline = pipelineRecords.length > 0;
  const hasDueDate = requests.some(r => r.dueDate);

  container.innerHTML = `
    <div>
      <p class="page-title">Team Impact</p>
      <p class="page-subtitle">Team workload, delivery performance, and pipeline contribution</p>

      <div class="section-grid section-grid-2" style="margin-bottom:16px">
        <div class="card">
          <div class="card-header"><span class="card-title">Requests Handled by Team Member</span></div>
          <div class="card-body"><div class="chart-container"><canvas id="ti-handled"></canvas></div></div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Avg Delivery Time (days)</span></div>
          <div class="card-body"><div class="chart-container"><canvas id="ti-delivery"></canvas></div></div>
        </div>
      </div>

      ${hasPipeline ? `
      <div class="section-grid section-grid-2" style="margin-bottom:16px">
        <div class="card">
          <div class="card-header"><span class="card-title">Influenced Pipeline by Team Member</span></div>
          <div class="card-body"><div class="chart-container"><canvas id="ti-inf-pipe"></canvas></div></div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Sourced Pipeline by Team Member</span></div>
          <div class="card-body"><div class="chart-container"><canvas id="ti-src-pipe"></canvas></div></div>
        </div>
      </div>` : ''}

      <div class="card" style="margin-bottom:16px">
        <div class="card-header">
          <span class="card-title">Team Member Summary</span>
          <span style="font-size:11px;color:#6A7380">Click a row to see details</span>
        </div>
        <div class="card-body" style="padding:0">
          <div class="data-table-wrap">
            <table class="data-table">
              <thead><tr>
                <th>Team Member</th>
                <th>Handled</th>
                <th>Completed</th>
                <th>In Progress</th>
                ${hasDueDate ? '<th>Overdue</th>' : ''}
                <th>Completion Rate</th>
                <th>Avg Delivery</th>
                <th>Top Asset</th>
                ${hasPipeline ? '<th>Inf. Pipeline</th>' : ''}
                ${hasPipeline ? '<th>Src. Pipeline</th>' : ''}
              </tr></thead>
              <tbody id="ti-tbody">
                ${metrics.map(m => `
                  <tr class="clickable" data-member="${m.name}" style="cursor:pointer">
                    <td><strong>${m.name}</strong></td>
                    <td>${fmt.number(m.handled)}</td>
                    <td>${fmt.number(m.completed)}</td>
                    <td>${fmt.number(m.inProgress)}</td>
                    ${hasDueDate ? `<td>${m.overdue > 0 ? `<span class="badge badge-overdue">${m.overdue}</span>` : '<span class="text-success">0</span>'}</td>` : ''}
                    <td>
                      <div style="display:flex;align-items:center;gap:8px">
                        <div class="progress-bar" style="width:60px">
                          <div class="progress-fill" style="width:${m.completionRate.toFixed(0)}%;background:#107E3E"></div>
                        </div>
                        <span>${fmt.pct(m.completionRate)}</span>
                      </div>
                    </td>
                    <td>${m.avgDelivery ? fmt.days(m.avgDelivery) : '—'}</td>
                    <td>${m.topAsset}</td>
                    ${hasPipeline ? `<td>${fmt.currency(m.influencedPipeline)}</td>` : ''}
                    ${hasPipeline ? `<td>${fmt.currency(m.sourcedPipeline)}</td>` : ''}
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>`;

  // Charts
  renderHorizontalBar('ti-handled', { labels: metrics.map(m => m.name), data: metrics.map(m => m.handled), color: '#0070F2' });
  renderHorizontalBar('ti-delivery', {
    labels: metrics.filter(m => m.avgDelivery).map(m => m.name),
    data: metrics.filter(m => m.avgDelivery).map(m => Math.round(m.avgDelivery)),
    color: '#0099CC'
  });

  if (hasPipeline) {
    renderHorizontalBar('ti-inf-pipe', { labels: metrics.map(m => m.name), data: metrics.map(m => m.influencedPipeline), color: '#107E3E' });
    renderHorizontalBar('ti-src-pipe', { labels: metrics.map(m => m.name), data: metrics.map(m => m.sourcedPipeline), color: '#65A30D' });
  }

  // Row click → drilldown
  container.querySelectorAll('#ti-tbody tr.clickable').forEach(tr => {
    tr.addEventListener('click', () => {
      const name = tr.dataset.member;
      const m = metrics.find(x => x.name === name);
      if (!m) return;
      const memberRequests = requests.filter(r => r.assignedTo === name);
      const recentStr = memberRequests.slice(0, 8).map(r => `
        <tr>
          <td style="font-size:12px;padding:6px 8px">${r.requestId}</td>
          <td style="font-size:12px;padding:6px 8px">${r.campaignName || '—'}</td>
          <td style="font-size:12px;padding:6px 8px">${r.assetType || '—'}</td>
          <td style="font-size:12px;padding:6px 8px">${statusBadge(r.status)}</td>
        </tr>`).join('');

      openDrilldown(`${name} — Detail`, `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
          <div style="background:#F5F6F7;border-radius:6px;padding:12px;text-align:center">
            <div style="font-size:24px;font-weight:700">${m.handled}</div>
            <div style="font-size:11px;color:#6A7380">Total Requests</div>
          </div>
          <div style="background:#F5F6F7;border-radius:6px;padding:12px;text-align:center">
            <div style="font-size:24px;font-weight:700;color:#107E3E">${fmt.pct(m.completionRate)}</div>
            <div style="font-size:11px;color:#6A7380">Completion Rate</div>
          </div>
          <div style="background:#F5F6F7;border-radius:6px;padding:12px;text-align:center">
            <div style="font-size:24px;font-weight:700">${m.avgDelivery ? fmt.days(m.avgDelivery) : '—'}</div>
            <div style="font-size:11px;color:#6A7380">Avg Delivery</div>
          </div>
          <div style="background:#F5F6F7;border-radius:6px;padding:12px;text-align:center">
            <div style="font-size:24px;font-weight:700">${m.accountsTouched}</div>
            <div style="font-size:11px;color:#6A7380">Accounts Touched</div>
          </div>
        </div>
        <p style="font-size:11px;font-weight:600;color:#6A7380;text-transform:uppercase;letter-spacing:.5px;margin:0 0 8px">Asset Breakdown</p>
        <table class="data-table" style="margin-bottom:16px">
          <thead><tr><th>Asset Type</th><th>Count</th></tr></thead>
          <tbody>${Object.entries(m.assetTypes).sort((a,b)=>b[1]-a[1]).map(([t,c]) => `<tr><td>${t}</td><td>${c}</td></tr>`).join('')}</tbody>
        </table>
        <p style="font-size:11px;font-weight:600;color:#6A7380;text-transform:uppercase;letter-spacing:.5px;margin:0 0 8px">Recent Requests</p>
        <table class="data-table">
          <thead><tr><th>ID</th><th>Campaign</th><th>Asset</th><th>Status</th></tr></thead>
          <tbody>${recentStr}</tbody>
        </table>`);
    });
  });
}
