export default async function handler(req, res) {
  // Read private backend URL from Vercel sensitive environment variable
  const backendBase = process.env.BACKEND_API_URL || 'http://localhost:5000/api';

  // Extract path and query string
  const queryIndex = req.url.indexOf('?');
  const path = queryIndex >= 0 ? req.url.slice(0, queryIndex) : req.url;
  const queryString = queryIndex >= 0 ? req.url.slice(queryIndex) : '';
  const subPath = path.replace(/^\/api/, '');
  const targetUrl = `${backendBase.replace(/\/$/, '')}${subPath}${queryString}`;

  // Forward headers (omit host and connection)
  const headers = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (!['host', 'connection', 'content-length'].includes(key.toLowerCase())) {
      headers[key] = value;
    }
  }

  const fetchOptions = {
    method: req.method,
    headers,
  };

  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && req.body) {
    fetchOptions.body = typeof req.body === 'object' ? JSON.stringify(req.body) : req.body;
  }

  try {
    const upstreamRes = await fetch(targetUrl, fetchOptions);
    const contentType = upstreamRes.headers.get('content-type') || '';

    res.status(upstreamRes.status);
    upstreamRes.headers.forEach((value, key) => {
      if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });

    if (contentType.includes('application/json')) {
      const data = await upstreamRes.json();
      return res.json(data);
    } else {
      const text = await upstreamRes.text();
      return res.send(text);
    }
  } catch (error) {
    console.error('Vercel API Proxy Error:', error.message);
    return res.status(502).json({
      success: false,
      message: 'Unable to reach backend server',
    });
  }
}
