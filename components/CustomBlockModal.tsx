import { motion } from "framer-motion"
import { X } from "lucide-react"

interface BlockData {
  name: string;
  description: string;
}

interface CustomBlockModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (blockData: BlockData) => void
}

const CustomBlockModal = ({ isOpen, onClose, onSubmit }: CustomBlockModalProps) => {
  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-[#322131] to-[#21173E] p-8 rounded-2xl shadow-2xl border border-[#FB118E]/20 max-w-md w-full mx-4"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Create Custom Block</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={(e) => {
          e.preventDefault()
          onSubmit({
            name: "",
            description: ""
          })
        }}>
          <div className="space-y-4">
            <div>
              <label className="block text-white/60 mb-2">Block Name</label>
              <input
                type="text"
                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#FB118E] focus:outline-none"
                placeholder="Enter block name"
              />
            </div>
            
            <div>
              <label className="block text-white/60 mb-2">Block Description</label>
              <textarea
                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#FB118E] focus:outline-none min-h-[100px]"
                placeholder="Enter block description"
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-white/30 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#FB118E] text-white hover:bg-[#FB118E]/80 transition-colors"
              >
                Create Block
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default CustomBlockModal