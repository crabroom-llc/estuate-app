"use client";
import Image from "next/image";
import { useEffect } from "react";
import { Connect } from "@/components/dashboard/connect";
import {gettoken, settoken} from '@/utils/cookies';

export default function Home() {
  useEffect(() => {
    const token = gettoken();;
    if(!token) {
      window.location.href = "/login";
    }
  }, []);
  return (
    <Connect/>
  );
}
