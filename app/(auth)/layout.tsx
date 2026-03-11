export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-100 p-4 dark:bg-zinc-950">
      <div className="mx-auto flex min-h-[85vh] max-w-5xl items-center justify-center">
        {children}
      </div>
    </div>
  );
}

