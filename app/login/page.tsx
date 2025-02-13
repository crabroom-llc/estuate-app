"use client";
import LoginForm from "@/components/login/LoginForm";
import '@ant-design/v5-patch-for-react-19';
import { useEffect } from "react";
import { getCookie, setCookie } from '@/utils/cookies';
import Header from "@/components/login/header";
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
        <LoginForm />
        <Footer />
      </main>
    </div>
  );
}
