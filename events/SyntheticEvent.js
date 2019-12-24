const EVENT_POOL_SIZE = 10;
const BaseInterface = {};

const functionThatReturnsFalse = () => false;
const functionThatReturnsTrue = () => true;

class SyntheticEvent {
  constructor(dispatchConfig, targetInst, nativeEvent, nativeEventTarget) {
    this.init(dispatchConfig, targetInst, nativeEvent, nativeEventTarget);
  }

  init(dispatchConfig, targetInst, nativeEvent, nativeEventTarget) {
    this.dispatchConfig = dispatchConfig;
    this._targetInst = targetInst;
    this.nativeEvent = nativeEvent;

    const Interface = this.constructor.Interface;

    /**
     *
     *  将 Interface 中的声明的( 只有两种值: null 或者 function )字段从
     *  nativeEvent 中取出放到 this 上
     *  如果 Interface 的某个字段值为 function 则将 nativeEvent 作为参数调用该 function
     *  将结果设置为 this 的该字段的值
     */
    for (const propName in Interface) {
      if (!Interface.hasOwnProperty(propName)) {
        continue;
      }
      const normalize = Interface[propName];

      if (normalize) {
        this[propName] = normalize(nativeEvent);
      } else {
        if (propName === "target") {
          this.target = nativeEventTarget;
        } else {
          this[propName] = nativeEvent[propName];
        }
      }
    }
  }

  isDefaultPrevented = functionThatReturnsFalse;

  isPropagationStopped = functionThatReturnsFalse;

  isPersistent = functionThatReturnsFalse;

  preventDefault() {
    this.defaultPrevented = true;
    const event = this.nativeEvent;
    if (!event) {
      return;
    }
    if (event.preventDefault) {
      event.preventDefault();
    }
    this.isDefaultPrevented = functionThatReturnsTrue;
  }

  stopPropagation() {
    const event = this.nativeEvent;
    if (!event) {
      return;
    }
    if (event.stopPropagation) {
      event.stopPropagation();
    }
    this.isPropagationStopped = functionThatReturnsTrue;
  }

  persist() {
    this.isPersistent = functionThatReturnsTrue;
  }

  destructor() {
    const Interface = this.constructor.Interface;
    for (const propName in Interface) {
      this[propName] = null;
    }

    this.dispatchConfig = null;
    this._targetInst = null;
    this.nativeEvent = null;
    this.isDefaultPrevented = functionThatReturnsFalse;
    this.isPropagationStopped = functionThatReturnsFalse;
    this._dispatchListeners = null;
    this._dispatchInstances = null;
  }

  static Interface = BaseInterface;
  static expand(Interface) {
    class ExpandedSyntheticEvent extends SyntheticEvent {}

    ExpandedSyntheticEvent.Interface = Object.assign(
      {},
      ExpandedSyntheticEvent.Interface,
      Interface
    );
    addEventPoolingTo(ExpandedSyntheticEvent);
    return ExpandedSyntheticEvent;
  }
}

function getPooledEvent(
  dispatchConfig,
  targetInst,
  nativeEvent,
  nativeEventTarget
) {
  // 是这样用的: SyntheticEvent.getPooledEvent();
  // this  -> SyntheticEvent;
  const EventConstructor = this;
  if (EventConstructor.eventPool.length) {
    const instance = EventConstructor.eventPool.pop();
    instance.init(dispatchConfig, targetInst, nativeEvent, nativeEventTarget);
    return instance;
  }
  return new EventConstructor(
    dispatchConfig,
    targetInst,
    nativeEvent,
    nativeEventTarget
  );
}

function releasePooledEvent(event) {
  const EventConstructor = this;
  event.destructor();
  if (EventConstructor.eventPool.length < EVENT_POOL_SIZE) {
    EventConstructor.eventPool.push(event);
  }
}

function addEventPoolingTo(EventConstructor) {
  EventConstructor.eventPool = [];
  EventConstructor.getPooled = getPooledEvent;
  EventConstructor.release = releasePooledEvent;
}

let previousScreenX = 0;
let isMovementXSet = false;

const SyntheticMouseEventInterface = {
  screenX: null,
  screenY: null,
  movementX(event) {
    if('movementX' in event) {
      return event.movementX;
    }
    const screenX = previousScreenX;
    previousScreenX = event.screenX;
    if(!isMovementXSet) {
      isMovementXSet = true;
      return 0;
    }
    return event.type === 'mousemove' ? event.screenX - screenX : 0;
  },
  type: null
};

const SyntheticMouseEvent = SyntheticEvent.expand(SyntheticMouseEventInterface);

export { SyntheticMouseEvent };
export default SyntheticEvent;
