import { motion } from "motion/react";

interface CharacterProps {
  isSpeaking: boolean;
  isListening: boolean;
}

export const Character = ({ isSpeaking, isListening }: CharacterProps) => {
  return (
    <div className="relative w-64 h-64 flex items-center justify-center">
      {/* Background Glow */}
      <motion.div
        animate={{
          scale: isSpeaking ? [1, 1.1, 1] : 1,
          opacity: isSpeaking ? [0.2, 0.4, 0.2] : 0.1,
        }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="absolute inset-0 bg-blue-500 rounded-full blur-3xl"
      />

      {/* Character Body */}
      <motion.div
        animate={{
          y: [0, -10, 0],
          rotate: isSpeaking ? [-2, 2, -2] : 0,
        }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        className="relative z-10 w-48 h-48 bg-white rounded-3xl shadow-2xl flex flex-col items-center justify-center border-4 border-blue-100"
      >
        {/* Eyes */}
        <div className="flex gap-8 mb-4">
          <motion.div
            animate={{
              scaleY: isListening ? [1, 0.1, 1] : 1,
            }}
            transition={{ repeat: Infinity, duration: 4, times: [0, 0.1, 0.2] }}
            className="w-4 h-6 bg-slate-800 rounded-full"
          />
          <motion.div
            animate={{
              scaleY: isListening ? [1, 0.1, 1] : 1,
            }}
            transition={{ repeat: Infinity, duration: 4, times: [0, 0.1, 0.2] }}
            className="w-4 h-6 bg-slate-800 rounded-full"
          />
        </div>

        {/* Mouth */}
        <motion.div
          animate={{
            scaleX: isSpeaking ? [1, 1.2, 1] : 1,
            scaleY: isSpeaking ? [0.5, 1.5, 0.5] : 0.2,
            borderRadius: isSpeaking ? "40%" : "50%",
          }}
          transition={{ repeat: Infinity, duration: 0.2 }}
          className="w-12 h-4 bg-pink-500 rounded-full"
        />

        {/* Cheeks */}
        <div className="absolute top-1/2 left-4 w-4 h-4 bg-pink-100 rounded-full blur-sm" />
        <div className="absolute top-1/2 right-4 w-4 h-4 bg-pink-100 rounded-full blur-sm" />
      </motion.div>

      {/* Listening Indicator */}
      {isListening && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-4 -right-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg"
        >
          Listening...
        </motion.div>
      )}
    </div>
  );
};
