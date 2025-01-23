import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Sign up for an account",
};

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div>{children}</div>
}