"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([["19145"],{60616(e,t,n){n.d(t,{FK:()=>P,XX:()=>O,fF:()=>i,h:()=>C,q6:()=>A});var r,i,o,a,l,s,d,c,u,p,h,g,m,b,v,f={},_=[],k=/acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i,x=Array.isArray;function w(e,t){for(var n in t)e[n]=t[n];return e}function y(e){e&&e.parentNode&&e.parentNode.removeChild(e)}function C(e,t,n){var i,o,a,l={};for(a in t)"key"==a?i=t[a]:"ref"==a?o=t[a]:l[a]=t[a];if(arguments.length>2&&(l.children=arguments.length>3?r.call(arguments,2):n),"function"==typeof e&&null!=e.defaultProps)for(a in e.defaultProps)void 0===l[a]&&(l[a]=e.defaultProps[a]);return z(e,l,i,o,null)}function z(e,t,n,r,a){var l={type:e,props:t,key:n,ref:r,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:null==a?++o:a,__i:-1,__u:0};return null==a&&null!=i.vnode&&i.vnode(l),l}function P(e){return e.children}function M(e,t){this.props=e,this.context=t}function H(e,t){if(null==t)return e.__?H(e.__,e.__i+1):null;for(var n;t<e.__k.length;t++)if(null!=(n=e.__k[t])&&null!=n.__e)return n.__e;return"function"==typeof e.type?H(e):null}function T(e){(!e.__d&&(e.__d=!0)&&a.push(e)&&!S.__r++||l!=i.debounceRendering)&&((l=i.debounceRendering)||s)(S)}function S(){try{for(var e,t=1;a.length;)a.length>t&&a.sort(d),e=a.shift(),t=a.length,function(e){if(e.__P&&e.__d){var t=e.__v,n=t.__e,r=[],o=[],a=w({},t);a.__v=t.__v+1,i.vnode&&i.vnode(a),N(e.__P,a,t,e.__n,e.__P.namespaceURI,32&t.__u?[n]:null,r,null==n?H(t):n,!!(32&t.__u),o),a.__v=t.__v,a.__.__k[a.__i]=a,q(r,a,o),t.__e=t.__=null,a.__e!=n&&function e(t){if(null!=(t=t.__)&&null!=t.__c)return t.__e=t.__c.base=null,t.__k.some(function(e){if(null!=e&&null!=e.__e)return t.__e=t.__c.base=e.__e}),e(t)}(a)}}(e)}finally{a.length=S.__r=0}}function E(e,t,n,r,o,a,l,s,d,c,u){var p,h,g,m,b,v,k=r&&r.__k||_,w=t.length;for(d=function(e,t,n,r,o){var a,l,s,d,c,u=n.length,p=u,h=0;for(e.__k=Array(o),a=0;a<o;a++)null!=(l=t[a])&&"boolean"!=typeof l&&"function"!=typeof l?("string"==typeof l||"number"==typeof l||"bigint"==typeof l||l.constructor==String?l=e.__k[a]=z(null,l,null,null,null):x(l)?l=e.__k[a]=z(P,{children:l},null,null,null):void 0===l.constructor&&l.__b>0?l=e.__k[a]=z(l.type,l.props,l.key,l.ref?l.ref:null,l.__v):e.__k[a]=l,d=a+h,l.__=e,l.__b=e.__b+1,s=null,-1!=(c=l.__i=function(e,t,n,r){var i,o,a,l=e.key,s=e.type,d=t[n],c=null!=d&&0==(2&d.__u);if(null===d&&null==l||c&&l==d.key&&s==d.type)return n;if(r>+!!c){for(i=n-1,o=n+1;i>=0||o<t.length;)if(null!=(d=t[a=i>=0?i--:o++])&&0==(2&d.__u)&&l==d.key&&s==d.type)return a}return -1}(l,n,d,p))&&(p--,(s=n[c])&&(s.__u|=2)),null==s||null==s.__v?(-1==c&&(o>u?h--:o<u&&h++),"function"!=typeof l.type&&(l.__u|=4)):c!=d&&(c==d-1?h--:c==d+1?h++:(c>d?h--:h++,l.__u|=4))):e.__k[a]=null;if(p)for(a=0;a<u;a++)null!=(s=n[a])&&0==(2&s.__u)&&(s.__e==r&&(r=H(s)),function e(t,n,r){var o,a;if(i.unmount&&i.unmount(t),(o=t.ref)&&(o.current&&o.current!=t.__e||I(o,null,n)),null!=(o=t.__c)){if(o.componentWillUnmount)try{o.componentWillUnmount()}catch(e){i.__e(e,n)}o.base=o.__P=o.__n=null}if(o=t.__k)for(a=0;a<o.length;a++)o[a]&&e(o[a],n,r||"function"!=typeof t.type);r||y(t.__e),t.__c=t.__=t.__e=void 0}(s,s));return r}(n,t,k,d,w),p=0;p<w;p++)null!=(g=n.__k[p])&&(h=-1!=g.__i&&k[g.__i]||f,g.__i=p,v=N(e,g,h,o,a,l,s,d,c,u),m=g.__e,g.ref&&h.ref!=g.ref&&(h.ref&&I(h.ref,null,g),u.push(g.ref,g.__c||m,g)),null==b&&null!=m&&(b=m),4&g.__u?(d=function e(t,n,r){var i,o;if("function"==typeof t.type){for(i=t.__k,o=0;i&&o<i.length;o++)i[o]&&(i[o].__=t,n=e(i[o],n,r));return n}t.__e!=n&&(n&&t.type&&!n.parentNode&&(n=H(t)),n=r.insertBefore(t.__e,n||null));do n=n&&n.nextSibling;while(null!=n&&8==n.nodeType)return n}(g,d,e),h.__e&&(h.__e=null)):"function"==typeof g.type&&void 0!==v?d=v:m&&(d=m.nextSibling),g.__u&=-7);return n.__e=b,d}function L(e,t,n){"-"==t[0]?e.setProperty(t,null==n?"":n):e[t]=null==n?"":"number"!=typeof n||k.test(t)?n:n+"px"}function D(e,t,n,r,i){var o,a;e:if("style"==t)if("string"==typeof n)e.style.cssText=n;else{if("string"==typeof r&&(e.style.cssText=r=""),r)for(t in r)n&&t in n||L(e.style,t,"");if(n)for(t in n)r&&n[t]==r[t]||L(e.style,t,n[t])}else if("o"==t[0]&&"n"==t[1])o=t!=(t=t.replace(h,"$1")),t=(a=t.toLowerCase())in e||"onFocusOut"==t||"onFocusIn"==t?a.slice(2):t.slice(2),e.l||(e.l={}),e.l[t+o]=n,n?r?n[p]=r[p]:(n[p]=g,e.addEventListener(t,o?b:m,o)):e.removeEventListener(t,o?b:m,o);else{if("http://www.w3.org/2000/svg"==i)t=t.replace(/xlink(H|:h)/,"h").replace(/sName$/,"s");else if("width"!=t&&"height"!=t&&"href"!=t&&"list"!=t&&"form"!=t&&"tabIndex"!=t&&"download"!=t&&"rowSpan"!=t&&"colSpan"!=t&&"role"!=t&&"popover"!=t&&t in e)try{e[t]=null==n?"":n;break e}catch(e){}"function"==typeof n||(null==n||!1===n&&"-"!=t[4]?e.removeAttribute(t):e.setAttribute(t,"popover"==t&&1==n?"":n))}}function B(e){return function(t){if(this.l){var n=this.l[t.type+e];if(null==t[u])t[u]=g++;else if(t[u]<n[p])return;return n(i.event?i.event(t):t)}}}function N(e,t,n,o,a,l,s,d,c,u){var p,h,g,m,b,v,k,C,z,T,S,L,B,N,q,I,O=t.type;if(void 0!==t.constructor)return null;128&n.__u&&(c=!!(32&n.__u),l=[d=t.__e=n.__e]),(p=i.__b)&&p(t);e:if("function"==typeof O){h=s.length;try{if(z=t.props,T=O.prototype&&O.prototype.render,S=(p=O.contextType)&&o[p.__c],L=p?S?S.props.value:p.__:o,n.__c?C=(g=t.__c=n.__c).__=g.__E:(T?t.__c=g=new O(z,L):(t.__c=g=new M(z,L),g.constructor=O,g.render=Z),S&&S.sub(g),g.state||(g.state={}),g.__n=o,m=g.__d=!0,g.__h=[],g._sb=[]),T&&null==g.__s&&(g.__s=g.state),T&&null!=O.getDerivedStateFromProps&&(g.__s==g.state&&(g.__s=w({},g.__s)),w(g.__s,O.getDerivedStateFromProps(z,g.__s))),b=g.props,v=g.state,g.__v=t,m)T&&null==O.getDerivedStateFromProps&&null!=g.componentWillMount&&g.componentWillMount(),T&&null!=g.componentDidMount&&g.__h.push(g.componentDidMount);else{if(T&&null==O.getDerivedStateFromProps&&z!==b&&null!=g.componentWillReceiveProps&&g.componentWillReceiveProps(z,L),t.__v==n.__v||!g.__e&&null!=g.shouldComponentUpdate&&!1===g.shouldComponentUpdate(z,g.__s,L)){t.__v!=n.__v&&(g.props=z,g.state=g.__s,g.__d=!1),t.__e=n.__e,t.__k=n.__k,t.__k.some(function(e){e&&(e.__=t)}),_.push.apply(g.__h,g._sb),g._sb=[],g.__h.length&&s.push(g),d=H(n);break e}null!=g.componentWillUpdate&&g.componentWillUpdate(z,g.__s,L),T&&null!=g.componentDidUpdate&&g.__h.push(function(){g.componentDidUpdate(b,v,k)})}if(g.context=L,g.props=z,g.__P=e,g.__e=!1,B=i.__r,N=0,T)g.state=g.__s,g.__d=!1,B&&B(t),p=g.render(g.props,g.state,g.context),_.push.apply(g.__h,g._sb),g._sb=[];else do g.__d=!1,B&&B(t),p=g.render(g.props,g.state,g.context),g.state=g.__s;while(g.__d&&++N<25)g.state=g.__s,null!=g.getChildContext&&(o=w(w({},o),g.getChildContext())),T&&!m&&null!=g.getSnapshotBeforeUpdate&&(k=g.getSnapshotBeforeUpdate(b,v)),q=null!=p&&p.type===P&&null==p.key?function e(t){return"object"!=typeof t||null==t||t.__b>0?t:x(t)?t.map(e):void 0!==t.constructor?null:w({},t)}(p.props.children):p,d=E(e,x(q)?q:[q],t,n,o,a,l,s,d,c,u),g.base=t.__e,t.__u&=-161,g.__h.length&&s.push(g),C&&(g.__E=g.__=null)}catch(e){if(s.length=h,t.__v=null,c||null!=l){if(e.then){for(t.__u|=c?160:128;d&&8==d.nodeType&&d.nextSibling;)d=d.nextSibling;null!=l&&(l[l.indexOf(d)]=null),t.__e=d}else if(null!=l)for(I=l.length;I--;)y(l[I])}else t.__e=n.__e;null==t.__k&&(t.__k=n.__k||[]),e.then||function e(t){t&&(t.__c&&(t.__c.__e=!0),t.__k&&t.__k.some(e))}(t),i.__e(e,t,n)}}else null==l&&t.__v==n.__v?(t.__k=n.__k,t.__e=n.__e):d=t.__e=function(e,t,n,o,a,l,s,d,c){var u,p,h,g,m,b,v,_=n.props||f,k=t.props,w=t.type;if("svg"==w?a="http://www.w3.org/2000/svg":"math"==w?a="http://www.w3.org/1998/Math/MathML":a||(a="http://www.w3.org/1999/xhtml"),null!=l){for(u=0;u<l.length;u++)if((m=l[u])&&"setAttribute"in m==!!w&&(w?m.localName==w:3==m.nodeType)){e=m,l[u]=null;break}}if(null==e){if(null==w)return document.createTextNode(k);e=document.createElementNS(a,w,k.is&&k),d&&(i.__m&&i.__m(t,l),d=!1),l=null}if(null==w)_===k||d&&e.data==k||(e.data=k);else{if(l="textarea"==w&&null!=k.defaultValue?null:l&&r.call(e.childNodes),!d&&null!=l)for(_={},u=0;u<e.attributes.length;u++)_[(m=e.attributes[u]).name]=m.value;for(u in _)m=_[u],"dangerouslySetInnerHTML"==u?h=m:"children"==u||u in k||"value"==u&&"defaultValue"in k||"checked"==u&&"defaultChecked"in k||D(e,u,null,m,a);for(u in k)m=k[u],"children"==u?g=m:"dangerouslySetInnerHTML"==u?p=m:"value"==u?b=m:"checked"==u?v=m:d&&"function"!=typeof m||_[u]===m||D(e,u,m,_[u],a);if(p)d||h&&(p.__html==h.__html||p.__html==e.innerHTML)||(e.innerHTML=p.__html),t.__k=[];else if(h&&(e.innerHTML=""),E("template"==t.type?e.content:e,x(g)?g:[g],t,n,o,"foreignObject"==w?"http://www.w3.org/1999/xhtml":a,l,s,l?l[0]:n.__k&&H(n,0),d,c),null!=l)for(u=l.length;u--;)y(l[u]);d&&"textarea"!=w||(u="value","progress"==w&&null==b?e.removeAttribute("value"):null==b||b===e[u]&&("progress"!=w||b)&&("option"!=w||b==_[u])||D(e,u,b,_[u],a),u="checked",null!=v&&v!=e[u]&&D(e,u,v,_[u],a))}return e}(n.__e,t,n,o,a,l,s,c,u);return(p=i.diffed)&&p(t),128&t.__u?void 0:d}function q(e,t,n){for(var r=0;r<n.length;r++)I(n[r],n[++r],n[++r]);i.__c&&i.__c(t,e),e.some(function(t){try{e=t.__h,t.__h=[],e.some(function(e){e.call(t)})}catch(e){i.__e(e,t.__v)}})}function I(e,t,n){try{if("function"==typeof e){var r="function"==typeof e.__u;r&&e.__u(),r&&null==t||(e.__u=e(t))}else e.current=t}catch(e){i.__e(e,n)}}function Z(e,t,n){return this.constructor(e,n)}function O(e,t,n){var o,a,l,s;t==document&&(t=document.documentElement),i.__&&i.__(e,t),a=(o="function"==typeof n)?null:n&&n.__k||t.__k,l=[],s=[],N(t,e=(!o&&n||t).__k=C(P,null,[e]),a||f,f,t.namespaceURI,!o&&n?[n]:a?null:t.firstChild?r.call(t.childNodes):null,l,!o&&n?n:a?a.__e:t.firstChild,o,s),q(l,e,s),e.props.children=null}function A(e){function t(e){var n,r;return this.getChildContext||(n=new Set,(r={})[t.__c]=this,this.getChildContext=function(){return r},this.componentWillUnmount=function(){n=null},this.shouldComponentUpdate=function(e){this.props.value!=e.value&&n.forEach(function(e){e.__e=!0,T(e)})},this.sub=function(e){n.add(e);var t=e.componentWillUnmount;e.componentWillUnmount=function(){n&&n.delete(e),t&&t.call(e)}}),e.children}return t.__c="__cC"+v++,t.__=e,t.Provider=t.__l=(t.Consumer=function(e,t){return e.children(t)}).contextType=t,t}r=_.slice,i={__e:function(e,t,n,r){for(var i,o,a;t=t.__;)if((i=t.__c)&&!i.__)try{if((o=i.constructor)&&null!=o.getDerivedStateFromError&&(i.setState(o.getDerivedStateFromError(e)),a=i.__d),null!=i.componentDidCatch&&(i.componentDidCatch(e,r||{}),a=i.__d),a)return i.__E=i}catch(t){e=t}throw e}},o=0,M.prototype.setState=function(e,t){var n;n=null!=this.__s&&this.__s!=this.state?this.__s:this.__s=w({},this.state),"function"==typeof e&&(e=e(w({},n),this.props)),e&&w(n,e),null!=e&&this.__v&&(t&&this._sb.push(t),T(this))},M.prototype.forceUpdate=function(e){this.__v&&(this.__e=!0,e&&this.__h.push(e),T(this))},M.prototype.render=P,a=[],s="function"==typeof Promise?Promise.prototype.then.bind(Promise.resolve()):setTimeout,d=function(e,t){return e.__v.__b-t.__v.__b},S.__r=0,u="__d"+(c=Math.random().toString(8)),p="__a"+c,h=/(PointerCapture)$|Capture$/i,g=0,m=B(!1),b=B(!0),v=0},43078(e,t,n){n.d(t,{J0:()=>f,Kr:()=>w,NT:()=>C,Nf:()=>k,hb:()=>y,li:()=>x,vJ:()=>_});var r,i,o,a,l=n(60616),s=0,d=[],c=l.fF,u=c.__b,p=c.__r,h=c.diffed,g=c.__c,m=c.unmount,b=c.__;function v(e,t){c.__h&&c.__h(i,e,s||t),s=0;var n=i.__H||(i.__H={__:[],__h:[]});return e>=n.__.length&&n.__.push({}),n.__[e]}function f(e){return s=1,function(e,t){var n=v(r++,2);if(n.t=e,!n.__c&&(n.__=[S(void 0,t),function(e){var t=n.__N?n.__N[0]:n.__[0],r=n.t(t,e);t!==r&&(n.__N=[r,n.__[1]],n.__c.setState({}))}],n.__c=i,!i.__f)){var o=function(e,t,r){if(!n.__c.__H)return!0;var i=!1,o=n.__c.props!==e;if(n.__c.__H.__.some(function(e){if(e.__N){i=!0;var t=e.__[0];e.__=e.__N,e.__N=void 0,t!==e.__[0]&&(o=!0)}}),a){var l=a.call(this,e,t,r);return i?l||o:l}return!i||o};i.__f=!0;var a=i.shouldComponentUpdate,l=i.componentWillUpdate;i.componentWillUpdate=function(e,t,n){if(this.__e){var r=a;a=void 0,o(e,t,n),a=r}l&&l.call(this,e,t,n)},i.shouldComponentUpdate=o}return n.__N||n.__}(S,e)}function _(e,t){var n=v(r++,3);!c.__s&&T(n.__H,t)&&(n.__=e,n.u=t,i.__H.__h.push(n))}function k(e,t){var n=v(r++,4);!c.__s&&T(n.__H,t)&&(n.__=e,n.u=t,i.__h.push(n))}function x(e){return s=5,w(function(){return{current:e}},[])}function w(e,t){var n=v(r++,7);return T(n.__H,t)&&(n.__=e(),n.__H=t,n.__h=e),n.__}function y(e,t){return s=8,w(function(){return e},t)}function C(e){var t=i.context[e.__c],n=v(r++,9);return n.c=e,t?(null==n.__&&(n.__=!0,t.sub(i)),t.props.value):e.__}function z(){for(var e;e=d.shift();){var t=e.__H;if(e.__P&&t)try{t.__h.some(M),t.__h.some(H),t.__h=[]}catch(n){t.__h=[],c.__e(n,e.__v)}}}c.__b=function(e){i=null,u&&u(e)},c.__=function(e,t){e&&t.__k&&t.__k.__m&&(e.__m=t.__k.__m),b&&b(e,t)},c.__r=function(e){p&&p(e),r=0;var t=(i=e.__c).__H;t&&(o===i?(t.__h=[],i.__h=[],t.__.some(function(e){e.__N&&(e.__=e.__N),e.u=e.__N=void 0})):(t.__h.some(M),t.__h.some(H),t.__h=[],r=0)),o=i},c.diffed=function(e){h&&h(e);var t=e.__c;t&&t.__H&&(t.__H.__h.length&&(1!==d.push(t)&&a===c.requestAnimationFrame||((a=c.requestAnimationFrame)||function(e){var t,n=function(){clearTimeout(r),P&&cancelAnimationFrame(t),setTimeout(e)},r=setTimeout(n,35);P&&(t=requestAnimationFrame(n))})(z)),t.__H.__.some(function(e){e.u&&(e.__H=e.u,e.u=void 0)})),o=i=null},c.__c=function(e,t){t.some(function(e){try{e.__h.some(M),e.__h=e.__h.filter(function(e){return!e.__||H(e)})}catch(n){t.some(function(e){e.__h&&(e.__h=[])}),t=[],c.__e(n,e.__v)}}),g&&g(e,t)},c.unmount=function(e){m&&m(e);var t,n=e.__c;n&&n.__H&&(n.__H.__.some(function(e){try{M(e)}catch(e){t=e}}),n.__H=void 0,t&&c.__e(t,n.__v))};var P="function"==typeof requestAnimationFrame;function M(e){var t=i,n=e.__c;"function"==typeof n&&(e.__c=void 0,n()),i=t}function H(e){var t=i;e.__c=e.__(),i=t}function T(e,t){return!e||e.length!==t.length||t.some(function(t,n){return t!==e[n]})}function S(e,t){return"function"==typeof t?t(e):t}},81413(e,t,n){n.d(t,{FD:()=>o,FK:()=>r.FK,Y:()=>o});var r=n(60616),i=0;function o(e,t,n,o,a,l){t||(t={});var s,d,c=t;if("ref"in c)for(d in c={},t)"ref"==d?s=t[d]:c[d]=t[d];var u={type:e,props:c,key:n,ref:s,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:--i,__i:-1,__u:0,__source:a,__self:l};if("function"==typeof e&&(s=e.defaultProps))for(d in s)void 0===c[d]&&(c[d]=s[d]);return r.fF.vnode&&r.fF.vnode(u),u}},81858(e,t,n){n.d(t,{G:()=>l});var r=n(81413),i=n(43078),o=n(82717);function a({className:e,onRenderHTML:t}){let n=(0,i.li)(null);return(0,i.Nf)(()=>{let e=n.current;if(!e)return;let r=t(e);return()=>{"function"==typeof r&&r()}},[t]),(0,r.Y)("div",{ref:n,className:e})}class l extends o.Z{constructor({id:e,title:t,onRenderHTML:n,disabled:i,keepMounted:o,className:l,theme:s="inherit"}){super({id:e,title:t,theme:s,disabled:i,keepMounted:o,content:(0,r.Y)(a,{className:l,onRenderHTML:n})})}}},12923(e,t,n){n.d(t,{M:()=>d});class r{#e=new Map;#t=new Map;registerCommand(e){return this.#e.set(e.id,e),()=>{this.#e.get(e.id)===e&&this.#e.delete(e.id)}}hasCommand(e){return this.#e.has(e)}installAutomation(e,t,n){let r=n.target??globalThis,i={id:n.id??e,label:n.label??e,description:n.description,globalName:e,requestType:n.requestType,responseType:n.responseType};return r[e]=t,this.#t.set(i.id,i),()=>{this.#t.get(i.id)===i&&this.#t.delete(i.id),r[e]===t&&delete r[e]}}listAutomationSupport(){return[...this.#t.values()].map(e=>({...e}))}listCommands(e={}){let t=[];for(let n of this.#e.values()){let r=n.exposure??"user",i={id:n.id,label:n.label,description:n.description,exposure:r,acceptsArgs:!!n.argsSchema,isEnabled:!n.isEnabled||n.isEnabled()};e.exposure&&r!==e.exposure&&("all"!==r||"all"===e.exposure)||t.push(i)}return t}getCommand(e){let t=this.#e.get(e);return t?{id:t.id,label:t.label,description:t.description,exposure:t.exposure??"user",acceptsArgs:!!t.argsSchema,isEnabled:!t.isEnabled||t.isEnabled()}:null}executeCommand(e,t){let n=this.#e.get(e);if(!n)return Error(`Command not found: ${e}`);let r=t;if(n.argsSchema){let i=n.argsSchema.safeParse(t);if(!1===i.success)return Error(`Invalid arguments for command: ${e}`,{cause:i.error});r=i.data}if(n.isEnabled&&!n.isEnabled(r))return Error(`Command is disabled: ${e}`);try{return n.do(r)}catch(e){return e instanceof Error?e:Error(String(e),{cause:e})}}undoCommand(e,t){let n=this.#e.get(e);if(!n)return Error(`Command not found: ${e}`);if(!n.undo)return Error(`Command has no undo handler: ${e}`);try{return n.undo(t)}catch(e){return e instanceof Error?e:Error(String(e),{cause:e})}}async executeCommandAsync(e,t,n={}){let r=this.#e.get(e);if(!r)return Error(`Command not found: ${e}`);let i=r.exposure??"user";if(!(!n.exposure||i===n.exposure||"all"===i&&"all"!==n.exposure))return Error(`Command is not exposed as ${n.exposure}.`);let o=t;if(r.argsSchema){let n=r.argsSchema.safeParse(t);if(!1===n.success)return Error(`Invalid arguments for command: ${e}`,{cause:n.error});o=n.data}if(r.isEnabled&&!r.isEnabled(o))return Error(`Command is disabled: ${e}`);try{return await r.do(o)}catch(e){return e instanceof Error?e:Error(String(e),{cause:e})}}}let i=new r,o=("u">typeof window?globalThis.navigator:{platform:""}).platform.toUpperCase().indexOf("MAC")>=0,a=(e,t)=>{let n=!!t.commandKey,r=!!t.shiftKey,i=!!t.ctrlKey;return t.key.toLowerCase()===e.key.toLowerCase()&&e.shiftKey===r&&!e.altKey&&(o?e.metaKey===n&&e.ctrlKey===i:e.ctrlKey===(!o&&(n||i))&&!1===e.metaKey)},l={ArrowLeft:"\u2190",ArrowRight:"\u2192",ArrowUp:"\u2191",ArrowDown:"\u2193",Home:"\u2912",End:"\u2913",PageUp:"\u21DE",PageDown:"\u21DF",Backspace:"\u232B",Delete:"\u2326",Insert:"Ins",Enter:"\u23CE",Escape:"\u238B",Tab:"\u21E5"," ":"\u2420",Spacebar:"\u2420",Shift:"Shift",Control:"\u2303",Alt:"\u2325",Meta:"\u2318",CapsLock:"\u21EA",ContextMenu:"\u2263",PrintScreen:"\u2399",ScrollLock:"\u21F3",Pause:"\u23F8",NumLock:"\u21ED",MediaPlayPause:"\u23EF",MediaStop:"\u23F9",MediaTrackNext:"\u23ED",MediaTrackPrevious:"\u23EE",AudioVolumeMute:"\u{1F507}",AudioVolumeDown:"\u{1F509}",AudioVolumeUp:"\u{1F50A}"};function s(e){var t;let n,r=[];return e.commandKey&&r.push(o?"\u2318":"Ctrl"),e.ctrlKey&&r.push(o?"\u2303":"Ctrl"),e.shiftKey&&r.push("Shift"),e.key&&r.push((n=l[t=e.key])||(/^F\d{1,2}$/.test(t)?t:t.startsWith("Numpad")?t.replace("Numpad","Num "):(t.length,t.toUpperCase()))),o?r.join(""):r.join("+")}class d{static #n=new Map;shortcuts=[];eventManager;constructor(e,t){this.eventManager=e,this.shortcuts=t,d.registerShortcutKeyHTML(t)}static getKeyHTML(e){return d.#n.get(e)}getKeyHTML(e){var t,n;let r;return t=this.shortcuts,n=e,((r=t.find(e=>e.commandId===n))?s(r):void 0)??d.getKeyHTML(e)}start(){this.eventManager.on("keydown",this._handleKeyDown)}stop(){this.eventManager.off("keydown",this._handleKeyDown)}_handleKeyDown=e=>{let t=((e,t)=>{let n,r=-1;for(let i of t){if(!a(e,i))continue;let t=Number(!!i.commandKey)+Number(!!i.shiftKey)+Number(!!i.ctrlKey);t>r&&(n=i,r=t)}return n})(e.srcEvent,this.shortcuts);if(t){var n;if(t.shouldHandle&&!t.shouldHandle(e.srcEvent))return;t.preventDefault&&e.srcEvent.preventDefault?.(),(n=t).commandId?i.executeCommand(n.commandId):n.onKeyPress?.()}};static registerShortcutKeyHTML(e){for(let t of e)t.commandId&&d.#n.set(t.commandId,s(t))}}},73228(e,t,n){n.d(t,{B:()=>d,h:()=>s});let r="data-deck-gl-community-panels-styles",i=`/* Stop at nested scopes so explicit original presets retain their native states. */
@scope ([data-panel-theme-preset^="sleek-"]) to ([data-panel-theme-preset]) {
  :is(button, input, select, textarea):focus-visible {
    outline: var(--panel-focus-color) solid 2px !important;
    outline-offset: -2px;
  }
  input[type='checkbox'] {
    appearance: none;
    -webkit-appearance: none;
    position: relative;
    box-sizing: border-box;
    width: 26px !important;
    height: 14px;
    border: 1px solid var(--panel-accent-color);
    border-radius: 7px;
    background: var(--button-background);
    cursor: pointer;
    transition: background-color 120ms ease, border-color 120ms ease;
  }
  input[type='checkbox']::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 1px;
    transform: translateY(-50%);
    width: 10px;
    height: 10px;
    border-radius: 50%;
    box-sizing: border-box;
    border: 1px solid var(--button-icon-idle);
    background: transparent;
    transition: transform 120ms ease, background-color 120ms ease;
  }
  input[type='checkbox']:checked {
    background: var(--button-background);
    border-color: var(--panel-accent-color);
  }
  input[type='checkbox']:checked::before {
    transform: translate(12px, -50%);
    border-color: var(--panel-accent-color);
    background: var(--panel-accent-color);
  }
  @media (prefers-reduced-motion: reduce) {
    input[type='checkbox'], input[type='checkbox']::before { transition: none; }
  }
  @media (forced-colors: active) {
    input[type='checkbox'] { appearance: auto; -webkit-appearance: auto; }
    input[type='checkbox']::before { display: none; }
  }
  input[type='range'] {
    appearance: none;
    -webkit-appearance: none;
    height: 16px;
    background: transparent;
    cursor: pointer;
  }
  input[type='range']::-webkit-slider-runnable-track {
    height: 2px;
    background: var(--range-track-color);
    border-radius: 1px;
  }
  input[type='range']::-webkit-slider-thumb {
    appearance: none;
    -webkit-appearance: none;
    width: 14px;
    height: 14px;
    margin-top: -6px;
    border: 0;
    border-radius: 50%;
    background: var(--panel-accent-color);
  }
  input[type='range']::-moz-range-track {
    height: 2px;
    background: var(--range-track-color);
    border-radius: 1px;
  }
  input[type='range']::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border: 0;
    border-radius: 50%;
    background: var(--panel-accent-color);
  }
  button:not(:disabled):not([aria-pressed='true']):not([aria-selected='true']):not([data-panel-active='true']):hover {
    background-color: var(--panel-hover-background) !important;
  }
  :is(button, input, select, textarea):disabled {
    opacity: var(--panel-disabled-opacity);
  }
}
`,o=`.deck-panel-layout {
  position: relative;
  display: grid;
  grid-template-areas: "top top top" "left center right" "bottom bottom bottom";
  grid-template-columns: minmax(0, max-content) minmax(0, 1fr) minmax(0, max-content);
  grid-template-rows: minmax(0, max-content) minmax(0, 1fr) minmax(0, max-content);
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}
.deck-panel-layout-center { grid-area: center; position: relative; min-width: 0; min-height: 0; overflow: hidden; }
.deck-panel-layout-edge { display: flex; min-width: 0; min-height: 0; overflow: auto; }
.deck-panel-layout-edge[data-side="top"] { grid-area: top; }
.deck-panel-layout-edge[data-side="bottom"] { grid-area: bottom; }
.deck-panel-layout-edge[data-side="left"] { grid-area: left; flex-direction: column; }
.deck-panel-layout-edge[data-side="right"] { grid-area: right; flex-direction: column; }
.deck-panel-chrome {
  position: relative; pointer-events: auto; min-width: 0; min-height: 0;
  box-sizing: border-box; flex: 0 1 auto;
  color: var(--menu-text, #18181a); background: var(--menu-background, #fff);
  font: 13px system-ui, sans-serif;
}
.deck-panel-chrome[hidden] { display: none; }
.deck-panel-chrome[data-docked="true"][data-side="left"],
.deck-panel-chrome[data-docked="true"][data-side="right"] { flex: 1 1 auto; }
.deck-panel-chrome-shell { position: relative; display: flex; flex-direction: column; height: 100%; max-height: inherit; min-height: 0; }
.deck-panel-chrome-header { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 8px; flex: 0 0 auto; }
.deck-panel-chrome-header button { color: inherit; font: inherit; cursor: pointer; }
.deck-panel-chrome-header button:disabled { cursor: default; }
.deck-panel-chrome-content { overflow: auto; min-width: 0; min-height: 0; flex: 1 1 auto; padding: 8px; }
.deck-panel-chrome[data-pinnable="true"] {
  font-size: 14px;
  line-height: 1.5;
  border-radius: 12px;
  background: var(--menu-background, rgba(255, 255, 255, 0.96));
  backdrop-filter: var(--menu-backdrop-filter, unset);
  box-shadow: var(--menu-shadow, 0 18px 40px rgba(15, 23, 42, 0.16));
}
.deck-panel-chrome[data-pinnable="true"][data-docked="true"] {
  border-radius: 0;
  box-shadow: none;
}
.deck-panel-chrome[data-pinnable="true"] > .deck-panel-chrome-shell {
  box-sizing: border-box;
  border: var(--menu-border, 1px solid rgba(148, 163, 184, 0.35));
  border-radius: inherit;
  overflow: hidden;
}
.deck-panel-chrome[data-pinnable="true"] .deck-panel-chrome-header {
  padding: 14px 16px 10px;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--button-text, currentColor);
}
.deck-panel-chrome[data-pinnable="true"] .deck-panel-chrome-header button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  padding: 6px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--button-icon-idle, #616166);
  font: 500 12px/1.2 system-ui, sans-serif;
}
.deck-panel-chrome[data-pinnable="true"] .deck-panel-chrome-header button:hover:enabled {
  background: var(--menu-item-hover, rgba(0, 0, 0, 0.08));
  color: var(--button-icon-hover, #18181a);
}
.deck-panel-chrome[data-pinnable="true"] .deck-panel-chrome-header button:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}
.deck-panel-chrome[data-pinnable="true"] .deck-panel-chrome-header button:disabled { opacity: 0.45; }
.deck-panel-chrome[data-pinnable="true"] .deck-panel-chrome-content {
  padding: 0 16px 16px;
  overscroll-behavior: contain;
}
.deck-panel-chrome-content[hidden] { display: none; }
.deck-panel-chrome[data-pinnable="true"] .deck-panel-chrome-header .deck-panel-chrome-toggle {
  flex: 1 1 auto;
  justify-content: space-between;
  gap: 8px;
  padding: 0;
  color: inherit;
  font: inherit;
  text-align: left;
}
.deck-panel-chrome-header .deck-panel-chrome-hide {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  padding: 6px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--button-icon-idle, #616166);
}
.deck-panel-chrome-header .deck-panel-chrome-hide:hover,
.deck-panel-chrome-restore:hover {
  background: var(--menu-item-hover, rgba(0, 0, 0, 0.08));
  color: var(--button-icon-hover, #18181a);
}
.deck-panel-chrome-hide:focus-visible,
.deck-panel-chrome-restore:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}
.deck-panel-chrome-restore {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 3;
  pointer-events: auto;
  width: 32px;
  height: 32px;
  border: var(--menu-border, 1px solid #cbd0d6);
  border-radius: 6px;
  background: var(--menu-background, #fff);
  color: var(--menu-text, #18181a);
  box-shadow: var(--menu-shadow, 0 2px 8px rgba(15, 23, 42, 0.16));
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  cursor: pointer;
}
.deck-panel-chrome-divider { position: absolute; touch-action: none; z-index: 1; background: transparent; }
.deck-panel-chrome-divider:focus-visible { outline: 2px solid currentColor; outline-offset: -2px; }
.deck-panel-chrome[data-side="left"] .deck-panel-chrome-divider { right: 0; top: 0; bottom: 0; width: 6px; cursor: ew-resize; }
.deck-panel-chrome[data-side="right"] .deck-panel-chrome-divider { left: 0; top: 0; bottom: 0; width: 6px; cursor: ew-resize; }
.deck-panel-chrome[data-side="top"] .deck-panel-chrome-divider { bottom: 0; left: 0; right: 0; height: 6px; cursor: ns-resize; }
.deck-panel-chrome[data-side="bottom"] .deck-panel-chrome-divider { top: 0; left: 0; right: 0; height: 6px; cursor: ns-resize; }
`,a=`.deck-widget {
  margin: var(--widget-margin, 12px);
  box-sizing: border-box;
  font-size: var(--panel-font-size);
}

/* Common button container styles */
.deck-widget-button,
.deck-widget-button-group {
  background: var(--button-stroke, rgba(255, 255, 255, 0.3));
  border-radius: var(--button-corner-radius, 8px);
  box-shadow: var(--button-shadow, 0px 0px 8px 0px rgba(0, 0, 0, 0.25));

  display: flex;
  align-items: center;
  justify-content: center;
}

/* Single button */
.deck-widget-button {
  width: var(--button-size, 28px);
  height: var(--button-size, 28px);
}

/* Button group */
.deck-widget-button-group {
  width: calc(var(--button-size, 28px) - 2);
  height: calc((var(--button-size, 28px) * 2) - 1);

  flex-direction: row;
  padding: 1px;
  gap: 1px;
}
.deck-widget-button-group > .deck-widget-button {
  display: contents;
}

.deck-widget-button-group.vertical {
  display: inline-flex;
  flex-direction: column;
}

/* Common button background styles */
.deck-widget-button-group button,
.deck-widget-button button {
  width: calc(var(--button-size, 28px) - 2px);
  height: calc(var(--button-size, 28px) - 2px);

  box-sizing: border-box;
  background: var(--button-background, #fff);
  backdrop-filter: var(--button-backdrop-filter, unset);
  border: var(--button-inner-stroke, unset);
  border-radius: calc(var(--button-corner-radius, 8px) - 1px);

  pointer-events: auto;
  cursor: pointer;
  outline: none;
  padding: 0;
}

/* Border radius adjustments for grouped buttons */
.deck-widget-button-group.vertical > *:not(:last-child),
.deck-widget-button-group.vertical > *:not(:last-child) > button {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

.deck-widget-button-group.vertical > *:not(:first-child),
.deck-widget-button-group.vertical > *:not(:first-child) > button {
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}

.deck-widget-button-group.horizontal > *:not(:last-child),
.deck-widget-button-group.horizontal > *:not(:last-child) > button {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.deck-widget-button-group.horizontal > *:not(:first-child),
.deck-widget-button-group.horizontal > *:not(:first-child) > button {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

/* Icon button foreground styles */
.deck-widget button .deck-widget-icon {
  background-color: var(--button-icon-idle, #616166);
  background-position: 50%;
  background-repeat: no-repeat;
  display: block;
  height: 100%;
  width: 100%;
}

.deck-widget button .deck-widget-icon:hover {
  background-color: var(--button-icon-hover, rgb(24, 24, 26));
}

.deck-widget-button-label {
  white-space: nowrap;
}

.deck-widget-button-with-text {
  width: auto;
}

.deck-widget-button-with-text button {
  display: flex;
  width: auto;
  min-width: var(--button-size, 28px);
  height: calc(var(--button-size, 28px) - 2px);
  align-items: center;
  gap: 6px;
  padding: 0 8px;
}

.deck-widget-button-with-text button > span:first-child {
  width: auto;
  height: auto;
  flex: 0 0 auto;
}

/* Icon menu styles */
.deck-widget .deck-widget-icon-menu {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: var(--menu-gap, 4px);
  z-index: 100;
}

/* Fullscreen styles */
.deck-widget.deck-widget-fullscreen button.deck-widget-fullscreen-enter .deck-widget-icon {
  mask-image: var(
    --icon-fullscreen-enter,
    url('data:image/svg+xml,<svg fill="black" height="100%" viewBox="0 0 28 28" width="100%" xmlns="http://www.w3.org/2000/svg"><path d="M7.90474 20.0953H10.6286C10.8984 20.0953 11.1246 20.1868 11.3071 20.37C11.4897 20.5532 11.5809 20.7802 11.5809 21.051C11.5809 21.3218 11.4897 21.5476 11.3071 21.7286C11.1246 21.9095 10.8984 22 10.6286 22H6.95237C6.68254 22 6.45635 21.9087 6.2738 21.7262C6.09127 21.5436 6 21.3175 6 21.0476V17.3714C6 17.1016 6.09159 16.8754 6.27477 16.6929C6.45795 16.5103 6.68493 16.4191 6.95571 16.4191C7.2265 16.4191 7.45236 16.5103 7.63331 16.6929C7.81427 16.8754 7.90474 17.1016 7.90474 17.3714V20.0953ZM7.90474 7.90474V10.6286C7.90474 10.8984 7.81315 11.1246 7.62997 11.3071C7.44679 11.4897 7.21981 11.5809 6.94903 11.5809C6.67825 11.5809 6.45238 11.4897 6.27143 11.3071C6.09048 11.1246 6 10.8984 6 10.6286V6.95237C6 6.68254 6.09127 6.45635 6.2738 6.2738C6.45635 6.09127 6.68254 6 6.95237 6H10.6286C10.8984 6 11.1246 6.09159 11.3071 6.27477C11.4897 6.45795 11.5809 6.68493 11.5809 6.95571C11.5809 7.2265 11.4897 7.45236 11.3071 7.63331C11.1246 7.81427 10.8984 7.90474 10.6286 7.90474H7.90474ZM20.0953 20.0953V17.3714C20.0953 17.1016 20.1868 16.8754 20.37 16.6929C20.5532 16.5103 20.7802 16.4191 21.051 16.4191C21.3218 16.4191 21.5476 16.5103 21.7286 16.6929C21.9095 16.8754 22 17.1016 22 17.3714V21.0476C22 21.3175 21.9087 21.5436 21.7262 21.7262C21.5436 21.9087 21.3175 22 21.0476 22H17.3714C17.1016 22 16.8754 21.9084 16.6929 21.7252C16.5103 21.542 16.4191 21.3151 16.4191 21.0443C16.4191 20.7735 16.5103 20.5476 16.6929 20.3667C16.8754 20.1857 17.1016 20.0953 17.3714 20.0953H20.0953ZM20.0953 7.90474H17.3714C17.1016 7.90474 16.8754 7.81315 16.6929 7.62997C16.5103 7.44679 16.4191 7.21981 16.4191 6.94903C16.4191 6.67825 16.5103 6.45238 16.6929 6.27143C16.8754 6.09048 17.1016 6 17.3714 6H21.0476C21.3175 6 21.5436 6.09127 21.7262 6.2738C21.9087 6.45635 22 6.68254 22 6.95237V10.6286C22 10.8984 21.9084 11.1246 21.7252 11.3071C21.542 11.4897 21.3151 11.5809 21.0443 11.5809C20.7735 11.5809 20.5476 11.4897 20.3667 11.3071C20.1857 11.1246 20.0953 10.8984 20.0953 10.6286V7.90474Z" /></svg>')
  );
  -webkit-mask-image: var(
    --icon-fullscreen-enter,
    url('data:image/svg+xml,<svg fill="black" height="100%" viewBox="0 0 28 28" width="100%" xmlns="http://www.w3.org/2000/svg"><path d="M7.90474 20.0953H10.6286C10.8984 20.0953 11.1246 20.1868 11.3071 20.37C11.4897 20.5532 11.5809 20.7802 11.5809 21.051C11.5809 21.3218 11.4897 21.5476 11.3071 21.7286C11.1246 21.9095 10.8984 22 10.6286 22H6.95237C6.68254 22 6.45635 21.9087 6.2738 21.7262C6.09127 21.5436 6 21.3175 6 21.0476V17.3714C6 17.1016 6.09159 16.8754 6.27477 16.6929C6.45795 16.5103 6.68493 16.4191 6.95571 16.4191C7.2265 16.4191 7.45236 16.5103 7.63331 16.6929C7.81427 16.8754 7.90474 17.1016 7.90474 17.3714V20.0953ZM7.90474 7.90474V10.6286C7.90474 10.8984 7.81315 11.1246 7.62997 11.3071C7.44679 11.4897 7.21981 11.5809 6.94903 11.5809C6.67825 11.5809 6.45238 11.4897 6.27143 11.3071C6.09048 11.1246 6 10.8984 6 10.6286V6.95237C6 6.68254 6.09127 6.45635 6.2738 6.2738C6.45635 6.09127 6.68254 6 6.95237 6H10.6286C10.8984 6 11.1246 6.09159 11.3071 6.27477C11.4897 6.45795 11.5809 6.68493 11.5809 6.95571C11.5809 7.2265 11.4897 7.45236 11.3071 7.63331C11.1246 7.81427 10.8984 7.90474 10.6286 7.90474H7.90474ZM20.0953 20.0953V17.3714C20.0953 17.1016 20.1868 16.8754 20.37 16.6929C20.5532 16.5103 20.7802 16.4191 21.051 16.4191C21.3218 16.4191 21.5476 16.5103 21.7286 16.6929C21.9095 16.8754 22 17.1016 22 17.3714V21.0476C22 21.3175 21.9087 21.5436 21.7262 21.7262C21.5436 21.9087 21.3175 22 21.0476 22H17.3714C17.1016 22 16.8754 21.9084 16.6929 21.7252C16.5103 21.542 16.4191 21.3151 16.4191 21.0443C16.4191 20.7735 16.5103 20.5476 16.6929 20.3667C16.8754 20.1857 17.1016 20.0953 17.3714 20.0953H20.0953ZM20.0953 7.90474H17.3714C17.1016 7.90474 16.8754 7.81315 16.6929 7.62997C16.5103 7.44679 16.4191 7.21981 16.4191 6.94903C16.4191 6.67825 16.5103 6.45238 16.6929 6.27143C16.8754 6.09048 17.1016 6 17.3714 6H21.0476C21.3175 6 21.5436 6.09127 21.7262 6.2738C21.9087 6.45635 22 6.68254 22 6.95237V10.6286C22 10.8984 21.9084 11.1246 21.7252 11.3071C21.542 11.4897 21.3151 11.5809 21.0443 11.5809C20.7735 11.5809 20.5476 11.4897 20.3667 11.3071C20.1857 11.1246 20.0953 10.8984 20.0953 10.6286V7.90474Z" /></svg>')
  );
}

.deck-widget.deck-widget-fullscreen button.deck-widget-fullscreen-exit .deck-widget-icon {
  mask-image: var(
    --icon-fullscreen-exit,
    url('data:image/svg+xml,<svg fill="black" height="100%" viewBox="0 0 28 28" width="100%" xmlns="http://www.w3.org/2000/svg"><path d="M9.6762 18.3238H6.95237C6.68254 18.3238 6.45635 18.2322 6.2738 18.049C6.09127 17.8658 6 17.6389 6 17.3681C6 17.0973 6.09127 16.8714 6.2738 16.6905C6.45635 16.5095 6.68254 16.4191 6.95237 16.4191H10.6286C10.8984 16.4191 11.1246 16.5103 11.3071 16.6929C11.4897 16.8754 11.5809 17.1016 11.5809 17.3714V21.0476C11.5809 21.3175 11.4894 21.5436 11.3062 21.7262C11.123 21.9087 10.896 22 10.6252 22C10.3544 22 10.1286 21.9087 9.94763 21.7262C9.76668 21.5436 9.6762 21.3175 9.6762 21.0476V18.3238ZM18.3238 18.3238V21.0476C18.3238 21.3175 18.2322 21.5436 18.049 21.7262C17.8658 21.9087 17.6389 22 17.3681 22C17.0973 22 16.8714 21.9087 16.6905 21.7262C16.5095 21.5436 16.4191 21.3175 16.4191 21.0476V17.3714C16.4191 17.1016 16.5103 16.8754 16.6929 16.6929C16.8754 16.5103 17.1016 16.4191 17.3714 16.4191H21.0476C21.3175 16.4191 21.5436 16.5106 21.7262 16.6938C21.9087 16.877 22 17.104 22 17.3748C22 17.6456 21.9087 17.8714 21.7262 18.0524C21.5436 18.2333 21.3175 18.3238 21.0476 18.3238H18.3238ZM9.6762 9.6762V6.95237C9.6762 6.68254 9.76779 6.45635 9.95097 6.2738C10.1342 6.09127 10.3611 6 10.6319 6C10.9027 6 11.1286 6.09127 11.3095 6.2738C11.4905 6.45635 11.5809 6.68254 11.5809 6.95237V10.6286C11.5809 10.8984 11.4897 11.1246 11.3071 11.3071C11.1246 11.4897 10.8984 11.5809 10.6286 11.5809H6.95237C6.68254 11.5809 6.45635 11.4894 6.2738 11.3062C6.09127 11.123 6 10.896 6 10.6252C6 10.3544 6.09127 10.1286 6.2738 9.94763C6.45635 9.76668 6.68254 9.6762 6.95237 9.6762H9.6762ZM18.3238 9.6762H21.0476C21.3175 9.6762 21.5436 9.76779 21.7262 9.95097C21.9087 10.1342 22 10.3611 22 10.6319C22 10.9027 21.9087 11.1286 21.7262 11.3095C21.5436 11.4905 21.3175 11.5809 21.0476 11.5809H17.3714C17.1016 11.5809 16.8754 11.4897 16.6929 11.3071C16.5103 11.1246 16.4191 10.8984 16.4191 10.6286V6.95237C16.4191 6.68254 16.5106 6.45635 16.6938 6.2738C16.877 6.09127 17.104 6 17.3748 6C17.6456 6 17.8714 6.09127 18.0524 6.2738C18.2333 6.45635 18.3238 6.68254 18.3238 6.95237V9.6762Z" /></svg>')
  );
  -webkit-mask-image: var(
    --icon-fullscreen-exit,
    url('data:image/svg+xml,<svg fill="black" height="100%" viewBox="0 0 28 28" width="100%" xmlns="http://www.w3.org/2000/svg"><path d="M9.6762 18.3238H6.95237C6.68254 18.3238 6.45635 18.2322 6.2738 18.049C6.09127 17.8658 6 17.6389 6 17.3681C6 17.0973 6.09127 16.8714 6.2738 16.6905C6.45635 16.5095 6.68254 16.4191 6.95237 16.4191H10.6286C10.8984 16.4191 11.1246 16.5103 11.3071 16.6929C11.4897 16.8754 11.5809 17.1016 11.5809 17.3714V21.0476C11.5809 21.3175 11.4894 21.5436 11.3062 21.7262C11.123 21.9087 10.896 22 10.6252 22C10.3544 22 10.1286 21.9087 9.94763 21.7262C9.76668 21.5436 9.6762 21.3175 9.6762 21.0476V18.3238ZM18.3238 18.3238V21.0476C18.3238 21.3175 18.2322 21.5436 18.049 21.7262C17.8658 21.9087 17.6389 22 17.3681 22C17.0973 22 16.8714 21.9087 16.6905 21.7262C16.5095 21.5436 16.4191 21.3175 16.4191 21.0476V17.3714C16.4191 17.1016 16.5103 16.8754 16.6929 16.6929C16.8754 16.5103 17.1016 16.4191 17.3714 16.4191H21.0476C21.3175 16.4191 21.5436 16.5106 21.7262 16.6938C21.9087 16.877 22 17.104 22 17.3748C22 17.6456 21.9087 17.8714 21.7262 18.0524C21.5436 18.2333 21.3175 18.3238 21.0476 18.3238H18.3238ZM9.6762 9.6762V6.95237C9.6762 6.68254 9.76779 6.45635 9.95097 6.2738C10.1342 6.09127 10.3611 6 10.6319 6C10.9027 6 11.1286 6.09127 11.3095 6.2738C11.4905 6.45635 11.5809 6.68254 11.5809 6.95237V10.6286C11.5809 10.8984 11.4897 11.1246 11.3071 11.3071C11.1246 11.4897 10.8984 11.5809 10.6286 11.5809H6.95237C6.68254 11.5809 6.45635 11.4894 6.2738 11.3062C6.09127 11.123 6 10.896 6 10.6252C6 10.3544 6.09127 10.1286 6.2738 9.94763C6.45635 9.76668 6.68254 9.6762 6.95237 9.6762H9.6762ZM18.3238 9.6762H21.0476C21.3175 9.6762 21.5436 9.76779 21.7262 9.95097C21.9087 10.1342 22 10.3611 22 10.6319C22 10.9027 21.9087 11.1286 21.7262 11.3095C21.5436 11.4905 21.3175 11.5809 21.0476 11.5809H17.3714C17.1016 11.5809 16.8754 11.4897 16.6929 11.3071C16.5103 11.1246 16.4191 10.8984 16.4191 10.6286V6.95237C16.4191 6.68254 16.5106 6.45635 16.6938 6.2738C16.877 6.09127 17.104 6 17.3748 6C17.6456 6 17.8714 6.09127 18.0524 6.2738C18.2333 6.45635 18.3238 6.68254 18.3238 6.95237V9.6762Z" /></svg>')
  );
}

.deck-pseudo-fullscreen {
  height: 100% !important;
  left: 0 !important;
  position: fixed !important;
  top: 0 !important;
  width: 100% !important;
  z-index: 99999;
}

/* Zoom styles */
.deck-widget.deck-widget-zoom button.deck-widget-zoom-in .deck-widget-icon {
  mask-image: var(
    --icon-zoom-in,
    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 26 26" fill="black"><path d="M12.1029 13.8971H7.89332C7.64334 13.8971 7.43196 13.8105 7.25918 13.6373C7.08639 13.4641 7 13.2521 7 13.0014C7 12.7508 7.08639 12.5396 7.25918 12.368C7.43196 12.1963 7.64334 12.1105 7.89332 12.1105H12.1029V7.90097C12.1029 7.65161 12.1895 7.43912 12.3627 7.26348C12.5359 7.08783 12.7479 7 12.9986 7C13.2492 7 13.4604 7.08783 13.632 7.26348C13.8037 7.43912 13.8895 7.65161 13.8895 7.90097V12.1105H18.099C18.3484 12.1105 18.5609 12.1971 18.7365 12.3703C18.9122 12.5436 19 12.7555 19 13.0062C19 13.2569 18.9122 13.468 18.7365 13.6397C18.5609 13.8113 18.3484 13.8971 18.099 13.8971H13.8895V18.1067C13.8895 18.3567 13.8029 18.568 13.6297 18.7408C13.4564 18.9136 13.2445 19 12.9938 19C12.7431 19 12.532 18.9136 12.3603 18.7408C12.1887 18.568 12.1029 18.3567 12.1029 18.1067V13.8971Z"/></svg>')
  );
  -webkit-mask-image: var(
    --icon-zoom-in,
    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 26 26" fill="black"><path d="M12.1029 13.8971H7.89332C7.64334 13.8971 7.43196 13.8105 7.25918 13.6373C7.08639 13.4641 7 13.2521 7 13.0014C7 12.7508 7.08639 12.5396 7.25918 12.368C7.43196 12.1963 7.64334 12.1105 7.89332 12.1105H12.1029V7.90097C12.1029 7.65161 12.1895 7.43912 12.3627 7.26348C12.5359 7.08783 12.7479 7 12.9986 7C13.2492 7 13.4604 7.08783 13.632 7.26348C13.8037 7.43912 13.8895 7.65161 13.8895 7.90097V12.1105H18.099C18.3484 12.1105 18.5609 12.1971 18.7365 12.3703C18.9122 12.5436 19 12.7555 19 13.0062C19 13.2569 18.9122 13.468 18.7365 13.6397C18.5609 13.8113 18.3484 13.8971 18.099 13.8971H13.8895V18.1067C13.8895 18.3567 13.8029 18.568 13.6297 18.7408C13.4564 18.9136 13.2445 19 12.9938 19C12.7431 19 12.532 18.9136 12.3603 18.7408C12.1887 18.568 12.1029 18.3567 12.1029 18.1067V13.8971Z"/></svg>')
  );
}

.deck-widget.deck-widget-zoom button.deck-widget-zoom-out .deck-widget-icon {
  mask-image: var(
    --icon-zoom-out,
    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 26 26" fill="black"> wBox="0 0 26 26" fill="none"><path d="M7.89332 13.8866C7.64334 13.8866 7.43196 13.8 7.25918 13.6268C7.08639 13.4535 7 13.2416 7 12.9909C7 12.7403 7.08639 12.5291 7.25918 12.3575C7.43196 12.1858 7.64334 12.1 7.89332 12.1H18.099C18.349 12.1 18.5617 12.1866 18.737 12.3598C18.9123 12.5331 19 12.745 19 12.9957C19 13.2463 18.9123 13.4575 18.737 13.6291C18.5617 13.8008 18.349 13.8866 18.099 13.8866H7.89332Z"/></svg>')
  );
  -webkit-mask-image: var(
    --icon-zoom-out,
    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 26 26" fill="black"> wBox="0 0 26 26" fill="none"><path d="M7.89332 13.8866C7.64334 13.8866 7.43196 13.8 7.25918 13.6268C7.08639 13.4535 7 13.2416 7 12.9909C7 12.7403 7.08639 12.5291 7.25918 12.3575C7.43196 12.1858 7.64334 12.1 7.89332 12.1H18.099C18.349 12.1 18.5617 12.1866 18.737 12.3598C18.9123 12.5331 19 12.745 19 12.9957C19 13.2463 18.9123 13.4575 18.737 13.6291C18.5617 13.8008 18.349 13.8866 18.099 13.8866H7.89332Z"/></svg>')
  );
}

/* Screenshot styles */
.deck-widget.deck-widget-screenshot button.deck-widget-camera .deck-widget-icon {
  mask-image: var(
    --icon-camera,
    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 -960 960 960" fill="black"><path d="M480-260q75 0 127.5-52.5T660-440q0-75-52.5-127.5T480-620q-75 0-127.5 52.5T300-440q0 75 52.5 127.5T480-260Zm0-80q-42 0-71-29t-29-71q0-42 29-71t71-29q42 0 71 29t29 71q0 42-29 71t-71 29ZM160-120q-33 0-56.5-23.5T80-200v-480q0-33 23.5-56.5T160-760h126l74-80h240l74 80h126q33 0 56.5 23.5T880-680v480q0 33-23.5 56.5T800-120H160Zm0-80h640v-480H638l-73-80H395l-73 80H160v480Zm320-240Z"/></svg>')
  );
  -webkit-mask-image: var(
    --icon-camera,
    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 -960 960 960" fill="black"><path d="M480-260q75 0 127.5-52.5T660-440q0-75-52.5-127.5T480-620q-75 0-127.5 52.5T300-440q0 75 52.5 127.5T480-260Zm0-80q-42 0-71-29t-29-71q0-42 29-71t71-29q42 0 71 29t29 71q0 42-29 71t-71 29ZM160-120q-33 0-56.5-23.5T80-200v-480q0-33 23.5-56.5T160-760h126l74-80h240l74 80h126q33 0 56.5 23.5T880-680v480q0 33-23.5 56.5T800-120H160Zm0-80h640v-480H638l-73-80H395l-73 80H160v480Zm320-240Z"/></svg>')
  );
}

/* Theme panelContainer styles */
.deck-widget.deck-widget-theme button.deck-widget-sun .deck-widget-icon {
  mask-image: var(
    --icon-sun,
    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="black" stroke="black"><g ><circle cx="12" cy="12" r="6" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></g></svg>')
  );
}

.deck-widget.deck-widget-theme button.deck-widget-moon .deck-widget-icon {
  mask-image: var(
    --icon-moon,
    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" ><circle cx="12" cy="12" r="6" fill="black" mask="url(%23moon-mask)" /><mask id="moon-mask" viewBox="0 0 24 24" ><rect x="0" y="0" width="24" height="24" fill="white" /><circle cx="24" cy="10" r="12" fill="black"/></mask></svg>')
  );
  -webbit-mask-image: var(
    --icon-moon,
    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24"><circle x="12" cy="12" r="6" /></svg>')
  );
}

/* Reset view styles */
.deck-widget.deck-widget-reset-view button.deck-widget-reset-focus .deck-widget-icon {
  mask-image: var(
    --icon-camera,
    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="black"><path d="M480-320v-100q0-25 17.5-42.5T540-480h100v60H540v100h-60Zm60 240q-25 0-42.5-17.5T480-140v-100h60v100h100v60H540Zm280-240v-100H720v-60h100q25 0 42.5 17.5T880-420v100h-60ZM720-80v-60h100v-100h60v100q0 25-17.5 42.5T820-80H720Zm111-480h-83q-26-88-99-144t-169-56q-117 0-198.5 81.5T200-480q0 72 32.5 132t87.5 98v-110h80v240H160v-80h94q-62-50-98-122.5T120-480q0-75 28.5-140.5t77-114q48.5-48.5 114-77T480-840q129 0 226.5 79.5T831-560Z"/></svg>')
  );
  -webkit-mask-image: var(
    --icon-camera,
    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="black"><path d="M480-320v-100q0-25 17.5-42.5T540-480h100v60H540v100h-60Zm60 240q-25 0-42.5-17.5T480-140v-100h60v100h100v60H540Zm280-240v-100H720v-60h100q25 0 42.5 17.5T880-420v100h-60ZM720-80v-60h100v-100h60v100q0 25-17.5 42.5T820-80H720Zm111-480h-83q-26-88-99-144t-169-56q-117 0-198.5 81.5T200-480q0 72 32.5 132t87.5 98v-110h80v240H160v-80h94q-62-50-98-122.5T120-480q0-75 28.5-140.5t77-114q48.5-48.5 114-77T480-840q129 0 226.5 79.5T831-560Z"/></svg>')
  );
}

/* Timeline panelContainer styles */
.deck-widget.deck-widget-timeline {
  position: absolute;
  margin: var(--widget-margin, 12px);
  left: 0;
  right: 0;
  pointer-events: all;
}
.deck-widget.deck-widget-timeline[data-placement^=top-] {
  top: 0;
}
.deck-widget.deck-widget-timeline[data-placement^=bottom-] {
  bottom: 0;
}
.deck-widget.deck-widget-timeline .deck-widget-button-group {
  box-sizing: border-box;
  gap: var(--widget-margin, 12px);
  padding: var(--widget-margin, 12px);
}
.deck-widget-timeline button.deck-widget-timeline-pause .deck-widget-icon {
  mask-image: var(
    --icon-pause,
    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="black"><path d="M560-200v-560h160v560H560Zm-320 0v-560h160v560H240Z"/></svg>')
  );
  -webkit-mask-image: var(
    --icon-pause,
    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="black"><path d="M560-200v-560h160v560H560Zm-320 0v-560h160v560H240Z"/></svg>')
  );
}
.deck-widget-timeline button.deck-widget-timeline-play .deck-widget-icon {
  mask-image: var(
    --icon-play,
    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="black"><path d="M320-200v-560l440 280-440 280Z"/></svg>')
  );
  -webkit-mask-image: var(
    --icon-play,
    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="black"><path d="M320-200v-560l440 280-440 280Z"/></svg>')
  );
}
.deck-widget-timeline-label {
  position: relative;
  pointer-events: none;
  width: fit-content;
  font-size: var(--panel-font-size, 13px);
  color: var(--menu-text, rgb(24, 24, 26));
  white-space: nowrap;
}
.deck-widget-timeline-label--current {
  transform: translate(-50%, -100%);
  border-radius: var(--button-corner-radius, 8px);
  background: var(--menu-background, #fff);
  padding: 4px;
}

/* Loading styles */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.deck-widget.deck-widget-loading button.deck-widget-spinner .deck-widget-icon {
  animation: spin 1s linear infinite;
}

.deck-widget.deck-widget-loading button.deck-widget-spinner .deck-widget-icon {
  mask-image: var(
    --loading-icon,
    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" ><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>')
  );
  -webkit-mask-image: var(
    --loading-icon,
    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" ><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>')
  );
}

/* Scale styles */
.deck-widget .deck-widget-scale {
  background-color: var(--button-icon-idle, #616166);
  background-position: 50%;
  display: block;
}

/* Geocoder styles */
.deck-widget .deck-widget-geocoder {
  pointer-events: auto;
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  background: var(--button-stroke, rgba(255, 255, 255, 0.3));
  border-radius: var(--button-corner-radius, 8px);
  box-shadow: var(--button-shadow, 0px 0px 8px 0px rgba(0, 0, 0, 0.25));
  padding: 1px;
  gap: 1px;
}

.deck-widget .deck-widget-geocoder-input {
  flex: 1 1 auto;
  min-width: 200px;
  height: calc(var(--button-size, 28px) - 2px);
  margin: 0;
  padding: 0 8px;
  box-sizing: border-box;
  background: var(--button-background, #fff);
  backdrop-filter: var(--button-backdrop-filter, unset);
  color: var(--button-text, rgb(24, 24, 26));
  border: var(--button-inner-stroke, unset);
  border-radius: calc(var(--button-corner-radius, 8px) - 1px);
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: var(--panel-font-size, 13px);
}

.deck-widget .deck-widget-geocoder-input:focus {
  outline: none;
}

.deck-widget .deck-widget-geocoder-input::placeholder {
  color: var(--button-icon-idle, rgba(97, 97, 102, 1));
}

.deck-widget .deck-widget-geocoder-error {
  position: absolute;
  top: calc(100% + var(--menu-gap, 4px));
  left: 1px;
  right: 1px;
  padding: var(--panel-padding, 6px 10px);
  background: var(--button-background, #fff);
  backdrop-filter: var(--button-backdrop-filter, unset);
  border: var(--button-inner-stroke, unset);
  border-radius: var(--button-corner-radius, 8px);
  box-shadow: var(--button-shadow, 0px 0px 8px 0px rgba(0, 0, 0, 0.25));
  color: rgb(220, 80, 80);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: var(--panel-font-size, 12px);
  text-align: center;
}

/* When dropdown is not present, input should have full rounded corners */
.deck-widget .deck-widget-geocoder-input:last-child {
  border-top-right-radius: calc(var(--button-corner-radius, 8px) - 1px);
  border-bottom-right-radius: calc(var(--button-corner-radius, 8px) - 1px);
}

/* Dropdown menu styles */
.deck-widget .deck-widget-dropdown-container {
  position: static;
  display: inline-block;
}

.deck-widget .deck-widget-dropdown-button {
  width: calc(var(--button-size, 28px) - 2px);
  height: calc(var(--button-size, 28px) - 2px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  cursor: pointer;
  background: var(--button-background, #fff);
  backdrop-filter: var(--button-backdrop-filter, unset);
  border: var(--button-inner-stroke, unset);
  border-radius: calc(var(--button-corner-radius, 8px) - 1px);
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  outline: none;
}

.deck-widget .deck-widget-dropdown-icon {
  width: 12px;
  height: 12px;
  background-color: var(--button-icon-idle, rgba(97, 97, 102, 1));
  mask-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="black"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>');
  -webkit-mask-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="black"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>');
  mask-size: contain;
  -webkit-mask-size: contain;
  transition: transform 0.2s ease;
}

.deck-widget .deck-widget-dropdown-icon.open {
  transform: rotate(180deg);
}

.deck-widget .deck-widget-dropdown-button:hover .deck-widget-dropdown-icon {
  background-color: var(--button-icon-hover, rgba(24, 24, 26, 1));
}

.deck-widget .deck-widget-dropdown-menu {
  top: calc(100% + var(--menu-gap, 4px));
  left: 1px;
  right: 1px;
  margin: 0;
  padding: 4px 0;
  list-style: none;
  z-index: 1000;
  background: var(--menu-background, #fff);
  backdrop-filter: var(--menu-backdrop-filter, unset);
  border: var(--menu-border, unset);
  border-radius: var(--button-corner-radius, 8px);
  box-shadow: var(--menu-shadow, 0px 0px 8px 0px rgba(0, 0, 0, 0.25));
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: var(--panel-font-size, 13px);
}

.deck-widget .deck-widget-dropdown-item {
  padding: var(--panel-padding, 8px 12px);
  white-space: nowrap;
  overflow: hidden;
  cursor: default;
  user-select: none;
  text-overflow: ellipsis;
  color: var(--menu-text, rgb(24, 24, 26));
}

.deck-widget .deck-widget-dropdown-item:not(.disabled):hover {
  cursor: pointer;
  background: var(--menu-item-hover, rgba(128, 128, 128, 0.15));
}

.deck-widget .deck-widget-dropdown-item-icon {
  display: inline-block;
  width: 16px;
  height: 16px;
  margin-right: 8px;
  vertical-align: text-bottom;
  background-color: var(--menu-text, rgb(24, 24, 26));
  mask-size: contain;
  -webkit-mask-size: contain;
  mask-repeat: no-repeat;
  -webkit-mask-repeat: no-repeat;
}

/* Stats styles */
.deck-widget.deck-widget-stats button .text {
  color: var(--button-text, rgb(24, 24, 26));
  font-family: monospace;
  font-size: 8px;
  font-weight: 700;
}
.deck-widget-stats-container {
  border-radius: var(--button-corner-radius, 8px);
  display: inline-flex;
  flex-direction: column;
  font-size: 0.7rem;
  /* Approximately 14px */
  line-height: 1.6;
  font-family: monospace;
  background-color: var(--menu-background, #fff);
  color: var(--menu-text, rgb(24, 24, 26));
  box-shadow: var(--menu-shadow, 0px 0px 8px 0px rgba(0, 0, 0, 0.25));
}
.deck-widget-stats-header {
  color: var(--button-icon-idle, rgba(97, 97, 102, 1));
  padding-left: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
}
.deck-widget-stats-device {
  padding: 1px 6px;
  border-radius: 999px;
  font-size: 0.65rem;
  line-height: 1.2;
  background: color-mix(in srgb, currentColor 12%, transparent);
  color: inherit;
}
.deck-widget-stats-header:hover {
  color: var(--button-icon-hover, rgb(24, 24, 26));
}
.deck-widget-stats-header .deck-widget-dropdown-button {
  background: none;
  border: none;
}
.deck-widget-stats-content {
  padding: var(--panel-padding, 4px 8px 8px);
}

/* Popup styles */
.deck-widget.deck-widget-popover {
  margin: 0 !important;
}
.deck-widget-popup-content {
  border-radius: var(--button-corner-radius, 8px);
  background: var(--menu-background, #fff);
  color: var(--menu-text, rgb(24, 24, 26));
  box-shadow: var(--menu-shadow, 0px 0px 8px 0px rgba(0, 0, 0, 0.25));
  padding: var(--panel-padding, 10px);
}
.deck-widget-popup-content .deck-widget-popup-controls {
  --button-size: 20px;
}
.deck-widget-popup-content .deck-widget-popup-controls .deck-widget-button {
  box-shadow: none;
}
.deck-widget-popup-content button.deck-widget-popup-close-button .deck-widget-icon {
  mask-image: var(
    --icon-close,
    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 -120 120 120" fill="black"><path d="m32-25-7-7 28-28-28-28 7-7 28 28 28-28 7 7-28 28 28 28-7 7-28-28-28 28Z"/></svg>')
  );
  -webkit-mask-image: var(
    --icon-close,
    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 -120 120 120" fill="black"><path d="m32-25-7-7 28-28-28-28 7-7 28 28 28-28 7 7-28 28 28 28-7 7-28-28-28 28Z"/></svg>')
  );
}

/** Range input */
.deck-widget-range {
  position: relative;
  pointer-events: all;
  display: flex;
  align-items: center;
  user-select: none;
  touch-action: none;
  box-sizing: border-box;
  margin: 0;
}
.deck-widget-range__track {
  position: relative;
  cursor: pointer;
  flex: 1;
  background: var(--range-track-color, #888);
  border-radius: calc(var(--range-track-size, 16px) / 2);
}
.deck-widget-range__decorations {
  position: absolute;
}
.deck-widget-range__decoration {
  position: absolute;
}
.deck-widget-range__decoration:active {
  background-color: var(--range-decoration-active-color, gold) !important;
}
.deck-widget-range__thumb {
  position: relative;
  box-sizing: content-box;
  padding: calc(var(--range-thumb-size, 10px) / 2);
  border-radius: calc(var(--range-thumb-size, 10px) / 2);
  margin: calc(var(--range-thumb-size, 10px) * -0.5);
  background: var(--range-thumb-color, #444);
}
.deck-widget-range__button {
  cursor: pointer;
  opacity: 0.4;
  background-color: transparent;
  width: var(--range-step-button-size, 24px);
  height: var(--range-step-button-size, 24px);
  background-size: cover;
  border: none;
  padding: 0;
}
.deck-widget-range__button:hover {
  opacity: 1;
}
.deck-widget-range:not(.deck-widget-range--disabled) .deck-widget-range__button:disabled {
  pointer-events: none;
  opacity: 0.1;
}
.deck-widget-range--disabled {
  display: none;
}
.deck-widget-range--vertical {
  flex-direction: column;
  height: 100%;
  top: 0;
}
.deck-widget-range--horizontal {
  flex-direction: row;
  width: 100%;
  left: 0;
}
.deck-widget-range--vertical .deck-widget-range__track {
  width: var(--range-track-size, 16px);
  padding-top: calc(var(--range-track-size, 16px) / 2);
  padding-bottom: calc(var(--range-track-size, 16px) / 2);
  height: 100%;
  min-height: calc(var(--range-track-size, 16px) * 3);
}
.deck-widget-range--vertical .deck-widget-range__thumb {
  width: 0;
  left: 50%;
  cursor: ns-resize;
}
.deck-widget-range--vertical .deck-widget-range__decorations {
  top: calc(var(--range-track-size, 16px) / 2);
  bottom: calc(var(--range-track-size, 16px) / 2);
  left: 0;
  right: 0;
}
.deck-widget-range--vertical .deck-widget-range__button--start .deck-widget-icon {
  mask-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 -960 960 960" fill="black"><path d="M480-528 296-344l-56-56 240-240 240 240-56 56-184-184Z"/></svg>');
}
.deck-widget-range--vertical .deck-widget-range__button--end .deck-widget-icon {
  mask-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 -960 960 960" fill="black"><path d="M480-344 240-584l56-56 184 184 184-184 56 56-240 240Z"/></svg>');
}
.deck-widget-range--horizontal .deck-widget-range__track {
  height: var(--range-track-size, 16px);
  padding-left: calc(var(--range-track-size, 16px) / 2);
  padding-right: calc(var(--range-track-size, 16px) / 2);
  width: 100%;
  min-width: calc(var(--range-track-size, 16px) * 3);
}
.deck-widget-range--horizontal .deck-widget-range__thumb {
  height: 0;
  top: 50%;
  cursor: ew-resize;
}
.deck-widget-range--horizontal .deck-widget-range__decorations {
  left: calc(var(--range-track-size, 16px) / 2);
  right: calc(var(--range-track-size, 16px) / 2);
  top: 0;
  bottom: 0;
}
.deck-widget-range--horizontal .deck-widget-range__button--start .deck-widget-icon {
  mask-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 -960 960 960" fill="black"><path d="M560-240 320-480l240-240 56 56-184 184 184 184-56 56Z"/></svg>');
}
.deck-widget-range--horizontal .deck-widget-range__button--end .deck-widget-icon {
  mask-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 -960 960 960" fill="black"><path d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z"/></svg>');
}

/** Scrollbar */
.deck-widget-scrollbar .deck-widget-range {
  position: absolute;
}
.deck-widget-scrollbar .deck-widget-range--vertical {
  top: var(--range-step-button-size, 24px);
  height: calc(100% - var(--range-step-button-size, 24px) * 2);
}
.deck-widget-scrollbar[data-placement$=-left] .deck-widget-range--vertical {
  left: 0;
}
.deck-widget-scrollbar[data-placement$=-right] .deck-widget-range--vertical {
  right: 0;
}
.deck-widget-scrollbar .deck-widget-range--horizontal {
  left: var(--range-step-button-size, 24px);
  width: calc(100% - var(--range-step-button-size, 24px) * 2);
}
.deck-widget-scrollbar[data-placement^=top-] .deck-widget-range--horizontal {
  top: 0;
}
.deck-widget-scrollbar[data-placement^=bottom-] .deck-widget-range--horizontal {
  bottom: 0;
}

/** Splitter */
.deck-widget.deck-widget-splitter {
  position: absolute;
  margin: 0;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
}
.deck-widget-splitter-handle {
  position: absolute;
  background: var(--button-background, #fff);
  z-index: 10;
  pointer-events: auto;
  box-shadow: inset 1px 1px 1px var(--button-icon-idle, #616166);
}
.deck-widget-splitter-handle.active {
  box-shadow: var(--button-shadow, 0px 0px 8px 0px rgba(0, 0, 0, 0.25));
}
.deck-widget-splitter-handle:before {
  content: ' ';
  display: block;
  position: absolute;
  box-sizing: content-box;
  width: 100%;
  height: 100%;
  padding: 4px;
  margin: -4px;
}
.deck-widget-splitter-handle--horizontal {
  top: 0;
  bottom: 0;
  width: 2px;
  margin-left: -1px;
  cursor: col-resize;
}
.deck-widget-splitter-handle--vertical {
  left: 0;
  right: 0;
  height: 2px;
  margin-top: -1px;
  cursor: row-resize;
}
`;function l(e){return"selectorText"in e&&"string"==typeof e.selectorText&&e.selectorText.includes(".deck-widget")}function s(e){if(!e.querySelector("style[data-panel-theme-styles]")){let t=e.createElement("style");t.setAttribute("data-panel-theme-styles","true"),t.textContent=i,e.head.appendChild(t)}if(e.querySelector(`style[${r}]`)||function(e){for(let t of Array.from(e.styleSheets)){let e;try{e=t.cssRules}catch{e=null}if(e&&Array.from(e).some(l))return!0}return!1}(e))return;let t=e.createElement("style");t.setAttribute(r,"true"),t.textContent=a,e.head.appendChild(t)}function d(e){if(e.querySelector("style[data-panel-chrome-styles]"))return;let t=e.createElement("style");t.setAttribute("data-panel-chrome-styles","true"),t.textContent=o,e.head.append(t)}},57957(e,t,n){n.d(t,{XH:()=>d,Yl:()=>s});let r={"--panel-preset":"light","--panel-font-size":"initial","--panel-padding":"initial","--panel-control-height":"initial","--panel-control-padding":"initial","--panel-surface-radius":"initial","--panel-input-corner-radius":"initial","--panel-content-background":"initial","--panel-gap":"initial","--panel-corner-radius":"initial","--panel-round-radius":"initial","--panel-switch-padding":"initial","--menu-border-color":"initial","--panel-focus-color":"initial","--panel-accent-color":"initial","--panel-hover-background":"initial","--panel-disabled-opacity":"initial","--menu-corner-radius":"initial","--menu-weak-background":"initial","--menu-divider":"initial","--widget-margin":"12px","--button-size":"28px","--button-corner-radius":"8px","--button-background":"#fff","--button-stroke":"rgba(255, 255, 255, 0.3)","--button-inner-stroke":"unset","--button-shadow":"0px 0px 8px 0px rgba(0, 0, 0, 0.25)","--button-backdrop-filter":"unset","--button-icon-idle":"rgba(97, 97, 102, 1)","--button-icon-hover":"rgba(24, 24, 26, 1)","--button-text":"rgb(24, 24, 26, 1)","--icon-compass-north-color":"rgb(240, 92, 68)","--icon-compass-south-color":"rgb(204, 204, 204)","--menu-gap":"4px","--menu-background":"#fff","--menu-backdrop-filter":"unset","--menu-border":"unset","--menu-shadow":"0px 0px 8px 0px rgba(0, 0, 0, 0.25)","--menu-text":"rgb(24, 24, 26, 1)","--menu-item-hover":"rgba(0, 0, 0, 0.08)","--range-step-button-size":"24px","--range-track-size":"16px","--range-thumb-size":"10px","--range-track-color":"#d8d8e5","--range-thumb-color":"#616166","--range-decoration-active-color":"#f8dd50"},i={"--panel-preset":"dark","--panel-font-size":"initial","--panel-padding":"initial","--panel-control-height":"initial","--panel-control-padding":"initial","--panel-surface-radius":"initial","--panel-input-corner-radius":"initial","--panel-content-background":"initial","--panel-gap":"initial","--panel-corner-radius":"initial","--panel-round-radius":"initial","--panel-switch-padding":"initial","--menu-border-color":"initial","--panel-focus-color":"initial","--panel-accent-color":"initial","--panel-hover-background":"initial","--panel-disabled-opacity":"initial","--menu-corner-radius":"initial","--menu-weak-background":"initial","--menu-divider":"initial","--widget-margin":"12px","--button-size":"28px","--button-corner-radius":"8px","--button-background":"rgba(18, 18, 20, 1)","--button-stroke":"rgba(18, 18, 20, 0.30)","--button-inner-stroke":"unset","--button-shadow":"0px 0px 8px 0px rgba(0, 0, 0, 0.25)","--button-backdrop-filter":"unset","--button-icon-idle":"rgba(158, 157, 168, 1)","--button-icon-hover":"rgba(215, 214, 229, 1)","--button-text":"rgb(215, 214, 229, 1)","--icon-compass-north-color":"rgb(240, 92, 68)","--icon-compass-south-color":"rgb(200, 199, 209)","--menu-gap":"4px","--menu-background":"rgba(18, 18, 20, 1)","--menu-backdrop-filter":"unset","--menu-border":"unset","--menu-shadow":"0px 0px 8px 0px rgba(0, 0, 0, 0.25)","--menu-text":"rgb(215, 214, 229, 1)","--menu-item-hover":"rgba(255, 255, 255, 0.1)","--range-step-button-size":"24px","--range-track-size":"16px","--range-thumb-size":"10px","--range-track-color":"#2c2c30","--range-thumb-color":"#9e9da8","--range-decoration-active-color":"#dd7d2c"},o={"--widget-margin":"8px","--button-size":"20px","--button-corner-radius":"4px","--panel-font-size":"10px","--panel-padding":"4px 6px","--panel-control-height":"20px","--panel-control-padding":"1px 5px","--panel-gap":"3px","--panel-corner-radius":"4px","--panel-round-radius":"999px","--panel-switch-padding":"2px","--panel-surface-radius":"8px","--panel-input-corner-radius":"3px","--panel-content-background":"transparent","--menu-corner-radius":"8px","--menu-backdrop-filter":"none","--button-backdrop-filter":"none","--menu-gap":"4px","--range-step-button-size":"20px","--range-track-size":"12px","--range-thumb-size":"8px"},a={...r,...o,"--panel-preset":"sleek-light","--button-background":"rgba(241, 245, 251, 0.78)","--button-stroke":"rgba(82, 111, 157, 0.28)","--button-inner-stroke":"1px solid rgba(82, 111, 157, 0.28)","--button-shadow":"inset 0 1px 0 rgba(255, 255, 255, 0.7)","--button-text":"#24344c","--button-icon-idle":"#526985","--button-icon-hover":"#16385e","--menu-background":"rgba(248, 251, 255, 0.72)","--menu-text":"#24344c","--menu-border":"1px solid rgba(82, 111, 157, 0.28)","--menu-border-color":"rgba(82, 111, 157, 0.28)","--menu-divider":"1px solid rgba(82, 111, 157, 0.16)","--menu-weak-background":"rgba(210, 225, 245, 0.18)","--menu-item-hover":"rgba(70, 125, 196, 0.12)","--menu-shadow":"0 12px 30px rgba(15, 32, 60, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.65)","--panel-focus-color":"#2563eb","--panel-accent-color":"#167565","--panel-hover-background":"rgba(201, 221, 247, 0.76)","--panel-disabled-opacity":"0.5","--range-track-color":"rgba(111, 137, 173, 0.38)","--range-thumb-color":"#527caa","--range-decoration-active-color":"#267cba"},l={...i,...o,"--panel-preset":"sleek-dark","--button-background":"rgba(15, 23, 42, 0.72)","--button-stroke":"rgba(140, 169, 211, 0.28)","--button-inner-stroke":"initial","--button-shadow":"inset 0 1px 0 rgba(255, 255, 255, 0.04)","--button-text":"#e2e8f0","--button-icon-idle":"#94a3b8","--button-icon-hover":"#eff4fd","--menu-background":"rgba(8, 12, 20, 0.91)","--menu-text":"#e2e8f0","--menu-border":"1px solid rgba(126, 155, 205, 0.26)","--menu-border-color":"rgba(126, 155, 205, 0.26)","--menu-divider":"1px solid rgba(126, 155, 205, 0.18)","--menu-weak-background":"rgba(15, 23, 42, 0.48)","--menu-item-hover":"rgba(125, 211, 252, 0.12)","--menu-shadow":"0 12px 30px rgba(0, 0, 0, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.04)","--panel-focus-color":"#8bb4ff","--panel-accent-color":"#86cbbd","--panel-hover-background":"rgba(70, 104, 159, 0.38)","--panel-disabled-opacity":"0.5","--range-track-color":"rgba(71, 85, 105, 0.8)","--range-thumb-color":"#7dd3fc","--range-decoration-active-color":"#86cbbd"},s={light:r,dark:i,"sleek-light":a,"sleek-dark":l};function d(e){return{...s[e.base],...e.variables,"--panel-preset":e.base}}},67540(e,t,n){n.d(t,{y:()=>d});var r=n(81413),i=n(60616),o=n(73228),a=n(81191),l=n(21992);n(43078);let s=(0,i.q6)(void 0);class d extends a._{static defaultProps={...a._.defaultProps,title:void 0,widthPx:320,heightPx:240,fitContent:!1,resizable:!1};className="deck-panel-chrome";placement="top-left";resizedWidth;resizedHeight;stopDrag;eventRoot;get isPinned(){return!0}get isDocked(){return this.isPinned}get isPinnable(){return!1}get canPin(){return!!this.panelManager?.contentElement}setProps(e){!0===e.fitContent&&(this.resizedWidth=void 0,this.resizedHeight=void 0),void 0!==e.widthPx&&e.widthPx!==this.props.widthPx&&(this.resizedWidth=void 0),void 0!==e.heightPx&&e.heightPx!==this.props.heightPx&&(this.resizedHeight=void 0),super.setProps(e)}reconcileProps(e){let t={...e};t.fitContent===this.props.fitContent&&delete t.fitContent,this.setProps(t)}onRenderHTML(e){if(this.eventRoot!==e)for(let t of(this.removeEventListeners(),this.eventRoot=e,u))e.addEventListener(t,p);(0,o.B)(e.ownerDocument),e.style.margin=this.isDocked?"0":`${this.floatingOffsetPx}px`,this.panelManager?.updateDockedContainer?.(this),e.hidden=this.isPinned&&!this.canPin;let{panel:t,title:n,fitContent:a,resizable:d}=this.props,h="left"===this.side||"right"===this.side,g=this.resizedWidth??c(this.props.widthPx,320),m=this.resizedHeight??c(this.props.heightPx,240);e.dataset.side=this.side,e.dataset.pinned=String(this.isPinned),e.dataset.docked=String(this.isDocked),e.dataset.pinnable=String(this.isPinnable),e.style.width=this.isDocked&&!h?"100%":a&&void 0===this.resizedWidth?"max-content":`${g}px`,e.style.height=this.isDocked&&!h?a&&void 0===this.resizedHeight?"max-content":`${m}px`:"";let b={pinned:this.isPinned,side:this.side,canPin:this.canPin};(0,i.XX)((0,r.Y)(s.Provider,{value:b,children:(0,r.FD)("section",{className:"deck-panel-chrome-shell","aria-label":n??"Panel",children:[n||this.isPinnable||this.hasHeaderActions?(0,r.FD)("header",{className:"deck-panel-chrome-header",children:[this.renderHeaderTitle(),this.renderHeaderActions(),this.isPinnable?(0,r.Y)("button",{type:"button",disabled:!this.canPin,"aria-label":this.isPinned?"Unpin panel":"Pin panel",title:this.isPinned?"Unpin panel":"Pin panel","aria-pressed":this.isPinned,onClick:()=>this.changePinned(!this.isPinned),children:(0,r.FD)("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:this.isPinned?"currentColor":"none",stroke:"currentColor",strokeWidth:"1.75",strokeLinecap:"round",strokeLinejoin:"round","aria-hidden":"true",focusable:"false",style:{transform:this.isPinned?"none":"rotate(45deg)"},children:[(0,r.Y)("path",{d:"M9 3h6l-1 7 4 4v2H6v-2l4-4-1-7Z"}),(0,r.Y)("path",{d:"M12 16v5"})]})}):null]}):null,(0,r.Y)("div",{className:"deck-panel-chrome-content",hidden:!this.isContentOpen,children:t?(0,r.Y)(l.U,{panel:t,children:t.content}):null}),this.isDocked&&this.canPin&&d?(0,r.Y)("div",{className:"deck-panel-chrome-divider",role:"separator",tabIndex:0,"aria-label":`Resize ${n??"panel"}`,"aria-orientation":h?"vertical":"horizontal","aria-valuemin":0,"aria-valuemax":Math.floor(this.getSizeLimit()),"aria-valuenow":Math.round(h?e.getBoundingClientRect().width:e.getBoundingClientRect().height),onPointerDown:e=>this.startResize(e),onKeyDown:t=>{let n=(h?{ArrowLeft:-1,ArrowRight:1}:{ArrowUp:-1,ArrowDown:1})[t.key];if(n){t.preventDefault();let r=e.getBoundingClientRect();this.resizePanel((h?r.width:r.height)+10*n*this.getResizeSign())}}}):null]})}),e)}onRemove(){this.stopDrag?.(),this.removeEventListeners(),this.rootElement&&(0,i.XX)(null,this.rootElement)}get floatingOffsetPx(){return 0}get hasHeaderActions(){return!1}renderHeaderActions(){return null}get isContentOpen(){return!0}renderHeaderTitle(){return(0,r.Y)("span",{children:this.props.title})}changePinned(e){}removeEventListeners(){if(this.eventRoot)for(let e of u)this.eventRoot.removeEventListener(e,p);this.eventRoot=void 0}getResizeSign(){return"right"===this.side||"bottom"===this.side?-1:1}getSizeLimit(){let e=this.panelManager?.parentElement;return e?("left"===this.side||"right"===this.side?e.clientWidth:e.clientHeight)*.45:0}resizePanel(e){let t=Math.max(0,Math.min(e,this.getSizeLimit()));"left"===this.side||"right"===this.side?this.resizedWidth=t:this.resizedHeight=t,this.updateHTML()}startResize(e){if(0!==e.button||!this.rootElement)return;e.preventDefault(),this.stopDrag?.();let t=e.currentTarget,n="left"===this.side||"right"===this.side,r=this.rootElement.getBoundingClientRect(),i=n?r.width:r.height,o=n?e.clientX:e.clientY,a=this.side;t.setPointerCapture(e.pointerId);let l=e=>{this.side===a&&this.isDocked?this.resizePanel(i+((n?e.clientX:e.clientY)-o)*this.getResizeSign()):this.stopDrag?.()},s=()=>{t.removeEventListener("pointermove",l),t.removeEventListener("pointerup",s),t.removeEventListener("pointercancel",s),t.removeEventListener("lostpointercapture",s),t.hasPointerCapture(e.pointerId)&&t.releasePointerCapture(e.pointerId),this.stopDrag=void 0};this.stopDrag=s,t.addEventListener("pointermove",l),t.addEventListener("pointerup",s),t.addEventListener("pointercancel",s),t.addEventListener("lostpointercapture",s)}}function c(e,t){return Number.isFinite(e)?Math.max(0,e):t}let u=["pointerdown","pointermove","pointerup","pointercancel","mousedown","mousemove","mouseup","touchstart","touchmove","touchend","touchcancel","click","dblclick","contextmenu","wheel"];function p(e){e.stopPropagation()}},39654(e,t,n){n.d(t,{Q:()=>h});var r,i=n(81413),o=n(60616),a=n(12923),l=n(81191),s=n(21992),d=n(52073);let c="2100";function u(e){e.stopPropagation()}function p({panel:e,side:t,title:n,triggerLabel:r,triggerIcon:o,open:a,button:l,hideTrigger:c,showTitleBar:h,panelWidthPx:g,viewportMarginPx:z,dockTriggerWhenOpen:P,showBackdrop:M,onOpenChange:H}){var T;let S,E=a||!c,L=c?g:g+36+8,D="left"===t?a?"\u2039":"\u203A":a?"\u203A":"\u2039",B=a?`Close ${r}`:r;return(0,i.FD)("div",{children:[a&&M?(0,i.Y)("button",{"aria-label":`Close ${n??r}`,type:"button",style:b,onPointerDown:()=>H(!1),onPointerUp:()=>H(!1),onClick:()=>H(!1)}):null,E?(0,i.Y)("aside",{style:v(z),"aria-label":n??r,children:(0,i.FD)("div",{"data-sidebar-shell":"",style:f(t,g,L,a),onPointerDown:u,onPointerMove:u,onPointerUp:u,onMouseDown:u,onMouseMove:u,onMouseUp:u,onTouchStart:u,onTouchMove:u,onTouchEnd:u,onClick:u,onDblClick:u,onContextMenu:u,onWheel:u,children:[!c&&(0,i.Y)("div",{"data-sidebar-handle":"",style:_,children:l?(0,i.FD)("button",{type:"button","data-sidebar-handle-button":"","aria-label":B,title:B,style:k(a,t,g,z,P),onClick:()=>H(!a),children:[o?(0,i.Y)("span",{"aria-hidden":"true",style:(T=o,S=a?"var(--button-icon-hover, #18181a)":"var(--button-icon-idle, #616166)",(0,d.s)(T)?(0,d.l)(T,S):{display:"block",fontSize:"var(--panel-font-size, 12px)",fontWeight:700,lineHeight:"1",color:S}),children:(0,d.s)(o)?null:o}):null,(0,i.Y)("span",{"aria-hidden":"true",style:{display:"block",fontSize:"var(--panel-font-size, 22px)",fontWeight:700,lineHeight:"1",transform:"translateY(-1px)",color:a?"var(--button-icon-hover, #18181a)":"var(--button-icon-idle, #616166)",transition:"transform 320ms cubic-bezier(0.22, 1, 0.36, 1)"},children:D})]}):(0,i.Y)("button",{type:"button","aria-label":B,style:m,onPointerUp:()=>H(!a),children:r})}),(0,i.FD)("div",{style:x(t,g,a),role:"dialog","aria-hidden":a?"false":"true",children:[n&&h?(0,i.FD)("header",{style:w,children:[(0,i.Y)("span",{children:n}),(0,i.Y)("button",{type:"button","aria-label":"Close",style:y,onPointerDown:u,onClick:()=>H(!1),children:"\xd7"})]}):null,(0,i.Y)("div",{style:C,children:e?(0,i.Y)(s.U,{panel:e,children:e.content}):null})]})]})}):null]})}class h extends l._{static defaultProps={...l._.defaultProps,id:"sidebar-panel-container",panel:void 0,side:"right",widthPx:360,placement:"top-right",title:void 0,defaultOpen:!0,open:void 0,onOpenChange:void 0,hideTrigger:!1,triggerLabel:"Open sidebar",triggerIcon:void 0,showTitleBar:!0,button:!1,openShortcuts:[],shortcuts:[],viewportMarginPx:12,dockTriggerWhenOpen:!1,showBackdrop:!1};className="deck-widget-sidebar";placement=r.defaultProps.placement;side=r.defaultProps.side;widthPx=r.defaultProps.widthPx;title=r.defaultProps.title;triggerLabel=r.defaultProps.triggerLabel;triggerIcon=r.defaultProps.triggerIcon;showTitleBar=r.defaultProps.showTitleBar;hideTrigger=r.defaultProps.hideTrigger;button=r.defaultProps.button;viewportMarginPx=r.defaultProps.viewportMarginPx;dockTriggerWhenOpen=r.defaultProps.dockTriggerWhenOpen;showBackdrop=r.defaultProps.showBackdrop;isOpen=!1;#r=!1;#i=r.defaultProps.panel;#o=!1;#a=void 0;#l=null;#s=!1;#d=null;#c=r.defaultProps.openShortcuts;#u=r.defaultProps.shortcuts;constructor(e={}){super({...r.defaultProps,...e}),this.setProps(this.props)}setProps(e){let t;void 0!==e.placement&&(this.placement=e.placement),"title"in e&&(this.title=e.title),void 0!==e.side&&(this.side=e.side),void 0!==e.widthPx&&(this.widthPx=Number.isFinite(t=Math.max(220,Math.floor(e.widthPx)))?t:360),void 0!==e.triggerLabel&&(this.triggerLabel=e.triggerLabel),void 0!==e.triggerIcon&&(this.triggerIcon=e.triggerIcon),void 0!==e.showTitleBar&&(this.showTitleBar=e.showTitleBar),void 0!==e.hideTrigger&&(this.hideTrigger=e.hideTrigger),void 0!==e.button&&(this.button=e.button),void 0!==e.viewportMarginPx&&(this.viewportMarginPx=Math.max(0,Math.floor(e.viewportMarginPx))),void 0!==e.dockTriggerWhenOpen&&(this.dockTriggerWhenOpen=e.dockTriggerWhenOpen),void 0!==e.showBackdrop&&(this.showBackdrop=e.showBackdrop),"panel"in e&&(this.#i=e.panel),void 0!==e.onOpenChange&&(this.#a=e.onOpenChange),void 0!==e.openShortcuts&&(this.#c=e.openShortcuts,this.#p()),void 0!==e.shortcuts&&(this.#u=e.shortcuts,this.#p()),this.#h(e),this.#g(),super.setProps(e)}onAdd(e){this.#p()}onRemove(){this.#m(),this.#d&&(this.#d.stop(),this.#d=null),this.#l&&((0,o.XX)(null,this.#l),this.#l=null)}onRenderHTML(e){var t;let n,r;this.#l!==e&&(n=(t=e).parentElement,r=n?.parentElement,g(n)&&g(r)&&t.parentElement!==r&&r.appendChild(t)),this.#l=e,e.style.position="absolute",e.style.top="var(--widget-margin, 12px)",e.style.bottom="var(--widget-margin, 12px)",e.style.left="left"===this.side?"-1px":"var(--widget-margin, 12px)",e.style.right="right"===this.side?"-1px":"var(--widget-margin, 12px)",e.style.width="auto",e.style.height="auto",e.style.margin="0",e.style.overflow="hidden",e.style.pointerEvents="none",e.style.zIndex=this.isOpen?c:"35",this.#g()}#b=e=>{var t;let n,r;this.#o||(this.isOpen=e),this.#a?.(e),this.#g(),!e&&(t=this.deck,(r=(n=t?.canvas)instanceof HTMLElement?n:null)&&(r.tabIndex<0&&(r.tabIndex=0),queueMicrotask(()=>{r.isConnected&&r.focus({preventScroll:!0})})))};#v=()=>{this.#b(!0)};#h(e){if(this.#o=void 0!==e.open,void 0!==e.open){this.isOpen=e.open,this.#r=!0;return}this.#r||void 0===e.defaultOpen||(this.isOpen=e.defaultOpen,this.#r=!0)}#f=e=>{this.isOpen&&"Escape"===e.key&&(e.preventDefault(),this.#b(!1))};#_(){if(this.isOpen){this.#s||(document.addEventListener("keydown",this.#f),this.#s=!0);return}this.#m()}#m(){this.#s&&(document.removeEventListener("keydown",this.#f),this.#s=!1)}#p(){var e;this.#d&&(this.#d.stop(),this.#d=null);let t=(e=this.deck,e?.eventManager??null);t&&(0!==this.#c.length||0!==this.#u.length)&&(this.#d=new a.M(t,[...this.#c.map(e=>({...e,onKeyPress:this.#v})),...this.#u]),this.#d.start())}#g=()=>{this.#l&&(this.#_(),this.#l.style.zIndex=this.isOpen?c:"35",(0,o.XX)((0,i.Y)(p,{panel:this.#i,side:this.side,title:this.title,triggerLabel:this.triggerLabel,triggerIcon:this.triggerIcon,open:this.isOpen,button:this.button,hideTrigger:this.hideTrigger,showTitleBar:this.showTitleBar,panelWidthPx:this.widthPx,viewportMarginPx:this.viewportMarginPx,dockTriggerWhenOpen:this.dockTriggerWhenOpen,showBackdrop:this.showBackdrop,onOpenChange:this.#b}),this.#l))}}function g(e){return!!(e&&1===e.nodeType)}r=h;let m={border:"1px solid var(--menu-border-color, var(--menu-border, rgba(148, 163, 184, 0.35)))",borderRadius:"var(--panel-corner-radius, 6px)",background:"var(--menu-background, #fff)",backdropFilter:"var(--menu-backdrop-filter, unset)",WebkitBackdropFilter:"var(--menu-backdrop-filter, unset)",color:"var(--button-text, rgb(24, 24, 26))",fontSize:"var(--panel-font-size, 12px)",lineHeight:"1.1",padding:"var(--panel-padding, 8px 10px)",cursor:"pointer"},b={position:"fixed",inset:"0",backgroundColor:"rgba(17, 24, 39, 0.18)",border:"none",padding:"0",margin:"0",zIndex:2101,pointerEvents:"auto"},v=e=>({position:"absolute",inset:`${e}px`,pointerEvents:"none",zIndex:2102}),f=(e,t,n,r)=>({position:"absolute",top:"0",bottom:"0",[e]:"0",width:`${n}px`,display:"flex",flexDirection:"left"===e?"row-reverse":"row",alignItems:"flex-start",pointerEvents:"auto",transform:r?"translateX(0px)":`translateX(${"left"===e?-t:t}px)`,transition:"transform 320ms cubic-bezier(0.22, 1, 0.36, 1)",willChange:"transform",gap:"8px"}),_={width:"36px",display:"flex",alignItems:"flex-start",justifyContent:"center",pointerEvents:"auto"},k=(e,t,n,r,i)=>({width:"36px",minWidth:"36px",height:"40px",border:"var(--button-inner-stroke, 1px solid rgba(148, 163, 184, 0.35))",borderRadius:"var(--panel-corner-radius, 2px)",background:"var(--button-background, #fff)",backdropFilter:"var(--button-backdrop-filter, unset)",color:"var(--button-text, rgb(24, 24, 26))",boxShadow:"var(--button-shadow, 0px 0px 8px 0px rgba(0, 0, 0, 0.25))",display:"flex",alignItems:"center",justifyContent:"center",gap:"var(--panel-gap, 2px)",cursor:"pointer",pointerEvents:"auto",padding:"0",transform:i?function(e,t,n,r){if(!e)return"translateX(0)";let i=`calc(min(calc(100vw - ${2*r}px), ${n}px) + 8px)`;return"left"===t?`translateX(${i})`:`translateX(calc(-1 * ${i}))`}(e,t,n,r):"translateX(0)",transition:"transform 320ms cubic-bezier(0.22, 1, 0.36, 1)"}),x=(e,t,n)=>({pointerEvents:"auto",width:`${t}px`,maxWidth:`min(84vw, ${t}px)`,minWidth:`${Math.min(t,260)}px`,height:"100%",borderLeft:"right"===e?"1px solid var(--menu-border-color, var(--menu-border, rgba(148, 163, 184, 0.35)))":void 0,borderRight:"left"===e?"1px solid var(--menu-border-color, var(--menu-border, rgba(148, 163, 184, 0.35)))":void 0,background:"var(--menu-background, #fff)",backdropFilter:"var(--menu-backdrop-filter, unset)",WebkitBackdropFilter:"var(--menu-backdrop-filter, unset)",color:"var(--menu-text, rgb(24, 24, 26))",boxShadow:"var(--menu-shadow, -8px 0 25px rgba(0, 0, 0, 0.22))",display:"flex",flexDirection:"column",opacity:n?1:.98}),w={display:"flex",alignItems:"center",justifyContent:"space-between",gap:"var(--panel-gap, 10px)",padding:"var(--panel-padding, 10px 12px)",borderBottom:"var(--menu-divider, var(--menu-border, 1px solid rgba(148, 163, 184, 0.25)))",background:"var(--menu-weak-background, var(--button-background, var(--menu-background, #fff)))",color:"var(--menu-text, rgb(24, 24, 26))",fontSize:"var(--panel-font-size, 13px)",fontWeight:700},y={width:"24px",height:"24px",borderRadius:"var(--panel-round-radius, 999px)",border:"var(--menu-inner-border, 1px solid rgba(148, 163, 184, 0.35))",backgroundColor:"transparent",color:"var(--button-text, rgb(24, 24, 26))",cursor:"pointer"},C={flex:1,overflow:"auto",padding:"var(--panel-padding, 10px)"}},52073(e,t,n){function r(e){return e.startsWith("data:")||e.startsWith("http:")||e.startsWith("https:")}function i(e,t){let n=`url(${JSON.stringify(e)})`;return{display:"block",width:"16px",height:"16px",backgroundColor:t,maskImage:n,WebkitMaskImage:n,maskPosition:"center",WebkitMaskPosition:"center",maskRepeat:"no-repeat",WebkitMaskRepeat:"no-repeat",maskSize:"contain",WebkitMaskSize:"contain"}}n.d(t,{l:()=>i,s:()=>r})},77631(e,t,n){n.d(t,{g:()=>r});class r{static defaultProps={id:"panel-component",style:{},className:"",_container:null};id;props;viewId=null;panelManager;deck;rootElement;get _container(){return this.props._container}constructor(e){this.props={...this.constructor.defaultProps,...e},this.id=this.props.id}setProps(e){let t=this.props,n={...t,...e},r=this.rootElement;r&&t.className!==n.className&&(t.className&&r.classList.remove(t.className),n.className&&r.classList.add(n.className)),r&&!function(e,t){if(e===t)return!0;let n=Object.keys(e??{}),r=Object.keys(t??{});return n.length===r.length&&n.every(n=>e?.[n]===t?.[n])}(t.style,n.style)&&(function(e,t){if(t)for(let n of Object.keys(t))e.style.removeProperty(o(n))}(r,t.style),i(r,n.style)),this.props=n,this.id=n.id,this.updateHTML()}updateHTML(){this.rootElement&&this.onRenderHTML(this.rootElement)}onCreateRootElement(){let e=document.createElement("div");for(let t of["deck-widget",this.className,this.props.className])t&&e.classList.add(t);return i(e,this.props.style),e}_onAdd(e){this.deck=e.deck,this.viewId=e.viewId;let t=this.onAdd(e);return t?(this.rootElement=t,t):(this.rootElement=this.onCreateRootElement(),this.rootElement)}onAdd(e){}onRemove(){}onViewportChange(e){}onRedraw(e){}onHover(e,t){}onClick(e,t){}onDrag(e,t){}onDragStart(e,t){}onDragEnd(e,t){}}function i(e,t){if(t)for(let[n,r]of Object.entries(t))null!=r&&e.style.setProperty(o(n),String(r))}function o(e){return e.replace(/[A-Z]/g,e=>`-${e.toLowerCase()}`)}},81191(e,t,n){n.d(t,{_:()=>i});var r=n(77631);class i extends r.g{static defaultProps={...r.g.defaultProps,panel:void 0,placement:"top-left"}}},21992(e,t,n){n.d(t,{U:()=>c,n:()=>d});var r=n(81413),i=n(60616),o=n(43078),a=n(57957),l=n(73228);let s=(0,i.q6)(void 0);function d(){return u((0,o.NT)(s)??"light")}function c({panel:e,children:t}){var n,i;let d=(0,o.NT)(s),p=(0,o.li)(null),[h,g]=(0,o.J0)(!1),[m,b]=(0,o.J0)("light"),v=function(e,t){if("object"==typeof t)return t.base;if(t&&"inherit"!==t&&"invert"!==t)return t;if("invert"===t){let t="dark"===u(e)?"light":"dark";return e.startsWith("sleek-")?`sleek-${t}`:t}return e}(d??m,e.theme);return(0,o.Nf)(()=>{if(p.current&&(0,l.h)(p.current.ownerDocument),!d){let e=p.current;if(!e)return;let t=e.parentElement instanceof HTMLElement?e.parentElement:e,n=()=>{let e=t.ownerDocument.defaultView?.getComputedStyle(t).getPropertyValue("--panel-preset").trim();g(!!(e&&Object.hasOwn(a.Yl,e)));let n=function(e){let t=e.ownerDocument.defaultView;if(!t)return"light";let n=t.getComputedStyle(e),r=n.getPropertyValue("--panel-preset").trim();if(Object.hasOwn(a.Yl,r))return r;let i=function(e){if(!e)return null;if(e.startsWith("#")){let t=e.slice(1);return 3===t.length?[parseInt(t[0]+t[0],16),parseInt(t[1]+t[1],16),parseInt(t[2]+t[2],16)]:t.length>=6?[parseInt(t.slice(0,2),16),parseInt(t.slice(2,4),16),parseInt(t.slice(4,6),16)]:null}let t=e.match(/[\d.]+/g);return!t||t.length<3?null:[Number(t[0]),Number(t[1]),Number(t[2])]}(n.getPropertyValue("--menu-background").trim());return i&&.5>function([e,t,n]){return(.2126*e+.7152*t+.0722*n)/255}(i)?"dark":"light"}(t);b(e=>e===n?e:n)};n();let r=new MutationObserver(()=>{n()});for(let e of function(e){let t=[],n=e,r=e.ownerDocument.documentElement;for(;n&&(t.push(n),n!==r);)n=n.parentElement;return t}(t))r.observe(e,{attributes:!0,attributeFilter:["style","class"]});return()=>{r.disconnect()}}},[d]),(0,r.Y)(s.Provider,{value:v,children:(0,r.Y)("div",{ref:p,"data-panel-theme-mode":u(v),"data-panel-theme-preset":v,style:(!e.theme||"inherit"===e.theme)&&(d||h)?void 0:(n=v,{..."object"==typeof(i=e.theme)?(0,a.XH)(i):a.Yl[n]}),children:t})})}function u(e){return"dark"===e||"sleek-dark"===e?"dark":"light"}},82717(e,t,n){n.d(t,{Z:()=>a});var r=n(60616),i=n(77631),o=n(21992);class a extends i.g{static defaultProps={...i.g.defaultProps,id:"panel",title:"Panel",content:null,theme:"inherit",disabled:!1,keepMounted:!1};placement="top-left";className="deck-widget-panel";title;content;theme;disabled;keepMounted;constructor(e){super(e),this.title=this.props.title,this.content=this.props.content,this.theme=this.props.theme,this.disabled=this.props.disabled,this.keepMounted=this.props.keepMounted}setProps(e){let t={...this.props,...e};this.title=t.title,this.content=t.content,this.theme=t.theme,this.disabled=t.disabled,this.keepMounted=t.keepMounted,super.setProps(e)}onRenderHTML(e){(0,r.XX)((0,r.h)(o.U,{panel:this},this.content),e)}onRemove(){this.rootElement&&(0,r.XX)(null,this.rootElement)}}}}]);