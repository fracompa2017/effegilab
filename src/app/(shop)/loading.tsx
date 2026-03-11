export default function ShopLoading() {
  return (
    <div className="space-y-8">
      <div className="h-[420px] animate-pulse rounded-3xl bg-[#ECE4D8]" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-3xl bg-white">
            <div className="h-56 animate-pulse bg-[#EFE8DB]" />
            <div className="space-y-2 p-4">
              <div className="h-4 w-3/4 animate-pulse rounded bg-[#EFE8DB]" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-[#EFE8DB]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

