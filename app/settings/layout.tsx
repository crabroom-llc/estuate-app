import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authorize",
  description: "Authorize",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div>{children}</div>
}