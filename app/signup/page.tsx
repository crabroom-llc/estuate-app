"use client";
import SignupForm from "@/components/signup/SignupForm";
import { useEffect } from "react";
import { getCookie, setCookie } from '@/utils/cookies';
import Header from "@/components/signup/header";
import Footer from "@/components/footer";
export default function Home() {
  useEffect(() => {
    const token = getCookie(null, 'token');
    console.log(token);
    if (token) {
      window.location.href = "/dashboard";
    }
  }, []);
  return (
    <div>
      <main>
        <Header />
        <SignupForm />
        <Footer />
      </main>
    </div>
  );
}
