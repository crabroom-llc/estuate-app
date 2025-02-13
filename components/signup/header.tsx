import Image from "next/image";
import Link from "next/link";
import EstuateLogo from '@/public/images/Estuate-Logo-svg.svg';
import { setCookie } from "@/utils/cookies";

const Header = () => {

    // const handleLogout = () => {
    //     try {
    //         setCookie(null, 'token', '');
    //         setCookie(null, 'userId', '');
    //         window.location.href = '/login';
    //     } catch (error) {
    //         console.log(error);
    //     }
    // };

    return (
        <header className="fixed top-0 left-0 w-full bg-white shadow-md z-50 px-44">
            <div className="container mx-auto flex items-center justify-between py-3 px-6">
                {/* Logo */}
                <Link href="/dashboard">
                    <Image src={EstuateLogo} alt="Logo" width={150} height={50} />
                </Link>

                {/* Navigation */}
                {/* <div className="flex flex-row items-center space-x-6">
                    <nav className="hidden md:flex space-x-6">
                        <Link href="#"><span className="text-gray-700 hover:text-red-600 cursor-pointer">Settings</span></Link>
                    </nav>
                    <button onClick={handleLogout} className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">
                        Logout
                    </button>
                </div> */}

            </div>
        </header>
    );
};

export default Header;