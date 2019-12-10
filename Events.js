/**
 *  React fiber 结构中的更新也会更新 fiber 之间的层级关系
 *  
 *  -
 *  在 React 中不需要给每个 HostComponent 的事件使用`addEventListener` 来设置handler
 *  只需要通过添加 `onClick` `onChange` 这样的props 到 HostComponent的 jsx 上, React 就会为该 HostComponent 监听相应的
 *  'click', 'change' 事件. 而实际上, 这个事件并没有 
 *          `拿到该 Host -> addEventListner -> when unmount removeEventLister` 
 *  这样的一个流程, 因为 React 中所有的事件都会被挂载到 document 这个全局对象上统一处理, 这样可以得到
 *  较好的性能和兼容性
 *      - 组件化之后, 使得HostComponent 之间的联系就没有那么直观
 *  但另一方面事件本身的传递(冒泡, Capture) 方式就需要进行手动模拟(Synthetic)
 *  
 */

 const eventTypes = {}

 /**
  * 事件可以分为两类
  * 
  */

  const interactiveEventTypeNames = [
      'click', 'click'
  ]

  const nonInteractiveEventTypeNames = [
      'drag', 'drag'
  ]

  function addEventTypeNameToConfig([topEvent, event], isInteractive) {
      const capitalizedEvent = event[0].toUpperCase() + event.slice(1);
      const onEvent = 'on' + capitalizedEvent;
      const type = {
          phrasedRegistrationNames: {
              bubbled: onEvent,
              captured: onEvent + 'Capture'
          },
          dependencies: [topEvent],
          isInteractive
      }

      eventTypes[event]  = type;

  }

  interactiveEventTypeNames.forEach(eventTuple => {
      addEventTypeNameToConfig(eventTuple, true)
  });

  export { eventTypes }
