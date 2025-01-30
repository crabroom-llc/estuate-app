"use client";
import SignupForm from "@/components/signup/SignupForm";
import { useEffect } from "react";
import { getCookie, setCookie } from '@/utils/cookies';
export default function Home() {
  useEffect(() => {
    const token = getCookie(null, 'token');
    console.log(token);
    if (token) {
      window.location.href = "/";
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
