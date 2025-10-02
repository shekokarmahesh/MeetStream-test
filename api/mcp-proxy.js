// Vercel API Route to proxy MCP requests
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const MCP_SERVER_URL = process.env.MCP_SERVER_URL;
  
  if (!MCP_SERVER_URL) {
    return res.status(500).json({ error: 'MCP server URL not configured' });
  }

  try {
    // Prepare headers for the MCP server request
    const forwardHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'User-Agent': 'Katalyst-Proxy/1.0',
    };

    // Forward user's OAuth token if present
    // This allows per-user calendar access
    if (req.headers.authorization) {
      forwardHeaders.Authorization = req.headers.authorization;
    }

    // Prepare the request body
    let requestBody;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      if (req.body && typeof req.body === 'object') {
        requestBody = JSON.stringify(req.body);
      } else if (typeof req.body === 'string') {
        requestBody = req.body;
      } else {
        requestBody = JSON.stringify(req.body || {});
      }
    }

    console.log('Proxying request to:', MCP_SERVER_URL);
    console.log('Method:', req.method);
    console.log('Headers:', forwardHeaders);
    console.log('Body:', requestBody);

    // Forward the request to the actual MCP server
    const response = await fetch(MCP_SERVER_URL, {
      method: req.method,
      headers: forwardHeaders,
      body: requestBody,
    });

    console.log('MCP Response status:', response.status);
    console.log('MCP Response headers:', Object.fromEntries(response.headers.entries()));

    // Get response data
    const responseText = await response.text();
    console.log('MCP Response body:', responseText);

    // Set response headers based on the original response
    const originalContentType = response.headers.get('content-type') || 'application/json';
    res.setHeader('Content-Type', originalContentType);
    
    // Return the response
    res.status(response.status).send(responseText);
  } catch (error) {
    console.error('MCP Proxy Error:', error);
    res.status(500).json({ 
      error: 'Failed to proxy MCP request',
      details: error.message 
    });
  }
}
