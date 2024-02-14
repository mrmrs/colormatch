import React, { useState, useEffect, useRef } from 'react';

const HSLColorPicker = ({ onColorSelected }) => {
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [lightness, setLightness] = useState(50);
  const colorBoxRef = useRef(null);
  const isDragging = useRef(false);

  useEffect(() => {
    const selectedColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    onColorSelected(selectedColor);
  }, [hue, saturation, lightness, onColorSelected]);

const updateColor = (x, y) => {
  const rect = colorBoxRef.current.getBoundingClientRect();
  
  // Calculate saturation and lightness based on the click position
  const newSaturation = Math.max(0, Math.min(100, ((x - rect.left) / rect.width) * 100));
  const newLightness = Math.max(0, Math.min(100, ((rect.bottom - y) / rect.height) * 100));

  setSaturation(newSaturation);
  setLightness(newLightness);
};

  const handleMouseDown = (event) => {
    isDragging.current = true;
    updateColor(event.clientX, event.clientY);
  };

  const handleMouseMove = (event) => {
    if (isDragging.current) {
      updateColor(event.clientX, event.clientY);
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleHueChange = (event) => {
    setHue(event.target.value);
  };

const hueSliderStyle = {
  width: '360px', // Updated width
  background: 'linear-gradient(to right, rgb(255,0,0), rgb(255,255,0), rgb(0,255,0), rgb(0,255,255), rgb(0,0,255), rgb(255,0,255), rgb(255,0,0))',
  height: '20px',
  borderRadius: '10px',
  outline: 'none',
  border: 'none',
  padding: '0',
  margin: '10px 0'
};

const colorBoxStyle = {
  height: '200px',
  width: '360px', // Updated width
  backgroundImage: `
    linear-gradient(to top, hsl(${hue}, 100%, 0%), hsl(${hue}, 100%, 100%)),
    linear-gradient(to left, hsl(${hue}, 0%, 50%), hsl(${hue}, 100%, 50%))
  `,
  cursor: 'crosshair'
};

  useEffect(() => {
    const handleMouseLeave = () => {
      isDragging.current = false;
    };

    const colorBox = colorBoxRef.current;
    colorBox.addEventListener('mousemove', handleMouseMove);
    colorBox.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      colorBox.removeEventListener('mousemove', handleMouseMove);
      colorBox.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div>
<div 
  ref={colorBoxRef}
  style={colorBoxStyle}
  onMouseDown={handleMouseDown}
  onMouseUp={handleMouseUp}
/>
<input 
  type="range" 
  min="0" 
  max="360" 
  value={hue} 
  onChange={handleHueChange} 
  style={hueSliderStyle}
/>
      <p>Selected Color: {`hsl(${hue}, ${saturation}%, ${lightness}%)`}</p>
    </div>
  );
};

export default HSLColorPicker;
