'use client';

import { motion } from "framer-motion"
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#322131] to-[#21173E]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-[#322131] to-[#21173E] p-8 rounded-2xl shadow-2xl border border-[#FB118E]/20 max-w-md w-full mx-4"
      >
        <h1 className="text-3xl font-bold text-white mb-6">Welcome Back</h1>
        
        <form className="space-y-4">
          <div>
            <label className="block text-white/60 mb-2">Email</label>
            <input
              type="email"
              className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#FB118E] focus:outline-none"
              placeholder="Enter your email"
            />
          </div>
          
          <div>
            <label className="block text-white/60 mb-2">Password</label>
            <input
              type="password"
              className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#FB118E] focus:outline-none"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            className="w-full px-4 py-3 rounded-lg bg-[#FB118E] text-white hover:bg-[#FB118E]/80 transition-colors mt-6"
            onClick={(e) => {
              e.preventDefault();
              router.push('/');
            }}
          >
            Sign In
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href="#" className="text-white/60 hover:text-white transition-colors">
            Don&apos;t have an account? Sign up
          </a>
        </div>
      </motion.div>
    </div>
  )
}
