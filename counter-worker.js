// Define the KV namespace binding name that we'll set up in Cloudflare Dashboard
// Make sure to bind this exact name in the dashboard

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // Set CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
    'Access-Control-Max-Age': '86400',
  }

  // Handle OPTIONS request for CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    })
  }

  // Get visitor's country from Cloudflare's CF-IPCountry header
  const country = request.headers.get('CF-IPCountry') || 'Unknown'
  
  // Get user agent information
  const userAgent = request.headers.get('User-Agent') || 'Unknown'
  
  // Get request method
  const requestMethod = request.method
  
  // Get visitor's timezone using CF header
  const timezone = request.headers.get('CF-IPTimezone') || 'Unknown'

  // Get current count from KV
  let count = await VISITOR_COUNTER.get('total_visitors')
  count = count ? parseInt(count) : 11000 // Start from 11,000 if no count exists
  
  // Increment count
  count++
  
  // Store new count
  await VISITOR_COUNTER.put('total_visitors', count.toString())

  // Get country stats
  let countryStats = {}
  try {
    const statsStr = await VISITOR_COUNTER.get('country_stats')
    countryStats = statsStr ? JSON.parse(statsStr) : {}
    countryStats[country] = (countryStats[country] || 0) + 1
    await VISITOR_COUNTER.put('country_stats', JSON.stringify(countryStats))
  } catch (e) {
    console.error('Error updating country stats:', e)
  }

  // Prepare response data
  const responseData = {
    totalVisitors: count,
    country: country,
    timezone: timezone,
    userAgent: userAgent,
    requestMethod: requestMethod,
    timestamp: new Date().toISOString(),
    countryStats: countryStats
  }

  // Return response with CORS headers
  return new Response(JSON.stringify(responseData), {
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  })
} 