// Page 4 — How We Are Used / Adoption

import { computeByDimension, computeAdoptionTrend } from '../data/transformations.js';
import { renderBarChart, renderHorizontalBar, renderLineChart, destroyPageCharts } from '../components/charts.js';
import { fmt } from '../utils/formatters.js';

export function renderAdoption(container, requests) {
  destroyPageCharts('ad-');
  const byRegion      = computeByDimension(requests, 'region');
  const byRole        = computeByDimension(requests, 'requesterRole');
  const byCampType    = computeByDimension(requests, 'campaignType');
  const bySolution    = computeByDimension(requests, 'solutionArea');
  const byIndustry    = computeByDimension(requests, 'industry');
  const byLoB         = computeByDimension(requests, 'lob');
  const trend         = computeAdoptionTrend(requests);

  const top = (arr, n = 5) => arr.slice(0, n);

  container.innerHTML = `
    <div>
      <p class="page-title">How We Are Used — Adoption</p>
      <p class="page-subtitle">Who requests from us, from where, and for what</p>

      <div class="card" style="margin-bottom:16px">
        <div class="card-header"><span class="card-title">Adoption Trend — Requests & Unique Requesters by Quarter</span></div>
        <div class="card-body"><div class="chart-container"><canvas id="ad-trend"></canvas></div></div>
      </div>

      <div class="section-grid section-grid-2" style="margin-bottom:16px">
        <div class="card">
          <div class="card-header"><span class="card-title">Requests by Region</span></div>
          <div class="card-body"><div class="chart-container"><canvas id="ad-region"></canvas></div></div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Requests by Requester Role</span></div>
          <div class="card-body"><div class="chart-container"><canvas id="ad-role"></canvas></div></div>
        </div>
      </div>

      <div class="section-grid section-grid-2" style="margin-bottom:16px">
        <div class="card">
          <div class="card-header"><span class="card-title">Requests by Campaign Type</span></div>
          <div class="card-body"><div class="chart-container"><canvas id="ad-camptype"></canvas></div></div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Requests by Solution Area</span></div>
          <div class="card-body"><div class="chart-container"><canvas id="ad-solution"></canvas></div></div>
        </div>
      </div>

      <div class="section-grid section-grid-2" style="margin-bottom:16px">
        <div class="card">
          <div class="card-header"><span class="card-title">Top Requesting Industries</span></div>
          <div class="card-body"><div class="chart-container"><canvas id="ad-industry"></canvas></div></div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Requests by Line of Business</span></div>
          <div class="card-body"><div class="chart-container"><canvas id="ad-lob"></canvas></div></div>
        </div>
      </div>

      <div class="card" style="margin-bottom:16px">
        <div class="card-header"><span class="card-title">Top 5 Requesters by Volume</span></div>
        <div class="card-body">
          <table class="data-table">
            <thead><tr><th>Requester</th><th>Requests</th><th>Share</th></tr></thead>
            <tbody>${computeByDimension(requests, 'requester').slice(0, 10).map(d => `
              <tr>
                <td>${d.label}</td>
                <td>${fmt.number(d.count)}</td>
                <td><div class="progress-bar" style="width:120px"><div class="progress-fill" style="width:${Math.min(100,(d.count/requests.length)*100 * 3).toFixed(0)}%;background:#0070F2"></div></div></td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;

  renderLineChart('ad-trend', {
    labels: trend.map(d => d.label),
    datasets: [
      { label: 'Requests', data: trend.map(d => d.requests), borderColor: '#0070F2' },
      { label: 'Unique Requesters', data: trend.map(d => d.uniqueRequesters), borderColor: '#DF6E0C' }
    ],
    height: 240
  });

  renderHorizontalBar('ad-region', { labels: byRegion.map(d => d.label), data: byRegion.map(d => d.count), color: '#0070F2', height: 220 });
  renderHorizontalBar('ad-role', { labels: byRole.map(d => d.label), data: byRole.map(d => d.count), color: '#6200EA', height: 220 });
  renderHorizontalBar('ad-camptype', { labels: byCampType.map(d => d.label), data: byCampType.map(d => d.count), color: '#0099CC', height: 220 });
  renderHorizontalBar('ad-solution', { labels: bySolution.map(d => d.label), data: bySolution.map(d => d.count), color: '#107E3E', height: 240 });
  renderHorizontalBar('ad-industry', { labels: top(byIndustry).map(d => d.label), data: top(byIndustry).map(d => d.count), color: '#DF6E0C', height: 200 });
  renderHorizontalBar('ad-lob', { labels: byLoB.map(d => d.label), data: byLoB.map(d => d.count), color: '#354A5E', height: 240 });
}
