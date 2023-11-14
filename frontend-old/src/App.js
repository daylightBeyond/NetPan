import React, { memo, Suspense } from 'react';
import { useRoutes } from "react-router-dom";
import { ConfigProvider } from "antd";
import 'antd/dist/reset.css';
import routes from "./router";
function App(props) {
  const element = useRoutes(routes);
  return (

    <ConfigProvider>
      <Suspense>
        {element}
      </Suspense>
    </ConfigProvider>
  );
}

export default memo(App);