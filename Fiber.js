import { updateContainer } from "./ReactFiberReconciler";
export const HostRoot = 110;
export const HostText = 2;
export const ClassComponent = 11;
export const NoWork = 0;
export const Sync = 1;

export const NoEffect = /*              */ 0b00000000000;
export const PerformedWork = /*         */ 0b00000000001;
export const Incomplete = /*            */ 0b01000000000;
export const Placement = /*             */ 0b00000000010;

function Fiber(tag, pendingProps) {
  this.tag = tag;
  this.pendingProps = pendingProps;
  this.alternate = null;
  this.expirationTime = NoWork;
  this.type = null;

  this.effectTag = NoEffect;

  this.updateQueue = null;
  this.return = null;
  this.nextScheduleRoot = null;
  this.finishedWork = null;
  this.nextRenderexpirationTime = NoWork;
  this.memoizedProps = null;
  this.memoizedState = null;
  this.sibling = null;
  this.child = null;

  this.firstEffect = null;
  this.lastEffect = null;
  this.nextEffect = null;
  this.stateNode = null;
}

function FiberRoot(container, tag) {
  this.container = container;
  this.tag = tag;
  this.current = null;
}

function createFiber(tag, pendingProps) {
  return new Fiber(tag, pendingProps);
}

function createHostFiber() {
  return createFiber(HostRoot, null);
}

function createFiberRoot(container) {
  const fiberRoot = {
    containerInfo: container,
    nextScheduleRoot: null,
    expirationTime: NoWork,
    finishedWork: null
  };
  const unintializedFiber = createHostFiber();
  unintializedFiber.stateNode = fiberRoot;
  fiberRoot.current = unintializedFiber;
  return fiberRoot;
}

function createFiberFromText(textContent, mode, expirationTime) {
  const fiber = createFiber(HostText, textContent);
  fiber.expirationTime = expirationTime;
  return fiber;
}

function ReactWork() {
  this._didCommit = false;
}

ReactWork.prototype._onCommit = function() {
  this._didCommit = true;
};

function ReactRoot(container) {
  const root = createFiberRoot(container);
  this._internalRoot = root;
}

ReactRoot.prototype.render = function(children, callback) {
  const root = this._internalRoot;
  const work = new ReactWork();
  updateContainer(children, root, null, work._onCommit);
};

function createRootFiber(container) {
  return new ReactRoot(container);
}

export { createRootFiber, createFiberFromText, createFiber };
