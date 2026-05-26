// Page 9 — Campaign Detail (searchable, sortable, drilldown)

import { DataTable, openDrilldown, statusBadge, requestDrilldownHtml } from '../components/uiComponents.js';
import { fmt, daysBetween } from '../utils/formatters.js';

export function renderCampaignDetail(container, requests) {
  const hasDueDate = requests.some(r => r.dueDate);
  const hasPipeline = requests.some(r => r.influencedPipeline || r.sourcedPipeline);

  container.innerHTML = `
    <div>
      <p class="page-title">Campaign Detail</p>
      <p class="page-subtitle">Drill into any request — click a row for full details</p>

      <div class="card">
        <div class="card-body" style="padding:0">
          <div id="campaign-table-container"></div>
        </div>
      </div>
    </div>`;

  const tableRows = requests.map(r => ({
    _rowId: r.requestId,
    ...r,
    deliveryDays: r.submittedDate && r.completedDate ? daysBetween(r.submittedDate, r.completedDate) : null
  }));

  const columns = [
    { key: 'requestId',     label: 'Request ID',    width: '110px', render: v => `<span class="font-mono" style="font-size:11px">${v}</span>` },
    { key: 'campaignName',  label: 'Campaign Name', render: (v) => `<span class="truncate" style="max-width:200px;display:block" title="${v || ''}">${v || '—'}</span>` },
    { key: 'status',        label: 'Status',        render: (v, row) => statusBadge(v) + (row.isOverdue ? ' ' + statusBadge('Overdue') : '') },
    { key: 'assetType',     label: 'Asset Type',    render: v => v || '—' },
    { key: 'campaignType',  label: 'Campaign Type', render: v => v || '—' },
    { key: 'region',        label: 'Region',        render: v => v || '—' },
    { key: 'industry',      label: 'Industry',      render: v => v || '—' },
    { key: 'lob',           label: 'LoB',           render: v => v || '—' },
    { key: 'assignedTo',    label: 'Assigned To',   render: v => v || '—' },
    { key: 'submittedDate', label: 'Submitted',     render: v => fmt.shortDate(v) },
    { key: 'completedDate', label: 'Completed',     render: v => fmt.shortDate(v) },
    { key: 'deliveryDays',  label: 'Delivery',      render: v => v != null ? fmt.days(v) : '—' },
    ...(hasPipeline ? [{ key: 'influencedPipeline', label: 'Inf. Pipeline', render: v => v ? fmt.currency(v) : '—' }] : [])
  ];

  new DataTable({
    container: document.getElementById('campaign-table-container'),
    columns,
    rows: tableRows,
    pageSize: 25,
    searchable: true,
    onRowClick: (row) => {
      const req = requests.find(r => r.requestId === row.requestId);
      if (req) openDrilldown(`Request ${req.requestId}`, requestDrilldownHtml(req));
    }
  });
}
