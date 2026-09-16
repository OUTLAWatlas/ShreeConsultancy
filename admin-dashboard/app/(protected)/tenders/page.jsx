import { backendFetch } from '../../../lib/backendClient';
import TenderInbox from '../../../components/TenderInbox';

export const metadata = { title: 'Tender Inbox — Shree Consultancy Admin' };
export const dynamic = 'force-dynamic';

export default async function TendersPage() {
  const { data } = await backendFetch('/tenders');
  return <TenderInbox initialTenders={data.tenders || []} />;
}