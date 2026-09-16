import { backendFetch } from '../../../lib/backendClient';
import InvoiceList from '../../../components/InvoiceList';

export const metadata = { title: 'Invoices — Shree Consultancy Admin' };
export const dynamic = 'force-dynamic';

export default async function InvoicesPage() {
  const { data } = await backendFetch('/invoices');
  return <InvoiceList initialInvoices={data.invoices || []} />;
}