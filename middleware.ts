import { NextResponse, type NextRequest } from 'next/server'

// Next 15.5 server action IDs are 42 hex characters. Bots probe with junk IDs ("x", "action", or
// 40-character IDs from older Next versions), which Next logs as errors and answers with a 500;
// turn those away before they reach the app.
const ACTION_ID = /^[0-9a-f]{42}$/

export function middleware(request: NextRequest) {
  const actionId = request.headers.get('next-action')
  if (actionId !== null && !ACTION_ID.test(actionId)) {
    return new NextResponse(null, { status: 404 })
  }
  return NextResponse.next()
}

export const config = {
  matcher: [
    {
      source: '/((?!_next/static|_next/image|favicon.ico).*)',
      has: [{ type: 'header', key: 'next-action' }],
    },
  ],
}
