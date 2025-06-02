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

  // Check if this is an admin data request
  const url = new URL(request.url)
  if (url.pathname === '/admin/data') {
    // Get all data from KV
    const [totalVisitors, countryStatsStr] = await Promise.all([
      VISITOR_COUNTER.get('total_visitors'),
      VISITOR_COUNTER.get('country_stats')
    ])

    const adminData = {
      total_visitors: totalVisitors ? parseInt(totalVisitors) : 0,
      country_stats: countryStatsStr ? JSON.parse(countryStatsStr) : {},
      last_checked: new Date().toISOString()
    }

    return new Response(JSON.stringify(adminData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    })
  }

  // Debug endpoint to see all headers
  if (url.pathname === '/debug') {
    const headers = {};
    for (const [key, value] of request.headers.entries()) {
      headers[key] = value;
    }
    return new Response(JSON.stringify({ headers }, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }

  // Regular visitor counting logic
  const country = request.headers.get('CF-IPCountry') || 'Unknown'
  
  // Get detailed browser info from User-Agent
  const userAgent = request.headers.get('user-agent') || request.headers.get('User-Agent') || ''
  let browserInfo = 'Unknown'
  
  if (userAgent) {
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      browserInfo = 'Safari'
    } else if (userAgent.includes('Firefox')) {
      browserInfo = 'Firefox'
    } else if (userAgent.includes('Chrome')) {
      browserInfo = 'Chrome'
    } else if (userAgent.includes('Edge')) {
      browserInfo = 'Edge'
    } else if (userAgent.includes('Opera')) {
      browserInfo = 'Opera'
    } else if (userAgent.includes('Mobile')) {
      browserInfo = 'Mobile Browser'
    }
  }

  const requestMethod = request.method
  
  // Get timezone with fallback to region-based timezone
  let timezone = 'Unknown'
  const cfCity = request.headers.get('cf-ipcity')
  const cfRegion = request.headers.get('cf-ipregion')
  const cfCountry = request.headers.get('cf-ipcountry')

  if (cfCity && cfRegion) {
    timezone = `${cfCity}, ${cfRegion}`
  } else if (cfRegion && cfCountry) {
    timezone = `${cfRegion}, ${cfCountry}`
  } else if (cfCountry) {
    timezone = cfCountry
  }

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
    userAgent: browserInfo,
    requestMethod: requestMethod,
    timestamp: new Date().toISOString(),
    countryStats: countryStats,
    debug: {
      rawUserAgent: userAgent,
      rawCity: cfCity,
      rawRegion: cfRegion,
      rawCountry: cfCountry
    }
  }

  // Return response with CORS headers
  return new Response(JSON.stringify(responseData), {
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  })
} 