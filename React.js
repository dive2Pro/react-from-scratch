import {REACT_ELEMENT_TYPE} from './ReactFiberReconciler'


const React = {
    createElement: (type, props) => {
        return {
            type,
            props,
            $$typeof: REACT_ELEMENT_TYPE
        }
    },
}


export default React;