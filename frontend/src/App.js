import React, { memo, Suspense } from 'react';
import { Outlet, Router, Routes, Route, useRoutes } from "react-router-dom";
import { ConfigProvider } from "antd";
import routes from "./router";

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
  // const element = useRoutes(routes.map(route => MetaRoute(route)))

  return (
    <ConfigProvider>
      <Suspense fallback={<div>loading...</div>}>
        {element}
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

      </Suspense>
    </ConfigProvider>
  );
}
export default memo(App);