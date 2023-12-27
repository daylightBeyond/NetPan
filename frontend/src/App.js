import React, { memo, Suspense } from 'react';
import { useRoutes } from "react-router-dom";
import { ConfigProvider } from "antd";
import routes from "./router";

function App() {
  const element = useRoutes(routes);

  return (
    <ConfigProvider>
      <Suspense fallback={<div>loading...</div>}>
        {element}
      </Suspense>
    </ConfigProvider>
  );
}
export default memo(App);
