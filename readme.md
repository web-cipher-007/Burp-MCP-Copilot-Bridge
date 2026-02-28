# Burp Suite MCP to Copilot Studio Bridge (Vibe Pentesting)
A specialized Node.js bridge that enables Microsoft Copilot Studio (Copilot Agents) to communicate with the Burp Suite MCP Server. It wraps the official PortSwigger stdio proxy to provide the synchronous HTTP/SSE interface required by cloud-based AI clients.

##  Architecture
Copilot AI Agent (Cloud) → ngrok (Tunnel) → Node.js Bridge (Local) → Burp Proxy JAR (Stdio) → Burp Extension (SSE)

## Prerequisites
- Burp Suite Pro/Community with [MCP Server Extension](https://github.com/PortSwigger/mcp-server).
- Node.js v18+.
- Java JRE (in System PATH).
- ngrok for local tunneling.

## Quick Start
### 1. Prepare Burp Suite
- Enable the MCP Server in the Burp MCP tab (Default: http://127.0.0.1:9876).
- Click "Extract server proxy jar" in the extension settings.
- Save the file as `mcp-proxy.jar` in your project root.

### 2. Clone Repo
Clone the repository: <br>
- `git clone https://github.com/web-cipher-007/Burp-MCP-Copilot-Bridge.git`
- `cd Burp-MCP-Copilot-Bridge`

### 3. Install dependencies
- Install dependencies: `npm install`

### 4. Start the bridge
- Run server.js: `node server.js`

### 5. Expose the Bridge
- Run ngrok for tunneling the Copilot Agent's request:<br>
`ngrok http 8080 --host-header=rewrite`

### 6. Configure Copilot Studio
In Copilot Studio (in your AI Agent):
- In tools, add a MCP server with the ngrok URL as Server URL.
- Connect and configure it and the AI agent will have access to all burp mcp tools and can access the burp suite, its logs, tabs, etc.

This bridge facilitates seamless, prompt-based interaction between Copilot Agents and Burp Suite. By enabling real-time analysis of HTTP traffic via the Model Context Protocol (MCP), it allows security researchers to identify vulnerabilities and automate complex testing workflows directly from their chat interface.<br>
Happy Hacking!
