"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { stripeRefreshcode } from "../api/stripe/Oauth/Oauth";



const onboardingSuccessful = () => {
    const [AccessCode, setAccessCode] = useState('');

    useEffect(() => {
        const token = localStorage.getItem("token");
        if(!token) {
        window.location.href = "/login";
        }
    }, []);

    useEffect(() => {
        // Get the query parameters from the URL
        const params = new URLSearchParams(window.location.search);

        // Extract the "code" parameter
        const code = params.get('code');

        // If "code" exists, set it in the AccessCode state
        if (code) {
            stripeRefreshcode(code);
        }
    }, []);
}