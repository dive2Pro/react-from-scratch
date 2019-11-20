import {
  NoWork,
  Sync,
  HostRoot,
  HostText,
  ClassComponent,
  createFiberRoot,
  createFiberFromText,
  createFiber,
  Placement,
  PerformedWork
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
let nextFlushedRoot = null;
let nextFlushedexpirationTime = NoWork;
let nextEffect = null;

export const REACT_ELEMENT_TYPE = 0x001;

const UpdateState = 0;

function commitWork() {}

const classComponentUpdater = {};

function adoptClassInstance(workInProgress, instance) {
  instance.updater = classComponentUpdater;
  workInProgress.stateNode = instance;
}

function constructClassInstance(
  workInProgress,
  Ctor,
  nextProps,
  expirationTime
) {
  const instance = new Ctor(nextProps);

  const state = (workInProgress.memoizedState =
    instance.state !== null && instance.state !== undefined
      ? instance.state
      : null);
  adoptClassInstance(workInProgress, instance);

  return instance;
}

function mountClassInstance(
  workInProgress,
  Component,
  nextProps,
  nextRenderexpirationTime
) {
  const instance = workInProgress.stateNode;

  instance.state = workInProgress.memoizedState;
  instance.props = nextProps;

  if (typeof instance.componentWillMount === "function") {
    callComponentWillMount(workInProgress, instance);
  }
}

function memoizedState(workInProgress, nextState) {
  workInProgress.memoizedState = nextState;
}

function memoizedProps(workInProgress, nextProps) {
  workInProgress.memoizedProps = nextProps;
}

function finishClassComponent(
  current,
  workInProgress,
  ctor,
  shouldUpdate,
  expirationTime
) {
  let nextChildren;
  const instance = workInProgress.stateNode;
  nextChildren = instance.render();

  reconcileChildren(current, workInProgress, nextChildren, expirationTime);

  memoizedState(workInProgress, instance.state);
  memoizedProps(workInProgress, instance.props);

  return workInProgress.child;
}

function updateClassComponent(
  current,
  workInProgress,
  Component,
  nextProps,
  nextRenderexpirationTime
) {
  let shouldUpdate = false;
  if (current === null) {
    if (workInProgress.stateNode === null) {
      constructClassInstance(
        workInProgress,
        Component,
        nextProps,
        nextRenderexpirationTime
      );
      mountClassInstance(
        workInProgress,
        Component,
        nextProps,
        nextRenderexpirationTime
      );
      shouldUpdate = true;
    }
  }

  return finishClassComponent(
    current,
    workInProgress,
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

function ensureworkInProcessQueueIsAClone(workInProgress, updateQueue) {
  const current = workInProgress.alternate;
  if (current !== null) {
    if (updateQueue === current.updateQueue) {
      updateQueue = workInProgress.updateQueue = cloneUpdateQueue(updateQueue);
    }
  }

  return updateQueue;
}

function getStateFromUpdate(
  workInProgress,
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
  workInProgress,
  queue,
  props,
  instance,
  nextRenderexpirationTime
) {
  queue = ensureworkInProcessQueueIsAClone(workInProgress, queue);
  let newBaseState = queue.baseState;
  let resultState;
  let newExpirationWork = NoWork;
  let newFirstUpdate = null;

  let update = queue.firstUpdate;

  while (update !== null) {
    resultState = getStateFromUpdate(
      workInProgress,
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

  workInProgress.memoizedState = resultState;
}

function placeSingleChild(fiber) {
  if (fiber.alternate === null) {
    fiber.effectTag = Placement;
  }
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
  workInProgress,
  nextChildren,
  nextRenderexpirationTime
) {
  if (current === null) {
    workInProgress.child = mountChildrenFibers(
      workInProgress,
      null,
      nextChildren,
      nextRenderexpirationTime
    );
  } else {
    workInProgress.child = reconcileChildrenFibers(
      workInProgress,
      current.child,
      nextChildren,
      nextRenderexpirationTime
    );
  }
}

function updateHostRoot(current, workInProgress, nextRenderexpirationTime) {
  const updateQueue = workInProgress.updateQueue;

  const prevState = workInProgress.memoizedState;
  const nextProps = workInProgress.memoizedProps;
  const prevChildren = prevState !== null ? prevState.element : null;

  processUpdateQueue(
    workInProgress,
    updateQueue,
    nextProps,
    null,
    nextRenderexpirationTime
  );
  const nextState = workInProgress.memoizedState;
  const nextChildren = nextState.element;

  if (prevChildren === nextChildren) {
    // 初次 null === element 必是 false
  }

  reconcileChildren(
    current,
    workInProgress,
    nextChildren,
    nextRenderexpirationTime
  );
  return workInProgress.child;
}

function updateHostComponent(current, workInProgress, expirationTime) {
  const nextProps = workInProgress.pendingProps;
  reconcileChildren(
    current,
    workInProgress,
    nextProps.children,
    expirationTime
  );
  memoizedProps(workInProgress, nextProps);
  return workInProgress.child;
}

function updateHostText(current, workInProgress) {
  const props = workInProgress.pendingProps;
  memoizedProps(workInProgress, props);
  return null;
}

function beginWork(current, workInProgress, nextRenderexpirationTime) {
  switch (workInProgress.tag) {
    case ClassComponent:
      const Component = workInProgress.type;
      const unsolvedProps = workInProgress.pendingProps;
      return updateClassComponent(
        current,
        workInProgress,
        Component,
        unsolvedProps,
        nextRenderexpirationTime
      );
    case HostRoot:
      return updateHostRoot(current, workInProgress, nextRenderexpirationTime);
    case HostComponent:
      return updateHostComponent(
        current,
        workInProgress,
        nextRenderexpirationTime
      );
    case HostText:
      return updateHostText(current, workInProgress);
  }
}

function findHighestPriorityRoot() {
  let highestPriorityWork = NoWork;
  let highestPriorityRoot = null;
  if (lastScheduleRoot !== null) {
    let root = lastScheduleRoot;
    while (root !== null) {
      if (highestPriorityWork === NoWork) {
        highestPriorityRoot = root;
        highestPriorityWork = root.expirationTime;
      }
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
  let workInProgress = current.alternate;

  if (workInProgress === null) {
    workInProgress = createFiber(current.tag, current.pendingProps);
    workInProgress.type = current.type;
    workInProgress.stateNode = current.stateNode;

    workInProgress.alternate = current;
    current.alternate = workInProgress;
  } else {
    workInProgress.pendingProps = pendingProps;
  }

  workInProgress.expirationTime = current.expirationTime;

  workInProgress.child = current.child;
  workInProgress.memoizedState = current.memoizedState;
  workInProgress.memoizedProps = current.memoizedProps;
  workInProgress.updateQueue = current.updateQueue;

  workInProgress.sibling = current.sibling;
  workInProgress.ref = current.ref;
  workInProgress.index = current.index;

  return workInProgress;
}

function createTextInstance(newText, workInProgress) {
  return document.createTextNode(newText);
}
function createInstance(type, workInProgress, nextProps) {
  const domInstance = document.createElement(type);
  return domInstance;
}

function appendInitialChildren(domParent, child) {
  domParent.appendChild(child);
}

function appendAllChildren(domParent, workInProgress) {
  // 如果 tag 是 Host 类型的, 直接添加到 domParent 上
  // 如果 node.child !== null ; node.child.return = node; node = child;
  // 如果 node === workInProgress, 表示已经到达了根节点, 中断操作
  // 此时 node.child 为 null, 应该处理 node.sibling 了
  // 如果 node.sibling 为空, 则 node = node.return;  处理当前节点的父节点
  // 如果 node.sibling 不为空, node.sibling.return = node.return; node = node.sibling

  let node = workInProgress.child;
  while (node !== null) {
    if (node.tag === HostComponent || node.tag === HostText) {
      appendInitialChildren(domParent, node.stateNode);
    } else if (node.child !== null) {
      node.child.return = node;
      node = node.child;
      continue;
    }
    if (node === workInProgress) {
      return;
    }
    while (node.sibling === null) {
      if (node.return === null || node.return === workInProgress) {
        return;
      }
      node = node.return;
    }
    node.sibling.return = node.return;
    node = node.sibling;
  }
}

function updateHostContainer(workInProgress) {
  // console.log(workInProgress);
}

function completeWork(current, workInProgress, expirationTime) {
  const type = workInProgress.type;
  const newProps = workInProgress.pendingProps;

  switch (workInProgress.tag) {
    case HostRoot: {
      updateHostContainer(workInProgress);
      break;
    }
    case HostText: {
      workInProgress.stateNode = createTextInstance(newProps, workInProgress);
      break;
    }
    case HostComponent: {
      const instance = createInstance(type, workInProgress, newProps);
      appendAllChildren(instance, workInProgress);
      workInProgress.stateNode = instance;
      break;
    }
  }
  return null;
}

function completeUnitOfWork(workInProgress) {
  while (true) {
    const current = workInProgress.current;
    const siblingFiber = workInProgress.sibling;
    const returnFiber = workInProgress.return;

    nextUnitOfWork = completeWork(
      current,
      workInProgress,
      nextRenderexpirationTime
    );

    let next = nextUnitOfWork;
    if (next !== null) {
      return next;
    }
    if(returnFiber === null) {
      return null;
    }

    /**
     * 在 mount 阶段, 此时的 returnFiber 的firstEffect 和 lastEffect 都是 null
     * 而且是由 子组件给 returnFiber 的这两个字段赋值
     * 比如:
     *        leaf -> parent -> root
     * 刚开始时各自是:
     *  [leaf, parent, root]:
     *        returnFiber: {
     *           firstEffect: null,
     *           lastEffect : null
     *        }
     *        workInProgress: {
     *           firstEffect: null,
     *           lastEffect : null
     *        }
     *  left 走完这里的流程后:
     *
     *  leaf:
     *        returnFiber: {
     *           firstEffect: leaf,
     *           lastEffect : leaf
     *        }
     *        workInProgress: {
     *           firstEffect: null,
     *           lastEffect : null
     *        }
     *
     *  轮到 parent 时:
     *        returnFiber: {
     *           firstEffect: null,
     *           lastEffect : null
     *        } // returnFiber = root
     *        workInProgress: {
     *           firstEffect: leaf,
     *           lastEffect : leaf
     *        }
     *  此时要注意的是后面 commit phrase 的阶段, 要先处理 leaf (记得 componentDidMount 是要先 leaf -> parent ->root)
     *  所以这里的链表要做处理
     *  returnFiber.firstEffect = workInProgress.firstEffect // 第一个处理的总是最外围的 leaf
     *  接着要处理 lastEffect , 此时也要考虑 returnFiber 有多个子组件的情况
     *  处理完 parent 后:
     *
     *        returnFiber: {
     *           firstEffect: leaf,
     *           lastEffect : leaf
     *        } // returnFiber = root
     *
     *        leaf.nextEffect = workInProgress
     *
     *        workInProgress: {
     *           firstEffect: leaf,
     *           lastEffect : leaf
     *        }
     *  下一次 为 root 时就跳出循环了
     */

    if(returnFiber.firstEffect === null) {
       returnFiber.firstEffect = workInProgress.firstEffect;
    }

    if(workInProgress.lastEffect !== null) {
      if(returnFiber.lastEffect !== null) {
        returnFiber.lastEffect.nextEffect = workInProgress.firstEffect;
      }
      returnFiber.lastEffect = workInProgress.lastEffect
    }

    // effect 是另外一个链表, 用来处理 side effect, 包括将 vdom 插入到 dom 上
    // 此时处理的顺序是 :
    //                child1
    //                child2 - parent - root
    //                child3
    // 经过处理后:
    //          parent.lastEffect = child3
    //          parent.firstEffect = child1
    //          child1.nextEffect = child2
    //          child2.nextEffect = child3
    //          root.lastEffect = root.firstEffect = parent;
    //
    const effectTag = workInProgress.effectTag;
    if (effectTag > PerformedWork) {
      if (returnFiber.lastEffect !== null) {
        returnFiber.lastEffect.nextEffect = workInProgress;
      } else {
        returnFiber.firstEffect = workInProgress;
      }
      returnFiber.lastEffect = workInProgress;
    }

    if (siblingFiber !== null) {
      return siblingFiber;
    } else if (returnFiber !== null) {
      workInProgress = returnFiber;
      continue;
    } else {
      return null;
    }
  }
}

function performUnitOfWork(workInProgress) {
  const current = workInProgress.alternate;
  let next;
  next = beginWork(current, workInProgress, nextRenderexpirationTime);

  if (next === null) {
    next = completeUnitOfWork(workInProgress);
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
    console.error(e);
    fatal = true;
  }
  isWorking = false;
  nextRoot = null;
  const rootWorkInProcess = root.current.alternate;

  onCompleted(root, rootWorkInProcess, expirationTime);
}

function onCompleted(root, finishedWork, expirationTime) {
  root.finishedWork = finishedWork;
}

function commitPlacement(nextEffect) {
  console.log(nextEffect);
}

function commitAllHostEffects() {
  while (nextEffect !== null) {
    const effectTag = nextEffect.effectTag;
    const primaryEffect = effectTag & Placement;
    switch (primaryEffect) {
      case Placement: {
        commitPlacement(nextEffect);
        break;
      }
      default:
      //
    }
    nextEffect = nextEffect.nextEffect;
  }
}

function completeRoot(root, finishedWork, expirationTime) {
  isWorking = true;
  isCommitting = true;

  root.finishedWork = null;

  let firstEffect;
  firstEffect = finishedWork.firstEffect;
  nextEffect = firstEffect;

  while (nextEffect !== null) {
    try {
      commitAllHostEffects();
    } catch (e) {
      console.error(e);
      return;
    }
  }

  commitWork(root, finishedWork);
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
    queue.firstUpdate = queue.lastUpdate = update;
  }
}

function enqueueUpdater(fiber, update) {
  let alternate = fiber.alternate;
  let queue1;
  let queue2;
  if (alternate === null) {
    queue1 = fiber.updateQueue;
    queue2 = null;

    if (queue1 === null) {
      queue1 = fiber.updateQueue = createUpdateQueue(fiber.memoizedState);
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
    requestWork(root, rootexpirationTime);
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

function scheduleRootUpdate(current, element, expirationTime, callback) {
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

  return scheduleRootUpdate(current, elements, expirationTime, callback);
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
