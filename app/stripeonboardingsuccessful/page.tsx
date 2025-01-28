"use client";
import { useEffect } from "react";
import {gettoken, settoken} from '@/utils/cookies';

export default function successfulOnboarding() {

   useEffect(() => {
      const token = gettoken();;
      if(!token) {
        window.location.href = "/login";
      }
    }, []);

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
     <p>Stripe onboarding successful</p>
    </div>
  );
}
