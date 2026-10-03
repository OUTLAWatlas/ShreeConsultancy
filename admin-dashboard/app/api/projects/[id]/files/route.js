import { NextResponse } from 'next/server';
import { requireSession } from '../../../../../lib/requireSession';
import { backendFetch, backendFetchMultipart } from '../../../../../lib/backendClient';

export async function GET(request, { params }) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { data, status } = await backendFetch(`/projects/${params.id}/files`);
  return NextResponse.json(data, { status });
}

export async function POST(request, { params }) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const formData = await request.formData();
  const { data, status } = await backendFetchMultipart(`/projects/${params.id}/files`, formData);
  return NextResponse.json(data, { status });
}

export async function DELETE(request, { params }) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { data, status } = await backendFetch(`/projects/${params.id}/files`, {
    method: 'DELETE',
    body: JSON.stringify(body),
  });
  return NextResponse.json(data, { status });
}
