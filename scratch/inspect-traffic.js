import * as fs from 'fs';
import * as path from 'path';

const action = process.argv[2];
const param = process.argv[3];

const trafficFile = path.join(process.cwd(), 'traffic.json');
if (!fs.existsSync(trafficFile)) {
  console.error('error: no traffic logs found. run the sniffer first.');
  process.exit(1);
}

const traffic = JSON.parse(fs.readFileSync(trafficFile, 'utf8'));

if (action === 'list') {
  console.log('captured network requests:');
  console.log('id'.padEnd(15) + 'method'.padEnd(8) + 'type'.padEnd(12) + 'status'.padEnd(8) + 'duration'.padEnd(10) + 'path');
  console.log('-'.repeat(100));
  for (const req of traffic) {
    const statusText = req.status === -1 ? 'failed' : req.status;
    console.log(
      `${req.id}`.padEnd(15) +
      `${req.method}`.padEnd(8) +
      `${req.resourceType}`.padEnd(12) +
      `${statusText}`.padEnd(8) +
      `${req.duration}ms`.padEnd(10) +
      `${req.path}`
    );
  }
} else if (action === 'view') {
  if (!param) {
    console.error('error: please specify a request id');
    process.exit(1);
  }
  const req = traffic.find(r => r.id === param);
  if (!req) {
    console.error(`error: request with id ${param} not found.`);
    process.exit(1);
  }
  console.log(`request details [id: ${req.id}]`);
  console.log('url:', req.url);
  console.log('method:', req.method);
  console.log('type:', req.resourceType);
  console.log('status:', req.status);
  console.log('protocol:', req.protocol);
  console.log('remote server:', `${req.remoteIPAddress}:${req.remotePort}`);
  console.log('duration:', `${req.duration}ms`);
  
  console.log('\nrequest headers:');
  console.log(JSON.stringify(req.requestHeaders, null, 2));
  
  if (req.requestBody) {
    console.log('\nrequest body:');
    console.log(typeof req.requestBody === 'object' ? JSON.stringify(req.requestBody, null, 2) : req.requestBody);
  }
  
  console.log('\nresponse headers:');
  console.log(JSON.stringify(req.responseHeaders, null, 2));
  
  if (req.responseBody) {
    console.log('\nresponse body:');
    console.log(typeof req.responseBody === 'object' ? JSON.stringify(req.responseBody, null, 2) : req.responseBody);
  }
} else if (action === 'filter') {
  if (!param) {
    console.error('error: please specify a resource type (e.g., Fetch, Script, Image)');
    process.exit(1);
  }
  const filtered = traffic.filter(r => r.resourceType.toLowerCase() === param.toLowerCase());
  console.log(`filtered network requests (type: ${param}):`);
  console.log('id'.padEnd(15) + 'method'.padEnd(8) + 'status'.padEnd(8) + 'duration'.padEnd(10) + 'path');
  console.log('-'.repeat(100));
  for (const req of filtered) {
    const statusText = req.status === -1 ? 'failed' : req.status;
    console.log(
      `${req.id}`.padEnd(15) +
      `${req.method}`.padEnd(8) +
      `${statusText}`.padEnd(8) +
      `${req.duration}ms`.padEnd(10) +
      `${req.path}`
    );
  }
} else {
  console.log('usage:');
  console.log('  node scratch/inspect-traffic.js list             - list all captured requests');
  console.log('  node scratch/inspect-traffic.js filter <type>    - filter by type (e.g. Fetch, Script)');
  console.log('  node scratch/inspect-traffic.js view <id>        - view detailed headers/payloads of a request');
}
