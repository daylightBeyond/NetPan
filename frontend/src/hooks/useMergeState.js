import React, { useState, useCallback } from 'react';

/**
 * 合并useState声明多个变量的hook, 支持第二个参数回调
 * 使用方法:
 * ① useMergeState({ count: 1 })
 * ② useMergeState({ count: 1 }, () => console.log(111))
 * @param initialState 声明的初始值
 * @returns {[unknown,((function(*, *): void)|*)]}
 */
const useMergeState = (initialState) => {
  const [state, setState] = useState(initialState);

  // update就是需要更新的字段
  const setMergeState = useCallback((update, callback) => {
    setState(prevState => {
      const mergedState = typeof update === 'function' ? update(prevState) : update;
      return { ...prevState, ...mergedState };
    });

    if (callback) {
      callback();
    }
  }, [setState]);

  return [state, setMergeState];
};

export default  useMergeState;
