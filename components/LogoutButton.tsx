import { redirect } from "next/navigation";
import { signOut } from "@/utils/helperfns";

export default function LogoutBtn() {
  async function handleSignOut() {
    "use server";

    await signOut();

    redirect("/");
  }

  return (
    <form action={handleSignOut}>
      <button
        type="submit"
        className="bg-red-500 text-white p-2 rounded"
      >
        Logout
      </button>
    </form>
  );
}