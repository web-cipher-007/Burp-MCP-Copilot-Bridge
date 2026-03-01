if (process.argv.includes('--daemon')) {
    const { spawn } = require('child_process');
    const fs = require('fs');
    const path = require('path');

    const logFile = fs.openSync(path.join(__dirname, 'bridge.log'), 'a');
    const errFile = fs.openSync(path.join(__dirname, 'bridge-error.log'), 'a');

    const child = spawn(process.execPath, process.argv.slice(1).filter(a => a !== '--daemon'), {
        detached: true,
        stdio: ['ignore', logFile, errFile]
    });

    child.unref();
    console.log(`Bridge started in background (PID: ${child.pid})`);
    console.log(`Logs:   ${path.join(__dirname, 'bridge.log')}`);
    console.log(`Errors: ${path.join(__dirname, 'bridge-error.log')}`);
    process.exit(0);
}


const { spawn } = require('child_process');
const express = require('express');

const VERBOSE = process.argv.includes('--verbose');
const BURP_PORT = 9876;
const BRIDGE_PORT = 8080;

const app = express();
app.use(express.json());

const mcpProxy = spawn('java', ['-jar', 'mcp-proxy.jar', '--sse-url', `http://127.0.0.1:${BURP_PORT}`], {
    detached: process.argv.includes('--background'), 
    stdio: ['pipe', 'pipe', 'pipe']
});

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

process.on('SIGTERM', () => {
    mcpProxy.kill();
    process.exit(0);
});

process.on('SIGINT', () => {
    mcpProxy.kill();
    process.exit(0);
});

app.listen(BRIDGE_PORT, () => {
    console.log(`Bridge running on port ${BRIDGE_PORT}`);
    console.log(`Logging: ${VERBOSE ? 'VERBOSE' : 'QUIET (--verbose for full output)'}`);
});