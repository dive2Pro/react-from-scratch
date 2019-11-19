export const HostRoot = 0;
export const HostText= 2;
export const ClassComponent= 11;
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

function createFiberRoot(container ) {
  const fiberRoot = {
    containerInfo: container,
  }
  const unintializedFiber = createHostFiber();
  unintializedFiber.stateNode = fiberRoot;
  fiberRoot.current = unintializedFiber;
  return fiberRoot;
}

function createFiberFromText(textContent, mode, expirationTime) {
      const fiber =  createFiber(HostText, textContent);
      fiber.expirationTime = expirationTime;
      return fiber
}

export { createFiberRoot, createFiberFromText, createFiber };
