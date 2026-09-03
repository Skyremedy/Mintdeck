import LoginForm from "../../components/admin/LoginForm"

export const metadata = { title: "Sign in — Mint Deck admin" }

export default async function AdminLogin({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await searchParams
  return <LoginForm next={next ?? "/admin"} />
}
