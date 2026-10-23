import { NextResponse } from 'next/server';

// The old self-service route cannot bypass the owner's manual review.
export async function POST() {
  return NextResponse.json({ error: 'Submit your public post for review on the Free page.', url: '/free-desktop-pet#share-basic' },
    { status: 410, headers: { 'Cache-Control': 'private, no-store' } });
}
