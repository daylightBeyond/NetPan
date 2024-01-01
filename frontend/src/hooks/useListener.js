import { useEffect } from 'react';
import { useEventBus } from './useEventBus';
import { usePubSub } from './usePubSub';
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

// const useListener = (name, fn) => {
//   // const pubSub = usePubSub();
//   // console.log('pubSub', pubSub)
//   const { subscribe, unsubscribe } = usePubSub();
//   useEffect(() => {
//     console.log('inner')
//     const token = subscribe(name, fn);
//     // pubSub.subscribe(name, fn);
//     console.log('11111')
//     return () => {
//       console.log('22222')
//       unsubscribe(token);
//     };
//   }, [subscribe, unsubscribe, name, fn]);
// }

export default useListener;
