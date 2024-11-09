import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Sidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <div className="w-32 bg-gradient-to-br from-[#322131] to-[#21173E] text-white h-screen fixed left-0 top-20 -mt-4 border-r-[1px] border-t-[1px] border-[#FB118E]/20">
      <nav className="h-4">
        <Link legacyBehavior href="/" passHref>
          <a
            className={`w-full h-20 flex items-center justify-center transition-all duration-300 relative overflow-hidden group hover:bg-gradient-to-r hover:from-[#FB118E]/10 hover:to-transparent before:absolute before:inset-0 before:bg-gradient-to-r before:from-[#FB118E]/10 before:to-transparent before:translate-x-[-100%] hover:before:translate-x-0 before:transition-transform before:duration-300 border-b border-r border-[#FB118E]/20 ${
              pathname === '/' ? 'bg-[#FB118E]/10' : ''
            }`}
          >
            <span className="text-lg font-semibold text-white">
              DeFi
            </span>
          </a>
        </Link>
      </nav>
    </div>
  );
};

export default Sidebar;
