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

export const cancelBtnCls =
  "flex-1 h-12 rounded-2xl bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700 font-semibold text-sm transition-colors"

export const submitBtnCls =
  "flex-[1.4] h-12 rounded-2xl bg-[#2d3436] hover:bg-[#1a1e1f] disabled:bg-gray-300 text-white font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2"