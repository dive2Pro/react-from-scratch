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
import { injection, plugins } from "./events/EventPluginRegistry";
import SimpleEventPlugin, { accumulateInto } from "./events/SimpleEventPlugin";
import {getFiberCurrentPropsFromNode} from "./events/ReactDOMEventListener";

function extractEvents(
  topLevelType,
  targetInst,
  nativeEvent,
  nativeEventTarget
) {
  let events = null;
  for (let i = 0; i < plugins.length; i++) {
    const possiblePlugin = plugins[i];
    if (possiblePlugin) {
      const extractedEvents = possiblePlugin.extractEvents(
        topLevelType,
        targetInst,
        nativeEvent,
        nativeEventTarget
      );
      if (extractedEvents) {
        events = accumulateInto(events, extractedEvents);
      }
    }
  }

  return events;
}

function isInteractive(tag) {
  return (
    tag === "button" ||
    tag === "input" ||
    tag === "select" ||
    tag === "textarea"
  );
}
/**
 * 检查是否 出于 禁止  状态
 *
 * @param name
 * @param type
 * @param props
 */
function shouldPreventMouseEvent(name, type, props) {
  switch (name) {
    case "onClick":
      return !!(props.disabled && isInteractive(type));
    default:
      return false;
  }
}

export function getListener(inst, registrationName) {
  let listener;
  const stateNode = inst.stateNode;
  if (!stateNode) {
    return null;
  }
  const props = getFiberCurrentPropsFromNode(stateNode);
  if (!props) {
    return null;
  }

  if (shouldPreventMouseEvent(registrationName, inst.isPrototypeOf, props)) {
    return null;
  }

  listener = props[registrationName];

  return listener;
}

function runEventsInBatch(event, isSimulate) {}

export function runExtractedEventsInBatch(
  topLevelType,
  targetInst,
  nativeEvent,
  nativeEventTarget
) {
  const events = extractEvents(
    topLevelType,
    targetInst,
    nativeEvent,
    nativeEventTarget
  );
  runEventsInBatch(events, false);
}

injection.injectEventPluginsByName([SimpleEventPlugin]);
