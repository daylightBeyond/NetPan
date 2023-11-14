import React, { memo, Suspense } from 'react';
import { useRoutes } from "react-router-dom";
import { ConfigProvider } from "antd";
import 'antd/dist/reset.css';
import routes from "./router/index.js";
function App(props) {
  const element = useRoutes(routes);

  return (
    <ConfigProvider>
      <Suspense fallback="loading...">
        <div className="main">
          {/* 注册路由 */}
          {element}
        </div>
      </Suspense>
    </ConfigProvider>
  );
}

export default App;