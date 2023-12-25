import React, { lazy, memo, Suspense } from 'react';
import { Outlet, Router, Routes, Route, useRoutes, Navigate } from "react-router-dom";
import { ConfigProvider } from "antd";
import routes from "./router";

const Login = lazy(() => import('@/pages/Login/Login.jsx'));
const FrameWork = lazy(() => import('@/pages/FrameWork/FrameWork.jsx'));
const Main = lazy(() => import('@/pages/Main/Main.jsx'));
const Share = lazy(() => import("@/pages/Share/Share.jsx"));
const Recycle = lazy(() => import("@/pages/Recycle/Recycle.jsx"));
function  MetaRoute({ path, element, meta }) {
  if (meta) {
    return (
      <Route path={path} element={<MetaRouteElement {...element} meta={meta} />} />
    )
  } else {
    return (
      <Route path={path} element={<MetaRouteElement {...element} />} />
    )
  }
};

function MetaRouteElement({ meta, ...props }) {
  return(
    <Route {...props}>
      {(routeProps) => (
        <Outlet context={{ ...routeProps, meta }} />
      )}
    </Route>
  )
};

function App() {
  const element = useRoutes(routes);

  return (
    <ConfigProvider>
      <Suspense fallback={<div>loading...</div>}>
        {/*{element}*/}
        {/*<Routes>*/}
        {/*  {routes.map((route) => (*/}
        {/*    <Route*/}
        {/*      key={route.path}*/}
        {/*      path={route.path}*/}
        {/*      element={route.element}*/}
        {/*      meta={route?.meta}*/}
        {/*      children={route?.children}*/}
        {/*    />*/}
        {/*  ))}*/}
        {/*</Routes>*/}

        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/main" element={<FrameWork />}>
            <Route path=":category" element={<Main />}/>
          </Route>
        </Routes>

      </Suspense>
    </ConfigProvider>
  );
}
export default memo(App);