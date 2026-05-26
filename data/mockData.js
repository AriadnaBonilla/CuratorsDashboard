// Mock data generator — replace with real CSV imports
// All taxonomy values are discovered dynamically; do not hardcode in pages.

const TEAM_MEMBERS = ['Sarah Chen', 'Marcus Johnson', 'Elena Rodriguez', 'David Kim', 'Priya Patel', 'James Wilson'];
const INDUSTRIES = ['Financial Services', 'Healthcare', 'Manufacturing', 'Retail', 'Technology', 'Public Sector', 'Energy & Utilities', 'Telecommunications'];
const LOBS = ['Sales', 'Marketing', 'Finance', 'Operations', 'HR', 'IT', 'Supply Chain'];
const SOLUTION_AREAS = ['SAP S/4HANA', 'SAP SuccessFactors', 'SAP Analytics Cloud', 'SAP Ariba', 'SAP CX / CRM', 'SAP BTP', 'SAP IBP'];
const REGIONS = ['North America', 'EMEA', 'APJ', 'LATAM'];
const MUS = {
  'North America': ['US West', 'US East', 'US Central', 'Canada'],
  'EMEA': ['UK & Ireland', 'DACH', 'France', 'Nordics', 'Southern Europe', 'MEA'],
  'APJ': ['ANZ', 'Japan', 'Southeast Asia', 'India', 'Greater China'],
  'LATAM': ['Brazil', 'Mexico', 'Southern Cone', 'Andean']
};
const REQUESTER_ROLES = ['Account Executive', 'Field Sales Manager', 'Marketing Manager', 'Industry Principal', 'Solution Advisor', 'Business Development Rep', 'Customer Success Manager'];
const ASSET_TYPES = ['Outreach sequence', 'Folloze board', 'One pager', 'Campaign asset kit', 'Webinar package'];
const CAMPAIGN_TYPES = ['Prospecting', 'Pipeline Acceleration', 'Cross-sell', 'Upsell', 'Event Follow-up', 'Partner'];
const STATUSES = ['Completed', 'In Progress', 'Pending', 'Cancelled'];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function pickW(arr, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < arr.length; i++) { r -= weights[i]; if (r <= 0) return arr[i]; }
  return arr[arr.length - 1];
}
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function addDays(date, n) { const d = new Date(date); d.setDate(d.getDate() + n); return d; }
function isoDate(d) { return d.toISOString().split('T')[0]; }

// Deterministic seed to produce consistent demo data
let seed = 42;
function seededRand() {
  seed = (seed * 1664525 + 1013904223) & 0xffffffff;
  return (seed >>> 0) / 4294967296;
}
function seededPick(arr) { return arr[Math.floor(seededRand() * arr.length)]; }
function seededPickW(arr, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = seededRand() * total;
  for (let i = 0; i < arr.length; i++) { r -= weights[i]; if (r <= 0) return arr[i]; }
  return arr[arr.length - 1];
}
function seededInt(min, max) { return Math.floor(seededRand() * (max - min + 1)) + min; }

export function generateMockRequests(count = 120) {
  seed = 42;
  const requests = [];
  const startDate = new Date('2024-01-01');
  const endDate = new Date('2025-05-20');
  const totalDays = Math.floor((endDate - startDate) / 86400000);

  for (let i = 1; i <= count; i++) {
    const region = seededPick(REGIONS);
    const muList = MUS[region];
    const mu = seededPick(muList);
    const submittedDate = addDays(startDate, seededInt(0, totalDays));
    const status = seededPickW(STATUSES, [50, 30, 12, 8]);
    const assetType = seededPickW(ASSET_TYPES, [30, 20, 25, 15, 10]);
    const industry = seededPick(INDUSTRIES);
    const lob = seededPick(LOBS);
    const solutionArea = seededPick(SOLUTION_AREAS);
    const campaignType = seededPick(CAMPAIGN_TYPES);
    const requesterRole = seededPick(REQUESTER_ROLES);
    const assignedTo = seededPick(TEAM_MEMBERS);

    const deliveryDays = seededInt(5, 21);
    const completedDate = status === 'Completed' ? isoDate(addDays(submittedDate, deliveryDays)) : null;
    const dueDate = seededRand() > 0.3 ? isoDate(addDays(submittedDate, seededInt(10, 25))) : null;

    const today = new Date('2025-05-26');
    const isOverdue = dueDate && !completedDate && new Date(dueDate) < today;

    const influencedPipeline = status === 'Completed' && seededRand() > 0.2
      ? seededInt(50, 500) * 1000 : null;
    const sourcedPipeline = influencedPipeline && seededRand() > 0.5
      ? Math.round(influencedPipeline * seededRand() * 0.4) : null;
    const accountsTouched = influencedPipeline ? seededInt(1, 12) : null;

    // Purposely create a few duplicate campaign IDs to demonstrate data quality checks
    const campaignIdNum = i <= 5 ? i : (seededRand() > 0.05 ? i : seededInt(1, 5));

    requests.push({
      requestId: `REQ-${String(i).padStart(4, '0')}`,
      campaignId: `CAMP-${String(campaignIdNum).padStart(4, '0')}`,
      campaignName: buildCampaignName(industry, campaignType, solutionArea),
      requester: buildRequesterName(i),
      requesterRole,
      region,
      mu,
      industry,
      lob,
      solutionArea,
      campaignType,
      assetType,
      status,
      assignedTo,
      submittedDate: isoDate(submittedDate),
      completedDate,
      dueDate,
      isOverdue,
      datSupportedNeededLink: status === 'Completed' ? `https://sharepoint.example.com/assets/REQ-${String(i).padStart(4, '0')}` : null,
      influencedPipeline,
      sourcedPipeline,
      accountsTouched,
      notes: ''
    });
  }
  return requests;
}

function buildCampaignName(industry, type, solution) {
  const prefixes = { 'Prospecting': 'New Logo', 'Pipeline Acceleration': 'Pipe Accel', 'Cross-sell': 'X-Sell', 'Upsell': 'Upsell', 'Event Follow-up': 'Post-Event', 'Partner': 'Partner Collab' };
  return `${prefixes[type] || type} | ${industry} | ${solution.split(' ')[1] || solution}`;
}

const FIRST_NAMES = ['James', 'Maria', 'Robert', 'Jennifer', 'Michael', 'Linda', 'David', 'Barbara', 'William', 'Susan', 'Richard', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen', 'Chris', 'Lisa', 'Daniel', 'Nancy'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Martinez', 'Wilson', 'Anderson', 'Taylor', 'Thomas', 'Jackson', 'White', 'Harris', 'Clark', 'Lewis', 'Robinson', 'Walker'];
function buildRequesterName(i) {
  return `${FIRST_NAMES[i % FIRST_NAMES.length]} ${LAST_NAMES[Math.floor(i / FIRST_NAMES.length) % LAST_NAMES.length]}`;
}

export function generateMockPipeline(requests) {
  // Generate pipeline records linked to completed requests
  const pipeline = [];
  const completed = requests.filter(r => r.status === 'Completed' && r.influencedPipeline);
  completed.forEach(req => {
    if (req.influencedPipeline) {
      pipeline.push({
        requestId: req.requestId,
        campaignId: req.campaignId,
        opportunityId: `OPP-${req.requestId.replace('REQ-', '')}`,
        accountName: `${req.industry} Corp ${Math.floor(Math.random() * 900) + 100}`,
        amount: req.influencedPipeline,
        type: 'Influenced',
        stage: pick(['Qualified', 'Value Prop', 'Id. Decision Makers', 'Perception Analysis', 'Proposal/Price Quote', 'Negotiation/Review']),
        closeDate: req.completedDate ? isoDate(addDays(new Date(req.completedDate), randInt(30, 180))) : null,
        region: req.region,
        industry: req.industry,
        lob: req.lob,
        solutionArea: req.solutionArea,
        campaignType: req.campaignType,
        assignedTo: req.assignedTo,
        assetType: req.assetType
      });
    }
    if (req.sourcedPipeline) {
      pipeline.push({
        requestId: req.requestId,
        campaignId: req.campaignId,
        opportunityId: `OPP-${req.requestId.replace('REQ-', '')}-S`,
        accountName: `${req.industry} Solutions ${Math.floor(Math.random() * 900) + 100}`,
        amount: req.sourcedPipeline,
        type: 'Sourced',
        stage: pick(['Qualified', 'Value Prop', 'Proposal/Price Quote']),
        closeDate: req.completedDate ? isoDate(addDays(new Date(req.completedDate), randInt(60, 240))) : null,
        region: req.region,
        industry: req.industry,
        lob: req.lob,
        solutionArea: req.solutionArea,
        campaignType: req.campaignType,
        assignedTo: req.assignedTo,
        assetType: req.assetType
      });
    }
  });
  return pipeline;
}

// Sample CSV content for the data folder README
export const SAMPLE_REQUESTS_CSV_HEADER = `Request ID,Campaign ID,Campaign Name,Requester,Requester Role,Region,MU,Industry,LoB,Solution Area,Campaign Type,Asset Type,Status,Assigned To,Submitted Date,Completed Date,Due Date,DAT Supported Needed,Influenced Pipeline,Sourced Pipeline,Accounts Touched`;

export const SAMPLE_PIPELINE_CSV_HEADER = `Request ID,Campaign ID,Opportunity ID,Account Name,Amount,Type,Stage,Close Date,Region,Industry,LoB,Solution Area,Campaign Type,Assigned To,Asset Type`;
