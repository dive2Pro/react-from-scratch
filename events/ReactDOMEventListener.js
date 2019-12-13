import {HostText} from "../Fiber";
import {HostComponent} from "../ReactFiberReconciler";
import {runExtractedEventsInBatch} from "../Events";

const internalInstanceKey = ' __reactInternalInstance$ 1';
const internalEventHandlersKey = ' __reactEventHandlers$ 2';

function addEventBubbleListener(element, eventType, listener) {
    element.addEventListener(eventType, listener, false);
}

export function trapBubbledEvent(topLevelType, element) {
    const dispatch = dispatchEvent;
    addEventBubbleListener(
        element,
        topLevelType,
        dispatch.bind(null, topLevelType)
    );
}

function handleTopLevel(bookKeeping) {
    let targetInst = bookKeeping.targetInst;

    let ancestor = targetInst;

    do {
        if(!ancestor) {
            bookKeeping.ancestors.push(ancestor)
            break;
        }
        // 如果 targetInst 为空 则将 Root  添加到 ancestors
        const root = findRootContainerNode(ancestor);
        if(!root) {
            break;
        }
        bookKeeping.ancestors.push(ancestor);
        ancestor = getClosestInstanceFromNode(root);
    } while(ancestor);

    for(let i = 0; i < bookKeeping.ancestors.length; i ++ ) {
        targetInst = bookKeeping.ancestors[i];
        runExtractedEventsInBatch(
            bookKeeping.topLevelType,
            targetInst,
            bookKeeping.nativeEvent,
            getEventTarget(bookKeeping.nativeEvent)
        )
    }
}

// 这是事件的回调
function dispatchEvent(topLevelType, nativeEvent) {
    const nativeEventTarget = getEventTarget(nativeEvent);
    let targetInst = getClosestInstanceFromNode(nativeEventTarget);
    const bookKeeping = getTopLevelCallbackBookKeeping(
        topLevelType,
        targetInst,
        nativeEvent
    );
    try {
        batchUpdates(handleTopLevel, bookKeeping);
    } finally {
        releaseTopLevelCallbackBookKeeping(bookKeeping);
    }
}

// 对象池
const callbackBookKeepingPool = [];
const CALLBACK_BOOKKEEPING_POOL_SIZE = 10;

function releaseTopLevelCallbackBookKeeping(instance) {
    instance.topLevelType = null;
    instance.targetInst = null;
    instance.nativeEvent = null;
    instance.ancestors = [];
    if(callbackBookKeepingPool.length < CALLBACK_BOOKKEEPING_POOL_SIZE) {
        callbackBookKeepingPool.push(instance);
    }
}
function getTopLevelCallbackBookKeeping(topLevelType, targetInst, nativeEvent) {
    if(callbackBookkeepingPool.length) {
        const instance = callbackBookkeepingPool.pop();
        instance.topLevelType = topLevelType;
        instance.targetInst = targetInst;
        instance.nativeEvent = nativeEvent;
        return instance;
    }

    return {
        topLevelType,
        targetInst,
        nativeEvent,
        ancestors: []
    }

}

export function precacheFiberNode(hostInst, node) {
    node[internalInstanceKey] = hostInst;
}

export function getFiberCurrentPropsFromNode(node) {
    return node[internalEventHandlersKey] || null;
}

/**
 *  在 domElement 上开辟特定字段来保存 props
 *
 * @param node
 * @param props
 */
export function updateFiberProps(node, props) {
    node[internalEventHandlersKey] = props;
}

function getClosestInstanceFromNode(node) {
    if(node[internalInstanceKey]) {
        return node[internalInstanceKey];
    }
    while(!node[internalInstanceKey]) {
        if(node.parentNode) {
            node = node.parentNode;
        } else {
            return null;
        }

    }
    const inst = node[internalInstanceKey];
    if(inst.tag === HostComponent || inst.tag === HostText) {
        return inst;
    }
    return null;
}

/**
 *
 * @param nativeEvent Native browser event
 * @return DOMEventTarget  Target node.
 */
function getEventTarget(nativeEvent) {
    let target = nativeEvent.target || nativeEvent.srcElement || window;

    // Safari 可以在 text node 上发送事件
    return target.nodeType === 3 ? target.parentNode : target;
}
