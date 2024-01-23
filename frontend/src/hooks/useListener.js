import { useEffect } from 'react';
import { useEventBus } from './useEventBus';
const useListener = (name, fn) => {
  console.log('name', name);
  console.log('fn', fn);
  const emitter = useEventBus();
  console.log('emitter', emitter);

  useEffect(() => {
    const eventHandler = (...args) => fn(...args);
    emitter.on(name, eventHandler);
    console.log('outer')
    return () => {
      console.log('inner')
      emitter.off(name, eventHandler);
    };
  }, [emitter, name, fn]);
};
// }

export default useListener;
