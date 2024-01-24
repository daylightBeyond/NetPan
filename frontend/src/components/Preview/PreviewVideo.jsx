import React, { useState, useEffect, useRef } from 'react';
import DPlayer from 'dplayer';
import './previewStyle.less';
// 视频预览
const PreviewVideo = ({ url }) => {
  const player = useRef(null);

  useEffect(() => {
    const dp = new DPlayer({
      element: player.current,
      theme: '#b7daff',
      screenshot: true,
      video: {
        url: `/api${url}`,
        type: 'customHls',
        customType: {
          customHls: function (video, player) {
            const hls = new Hls();
            hls.loadSource(video.src);
            hls.attachMedia(video);
          }
        }
      }
    });

    return () => {
      dp.destroy();
    }
  }, []);

  return (
    <div id="player" ref={player}></div>
  );
};

PreviewVideo.defaultProps = {
  url: ''
};

export default PreviewVideo;
