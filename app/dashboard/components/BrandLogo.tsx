// app/dashboard/components/ui/BrandLogo.tsx
import Link from "next/link"
import Image from "next/image"

interface BrandLogoProps {
  className?: string
}

export default function BrandLogo({ className = "" }: BrandLogoProps) {
  return (
    <div className={className}>
      <Link href="/dashboard" className="flex items-center gap-2 lg:gap-3 group">
        <div className="relative w-20 h-12 lg:w-26 lg:h-18 overflow-visible shrink-0 flex items-center justify-center -ml-3 lg:ml-0">
          <Image
            src="/logo-v1.png"
            alt="Simply Finance"
            fill
            sizes="(max-width: 768px) 120px, 160px"
            className="object-contain object-left scale-125 origin-left lg:object-center lg:scale-150 lg:origin-center transition-transform duration-300 group-hover:scale-160"
            priority
          />
        </div>
        <p className="w-min lg:w-auto text-[10px] leading-snug text-gray-400 tracking-[0.15em] uppercase font-medium">
          Simply Finance
        </p>
      </Link>
    </div>
  )
}