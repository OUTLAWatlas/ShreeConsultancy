import { NextResponse } from 'next/server';
import { requireSession } from '../../../../../../lib/requireSession';
import { backendFetch } from '../../../../../../lib/backendClient';

export async function GET(request, { params }) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const fileId = request.nextUrl.searchParams.get('fileId');
  const { data, status } = await backendFetch(
    `/projects/${params.id}/files/download?fileId=${encodeURIComponent(fileId || '')}`
  );
  return NextResponse.json(data, { status });
}
