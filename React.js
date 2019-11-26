import {REACT_ELEMENT_TYPE} from './ReactFiberReconciler'
import { Component } from './ReactBaseClass';

const React = {
    createElement: (type, config, children) => {

        const props =  {};

        if(config) {
            for(let propName in config) {
                props[propName] = config[propName]
            }
        }

        props.children = children;

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