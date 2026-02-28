const { spawn } = require('child_process');
const express = require('express');
const app = express();
app.use(express.json());

const mcpProxy = spawn('java', ['-jar', 'mcp-proxy.jar', '--sse-url', 'http://127.0.0.1:9876']);

let pendingResponse = null;

mcpProxy.stdout.on('data', (data) => {
    const output = data.toString().trim();
    console.log(`JAR Output: ${output}`);

    // Only send the response back if we have an active HTTP request waiting
    if (pendingResponse) {
        pendingResponse.send(output);
        pendingResponse = null;
    }
});

app.get('/sse', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    console.log("==> Copilot connected to SSE");
});

app.post('/', (req, res) => {
    console.log(`==> Method: ${req.body.method}`);
    
    // 1. Send the command to the JAR
    mcpProxy.stdin.write(JSON.stringify(req.body) + '\n');

    // 2. Decide if we should wait for a response
    // Notifications (like 'notifications/initialized') don't return data
    if (req.body.method.includes('notifications/') || !req.body.id) {
        res.status(202).send(); // Tell Copilot "Got the notification"
    } else {
        pendingResponse = res; // Hold the connection for actual tools/init
    }
});

app.listen(8080, () => console.log("Final Bridge running on 8080"));