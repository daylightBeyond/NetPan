import React, { lazy } from "react";
import { Navigate, useRoutes } from "react-router-dom";

const Login = lazy(() => import('@/pages/Login/Login.jsx'));
const FrameWork = lazy(() => import('@/pages/FrameWork/FrameWork.jsx'));
const Home = lazy(() => import('@/pages/Home/Home.jsx'));
const Share = lazy(() => import("@/pages/Share/Share.jsx"));
const Recycle = lazy(() => import("@/pages/Recycle/Recycle.jsx"));
const SysSetting = lazy(() => import("@/pages/Settings/SysSetting.jsx"));
const UserList = lazy(() => import("@/pages/Settings/UserList.jsx"));
const FileList = lazy(() => import("@/pages/Settings/FileList.jsx"));

const routes = [
  {
    path: '/',
    element: <Navigate to='login' replace />,
  },
  {
    path: 'login',
    element: <Login />,
  },
  {
    path: 'main',
    name: "framework",
    element: <FrameWork />,
    children: [
      {
        path: '',
        element: <Navigate to='all' replace />
      },
      {
        path: ':category',
        name: "首页",
        meta: {
          needLogin: true,
          menuCode: "main",
        },
        element: <Home />,
      },
    ]
  },
  {
    path: "myshare",
    name: "我的分享",
    element: <FrameWork />,
    children: [
      {
        path: '',
        name: '我的分享',
        meta: {
          needLogin: true,
          menuCode: "share",
        },
        element: <Share />
      }
    ]
  },
  {
    path: "recycle",
    name: "回收站",
    element: <FrameWork />,
    children: [
      {
        path: '',
        name: '要删除的文件',
        meta: {
          needLogin: true,
          menuCode: "recycle",
        },
        element: <Recycle />
      },
    ]
  },
  {
    path: "settings",
    name: "设置",
    element: <FrameWork />,
    children: [
      {
        path: 'sysSetting',
        name: '系统设置',
        meta: {
          needLogin: true,
          menuCode: "settings",
        },
        element: <SysSetting />
      },
      {
        path: 'userList',
        name: '用户管理',
        meta: {
          needLogin: true,
          menuCode: "share",
        },
        element: <UserList />
      },
      {
        path: 'fileList',
        name: '用户文件',
        meta: {
          needLogin: true,
          menuCode: "share",
        },
        element: <FileList />
      },
    ]
  },
];
export default routes;
