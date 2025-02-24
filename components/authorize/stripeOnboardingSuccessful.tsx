"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { generateAccessCode } from "../api/stripe/Oauth/Oauth";
import { useSearchParams } from "next/navigation";
import { getCookie, setCookie } from '@/utils/cookies';
import Link from "next/link";
import { Suspense } from "react";


const  OnboardingSuccessful = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HubSpotOnboardingContent />
    </Suspense>
  );
}


const HubSpotOnboardingContent = () => {
  const [generateAccessCodeStatus, setGenerateAccessCodeStatus] = useState(false);
  const [screenLoading, setScreenLoading] = useState(true);
  const searchParams = useSearchParams();
  useEffect(() => {
    async function fetchData() {
      const token = getCookie(null, 'token');
      if (!token) {
        window.location.href = "/login";
      } else {
        const code = searchParams.get("code");
        console.log("Authorized code", code);
        const generateCodeStatus = await generateAccessCode(code);
        console.log(generateCodeStatus);
        setScreenLoading(false);
        if (generateCodeStatus) {

          setGenerateAccessCodeStatus(true);
          return;
        }
      }
    }
    fetchData();
  }, [searchParams]);
  return (
    <div className="flex flex-col gap-y-4">
      {screenLoading && (
        <div className="fixed inset-0 backdrop-blur-sm z-[9999] flex items-center justify-center text-white">
          <div className="w-10 h-10 border-4 border-solid border-t-transparent rounded-full border-gray-600 animate-spin"></div>
        </div>
      )}
      {generateAccessCodeStatus ? (
        <div>
          <h1>Onboarding Successful</h1>
          <p>Thank you for onboarding with us. You can now access the dashboard.</p>
        </div>
      ) : (
        <div>
          <h1>Onboarding Failed</h1>
          <p>There was an error while onboarding. Please try again.</p>
        </div>
      )}
      <div>
        <Link href="/dashboard" className="text-blue-500 border border-blue-500 rounded-lg px-4 py-2">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}

export { OnboardingSuccessful };