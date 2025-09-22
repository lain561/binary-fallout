import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import NavbarGame from '../components/NavbarGame';
import NavbarPublic from '../components/NavbarPublic'; // Import the public navbar
import QuizSetupModal from '../components/QuizModal';
import GameControls from '../components/GameControls';
import backgroundImage from '../images/mainframe.jpeg';

const suits = {
  'S': '♠️',
  'H': '♥️',
  'D': '♦️',
  'C': '♣️'
};

const CardDraw = () => {
  const [card, setCard] = useState(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showQuizSetup, setShowQuizSetup] = useState(false);
  const [quizConfig, setQuizConfig] = useState(null);
  const [hasConfiguredQuiz, setHasConfiguredQuiz] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Add login state

  useEffect(() => {
    // Check if user is logged in - replace this with your actual auth check
    const checkAuthStatus = () => {
      // Option 1: Check for auth token in localStorage
      const token = localStorage.getItem('token');
      console.log(token);
      setIsLoggedIn(token);
    };

    checkAuthStatus();

    const savedCard = localStorage.getItem('currentCrd');
    const savedQuizConfig = localStorage.getItem('quizConfig');
    
    if (savedCard) {
      setCard(JSON.parse(savedCard));
    }
    
    if (savedQuizConfig) {
      const config = JSON.parse(savedQuizConfig);
      setQuizConfig(config);
      setHasConfiguredQuiz(true);
      // Dispatch the quiz config for other components
      document.dispatchEvent(new CustomEvent('quizConfigured', { detail: config }));
    } else {
      // Show quiz setup on first visit
      setShowQuizSetup(true);
    }
  }, []);

  const handleQuizStart = (config) => {
    setQuizConfig(config);
    setHasConfiguredQuiz(true);
    setShowQuizSetup(false);
    
    // Save to localStorage
    localStorage.setItem('quizConfig', JSON.stringify(config));
    
    // Dispatch event for other components
    document.dispatchEvent(new CustomEvent('quizConfigured', { detail: config }));
    
    console.log('Quiz configured:', config);
  };

  const handleGameReset = async () => {
  try {
    const token = localStorage.getItem("token");

    const res = await fetch("http://localhost:5001/api/cards/clear", {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Failed to reset collection:", data.error || data);
      return;
    }

    console.log("Reset success:", data.message);

    setCard(null);
    setIsFlipped(false);
    setQuizConfig(null);
    setHasConfiguredQuiz(false);

    localStorage.removeItem("currentCard");
    localStorage.removeItem("quizConfig");

    document.dispatchEvent(new CustomEvent("gameReset"));

    setShowQuizSetup(true);

    console.log("Game reset complete (frontend + backend)");
  } catch (err) {
    console.error("Error resetting game:", err);
  }
};


  const handleConfigureQuiz = () => {
    setShowQuizSetup(true);
  };

  const drawCard = () => {
    if (isDrawing) return;
    
    // Check if quiz is configured before allowing card draw
    if (!hasConfiguredQuiz) {
      setShowQuizSetup(true);
      return;
    }
    
    setIsDrawing(true);
    setIsFlipped(false);
    
    // Generate a random card
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
    const suitKeys = Object.keys(suits);
    
    const newRank = ranks[Math.floor(Math.random() * ranks.length)];
    const newSuit = suitKeys[Math.floor(Math.random() * suitKeys.length)];
    
    const newCard = {
      rank: newRank,
      suit: newSuit,
      id: `${newRank}${newSuit}`
    };
    
    // Save to localStorage
    localStorage.setItem('currentCard', JSON.stringify(newCard));
    
    setTimeout(() => {
      setCard(newCard);
      setIsFlipped(true);
      setIsDrawing(false);
    
      // Wait another 1.4 seconds before triggering the question modal
      setTimeout(() => {
        const event = new CustomEvent('cardDrawn', { detail: newCard });
        document.dispatchEvent(event);
      }, 1400); // 2s total delay = 600ms + 1400ms
    }, 600);
  };

  return (
    <div className="relative min-h-screen text-green-400 font-theme overflow-hidden">
      {/* Background image with absolute positioning */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0" 
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />
      
      <div className="vhs-overlay absolute inset-0"></div>

      {/* Backdrop blur layer that covers the entire page */}
      <div className="absolute inset-0 backdrop-blur-xl brightness-90 z-0" />

      {/* Quiz Setup Modal */}
      <QuizSetupModal 
        isVisible={showQuizSetup}
        onClose={() => {
          if (hasConfiguredQuiz) {
            setShowQuizSetup(false);
          }
          // If no quiz configured yet, keep modal open
        }}
        onStartGame={handleQuizStart}
      />
      
      {/* Content container */}
      <div className="relative z-10 flex flex-col min-h-screen items-center">
        {/* Conditional Navbar rendering */}
        {isLoggedIn ? <NavbarGame /> : <NavbarPublic />}
    
        {/* Main content centered below the navbar */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="mb-8 text-center">
            <h2 className="text-[4rem] italic font-semibold vhs-shift"
            data-text="GAME ARENA">GAME ARENA</h2>
  
            
            {/* Quiz Configuration Display */}
            {quizConfig && (
            <div className="m-4 mt-0 p-3 bg-green-900/70 border border-green-700 rounded-lg">
              <div className="text-center text-sm">
                <div className="text-green-300 font-semibold">ACTIVE PROTOCOL: {quizConfig.subject.toUpperCase()}</div>
                <div className="opacity-70 text-xs mt-1">
                  <span>Difficulty: {quizConfig.difficulty}</span>
                  <span className="mx-2">•</span>
                  <span>Topics: {quizConfig.topics.length > 60 ? `${quizConfig.topics.substring(0, 60)}...` : quizConfig.topics}</span>
                </div>
              </div>
            </div>
        )}

            <p className="text-md font-semibold text-shadow-xl max-w-xl mb-2 font-mono">
              {hasConfiguredQuiz 
                ? `Draw a card to summon a ${quizConfig?.subject} challenge from the corrupted matrix. Correct answers repair the world!`
                : "Configure your quiz protocol to begin the simulation!"
              }
            </p>
          
            {/* Game Controls - only show for logged in users */}
            {hasConfiguredQuiz && isLoggedIn && (
              <GameControls 
                onResetGame={handleGameReset}
                onConfigureQuiz={handleConfigureQuiz}
              />
            )}
    
          </div>
  
          <div className="relative w-64 h-96 mb-8">
            {card && (
              <motion.div 
                className="absolute inset-0 bg-gray-900 border-2 border-green-500 rounded-lg shadow-lg overflow-hidden"
                initial={{ rotateY: 180 }}
                animate={{ rotateY: isFlipped ? 0 : 180 }}
                transition={{ duration: 0.6 }}
                style={{ backfaceVisibility: 'hidden', transformStyle: 'preserve-3d' }}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                  <div 
                    className={`text-6xl mb-2 ${card.suit === 'H' || card.suit === 'D' ? 'text-red-600' : 'text-white'}`}
                  >
                    {suits[card.suit]}
                  </div>
                  <div className="text-7xl font-bold">{card.rank}</div>
                </div>
    
                {/* Card scanlines effect */}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-green-400/5 to-transparent opacity-30"></div>
              </motion.div>
            )}
    
            {/* Card back */}
            <motion.div 
              className="absolute inset-0 bg-black border-2 border-green-500 rounded-lg flex items-center justify-center overflow-hidden"
              initial={{ rotateY: 0 }}
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6 }}
              style={{ backfaceVisibility: 'hidden', transformStyle: 'preserve-3d' }}
            >
              <div className="text-center relative z-10">
                <div className="text-xl mb-4 font-mono">PROJECT: REGENESIS</div>
              </div>
    
              {/* Card back pattern */}
              <div className="absolute inset-0 grid grid-cols-8 grid-rows-12 opacity-20 pointer-events-none">
                {Array(96).fill().map((_, i) => (
                  <div key={i} className={`border border-green-500 ${Math.random() > 0.7 ? 'bg-green-500/20' : ''}`}></div>
                ))}
              </div>
            </motion.div>
          </div>
    
          <div className="flex gap-4">
            <button 
              onClick={drawCard}
              disabled={isDrawing || !hasConfiguredQuiz}
              className="px-8 py-3 bg-green-900 hover:bg-green-700 text-green-300 
                        font-mono rounded border border-green-600 transition-all 
                        hover:shadow-lg hover:shadow-green-900/50 focus:outline-none
                        disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDrawing ? 'Processing...' : !hasConfiguredQuiz ? 'Configure Quiz First' : 'Draw Card'}
            </button>

            {/* Only show Inventory link for logged in users */}
            {isLoggedIn && (
              <a
                href="/progress"
                className="px-8 py-3 bg-green-900 hover:bg-green-700 text-green-300 
                          font-mono rounded border border-green-600 transition-all 
                          hover:shadow-lg hover:shadow-green-900/50 focus:outline-none
                          flex items-center justify-center"
              >
                Inventory
              </a>
            )}
          </div>

          <div className="mt-4 text-sm font-mono font-semibold">
            {card ? `Last drawn: ${card.rank} ${suits[card.suit]}` : 'No cards drawn yet'}
          </div>

          {/* Configuration status */}
          {!hasConfiguredQuiz && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setShowQuizSetup(true)}
                className="text-sm px-4 py-2 bg-blue-800 hover:bg-blue-700 text-blue-300 rounded border border-blue-600 transition-all"
              >
                Configure Quiz Protocol
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CardDraw;