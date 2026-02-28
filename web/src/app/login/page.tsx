import { login } from './actions'
import Link from 'next/link'

export default async function LoginPage(props: {
  searchParams: Promise<{ message: string }>
}) {
  const searchParams = await props.searchParams

  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 mx-auto mt-20">
      <h1 className="text-2xl font-bold mb-4">Sign In to Nexus</h1>
      <form className="animate-in flex-1 flex flex-col w-full justify-center gap-2 text-foreground" action={login}>
        <label className="text-md" htmlFor="email">
          Email
        </label>
        <input
          className="rounded-md px-4 py-2 bg-inherit border mb-6"
          type="email"
          name="email"
          placeholder="you@example.com"
          required
        />
        <label className="text-md" htmlFor="password">
          Password
        </label>
        <input
          className="rounded-md px-4 py-2 bg-inherit border mb-6"
          type="password"
          name="password"
          placeholder="••••••••"
          required
        />
        <button className="bg-primary rounded-md px-4 py-2 text-primary-foreground mb-2">
          Sign In
        </button>
        {searchParams?.message && (
          <p className="mt-4 p-4 bg-destructive/10 text-destructive text-center rounded-md">
            {searchParams.message}
          </p>
        )}
      </form>
      <Link href="/signup" className="text-sm text-center underline mt-4">
        Don&apos;t have an account? Sign up
      </Link>
    </div>
  )
}
