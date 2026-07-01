import 'server-only';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server'; // adjust if your Supabase server client lives elsewhere
// import getDashboardData from '../_services/dashboard'; // adjust if your dashboard service lives elsewhere

// TODO: replace with the real UUID of the one user allowed on this page.
// (This was 'xyx' as a placeholder in the guide — swap it for the actual auth.users id.)
const ALLOWED_USER_ID = 'c12192ec-0eca-46aa-827c-537d345e6232';

/**
 * Server-side gate for /dashboard/petit.
 * Reads the verified JWT claims from Supabase, and redirects anyone who
 * isn't the allowed user back to /dashboard before any page content renders.
 *
 * Must be called from a Server Component (e.g. page.tsx) — it uses
 * next/navigation's redirect(), which only works in a server context.
 */
export async function requirePetitAccess() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (!user || user.sub !== ALLOWED_USER_ID) {
    redirect('/dashboard');
  }

  return user;
}