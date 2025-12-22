import React from "react";
import { motion } from "framer-motion";

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  isDestructive = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md border border-zinc-800 p-8"
      >
        <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
        <p className="text-zinc-400 mb-8">{message}</p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg font-medium text-white transition-colors shadow-lg ${
              isDestructive
                ? "bg-red-600 hover:bg-red-500 shadow-red-900/20"
                : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/20"
            }`}
          >
            {isDestructive ? "Delete Everything" : "Confirm"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
