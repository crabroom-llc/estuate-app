"use client";
import Image from "next/image";
import { useEffect } from "react";
import { Connect } from "@/components/authorize/connect";
import { getCookie, setCookie } from '@/utils/cookies';
import Header from "@/components/header";
import Footer from "@/components/footer";

export default function Home() {
  useEffect(() => {
    const token = getCookie(null, 'token');;
    if (!token) {
      window.location.href = "/login";
    }
  }, []);
  return (
    <>
      <Header />
      <Connect />
      <Footer />
    </>
  );
}
