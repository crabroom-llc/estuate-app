"use client";
import Image from "next/image";
import { useEffect } from "react";
import { Connect } from "@/components/dashboard/connect";
import {getCookie, setCookie} from '@/utils/cookies';

export default function Home() {
  useEffect(() => {
    const token = getCookie(null,'token');;
    if(!token) {
      window.location.href = "/login";
    }
  }, []);
  return (
    <Connect/>
  );
}
