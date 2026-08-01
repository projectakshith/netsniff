import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError
} from '@modelcontextprotocol/sdk/types.js';
import { crawlAndSniff } from './crawler.js';

const server = new Server(
  {
    name: 'netsniff-server',
    version: '1.0.0'
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'sniff_website',
        description: 'crawls a website in the background, intercepts all network requests using raw cdp, and saves detailed logs to traffic.json',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'the website url to crawl and sniff'
            }
          },
          required: ['url']
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== 'sniff_website') {
    throw new McpError(ErrorCode.MethodNotFound, `unknown tool: ${request.params.name}`);
  }

  const { url } = request.params.arguments as { url: string };
  if (!url) {
    throw new McpError(ErrorCode.InvalidParams, 'url is required');
  }

  try {
    const logger = {
      info: (msg: string) => console.error(`[info] ${msg}`),
      error: (msg: string) => console.error(`[error] ${msg}`)
    };
    const result = await crawlAndSniff(url, logger);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            status: 'error',
            message: error.message
          }, null, 2)
        }
      ],
      isError: true
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('server error:', error);
  process.exit(1);
});
