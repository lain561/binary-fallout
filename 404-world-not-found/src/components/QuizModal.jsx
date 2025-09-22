import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const QuizSetupModal = ({ isVisible, onClose, onStartGame }) => {
  const [quizConfig, setQuizConfig] = useState({
    subject: '',
    topics: '',
    difficulty: 'medium',
    questionCount: 20
  });
  const [isCustomizing, setIsCustomizing] = useState(false);

  // Predefined quiz templates
  const presetQuizzes = [
    {
      id: 'foundation-exam',
      name: 'UCF Foundation Exam',
      subject: 'Computer Science',
      topics: 'Data Structures (Arrays, Binary Trees/BSTs, AVL Trees, Hash Tables, Heaps, Linked Lists, Queues, Stacks, Tries), Algorithms (Sorting, Backtracking, Recursion), Bitwise Operators and Binary Conversion, Dynamic Memory Management in C (malloc, free, calloc)',
      difficulty: 'medium'
    },
    {
      id: 'data-structures',
      name: 'Data Structures Deep Dive',
      subject: 'Computer Science',
      topics: 'Arrays, Linked Lists, Stacks, Queues, Trees, Hash Tables, Heaps, Graphs, implementation and time complexity analysis',
      difficulty: 'medium'
    },
    {
      id: 'algorithms',
      name: 'Algorithm Fundamentals',
      subject: 'Computer Science', 
      topics: 'Sorting algorithms, Search algorithms, Graph algorithms, Dynamic programming, Greedy algorithms, time and space complexity',
      difficulty: 'medium'
    },
    {
      id: 'web-dev',
      name: 'Web Development',
      subject: 'Web Development',
      topics: 'HTML, CSS, JavaScript, React, Node.js, databases, RESTful APIs, responsive design, web security',
      difficulty: 'easy'
    },
    {
      id: 'machine-learning',
      name: 'Machine Learning Basics',
      subject: 'Machine Learning',
      topics: 'Supervised learning, unsupervised learning, neural networks, regression, classification, clustering, model evaluation',
      difficulty: 'hard'
    }
  ];

  const handlePresetSelect = (preset) => {
    setQuizConfig({
      subject: preset.subject,
      topics: preset.topics,
      difficulty: preset.difficulty,
      questionCount: 20
    });
    setIsCustomizing(false);
  };

  const handleStartGame = () => {
    if (!quizConfig.subject.trim() || !quizConfig.topics.trim()) {
      alert('Please fill in both subject and topics before starting the game.');
      return;
    }
    
    onStartGame(quizConfig);
    onClose();
  };

  const handleCustomize = () => {
    setIsCustomizing(true);
    setQuizConfig({
      subject: '',
      topics: '',
      difficulty: 'medium',
      questionCount: 20
    });
  };

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
            className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-2 border-green-500 p-6 rounded-lg shadow-lg shadow-green-500/20 mx-4"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
          >
            <div className="text-green-400 font-mono">
              {/* Header */}
              <div className="text-xs mb-6 opacity-50 flex justify-between">
                <span>PROTOCOL: QUIZ CONFIGURATION</span>
                <span>STATUS: AWAITING INPUT</span>
              </div>
              
              <div className="mb-6">
                <h2 className="text-2xl mb-2">INITIALIZE QUIZ PARAMETERS</h2>
                <p className="opacity-80">Configure your learning simulation before entering the Matrix</p>
              </div>

              {!isCustomizing ? (
                // Preset Selection Screen
                <div>
                  <h3 className="text-xl mb-4">SELECT PRESET CONFIGURATION:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {presetQuizzes.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => handlePresetSelect(preset)}
                        className="text-left p-4 border border-green-700 rounded-md hover:border-green-500 hover:bg-green-900/30 transition-all"
                      >
                        <div className="font-semibold text-green-300 mb-2">{preset.name}</div>
                        <div className="text-sm opacity-70 mb-2">{preset.subject}</div>
                        <div className="text-xs opacity-50 line-clamp-3">{preset.topics}</div>
                        <div className="text-xs mt-2 text-green-400">Difficulty: {preset.difficulty}</div>
                      </button>
                    ))}
                  </div>
                  
                  <div className="text-center mb-6">
                    <span className="text-green-300">— OR —</span>
                  </div>
                  
                  <div className="text-center">
                    <button
                      onClick={handleCustomize}
                      className="px-6 py-3 bg-green-800 hover:bg-green-700 text-green-300 rounded border border-green-600 transition-all"
                    >
                      Create Custom Quiz
                    </button>
                  </div>
                </div>
              ) : (
                // Custom Configuration Screen
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl">CUSTOM CONFIGURATION:</h3>
                    <button
                      onClick={() => setIsCustomizing(false)}
                      className="text-sm px-3 py-1 border border-green-700 hover:border-green-500 rounded transition-all"
                    >
                      ← Back to Presets
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Subject/Category:</label>
                      <input
                        type="text"
                        value={quizConfig.subject}
                        onChange={(e) => setQuizConfig({...quizConfig, subject: e.target.value})}
                        placeholder="e.g., Computer Science, Mathematics, History..."
                        className="w-full p-3 bg-gray-800 border border-green-700 rounded-md focus:border-green-500 focus:outline-none text-green-300"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Topics to Cover:</label>
                      <textarea
                        value={quizConfig.topics}
                        onChange={(e) => setQuizConfig({...quizConfig, topics: e.target.value})}
                        placeholder="Describe the specific topics, concepts, or areas you want to be quizzed on..."
                        rows={4}
                        className="w-full p-3 bg-gray-800 border border-green-700 rounded-md focus:border-green-500 focus:outline-none text-green-300"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Difficulty Level:</label>
                        <select
                          value={quizConfig.difficulty}
                          onChange={(e) => setQuizConfig({...quizConfig, difficulty: e.target.value})}
                          className="w-full p-3 bg-gray-800 border border-green-700 rounded-md focus:border-green-500 focus:outline-none text-green-300"
                        >
                          <option value="very easy">Very Easy</option>
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                          <option value="very hard">Very Hard</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Expected Questions:</label>
                        <select
                          value={quizConfig.questionCount}
                          onChange={(e) => setQuizConfig({...quizConfig, questionCount: parseInt(e.target.value)})}
                          className="w-full p-3 bg-gray-800 border border-green-700 rounded-md focus:border-green-500 focus:outline-none text-green-300"
                        >
                          <option value={10}>~10 Questions</option>
                          <option value={20}>~20 Questions</option>
                          <option value={52}>Full Deck (~52)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Selected Configuration Display */}
              {(quizConfig.subject || quizConfig.topics) && (
                <motion.div
                  className="mt-6 p-4 bg-green-900/20 border border-green-700 rounded-md"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <h4 className="text-sm font-semibold mb-2 text-green-300">CURRENT CONFIGURATION:</h4>
                  <div className="text-sm space-y-1">
                    <div><span className="opacity-70">Subject:</span> {quizConfig.subject || 'Not set'}</div>
                    <div><span className="opacity-70">Topics:</span> {quizConfig.topics ? `${quizConfig.topics.substring(0, 100)}${quizConfig.topics.length > 100 ? '...' : ''}` : 'Not set'}</div>
                    <div><span className="opacity-70">Difficulty:</span> {quizConfig.difficulty}</div>
                    <div><span className="opacity-70">Expected Questions:</span> ~{quizConfig.questionCount}</div>
                  </div>
                </motion.div>
              )}
              
              {/* Action Buttons */}
              <div className="flex justify-between mt-8">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-600 hover:border-gray-500 text-gray-400 hover:text-gray-300 rounded transition-all"
                >
                  Cancel
                </button>
                
                <button
                  onClick={handleStartGame}
                  disabled={!quizConfig.subject.trim() || !quizConfig.topics.trim()}
                  className="px-6 py-2 bg-green-800 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 text-green-300 rounded border border-green-600 disabled:border-gray-600 transition-all"
                >
                  Initialize Matrix
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default QuizSetupModal;