import React, { useState, createContext, useContext } from 'react';
import mitt from 'mitt';
import PubSub from 'pubsub-js';
export const EventBusContext = createContext(null);

export const EventBusProvider = ({ children }) => {
  const [emitter] = useState(() => mitt());
  // const emitter = mitt();
  return <EventBusContext.Provider value={emitter}>{children}</EventBusContext.Provider>
};

export const useEventBus = () => {
  const context = useContext(EventBusContext);
  if (!context) {
    throw new Error('useEventBus必须在EventBusProvider中使用');
  }
  return context;
};
