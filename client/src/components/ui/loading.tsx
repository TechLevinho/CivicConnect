export function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );
}

export function LoadingSpinner() {
  return (
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
  );
} 