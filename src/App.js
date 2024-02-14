import React, { useState, useEffect } from 'react';
import chroma from 'chroma-js';
import { ChromePicker } from 'react-color';
import './App.css'

function App() {
    //  const [color, setColor] = useState('#ff0000');
  const [randomColor, setRandomColor] = useState(null);
  const [selectedColor, setSelectedColor] = useState('#F3F0FF00');
  const [startTime, setStartTime] = useState(0);
  const [score, setScore] = useState(null);
  const [timeTaken, setTimeTaken] = useState('');
  const [accuracy, setAccuracy] = useState('');
const [elapsedTime, setElapsedTime] = useState(0);
  const [timerId, setTimerId] = useState(null);
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

  useEffect(() => {
    localStorage.setItem('gameHistory', JSON.stringify(gameHistory));
    fetchCount();
  }, [gameHistory]);

  // Start a new game
  const startNewGame = () => {
    const newRandomColor = chroma.random().hex();
    setRandomColor(newRandomColor);
    setSelectedColor('#F3F3F900');
    setStartTime(new Date().getTime());
    setScore(null);
    setTimeTaken('');
    setAccuracy('');
    setShowPlayAgain(false);
    setElapsedTime(0);
    if (timerId) {
      clearInterval(timerId);
      setTimerId(null);
    }
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

  const currentTime = new Date().getTime();
  const timeInSeconds = (currentTime - startTime) / 1000;
  setTimeTaken(`${timeInSeconds.toFixed(2)} seconds`);

  const calculatedAccuracy = 100 - chroma.distance(randomColor, selectedColor, 'rgb');
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
      const timeInSeconds = parseFloat(game.timeTaken.split(' ')[0]); // Parse time as float
      if (!isNaN(timeInSeconds)) {
        acc.totalTime += timeInSeconds;
      }
      return acc;
    },
    { totalScore: 0, totalAccuracy: 0, totalTime: 0 }
  );

  const numGames = gameHistory.length;
  return {
    avgScore: (total.totalScore / numGames).toFixed(2),
    avgAccuracy: (total.totalAccuracy / numGames).toFixed(2) + '%',
    avgTime: total.totalTime > 0 ? (total.totalTime / numGames).toFixed(2) + ' seconds' : 'N/A'
  };
};

  const averages = calculateAverages();

  useEffect(() => {
    startNewGame(); // Start a game when the component mounts
  }, []);

  return (
    <div style={{ height: '100dvh', width: '100%'}}>
      <header style={{position: 'relative', height: '100%' }}>
        {randomColor && <div style={{ backgroundColor: randomColor, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',  alignItems: 'center', }}>
          <div 
            style={{ 
              minWidth: '320px',
              minHeight: '30dvh',
              backgroundColor: randomColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
            }} 
      >
        {!showPlayAgain ? (
          <div>
          <div style={{ background: 'black', color: 'white', display: 'inline-block', padding: '4px', fontSize: '10px', fontFamily: 'monospace' }}>{(elapsedTime / 1000).toFixed(2)} seconds</div>




      </div>
        ) : (
      <div>
          <div style={{ background: 'black', color: 'white', display: 'inline-block', padding: '4px', fontSize: '10px', fontFamily: 'monospace' }}>{timeTaken}</div>

        {score && <div>
          <p>Your Score: {score}</p>
          <p>Accuracy: {accuracy}</p>
        </div>}
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
        <div></div>
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
      <button onClick={startNewGame} className='animated-button animated-button-1'>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
          Play Again
      </button>
  </div>
        )}
      </div>
        <div style={{ position: 'absolute', bottom: '16px', fontSize: '12px', left: 0, right: 0, width: '100%'}}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
              <h2 style={{margin:0, fontSize: '12px'}}>Averages</h2>
              <p style={{margin:0}}><b>Score</b>: {averages.avgScore}</p>
              <p style={{margin:0}}><b>Time</b>: {averages.avgTime}</p>
              <p style={{margin:0}}><b>Accuracy</b>: {averages.avgAccuracy}</p>
              </div>
              <small style={{ marginTop: '8px', display: 'block', textAlign: 'center' }}>This game has been played {count} times</small>
        </div>
      </header>
    </div>
  );
}

export default App;
