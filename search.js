// SOC Analyst L1 job tracker — daily automation at 12:00 PM
// Setup: npm install node-cron @anthropic-ai/sdk
// Run: node job-tracker.js (keep terminal open or use pm2)

const cron = require('node-cron');
const Anthropic = require('@anthropic-ai/sdk');

const GMAIL_ADDRESS = 'YOUR_GMAIL@gmail.com';  // <-- change this
const client = new Anthropic();                  // uses ANTHROPIC_API_KEY env var

async function runWorkflow() {
  const today = new Date().toLocaleDateString('en-IN', { dateStyle: 'long' });
  console.log('[' + today + '] Starting SOC job search...');

  // Step 1: Search for jobs using web search
  const searchResp = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    tools: [{ type: 'web_search_20250305', name: 'web_search' }],
    messages: [{
      role: 'user',
      content: `Search LinkedIn Jobs, Indeed India, Naukri, Glassdoor, AngelList,
RemoteOK, WeWorkRemotely for: SOC Analyst L1, Junior SOC Analyst,
Entry-level SOC Analyst, Cybersecurity Analyst Fresher jobs posted last 24 hours.
Locations: Bangalore, Hyderabad, Pune, Chennai, Mumbai, Delhi NCR, Remote, Worldwide.
Experience: 0-1 year / Fresher / Entry-level only.
Also check career pages: TCS, Wipro, Infosys, Accenture, Cognizant, HCL, IBM,
Capgemini, Deloitte, EY, KPMG, PwC, Cisco, Palo Alto Networks, CrowdStrike.
Return ONLY valid JSON array, no markdown:
[{"title":"","company":"","location":"","experience":"","postedDate":"",
"source":"","applyUrl":"","description":""}]`
    }]
  });

  let jobs = [];
  try {
    const text = searchResp.content.filter(b => b.type === 'text').map(b => b.text).join('');
    const match = text.match(/\[\s\S]*?\]/);
    if (match) jobs = JSON.parse(match[0]);
    // Deduplicate by company + title
    const seen = new Set();
    jobs = jobs.filter(j => {
      const key = (j.company + '|' + j.title).toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key); return true;
    });
  } catch(e) { console.error('Parse error:', e.message); }

  console.log('Found ' + jobs.length + ' unique jobs');

  // Step 2: Compose and send email via Gmail MCP
  const subject = jobs.length > 0
    ? 'Daily SOC Analyst L1 / Cybersecurity Fresher Jobs — ' + today + ' — ' + jobs.length + ' new openings'
    : 'Daily SOC Analyst L1 / Fresher Jobs — ' + today + ' — No new openings today';

  const jobList = jobs.length > 0
    ? jobs.map((j, i) =>
        (i + 1) + '. ' + j.title + ' @ ' + j.company +
        ' | ' + j.location + ' | ' + j.experience +
        ' | Source: ' + j.source +
        ' | Apply: ' + j.applyUrl +
        ' | ' + j.description
      ).join('\n')
    : 'No new SOC Analyst L1 or fresher cybersecurity roles were posted in the last 24 hours.';

  await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: 'Send an HTML email via Gmail to ' + GMAIL_ADDRESS + '.\n' +
        'Subject: ' + subject + '\n\n' +
        'Create a clean, professional HTML digest email. Include:\n' +
        '- Header: "SOC Analyst L1 / Cybersecurity Fresher Jobs" with shield icon\n' +
        '- Summary: ' + jobs.length + ' jobs found on ' + today + '\n' +
        '- Job listings as styled table/cards with all details and Apply links\n' +
        '- Footer: "Next run: tomorrow 12:00 PM · Automated digest"\n\n' +
        'Job data:\n' + jobList + '\n\n' +
        'Send this email now.'
    }],
    mcp_servers: [{ type: 'url', url: 'https://gmailmcp.googleapis.com/mcp/v1', name: 'gmail-mcp' }]
  });

  console.log('Email sent to ' + GMAIL_ADDRESS);
}

// Schedule: 12:00 PM every day, auto-detect local timezone
const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
cron.schedule('0 12 * * *', () => {
  runWorkflow().catch(err => console.error('Workflow error:', err));
}, { timezone: tz });

console.log('SOC job tracker active — daily at 12:00 PM (' + tz + ')');
console.log('Running once now to verify...');
runWorkflow().catch(err => console.error('Initial run error:', err));
