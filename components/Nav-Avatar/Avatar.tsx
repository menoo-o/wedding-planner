// components/navbar/UserSection.tsx
import Image from "next/image"
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";

export default async function UserSection() {
  const supabase = await createClient();

  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return <a href="/login">Login</a>;
  }

  // Fetch profile data
  const { data: profile } = await supabase
    .from("profiles")
    .select("name, avatar_path")
    .eq("id", data.user.id)
    .single();

  // Fallback to universal avatar if profile.avatar_path is null
  const avatarUrl =
    profile?.avatar_path || "/pfp.webp";


  return (
    <div className="user-section">
      {/* Link to dashboard when img clicked */}
      <Link href="/dashboard">
      <Image 
          src={avatarUrl}
          alt="profile image"
          width={32} 
          height={32} 
      />
      </Link>
      <span>{profile?.name}</span>
    </div>
  );
}
