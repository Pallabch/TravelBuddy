export default function ResetPasswordPage() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Reset password</h1>
      <p className="mt-4 text-stone-600 dark:text-stone-400">
        Password reset emails come from Neon Auth. This page is available
        before you sign in.
      </p>
    </main>
  );
}
