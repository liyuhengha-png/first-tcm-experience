import type { IncomingMessage, ServerResponse } from 'node:http'

// Standalone Node entry: no module initialization, credentials or instance state.
export default function handler(request: IncomingMessage, response: ServerResponse) {
  const url = new URL(request.url ?? '/', 'https://preview.invalid')
  const route = url.searchParams.get('route') ?? url.pathname.replace(/^\/api\//, '')
  response.setHeader('Cache-Control', 'no-store')
  response.setHeader('Content-Type', 'application/json')
  response.setHeader('X-Robots-Tag', 'noindex, nofollow')
  response.setHeader('Referrer-Policy', 'no-referrer')
  response.setHeader('X-Content-Type-Options', 'nosniff')
  if (request.method === 'GET' && route === 'config') {
    response.statusCode = 200
    response.end(JSON.stringify({ bookingEnabled: false, syntheticOnly: true, challengeSiteKey: null }))
  } else if (request.method === 'GET' && route === 'auth/session') {
    response.statusCode = 200
    response.end(JSON.stringify({ enabled: false, signedIn: false }))
  } else {
    response.statusCode = 503
    response.end(JSON.stringify({ code: 'NOT_AVAILABLE' }))
  }
}
