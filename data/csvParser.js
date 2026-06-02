// CSV parsing and field mapping for SharePoint List and SAP CRM exports
// Add additional column name aliases as needed for your specific exports.

// ── Field mappings: map real CSV column names → internal field names ──────────

const REQUEST_FIELD_MAP = {
  requestId:              ['Request ID', 'RequestID', 'ID', 'request_id', 'LIST_ID', 'Item ID', 'SourceKey', 'SourceID'],
  campaignId:             ['Campaign ID', 'CampaignID', 'campaign_id', 'CAMP_ID', 'Campaign Number', 'Campaign No', 'Campaign/WBS Code'],
  campaignName:           ['Campaign Name', 'Title', 'campaign_name', 'CAMPAIGN', 'Name'],
  requester:              ['Requester', 'Requested By', 'requester', 'Created By', 'AUTHOR'],
  requesterRole:          ['Requester Role', 'Role', 'requester_role', 'ROLE', 'Requestor Role'],
  region:                 ['Region', 'GEO', 'region', 'Geography', 'Region Name (level 2)', 'SourceListName'],
  mu:                     ['MU', 'Market Unit', 'mu', 'Market_Unit', 'Sub-Region', 'Region Name (level 2)', 'SourceListName'],
  industry:               ['Industry', 'Vertical', 'industry', 'INDUSTRY', 'Industry Vertical', 'Industry (MC)'],
  lob:                    ['LoB', 'Line of Business', 'lob', 'LOB', 'Line_of_Business'],
  solutionArea:           ['Solution Area', 'Solution', 'solution_area', 'SOLUTION', 'Product Area', 'Solution Area L1', 'Solution Area L2'],
  campaignType:           ['Campaign Type', 'Type', 'campaign_type', 'CAMP_TYPE', 'Tactic Type'],
  assetType:              ['Asset Type', 'asset_type', 'ASSET_TYPE', 'DAT Type', 'Deliverable Type', 'Digital Assets team support'],
  status:                 ['Request Status', 'Status', 'status', 'STATE'],
  assignedTo:             ['Assigned To', 'Owner', 'Curator', 'assigned_to', 'CURATOR', 'DAT Owner'],
  submittedDate:          ['Submitted Date', 'Created', 'Created Date', 'submitted_date', 'CREATED_ON', 'Date Submitted', 'Request Date', 'Creado', 'Execution Start Date'],
  completedDate:          ['Completed Date', 'Completion Date', 'completed_date', 'CLOSED_ON', 'Date Completed', 'Closed Date'],
  dueDate:                ['Due Date', 'Deadline', 'due_date', 'DUE_ON', 'Target Date', 'Execution End Date'],
  datSupportedNeededLink: ['DAT Supported Needed', 'Asset Link', 'Link', 'dat_link', 'ASSET_URL', 'Deliverable Link', 'DAT link for Content'],
  influencedPipeline:     ['Influenced Pipeline', 'Influenced Pipe', 'influenced_pipeline', 'INF_PIPE', 'Influenced $'],
  sourcedPipeline:        ['Sourced Pipeline', 'Sourced Pipe', 'sourced_pipeline', 'SRC_PIPE', 'Sourced $'],
  accountsTouched:        ['Accounts Touched', 'Accounts', 'accounts_touched', 'ACCOUNTS', 'Account Count']
};

const PIPELINE_FIELD_MAP = {
  requestId:    ['Request ID', 'RequestID', 'request_id', 'LIST_ID'],
  campaignId:   ['Campaign ID', 'CampaignID', 'campaign_id'],
  opportunityId:['Opportunity ID', 'Opp ID', 'opp_id', 'OPPORTUNITY_ID', 'Opportunity Number'],
  accountName:  ['Account Name', 'Account', 'account_name', 'ACCOUNT', 'Company'],
  amount:       ['Amount', 'Pipeline Amount', 'Value', 'amount', 'AMOUNT', 'Opportunity Value'],
  type:         ['Type', 'Pipeline Type', 'type', 'PIPE_TYPE'],  // 'Influenced' | 'Sourced'
  stage:        ['Stage', 'Opp Stage', 'stage', 'OPP_STAGE', 'Sales Stage'],
  closeDate:    ['Close Date', 'Expected Close', 'close_date', 'CLOSE_DATE', 'Expected Close Date'],
  region:       ['Region', 'GEO', 'region'],
  industry:     ['Industry', 'industry'],
  lob:          ['LoB', 'lob', 'LOB'],
  solutionArea: ['Solution Area', 'solution_area'],
  campaignType: ['Campaign Type', 'campaign_type'],
  assignedTo:   ['Assigned To', 'Owner', 'assigned_to'],
  assetType:    ['Asset Type', 'asset_type']
};

// ── Status normalization ──────────────────────────────────────────────────────

const STATUS_NORMALIZE = {
  'complete': 'Completed', 'completed': 'Completed', 'done': 'Completed', 'closed': 'Completed', 'delivered': 'Completed',
  'in progress': 'In Progress', 'inprogress': 'In Progress', 'wip': 'In Progress', 'active': 'In Progress', 'open': 'In Progress', 'execution in progress': 'In Progress',
  'pending': 'Pending', 'new': 'Pending', 'submitted': 'Pending', 'not started': 'Pending', 'requested': 'Pending',
  'waiting': 'Waiting for Feedback', 'waiting for feedback': 'Waiting for Feedback',
  'no action needed': 'No Action Needed',
  'cancelled': 'Cancelled', 'canceled': 'Cancelled', 'rejected': 'Cancelled', 'withdrawn': 'Cancelled',
  'out of scope': 'Out of Scope'
};

// ── Asset type normalization ──────────────────────────────────────────────────

const ASSET_NORMALIZE = {
  'outreach': 'Outreach sequence', 'outreach sequence': 'Outreach sequence', 'email sequence': 'Outreach sequence', 'sequence': 'Outreach sequence',
  'folloze': 'Folloze board', 'folloze board': 'Folloze board', 'microsite': 'Folloze board',
  'one pager': 'One pager', '1 pager': 'One pager', 'onepager': 'One pager', 'fact sheet': 'One pager', 'datasheet': 'One pager',
  'campaign asset kit': 'Campaign asset kit', 'asset kit': 'Campaign asset kit', 'kit': 'Campaign asset kit',
  'premium campaign package': 'Campaign asset kit', 'premium package': 'Campaign asset kit',
  'campaign assets kits': 'Campaign asset kit', 'campaign assets kit': 'Campaign asset kit',
  'webinar': 'Webinar package', 'webinar package': 'Webinar package', 'webinar kit': 'Webinar package'
};

function normalizeValue(map, val) {
  if (!val) return val;
  const lower = val.toString().toLowerCase().trim();
  return map[lower] || val;
}

// Handles SharePoint JSON-array fields like ["Healthcare"] or ["Finance","Sales"]
// Returns the first non-empty value as a plain string.
function parseJsonArrayField(val) {
  if (!val) return val;
  const s = val.toString().trim();
  if (!s.startsWith('[')) return s;
  try {
    const arr = JSON.parse(s);
    const first = Array.isArray(arr) ? arr.find(v => v && v.toString().trim()) : null;
    return first ? first.toString().trim() : s;
  } catch (_) {
    // Not valid JSON — strip brackets and quotes manually
    return s.replace(/^\["|"\]$|^\["?|"?\]$/g, '').replace(/","?/g, ', ').trim();
  }
}

function resolveField(headers, fieldMap, fieldName) {
  const aliases = fieldMap[fieldName] || [];
  for (const alias of aliases) {
    const idx = headers.findIndex(h => h.trim().toLowerCase() === alias.toLowerCase());
    if (idx !== -1) return idx;
  }
  return -1;
}

function buildColumnMap(headers, fieldMap) {
  const map = {};
  for (const fieldName of Object.keys(fieldMap)) {
    const idx = resolveField(headers, fieldMap, fieldName);
    map[fieldName] = idx; // -1 means not found
  }
  return map;
}

function parseNumber(v) {
  if (v == null || v === '') return null;
  const n = parseFloat(v.toString().replace(/[,$]/g, ''));
  return isNaN(n) ? null : n;
}

function parseDate(v) {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d) ? null : d.toISOString().split('T')[0];
}

// ── Public API ────────────────────────────────────────────────────────────────

export function parseRequestsCSV(csvText) {
  const result = window.Papa.parse(csvText, { header: true, skipEmptyLines: true });
  const headers = result.meta.fields || [];
  const colMap = buildColumnMap(headers, REQUEST_FIELD_MAP);
  const today = new Date();

  const rows = result.data.map((row, i) => {
    const get = (field) => {
      const idx = colMap[field];
      if (idx === -1 || idx == null) return null;
      const val = row[headers[idx]];
      return (val == null || val === '') ? null : val.toString().trim();
    };

    const status = normalizeValue(STATUS_NORMALIZE, get('status')) || 'Pending';
    const assetType = normalizeValue(ASSET_NORMALIZE, get('assetType')) || get('assetType');
    const completedDate = parseDate(get('completedDate'));
    const dueDate = parseDate(get('dueDate'));
    const datLink = get('datSupportedNeededLink');

    // JSON-array fields from SharePoint (e.g. ["Healthcare"])
    const industry = parseJsonArrayField(get('industry'));
    const solutionArea = parseJsonArrayField(get('solutionArea'));

    // Treat "To be Assigned" as unassigned
    const rawAssignedTo = get('assignedTo');
    const assignedTo = (rawAssignedTo && rawAssignedTo.toLowerCase() !== 'to be assigned') ? rawAssignedTo : null;

    // A campaign is completed when datSupportedNeededLink has a valid link
    const isReallyCompleted = datLink && datLink.startsWith('http');
    const effectiveStatus = isReallyCompleted ? 'Completed' : status;

    const isOverdue = dueDate && effectiveStatus !== 'Completed' && effectiveStatus !== 'Cancelled'
      && new Date(dueDate) < today;

    return {
      requestId:              get('requestId') || `ROW-${i + 1}`,
      campaignId:             get('campaignId'),
      campaignName:           get('campaignName'),
      requester:              get('requester'),
      requesterRole:          get('requesterRole'),
      region:                 get('region'),
      mu:                     get('mu'),
      industry,
      lob:                    get('lob'),
      solutionArea,
      campaignType:           get('campaignType'),
      assetType,
      status:                 effectiveStatus,
      assignedTo,
      submittedDate:          parseDate(get('submittedDate')),
      completedDate,
      dueDate,
      isOverdue,
      datSupportedNeededLink: datLink,
      influencedPipeline:     parseNumber(get('influencedPipeline')),
      sourcedPipeline:        parseNumber(get('sourcedPipeline')),
      accountsTouched:        parseNumber(get('accountsTouched')),
      notes:                  ''
    };
  });

  return { rows, unmappedFields: headers.filter((_, i) => !Object.values(colMap).includes(i)) };
}

export function parsePipelineCSV(csvText) {
  const result = window.Papa.parse(csvText, { header: true, skipEmptyLines: true });
  const headers = result.meta.fields || [];
  const colMap = buildColumnMap(headers, PIPELINE_FIELD_MAP);

  const rows = result.data.map((row, i) => {
    const get = (field) => {
      const idx = colMap[field];
      if (idx === -1 || idx == null) return null;
      const val = row[headers[idx]];
      return (val == null || val === '') ? null : val.toString().trim();
    };

    return {
      requestId:    get('requestId'),
      campaignId:   get('campaignId'),
      opportunityId: get('opportunityId') || `OPP-${i + 1}`,
      accountName:  get('accountName'),
      amount:       parseNumber(get('amount')),
      type:         get('type') || 'Influenced',
      stage:        get('stage'),
      closeDate:    parseDate(get('closeDate')),
      region:       get('region'),
      industry:     get('industry'),
      lob:          get('lob'),
      solutionArea: get('solutionArea'),
      campaignType: get('campaignType'),
      assignedTo:   get('assignedTo'),
      assetType:    get('assetType')
    };
  });

  return { rows, unmappedFields: headers.filter((_, i) => !Object.values(colMap).includes(i)) };
}
