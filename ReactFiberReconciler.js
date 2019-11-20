import {
  NoWork,
  Sync,
  HostRoot,
  HostText,
  ClassComponent,
  createFiberRoot,
  createFiberFromText,
  createFiber
} from "./Fiber";

const HostComponent = 1;
const NormalClass = 9;
let isWorking = false;
let isCommitting = false;
let isRendering = false;

let lastScheduleRoot = null;
let firstScheduleRoot = null;

let expirationContext = NoWork; // 上下文
let nextRenderexpirationTime = NoWork;
let nextRoot = null;
let nextUnitOfWork = null;

const REACT_ELEMENT_TYPE = 0x001;

const UpdateState = 0;

function commitWork() {}

const classComponentUpdater = {};

function adoptClassInstance(workInProcess, instance) {
  instance.updater = classComponentUpdater;
  workInProcess.stateNode = instance;
}

function constructClassInstance(
  workInProcess,
  Ctor,
  nextProps,
  expirationTime
) {
  const instance = new Ctor(nextProps);

  const state = (workInProcess.memoizedState =
    instance.state !== null && instance.state !== undefined
      ? instance.state
      : null);
  adoptClassInstance(workInProcess, instance);

  return instance;
}

function mountClassInstance(
  workInProcess,
  Component,
  nextProps,
  nextRenderexpirationTime
) {
  const instance = workInProcess.stateNode;

  instance.state = workInProcess.memoizedState;
  instance.props = nextProps;

  if (typeof instance.componentWillMount === "function") {
    callComponentWillMount(workInProcess, instance);
  }
}

function memoizedState(workInProcess, nextState) {
  workInProcess.memoizedState = nextState;
}

function memoizedProps(workInProcess, nextProps) {
  workInProcess.memoizedProps = nextProps;
}

function finishClassComponent(
  current,
  workInProcess,
  ctor,
  shouldUpdate,
  expirationTime
) {
  let nextChildren;
  const instance = workInProcess.stateNode;
  nextChildren = instance.render();

  reconcileChildren(current, workInProcess, nextChildren, expirationTime);

  memoizedState(workInProcess, instance.state);
  memoizedProps(workInProcess, instance.props);

  return workInProcess.child;
}

function updateClassComponent(
  current,
  workInProcess,
  Component,
  nextProps,
  nextRenderexpirationTime
) {
  let shouldUpdate = false;
  if (current === null) {
    if (workInProcess.stateNode === null) {
      constructClassInstance(
        workInProcess,
        Component,
        nextProps,
        nextRenderexpirationTime
      );
      mountClassInstance(
        workInProcess,
        Component,
        nextProps,
        nextRenderexpirationTime
      );
      shouldUpdate = true;
    }
  }

  return finishClassComponent(
    current,
    workInProcess,
    Component,
    shouldUpdate,
    nextRenderexpirationTime
  );
}

function cloneUpdateQueue(queue) {
  return {
    baseState: queue.baseState,
    firstUpdate: queue.firstUpdate,
    lastUpdate: queue.lastUpdate
  };
}

function ensureworkInProcessQueueIsAClone(workInProcess, updateQueue) {
  const current = workInProcess.alternate;
  if (current !== null) {
    if (updateQueue === current.updateQueue) {
      updateQueue = workInProcess.updateQueue = cloneUpdateQueue(updateQueue);
    }
  }

  return updateQueue;
}

function getStateFromUpdate(
  workInProcess,
  queue,
  update,
  prevState,
  nextProps,
  instance
) {
  switch (update.tag) {
    case UpdateState:
      let partialState;
      const payload = update.payload;
      if (typeof payload === "function") {
        partialState = payload.call(instance, prevState, nextProps);
      } else {
        partialState = payload;
      }
      return Object.assign({}, prevState, partialState);
  }
}

function processUpdateQueue(
  workInProcess,
  updateQueue,
  props,
  instance,
  nextRenderexpirationTime
) {
  queue = ensureworkInProcessQueueIsAClone(workInProcess, updateQueue);
  let newBaseState = queue.baseState;
  let resultState;
  let newExpirationWork = NoWork;
  let newFirstUpdate = null;

  let update = queue.firstUpdate;

  while (update !== null) {
    resultState = getStateFromUpdate(
      workInProcess,
      queue,
      update,
      resultState,
      props,
      instance
    );

    update = update.next;
  }
  newBaseState = resultState;
  queue.baseState = newBaseState;
  queue.firstUpdate = newFirstUpdate;

  workInProcess.memoizedState = resultState;
}

function placeSingleChild(fiber) {
  return fiber;
}

function shouldConstruct(Component) {
  const prototype = Component.prototype;
  return (
    typeof prototype === "object" &&
    prototype !== null &&
    typeof prototype.isReactComponent === "object" &&
    prototype.isReactComponent !== null
  );
}

function createFiberFromElement(element, mode, expirationTime) {
  const pendingProps = element.props;
  const type = element.type;
  let fiberTag;

  if (typeof type === "function") {
    fiberTag = shouldConstruct(type) ? ClassComponent : NormalClass;
  } else if (typeof type === "string") {
    fiberTag = HostComponent;
  }

  const fiber = createFiber(fiberTag, pendingProps);
  fiber.type = type;
  fiber.expirationTime = expirationTime;
  return fiber;
}

function reconcileSingleTextNode(
  returnFiber,
  currentFirstChild,
  textContent,
  expirationTime
) {
  const created = createFiberFromText(
    textContent,
    returnFiber.mode,
    expirationTime
  );
  created.return = returnFiber;
  return created;
}

function reconcileSingleElement(
  returnFiber,
  currentFirstChild,
  element,
  expirationTime
) {
  const created = createFiberFromElement(
    element,
    returnFiber.mode,
    expirationTime
  );
  created.return = returnFiber;
  return created;
}

function reconcileChildrenFibers(
  returnFiber,
  currentFirstChild,
  newChild,
  expirationTime
) {
  const isObject = typeof newChild === "object" && newChild !== null;
  if (isObject) {
    switch (newChild.$$typeof) {
      case REACT_ELEMENT_TYPE:
        return placeSingleChild(
          reconcileSingleElement(
            returnFiber,
            currentFirstChild,
            newChild,
            expirationTime
          )
        );
    }
  }

  if (typeof newChild === "string" || typeof newChild === "number") {
    return placeSingleChild(
      reconcileSingleTextNode(
        returnFiber,
        currentFirstChild,
        "" + newChild,
        expirationTime
      )
    );
  }
}

function mountChildrenFibers(
  returnFiber,
  currentFirstChild,
  newChild,
  expirationTime
) {
  return reconcileChildrenFibers(
    returnFiber,
    currentFirstChild,
    newChild,
    expirationTime
  );
}

function reconcileChildren(
  current,
  workInProcess,
  nextChildren,
  nextRenderexpirationTime
) {
  if (current === null) {
    workInProcess.child = mountChildrenFibers(
      workInProcess,
      current.child,
      nextChildren,
      nextRenderexpirationTime
    );
  } else {
    workInProcess.child = reconcileChildrenFibers(
      workInProcess,
      current.child,
      nextChildren,
      nextRenderexpirationTime
    );
  }
}

function updateHostRoot(current, workInProcess, nextRenderexpirationTime) {
  const updateQueue = workInProcess.updateQueue;

  const prevState = workInProcess.memoizedState;
  const prevProps = workInProcess.memoizedProps;
  const prevChildren = prevState !== null ? prevState.element : null;

  processUpdateQueue(
    workInProcess,
    updateQueue,
    nextProps,
    null,
    nextRenderexpirationTime
  );
  const nextState = workInProcess.memoizedState;
  const nextChildren = nextState.element;

  if (prevChildren === nextChildren) {
    // 初次 null === element 必是 false
  }

  reconcileChildren(
    current,
    workInProcess,
    nextChildren,
    nextRenderexpirationTime
  );
  return workInProcess.child;
}

function updateHostComponent(current, workInProcess, expirationTime) {
  const nextProps = workInProcess.memoizedProps;
  reconcileChildren(current, workInProcess, nextProps.children, expirationTime);
  memoizedProps(workInProcess, nextProps);
  return workInProcess.child;
}

function updateHostText(current, workInProcess) {
  const props = workInProcess.pendingProps;
  memoizedProps(workInProcess, props);
  return null;
}

function beginWork(current, workInProcess, nextRenderexpirationTime) {
  switch (workInProcess.tag) {
    case ClassComponent:
      const Component = workInProcess.type;
      const unsolvedProps = workInProcess.pendingProps;
      return updateClassComponent(
        current,
        workInProcess,
        Component,
        unsolvedProps,
        nextRenderexpirationTime
      );
    case HostRoot:
      return updateHostRoot(current, workInProcess, nextRenderexpirationTime);
    case HostComponent:
      return updateHostComponent(
        current,
        workInProcess,
        nextRenderexpirationTime
      );
    case HostText:
      return updateHostText(current, workInProcess);
  }
}

function findHighestPriorityRoot() {
  let highestPriorityWork = NoWork;
  let highestPriorityRoot = null;
  if (lastScheduleRoot !== null) {
    let root = lastScheduleRoot;
    while (root !== null) {
      if (root === lastScheduleRoot) {
        break;
      }
    }
  }
  nextFlushedRoot = highestPriorityRoot;
  nextFlushedexpirationTime = highestPriorityWork;
}

function resetStack() {
  nextRenderexpirationTime = NoWork;
  nextRoot = null;
}

function createworkInProcess(current, pendingProps, expirationTime) {
  let workInProcess = current.alternate;

  if (workInProcess === null) {
    workInProcess = createFiber(current.tag, current.pendingProps);
    workInProcess.type = curret.type;
    workInProcess.stateNode = current.stateNode;

    workInProcess.alternate = current;
    current.alternate = workInProcess;
  } else {
    workInProcess.pendingProps = pendingProps;
  }

  workInProcess.expirationTime = current.expirationTime;

  workInProcess.child = current.child;
  workInProcess.memoizedState = current.memoizedState;
  workInProcess.memoizedProps = current.memoizedProps;
  workInProcess.updateQueue = current.updateQueue;

  workInProcess.sibling = current.sibling;
  workInProcess.ref = current.ref;
  workInProcess.index = current.index;

  return workInProcess;
}


function createTextInstance (newText, workInProcess ) {
    return document.createTextNode(newText);
}
function createInstance(type, workInProcess, nextProps) {
  const domInstance = document.createElement(type);
  return domInstance;
}

function appendInitialChildren(domParent, child ) {
    domParent.appendChild(child);
}

function appendAllChildren(domParent, workInProcess) {
  // 如果 tag 是 Host 类型的, 直接添加到 domParent 上
  // 如果 node.child !== null ; node.child.return = node; node = child;
  // 如果 node === workInProcess, 表示已经到达了根节点, 中断操作
  // 此时 node.child 为 null, 应该处理 node.sibling 了
  // 如果 node.sibling 为空, 则 node = node.return;  处理当前节点的父节点
  // 如果 node.sibling 不为空, node.sibling.return = node.return; node = node.sibling

  let node = workInProcess.child;
  while (node !== null) {
    if (node.type === HostComponent || node.type === HostText) {
        appendInitialChildren(domParent, node.stateNode);
    } else if (node.child !== null) {
      node.child.return = node;
      node = node.child;
      continue;
    }
    if (node === workInProcess) {
      return;
    }
    while (node.sibling === null) {
      if (node.return === null || node.return === workInProcess) {
        return;
      }
      node = node.return;
    }
    node.sibling.return = node.return;
    node = node.sibling;
  }
}

function completeWork(current, workInProcess, expirationTime) {
  const type = workInProcess.type;
  const newProps = workInProcess.pendingProps;

  switch (workInProcess.type) {
    case HostText: {
      workInProcess.stateNode = createTextInstance(
        newProps,
        workInProcess,
      );
      break;
    }
    case HostComponent: {
      const instance = createInstance(type, workInProcess, newProps);
      appendAllChildren(instance, workInProcess);
      workInProcess.stateNode = instance;
      break;
    }
  }
  return null;
}

function completeUnitOfWork(workInProcess) {
  while (true) {
    const current = workInProcess.current;
    const siblingFiber = workInProcess.sibling;
    const returnFiber = workInProcess.return;

    nextUnitOfWork = completeWork(
      current,
      workInProcess,
      nextRenderexpirationTime
    );

    let next = nextUnitOfWork;
    if (next !== null) {
      return next;
    }
    if (siblingFiber !== null) {
      return siblingFiber;
    } else if (returnFiber !== null) {
      workInProcess = returnFiber;
      continue;
    } else {
      return null;
    }
  }
}

function performUnitOfWork(workInProcess) {
  const current = workInProcess.alternate;
  let next;
  next = beginWork(current, workInProcess, nextRenderexpirationTime);

  if (next === null) {
    next = completeUnitOfWork(workInProcess);
  }

  return next;
}

function workLoop() {
  while (nextUnitOfWork) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
  }
}

function renderRoot(root, isYield, isExpired) {
  isWorking = true;

  let expirationTime = root.nextRenderexpirationTime;
  if (nextUnitOfWork === null) {
    resetStack();
    nextRoot = root;
    nextRenderexpirationTime = expirationTime;
    nextUnitOfWork = createworkInProcess(
      nextRoot.current,
      null,
      nextRenderexpirationTime
    );
    root.pendingexpirationTime = NoWork;
  }
  let fatal = false;

  try {
    workLoop();
  } catch (e) {
    fatal = true;
  }
}

function performWorkOnRoot(root, expirationTime, isExpired) {
  isRendering = true;
  if (isExpired) {
    let finishedWork = root.finishedWork;
    if (finishedWork !== null) {
    } else {
      root.finishedWork = null;
      renderRoot(root, false, isExpired);
      finishedWork = root.finishedWork;
      if (finishedWork !== null) {
        completeRoot(root, finishedWork, expirationTime);
      }
    }
  }

  isRendering = false;
}

function performMountWork(root, expirationTime) {
  findHighestPriorityRoot();

  performWorkOnRoot(nextFlushedRoot, nextFlushedexpirationTime, true);
}

function performSyncWork(root, expirationTime) {
  performMountWork(root, expirationTime);
}

function requestWork(root, expirationTime) {
  addRootToSchedule(root, expirationTime);
  if (isRendering) {
    return;
  }

  performSyncWork(root, expirationTime);
}

function addRootToSchedule(root, expirationTime) {
  // ... 第一次 mount 时, 此处的代码用不到 (大雾)
  if (root.nextScheduleRoot === null) {
    root.expirationTime = expirationTime;
    if (lastScheduleRoot === null) {
      lastScheduleRoot = firstScheduleRoot = root;
      root.nextScheduleRoot = root;
    }
  }
}

function computeExpirationForFiber(currentTime, fiber) {
  let expirationTime;
  if (expirationContext !== NoWork) {
    expirationTime = expirationContext;
  } else {
    expirationTime = Sync;
  }
  return expirationTime;
}

function getContextForSubtree(parentComponent) {
  // TODO:
  return {};
}

function createUpdateQueue(baseState) {
  return {
    baseState,
    firstUpdate: null,
    lastUpdate: null
  };
}

function appendUpdateToQueue(queue, update) {
  if (queue.lastUpdate === null) {
    queue.firstUpdate = quque.lastUpdate = update;
  }
}

function enqueueUpdater(fiber, update) {
  let alternate = fiber.alternate;
  let queue1;
  let queue2;
  if (alternate === null) {
    queue1 = alternate.updateQueue;
    queue2 = null;

    if (queue1 === null) {
      queue1 = alternate.updateQueue = createUpdateQueue(fiber.memoizedState);
    }
  }

  if (queue2 === null || queue1 === queue2) {
    appendUpdateToQueue(queue1, update);
  }
}

function scheduleWorkToRoot(fiber, expirationTime) {
  if (
    fiber.expirationTime === NoWork ||
    fiber.expirationTime > expirationTime
  ) {
    fiber.expirationTime = expirationTime;
  }

  let node = fiber.return;

  if (node === null && fiber.tag === HostRoot) {
    return fiber.stateNode;
  }
}

function scheduleWork(fiber, expirationTime) {
  const root = scheduleWorkToRoot(fiber, expirationTime);

  if (!root) {
    console.log(`fiber 必有根, ${fiber}`);
    return;
  }

  if (!isWorking || isCommitting) {
    const rootexpirationTime = root.expirationTime;
    requestWork(fiber, rootexpirationTime);
  }
}

function createUpdate(expirationTime) {
  return {
    expirationTime,
    tag: UpdateState,

    payload: null,
    next: null
  };
}

function scheduleRootUpdate(element, current, expirationTime, callback) {
  const updater = createUpdate(expirationTime);

  updater.payload = {
    element
  };

  callback = callback === undefined ? null : callback;

  if (callback) {
    updater.callback = callback;
  }

  enqueueUpdater(current, updater);

  scheduleWork(current, expirationTime);

  return expirationTime;
}

function updateContainerAtExpiration(
  elements,
  container,
  parentComponent,
  expirationTime,
  callback
) {
  const context = getContextForSubtree(parentComponent);
  const current = container.current;

  if (container.context === null) {
    container.context = context;
  } else {
    container.pendingContext = context;
  }

  return scheduleRootUpdate(current, container, expirationTime, callback);
}

function updateContainer(elements, container, parentComponent, callback) {
  const current = container.current;

  const currentTime = Date.now();

  const expirationTime = computeExpirationForFiber(currentTime, current);

  return updateContainerAtExpiration(
    elements,
    container,
    parentComponent,
    expirationTime,
    callback
  );
}

export { requestWork, updateContainer };
