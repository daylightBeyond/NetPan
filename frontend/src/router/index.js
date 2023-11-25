import React, { lazy } from "react";
import { Navigate, useRoutes } from "react-router-dom";

const Login = lazy(() => import('@/pages/login/Login.jsx'));

const routes = [
  {
    path: '/',
    element: <Navigate to='login' />,
  },
  {
    path: '/login',
    element: <Login />,
  }
];
export default routes;