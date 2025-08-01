import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("skeleton rounded-md bg-gray-200", className)}
      {...props}
    />
  )
}

// Specialized skeleton components for common use cases
function SkeletonText({ 
  lines = 3, 
  className,
  ...props 
}: { lines?: number } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i}
          className={cn(
            "h-4",
            i === lines - 1 ? "w-3/4" : "w-full" // Last line shorter
          )}
        />
      ))}
    </div>
  )
}

function SkeletonCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={cn(
        "bg-white rounded-xl p-6 border border-gray-100 shadow-sm space-y-4",
        className
      )}
      {...props}
    >
      <div className="flex items-start gap-3">
        <Skeleton className="w-8 h-8 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="w-16 h-6 rounded-full" />
      </div>
      <SkeletonText lines={2} />
      <div className="bg-gray-50 rounded-xl p-4">
        <SkeletonText lines={1} />
      </div>
    </div>
  )
}

function SkeletonAnalysisPanel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={cn(
        "bg-white rounded-xl shadow-sm border border-gray-100 animate-pulse",
        className
      )}
      {...props}
    >
      {/* Header Section */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-80" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-12 w-48 rounded-lg" />
        </div>
      </div>

      {/* Upgrade prompt skeleton */}
      <div className="mx-6 my-6">
        <div className="bg-gray-50 rounded-2xl p-8">
          <div className="text-center space-y-6">
            <Skeleton className="w-16 h-16 rounded-2xl mx-auto" />
            <div className="space-y-3">
              <Skeleton className="h-6 w-96 mx-auto" />
              <Skeleton className="h-4 w-80 mx-auto" />
            </div>
            <div className="flex gap-4 justify-center">
              <Skeleton className="h-14 w-48 rounded-lg" />
              <Skeleton className="h-14 w-48 rounded-lg" />
            </div>
            <div className="flex gap-6 justify-center">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-32" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SkeletonPaymentModal({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={cn(
        "bg-white rounded-2xl shadow-xl max-w-lg mx-auto animate-pulse",
        className
      )}
      {...props}
    >
      {/* Header */}
      <div className="bg-gray-200 p-6 rounded-t-2xl">
        <div className="text-center space-y-3">
          <Skeleton className="w-12 h-12 rounded-full mx-auto" />
          <Skeleton className="h-6 w-48 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Service options */}
        <div className="bg-gray-50 rounded-xl p-5 space-y-4">
          <Skeleton className="h-5 w-32" />
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-5 border-2">
              <div className="flex justify-between items-start mb-3">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
              <Skeleton className="h-4 w-full" />
            </div>
            <div className="bg-white rounded-xl p-5 border">
              <div className="flex justify-between items-start mb-3">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-gray-50 rounded-xl p-5">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="text-right space-y-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>

        {/* Form fields */}
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-xl p-5 space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-11 w-full rounded-lg" />
          </div>
          <div className="bg-gray-50 rounded-xl p-5 space-y-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <Skeleton className="h-12 flex-1 rounded-lg" />
          <Skeleton className="h-12 flex-1 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export { 
  Skeleton, 
  SkeletonText, 
  SkeletonCard, 
  SkeletonAnalysisPanel, 
  SkeletonPaymentModal 
}
