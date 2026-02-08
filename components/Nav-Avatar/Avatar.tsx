
import Image from "next/image"


import { createClient } from "@/utils/supabase/server"

export default async function NavAvatar() {
  const supabase = await createClient();
  // No loading state needed! This happens on the server.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  return (
    <>
      {/* nav avatar */}
      <div className="nav-avatar">
        {user ? (
          <Image
            src={user.picture || "/pfp.webp"}
            alt="User Avatar"
            width={40}
            height={40}
            className="nav-avatar__image"
          />
        ) : (
          <a href="/login" className="nav-login-link">Login</a>
            
        )}
      </div>
      

    </>
  )
}

