import React, { useEffect, useRef, useState } from 'react';
import Aplayer from 'aplayer';
import './previewStyle.less';
import 'aplayer/dist/APlayer.min.css';
import cover from '@/assets/icon-image/music.png';

const PreviewMusic = ({ url, fileName }) => {
  const playerRef = useRef(null);

  useEffect(() => {
    const player = new Aplayer({
      container: playerRef.current,
      audio: [{
        url: `api/${url}`,
        name: fileName,
        cover: cover,
        artist: ''
      }]
    });

    return () => player.destroy();
  }, []);

  return (
    <div className="music">
      <div className="body-content">
        <div className="cover">
          <img src={cover} />
        </div>
        <div ref={playerRef} className="music-player"></div>
      </div>
    </div>
  );
};

PreviewMusic.defaultProps = {
  url: ''
};

export default PreviewMusic;
