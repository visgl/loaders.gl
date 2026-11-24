"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([["43014"],{84005(e,i,t){t.r(i),t.d(i,{default:()=>l});var a=t(34629),s=t(39831),r=t(85251);t(539),t(9272),t(98849);var d=t(29559),n=t(10659);let u=class extends n.default{initialize(){this.addHandles([(0,r.watch)(()=>this.view.scale,()=>this._update(),r.initial)],"constructor")}isUpdating(){let e=this.layer.sublayers.some(e=>null!=e.renderer),i=this._commandsQueue.updateTracking.updating,t=null!=this._updatingRequiredPromise,a=!this._workerProxy,r=this.dataUpdating,d=e&&(i||t||a||r);return(0,s.A)("esri-2d-log-updating")&&console.log(`Updating FLV2D: ${d}
  -> hasRenderer ${e}
  -> hasPendingCommand ${i}
  -> updatingRequiredFields ${t}
  -> updatingProxy ${a}
  -> updatingPipeline ${r}
`),d}},l=u=(0,a.__decorate)([(0,d.$)("esri.views.2d.layers.SubtypeGroupLayerView2D")],u)}}]);