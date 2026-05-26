// Page 1 — Executive Overview

import { computeOverviewKPIs, computeVolumeByMonth, computeVolumeByQuarter } from '../data/transformations.js';
import { kpiCard, statusBadge } from '../components/uiComponents.js';
import { renderBarChart, renderLineChart, renderDoughnutChart, destroyPageCharts } from '../components/charts.js';
import { fmt } from '../utils/formatters.js';

export function renderOverview(container, requests, pipelineRecords) {
  destroyPageCharts('ov-');
  const kpis = computeOverviewKPIs(requests, pipelineRecords);
  const monthly = computeVolumeByMonth(requests);
  const quarterly = computeVolumeByQuarter(requests);

  const statusCounts = [kpis.completed, kpis.inProgress, requests.filter(r => r.status === 'Pending').length, kpis.cancelled];
  const statusLabels = ['Completed', 'In Progress', 'Pending', 'Cancelled'];

  container.innerHTML = `
    <div>
      <p class="page-title">Executive Overview</p>
      <p class="page-subtitle">High-level snapshot of Curators team activity and impact</p>

      <div class="kpi-grid" style="margin-bottom:24px">
        ${kpiCard({ label: 'Total Requests', value: fmt.number(kpis.total), accent: 'primary' })}
        ${kpiCard({ label: 'Completed', value: fmt.number(kpis.completed), sub: `${fmt.pct(kpis.completionRate)} completion rate`, accent: 'success' })}
        ${kpiCard({ label: 'In Progress', value: fmt.number(kpis.inProgress), accent: 'primary' })}
        ${kpiCard({ label: 'Pending', value: fmt.number(requests.filter(r => r.status === 'Pending').length), accent: 'warning' })}
        ${kpiCard({ label: 'Cancelled', value: fmt.number(kpis.cancelled), accent: 'danger' })}
        ${kpis.hasDueDate ? kpiCard({ label: 'Overdue', value: fmt.number(kpis.overdue), sub: kpis.overdue > 0 ? 'Needs attention' : 'All on track', accent: kpis.overdue > 0 ? 'danger' : 'success' }) : ''}
        ${kpiCard({ label: 'Avg Delivery Time', value: kpis.avgDelivery ? fmt.days(kpis.avgDelivery) : '—', sub: 'Completed requests', accent: 'info' })}
        ${kpiCard({ label: 'Total Assets Created', value: fmt.number(kpis.totalAssets), accent: 'success' })}
        ${kpis.hasPipeline ? kpiCard({ label: 'Influenced Pipeline', value: fmt.currency(kpis.influencedPipeline), accent: 'info' }) : ''}
        ${kpis.hasPipeline ? kpiCard({ label: 'Sourced Pipeline', value: fmt.currency(kpis.sourcedPipeline), accent: 'info' }) : ''}
        ${kpis.hasAccounts ? kpiCard({ label: 'Accounts Touched', value: fmt.number(kpis.accountsTouched), accent: 'primary' }) : ''}
      </div>

      <div class="section-grid section-grid-2" style="margin-bottom:16px">
        <div class="card">
          <div class="card-header"><span class="card-title">Requests by Month</span></div>
          <div class="card-body"><div class="chart-container"><canvas id="ov-monthly"></canvas></div></div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Status Distribution</span></div>
          <div class="card-body"><div class="chart-container"><canvas id="ov-status"></canvas></div></div>
        </div>
      </div>

      <div class="card" style="margin-bottom:16px">
        <div class="card-header"><span class="card-title">Requests by Quarter — Submitted vs Completed</span></div>
        <div class="card-body"><div class="chart-container"><canvas id="ov-quarterly"></canvas></div></div>
      </div>

      ${!kpis.hasPipeline ? `
      <div class="card">
        <div class="card-header"><span class="card-title">Pipeline Impact</span></div>
        <div class="card-body">
          <div class="placeholder-section">
            <div style="font-size:24px;margin-bottom:8px">📊</div>
            Pipeline data not yet loaded. Upload a pipeline CSV to see influenced and sourced pipeline figures.
          </div>
        </div>
      </div>` : ''}
    </div>`;

  // Monthly bar chart
  renderBarChart('ov-monthly', {
    labels: monthly.map(d => d.label),
    datasets: [
      { label: 'Submitted', data: monthly.map(d => d.submitted), backgroundColor: '#93C5FD' },
      { label: 'Completed', data: monthly.map(d => d.completed), backgroundColor: '#0070F2' }
    ],
    height: 260
  });

  // Status doughnut
  renderDoughnutChart('ov-status', {
    labels: statusLabels,
    data: statusCounts,
    colors: ['#107E3E', '#3730A3', '#F9A825', '#BB0000'],
    height: 260
  });

  // Quarterly grouped bar
  renderBarChart('ov-quarterly', {
    labels: quarterly.map(d => d.label),
    datasets: [
      { label: 'Submitted', data: quarterly.map(d => d.submitted), backgroundColor: '#93C5FD' },
      { label: 'Completed', data: quarterly.map(d => d.completed), backgroundColor: '#0070F2' },
      { label: 'Cancelled', data: quarterly.map(d => d.cancelled), backgroundColor: '#FCA5A5' }
    ],
    height: 260
  });
}
