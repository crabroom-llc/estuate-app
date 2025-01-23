"use client";
import LoginForm from "@/components/login/LoginForm";
import '@ant-design/v5-patch-for-react-19';
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
        <LoginForm />
      </main>
    </div>
  );
}
