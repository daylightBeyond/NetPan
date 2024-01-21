import { useState, useEffect } from 'react';
const useWindowSize = (widthProp) => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  useEffect(() => {
    let timeoutId;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setWindowWidth(window.innerWidth);
      }, 50);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const contentWidth = Math.min(widthProp, windowWidth);
  const leftPosition = Math.max(0, (windowWidth - contentWidth) / 2);
  return { contentWidth, leftPosition };
};
export default useWindowSize;
