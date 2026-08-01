import { ToolDecorator as Tool, Widget, ExecutionContext, z } from '@nitrostack/core';
import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

export interface CapturedRequest {
  id: string;
  timestamp: number;
  duration: number;
  url: string;
  path: string;
  method: string;
  status: number;
  requestHeaders: Record<string, string>;
  requestBody: any;
  responseHeaders: Record<string, string>;
  responseBody: any;
  cookies: any[];
}

export class NetsniffTools {
  @Tool({
    name: 'sniff_website',
    description: 'crawls a website in the background, intercepts xhr and fetch requests, and returns formatted network logs',
    inputSchema: z.object({
      url: z.string().url().describe('the website url to crawl and sniff')
    })
  })
  @Widget('netsniff-explorer')
  async sniffWebsite(input: { url: string }, ctx: ExecutionContext) {
    ctx.logger.info(`starting sniffer for url: ${input.url}`);

    const capturedRequests: CapturedRequest[] = [];
    const requestTimes = new Map<string, number>();

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      await page.setRequestInterception(true);

      page.on('request', (request) => {
        const reqId = Math.random().toString(36).substring(2, 9);
        requestTimes.set(request.url() + request.method(), Date.now());
        request.continue();
      });

      page.on('response', async (response) => {
        const req = response.request();
        const type = req.resourceType();

        if (type === 'xhr' || type === 'fetch') {
          const url = req.url();
          const method = req.method();
          const startTime = requestTimes.get(url + method) || Date.now();
          const duration = Date.now() - startTime;

          const parsedUrl = new URL(url);
          const pathname = parsedUrl.pathname;

          const requestHeaders = req.headers();
          const responseHeaders = response.headers();
          const status = response.status();

          let requestBody: any = null;
          const rawPost = req.postData();
          if (rawPost) {
            try {
              requestBody = JSON.parse(rawPost);
            } catch {
              requestBody = rawPost;
            }
          }

          let responseBody: any = null;
          try {
            const text = await response.text();
            try {
              responseBody = JSON.parse(text);
            } catch {
              responseBody = text;
            }
          } catch {
            responseBody = null;
          }

          let cookies: any[] = [];
          try {
            cookies = await page.cookies(url);
          } catch {
            cookies = [];
          }

          capturedRequests.push({
            id: Math.random().toString(36).substring(2, 9),
            timestamp: startTime,
            duration,
            url,
            path: pathname,
            method,
            status,
            requestHeaders,
            requestBody,
            responseHeaders,
            responseBody,
            cookies
          });
        }
      });

      await page.goto(input.url, { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const trafficFilePath = path.join(process.cwd(), 'traffic.json');
      fs.writeFileSync(trafficFilePath, JSON.stringify(capturedRequests, null, 2));

      return {
        status: 'success',
        url: input.url,
        totalCaptured: capturedRequests.length,
        summary: capturedRequests.map(r => ({
          id: r.id,
          method: r.method,
          path: r.path,
          status: r.status,
          duration: r.duration
        }))
      };
    } catch (error: any) {
      ctx.logger.error(`sniffer error: ${error.message}`);
      return {
        status: 'error',
        message: error.message
      };
    } finally {
      await browser.close();
    }
  }
}
