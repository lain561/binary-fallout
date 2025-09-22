// Minimal changes to your existing QuestionModal.jsx
// Just update the generateQuestionWithGemini function and add quizConfig prop

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// Updated function to work with quiz config OR fallback to original system
const generateQuestionWithGemini = async (card, quizConfig = null) => {
  let prompt;
  
  if (quizConfig) {
    // NEW: Use custom quiz configuration
    const getDifficulty = (rank, configDifficulty) => {
      if (configDifficulty === 'very easy') return 'very easy';
      if (configDifficulty === 'easy') return rank === 'A' ? 'very easy' : 'easy';
      if (configDifficulty === 'medium') {
        if (rank === 'A') return 'easy';
        if (['2', '3', '4'].includes(rank)) return 'medium';
        if (['8', '10'].includes(rank)) return 'hard';
        return 'medium';
      }
      if (configDifficulty === 'hard') return ['A', '2'].includes(rank) ? 'medium' : 'hard';
      if (configDifficulty === 'very hard') return rank === 'A' ? 'hard' : 'very hard';
      return 'medium';
    };
    
    const difficulty = getDifficulty(card.rank, quizConfig.difficulty);
    
    prompt = `
     You are an educational tutor. Generate a multiple-choice question about "${quizConfig.subject}" focusing specifically on these topics: "${quizConfig.topics}". 

     The question should be at ${difficulty} difficulty level and test conceptual understanding and practical knowledge in this subject area.

     You cannot use Markdown formatting and only very short and concise code snippets are permitted (if relevant to the subject).
     Make sure code snippets are properly formatted line-by-line with each line of code on its own separate line from top to bottom. 

     Stay focused on the specified topics: ${quizConfig.topics}
     
     Subject area: ${quizConfig.subject}

     Format your response as a JSON object with the following structure:
     {
       "question": "Your question text here",
       "options": ["Option A", "Option B", "Option C", "Option D"],
       "correctAnswerIndex": 0,
       "explanation": "Brief explanation of why this answer is correct"
     }

     For ${difficulty} difficulty, ensure the question is appropriately challenging. Make sure all options are plausible, but only one is clearly correct.`;
  } else {
    // ORIGINAL: Fallback to your existing Foundation Exam system
    const categories = {
      'S': 'Data Structures (Arrays, Binary Trees/Binary Search Trees, AVL Trees, Hash Tables, Heaps, Linked Lists, Queues, Stacks, Tries)',
      'H': 'Algorithms (This includes Sorting algorithms, Backtracking problems and questions on Recursion)',
      'D': 'Bitwise Operators and Binary (Basic Binary Conversion to Decimal and Understanding of when to use the Logical Bitwise operators and what they do)',
      'C': 'Dynamic Memory Management in C (These will be questions on how to correctly use free() and malloc()/calloc())'
    };
    
    const getDifficulty = (rank) => {
      if (rank === 'A') return 'very easy';
      if (['2', '3', '4'].includes(rank)) return 'easy';
      if (['5', '6', '7'].includes(rank)) return 'medium';
      if (['8', '10'].includes(rank)) return 'hard';
      return 'medium';
    };
    
    const category = categories[card.suit];
    const difficulty = getDifficulty(card.rank);
    
    prompt = `
      You are a computer science tutor for UCF’s Foundation Exam. Generate a multiple-choice question about ${category} at ${difficulty} difficulty level that reflects the type of conceptual and practical knowledge expected from students preparing for this exam. 

        You cannot use Markdown formatting and only very short and concise code snippets are permitted.
        However, code snippets should not be very common in their chance to appear.
        Make sure code snippets are properly formatted line-by-line with each line of code on its own separate line from top to bottom as if you were ChatGPT. Do not generate answers that are off-topic from this information. Focus on the topics related to the exam (like data structures, algorithms, bitwise operators, etc.).

        The categories include:
          Spades = Data Structures (Arrays, Binary Trees/Binary Search Trees, AVL Trees, Hash Tables, Heaps, Linked Lists, Queues, Stacks, Tries)
          Hearts = Algorithms (This includes Sorting algorithms, Backtracking problems and questions on Recursion)
          Diamonds = Bitwise Operators and Binary (Basic Binary Conversion to Decimal and Understanding of when to use the Logical Bitwise operators and what they do)
          Clubs = Dynamic Memory Management in C (These will be questions on how to correctly use free() and malloc()/calloc())

        Format your response as a JSON object with the following structure:
        {
          "question": "Your question text here",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswerIndex": 0,  // Index of the correct answer (0-3)
          "explanation": "Brief explanation of why this answer is correct"
        }

        For ${difficulty} difficulty, ensure the question is appropriately challenging for UCF’s Foundation Exam. Make sure all options are plausible, but only one is clearly correct. The difficulty scale ranges from 1-3 (Easy), 4-6 (Medium), 7-10 (Hard) and should increase accordingly while remaining solvable for a well-prepared student.`;
  }

  // Rest of your existing API call logic stays the same
  try {
    const response = await fetch('http://localhost:5001/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });
    
    const data = await response.json();
    let cleaned = data.response.trim();
    cleaned = cleaned.replace(/```json|```/g, '').trim();
    const questionData = JSON.parse(cleaned);
    
    console.log('Cleaned response:', cleaned);
    return questionData;
  } catch (error) {
    console.error('Error generating question:', error);
    return null;
  }
};

// Add quizConfig as a prop to your component
const QuestionModal = ({ quizConfig = null }) => {
  // All your existing state and logic stays the same
  const [isVisible, setIsVisible] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [currentCard, setCurrentCard] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleCardDrawn = async (event) => {
      const card = event.detail;
      setCurrentCard(card);
      setIsLoading(true);
      setIsVisible(true);
      
      // Pass the quizConfig to the generation function
      const questionData = await generateQuestionWithGemini(card, quizConfig);
      console.log(questionData);
      
      if (questionData) {
        setCurrentQuestion(questionData);
      } else {
        // Fallback question
        setCurrentQuestion({
          question: quizConfig 
            ? `What is a fundamental concept in ${quizConfig.subject}?`
            : "Which sorting algorithm has O(n log n) time complexity?",
          options: ["Option A", "Option B", "Option C", "Option D"],
          correctAnswerIndex: 1,
          explanation: quizConfig 
            ? `This relates to core principles in ${quizConfig.subject}.`
            : "Quick Sort has an average time complexity of O(n log n)."
        });
      }
      
      setSelectedOption(null);
      setFeedback(null);
      setIsLoading(false);
    };

    document.addEventListener('cardDrawn', handleCardDrawn);
    return () => {
      document.removeEventListener('cardDrawn', handleCardDrawn);
    };
  }, [quizConfig]); // Add quizConfig as dependency

  const redirectToLogin = () => {
    setIsVisible(false);
    navigate('/login');
  };

  // Simple authentication check function
  const checkAuth = () => {
    const token = localStorage.getItem('token');
    return !!token;
  };

  const checkAnswer = async (optionIndex) => {
    setSelectedOption(optionIndex);
    
    if (optionIndex === currentQuestion.correctAnswerIndex) {
      setFeedback({
        isCorrect: true,
        message: "Correct! Matrix repair sequence initiated.",
        explanation: currentQuestion.explanation
      });

      // Check if user is authenticated
      if (!checkAuth()) {
        setAuthError(true);
        setFeedback({
          isCorrect: true,
          message: "Correct! But you need to login to save cards.",
          explanation: currentQuestion.explanation
        });
        return;
      }

      // Add card to collection via MongoDB API
      try {
        const token = localStorage.getItem('token');
        console.log('Using token value:', token);
        console.log('Attempting to send card to backend:', currentCard);

        const response = await fetch('http://localhost:5001/api/cards/collect', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            card: currentCard,
            quizConfig: quizConfig // Include quiz config in the save request
          })
        });

        if (response.ok) {
          // Trigger an event for the Progress component to update
          document.dispatchEvent(new CustomEvent('collectionUpdated'));
          console.log('Card saved successfully!');
        } else {
          // Handle authentication errors
          if (response.status === 401 || response.status === 422) {
            setAuthError(true);
            setFeedback({
              isCorrect: true,
              message: "Correct! But your session has expired. Please login again.",
              explanation: currentQuestion.explanation
            });
          } else {
            // Log more details if the response is not OK
            const errorData = await response.json().catch(() => ({}));
            console.error(`Error saving card: ${response.status} ${response.statusText}`, errorData);
          }
        }
      } catch (error) {
        console.error('Error saving card:', error);
      }
    } else {
      setFeedback({
        isCorrect: false,
        message: "Incorrect. Matrix instability detected.",
        explanation: currentQuestion.explanation
      });
    }
  }; 

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div className="fixed inset-0 flex items-center justify-center z-50 bg-black/80" /* ... */>
          <motion.div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 border-2 border-green-500 p-6 rounded-lg shadow-lg shadow-green-500/20 mx-4" /* ... */>
            <div className="text-green-400 font-mono">
              {/* Updated header */}
              <div className="text-xs mb-6 opacity-50 flex justify-between">
                <span>PROTOCOL: {quizConfig?.subject?.toUpperCase() || 'DEBUGGING REALITY'}</span>
                <span>CARD: {currentCard?.rank}{currentCard?.suit}</span>
              </div>
              
              {/* Show quiz info if available */}
              {quizConfig && (
                <div className="text-xs mb-4 p-2 bg-green-900/20 border border-green-700 rounded">
                  <div className="opacity-70">Subject: {quizConfig.subject}</div>
                  <div className="opacity-50 text-xs mt-1">
                    Difficulty: {quizConfig.difficulty}
                  </div>
                </div>
              )}
              
               {isLoading ? (
                <div className="py-12 text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-400 border-r-transparent"></div>
                  <p className="mt-4">Generating challenge...</p>
                </div>
              ) : currentQuestion && (
                <>
                  <div className="mb-6">
                    <h3 className="text-xl mb-2">SYSTEM QUERY:</h3>
                    <p className="text-lg">{currentQuestion.question}</p>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    {currentQuestion.options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => selectedOption === null && checkAnswer(index)}
                        className={`w-full text-left p-3 border rounded-md transition-all ${
                          selectedOption === null
                            ? 'border-green-700 hover:border-green-500 hover:bg-green-900/30'
                            : selectedOption === index
                              ? currentQuestion.correctAnswerIndex === index
                                ? 'border-green-500 bg-green-900/50'
                                : 'border-red-500 bg-red-900/50'
                              : currentQuestion.correctAnswerIndex === index && selectedOption !== null
                                ? 'border-green-500 bg-green-900/50'
                                : 'border-gray-700 opacity-50'
                        }`}
                        disabled={selectedOption !== null}
                      >
                        <div className="flex items-center">
                          <span className="mr-2 opacity-70">{index + 1}.</span>
                          {option}
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
              
              {feedback && (
                <motion.div
                  className={`p-4 rounded-md mb-6 ${
                    feedback.isCorrect ? 'bg-green-900/30 border border-green-500' : 'bg-red-900/30 border border-red-500'
                  }`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <p className="text-center mb-2">{feedback.message}</p>
                  <p className="text-sm opacity-80">{feedback.explanation}</p>
                  
                  {authError && (
                    <div className="mt-4 text-center">
                      <button 
                        onClick={redirectToLogin}
                        className="px-3 py-1 bg-green-700 hover:bg-green-600 rounded text-white text-sm"
                      >
                        Login to Save Cards
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
              
              <div className="flex justify-end">
                <button
                  onClick={() => setIsVisible(false)}
                  className="px-4 py-2 bg-green-800 hover:bg-green-700 text-green-300 
                           rounded border border-green-600 transition-all focus:outline-none"
                >
                  Close Terminal
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default QuestionModal;