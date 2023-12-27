import React from 'react';
import { NavLink } from "react-router-dom";
import useRouteStore from "../store/routeStore.js";
import { subMenus } from '../constants/router-constants.js';

const SubMenu = () => {
  const menuItem = useRouteStore(state => state.menuItem);

  return (
    <div>
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
  );
};

export default SubMenu;
