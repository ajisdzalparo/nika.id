export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50 px-4 py-8 sm:py-12">
      <div className="w-full max-w-md sm:max-w-lg">{children}</div>
    </div>
  );
}
