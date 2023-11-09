"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([[2106],{64641:()=>{var n="$";function e(){}function t(n,t){var r=new e;if(n instanceof e)n.each((function(n,e){r.set(e,n)}));else if(Array.isArray(n)){var o,u=-1,i=n.length;if(null==t)for(;++u<i;)r.set(u,n[u]);else for(;++u<i;)r.set(t(o=n[u],u,n),o)}else if(n)for(var a in n)r.set(a,n[a]);return r}e.prototype=t.prototype={constructor:e,has:function(e){return n+e in this},get:function(e){return this[n+e]},set:function(e,t){return this[n+e]=t,this},remove:function(e){var t=n+e;return t in this&&delete this[t]},clear:function(){for(var e in this)e[0]===n&&delete this[e]},keys:function(){var e=[];for(var t in this)t[0]===n&&e.push(t.slice(1));return e},values:function(){var e=[];for(var t in this)t[0]===n&&e.push(this[t]);return e},entries:function(){var e=[];for(var t in this)t[0]===n&&e.push({key:t.slice(1),value:this[t]});return e},size:function(){var e=0;for(var t in this)t[0]===n&&++e;return e},empty:function(){for(var e in this)if(e[0]===n)return!1;return!0},each:function(e){for(var t in this)t[0]===n&&e(this[t],t.slice(1),this)}};const r=t;function o(){}var u=r.prototype;function i(n,e){var t=new o;if(n instanceof o)n.each((function(n){t.add(n)}));else if(n){var r=-1,u=n.length;if(null==e)for(;++r<u;)t.add(n[r]);else for(;++r<u;)t.add(e(n[r],r,n))}return t}o.prototype=i.prototype={constructor:o,has:u.has,add:function(e){return this[n+(e+="")]=e,this},remove:u.remove,clear:u.clear,values:u.keys,size:u.size,empty:u.empty,each:u.each};var a={value:function(){}};function s(){for(var n,e=0,t=arguments.length,r={};e<t;++e){if(!(n=arguments[e]+"")||n in r||/[\s.]/.test(n))throw new Error("illegal type: "+n);r[n]=[]}return new l(r)}function l(n){this._=n}function c(n,e){for(var t,r=0,o=n.length;r<o;++r)if((t=n[r]).name===e)return t.value}function f(n,e,t){for(var r=0,o=n.length;r<o;++r)if(n[r].name===e){n[r]=a,n=n.slice(0,r).concat(n.slice(r+1));break}return null!=t&&n.push({name:e,value:t}),n}l.prototype=s.prototype={constructor:l,on:function(n,e){var t,r,o=this._,u=(r=o,(n+"").trim().split(/^|\s+/).map((function(n){var e="",t=n.indexOf(".");if(t>=0&&(e=n.slice(t+1),n=n.slice(0,t)),n&&!r.hasOwnProperty(n))throw new Error("unknown type: "+n);return{type:n,name:e}}))),i=-1,a=u.length;if(!(arguments.length<2)){if(null!=e&&"function"!=typeof e)throw new Error("invalid callback: "+e);for(;++i<a;)if(t=(n=u[i]).type)o[t]=f(o[t],n.name,e);else if(null==e)for(t in o)o[t]=f(o[t],n.name,null);return this}for(;++i<a;)if((t=(n=u[i]).type)&&(t=c(o[t],n.name)))return t},copy:function(){var n={},e=this._;for(var t in e)n[t]=e[t].slice();return new l(n)},call:function(n,e){if((t=arguments.length-2)>0)for(var t,r,o=new Array(t),u=0;u<t;++u)o[u]=arguments[u+2];if(!this._.hasOwnProperty(n))throw new Error("unknown type: "+n);for(u=0,t=(r=this._[n]).length;u<t;++u)r[u].value.apply(e,o)},apply:function(n,e,t){if(!this._.hasOwnProperty(n))throw new Error("unknown type: "+n);for(var r=this._[n],o=0,u=r.length;o<u;++o)r[o].value.apply(e,t)}};const p=s;function h(n,e){var t,o,u,i,a=p("beforesend","progress","load","error"),s=r(),l=new XMLHttpRequest,c=null,f=null,h=0;function v(n){var e,r=l.status;if(!r&&function(n){var e=n.responseType;return e&&"text"!==e?n.response:n.responseText}(l)||r>=200&&r<300||304===r){if(u)try{e=u.call(t,l)}catch(o){return void a.call("error",t,o)}else e=l;a.call("load",t,e)}else a.call("error",t,n)}if("undefined"!=typeof XDomainRequest&&!("withCredentials"in l)&&/^(http(s)?:)?\/\//.test(n)&&(l=new XDomainRequest),"onload"in l?l.onload=l.onerror=l.ontimeout=v:l.onreadystatechange=function(n){l.readyState>3&&v(n)},l.onprogress=function(n){a.call("progress",t,n)},t={header:function(n,e){return n=(n+"").toLowerCase(),arguments.length<2?s.get(n):(null==e?s.remove(n):s.set(n,e+""),t)},mimeType:function(n){return arguments.length?(o=null==n?null:n+"",t):o},responseType:function(n){return arguments.length?(i=n,t):i},timeout:function(n){return arguments.length?(h=+n,t):h},user:function(n){return arguments.length<1?c:(c=null==n?null:n+"",t)},password:function(n){return arguments.length<1?f:(f=null==n?null:n+"",t)},response:function(n){return u=n,t},get:function(n,e){return t.send("GET",n,e)},post:function(n,e){return t.send("POST",n,e)},send:function(e,r,u){return l.open(e,n,!0,c,f),null==o||s.has("accept")||s.set("accept",o+",*/*"),l.setRequestHeader&&s.each((function(n,e){l.setRequestHeader(e,n)})),null!=o&&l.overrideMimeType&&l.overrideMimeType(o),null!=i&&(l.responseType=i),h>0&&(l.timeout=h),null==u&&"function"==typeof r&&(u=r,r=null),null!=u&&1===u.length&&(u=function(n){return function(e,t){n(null==e?t:null)}}(u)),null!=u&&t.on("error",u).on("load",(function(n){u(null,n)})),a.call("beforesend",t,l),l.send(null==r?null:r),t},abort:function(){return l.abort(),t},on:function(){var n=a.on.apply(a,arguments);return n===a?t:n}},null!=e){if("function"!=typeof e)throw new Error("invalid callback: "+e);return t.get(e)}return t}function v(n,e){return function(t,r){var o=h(t).mimeType(n).response(e);if(null!=r){if("function"!=typeof r)throw new Error("invalid callback: "+r);return o.get(r)}return o}}v("text/html",(function(n){return document.createRange().createContextualFragment(n.responseText)})),v("application/json",(function(n){return JSON.parse(n.responseText)})),v("text/plain",(function(n){return n.responseText})),v("application/xml",(function(n){var e=n.responseXML;if(!e)throw new Error("parse error");return e}));var d={},m={};function y(n){return new Function("d","return {"+n.map((function(n,e){return JSON.stringify(n)+": d["+e+'] || ""'})).join(",")+"}")}function w(n){var e=Object.create(null),t=[];return n.forEach((function(n){for(var r in n)r in e||t.push(e[r]=r)})),t}function g(n,e){var t=n+"",r=t.length;return r<e?new Array(e-r+1).join(0)+t:t}function C(n){var e,t=n.getUTCHours(),r=n.getUTCMinutes(),o=n.getUTCSeconds(),u=n.getUTCMilliseconds();return isNaN(n)?"Invalid Date":((e=n.getUTCFullYear())<0?"-"+g(-e,6):e>9999?"+"+g(e,6):g(e,4))+"-"+g(n.getUTCMonth()+1,2)+"-"+g(n.getUTCDate(),2)+(u?"T"+g(t,2)+":"+g(r,2)+":"+g(o,2)+"."+g(u,3)+"Z":o?"T"+g(t,2)+":"+g(r,2)+":"+g(o,2)+"Z":r||t?"T"+g(t,2)+":"+g(r,2)+"Z":"")}function T(n){var e=new RegExp('["'+n+"\n\r]"),t=n.charCodeAt(0);function r(n,e){var r,o=[],u=n.length,i=0,a=0,s=u<=0,l=!1;function c(){if(s)return m;if(l)return l=!1,d;var e,r,o=i;if(34===n.charCodeAt(o)){for(;i++<u&&34!==n.charCodeAt(i)||34===n.charCodeAt(++i););return(e=i)>=u?s=!0:10===(r=n.charCodeAt(i++))?l=!0:13===r&&(l=!0,10===n.charCodeAt(i)&&++i),n.slice(o+1,e-1).replace(/""/g,'"')}for(;i<u;){if(10===(r=n.charCodeAt(e=i++)))l=!0;else if(13===r)l=!0,10===n.charCodeAt(i)&&++i;else if(r!==t)continue;return n.slice(o,e)}return s=!0,n.slice(o,u)}for(10===n.charCodeAt(u-1)&&--u,13===n.charCodeAt(u-1)&&--u;(r=c())!==m;){for(var f=[];r!==d&&r!==m;)f.push(r),r=c();e&&null==(f=e(f,a++))||o.push(f)}return o}function o(e,t){return e.map((function(e){return t.map((function(n){return i(e[n])})).join(n)}))}function u(e){return e.map(i).join(n)}function i(n){return null==n?"":n instanceof Date?C(n):e.test(n+="")?'"'+n.replace(/"/g,'""')+'"':n}return{parse:function(n,e){var t,o,u=r(n,(function(n,r){if(t)return t(n,r-1);o=n,t=e?function(n,e){var t=y(n);return function(r,o){return e(t(r),o,n)}}(n,e):y(n)}));return u.columns=o||[],u},parseRows:r,format:function(e,t){return null==t&&(t=w(e)),[t.map(i).join(n)].concat(o(e,t)).join("\n")},formatBody:function(n,e){return null==e&&(e=w(n)),o(n,e).join("\n")},formatRows:function(n){return n.map(u).join("\n")},formatRow:u,formatValue:i}}var x=T(","),R=x.parse;x.parseRows,x.format,x.formatBody,x.formatRows,x.formatRow,x.formatValue;function b(n,e){return function(t,r,o){arguments.length<3&&(o=r,r=null);var u=h(t).mimeType(n);return u.row=function(n){return arguments.length?u.response(function(n,e){return function(t){return n(t.responseText,e)}}(e,r=n)):r},u.row(r),o?u.get(o):u}}b("text/csv",R);var k=T("\t"),A=k.parse;k.parseRows,k.format,k.formatBody,k.formatRows,k.formatRow,k.formatValue;b("text/tab-separated-values",A)},11151:(n,e,t)=>{t.d(e,{Z:()=>a,a:()=>i});var r=t(67294);const o={},u=r.createContext(o);function i(n){const e=r.useContext(u);return r.useMemo((function(){return"function"==typeof n?n(e):{...e,...n}}),[e,n])}function a(n){let e;return e=n.disableParentContext?"function"==typeof n.components?n.components(o):n.components||o:i(n.components),r.createElement(u.Provider,{value:e},n.children)}}}]);