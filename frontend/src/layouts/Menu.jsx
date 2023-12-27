import React, { useEffect, useState } from 'react';
import { Router, Link, NavLink, Outlet } from 'react-router-dom';
import { menus, subMenus } from '../constants/router-constants.js';
import useRouteStore from "../store/routeStore.js";
import useMergeState from "@/hooks/useMergeState";
import Content from "./Content.jsx";
// import './style.less';

const Menu = () => {
  const setMenuItem = useRouteStore(state => state.setMenuItem);
  const menuItem = useRouteStore(state => state.menuItem);
  // const [menuItem, setMenuItem] = useState('main');
  return (
    <div className="body">
      <div className="left-sider">
        <div className="menu-list">
          {/* 一级路由 */}
          {menus.map(item =>
            <Link
              key={item.menuCode}
              to={item.path}
              className={`menu-item ${item.menuCode === menuItem ? 'active' : ''}`}
              onClick={() => setMenuItem(item.menuCode)}
            >
              <div className={`iconfont ${'icon-' + item.icon}`}></div>
              <div className="text">{item.name}</div>
            </Link>
          )}
        </div>
        <div className="menu-sub-list">
          {/* 二级子路由 */}
          {subMenus[menuItem].map(sub =>
            <NavLink
              key={sub.path}
              to={sub.path}
              className={`menu-item-sub ${menuItem === sub.path ? 'active' : ''}`}
            >
              {sub.icon && (
                <span className={`iconfont ${'icon-' + sub.icon}`}></span>
              )}
              <div className="text">{sub.name}</div>
            </NavLink>
          )}
        </div>
      </div>
      <div className="body-content">
        {/* <Outlet></Outlet> */}
      </div>
    </div>
  );
};

export default Menu;
