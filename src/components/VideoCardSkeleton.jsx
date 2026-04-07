export default function VideoCardSkeleton() {
  return (
    <div data-testid="loading-skeleton" className="h-full w-full flex flex-col justify-center bg-[#0d0d0d] snap-start overflow-hidden animate-pulse">
      {/* Video area */}
      <div className="w-full aspect-video bg-zinc-800 shrink-0" />

      {/* Metadata */}
      <div className="flex flex-col gap-3 px-4 py-3">
        {/* Channel row */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-zinc-800 shrink-0" />
          <div className="h-3.5 w-32 rounded bg-zinc-800" />
        </div>
        {/* Title lines */}
        <div className="flex flex-col gap-1.5">
          <div className="h-4 w-full rounded bg-zinc-800" />
          <div className="h-4 w-3/4 rounded bg-zinc-800" />
        </div>
        {/* Duration */}
        <div className="h-3 w-24 rounded bg-zinc-800" />
        {/* Tags */}
        <div className="flex gap-1.5">
          <div className="h-5 w-14 rounded-full bg-zinc-800" />
          <div className="h-5 w-16 rounded-full bg-zinc-800" />
        </div>
      </div>
    </div>
  )
}
