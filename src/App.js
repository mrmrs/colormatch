import React, { useState, useEffect } from 'react';
import chroma from 'chroma-js';
import { RefreshCcw } from 'feather-icons-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ChromePicker } from 'react-color';
import './App.css'

function App() {
    //  const [color, setColor] = useState('#ff0000');
  const [randomColor, setRandomColor] = useState(null);
  const [selectedColor, setSelectedColor] = useState('');
  const [startTime, setStartTime] = useState(0);
  const [score, setScore] = useState(null);
  const [timeTaken, setTimeTaken] = useState('');
  const [accuracy, setAccuracy] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timerId, setTimerId] = useState(null);
  const [dailyScores, setDailyScores] = useState([]);
  const [allTimeScores, setAllTimeScores] = useState([]);
  const [pixelPerfectBadge, setPixelPerfectBadge] = useState(false);

  const [username, setUsername] = useState(() => localStorage.getItem('username') || '');
  const [highScore, setHighScore] = useState(() => {
    // Retrieve the high score from local storage or set it to 0
    return localStorage.getItem('highScore') || 0;
  });
  const [gameHistory, setGameHistory] = useState(() => {
    const saved = localStorage.getItem('gameHistory');
    return saved ? JSON.parse(saved) : [];
  });
  const [showPlayAgain, setShowPlayAgain] = useState(false);

  const [count, setCount] = useState(0);

    const durableObjectName = 'COUNTER_COLORMATCH'; // Replace with the actual name of your Durable Object
    const fetchCount = async () => {
        try {
            const response = await fetch(`https://ts-gen-count.adam-f8f.workers.dev/?name=${durableObjectName}`);
            const data = await response.text();
            setCount(data);
        } catch (error) {
            console.error('Error fetching count:', error);
        }
    };

    const handleIncrement = async () => {
        try {
            await fetch(`https://ts-gen-count.adam-f8f.workers.dev/increment?name=${durableObjectName}`, {
                method: 'POST',
            });
            fetchCount(); // Update count after increment
        } catch (error) {
            console.error('Error incrementing count:', error);
        }
    };

const submitScore = async (scoreData, category) => {
 const dataWithCategory = { 
    ...scoreData, 
    category,
    selectedColor: selectedColor, // Add the selected color
    randomColor: randomColor // Add the random color
  };

  try {
    const response = await fetch('https://colormatch.adam-f8f.workers.dev/submit-score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataWithCategory),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log("Score submitted successfully");
  } catch (error) {
    console.error("Failed to submit score:", error);
  }
};

const fetchScores = async (category) => {
  // The category should be either 'daily' or 'all-time'
  const url = `https://colormatch.adam-f8f.workers.dev/get-scores?category=${category}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const scores = await response.json();
    return scores;
  } catch (error) {
    console.error("Failed to fetch scores:", error);
    return [];
  }
};

  useEffect(() => {
    localStorage.setItem('gameHistory', JSON.stringify(gameHistory));
    fetchCount();
  }, [gameHistory]);

useEffect(() => {
  const loadScores = async () => {
    const fetchedDailyScores = await fetchScores('daily');
    const fetchedAllTimeScores = await fetchScores('all-time');
    setDailyScores(fetchedDailyScores);
    setAllTimeScores(fetchedAllTimeScores);
  };

  loadScores();
}, []);


  // Start a new game
  const startNewGame = () => {
    const newRandomColor = chroma.random().hex();
    setRandomColor(newRandomColor);
    if (timerId) {
      clearInterval(timerId);
      setTimerId(null);
    }
    setSelectedColor('#F0F0F0');
    setStartTime(new Date().getTime());
    setScore(null);
    setTimeTaken('');
    setAccuracy('');
    setShowPlayAgain(false);
    setElapsedTime(0);
    setPixelPerfectBadge(false)
    const id = setInterval(() => {
      setElapsedTime((prevTime) => prevTime + 10);
    }, 10);
    setTimerId(id);
  };

  // Handle color change from color picker
  const handleColorChange = (color) => {
    setSelectedColor(color.hex);
  };

  
    // const handleColorSelection = (color) => {
    //     setSelectedColor(color);
    //   };

  // Submit the selected color and calculate the score
    const handleSubmit = () => {

      if (timerId) {
        clearInterval(timerId);
        setTimerId(null);
      }

      handleIncrement()

      if (!username) {
        const enteredUsername = prompt('Please enter your username:');
        if (enteredUsername) {
          setUsername(enteredUsername);
          localStorage.setItem('username', enteredUsername);
        } else {
          // Handle the case where user does not enter a username
          // You might want to remind them or prevent score submission
          return; // Prevent further action
        }
      }

      const currentTime = new Date().getTime();
        const timeInSeconds = (currentTime - startTime) / 1000;
        setTimeTaken(timeInSeconds.toFixed(2)); // Store as a string with two decimal places
        if (currentTime - startTime < 500) {
          // Penalize the score: Reduce the score by 50% as a penalty
          combinedScore *= 0.5;
          console.log("Computer aided humans get penalized")
        }

      const calculatedAccuracy = 100 - chroma.deltaE(randomColor, selectedColor);
      let combinedScore = 0;

      if (calculatedAccuracy > 0) {
        const accuracyPercentage = Math.max(0, calculatedAccuracy);
        setAccuracy(`${accuracyPercentage.toFixed(2)}%`);
        combinedScore = (accuracyPercentage + (100 - timeInSeconds)) / 2;
      } else {
        setAccuracy("0%");
      }

      setScore(combinedScore.toFixed(2));

      // Update game history
      const newHistory = [...gameHistory, { score: combinedScore, timeTaken, accuracy: calculatedAccuracy }];
      setGameHistory(newHistory);

      setShowPlayAgain(true);

        if (combinedScore > highScore) {
            const scoreImprovement = combinedScore - highScore;
            setHighScore(combinedScore);
            localStorage.setItem('highScore', combinedScore);
            
            // Display a toast notification with the new high score and improvement
            toast.success(`New high score: ${combinedScore.toFixed(2)}! Improvement: ${scoreImprovement.toFixed(2)} points.`);
          }

 // Prepare score data
  const scoreData = {
    user: username, // Replace with actual user identification
    score: combinedScore,
    accuracy: calculatedAccuracy,
    // ... any other relevant data
  };

  // Submit the score
   submitScore(scoreData, 'daily');

    if (calculatedAccuracy === 100) {
        setPixelPerfectBadge(true);
        // can save this information in localStorage or a database
    }


};
const handleColorInputOpen = () => {
    if (!timerId) { // Start the timer only if it's not already running
      const id = setInterval(() => {
        setElapsedTime((prevTime) => prevTime + 10);
      }, 10); // Timer updates every 10 milliseconds
      setTimerId(id);
    }
  };

  // Calculate average values
const calculateAverages = () => {
  if (gameHistory.length === 0) {
    return { avgScore: 'N/A', avgAccuracy: 'N/A', avgTime: 'N/A' };
  }

  const total = gameHistory.reduce(
    (acc, game) => {
      acc.totalScore += game.score;
      acc.totalAccuracy += game.accuracy;
      acc.totalTime += game.timeTaken; // Use timeTaken directly as it's a number
      return acc;
    },
    { totalScore: 0, totalAccuracy: 0, totalTime: 0 }
  );

  const numGames = gameHistory.length;
  return {
    avgScore: (total.totalScore / numGames).toFixed(2),
    avgAccuracy: (total.totalAccuracy / numGames).toFixed(2) + '%',
    avgTime: (total.totalTime / numGames).toFixed(2) + ' seconds'
  };
};

  const averages = calculateAverages();

  useEffect(() => {
    startNewGame(); // Start a game when the component mounts
  }, []);

    useEffect(() => {
      // Function to handle key press
      const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
          handleSubmit(); // Call your existing submit function
        }
      };

      // Add event listener
      document.addEventListener('keydown', handleKeyPress);

      // Remove event listener on cleanup
      return () => {
        document.removeEventListener('keydown', handleKeyPress);
      };
    }, [handleSubmit]);

  return (
    <div style={{ height: '100dvh', width: '100%'}}>
      <header style={{position: 'relative', height: '100%', }}>
          {randomColor && <div style={{ 
          backgroundColor: randomColor, 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',  alignItems: 'center', }}>
          <div 
            style={{ 
              minWidth: '320px',
              minHeight: '30dvh',
              backgroundColor: randomColor,
              color: chroma.contrast(randomColor, '#ffffff') > 4? 'white' : 'black', 
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }} 
      >
        {!showPlayAgain ? (
          <div>
              <dl>
                  <dt style={{ visibility: 'hidden' }}>Time</dt>
                  <dd style={{display:'none'}}> {(elapsedTime / 1000).toFixed(2)} seconds</dd>
                    <dd> {((new Date().getTime() - startTime) / 1000).toFixed(2)} seconds</dd>
              </dl>




      </div>
        ) : (
      <div>
        {score && <div>
            <dl>
                <dt>Score</dt>
                <dd style={{fontSize: '48px', fontWeight: 'bold' }}>{score}</dd>
            </dl>
          <dl>
              <dt style={{ marginBottom: '4px' }}>Time</dt>
              <dd>
                  <b>{timeTaken}</b> seconds
              </dd>
          </dl>
            <dl>
              <dt style={{ marginBottom: '4px' }}>Accuracy</dt>
                <dd style={{fontWeight: 'bold'}}>{accuracy}</dd>
            </dl>
            </div>
        }

            {score > dailyScores[dailyScores.length-1].score &&  
            <span style={{ fontWeight: 700, fontSize: '10px', borderRadius: '9999px', background: 'yellow', color: 'black', padding: '4px 16px' }}>🎪 Top 100 </span>
            }
            {accuracy > 99 &&  
            <span style={{ fontWeight: 700, fontSize: '10px', borderRadius: '9999px', background: 'yellow', color: 'black', padding: '4px 16px' }}>🔭 Super Vision Lv 4</span>
            }
      </div>
        )}
          </div>
            <div 
              style={{ 
                minWidth: '320px',
                height: '50dvh', 
                  minHeight: '30dvh',
            backgroundColor: 'white',
  backgroundSize: '8px 8px',
  backgroundImage: 'linear-gradient(to right, #f6f6f6  1px, transparent 1px), linear-gradient(to bottom, #f6f6f6 1px, transparent 1px)',
              }} 
            >
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%', backgroundColor: selectedColor }}>
    <input 
        type="color" 
        value={selectedColor} // Bind the input value to the selectedColor state
        onChange={handleColorChange} 
        onClick={handleColorInputOpen} 
        style={{ display: 'none' }}
      />
        {!showPlayAgain ? (
        <ChromePicker 
        color={selectedColor} onChange={handleColorChange} 
    />
        ) : (
<div style={{ padding: '24px 64px', borderRadius: '4px', 
    backgroundColor: 'white',
    boxShadow: ' 0 0 2px 0px rgba(0,0,0, .125), 0 0 4px 0px rgba(0,0,0, .125), 0 0 8px 0px rgba(0,0,0, .125) ' 
    }} className='db dn-ns'>
      <h2 style={{margin: '0 0 0px 0', fontSize: '12px', textAlign: 'center' }}>High Scores</h2>
      <h3 style={{margin: '0 0 8px 0', fontSize: '10px', textAlign: 'center', color: '#777788' }}>Today</h3>
      <ol style={{fontSize: '12px', padding: 0, margin: 0, lineHeight: 1., lineHeight: 1.55 }}>
        {dailyScores.slice(0,10).map((score, index) => (
          <li key={index}>
              <b style={{ display: 'inline-block', marginRight: '4px' }}>{score.user}</b> 
              <code>{score.score.toFixed(3)}</code>
          </li>
        ))}
      </ol>
    </div>
        )}
                </div>
            </div>
        </div>}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        {!showPlayAgain ? (
            <div style={{textAlign: 'center', paddingTop: '8px' }}>
            <button onClick={handleSubmit} className='animated-button'> 
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                Submit Match
            </button>
      </div>
        ) : (
            <div style={{textAlign: 'center', paddingTop: '8px' }}>
      <button onClick={startNewGame} className='animated-button animated-button-1' style={{whiteSpace: 'nowrap', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'}}>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                Play Again
      </button>
  </div>
        )}

      
      </div>
<footer style={{ gap: '32px', justifyContent: 'center' }} className='dn flex-ns'>
    <div style={{ padding: '24px 48px', borderRadius: '6px', 
    boxShadow: ' 0 0 2px 0px rgba(0,0,0, .125), 0 0 4px 0px rgba(0,0,0, .125), 0 0 8px 0px rgba(0,0,0, .125), ' 
    }}>
      <h2 style={{margin: '0 0 8px 0', fontSize: '14px', textAlign: 'center' }}>Today</h2>
      <ol style={{fontSize: '12px', padding: 0, margin: 0 }}>
        {dailyScores.slice(0,10).map((score, index) => (
          <li key={index}>
              <b style={{ display: 'inline-block', marginRight: '4px' }}>{score.user}</b> 
              <code>{score.score.toFixed(3)}</code>
          </li>
        ))}
      </ol>
    </div>
    
    <div style={{ padding: '24px 48px', borderRadius: '6px',
    boxShadow: ' 0 0 2px 0px rgba(0,0,0, .125), 0 0 4px 0px rgba(0,0,0, .125), 0 0 8px 0px rgba(0,0,0, .125), ' 
    }}>
      <h2 style={{margin: '0 0 8px 0', fontSize: '14px', textAlign: 'center' }}>All-Time</h2>
      <ol style={{fontSize: '12px',  padding: 0, margin: 0}}>
        {allTimeScores.slice(0,10).map((score, index) => (
          <li key={index} style={{ }}>
              <b style={{ display: 'inline-block', marginRight: '4px' }}>{score.user}</b> 
              <code>{score.score.toFixed(3)}</code>
        </li>
        ))}
      </ol>
    </div>
      </footer>
        <div style={{ position: 'absolute', bottom: '16px', fontSize: '12px', left: 0, right: 0, width: '100%'}}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
              <p style={{margin:0}}><b>Avg. Score</b>: {averages.avgScore}</p>
              <p style={{margin:0, display: 'none'}}><b>Time</b>: {averages.avgTime}</p>
              <p style={{margin:0}}><b>Avg. Accuracy</b>: {averages.avgAccuracy}</p>
              {highScore && <p style={{margin:0 }}><mark><b>High Score</b>: {parseFloat(highScore).toFixed(3)}</mark></p>}
              </div>
              <small style={{ marginTop: '8px', display: 'block', textAlign: 'center' }}>This game has been played {count} times</small>
        </div>
      </header>

         <div>
          <ToastContainer position="top-center" autoClose={5000} />
          {/* ... rest of your component */}
        </div>
    </div>
  );
}

export default App;
