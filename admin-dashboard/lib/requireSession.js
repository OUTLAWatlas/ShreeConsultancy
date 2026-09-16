import { cookies } from 'next/headers';
import { verifySessionToken } from './session';

export async function requireSession() {
  const token = cookies().get('admin_session')?.value;
  return verifySessionToken(token);
}
