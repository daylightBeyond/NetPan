import React, { createContext, useContext, useState } from "react";
import PubSub from "pubsub-js";
import mitt from "mitt";

export const PubSubContext = createContext(null);

export const PubSubProvider = ({ children }) => {
    // const pubSub = mitt();
  return <PubSubContext.Provider value={PubSub}>{children}</PubSubContext.Provider>
};

export const usePubSub = () => {
  const context = useContext(PubSubContext);
  console.log('context', context);
  if (!context) {
    throw new Error('useEventBus必须在EventBusProvider中使用');
  }
  return context;
};

