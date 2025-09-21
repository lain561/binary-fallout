import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom'; // Add this
import { checkAuth } from '../api/login'; // Import the helper

// In your QuestionModal.jsx component
const generateQuestionWithGemini = async (card) => {
  // Map card suits to question categories
  const categories = {
    'S': 'Data Structures (Arrays, Binary Trees/Binary Search Trees, AVL Trees, Hash Tables, Heaps, Linked Lists, Queues, Stacks, Tries)',
    'H': 'Algorithms (This includes Sorting algorithms, Backtracking problems and questions on Recursion)',
    'D': 'Bitwise Operators and Binary (Basic Binary Conversion to Decimal and Understanding of when to use the Logical Bitwise operators and what they do)',
    'C': 'Dynamic Memory Management in C (These will be questions on how to correctly use free() and malloc()/calloc())'
  };
  
  // Map card ranks to difficulty levels
  const getDifficulty = (rank) => {
    if (rank === 'A') return 'very easy';
    if (['2', '3', '4'].includes(rank)) return 'easy';
    if (['5', '6', '7'].includes(rank)) return 'medium';
    if (['8', '10'].includes(rank)) return 'hard';
    return 'medium'; // default
  };
  
  const category = categories[card.suit];
  const difficulty = getDifficulty(card.rank);
  
  // Craft prompt for Gemini
  const prompt = `
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


  try {
    const response = await fetch('http://localhost:5001/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });
    
    const data = await response.json();
    
    // Parse the response text as JSON
    // Note: You might need to clean the response if Gemini adds extra text
    let cleaned = data.response.trim();

    // Remove triple backticks and optional json
    cleaned = cleaned.replace(/```json|```/g, '').trim();

    const questionData = JSON.parse(cleaned);

    console.log('Cleaned response:', cleaned);

    return questionData;
  } catch (error) {
    console.error('Error generating question:', error);
    return null;
  }
};

const QuestionModal = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [currentCard, setCurrentCard] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for the cardDrawn event
    const handleCardDrawn = async (event) => {
      const card = event.detail;
      setCurrentCard(card);
      setIsLoading(true);
      setIsVisible(true);
      
      // Generate question using Gemini
      const questionData = await generateQuestionWithGemini(card);
      console.log(questionData);
      
      if (questionData) {
        setCurrentQuestion(questionData);
      } else {
        // Fallback to a default question if API fails
        setCurrentQuestion({
          question: "Which sorting algorithm has O(n log n) time complexity?",
          options: ["Bubble Sort", "Quick Sort", "Insertion Sort", "Selection Sort"],
          correctAnswerIndex: 1,
          explanation: "Quick Sort has an average time complexity of O(n log n)."
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
  }, []);

  const redirectToLogin = () => {
    setIsVisible(false);
    navigate('/login');
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
          body: JSON.stringify({ card: currentCard })
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
        <motion.div 
          className="fixed inset-0 flex items-center justify-center z-50 bg-black/80"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
            
        <motion.div 
          className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 border-2 border-green-500 p-6 rounded-lg shadow-lg shadow-green-500/20 mx-4"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
        >
            <div className="text-green-400 font-mono">
              {/* Header with card info */}
              <div className="text-xs mb-6 opacity-50 flex justify-between">
                <span>PROTOCOL: DEBUGGING REALITY</span>
                <span>CARD: {currentCard?.rank}{currentCard?.suit}</span>
              </div>
              
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