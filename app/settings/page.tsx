"use client";
import Image from "next/image";
import { useEffect } from "react";
import { getCookie, setCookie } from '@/utils/cookies';
import Header from "@/components/header";
import Footer from "@/components/footer";
import Settings from "@/components/settings/Settings";

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
      <Settings />
      <Footer />
    </ >
  );
}
