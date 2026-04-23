import Image from "next/image"
import Link from "next/link"
import "./nav.css"
import { Suspense } from "react";
import UserSection from "../Nav-Avatar/Avatar";

export default async function NavSection() {


  return (
    <nav className="nav-section" aria-label="Primary navigation">
      <div className="nav-section__logo">
        <Link href="/" className="nav-section__logo-link">
          <Image
            src="/logo-v1.png"
            alt="Brand name"
            width={120}
            height={120}
            className="nav-section__logo-img"
            priority
          />
        </Link>
      </div>

      {/* Dynamic island */}
      <Suspense fallback={<div>Loading...</div>}>
        <UserSection />
      </Suspense>
   

       
      {/* Hamburger icon */}
      {/* <button
        type="button"
        className="nav-section__overlay-toggle"
        aria-label="Open navigation menu"
      >
        
       <div className="nav-custom-icon">
        <span></span>
        <span></span>
        <span></span>
      </div>

      </button> */}
      
    </nav>
  )
}

