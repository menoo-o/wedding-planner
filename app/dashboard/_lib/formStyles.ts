// app/dashboard/_lib/formStyles.ts
// Shared field styles so AddExpense, Loan and Top-up forms look identical.
// Inputs use 16px text on mobile (stops iOS zoom-on-focus) and 14px from sm: up.

export const labelCls =
  "block text-[11px] font-bold tracking-[0.15em] text-gray-400 uppercase"

export const errorCls = "text-red-500 text-xs font-medium px-1"

export function inputCls(hasError = false, pad = "px-4", size = "h-12") {
  return `w-full min-w-0 ${size} ${pad} bg-gray-50 border-2 rounded-2xl text-base sm:text-sm font-medium text-[#2d3436] placeholder:text-gray-400 outline-none appearance-none transition-all focus:bg-white focus:ring-4 ${
    hasError
      ? "border-red-300 bg-red-50/40 focus:border-red-400 focus:ring-red-500/10"
      : "border-transparent focus:border-[#8b9dc3] focus:ring-[#8b9dc3]/10"
  }`
}

// iOS renders date values centered inside the field; keep them left-aligned
export const dateFixCls = "[&::-webkit-date-and-time-value]:text-left"

export const optionGridCls = "grid grid-cols-2 gap-3"

export function optionCls(active: boolean) {
  return `flex items-center justify-center gap-2 px-3 py-3.5 rounded-2xl border-2 text-sm font-semibold whitespace-nowrap cursor-pointer transition-all ${
    active
      ? "border-[#2d3436] bg-[#2d3436] text-white"
      : "border-gray-100 bg-white text-gray-500 hover:border-gray-200"
  }`
}

// Form layout inside <ModalShell>: scrolling body + pinned footer
export const formShellCls = "flex min-h-0 flex-1 flex-col"

export const formBodyCls =
  "flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-8 sm:py-6"

export const formFooterCls =
  "shrink-0 border-t border-gray-100 bg-white px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-8 sm:pt-4 sm:pb-6"

export const submitBtnCls =
  "w-full py-4 rounded-2xl bg-[#2d3436] hover:bg-[#1a1e1f] disabled:bg-gray-300 text-white font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2"