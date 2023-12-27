import React from 'react';
import { Outlet } from "react-router-dom";

const Share = () => {
  return (
    <div>
      Share
      <Outlet />
    </div>
  );
};

export default Share;
