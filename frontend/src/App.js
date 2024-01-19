import React, { memo, Suspense } from 'react';
import { useRoutes } from "react-router-dom";
import { ConfigProvider } from "antd";
import zhCN from 'antd/lib/locale/zh_CN';
import routes from "./router";

function App() {
  const element = useRoutes(routes);

  return (
    <ConfigProvider locale={zhCN}>
      <Suspense fallback={<div>loading...</div>}>
        {element}
      </Suspense>
    </ConfigProvider>
  );
}
export default memo(App);
