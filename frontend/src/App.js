import React, { memo, useEffect, Suspense } from 'react';
import { useRoutes } from "react-router-dom";
import { ConfigProvider } from "antd";
import routes from "./router";
import { useEventBus } from './hooks/useEventBus';
import { Provider as BusProvider } from './hooks/useBus';
import { EventBusProvider } from './hooks/useEventBus';
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
