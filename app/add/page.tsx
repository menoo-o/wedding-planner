import { Suspense } from "react";
import QuickEntryModal from "@/components/AddExpense/QuickEntryModal";

// "use cache" lets Next.js statically prerender this component.
// revalidate: 86400 = re-cache once per day so todayStr never goes stale.
async function QuickEntryWithDate() {
  "use cache";
  const todayStr = new Date().toISOString().split("T")[0];
  return <QuickEntryModal todayStr={todayStr} />;
}

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#d8d5cf",
      }}
    >
      <Suspense fallback={null}>
        <QuickEntryWithDate />
        
      </Suspense>
    </main>
  );
}