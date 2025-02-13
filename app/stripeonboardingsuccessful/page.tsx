"use client";
import { OnboardingSuccessful } from "@/components/authorize/stripeOnboardingSuccessful";
import Footer from "@/components/footer";
import Header from "@/components/header";


export default function successfulOnboarding() {




  return (
    <>
      <Header />
      <div className="flex justify-center items-center h-[95vh]">
        <OnboardingSuccessful />
      </div>
      <Footer />
    </>
  );
}
