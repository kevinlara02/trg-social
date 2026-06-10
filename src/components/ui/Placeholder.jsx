import { Hammer } from 'lucide-react'

export function Placeholder({ title }) {
  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-zinc-50 mb-6">{title}</h1>
      <div className="bg-[#101012] rounded-2xl border border-zinc-800 p-10 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-zinc-800 rounded-xl mb-3">
          <Hammer className="w-6 h-6 text-zinc-400" />
        </div>
        <p className="text-zinc-100 font-medium">Coming soon</p>
        <p className="text-zinc-500 text-sm mt-1">This section is being built.</p>
      </div>
    </div>
  )
}
