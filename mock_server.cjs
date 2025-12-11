const http = require('http');

const PORT = 8082;

const server = http.createServer((req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, POST, GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === '/v1/chat/completions') {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });

        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            console.log('Received request:', body);
            simulateGeneration(res);
        });
    } else {
        res.writeHead(404);
        res.end();
    }
});

function simulateGeneration(res) {
    const steps = [
        "**Generation Process Begins**\n\n",
        "Initializing generation request...\n",
        "**Video Generation Progress**: 9% (running)\n",
        "**Video Generation Progress**: 20% (running)\n",
        "**Video Generation Progress**: 45% (running)\n",
        "**Video Generation Progress**: 80% (running)\n",
        "**Video Generation Progress**: 98% (processing)\n",
        "**Video Generation Completed**\n\n",
        "Watermark-free mode enabled. Publishing video to get watermark-free version...\n",
        "Video published successfully. Post ID: s_mock_12345\n",
        "Now preparing watermark-free video...\n",
        "Cache is disabled. Using watermark-free URL directly...\n",
        "<video src='https://www.w3schools.com/html/mov_bbb.mp4' controls></video>" // Using a reliable public test video
    ];

    let i = 0;
    const interval = setInterval(() => {
        if (i >= steps.length) {
            clearInterval(interval);
            res.end();
            return;
        }

        // Simulate chunk format (usually standard SSE has 'data: ' prefix but user example shows raw text stream?)
        // User example: "这是流式处理的响应内容：... (raw text)"
        // Typically OpenAI compatible APIs use SSE "data: JSON\n\n". 
        // BUT the user provided log looks like raw text being streamed or the client reads raw chunks.
        // GitHub repo 'sora2api' seems to proxy the response.
        // Based on user "This program seems to only support streaming response", and the log output,
        // it looks like it just streams raw text content or Server Sent Events.
        // I will assume it streams the content of the "content" field in a standard OpenAI API, OR just raw text.
        // The user example log: "**Generation Process Begins**..." 
        // This looks like the *content* of the delta.
        // I'll assume standard OpenAI SSE format but the content contains these strings.

        const chunkContent = steps[i];
        const data = JSON.stringify({
            choices: [{
                delta: {
                    content: chunkContent
                }
            }]
        });

        res.write(`data: ${data}\n\n`);

        i++;
    }, 800);
}

console.log(`Mock server running at http://localhost:${PORT}`);
server.listen(PORT);
