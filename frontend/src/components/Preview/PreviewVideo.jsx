import React, { useState, useEffect, useRef } from 'react';
import DPlayer from 'dplayer';
import './previewStyle.less';
// 视频预览
const PreviewVideo = (props) => {
  const { url } = props;

  const [videoInfo, setVideoInfo] = useState({
    video: null
  });

  // const [player, serPlayer] = useState(null);
  const player = useRef(null);

  useEffect(() => {
    // initPlayer();
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

  const initPlayer = () => {
    const dp = new DPlayer({
      element: player,
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
    })
  };

  return (
    <div id="player" ref={player}>

    </div>
  );
};

PreviewVideo.defaultProps = {
  url: ''
};

export default PreviewVideo;
