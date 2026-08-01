import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

export async function crawlAndSniff(url: string, logger: { info: (m: string) => void; error: (m: string) => void }) {
  logger.info(`starting cdp sniffer for url: ${url}`);

  const requestsMap = new Map<string, any>();
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    const client = await page.target().createCDPSession();
    await client.send('Network.enable');

    client.on('Network.requestWillBeSent', (event) => {
      const parsedUrl = new URL(event.request.url);
      requestsMap.set(event.requestId, {
        id: event.requestId,
        timestamp: event.wallTime * 1000,
        startMonotonic: event.timestamp,
        url: event.request.url,
        path: parsedUrl.pathname,
        method: event.request.method,
        resourceType: event.type || 'Other',
        status: 0,
        priority: event.request.initialPriority,
        initiator: event.initiator,
        requestHeaders: event.request.headers,
        requestBody: event.request.postData || null,
        responseHeaders: {},
        responseBody: null,
        duration: 0,
        protocol: '',
        remoteIPAddress: '',
        remotePort: 0,
        timing: null,
        fromDiskCache: false,
        cookies: []
      });
    });

    client.on('Network.responseReceived', (event) => {
      const reqEntry = requestsMap.get(event.requestId);
      if (reqEntry) {
        const resp = event.response;
        reqEntry.status = resp.status;
        reqEntry.responseHeaders = resp.headers;
        reqEntry.protocol = resp.protocol || '';
        reqEntry.remoteIPAddress = resp.remoteIPAddress || '';
        reqEntry.remotePort = resp.remotePort || 0;
        reqEntry.timing = resp.timing || null;
        reqEntry.fromDiskCache = resp.fromDiskCache || false;
      }
    });

    client.on('Network.loadingFinished', async (event) => {
      const reqEntry = requestsMap.get(event.requestId);
      if (reqEntry) {
        reqEntry.duration = Math.round((event.timestamp - reqEntry.startMonotonic) * 1000);
        try {
          const bodyResp = await client.send('Network.getResponseBody', { requestId: event.requestId });
          try {
            reqEntry.responseBody = JSON.parse(bodyResp.body);
          } catch {
            reqEntry.responseBody = bodyResp.body;
          }
        } catch {
          reqEntry.responseBody = null;
        }
      }
    });

    client.on('Network.loadingFailed', (event) => {
      const reqEntry = requestsMap.get(event.requestId);
      if (reqEntry) {
        reqEntry.status = -1;
        reqEntry.error = event.errorText;
        reqEntry.duration = Math.round((event.timestamp - reqEntry.startMonotonic) * 1000);
      }
    });

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const cookies = await page.cookies();
    const finalRequests = Array.from(requestsMap.values());
    for (const req of finalRequests) {
      req.cookies = cookies.filter(c => req.url.includes(c.domain));
      delete req.startMonotonic;
    }

    const trafficFilePath = path.join(process.cwd(), 'traffic.json');
    fs.writeFileSync(trafficFilePath, JSON.stringify(finalRequests, null, 2));

    return {
      status: 'success',
      url,
      totalCaptured: finalRequests.length,
      summary: finalRequests.map(r => ({
        id: r.id,
        method: r.method,
        path: r.path,
        type: r.resourceType,
        status: r.status,
        protocol: r.protocol,
        ip: r.remoteIPAddress,
        port: r.remotePort
      }))
    };
  } finally {
    await browser.close();
  }
}
