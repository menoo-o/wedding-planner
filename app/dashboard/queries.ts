import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { HouseholdMember } from '@/lib/types'



export async function readHouseTable() {
  // 1. This async call is 100% fine without Suspense
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims()

  let householdMember: HouseholdMember | null = null
  if (error || !data?.claims) {
     console.error('Error fetching user claims:', error);
     redirect('/login');
  }

  if (data?.claims?.sub) {
  // Fetch household membership for logged-in user
  const { data: memberData, error: memberError } = await supabase
    .from("household_members")
    .select("household_id, role, status")
    .eq("user_id", data.claims.sub)
    .eq("status", "active")
    .single<HouseholdMember>()

  if (memberError) {
    console.error("Failed to fetch household member:", memberError)
  } else {
    householdMember = memberData
  }
  }
  
  return householdMember 
}
