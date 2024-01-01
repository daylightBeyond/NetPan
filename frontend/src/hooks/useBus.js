import React, { useState, useEffect, createContext } from "react";
import mitt from "mitt";
export const BusContext = createContext(null);

export default function useBus() {
  return React.useContext(BusContext);
};

export function useListener(name, fn) {
  const bus = useBus();
  useEffect(() => {
    console.log('outer')
    bus.on(name, fn);
    return () => {
      console.log('inner')
      bus.off(name, fn);
    }
  }, [bus, name, fn]);
};

export function Provider({ children }) {
  // const bus = mitt();
  const [bus] = useState(() => mitt());
  return <BusContext.Provider value={bus}>{children}</BusContext.Provider>
};
