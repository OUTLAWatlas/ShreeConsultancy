import { NextResponse } from 'next/server';
import { requireSession } from '../../../lib/requireSession';
import { backendFetch } from '../../../lib/backendClient';

export async function GET() {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { data, status } = await backendFetch('/projects');
  return NextResponse.json(data, { status });
}

export async function POST(request) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { data, status } = await backendFetch('/projects', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return NextResponse.json(data, { status });
}