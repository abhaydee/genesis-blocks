import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
    return (
        <nav className="fixed w-full bg-gradient-to-br from-[#322131] to-[#21173E] text-white border-b border-[#FB118E]/20">
            <div className="px-10 mx-auto flex items-center h-16">
                <div className="flex items-center space-x-4">
                    <Link href="/" className="flex items-center space-x-2 hover:cursor-pointer">
                        <Image 
                            src="/logo.jpeg" 
                            alt="Logo" 
                            className="w-10 h-10" 
                            width={40} 
                            height={40}
                        />
                        <span className="text-[#fa43a4] font-bold">Genesis Block</span>
                    </Link>
                </div>
            </div>
        </nav>
    );
}
