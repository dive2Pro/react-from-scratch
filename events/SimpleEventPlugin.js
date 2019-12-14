/**
 *
 */

import { SyntheticMouseEvent } from "./SyntheticEvent";
import { HostComponent } from "../ReactFiberReconciler";
import {getListener} from "../Events";

const eventTypes = {};

const topLevelEventsTypeToDispatchConfig = {};

/**
 * 事件可以分为两类
 *
 */
const interactiveEventTypeNames = [["click", "click"]];

const nonInteractiveEventTypeNames = [["drag", "drag"]];

function addEventTypeNameToConfig([topEvent, event], isInteractive) {
  const capitalizedEvent = event[0].toUpperCase() + event.slice(1);
  const onEvent = "on" + capitalizedEvent;
  const type = {
    phasedRegistrationNames: {
      bubbled: onEvent,
      captured: onEvent + "Capture"
    },
    dependencies: [topEvent],
    isInteractive
  };

  eventTypes[event] = type;
  topLevelEventsTypeToDispatchConfig[topEvent] = type;
}

interactiveEventTypeNames.forEach(eventTuple => {
  addEventTypeNameToConfig(eventTuple, true);
});

export function forEachAccumulated(array, fn, scope) {
  if (Array.isArray(array)) {
    array.forEach(fn);
  } else if (array) {
    fn.call(scope, array);
  }
}

/**
 * eg:
 *      current: [1],
 *      next: [2]
 *      return: [1, 2];
 *
 * @param current
 * @param next
 * @returns {*[]|*}
 */
export function accumulateInto(current, next) {
  if (current == null) {
    return next;
  }
  if (Array.isArray(current)) {
    if (Array.isArray(next)) {
      current.push.apply(current, next);
      return current;
    }
    current.push(next);
    return current;
  }

  if (Array.isArray(next)) {
    return [current].concat(next);
  }

  return [current, next];
}

function listenerAtPhase(inst, event, phase) {
  const registrationName = event.dispatchConfig.phasedRegistrationNames[phase];
  return getListener(inst, registrationName);
}

function accumulateDirectionalDispatches(inst, phase, event) {
  const listener = listenerAtPhase(inst, event, phase);
  if (listener) {
    event._dispatchListeners = accumulateInto(
      event._dispatchListeners,
      listener
    );
    event._dispatchInstances = accumulateInto(event._dispatchInstances, inst);
  }
}

/**
 * 找到父级的 HostComponent, 因为都是作用在这个类型上的回调链
 * @param inst
 * @returns {*|null}
 */
function getParent(inst) {
  do {
    inst = inst.return;
  } while (inst && inst.tag !== HostComponent);
  return inst || null;
}

function traverseTwoPhase(inst, fn, arg) {
  const path = [];
  while (inst) {
    path.push(inst);
    inst = getParent(inst);
  }

  let i;

  for (i = path.length; i-- > 0; ) {
    fn(path[i], "captured", arg);
  }

  for (i = 0; i< path.length ; i ++) {
    fn(path[i], "bubbled", arg);
  }
}

function accumulateTwoPhaseDispatchesSingle(event) {
  if (event && event.dispatchConfig.phasedRegistrationNames) {
    traverseTwoPhase(event._targetInst, accumulateDirectionalDispatches, event);
  }
}

function accumulateTwoPhaseDispatches(events) {
  forEachAccumulated(events, accumulateTwoPhaseDispatchesSingle);
}

const SimpleEventPlugin = {
  eventTypes,
  extractEvents: function extractEvents(
    topLevelType,
    targetInst,
    nativeEvent,
    nativeEventTarget
  ) {
    const dispatchConfig = topLevelEventsTypeToDispatchConfig[topLevelType];

    let EventConstructor;
    switch (topLevelType) {
      case "click":
        EventConstructor = SyntheticMouseEvent;
        break;
    }
    const event = EventConstructor.getPooled(
      dispatchConfig,
      targetInst,
      nativeEvent,
      nativeEventTarget
    );
    accumulateTwoPhaseDispatches(event);
    return event;
  }
};

export default SimpleEventPlugin;
