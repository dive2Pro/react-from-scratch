import {REACT_ELEMENT_TYPE} from './ReactFiberReconciler'
import { Component } from './ReactBaseClass';

const React = {
    createElement: function (type, config, children) {

        const props =  {};

        if(config) {
            for(let propName in config) {
                props[propName] = config[propName]
            }
        }

        const childrenLength = arguments.length - 2;
        if(childrenLength === 1) {
            props.children = children;
        } else {
            const lastChildren = Array(childrenLength);
            for(let i = 0 ; i < childrenLength ; i ++) {
                lastChildren.push(arguments[i + 2]);
            }
            props.children = lastChildren;
        }

        if(type.defaultProps) {
            for(let propName in type.defaultProps) {
                if(props[propName] === undefined) {
                    props[propName] = type.defaultProps[propName]
                }
            }
        }
        
        return {
            type,
            props,
            $$typeof: REACT_ELEMENT_TYPE
        }
    },
    Component
}


export default React;