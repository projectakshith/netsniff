import { crawlAndSniff } from '../dist/crawler.js';

async function main() {
  const url = process.argv[2];
  if (!url) {
    console.error('error: please provide a website url');
    console.error('usage: node scratch/run-sniffer-tool.js <url>');
    process.exit(1);
  }

  const mockLogger = {
    info: (msg) => console.log(`[info] ${msg}`),
    error: (msg) => console.error(`[error] ${msg}`)
  };

  console.log(`running crawler on ${url}...`);
  const result = await crawlAndSniff(url, mockLogger);
  
  console.log('\ntool return value:');
  console.log(JSON.stringify(result, null, 2));
  console.log('\nfull network log saved to: traffic.json');
}

main().catch(console.error);
