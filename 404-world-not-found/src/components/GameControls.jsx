import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const GameResetModal = ({ isVisible, onClose, onConfirmReset }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          className="fixed inset-0 flex items-center justify-center z-50 bg-black/80"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="w-full max-w-md bg-gray-900 border-2 border-red-500 p-6 rounded-lg shadow-lg shadow-red-500/20 mx-4"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
          >
            <div className="text-red-400 font-mono text-center">
              <div className="text-xs mb-4 opacity-50">
                WARNING: SYSTEM RESET INITIATED
              </div>
              
              <h3 className="text-xl mb-4">CONFIRM MATRIX RESET</h3>
              <p className="text-sm mb-6 opacity-80">
                This will reset your current game session, shuffle the deck, and allow you to configure a new quiz. 
                Your saved cards will remain in your collection.
              </p>
              
              <div className="flex justify-center space-x-4">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-600 hover:border-gray-500 text-gray-400 hover:text-gray-300 rounded transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirmReset}
                  className="px-4 py-2 bg-red-800 hover:bg-red-700 text-red-300 rounded border border-red-600 transition-all"
                >
                  Reset Game
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const GameControls = ({ onResetGame, onConfigureQuiz }) => {
  const [showResetModal, setShowResetModal] = useState(false);

  const handleResetConfirm = () => {
    setShowResetModal(false);
    onResetGame();
  };

  return (
    <>
      <div className="mt-4 z-40 flex justify-center gap-2 space-x-2">
        <button
          onClick={onConfigureQuiz}
          className="px-3 py-2 bg-blue-800 hover:bg-blue-700 text-blue-300 text-sm rounded border border-blue-600 transition-all font-mono"
          title="Configure Quiz Settings"
        >
          CONFIG
        </button>
        <button
          onClick={() => setShowResetModal(true)}
          className="px-3 py-2 bg-red-800 hover:bg-red-700 text-red-300 text-sm rounded border border-red-600 transition-all font-mono"
          title="Reset Game"
        >
          RESET
        </button>
      </div>

      <GameResetModal 
        isVisible={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirmReset={handleResetConfirm}
      />
    </>
  );
};

export default GameControls;