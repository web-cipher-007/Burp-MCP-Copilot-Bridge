const { spawn } = require('child_process');
const express = require('express');

const VERBOSE = process.argv.includes('--verbose');
const BURP_PORT = 9876;
const BRIDGE_PORT = 8080;

const app = express();
app.use(express.json());

const mcpProxy = spawn('java', ['-jar', 'mcp-proxy.jar', '--sse-url', `http://127.0.0.1:${BURP_PORT}`]);

const pendingResponses = new Map();

let stdoutBuffer = '';

mcpProxy.stdout.on('data', (chunk) => {
    stdoutBuffer += chunk.toString();

    let newlineIndex;
    while ((newlineIndex = stdoutBuffer.indexOf('\n')) !== -1) {
        const line = stdoutBuffer.slice(0, newlineIndex).trim();
        stdoutBuffer = stdoutBuffer.slice(newlineIndex + 1);

        if (!line) continue;

        if (VERBOSE) console.log(`[JAR Output]: ${line}`);

        try {
            const parsed = JSON.parse(line);
            const res = pendingResponses.get(parsed.id);
            if (res) {
                pendingResponses.delete(parsed.id);
                res.json(parsed);
            }
        } catch {
            console.error(`[JAR Parse Error]: Could not parse line: ${line}`);
        }
    }
});

mcpProxy.stderr.on('data', (data) => {
    console.error(`[JAR Error]: ${data}`);
});

app.get('/sse', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    console.log("==> Copilot connected to SSE");
});

app.post('/', (req, res) => {
    const { body } = req;

    if (VERBOSE) console.log(`==> Method: ${body.method}`);

    mcpProxy.stdin.write(JSON.stringify(body) + '\n');

    const isNotification = body.method?.startsWith('notifications/') || !body.id;
    if (isNotification) {
        res.status(202).send();
    } else {
        pendingResponses.set(body.id, res);
    }
});

app.listen(BRIDGE_PORT, () => {
    console.log(`Bridge running on port ${BRIDGE_PORT}`);
    console.log(`Logging: ${VERBOSE ? 'VERBOSE' : 'QUIET (--verbose for full output)'}`);
});