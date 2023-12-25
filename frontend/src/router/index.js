import React, { lazy } from "react";
import { Navigate, useRoutes } from "react-router-dom";

const Login = lazy(() => import('@/pages/Login/Login.jsx'));
const FrameWork = lazy(() => import('@/pages/FrameWork/FrameWork.jsx'));
const Main = lazy(() => import('@/pages/Main/Main.jsx'));
const Share = lazy(() => import("@/pages/Share/Share.jsx"));
const Recycle = lazy(() => import("@/pages/Recycle/Recycle.jsx"));

const routes = [
  {
    path: '/',
    element: <Navigate replace to='/login' />,
  },
  {
    path: '/Login',
    element: <Login />,
  },
  {
    path: '/main',
    name: "framework",
    element: <FrameWork />,
    children: [
      {
        path: ':category',
        name: "首页",
        meta: {
          needLogin: true,
          menuCode: "main",
        },
        element: <Main />,
      },
    ]
  },
  {
    path: "/myshare",
    name: "我的分享",
    meta: {
      needLogin: true,
      menuCode: "share",
    },
    element: <Share />,
  },
  {
    path: "/recycle",
    name: "回收站",
    meta: {
      needLogin: true,
      menuCode: "recycle",
    },
    element: <Recycle />,
  },
];
export default routes;