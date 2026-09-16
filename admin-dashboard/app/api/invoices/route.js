import { NextResponse } from 'next/server';
import { requireSession } from '../../../lib/requireSession';
import { backendFetch } from '../../../lib/backendClient';

export async function GET() {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { data, status } = await backendFetch('/invoices');
  return NextResponse.json(data, { status });
}