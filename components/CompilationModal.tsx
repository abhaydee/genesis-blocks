import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"

interface CompilationModalProps {
  isOpen: boolean
}

const CompilationModal = ({ isOpen }: CompilationModalProps) => {
  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <div className="text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-[#322131] to-[#21173E] p-12 rounded-2xl shadow-2xl border border-[#FB118E]/20"
        >
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              {/* Outer spinning circle */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="w-24 h-24 rounded-full border-2 border-[#FB118E] border-t-transparent"
              />
              {/* Inner spinning circle */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="absolute inset-2 rounded-full border-2 border-white/30 border-b-transparent"
              />
              {/* Center loader icon */}
              <Loader2 className="w-8 h-8 text-white absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin" />
            </div>
            
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-white">Compiling Smart Contract</h2>
              <p className="text-white/60">Please wait while we generate your contract...</p>
            </div>

            {/* Progress steps */}
            <div className="space-y-2 text-sm text-left min-w-80">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 }}
                className="text-[#FB118E]"
              >
                ✓ Analyzing block structure
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 2 }}
                className="text-[#FB118E]"
              >
                ✓ Generating Clarity code
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 3 }}
                className="text-white/60"
              >
                ⟳ Optimizing contract
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 4 }}
                className="text-white/60"
              >
                ... Preparing deployment
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default CompilationModal