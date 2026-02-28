const { spawn } = require('child_process');
const express = require('express');
const app = express();
app.use(express.json());

const VERBOSE = process.argv.includes('--verbose');
const BURP_PORT = 9876;
const BRIDGE_PORT = 8080;

const mcpProxy = spawn('java', ['-jar', 'mcp-proxy.jar', '--sse-url', `http://127.0.0.1:${BURP_PORT}`]);

let pendingResponse = null;

mcpProxy.stdout.on('data', (data) => {
    const output = data.toString().trim();
    
    if (VERBOSE) {
        console.log(`[JAR Output]: ${output}`);
    }

    if (pendingResponse) {
        pendingResponse.send(output);
        pendingResponse = null;
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
    if (VERBOSE) {
        console.log(`==> Method: ${req.body.method}`);
    }
    
    mcpProxy.stdin.write(JSON.stringify(req.body) + '\n');

    if (req.body.method.includes('notifications/') || !req.body.id) {
        res.status(202).send(); 
    } else {
        pendingResponse = res; 
    }
});

app.listen(BRIDGE_PORT, () => {
    console.log(`Final Bridge running on ${BRIDGE_PORT}`);
    console.log(`Logging level: ${VERBOSE ? 'VERBOSE' : 'QUIET (use --verbose for full output)'}`);
});