// Page 7 — Pipeline Impact

import { computePipelineByDimension, computePipelineKPIs } from '../data/transformations.js';
import { renderBarChart, renderHorizontalBar, renderDoughnutChart, destroyPageCharts, COLORS } from '../components/charts.js';
import { kpiCard } from '../components/uiComponents.js';
import { fmt } from '../utils/formatters.js';

export function renderPipelineImpact(container, requests, pipelineRecords) {
  destroyPageCharts('pi-');

  if (!pipelineRecords.length) {
    container.innerHTML = `
      <p class="page-title">Pipeline Impact</p>
      <div class="card" style="margin-top:20px">
        <div class="card-body">
          <div class="placeholder-section" style="padding:40px">
            <div style="font-size:40px;margin-bottom:12px">📈</div>
            <p style="font-size:15px;font-weight:600;margin:0 0 8px">No pipeline data loaded</p>
            <p style="font-size:13px;color:#6A7380;margin:0">Upload a pipeline CSV (SAP CRM export) using the Upload button in the sidebar to see influenced and sourced pipeline figures linked to campaigns.</p>
          </div>
        </div>
      </div>`;
    return;
  }

  const kpis = computePipelineKPIs(pipelineRecords);
  const byRegion   = computePipelineByDimension(pipelineRecords, 'region');
  const byIndustry = computePipelineByDimension(pipelineRecords, 'industry');
  const byLoB      = computePipelineByDimension(pipelineRecords, 'lob');
  const bySolution = computePipelineByDimension(pipelineRecords, 'solutionArea');
  const byCampType = computePipelineByDimension(pipelineRecords, 'campaignType');
  const byMember   = computePipelineByDimension(pipelineRecords, 'assignedTo');
  const byAsset    = computePipelineByDimension(pipelineRecords, 'assetType');

  container.innerHTML = `
    <div>
      <p class="page-title">Pipeline Impact</p>
      <p class="page-subtitle">Revenue pipeline influenced and sourced by Curators team campaigns</p>

      <div class="kpi-grid" style="margin-bottom:24px">
        ${kpiCard({ label: 'Total Pipeline', value: fmt.currency(kpis.total), accent: 'primary' })}
        ${kpiCard({ label: 'Influenced Pipeline', value: fmt.currency(kpis.influenced), sub: fmt.pct(kpis.total ? (kpis.influenced/kpis.total)*100 : 0) + ' of total', accent: 'success' })}
        ${kpiCard({ label: 'Sourced Pipeline', value: fmt.currency(kpis.sourced), sub: fmt.pct(kpis.total ? (kpis.sourced/kpis.total)*100 : 0) + ' of total', accent: 'info' })}
        ${kpiCard({ label: 'Opportunities', value: fmt.number(kpis.opps), accent: 'primary' })}
        ${kpiCard({ label: 'Accounts', value: fmt.number(kpis.accounts), accent: 'primary' })}
      </div>

      <div class="section-grid section-grid-2" style="margin-bottom:16px">
        <div class="card">
          <div class="card-header"><span class="card-title">Pipeline by Region</span></div>
          <div class="card-body"><div class="chart-container"><canvas id="pi-region"></canvas></div></div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Pipeline by Industry</span></div>
          <div class="card-body"><div class="chart-container"><canvas id="pi-industry"></canvas></div></div>
        </div>
      </div>

      <div class="section-grid section-grid-2" style="margin-bottom:16px">
        <div class="card">
          <div class="card-header"><span class="card-title">Pipeline by LoB</span></div>
          <div class="card-body"><div class="chart-container"><canvas id="pi-lob"></canvas></div></div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Pipeline by Solution Area</span></div>
          <div class="card-body"><div class="chart-container"><canvas id="pi-solution"></canvas></div></div>
        </div>
      </div>

      <div class="section-grid section-grid-2" style="margin-bottom:16px">
        <div class="card">
          <div class="card-header"><span class="card-title">Pipeline by Campaign Type</span></div>
          <div class="card-body"><div class="chart-container"><canvas id="pi-camptype"></canvas></div></div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Pipeline by Asset Type</span></div>
          <div class="card-body"><div class="chart-container"><canvas id="pi-asset"></canvas></div></div>
        </div>
      </div>

      <div class="card" style="margin-bottom:16px">
        <div class="card-header"><span class="card-title">Pipeline by Team Member</span></div>
        <div class="card-body"><div class="chart-container"><canvas id="pi-member"></canvas></div></div>
      </div>

      <div class="card">
        <div class="card-header"><span class="card-title">Pipeline Records</span></div>
        <div class="card-body" style="padding:0">
          <div class="data-table-wrap">
            <table class="data-table">
              <thead><tr><th>Opportunity</th><th>Account</th><th>Type</th><th>Amount</th><th>Stage</th><th>Region</th><th>Industry</th><th>Team Member</th></tr></thead>
              <tbody>${pipelineRecords.slice(0, 30).map(p => `
                <tr>
                  <td class="font-mono" style="font-size:11px">${p.opportunityId || '—'}</td>
                  <td>${p.accountName || '—'}</td>
                  <td><span class="badge ${p.type === 'Influenced' ? 'badge-in-progress' : 'badge-completed'}">${p.type}</span></td>
                  <td><strong>${fmt.currency(p.amount)}</strong></td>
                  <td>${p.stage || '—'}</td>
                  <td>${p.region || '—'}</td>
                  <td>${p.industry || '—'}</td>
                  <td>${p.assignedTo || '—'}</td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>`;

  const mkDatasets = (arr) => [
    { label: 'Influenced', data: arr.map(d => d.influenced), backgroundColor: COLORS.primary },
    { label: 'Sourced', data: arr.map(d => d.sourced), backgroundColor: COLORS.green }
  ];

  renderBarChart('pi-region',   { labels: byRegion.map(d => d.label),   datasets: mkDatasets(byRegion),   stacked: true, height: 240 });
  renderBarChart('pi-camptype', { labels: byCampType.map(d => d.label), datasets: mkDatasets(byCampType), stacked: true, height: 240 });
  renderHorizontalBar('pi-industry', { labels: byIndustry.map(d => d.label), data: byIndustry.map(d => d.total), color: COLORS.orange });
  renderHorizontalBar('pi-lob',      { labels: byLoB.map(d => d.label),      data: byLoB.map(d => d.total),      color: COLORS.purple });
  renderHorizontalBar('pi-solution', { labels: bySolution.map(d => d.label), data: bySolution.map(d => d.total), color: COLORS.teal });
  renderHorizontalBar('pi-asset',    { labels: byAsset.map(d => d.label),    data: byAsset.map(d => d.total),    color: COLORS.navy });
  renderBarChart('pi-member', { labels: byMember.map(d => d.label), datasets: mkDatasets(byMember), stacked: true, height: 240 });
}
