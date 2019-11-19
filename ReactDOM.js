import { updateContainer } from "./ReactFiberReconciler";
import { createFiberRoot } from "./Fiber";

function ReactWork() {
  this._didCommit = false;
}

ReactWork.prototype._onCommit = function() {
  this._didCommit = true;
};

function getStateNode(fiber) {
  return fiber.current;
}

function ReactRoot(container) {
  const root = createFiberRoot(container);
  this._internalRoot = root;
}

ReactRoot.prototype.render = function(children, callback) {
  const root = this._internalRoot;
  const work = new ReactWork();
  updateContainer(children, root, null, work._onCommit);
};

function createRootFiber(container ) {
  return new ReactRoot(container);
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
    if (!container._reactContainerRoot) {
      // 打上该标记
      root = container._reactContainerRoot = createRootFiber(
        container,
        rElement
      );
      fiberRoot = root._internalRoot;
      //
      root.render(rElement, null);
    } else {
    }

    return getStateNode(fiberRoot);
  }
};
export default ReactDOM;
