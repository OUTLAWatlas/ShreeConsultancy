import { backendFetch } from '../../../lib/backendClient';
import TeamSettings from '../../../components/TeamSettings';

export const metadata = { title: 'Team — Shree Consultancy Admin' };
export const dynamic = 'force-dynamic';

export default async function TeamPage() {
  const { data } = await backendFetch('/team');
  return <TeamSettings team={data.team || []} />;
}