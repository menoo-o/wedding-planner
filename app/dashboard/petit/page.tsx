import { requirePetitAccess } from './petit';
import { Suspense } from 'react';
import PetitPlaisirWorkspace from '@/app/dashboard/components/Petit-Block';

// Server Component (no 'use client' here) — this is what lets us redirect
// before any of the client-side workspace ever gets sent to the browser.
async function PetitPage() {
  await requirePetitAccess();

  return <PetitPlaisirWorkspace />;
}


export default async function PetitDashboard() {
  return (
    <div className="dashboard-container">
      {/* 
        Suspense enables streaming:
        - The page shell renders immediately
        - FetchDashboardData resolves separately
        - Skeleton is shown while waiting
      */}
      <Suspense fallback={<DashboardSkeleton />}>
        <PetitPage />
      </Suspense>
    </div>
  )
}


function DashboardSkeleton() {
  return (
    <div className="dashboard-box">
      <p>Loading dashboard...</p>
    </div>
  )
}