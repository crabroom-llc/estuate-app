"use client";
import SignupForm from "@/components/signup/SignupForm";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      window.location.href = '/';
    }
  }, []);
  return (
    <div>
      <main>
        <SignupForm />
      </main>
    </div>
  );
}
