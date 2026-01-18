import Image from "next/image"
import Link from "next/link"
import "./nav.css"

function NavSection() {
  return (
    <nav className="nav-section" aria-label="Primary navigation">
      <div className="nav-section__logo">
        <Link href="/" className="nav-section__logo-link">
          <Image
            src="/logo.webp"
            alt="Brand name"
            width={100}
            height={100}
            className="nav-section__logo-img"
            priority
          />
        </Link>
      </div>

      <button
        type="button"
        className="nav-section__overlay-toggle"
        aria-label="Open navigation menu"
      >
        <Image
          src="/logo.webp"
          alt=""
          width={80}
          height={80}
          className="nav-section__overlay-toggle-img"
        />
      </button>
    </nav>
  )
}

export default NavSection
