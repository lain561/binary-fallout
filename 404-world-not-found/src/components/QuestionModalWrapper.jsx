// QuestionModalWrapper.jsx - Place this in your components folder
import { useEffect, useState } from 'react';
import QuestionModal from './QuestionModal'; // Your existing QuestionModal

const QuestionModalWrapper = () => {
  const [quizConfig, setQuizConfig] = useState(null);

  useEffect(() => {
    // Listen for quiz configuration updates
    const handleQuizConfigUpdate = (event) => {
      setQuizConfig(event.detail);
    };

    // Listen for game reset
    const handleGameReset = () => {
      setQuizConfig(null);
    }; 





    // Load saved quiz config on mount
    const savedQuizConfig = localStorage.getItem('quizConfig');
    if (savedQuizConfig) {
      setQuizConfig(JSON.parse(savedQuizConfig));
    }

    document.addEventListener('quizConfigured', handleQuizConfigUpdate);
    document.addEventListener('gameReset', handleGameReset);
    
    return () => {
      document.removeEventListener('quizConfigured', handleQuizConfigUpdate);
      document.removeEventListener('gameReset', handleGameReset);
    };
  }, []);

  // Only render the QuestionModal if we have a quiz config
  return quizConfig ? <QuestionModal quizConfig={quizConfig} /> : null;
};

export default QuestionModalWrapper;