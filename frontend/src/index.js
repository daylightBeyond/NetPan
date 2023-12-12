import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import 'antd/dist/reset.css';
import './index.css';
// 引入图标
import "@/assets/icon/iconfont.css";
// 引入基础样式
import "@/assets/base.less";
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <HashRouter>
    <App />
  </HashRouter>
);

reportWebVitals();
