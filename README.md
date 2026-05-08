Here's your complete daily SOC Analyst L1 job tracker workflow. Here's how everything works:
Running the workflow
Enter your Gmail address in the field and click "Run workflow now." It will execute 4 live API calls in sequence: two web searches covering LinkedIn, Indeed, Naukri, Glassdoor, company career pages, and remote boards, followed by deduplication, then a Gmail MCP call to compose and send the HTML digest directly to your inbox.
What the email contains

Subject line: Daily SOC Analyst L1 / Cybersecurity Fresher Jobs — [Date] — [N] new openings
Styled HTML table with role, company, location, experience, source, and clickable Apply links
Summary breakdown by location and source
Footer with generation time and next run timestamp
If zero jobs are found, a brief "no openings today" notice is still sent

Automating at 12:00 PM daily
Browser artifacts can't self-schedule — click "Copy script" to get the ready-to-run Node.js cron script. To set it up:
bashmkdir soc-tracker && cd soc-tracker
npm install node-cron @anthropic-ai/sdk
# edit GMAIL_ADDRESS in the script
ANTHROPIC_API_KEY=your_key node job-tracker.js
Use pm2 start job-tracker.js to keep it running persistently in the background. It auto-detects your local timezone so the 12:00 PM trigger is always accurate.
Sources covered — LinkedIn, Indeed India, Naukri, Glassdoor, AngelList, RemoteOK, WeWorkRemotely, plus career pages for 30+ companies including TCS, Wipro, Infosys, Accenture, IBM, Cisco, CrowdStrike, Palo Alto Networks, and more.
