import React from "react";
import Lottie from "lottie-react";

const LottieAnimation = ({ 
  animationData, 
  width = "100%", 
  height = "100%", 
  loop = true, 
  autoplay = true, 
  className = "" 
}) => {
  return (
    <div style={{ width, height }} className={className}>
      <Lottie 
        animationData={animationData} 
        loop={loop} 
        autoplay={autoplay} 
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default LottieAnimation;