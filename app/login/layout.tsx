import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login",
  description: "Login for an account",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div>{children}</div>
}