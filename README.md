# netsniff

mcp server to sniff website traffic and inspect network requests.

## features

* intercepts all network request resource types (documents, scripts, stylesheets, images, fonts, fetch, and xhr) using raw chromium cdp.
* captures timing breakdowns, initiator stack traces, target ip and port, cookies, and response bodies.
* saves captured traffic to `traffic.json` in the root directory.
* includes a command line interactive utility to filter and view captured requests.

## scripts

* `npm run build`: compile typescript code to dist.
* `npm run start`: compile typescript and run the stdio mcp server.
* `node scratch/run-sniffer-tool.js <url>`: run the sniffer against a URL directly from the terminal.
* `node scratch/inspect-traffic.js list`: list all captured network requests.
* `node scratch/inspect-traffic.js filter <type>`: filter requests by type (e.g. Fetch, Script).
* `node scratch/inspect-traffic.js view <id>`: inspect details (headers, body) of a specific request.
