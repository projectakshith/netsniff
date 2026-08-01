import puppeteer from 'puppeteer';

async function test() {
  console.log('launching headless browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  page.on('response', async (response) => {
    const req = response.request();
    const type = req.resourceType();
    
    if (type === 'xhr' || type === 'fetch') {
      console.log(`[captured] ${req.method()} ${req.url()} [status: ${response.status()}]`);
    }
  });

  console.log('navigating to httpbin...');
  await page.goto('https://httpbin.org', { waitUntil: 'networkidle2' });
  
  console.log('triggering test fetch request on page...');
  await page.evaluate(() => fetch('/get?test=success'));
  
  await new Promise((resolve) => setTimeout(resolve, 2000));
  
  console.log('closing browser...');
  await browser.close();
}

test().catch(console.error);
