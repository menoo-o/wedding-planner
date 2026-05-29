import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { HouseholdMember, MonthlyCycle, Category } from '@/lib/types'



export async function readSupaTables() {
  // 1. This async call is 100% fine without Suspense
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims()

  // Initialize variables to hold our data
  let householdMember: HouseholdMember | null = null
  let monthlyCycle: MonthlyCycle | null = null
  let categories: Category[] = []

  // 2. If no user, redirect to login (also fine without Suspense)
  if (error || !data?.claims) {
     console.error('Error fetching user claims:', error);
     redirect('/login');
  }

  // 3. If we have a user, fetch their household membership (also fine without Suspense)
  if (data?.claims?.sub) {
  // Fetch household membership for logged-in user
  const { data: memberData, error: memberError } = await supabase
    .from("household_members")
    .select("household_id, role, status, user_id")
    .eq("user_id", data.claims.sub)
    .eq("status", "active")
    .single<HouseholdMember>()

    

  if (memberError) {
    console.error("Failed to fetch household member:", memberError)
  } else {
    householdMember = memberData
  }

  console.log(householdMember?.household_id)
  // ///////////Read Monthly Cycle's Table/////////////////////////////////////
  const { data: cycle, error: cycleError } = await supabase
    .from("monthly_cycles")
    .select("*")
    .eq("household_id", memberData?.household_id)
    .eq("is_closed", false)
    .single<MonthlyCycle>()
 
    if (cycleError) {
      console.error("Failed to fetch monthly cycle:", cycleError)
    } else {
      monthlyCycle = cycle
     
    }

    // ///////////Read Categories Table/////////////////////////////////////
    const { data: categoriesData, error: categoriesError } = await supabase
    .from("categories")
    .select("*")
    .eq("household_id", memberData?.household_id)
    .overrideTypes<Category[]>()

  if (categoriesError) {
    console.error("Failed to fetch categories:", categoriesError)
  } else {
    categories = categoriesData ?? []
  }


  }
  // 4. Return the household member data (can be null if not found, but that's fine for Suspense)
  return {
    householdMember,
    monthlyCycle,
    categories
  } 
}
