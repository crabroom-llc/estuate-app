import { useState, useEffect } from "react";
import Link from "next/link";

const Footer = () => {
    const [showScroll, setShowScroll] = useState(false);

    // Show the scroll button when the user scrolls down
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 300) {
                setShowScroll(true);
            } else {
                setShowScroll(false);
            }
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Scroll to top function
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <footer className="bg-black text-white text-sm relative">
            {/* Footer Top - Grid Layout */}
            {/* <div className="container mx-auto py-10 px-6 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8">

                <div>
                    <h4 className="text-lg font-bold mb-4 uppercase">SERVICES</h4>
                    <ul className="space-y-2 text-gray-300">
                        <li>• <Link href="https://www.estuate.com/estuate-services/digital-platform-engineering/" className="hover:text-red-500">Digital Platform Engineering</Link></li>
                        <li>• <Link href="https://www.estuate.com/estuate-services/digital-business-apps/" className="hover:text-red-500">Digital Business Apps</Link></li>
                        <li>• <Link href="https://www.estuate.com/estuate-services/digital-security-and-grc/" className="hover:text-red-500">Digital Security & GRC</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="text-lg font-bold mb-4 uppercase">SOLUTIONS</h4>
                    <ul className="space-y-2 text-gray-300">
                        <li>• <Link href="https://www.estuate.com/estuate-services/digital-platform-engineering/automation-ai/generative-ai/" className="hover:text-red-500">Gen AI Solutions</Link></li>
                        <li>• <Link href="https://www.estuate.com/solutions/archive-viewer/" className="hover:text-red-500">Archive Viewer</Link></li>
                        <li>• <Link href="https://www.estuate.com/solutions/archlenz/" className="hover:text-red-500">Archlenz</Link></li>
                        <li>• <Link href="https://www.estuate.com/solutions/giftlenz/" className="hover:text-red-500">Giftlenz</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="text-lg font-bold mb-4 uppercase">INDUSTRIES</h4>
                    <ul className="space-y-2 text-gray-300">
                        <li>• <Link href="https://www.estuate.com/industries/enterprises" className="hover:text-red-500">Enterprises</Link></li>
                        <li>• <Link href="https://www.estuate.com/industries/high-tech/" className="hover:text-red-500">Hi-Tech</Link></li>
                        <li>• <Link href="https://www.estuate.com/industries/finance" className="hover:text-red-500">Finance</Link></li>
                        <li>• <Link href="https://www.estuate.com/industries/healthcare" className="hover:text-red-500">Healthcare</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="text-lg font-bold mb-4 uppercase">RESOURCES</h4>
                    <ul className="space-y-2 text-gray-300">
                        <li>• <Link href="https://www.estuate.com/resources/datasheets/" className="hover:text-red-500">Data Sheets</Link></li>
                        <li>• <Link href="https://www.estuate.com/resources/whitepapers" className="hover:text-red-500">White Papers</Link></li>
                        <li>• <Link href="https://www.estuate.com/resources/e-books/" className="hover:text-red-500">E-Books</Link></li>
                        <li>• <Link href="https://www.estuate.com/resources/success-stories/" className="hover:text-red-500">Success Stories</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="text-lg font-bold mb-4 uppercase">COMPANY</h4>
                    <ul className="space-y-2 text-gray-300">
                        <li>• <Link href="https://www.estuate.com/company/about-us" className="hover:text-red-500">About Us</Link></li>
                        <li>• <Link href="https://www.estuate.com/company/our-team" className="hover:text-red-500">Our Leaders</Link></li>
                        <li>• <Link href="https://www.estuate.com/company/partners" className="hover:text-red-500">Partners</Link></li>
                        <li>• <Link href="https://www.estuate.com/company/events/" className="hover:text-red-500">Events</Link></li>
                    </ul>
                </div>

            </div> */}

            {/* Footer Bottom Section */}
            <div className="bg-gray-800 py-4">
                <div className="container mx-auto flex flex-col md:flex-row items-center justify-between px-6">

                    {/* Social Icons as Text */}
                    <div className="flex space-x-6">
                        <Link href="http://www.linkedin.com/company/estuate-inc.?trk=fc_badge" target="_blank" className="hover:text-red-500">LinkedIn</Link>
                        <Link href="https://twitter.com/estuate" target="_blank" className="hover:text-red-500">Twitter</Link>
                        <Link href="https://www.youtube.com/user/EstuateVideo" target="_blank" className="hover:text-red-500">YouTube</Link>
                        <Link href="https://www.facebook.com/Estuate" target="_blank" className="hover:text-red-500">Facebook</Link>
                    </div>

                    {/* Copyright & Policies */}
                    <div className="text-center md:text-left mt-4 md:mt-0 text-gray-400">
                        Copyright © 2025 Estuate.
                        <Link href="https://www.estuate.com/estuate-s-privacy-policies" target="_blank" className="hover:text-red-500 ml-2">Privacy Policies</Link> |
                        <Link href="https://www.estuate.com/estuate-s-cookie-policies" target="_blank" className="hover:text-red-500 ml-2">Cookies Policies</Link>
                    </div>

                </div>
            </div>

            {/* Scroll-to-Top Button */}
            {showScroll && (
                <button
                    onClick={scrollToTop}
                    className="fixed bottom-6 right-6 bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-lg transition duration-300"
                >
                    ⬆
                </button>
            )}

        </footer>
    );
};

export default Footer;