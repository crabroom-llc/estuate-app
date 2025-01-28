"use client";
import LoginForm from "@/components/login/LoginForm";
import '@ant-design/v5-patch-for-react-19';
import { useEffect } from "react";
import { getCookie, setCookie } from '@/utils/cookies';
export default function Home() {
  useEffect(() => {
    const token = getCookie(null, 'token');
    console.log(token);
    if (token) {
      window.location.href = "/";
    }
  }, []);;
  return (
    <div>
      <main>
        <LoginForm />
      </main>
    </div>
  );
}
