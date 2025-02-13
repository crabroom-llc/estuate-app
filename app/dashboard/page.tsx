"use client";
import Image from "next/image";
import { useEffect } from "react";
import { Connect } from "@/components/authorize/connect";
import { getCookie, setCookie } from '@/utils/cookies';
import { getUserInfoByToken } from "@/components/api/user";
import Header from "@/components/header";
import Footer from "@/components/footer";
import Link from "next/link";

export default function Home() {
  useEffect(() => {
    const token = getCookie(null, 'token');
    getUserInfoByToken().then((res) => { });
    if (!token) {
      window.location.href = "/login";
    }
  }, []);
  return (
    <>
      <Header />
      <div className=" mt-[180px] md:mt-[128px] grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-[78vh] gap-16 font-[family-name:var(--font-geist-sans)]">
        <main className="flex flex-col gap-8 justify-center items-center w-full">
          <h1 className="text-3xl md:text-4xl font-semibold">Dashboard</h1>
          <div className="md:w-1/2 flex flex-col md:flex-row gap-y-4 justify-between items-center px-4">
            <p className="text-xl font-medium text-center">Connect your Hubspot and Stripe Account</p>
            <Link href={'/authorize'} className="border px-4 py-1 text-xl rounded-lg border-black hover:border-red-500 hover:text-red-500">Connect</Link>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}
