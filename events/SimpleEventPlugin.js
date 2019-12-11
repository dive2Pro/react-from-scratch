/**
 *
 */

const eventTypes = {};
/**
 * 事件可以分为两类
 *
 */
const interactiveEventTypeNames = ["click", "click"];

const nonInteractiveEventTypeNames = ["drag", "drag"];

function addEventTypeNameToConfig([topEvent, event], isInteractive) {
  const capitalizedEvent = event[0].toUpperCase() + event.slice(1);
  const onEvent = "on" + capitalizedEvent;
  const type = {
    phrasedRegistrationNames: {
      bubbled: onEvent,
      captured: onEvent + "Capture"
    },
    dependencies: [topEvent],
    isInteractive
  };

  eventTypes[event] = type;
}

interactiveEventTypeNames.forEach(eventTuple => {
  addEventTypeNameToConfig(eventTuple, true);
});

const SimpleEventPlugin = {
  eventTypes,
  extractEvents: function extractEvents(
    topLevelType,
    targetInst,
    nativeEvent,
    nativeEventTarget
  ) {
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
