import React, { useState, useEffect } from 'react';
import './style.less';

const Window = (props) => {
  const {
    show, // 是否展示该全局弹窗
    width,
    title,
    closeWindow,
    children
  } = props;

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    function handleResize() {
      setWindowWidth(window.innerWidth);
    }

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const windowContentWidth = width > windowWidth ? windowWidth : width;
  const left = windowWidth - width;
  const widowContentLeft = left < 0 ? 0 : left / 2;

  const close = () => {
    closeWindow && closeWindow();
  };

  return (
    <div className="window-wapper">
      {show && (
        <div className="window">
          <div className="window-mask"></div>
          <div className="close" onClick={close}>
            <span className="iconfont icon-close2"></span>
          </div>

          <div
            className="window-content"
            style={{
              top: '0px',
              left: `${widowContentLeft}px`,
              width: `${windowContentWidth}px`,
            }}
          >
            <div className="title">{title}</div>
            <div
              className="content-body"
              style={{
                alignItems: 'align'
              }}
            >
              {children}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

Window.defaultProps = {
  show: false,
  width: 1000,
  title: '',
  align: 'top',
};

export default Window;
