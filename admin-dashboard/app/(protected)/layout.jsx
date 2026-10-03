import { cookies } from 'next/headers';
import { verifySessionToken } from '../../lib/session';
import AppShell from '../../components/AppShell';
import { RoleProvider } from '../../components/RoleContext';

// This route group covers every authenticated tab (dashboard, tenders,
// invoices, team). Middleware already redirects unauthenticated requests
// to /login before any of this renders — this second check just gets us
// the session payload (e.g. the signed-in user's email) to display in the
// shell's top bar.
export default async function ProtectedLayout({ children }) {
  const token = cookies().get('admin_session')?.value;
  const session = await verifySessionToken(token);

  const role = session?.role || 'admin';

  return (
    <RoleProvider role={role}>
      <AppShell email={session?.email} role={role}>
        {children}
      </AppShell>
    </RoleProvider>
  );
}
