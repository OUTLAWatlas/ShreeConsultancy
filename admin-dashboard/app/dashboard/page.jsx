import { cookies } from 'next/headers';
import { verifySessionToken } from '../../lib/session';
import PipelineBoard from '../../components/PipelineBoard';

export const metadata = { title: 'Dashboard — Shree Consultancy Admin' };

export default async function DashboardPage() {
  // Middleware already redirects unauthenticated requests to /login before
  // this ever runs — this second check just gets us the session payload
  // (e.g. the signed-in user's email) to display.
  const token = cookies().get('admin_session')?.value;
  const session = await verifySessionToken(token);

  return <PipelineBoard email={session?.email} />;
}
