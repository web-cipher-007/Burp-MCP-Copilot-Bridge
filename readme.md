# Burp Suite MCP to Copilot Studio Bridge (Vibe Pentesting)

A specialized Node.js bridge that enables Microsoft Copilot Studio (Copilot Agents) to communicate with the Burp Suite MCP Server. It wraps the official PortSwigger stdio proxy to provide the synchronous HTTP/SSE interface required by cloud-based AI clients.

## Architecture

``
Copilot AI Agent (Cloud) → ngrok (Tunnel) → Node.js Bridge (Local) → Burp Proxy JAR (Stdio) → Burp Extension (SSE)
``

## Prerequisites

- Burp Suite Pro/Community with [MCP Server Extension](https://github.com/PortSwigger/mcp-server).
- Node.js v18+.
- Java JRE (in System PATH).
- ngrok for local tunneling.

## Quick Start

### 1. Prepare Burp Suite

- Enable the MCP Server in the Burp MCP tab (Default: `http://127.0.0.1:9876`).
- Click "Extract server proxy jar" in the extension settings.
- Save the file as `mcp-proxy.jar` in your project root.

### 2. Clone Repo

```bash
git clone https://github.com/web-cipher-007/Burp-MCP-Copilot-Bridge.git
cd Burp-MCP-Copilot-Bridge
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start the Bridge

**Normal mode** — runs in the foreground, dies when the terminal is closed:

```bash
node server.js
```

**Verbose mode** — shows full JAR traffic in the terminal:

```bash
node server.js --verbose
```

**Daemon mode** — runs silently in the background, survives terminal close:

```bash
node server.js --daemon
```

**Daemon + verbose** — background process with full logging written to log files:

```bash
node server.js --daemon --verbose
```

> When started with `--daemon`, the bridge detaches from the terminal and writes all output to `bridge.log` and errors to `bridge-error.log` in the project root. The PID is printed before the process detaches — keep it handy to stop the bridge later.

**Stopping a background bridge:**

On **Linux/macOS**:
```bash
ps aux | grep server.js
kill <PID>
```

On **Windows (PowerShell 7+)**:
```powershell
Get-Process -Name "node" | Where-Object { $_.CommandLine -like "*server.js*" }
Stop-Process -Id <PID>
```

Or in one shot:
```powershell
Get-Process -Name "node" | Where-Object { $_.CommandLine -like "*server.js*" } | Stop-Process
```

On **Windows (PowerShell 5.1 / any version)**:
```powershell
taskkill /PID <PID> /F
```

> The PID is printed to the console when the daemon starts. On PowerShell 5.1, `CommandLine` filtering is unavailable on `Get-Process` — use `taskkill` or find the process via Task Manager instead.

### 5. Expose the Bridge

Run ngrok to tunnel the Copilot Agent's requests:

```bash
ngrok http 8080 --host-header=rewrite
```

### 6. Configure Copilot Studio

In Copilot Studio (in your AI Agent):

- Under **Tools**, add an MCP server using the ngrok URL as the **Server URL**.
- Connect and configure it — the agent will have access to all Burp MCP tools and can interact with Burp Suite's logs, tabs, history, and more.

## Run Modes Summary

| Command | Behavior | Logs |
|---|---|---|
| `node server.js` | Foreground, dies with terminal | stdout |
| `node server.js --verbose` | Foreground with full JAR output | stdout |
| `node server.js --daemon` | Background, survives terminal close | `bridge.log` / `bridge-error.log` |
| `node server.js --daemon --verbose` | Background with full JAR output | `bridge.log` / `bridge-error.log` |

---

This bridge facilitates seamless, prompt-based interaction between Copilot Agents and Burp Suite. By enabling real-time analysis of HTTP traffic via the Model Context Protocol (MCP), it allows security researchers to identify vulnerabilities and automate complex testing workflows directly from their chat interface, saving a lot of time.

Happy Hacking!