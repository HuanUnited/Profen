export default function LoadingSpinner({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="w-12 h-12 border-4 border-[#89b4fa]/20 border-t-[#89b4fa] rounded-full animate-spin mb-4" />
      <p className="text-sm text-gray-400 font-mono">{message}</p>
    </div>
  );
}
