// Page 10 — Data Quality

import { detectDataQualityIssues, summarizeIssues } from '../data/transformations.js';
import { severityBadge } from '../components/uiComponents.js';
import { fmt } from '../utils/formatters.js';

export function renderDataQuality(container, requests, pipelineRecords) {
  const issues = detectDataQualityIssues(requests);
  const summary = summarizeIssues(issues);

  const warnings = issues.filter(i => i.severity === 'warning').length;
  const infos    = issues.filter(i => i.severity === 'info').length;
  const errors   = issues.filter(i => i.severity === 'error').length;

  const completedNoLink = requests.filter(r => r.status === 'Completed' && !r.datSupportedNeededLink).length;
  const missingIndustry = requests.filter(r => !r.industry).length;
  const missingLoB      = requests.filter(r => !r.lob).length;
  const missingAsset    = requests.filter(r => !r.assetType).length;
  const missingAssignee = requests.filter(r => !r.assignedTo).length;

  // Campaign ID uniqueness
  const campIdCounts = {};
  requests.forEach(r => { if (r.campaignId) campIdCounts[r.campaignId] = (campIdCounts[r.campaignId] || 0) + 1; });
  const dupCampIds = Object.entries(campIdCounts).filter(([, c]) => c > 1).length;

  container.innerHTML = `
    <div>
      <p class="page-title">Data Quality</p>
      <p class="page-subtitle">Automated checks on the loaded dataset — review and fix in your source system</p>

      <div class="kpi-grid" style="margin-bottom:20px">
        <div class="kpi-card ${errors > 0 ? 'danger' : 'success'}">
          <div class="kpi-label">Errors</div>
          <div class="kpi-value">${fmt.number(errors)}</div>
          <div class="kpi-sub">Blocking data issues</div>
        </div>
        <div class="kpi-card ${warnings > 0 ? 'warning' : 'success'}">
          <div class="kpi-label">Warnings</div>
          <div class="kpi-value">${fmt.number(warnings)}</div>
          <div class="kpi-sub">Recommended to fix</div>
        </div>
        <div class="kpi-card info">
          <div class="kpi-label">Info</div>
          <div class="kpi-value">${fmt.number(infos)}</div>
          <div class="kpi-sub">Low-priority gaps</div>
        </div>
        <div class="kpi-card ${dupCampIds > 0 ? 'warning' : 'success'}">
          <div class="kpi-label">Duplicate Campaign IDs</div>
          <div class="kpi-value">${fmt.number(dupCampIds)}</div>
          <div class="kpi-sub">Use Request ID as primary key</div>
        </div>
      </div>

      <div class="section-grid section-grid-2" style="margin-bottom:16px">
        <div class="card">
          <div class="card-header"><span class="card-title">Missing Fields Summary</span></div>
          <div class="card-body">
            <table class="data-table">
              <thead><tr><th>Field</th><th>Records Missing</th><th>% of Total</th></tr></thead>
              <tbody>
                ${[
                  ['Industry', missingIndustry],
                  ['Line of Business (LoB)', missingLoB],
                  ['Asset Type', missingAsset],
                  ['Assigned To', missingAssignee],
                  ['Completed requests without asset link', completedNoLink]
                ].map(([label, count]) => `
                  <tr>
                    <td>${label}</td>
                    <td>${count > 0 ? `<span class="badge ${count > 5 ? 'badge-cancelled' : 'badge-pending'}">${count}</span>` : '<span class="text-success">0</span>'}</td>
                    <td>${requests.length > 0 ? fmt.pct((count / requests.length) * 100) : '—'}</td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><span class="card-title">Issue Type Summary</span></div>
          <div class="card-body">
            <table class="data-table">
              <thead><tr><th>Issue Type</th><th>Severity</th><th>Count</th></tr></thead>
              <tbody>${summary.length ? summary.map(s => `
                <tr>
                  <td>${s.type}</td>
                  <td>${severityBadge(s.severity)}</td>
                  <td><strong>${s.count}</strong></td>
                </tr>`).join('') : '<tr><td colspan="3" class="empty-state">No issues detected. Great data quality!</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="card" style="margin-bottom:16px">
        <div class="card-header">
          <span class="card-title">All Issues</span>
          <span style="font-size:11px;color:#6A7380">${issues.length} total — showing up to 100</span>
        </div>
        <div class="card-body" style="padding:0">
          <div class="data-table-wrap">
            <table class="data-table">
              <thead><tr><th>Severity</th><th>Issue Type</th><th>Description</th><th>Affected IDs</th></tr></thead>
              <tbody>${issues.slice(0, 100).length ? issues.slice(0, 100).map(i => `
                <tr>
                  <td>${severityBadge(i.severity)}</td>
                  <td style="white-space:nowrap">${i.type}</td>
                  <td style="font-size:12px;max-width:320px">${i.message}</td>
                  <td style="font-size:11px;color:#6A7380;white-space:nowrap">${(i.affectedIds || []).slice(0,3).join(', ')}${i.affectedIds?.length > 3 ? ` +${i.affectedIds.length - 3}` : ''}</td>
                </tr>`).join('') : '<tr><td colspan="4" class="empty-state">No issues found.</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><span class="card-title">Data Load Summary</span></div>
        <div class="card-body">
          <table class="data-table">
            <thead><tr><th>Metric</th><th>Value</th></tr></thead>
            <tbody>
              <tr><td>Total requests loaded</td><td><strong>${requests.length}</strong></td></tr>
              <tr><td>Total pipeline records loaded</td><td><strong>${pipelineRecords.length}</strong></td></tr>
              <tr><td>Unique Campaign IDs</td><td><strong>${Object.keys(campIdCounts).length}</strong></td></tr>
              <tr><td>Duplicate Campaign IDs</td><td>${dupCampIds > 0 ? `<span class="badge badge-pending">${dupCampIds}</span>` : '<span class="text-success">0</span>'}</td></tr>
              <tr><td>Requests with due date</td><td><strong>${requests.filter(r => r.dueDate).length}</strong></td></tr>
              <tr><td>Requests with pipeline data</td><td><strong>${requests.filter(r => r.influencedPipeline || r.sourcedPipeline).length}</strong></td></tr>
              <tr><td>Overdue requests</td><td><strong>${requests.filter(r => r.isOverdue).length}</strong></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
}
