import React, { useState, useEffect } from 'react';
import chroma from 'chroma-js';
import { RefreshCcw } from 'feather-icons-react';
import { v4 as uuidv4 } from 'uuid'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ChromePicker } from 'react-color';
import './App.css'

const Badge = ({ color = 'black', backgroundColor, ...props }) => {
    return (
        <span style={{ fontSize: '10px', whiteSpace: 'nowrap', fontWeight: 700, padding: '4px 16px', borderRadius: '9999px', backgroundColor: backgroundColor, color: color }}>
            {props.children}
        </span>
    )
}


const chromePickerStyles = {
  default: {
    hue: { // See the individual picker source for which keys to use
      height: '16px',
    },
  },
}


const ScoreModal = ({ isOpen, onClose, scores, title, currentUser }) => {
  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: '0', left: '0%', right: 0, bottom: 0, overflow: 'scroll', backgroundColor: 'white', padding: '0 16px 32px 16px', zIndex: 9999 }}>
      <button onClick={onClose} style={{ fontSize: '10px', position: 'absolute', top: '16px', right: '16px', border: 0, background: 'transparent',textAlign: 'right' }}>Close</button>
      <h2 style={{ textAlign: 'center', marginTop: '1em', marginBottom: '2em', fontSize: '16px', fontFamily: 'monospace',  }}>{title}</h2>
      <ol style={{ maxWidth: "32ch", margin: '0 auto', padding: '0 16px' }}>
        {scores.map((score, index) => (
            <li style={{backgroundColor: score.user === currentUser ? '#ffff99': '#fff', fontSize: '10px', lineHeight: 1.5 }}
              id={score.user === currentUser ? `currentUserScore_${title.replace(/\s/g, '')}` : null}
            key={uuidv4()}><span style={{ display: 'flex', justifyContent: 'space-between'}}><b>{score.user}</b> <code>{score.score.toFixed(3)}</code></span></li>
        ))}
      </ol>
    </div>
  );
};

function App() {
    //  const [color, setColor] = useState('#ff0000');
  const [randomColor, setRandomColor] = useState(null);
  const [selectedColor, setSelectedColor] = useState('#ffffff');
  const [startTime, setStartTime] = useState(0);
  const [score, setScore] = useState(null);
  const [timeTaken, setTimeTaken] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timerId, setTimerId] = useState(null);
  const [dailyScores, setDailyScores] = useState([]);
  const [allTimeScores, setAllTimeScores] = useState([]);
  const [showDailyTop100Modal, setShowDailyTop100Modal] = useState(false);
  const [showAllTimeTop100Modal, setShowAllTimeTop100Modal] = useState(false);

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
    setTimeTaken(0);
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
        const enteredUsername = prompt('Please enter your username:', 'Anonymous');
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
        setTimeTaken(timeInSeconds.toFixed(2));

        const calculatedAccuracy = 100 - chroma.deltaE(randomColor, selectedColor);
        let combinedScore = 0; // Declare and initialize combinedScore here

        if (currentTime - startTime < 500) {
            // Penalize the score: Reduce the score by 50% as a penalty
            combinedScore *= 0.5;
            console.log("Computer aided humans get penalized")
        }

        if (calculatedAccuracy > 0) {
          setAccuracy(calculatedAccuracy); // Set as a number
          combinedScore = (calculatedAccuracy + (100 - timeInSeconds)) / 2;
        } else {
          setAccuracy(0); // Set as 0 if accuracy is negative
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
     user: username,
    score: combinedScore,
    accuracy: calculatedAccuracy,
    timeTaken: timeInSeconds.toFixed(3), 
    selectedColor: selectedColor,
    randomColor: randomColor
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
  const handleEsc = (event) => {
    if (event.keyCode === 27) {
      setShowDailyTop100Modal(false);
      setShowAllTimeTop100Modal(false);
    }
  };
  window.addEventListener('keydown', handleEsc);

  return () => {
    window.removeEventListener('keydown', handleEsc);
  };
}, []);

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
      <div style={{ height: '100dvh', width: '100%', position: 'relative',
      backgroundColor: selectedColor,
      //backgroundSize: '8px 8px',  backgroundImage: 'linear-gradient(to right, #f6f6f6  1px, transparent 1px), linear-gradient(to bottom, #f6f6f6 1px, transparent 1px)',
      }}>
      <header style={{position: 'relative', height: '100%', }}>
          {randomColor && <div style={{ 
          backgroundColor: randomColor, 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',  alignItems: 'center', }}>
          <div 
            style={{ 
              minWidth: '320px',
              minHeight: '40dvh',
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
                  <dd> {((new Date().getTime() - startTime) / 1000).toFixed(2)} <small>seconds</small></dd>
              </dl>




      </div>
        ) : (
      <div>
        {score && <div>

            <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
                <code style={{padding: '4px', fontSize: '10px', backgroundColor: chroma.contrast(randomColor, 'white') > 4.5? 'white' : 'black', color: randomColor }}>{randomColor}</code> 
                <code style={{fontSize: '10px', textTransform: 'lowercase'}}> {selectedColor}</code>
            </div>

            <dl style={{marginBottom: '8px', marginTop: '8px' }}>
                <dt style={{ fontSize: '10px' }}>Score</dt>
                <dd style={{fontSize: '48px', fontWeight: 'bold' }}>{score}</dd>
            </dl>
            <div style={{ display: 'flex', gap: '32px' }}>
          <dl style={{ margin: 0}}>
              <dt style={{ marginBottom: '4px', fontSize: '10px' }}>Time</dt>
              <dd>
                  <b>{timeTaken}</b> <small>seconds</small>
              </dd>
          </dl>
            <dl style={{ margin: 0}}>
              <dt style={{ marginBottom: '4px', fontSize: '10px', }}>Accuracy</dt>
              <dd style={{fontWeight: 'bold'}}>{accuracy.toFixed(4)}%</dd>
            </dl>
        </div>
        </div>
        }

            <div style={{ display: 'flex', gap: '8px', paddingBottom: '16px', paddingTop: '16px' }}>
            {
                dailyScores && dailyScores.length > 0 && score > dailyScores[dailyScores.length - 1].score && (
                    <Badge backgroundColor='yellow'>
                        🎪 Daily Top 100
                    </Badge>
                )
            }
            {
                allTimeScores && allTimeScores.length > 0 && score > allTimeScores[allTimeScores.length - 1].score && (
                    <Badge backgroundColor='yellow'>
                        💎 All-time 100 !!!
                    </Badge>
                )
            }
            {accuracy >= 95 &&  
                <Badge backgroundColor='black' color='white'>
                    🔭 Super vision lvl 3
                </Badge>
            }
                {timeTaken <= 1 &&  
                    <Badge backgroundColor='navy' color='yellow'>
                       ⚡ Lightning fast 
                    </Badge>
                }
            </div>
      </div>
        )}
          </div>
            <div 
              style={{ 
                minWidth: '320px',
                minHeight: '40dvh',
                backgroundColor: selectedColor,
                paddingLeft: '16px',
                paddingRight: '16px',
                paddingTop: '16px',
                paddingBottom: '16px',
                height: '100%',
              }} 
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', maxWidth: '100%', width: '100%', backgroundColor: selectedColor }}>
              <input 
                type="color" 
                value={selectedColor} // Bind the input value to the selectedColor state
                onChange={handleColorChange} 
                onClick={handleColorInputOpen} 
                style={{ display: 'none' }}
              />
        {!showPlayAgain ? (
            <div style={{ maxWidth: '300px', width: '100%'}}>
                <ChromePicker 
                styles={chromePickerStyles}
                width='100%'
                disableAlpha={true}
                color={selectedColor} onChange={handleColorChange} 
                />
            </div>
        ) : (
<div style={{ 
      color: chroma.contrast(selectedColor, '#ffffff') > 4? 'white' : 'black', 
    }} className='db dn-ns'>
      <h2 style={{margin: '0 0 0px 0', fontSize: '12px', textAlign: 'center' }}>High Scores</h2>
      <h3 style={{margin: '0 0 8px 0', fontSize: '10px', textAlign: 'center', color: 'inherit', opacity: .5 }}>Today</h3>
      <ol style={{fontSize: '12px', padding: 0, margin: 0, lineHeight: 1., lineHeight: 1.55 }}>
        {dailyScores.slice(0,10).map((score, index) => (
          <li key={index} style={{ fontSize: '10px', minWidth: '192px', padding: '2px 0', borderBottom: '1px solid', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '32px' }}>
              <b style={{ display: 'inline-block', marginRight: '4px' }}>{score.user}</b> 
              <code>{score.score.toFixed(3)}</code>
          </li>
        ))}
      </ol>
      <button style={{ appearance: 'none', WebKitAppearance: 'none', padding: 0, border: 0, background: 'transparent', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold', textAlign: 'left', color: 'inherit' }} onClick={() => setShowDailyTop100Modal(true)}>Top 100 (Daily)</button>
      <button style={{ appearance: 'none', WebKitAppearance: 'none', padding: 0, border: 0, background: 'transparent', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold', textAlign: 'left', color: 'inherit' }} onClick={() => setShowAllTimeTop100Modal(true)}>Top 100 (All-time)</button>
    </div>
        )}
                </div>
            </div>
        </div>}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', }}>
        {!showPlayAgain ? (
            <div style={{textAlign: 'center', zIndex: 999 }}>
            <button onClick={handleSubmit} className='animated-button' style={{zIndex: '999999' }}> 
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                Submit Match
            </button>
      </div>
        ) : (
            <div style={{textAlign: 'center' }}>
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
      <footer style={{ gap: '32px', justifyContent: 'space-between', padding: '16px 16px 0px 16px', margin: '0 auto', maxWidth: '800px' }}
      className='dn flex-ns'>
      <div style={{ 
          color: chroma.contrast(selectedColor, '#ffffff') > 4.5? 'white' : 'black', 
        }}>
      <h2 style={{margin: '0 0 8px 0', fontSize: '14px', textAlign: 'center' }}>Today</h2>
      <ol style={{fontSize: '12px', padding: 0, margin: 0, textAlign: 'left', }}>
        {dailyScores.slice(0,10).map((score, index) => (
          <li key={index} style={{ color: 'inherit', fontSize: '10px', minWidth: '192px', padding: '2px 0', borderBottom: '1px solid', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '32px' }}>
              <b style={{ display: 'inline-block', marginRight: '4px' }}>{score.user}</b> 
              <code>{score.score.toFixed(3)}</code>
          </li>
        ))}
      </ol>
      <button style={{ appearance: 'none', WebKitAppearance: 'none', padding: 0, border: 0, background: 'transparent', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold', textAlign: 'left', color: 'inherit' }} onClick={() => setShowDailyTop100Modal(true)}>Show Top 100</button>
    </div>
    
    <div style={{ color: chroma.contrast(selectedColor, '#ffffff') > 4.5? 'white' : 'black', backgroundColor: selectedColor, zIndex: '99' }}>
      <h2 style={{ margin: '0 0 8px 0', fontSize: '14px', textAlign: 'center' }}>All-Time</h2>
      <ol style={{ fontSize: '12px',  padding: 0, margin: 0 }}>
        {allTimeScores.slice(0,10).map((score, index) => (
          <li key={index} style={{ fontSize: '10px', minWidth: '192px', padding: '2px 0', borderBottom: '1px solid', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '32px' }}>
              <b style={{ display: 'inline-block', marginRight: '4px' }}>{score.user}</b> 
              <code>{score.score.toFixed(3)}</code>
        </li>
        ))}
      </ol>
      <button style={{ appearance: 'none', WebKitAppearance: 'none', padding: 0, border: 0, background: 'transparent', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold', textAlign: 'left', color: 'inherit' }} onClick={() => setShowAllTimeTop100Modal(true)}>Show Top 100</button>
      </div><div className='dn db-ns' style={{ color: chroma.contrast(selectedColor, '#ffffff') > 4.5? 'white' : 'black' }}>
    <h4 style={{fontSize: '14px', margin: '0 0 8px 0', minWidth: '192px' }}>Stats</h4>
            <div style={{ fontSize: '10px', lineHeight: 1.75 }}>
                <p style={{ borderBottom: '1px solid', margin:0, display: 'flex', justifyContent: 'space-between' }}><b>Avg. Score:</b> <code>{averages.avgScore}</code></p>
                <p style={{ borderBottom: '1px solid', margin:0, gap: '16px', display: 'flex', justifyContent: 'space-between' }}><b>Avg. Accuracy:</b> <code>{averages.avgAccuracy}</code></p>
                {highScore && <p style={{borderBottom: '1px solid', margin:0, display: 'flex', justifyContent: 'space-between'  }}><b>High Score:</b> <code><mark>{parseFloat(highScore).toFixed(3)}</mark></code></p>}
              </div>
          </div>
      </footer>
        <div style={{ zIndex: '-100', position: 'absolute', zIndex: 0, bottom: '16px', fontSize: '12px', left: 0, right: 0, width: '100%'}}>
          <small style={{ marginTop: '8px', display: 'block', textAlign: 'center', 
              color: chroma.contrast(selectedColor, '#ffffff') > 4? 'white' : 'black', 
          }}>{count} plays</small>
        </div>
      </header>

         <div>
          <ToastContainer position="top-center" autoClose={5000} />
          {/* ... rest of your component */}
        </div>
<ScoreModal 
  isOpen={showDailyTop100Modal} 
  onClose={() => setShowDailyTop100Modal(false)} 
  scores={dailyScores} 
  title="Top 100 Daily Scores"
  currentUser={username}
/>
<ScoreModal 
  isOpen={showAllTimeTop100Modal} 
  onClose={() => setShowAllTimeTop100Modal(false)} 
  scores={allTimeScores} 
  title="Top 100 All-Time Scores"
  currentUser={username}
/>
    </div>
  );
}

export default App;
