/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 1);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

(function (global, factory) {
   true ? factory(exports) :
  undefined;
}(this, function (exports) { 'use strict';

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  var forEach = Array.prototype.forEach;

  var CustomAttributeRegistry =
  /*#__PURE__*/
  function () {
    function CustomAttributeRegistry(ownerDocument) {
      _classCallCheck(this, CustomAttributeRegistry);

      if (!ownerDocument) {
        throw new Error("Must be given a document");
      }

      this.ownerDocument = ownerDocument;
      this._attrMap = new Map();
      this._elementMap = new WeakMap();

      this._observe();
    }

    _createClass(CustomAttributeRegistry, [{
      key: "define",
      value: function define(attrName, Constructor) {
        this._attrMap.set(attrName, Constructor);

        this._upgradeAttr(attrName);
      }
    }, {
      key: "get",
      value: function get(element, attrName) {
        var map = this._elementMap.get(element);

        if (!map) return;
        return map.get(attrName);
      }
    }, {
      key: "_getConstructor",
      value: function _getConstructor(attrName) {
        return this._attrMap.get(attrName);
      }
    }, {
      key: "_observe",
      value: function _observe() {
        var customAttributes = this;
        var root = this.ownerDocument;

        var downgrade = this._downgrade.bind(this);

        var upgrade = this._upgradeElement.bind(this);

        this.observer = new MutationObserver(function (mutations) {
          forEach.call(mutations, function (m) {
            if (m.type === 'attributes') {
              var attr = customAttributes._getConstructor(m.attributeName);

              if (attr) {
                customAttributes._found(m.attributeName, m.target, m.oldValue);
              }
            } // chlidList
            else {
                forEach.call(m.removedNodes, downgrade);
                forEach.call(m.addedNodes, upgrade);
              }
          });
        });
        this.observer.observe(root, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeOldValue: true
        });
      }
    }, {
      key: "_upgradeAttr",
      value: function _upgradeAttr(attrName, document) {
        document = document || this.ownerDocument;
        var matches = document.querySelectorAll("[" + attrName + "]"); // Use a forEach as Edge doesn't support for...of on a NodeList

        forEach.call(matches, function (match) {
          this._found(attrName, match);
        }, this);
      }
    }, {
      key: "_upgradeElement",
      value: function _upgradeElement(element) {
        if (element.nodeType !== 1) return; // Use a forEach as Safari 10 doesn't support for...of on NamedNodeMap (attributes)

        forEach.call(element.attributes, function (attr) {
          if (this._getConstructor(attr.name)) {
            this._found(attr.name, element);
          }
        }, this);

        this._attrMap.forEach(function (constructor, attr) {
          this._upgradeAttr(attr, element);
        }, this);
      }
    }, {
      key: "_downgrade",
      value: function _downgrade(element) {
        var map = this._elementMap.get(element);

        if (!map) return;
        map.forEach(function (inst) {
          if (inst.disconnectedCallback) {
            inst.disconnectedCallback();
          }
        }, this);

        this._elementMap.delete(element);
      }
    }, {
      key: "_found",
      value: function _found(attrName, el, oldVal) {
        var map = this._elementMap.get(el);

        if (!map) {
          map = new Map();

          this._elementMap.set(el, map);
        }

        var inst = map.get(attrName);
        var newVal = el.getAttribute(attrName);

        if (!inst) {
          var Constructor = this._getConstructor(attrName);

          inst = new Constructor();
          map.set(attrName, inst);
          inst.ownerElement = el;
          inst.name = attrName;
          inst.value = newVal;

          if (inst.connectedCallback) {
            inst.connectedCallback();
          }
        } // Attribute was removed
        else if (newVal == null) {
            if (inst.disconnectedCallback) {
              inst.disconnectedCallback();
            }

            map.delete(attrName);
          } // Attribute changed
          else if (newVal !== inst.value) {
              inst.value = newVal;

              if (inst.changedCallback) {
                inst.changedCallback(oldVal, newVal);
              }
            }
      }
    }]);

    return CustomAttributeRegistry;
  }();

  var customAttributes = new CustomAttributeRegistry(document);

  exports.CustomAttributeRegistry = CustomAttributeRegistry;
  exports.default = customAttributes;

  Object.defineProperty(exports, '__esModule', { value: true });

}));


/***/ }),
/* 1 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "version", function() { return version; });
/* harmony import */ var custom_attributes_pkg_dist_umd__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(0);
/* harmony import */ var custom_attributes_pkg_dist_umd__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(custom_attributes_pkg_dist_umd__WEBPACK_IMPORTED_MODULE_0__);
 // TODO: element behaviors currently don't work on elements when they are
// defined (via elementBehaviors.define()) after the elements are already in the
// DOM. Make it order-independent.

class BehaviorRegistry {
  constructor() {
    this._definedBehaviors = new Map();
  }

  define(name, Behavior) {
    if (!this._definedBehaviors.has(name)) {
      this._definedBehaviors.set(name, Behavior);
    } else {
      throw new Error(`Behavior ${name} is already defined.`);
    }
  }

  get(name) {
    return this._definedBehaviors.get(name);
  }

  has(name) {
    return this._definedBehaviors.has(name);
  }

}

window.elementBehaviors = new BehaviorRegistry(); // for semantic purpose

class BehaviorMap extends Map {} // stores the behaviors associated to each element.


const behaviorMaps = new WeakMap(); // All elements have a `behaviors` property. If null, it the element has no
// behaviors, otherwise the property is a map of behavior names to behavior
// instances.

Object.defineProperty(Element.prototype, 'behaviors', {
  get() {
    let thisBehaviors = null;

    if (!behaviorMaps.has(this)) {
      behaviorMaps.set(this, thisBehaviors = new BehaviorMap());
    } else thisBehaviors = behaviorMaps.get(this);

    return thisBehaviors;
  }

}); // One instance of is instantiated per element with has="" attribute.

class HasAttribute {
  constructor() {
    // TODO constructor confusing because this.ownerElement doesn't exist. Report to custom-attributes
    this.observers = new Map();
  }

  connectedCallback() {
    this.behaviors = this.ownerElement.behaviors;
    this.changedCallback('', this.value);
  }

  disconnectedCallback() {
    this.changedCallback(this.value, '');
    delete this.behaviors;
  }

  changedCallback(oldVal, newVal) {
    const newBehaviors = this.getBehaviorNames(newVal);
    const previousBehaviors = Array.from(this.behaviors.keys()); // small optimization: if no previous or new behaviors, just quit
    // early. It would still function the same without this.

    if (newBehaviors.length == 0 && previousBehaviors.length == 0) return;
    const {
      removed,
      added
    } = this.getDiff(previousBehaviors, newBehaviors);
    this.handleDiff(removed, added);
  }

  getBehaviorNames(string) {
    if (string.trim() == '') return [];else return string.split(/\s+/);
  }

  getDiff(previousBehaviors, newBehaviors) {
    const diff = {
      removed: [],
      added: newBehaviors
    };

    for (let i = 0, l = previousBehaviors.length; i < l; i += 1) {
      const oldBehavior = previousBehaviors[i]; // if it exists in the previousBehaviors but not the newBehaviors, then
      // the node was removed.

      if (!diff.added.includes(oldBehavior)) {
        diff.removed.push(oldBehavior);
      } // otherwise the old value also exists in the set of new values, so
      // therefore it wasn't added or removed, so let's remove it so we
      // don't count it as added
      else {
          diff.added.splice(diff.added.indexOf(oldBehavior), 1);
        }
    }

    return diff;
  }

  handleDiff(removed, added) {
    for (const name of removed) {
      if (!elementBehaviors.has(name)) continue;
      const behavior = this.behaviors.get(name); // TODO fire this disconnectedCallback only if the element is in a
      // document, not if it merely has a parent (the naive easy way for
      // now).

      if (this.ownerElement.parentNode) {
        behavior.disconnectedCallback();
      } // We can't rely on checking observedAttributes here because that
      // could change after the fact, we only ever check it when we add
      // the behavior. If it had observedAttributes, then it will have an
      // observer.


      if (this.observers.has(behavior)) {
        this.destroyAttributeObserver(behavior);
      }

      this.behaviors.delete(name);
    }

    for (const name of added) {
      if (!elementBehaviors.has(name)) continue;
      const Behavior = elementBehaviors.get(name);
      const behavior = new Behavior(this.ownerElement);
      this.behaviors.set(name, behavior); // read observedAttributes first, in case anything external fires
      // logic in the getter and expects it to happen before any
      // lifecycle methods (f.e. a library like SkateJS)

      const observedAttributes = behavior.constructor.observedAttributes; // TODO fire this connectedCallback only if the element is in a
      // document, not if it merely has a parent (the naive easy way for
      // now).

      if (this.ownerElement.parentNode) {
        behavior.connectedCallback();
      }

      if (Array.isArray(observedAttributes)) {
        this.fireInitialAttributeChangedCallbacks(behavior);
        this.createAttributeObserver(behavior);
      }
    }
  }

  destroyAttributeObserver(behavior) {
    this.observers.get(behavior).disconnect();
    this.observers.delete(behavior);
  } // Behaviors observe attribute changes, implemented with MutationObserver
  //
  // We have to create one observer per behavior because otherwise
  // MutationObserver doesn't have an API for disconnecting from a single
  // element, only for disconnecting from all elements.


  createAttributeObserver(behavior) {
    const observer = new MutationObserver(records => {
      for (const record of records) {
        behavior.attributeChangedCallback(record.attributeName, record.oldValue, this.ownerElement.getAttribute(record.attributeName));
      }
    });
    observer.observe(this.ownerElement, {
      attributes: true,
      attributeOldValue: true,
      attributeFilter: behavior.constructor.observedAttributes
    });
    this.observers.set(behavior, observer);
  }

  fireInitialAttributeChangedCallbacks(behavior) {
    if (!Array.isArray(behavior.constructor.observedAttributes)) return;

    for (const attr of Array.from(this.ownerElement.attributes)) {
      if (!behavior.constructor.observedAttributes.includes(attr.name)) continue;
      if (behavior.attributeChangedCallback) behavior.attributeChangedCallback(attr.name, null, attr.value);
    }
  }

}

custom_attributes_pkg_dist_umd__WEBPACK_IMPORTED_MODULE_0___default.a.define('has', HasAttribute);

if (Element.prototype.attachShadow) {
  const _attachShadow = Element.prototype.attachShadow;

  Element.prototype.attachShadow = function (...args) {
    const root = _attachShadow.call(this, ...args);

    const attributes = new custom_attributes_pkg_dist_umd__WEBPACK_IMPORTED_MODULE_0__["CustomAttributeRegistry"](root);
    attributes.define('has', HasAttribute);
    return root;
  };
} // Leave this last line alone, it gets automatically updated when publishing a
// new version of this package.


const version = '2.1.3';

/***/ })
/******/ ]);
//# sourceMappingURL=global.js.map