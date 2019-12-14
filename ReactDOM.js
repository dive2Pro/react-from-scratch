import { createRootFiber } from "./Fiber";
import "./Events";
import { setBatchingImplementation } from "./events/ReactGenericBatching";
import { batchedUpdates } from "./ReactFiberReconciler";

function getStateNode(fiber) {
  return fiber.current;
}

const ReactDOM = {
  render(rElement, container) {
    if (!container) {
      container = document.body;
    }
    // vnode 的信息是放在 container 也就是 根 DOM 上的
    // 通过检查 这个特殊的字段 "_reactContainerRoot" 就可以知道当前 DOM 是否渲染过.
    let root = container._reactContainerRoot;
    // 同时 vdom 也有一个根节点 :
    let fiberRoot;
    if (!root) {
      // 打上该标记
      root = container._reactContainerRoot = createRootFiber(container);
      fiberRoot = root._internalRoot;
      //
      root.render(rElement, null);
    } else {
    }

    return getStateNode(fiberRoot);
  }
};

setBatchingImplementation(batchedUpdates);
export default ReactDOM;
