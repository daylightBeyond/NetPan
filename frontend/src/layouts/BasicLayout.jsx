import React from 'react';
import { Outlet, Routes } from 'react-router-dom';
import Header from './Header.jsx';
import Menu from './Menu.jsx';
import Content from './Content.jsx';
import './style.less';

const BasicLayout = () => {
  return (
    <div className="framework">
      <Header />
      <Menu />
      <Outlet />
    </div>
  );
};

export default BasicLayout;
