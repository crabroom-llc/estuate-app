"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { generateAccessCode } from "../api/stripe/Oauth/Oauth";
import { useSearchParams } from "next/navigation";
import {gettoken, settoken} from '@/utils/cookies';


const OnboardingSuccessful = () => {
    const [generateAccessCodeStatus, setGenerateAccessCodeStatus] = useState(false);
  const searchParams = useSearchParams(); 
  useEffect(() => {
    async function fetchData() {
      const token = gettoken();
      if (!token) {
        window.location.href = "/login";
      } else {
        const code = searchParams.get("code");
        console.log("Authorized code", code);
        const generateCodeStatus = await generateAccessCode(code);
        if(generateCodeStatus){
            setGenerateAccessCodeStatus(true);
            return;
        }
      }
    }
  
    fetchData();
  }, []);
  return(
    <div>
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
    </div>
  );
}

export { OnboardingSuccessful };