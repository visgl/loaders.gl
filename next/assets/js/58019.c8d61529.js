"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([["58019"],{14254(e,t,i){let r,n,a,s,o,l,c,f;i.d(t,{A:()=>id});var u,p,h,m,d=i(66260),g=i(84175),b=i(46487),v=i(19754),S=i(60608),_=i(7914),x=i(68996),M=i(9515),R=i(49895),T=i(22458);function C(e,t,i){let r=t[0],n=t[1],a=t[2],s=t[3],o=t[4],l=t[5],c=t[6],f=t[7],u=t[8],p=t[9],h=t[10],m=t[11],d=t[12],g=t[13],b=t[14],v=t[15],S=i[0],_=i[1],x=i[2],M=i[3];return e[0]=S*r+_*o+x*u+M*d,e[1]=S*n+_*l+x*p+M*g,e[2]=S*a+_*c+x*h+M*b,e[3]=S*s+_*f+x*m+M*v,S=i[4],_=i[5],x=i[6],M=i[7],e[4]=S*r+_*o+x*u+M*d,e[5]=S*n+_*l+x*p+M*g,e[6]=S*a+_*c+x*h+M*b,e[7]=S*s+_*f+x*m+M*v,S=i[8],_=i[9],x=i[10],M=i[11],e[8]=S*r+_*o+x*u+M*d,e[9]=S*n+_*l+x*p+M*g,e[10]=S*a+_*c+x*h+M*b,e[11]=S*s+_*f+x*m+M*v,S=i[12],_=i[13],x=i[14],M=i[15],e[12]=S*r+_*o+x*u+M*d,e[13]=S*n+_*l+x*p+M*g,e[14]=S*a+_*c+x*h+M*b,e[15]=S*s+_*f+x*m+M*v,e}let I=function(e,t,i,r,n){let a=1/Math.tan(t/2);if(e[0]=a/i,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=a,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[11]=-1,e[12]=0,e[13]=0,e[15]=0,null!=n&&n!==1/0){let t=1/(r-n);e[10]=(n+r)*t,e[14]=2*n*r*t}else e[10]=-1,e[14]=-2*r;return e},y=function(e,t,i,r,n,a,s){let o=1/(t-i),l=1/(r-n),c=1/(a-s);return e[0]=-2*o,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=-2*l,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[10]=2*c,e[11]=0,e[12]=(t+i)*o,e[13]=(n+r)*l,e[14]=(s+a)*c,e[15]=1,e};function A(e){if(16!==e.length||Array.from(e).some(e=>!Number.isFinite(e))||0!==e[3]||0!==e[7]||0!==e[11]||1!==e[15])throw RangeError("Expected a finite affine matrix");let t=[Math.hypot(e[0],e[1],e[2]),Math.hypot(e[4],e[5],e[6]),Math.hypot(e[8],e[9],e[10])];if(t.some(e=>0===e||!Number.isFinite(e)))throw RangeError("Singular transform");let i=Array.from({length:9},(i,r)=>e[4*Math.floor(r/3)+r%3]/t[Math.floor(r/3)]);for(let[e,t]of[[0,3],[0,6],[3,6]])if(Math.abs(i[e]*i[t]+i[e+1]*i[t+1]+i[e+2]*i[t+2])>1e-7)throw RangeError("Sheared transforms do not have a TRS decomposition");if(i[0]*(i[4]*i[8]-i[5]*i[7])-i[3]*(i[1]*i[8]-i[2]*i[7])+i[6]*(i[1]*i[5]-i[2]*i[4])<0){t[0]=-t[0];for(let e=0;e<3;e++)i[e]=-i[e]}return{rotation:i,scale:t,translation:[e[12],e[13],e[14]]}}var E=i(1548),N=i(31838),L=i(10207),P=i(75592);(u=h||(h={}))[u.COL0ROW0=0]="COL0ROW0",u[u.COL0ROW1=1]="COL0ROW1",u[u.COL0ROW2=2]="COL0ROW2",u[u.COL0ROW3=3]="COL0ROW3",u[u.COL1ROW0=4]="COL1ROW0",u[u.COL1ROW1=5]="COL1ROW1",u[u.COL1ROW2=6]="COL1ROW2",u[u.COL1ROW3=7]="COL1ROW3",u[u.COL2ROW0=8]="COL2ROW0",u[u.COL2ROW1=9]="COL2ROW1",u[u.COL2ROW2=10]="COL2ROW2",u[u.COL2ROW3=11]="COL2ROW3",u[u.COL3ROW0=12]="COL3ROW0",u[u.COL3ROW1=13]="COL3ROW1",u[u.COL3ROW2=14]="COL3ROW2",u[u.COL3ROW3=15]="COL3ROW3";let O=45*Math.PI/180,w=Object.freeze([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);class U extends R.u{static get IDENTITY(){return n||Object.freeze(n=new U),n}static get ZERO(){return r||Object.freeze(r=new U([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0])),r}get ELEMENTS(){return 16}get RANK(){return 4}get INDICES(){return h}constructor(e){super(-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0),1==arguments.length&&Array.isArray(e)?this.copy(e):this.identity()}copy(e){return this[0]=e[0],this[1]=e[1],this[2]=e[2],this[3]=e[3],this[4]=e[4],this[5]=e[5],this[6]=e[6],this[7]=e[7],this[8]=e[8],this[9]=e[9],this[10]=e[10],this[11]=e[11],this[12]=e[12],this[13]=e[13],this[14]=e[14],this[15]=e[15],this.check()}set(e,t,i,r,n,a,s,o,l,c,f,u,p,h,m,d){return this[0]=e,this[1]=t,this[2]=i,this[3]=r,this[4]=n,this[5]=a,this[6]=s,this[7]=o,this[8]=l,this[9]=c,this[10]=f,this[11]=u,this[12]=p,this[13]=h,this[14]=m,this[15]=d,this.check()}setRowMajor(e,t,i,r,n,a,s,o,l,c,f,u,p,h,m,d){return this[0]=e,this[1]=n,this[2]=l,this[3]=p,this[4]=t,this[5]=a,this[6]=c,this[7]=h,this[8]=i,this[9]=s,this[10]=f,this[11]=m,this[12]=r,this[13]=o,this[14]=u,this[15]=d,this.check()}toRowMajor(e){return e[0]=this[0],e[1]=this[4],e[2]=this[8],e[3]=this[12],e[4]=this[1],e[5]=this[5],e[6]=this[9],e[7]=this[13],e[8]=this[2],e[9]=this[6],e[10]=this[10],e[11]=this[14],e[12]=this[3],e[13]=this[7],e[14]=this[11],e[15]=this[15],e}identity(){return this.copy(w)}fromObject(e){return this.check()}fromQuaternion(e){let t,i,r,n,a,s,o,l,c,f,u,p,h,m,d,g;return t=e[0],i=e[1],r=e[2],n=e[3],a=t+t,s=i+i,o=r+r,l=t*a,c=i*a,f=i*s,u=r*a,p=r*s,h=r*o,m=n*a,d=n*s,g=n*o,this[0]=1-f-h,this[1]=c+g,this[2]=u-d,this[3]=0,this[4]=c-g,this[5]=1-l-h,this[6]=p+m,this[7]=0,this[8]=u+d,this[9]=p-m,this[10]=1-l-f,this[11]=0,this[12]=0,this[13]=0,this[14]=0,this[15]=1,this.check()}fromMatrix3(e){return this.set(e[0],e[1],e[2],0,e[3],e[4],e[5],0,e[6],e[7],e[8],0,0,0,0,1)}frustum(e){let{left:t,right:i,bottom:r,top:n,near:a=.1,far:s=500}=e;if(s===1/0){var o,l,c,f,u,p;o=this,l=t,c=i,f=r,u=n,p=a,o[0]=2*p/(c-l),o[1]=0,o[2]=0,o[3]=0,o[4]=0,o[5]=2*p/(u-f),o[6]=0,o[7]=0,o[8]=(c+l)/(c-l),o[9]=(u+f)/(u-f),o[10]=-1,o[11]=-1,o[12]=0,o[13]=0,o[14]=-2*p,o[15]=0}else{let e,o,l;e=1/(i-t),o=1/(n-r),l=1/(a-s),this[0]=2*a*e,this[1]=0,this[2]=0,this[3]=0,this[4]=0,this[5]=2*a*o,this[6]=0,this[7]=0,this[8]=(i+t)*e,this[9]=(n+r)*o,this[10]=(s+a)*l,this[11]=-1,this[12]=0,this[13]=0,this[14]=s*a*2*l,this[15]=0}return this.check()}lookAt(e){let{eye:t,center:i=[0,0,0],up:r=[0,1,0]}=e;return!function(e,t,i,r){let n,a,s,o,l,c,f,u,p,h,m=t[0],d=t[1],g=t[2],b=r[0],v=r[1],S=r[2],_=i[0],x=i[1],M=i[2];if(Math.abs(m-_)<T.p8&&Math.abs(d-x)<T.p8&&Math.abs(g-M)<T.p8)return e[0]=1,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=1,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[10]=1,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1;n=1/Math.sqrt((u=m-_)*u+(p=d-x)*p+(h=g-M)*h),u*=n,p*=n,h*=n,(n=Math.sqrt((a=v*h-S*p)*a+(s=S*u-b*h)*s+(o=b*p-v*u)*o))?(a*=n=1/n,s*=n,o*=n):(a=0,s=0,o=0),(n=Math.sqrt((l=p*o-h*s)*l+(c=h*a-u*o)*c+(f=u*s-p*a)*f))?(l*=n=1/n,c*=n,f*=n):(l=0,c=0,f=0),e[0]=a,e[1]=l,e[2]=u,e[3]=0,e[4]=s,e[5]=c,e[6]=p,e[7]=0,e[8]=o,e[9]=f,e[10]=h,e[11]=0,e[12]=-(a*m+s*d+o*g),e[13]=-(l*m+c*d+f*g),e[14]=-(u*m+p*d+h*g),e[15]=1}(this,t,i,r),this.check()}ortho(e){let{left:t,right:i,bottom:r,top:n,near:a=.1,far:s=500}=e;return y(this,t,i,r,n,a,s),this.check()}orthographic(e){let{fovy:t=O,aspect:i=1,focalDistance:r=1,near:n=.1,far:a=500}=e;V(t);let s=r*Math.tan(t/2),o=s*i;return this.ortho({left:-o,right:o,bottom:-s,top:s,near:n,far:a})}perspective(e){let{fovy:t=45*Math.PI/180,aspect:i=1,near:r=.1,far:n=500}=e;return V(t),I(this,t,i,r,n),this.check()}determinant(){let e,t,i,r,n,a,s,o,l,c,f,u,p,h,m,d,g,b,v,S,_,x;return e=this[0],t=this[1],i=this[2],r=this[3],n=this[4],a=this[5],s=this[6],o=this[7],l=this[8],c=this[9],f=this[10],u=this[11],p=this[12],h=this[13],m=this[14],d=this[15],g=e*a-t*n,b=e*s-i*n,v=t*s-i*a,S=l*h-c*p,_=l*m-f*p,o*(e*(x=c*m-f*h)-t*_+i*S)-r*(n*x-a*_+s*S)+d*(l*v-c*b+f*g)-u*(p*v-h*b+m*g)}getScale(e=[-0,-0,-0]){return e[0]=Math.sqrt(this[0]*this[0]+this[1]*this[1]+this[2]*this[2]),e[1]=Math.sqrt(this[4]*this[4]+this[5]*this[5]+this[6]*this[6]),e[2]=Math.sqrt(this[8]*this[8]+this[9]*this[9]+this[10]*this[10]),e}getTranslation(e=[-0,-0,-0]){return e[0]=this[12],e[1]=this[13],e[2]=this[14],e}getRotation(e,t){let{rotation:i,scale:r}=A(this);if(e=e||Array(16),t)for(let e=0;e<3;e++)t[e]=r[e];for(let t=0;t<16;t++)e[t]=0;for(let t=0;t<9;t++)e[4*Math.floor(t/3)+t%3]=i[t];return e[15]=1,e}getRotationMatrix3(e,t){let{rotation:i,scale:r}=A(this);if(e=e||Array(9),t)for(let e=0;e<3;e++)t[e]=r[e];for(let t=0;t<9;t++)e[t]=i[t];return e}transpose(){return!function(e,t){if(e===t){let i=t[1],r=t[2],n=t[3],a=t[6],s=t[7],o=t[11];e[1]=t[4],e[2]=t[8],e[3]=t[12],e[4]=i,e[6]=t[9],e[7]=t[13],e[8]=r,e[9]=a,e[11]=t[14],e[12]=n,e[13]=s,e[14]=o}else e[0]=t[0],e[1]=t[4],e[2]=t[8],e[3]=t[12],e[4]=t[1],e[5]=t[5],e[6]=t[9],e[7]=t[13],e[8]=t[2],e[9]=t[6],e[10]=t[10],e[11]=t[14],e[12]=t[3],e[13]=t[7],e[14]=t[11],e[15]=t[15]}(this,this),this.check()}invert(){let e,t,i,r,n,a,s,o,l,c,f,u,p,h,m,d,g,b,v,S,_,x,M,R,T,C,I,y,A;return e=this[0],t=this[1],i=this[2],r=this[3],n=this[4],a=this[5],s=this[6],o=this[7],l=this[8],c=this[9],f=this[10],u=this[11],p=this[12],h=this[13],m=this[14],d=this[15],g=e*a-t*n,b=e*s-i*n,v=e*o-r*n,S=t*s-i*a,_=t*o-r*a,x=i*o-r*s,M=l*h-c*p,R=l*m-f*p,T=l*d-u*p,C=c*m-f*h,I=c*d-u*h,(A=g*(y=f*d-u*m)-b*I+v*C+S*T-_*R+x*M)&&(A=1/A,this[0]=(a*y-s*I+o*C)*A,this[1]=(i*I-t*y-r*C)*A,this[2]=(h*x-m*_+d*S)*A,this[3]=(f*_-c*x-u*S)*A,this[4]=(s*T-n*y-o*R)*A,this[5]=(e*y-i*T+r*R)*A,this[6]=(m*v-p*x-d*b)*A,this[7]=(l*x-f*v+u*b)*A,this[8]=(n*I-a*T+o*M)*A,this[9]=(t*T-e*I-r*M)*A,this[10]=(p*_-h*v+d*g)*A,this[11]=(c*v-l*_-u*g)*A,this[12]=(a*R-n*C-s*M)*A,this[13]=(e*C-t*R+i*M)*A,this[14]=(h*b-p*S-m*g)*A,this[15]=(l*S-c*b+f*g)*A),this.check()}multiplyLeft(e){return C(this,e,this),this.check()}multiplyRight(e){return C(this,this,e),this.check()}rotateX(e){let t,i,r,n,a,s,o,l,c,f;return t=Math.sin(e),i=Math.cos(e),r=this[4],n=this[5],a=this[6],s=this[7],o=this[8],l=this[9],c=this[10],f=this[11],this!==this&&(this[0]=this[0],this[1]=this[1],this[2]=this[2],this[3]=this[3],this[12]=this[12],this[13]=this[13],this[14]=this[14],this[15]=this[15]),this[4]=r*i+o*t,this[5]=n*i+l*t,this[6]=a*i+c*t,this[7]=s*i+f*t,this[8]=o*i-r*t,this[9]=l*i-n*t,this[10]=c*i-a*t,this[11]=f*i-s*t,this.check()}rotateY(e){let t,i,r,n,a,s,o,l,c,f;return t=Math.sin(e),i=Math.cos(e),r=this[0],n=this[1],a=this[2],s=this[3],o=this[8],l=this[9],c=this[10],f=this[11],this!==this&&(this[4]=this[4],this[5]=this[5],this[6]=this[6],this[7]=this[7],this[12]=this[12],this[13]=this[13],this[14]=this[14],this[15]=this[15]),this[0]=r*i-o*t,this[1]=n*i-l*t,this[2]=a*i-c*t,this[3]=s*i-f*t,this[8]=r*t+o*i,this[9]=n*t+l*i,this[10]=a*t+c*i,this[11]=s*t+f*i,this.check()}rotateZ(e){let t,i,r,n,a,s,o,l,c,f;return t=Math.sin(e),i=Math.cos(e),r=this[0],n=this[1],a=this[2],s=this[3],o=this[4],l=this[5],c=this[6],f=this[7],this!==this&&(this[8]=this[8],this[9]=this[9],this[10]=this[10],this[11]=this[11],this[12]=this[12],this[13]=this[13],this[14]=this[14],this[15]=this[15]),this[0]=r*i+o*t,this[1]=n*i+l*t,this[2]=a*i+c*t,this[3]=s*i+f*t,this[4]=o*i-r*t,this[5]=l*i-n*t,this[6]=c*i-a*t,this[7]=f*i-s*t,this.check()}rotateXYZ(e){return this.rotateX(e[0]).rotateY(e[1]).rotateZ(e[2])}rotateAxis(e,t){let i,r,n,a,s,o,l,c,f,u,p,h,m,d,g,b,v,S,_,x,M,R,C,I,y,A,E,N;return y=t[0],(N=Math.sqrt(y*y+(A=t[1])*A+(E=t[2])*E))<T.p8||(y*=N=1/N,A*=N,E*=N,r=Math.sin(e),n=1-(i=Math.cos(e)),a=this[0],s=this[1],o=this[2],l=this[3],c=this[4],f=this[5],u=this[6],p=this[7],h=this[8],m=this[9],d=this[10],g=this[11],b=y*y*n+i,v=A*y*n+E*r,S=E*y*n-A*r,_=y*A*n-E*r,x=A*A*n+i,M=E*A*n+y*r,R=y*E*n+A*r,C=A*E*n-y*r,I=E*E*n+i,this[0]=a*b+c*v+h*S,this[1]=s*b+f*v+m*S,this[2]=o*b+u*v+d*S,this[3]=l*b+p*v+g*S,this[4]=a*_+c*x+h*M,this[5]=s*_+f*x+m*M,this[6]=o*_+u*x+d*M,this[7]=l*_+p*x+g*M,this[8]=a*R+c*C+h*I,this[9]=s*R+f*C+m*I,this[10]=o*R+u*C+d*I,this[11]=l*R+p*C+g*I,this!==this&&(this[12]=this[12],this[13]=this[13],this[14]=this[14],this[15]=this[15])),this.check()}scale(e){var t;let i,r,n;return i=(t=Array.isArray(e)?e:[e,e,e])[0],r=t[1],n=t[2],this[0]=this[0]*i,this[1]=this[1]*i,this[2]=this[2]*i,this[3]=this[3]*i,this[4]=this[4]*r,this[5]=this[5]*r,this[6]=this[6]*r,this[7]=this[7]*r,this[8]=this[8]*n,this[9]=this[9]*n,this[10]=this[10]*n,this[11]=this[11]*n,this[12]=this[12],this[13]=this[13],this[14]=this[14],this[15]=this[15],this.check()}translate(e){let t,i,r,n,a,s,o,l,c,f,u,p,h,m,d;return h=e[0],m=e[1],d=e[2],this===this?(this[12]=this[0]*h+this[4]*m+this[8]*d+this[12],this[13]=this[1]*h+this[5]*m+this[9]*d+this[13],this[14]=this[2]*h+this[6]*m+this[10]*d+this[14],this[15]=this[3]*h+this[7]*m+this[11]*d+this[15]):(t=this[0],i=this[1],r=this[2],n=this[3],a=this[4],s=this[5],o=this[6],l=this[7],c=this[8],f=this[9],u=this[10],p=this[11],this[0]=t,this[1]=i,this[2]=r,this[3]=n,this[4]=a,this[5]=s,this[6]=o,this[7]=l,this[8]=c,this[9]=f,this[10]=u,this[11]=p,this[12]=t*h+a*m+c*d+this[12],this[13]=i*h+s*m+f*d+this[13],this[14]=r*h+o*m+u*d+this[14],this[15]=n*h+l*m+p*d+this[15]),this.check()}transform(e,t){if(4===e.length){var i;let r,n,a,s;return i=t||[-0,-0,-0,-0],r=e[0],n=e[1],a=e[2],s=e[3],i[0]=this[0]*r+this[4]*n+this[8]*a+this[12]*s,i[1]=this[1]*r+this[5]*n+this[9]*a+this[13]*s,i[2]=this[2]*r+this[6]*n+this[10]*a+this[14]*s,i[3]=this[3]*r+this[7]*n+this[11]*a+this[15]*s,t=i,(0,E.qk)(t,4),t}return this.transformAsPoint(e,t)}transformAsPoint(e,t){let i,{length:r}=e;switch(r){case 2:i=(0,L.Z0)(t||[-0,-0],e,this);break;case 3:i=(0,P.Z0)(t||[-0,-0,-0],e,this);break;default:throw Error("Illegal vector")}return(0,E.qk)(i,e.length),i}transformAsVector(e,t){let i;switch(e.length){case 2:i=(0,N.B$)(t||[-0,-0],e,this);break;case 3:i=(0,N.cL)(t||[-0,-0,-0],e,this);break;default:throw Error("Illegal vector")}return(0,E.qk)(i,e.length),i}makeRotationX(e){return this.identity().rotateX(e)}makeTranslation(e,t,i){return this.identity().translate([e,t,i])}}function V(e){if(e>2*Math.PI)throw Error("expected radians")}var F=i(33232);function H(e,t){if(!e)throw Error(`math.gl assertion ${t}`)}class k extends F.a{get x(){return this[0]}set x(e){this[0]=(0,E.ws)(e)}get y(){return this[1]}set y(e){this[1]=(0,E.ws)(e)}len(){return Math.sqrt(this.lengthSquared())}magnitude(){return this.len()}lengthSquared(){let e=0;for(let t=0;t<this.ELEMENTS;++t)e+=this[t]*this[t];return e}magnitudeSquared(){return this.lengthSquared()}distance(e){return Math.sqrt(this.distanceSquared(e))}distanceSquared(e){let t=0;for(let i=0;i<this.ELEMENTS;++i){let r=this[i]-e[i];t+=r*r}return(0,E.ws)(t)}dot(e){let t=0;for(let i=0;i<this.ELEMENTS;++i)t+=this[i]*e[i];return(0,E.ws)(t)}normalize(){let e=this.magnitude();if(0!==e)for(let t=0;t<this.ELEMENTS;++t)this[t]/=e;return this.check()}multiply(...e){for(let t of e)for(let e=0;e<this.ELEMENTS;++e)this[e]*=t[e];return this.check()}divide(...e){for(let t of e)for(let e=0;e<this.ELEMENTS;++e)this[e]/=t[e];return this.check()}lengthSq(){return this.lengthSquared()}distanceTo(e){return this.distance(e)}distanceToSquared(e){return this.distanceSquared(e)}getComponent(e){return H(e>=0&&e<this.ELEMENTS,"index is out of range"),(0,E.ws)(this[e])}setComponent(e,t){return H(e>=0&&e<this.ELEMENTS,"index is out of range"),this[e]=t,this.check()}addVectors(e,t){return this.copy(e).add(t)}subVectors(e,t){return this.copy(e).subtract(t)}multiplyVectors(e,t){return this.copy(e).multiply(t)}addScaledVector(e,t){for(let i=0;i<this.ELEMENTS;++i)this[i]+=e[i]*t;return this.check()}}var D=i(7578);let B=[0,0,0];class G extends k{static get ZERO(){return a||Object.freeze(a=new G(0,0,0)),a}constructor(e=0,t=0,i=0){super(-0,-0,-0),1==arguments.length&&(0,D.cy)(e)?this.copy(e):(D.$W.debug&&((0,E.ws)(e),(0,E.ws)(t),(0,E.ws)(i)),this[0]=e,this[1]=t,this[2]=i)}set(e,t,i){return this[0]=e,this[1]=t,this[2]=i,this.check()}copy(e){return this[0]=e[0],this[1]=e[1],this[2]=e[2],this.check()}fromObject(e){return D.$W.debug&&((0,E.ws)(e.x),(0,E.ws)(e.y),(0,E.ws)(e.z)),this[0]=e.x,this[1]=e.y,this[2]=e.z,this.check()}toObject(e){return e.x=this[0],e.y=this[1],e.z=this[2],e}get ELEMENTS(){return 3}get z(){return this[2]}set z(e){this[2]=(0,E.ws)(e)}angle(e){return(0,P.g7)(this,e)}cross(e){return(0,P.$A)(this,this,e),this.check()}rotateX({radians:e,origin:t=B}){return(0,P.eL)(this,this,t,e),this.check()}rotateY({radians:e,origin:t=B}){return(0,P.Z8)(this,this,t,e),this.check()}rotateZ({radians:e,origin:t=B}){return(0,P.x6)(this,this,t,e),this.check()}transform(e){return this.transformAsPoint(e)}transformAsPoint(e){return(0,P.Z0)(this,this,e),this.check()}transformAsVector(e){return(0,N.cL)(this,this,e),this.check()}transformByMatrix3(e){return(0,P.ei)(this,this,e),this.check()}transformByMatrix2(e){return(0,N.J4)(this,this,e),this.check()}transformByQuaternion(e){return(0,P.gL)(this,this,e),this.check()}}var z=i(4500);function j(e,t){if(!e)throw Error(t)}class K{id;matrix=new U;display=!0;selectable=!0;hoverable=!0;position=new G;rotation=new G;scale=new G(1,1,1);metadata={};userData={};props={};constructor(e={}){let{id:t}=e;this.id=t||(0,z.L)(this.constructor.name),this._setScenegraphNodeProps(e)}getBounds(){return null}destroy(){}delete(){this.destroy()}setProps(e){return this._setScenegraphNodeProps(e),this}toString(){return`{type: ScenegraphNode, id: ${this.id})}`}setPosition(e){return j(3===e.length,"setPosition requires vector argument"),this.position=e,this}setRotation(e){return j(3===e.length||4===e.length,"setRotation requires vector argument"),this.rotation=e,this}setScale(e){return j(3===e.length,"setScale requires vector argument"),this.scale=e,this}setMatrix(e,t=!0){t?this.matrix.copy(e):this.matrix=e}setMatrixComponents(e){let{position:t,rotation:i,scale:r,update:n=!0}=e;return t&&this.setPosition(t),i&&this.setRotation(i),r&&this.setScale(r),n&&this.updateMatrix(),this}updateMatrix(){if(this.matrix.identity(),this.matrix.translate(this.position),4===this.rotation.length){let e=new U().fromQuaternion(this.rotation);this.matrix.multiplyRight(e)}else this.matrix.rotateXYZ(this.rotation);return this.matrix.scale(this.scale),this}update({position:e,rotation:t,scale:i}={}){return e&&this.setPosition(e),t&&this.setRotation(t),i&&this.setScale(i),this.updateMatrix(),this}getCoordinateUniforms(e,t){t=t||this.matrix;let i=new U(e).multiplyRight(t),r=i.invert(),n=r.transpose();return{viewMatrix:e,modelMatrix:t,objectMatrix:t,worldMatrix:i,worldInverseMatrix:r,worldInverseTransposeMatrix:n}}_setScenegraphNodeProps(e){void 0!==e.selectable&&(this.selectable=e.selectable),void 0!==e.hoverable&&(this.hoverable=e.hoverable),void 0!==e.display&&(this.display=e.display),e?.position&&this.setPosition(e.position),e?.rotation&&this.setRotation(e.rotation),e?.scale&&this.setScale(e.scale),this.updateMatrix(),e?.matrix&&this.setMatrix(e.matrix),Object.assign(this.props,e)}}var W=i(64344),$=i(58006);function q(){return[[1/0,1/0,1/0],[-1/0,-1/0,-1/0]]}function X(e,t,i){let r=new U(i);for(let i=0;i<8;i++){let n=new G(t[1&i?1:0][0],t[2&i?1:0][1],t[4&i?1:0][2]);r.transformAsPoint(n,n);for(let t=0;t<3;t++)e[0][t]=Math.min(e[0][t],n[t]),e[1][t]=Math.max(e[1][t],n[t])}}function J(e){return Number.isFinite(e[0][0])}class Y extends K{children;transformSource;constructor(e={}){let{children:t=[]}=e=Array.isArray(e)?{children:e}:e;W.R.assert(t.every(e=>e instanceof K),"every child must an instance of ScenegraphNode"),super(e),this.children=t,this.transformSource=e.transformSource??null}getBounds(){let e=q();return this.traverse((t,{worldMatrix:i})=>{let r=t.getBounds();r&&X(e,r,new U(i).multiplyRight(t.matrix))}),J(e)?e:null}destroy(){this.children.forEach(e=>e.destroy()),this.removeAll(),super.destroy()}add(...e){for(let t of e)Array.isArray(t)?this.add(...t):this.children.push(t);return this}remove(e){let t=this.children,i=t.indexOf(e);return i>-1&&t.splice(i,1),this}removeAll(){return this.children=[],this}findNode(e){let t=this.findNodes(e);if(t.length>1)throw Error(`Ambiguous scenegraph path: ${e} (${t.length} matches)`);return t[0]}findNodes(e){let t=e.startsWith("/"),i="/"===e?[]:(t?e.slice(1):e).split("/").map(t=>{if(!t||/~(?![01])/.test(t))throw Error(`Invalid scenegraph path: ${e}`);return t.replace(/~1/g,"/").replace(/~0/g,"~")}),r=[],n=[],a=new Set,s=[{node:this,depth:0}];for(;s.length;){let{node:e,depth:o}=s.pop();(0,$.v)(!a.has(e)),a.add(e),n.length=o,n.push(e.id);let l=n.length-i.length;if((t?1===l:l>=0)&&i.every((e,t)=>e===n[l+t])&&r.push(e),e instanceof Y)for(let t=e.children.length-1;t>=0;t--)s.push({node:e.children[t],depth:o+1})}return r}traverse(e,{worldMatrix:t=new U}={}){if(!this.display)return;let i=new U(t).multiplyRight(this.matrix);for(let t of this.children)t.display&&(t instanceof Y?t.traverse(e,{worldMatrix:i}):e(t,{worldMatrix:i}))}traverseDepthSorted(e,{viewMatrix:t,worldMatrix:i=new U,order:r="back-to-front"}){let n=new U(t),a=[];this.traverse((e,t)=>{let i=e.getBounds(),r=i?new G(i[0]).add(i[1]).divide([2,2,2]):new G,s=new U(t.worldMatrix).multiplyRight(e.matrix);s.transformAsPoint(r,r),n.transformAsPoint(r,r),a.push({node:e,context:{worldMatrix:s,bounds:i,depth:-r[2]},index:a.length})},{worldMatrix:new U(i)});let s="back-to-front"===r?-1:1;for(let{node:t,context:i}of(a.sort((e,t)=>s*(e.context.depth-t.context.depth)||e.index-t.index),a))e(t,i)}preorderTraversal(e,{worldMatrix:t=new U}={}){let i=new U(t).multiplyRight(this.matrix);for(let t of(e(this,{worldMatrix:i}),this.children))t instanceof Y?t.preorderTraversal(e,{worldMatrix:i}):e(t,{worldMatrix:i})}}class Z extends K{model;instanceMatrices;bounds=null;managedResources;constructor(e){super(e),this.model=e.model,this.managedResources=e.managedResources||[],this.instanceMatrices=e.instanceMatrices||null,this.bounds=e.bounds?this.instanceMatrices?function(e,t){let i=q();for(let r of t)X(i,e,r);return J(i)?i:null}(e.bounds,this.instanceMatrices):e.bounds:null,this.setProps(e)}destroy(){this.model&&(this.model.destroy(),this.model=null),this.managedResources.forEach(e=>e.destroy()),this.managedResources=[]}getBounds(){return this.bounds}draw(e){return this.model.draw(e)}}let Q={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5124:Int32Array,5125:Uint32Array,5126:Float32Array,5130:Float64Array,5131:(0,i(44677).pX)(),5134:BigInt64Array,5135:BigUint64Array};function ee(e,t){let i=Q[e.componentType];(0,$.v)(i);let r=e.count*e.components*i.BYTES_PER_ELEMENT;return(0,$.v)(r>=0&&r<=t.byteLength),{ArrayType:i,byteLength:r}}function et(e,t,i=e.byteOffset||0,r=e.count){let{ArrayType:n}=ee(e,t),a={MAT2:2,MAT3:3,MAT4:4}[e.type],s=a||1,o=e.components/s*e.bytesPerComponent,l=a?4*Math.ceil(o/4):o,c=t.byteStride||s*l,f=r>0?(r-1)*c+(s-1)*l+o:0;(0,$.v)(i>=0&&i+f<=t.byteLength);let u=t.buffer,p=t.byteOffset||0;(0,$.v)(p>=0&&p+t.byteLength<=u.byteLength);let h=new Uint8Array(u.arrayBuffer,u.byteOffset+p+i,f),m=new Uint8Array(r*e.bytesPerElement);for(let t=0;t<r;t++)for(let i=0;i<s;i++){let r=t*c+i*l,n=t*e.bytesPerElement+i*o;m.set(h.subarray(r,r+o),n)}return new n(m.buffer)}let ei={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},er={5120:1,5121:1,5122:2,5123:2,5124:4,5125:4,5126:4,5130:8,5131:2,5134:8,5135:8},en={magFilter:10240,minFilter:10241,wrapS:10242,wrapT:10243},ea={10240:9729,10241:9986,10242:10497,10243:10497};class es{json;buffers=[];images=[];postProcess(e){let{json:t,buffers:i=[],images:r=[]}=e;(0,$.v)(t);let n=Math.max(t.buffers?.length||0,i.length);return this.buffers=Array.from({length:n},(e,r)=>({...t.buffers?.[r]||{},...i[r]||{}})),this.images=r,this.json=this._resolveTree(e.json),this.json.buffers=this.buffers,this.json.gaussianSplatPrimitives=e.gaussianSplatPrimitives,this.json}_resolveTree(e){let t={...e,accessors:e.accessors??[],animations:e.animations??[],buffers:e.buffers??[],bufferViews:e.bufferViews??[],cameras:e.cameras??[],images:e.images??[],materials:e.materials??[],meshes:e.meshes??[],nodes:e.nodes??[],samplers:e.samplers??[],scenes:e.scenes??[],skins:e.skins??[],textures:e.textures??[],extensionsUsed:e.extensionsUsed??[],extensionsRequired:e.extensionsRequired??[]};return this.json=t,e.bufferViews&&(t.bufferViews=e.bufferViews.map((e,t)=>this._resolveBufferView(e,t))),e.cameras&&(t.cameras=e.cameras.map((e,t)=>this._resolveCamera(e,t))),e.images&&(t.images=e.images.map((e,t)=>this._resolveImage(e,t))),t.asset=this._resolveAsset(e.asset),e.samplers&&(t.samplers=e.samplers.map((e,t)=>this._resolveSampler(e,t))),e.textures&&(t.textures=e.textures.map((e,t)=>this._resolveTexture(e,t))),e.accessors&&(t.accessors=e.accessors.map((e,t)=>this._resolveAccessor(e,t))),e.materials&&(t.materials=e.materials.map((e,t)=>this._resolveMaterial(e,t))),e.meshes&&(t.meshes=e.meshes.map((e,t)=>this._resolveMesh(e,t))),e.nodes&&(t.nodes=e.nodes.map((e,t)=>this._resolveNode(e,t)),t.nodes=t.nodes.map(e=>this._resolveNodeChildren(e))),e.skins&&(t.skins=e.skins.map((e,t)=>this._resolveSkin(e,t)),e.nodes?.forEach((e,i)=>{void 0!==e.skin&&(t.nodes[i].skin=this.getSkin(e.skin))})),e.scenes&&(t.scenes=e.scenes.map((e,t)=>this._resolveScene(e,t))),"number"==typeof this.json.scene&&t.scenes&&(t.scene=t.scenes[this.json.scene]),t}getScene(e){return this._get(this.json.scenes,e)}getNode(e){return this._get(this.json.nodes,e)}getSkin(e){return this._get(this.json.skins,e)}getMesh(e){return this._get(this.json.meshes,e)}getMaterial(e){return this._get(this.json.materials,e)}getAccessor(e){let t=this._get(this.json.accessors,e);if("object"==typeof e){let e=ei[t.type],i=er[t.componentType];return{...t,components:e,bytesPerComponent:i,bytesPerElement:e*i}}return t}getCamera(e){return this._get(this.json.cameras,e)}getTexture(e){return this._get(this.json.textures,e)}getSampler(e){return this._get(this.json.samplers,e)}getImage(e){return this._get(this.json.images,e)}getBufferView(e){return this._get(this.json.bufferViews,e)}getBuffer(e){return this._get(this.json.buffers,e)}_get(e,t){if("object"==typeof t)return t;let i=e&&e[t];return(0,$.v)(i),i}_resolveAsset(e){return{...e,thumbnail:void 0!==e.thumbnail?this.getImage(e.thumbnail):void 0}}_resolveScene(e,t){return{...e,id:e.id||`scene-${t}`,nodes:(e.nodes||[]).map(e=>this.getNode(e))}}_resolveNode(e,t){let i={...e,id:e?.id||`node-${t}`};return void 0!==e.mesh&&(i.mesh=this.getMesh(e.mesh)),void 0!==e.camera&&(i.camera=this.getCamera(e.camera)),void 0!==e.skin&&(i.skin=this.getSkin(e.skin)),i}_resolveNodeChildren(e){return e.children&&(e.children=e.children.map(e=>this.getNode(e))),e}_resolveSkin(e,t){let i="number"==typeof e.inverseBindMatrices?this.getAccessor(e.inverseBindMatrices):void 0;return{...e,id:e.id||`skin-${t}`,inverseBindMatrices:i}}_resolveMesh(e,t){let i={...e,id:e.id||`mesh-${t}`,primitives:[]};return e.primitives&&(i.primitives=e.primitives.map((e,t)=>{let r={...e,attributes:{},indices:void 0,material:void 0},n=e.attributes;for(let e in n)r.attributes[e]=this.getAccessor(n[e]);return void 0!==e.indices&&(r.indices=this.getAccessor(e.indices)),void 0!==e.material&&(r.material=this.getMaterial(e.material)),function(e,t,i){let r;if(2!==e.mode&&6!==e.mode)return e;let n=e.indices?.value,a=e.indices?.count??(r=Object.values(e.attributes)[0],(0,$.v)(r),r.count),s=function(e,t){if(!e)return Math.max(0,t-1);let i=0;for(let r=0;r<t;r++)i=Math.max(i,Number(e[r]));return i}(n,a),o=s<=65535?Uint16Array:Uint32Array,l=2===e.mode?function(e,t,i){if(t<2)return new i(0);let r=new i(2*t);for(let i=0;i<t;i++)r[2*i]=eo(e,i),r[2*i+1]=eo(e,(i+1)%t);return r}(n,a,o):function(e,t,i){let r=Math.max(0,t-2),n=new i(3*r);for(let t=0;t<r;t++)n[3*t]=eo(e,0),n[3*t+1]=eo(e,t+1),n[3*t+2]=eo(e,t+2);return n}(n,a,o);return e.mode=2===e.mode?1:4,e.indices={id:`${t}-primitive-${i}-portable-indices`,components:1,bytesPerComponent:o.BYTES_PER_ELEMENT,bytesPerElement:o.BYTES_PER_ELEMENT,componentType:o===Uint16Array?5123:5125,normalized:!1,count:l.length,type:"SCALAR",min:l.length?[function(e){let t=1/0;for(let i of e)t=Math.min(t,i);return t}(l)]:void 0,max:l.length?[s]:void 0,value:l},e}(r,i.id,t)})),i}_resolveMaterial(e,t){let i={...e,id:e.id||`material-${t}`};if(i.normalTexture&&(i.normalTexture={...i.normalTexture},i.normalTexture.texture=this.getTexture(i.normalTexture.index)),i.occlusionTexture&&(i.occlusionTexture={...i.occlusionTexture},i.occlusionTexture.texture=this.getTexture(i.occlusionTexture.index)),i.emissiveTexture&&(i.emissiveTexture={...i.emissiveTexture},i.emissiveTexture.texture=this.getTexture(i.emissiveTexture.index)),i.emissiveFactor||(i.emissiveFactor=[0,0,0]),i.pbrMetallicRoughness){i.pbrMetallicRoughness={...i.pbrMetallicRoughness};let e=i.pbrMetallicRoughness;e.baseColorTexture&&(e.baseColorTexture={...e.baseColorTexture},e.baseColorTexture.texture=this.getTexture(e.baseColorTexture.index)),e.metallicRoughnessTexture&&(e.metallicRoughnessTexture={...e.metallicRoughnessTexture},e.metallicRoughnessTexture.texture=this.getTexture(e.metallicRoughnessTexture.index))}return i}_resolveAccessor(e,t){let i=er[e.componentType],r=ei[e.type],n={...e,id:e.id||`accessor-${t}`,bytesPerComponent:i,components:r,bytesPerElement:i*r,value:void 0,bufferView:void 0,sparse:void 0};if(void 0!==e.bufferView&&(n.bufferView=this.getBufferView(e.bufferView)),e.value)(0,$.v)(e.value.length===n.count*n.components),n.value=e.sparse?Uint8Array.prototype.slice.call(e.value):e.value;else if(n.bufferView)n.value=et(n,n.bufferView);else{let{ArrayType:e}=ee(n,{byteLength:n.count*n.bytesPerElement});n.value=new e(n.count*n.components)}return e.sparse&&this._applySparseAccessor(n,e.sparse),n}_applySparseAccessor(e,t){let i=function(e){switch(e){case 5121:return Uint8Array;case 5123:return Uint16Array;case 5125:return Uint32Array;default:throw Error(`Invalid glTF sparse index component type ${e}`)}}(t.indices.componentType),r=this._getTypedArrayFromBufferView(i,this.getBufferView(t.indices.bufferView),t.indices.byteOffset||0,t.count),n=et({...e,count:t.count},this.getBufferView(t.values.bufferView),t.values.byteOffset||0,t.count);for(let i=0;i<t.count;i++){let t=Number(r[i]);(0,$.v)(Number.isInteger(t)&&t>=0&&t<e.count);for(let r=0;r<e.components;r++){let a=t*e.components+r,s=i*e.components+r;Reflect.set(e.value,a,n[s])}}}_getTypedArrayFromBufferView(e,t,i,r){let n=r*e.BYTES_PER_ELEMENT;(0,$.v)(i>=0&&n>=0&&i+n<=t.byteLength);let a=t.buffer,s=a.byteOffset+(t.byteOffset||0)+i;return new e(new Uint8Array(a.arrayBuffer,s,n).slice().buffer)}_resolveTexture(e,t){return{...e,id:e.id||`texture-${t}`,sampler:"number"==typeof e.sampler?this.getSampler(e.sampler):{id:"default-sampler",parameters:ea},source:"number"==typeof e.source?this.getImage(e.source):void 0}}_resolveSampler(e,t){let i={id:e.id||`sampler-${t}`,...e,parameters:{}};for(let t of Object.keys(en)){let r=e[t];void 0!==r&&(i.parameters[en[t]]=r)}return i}_resolveImage(e,t){return{...e,id:e.id||`image-${t}`,image:this.images[t]??null,bufferView:void 0!==e.bufferView?this.getBufferView(e.bufferView):void 0}}_resolveBufferView(e,t){let i=e.buffer,r=this.buffers[i];(0,$.v)(r),(0,$.v)(r.byteOffset>=0&&r.byteLength>=0&&r.byteOffset+r.byteLength<=r.arrayBuffer.byteLength);let n=e.byteOffset||0;(0,$.v)(n>=0&&e.byteLength>=0&&n+e.byteLength<=r.byteLength);let a=r.byteOffset+n;return{id:`bufferView-${t}`,...e,buffer:this.buffers[i],data:new Uint8Array(r.arrayBuffer,a,e.byteLength)}}_resolveCamera(e,t){return{...e,id:e.id||`camera-${t}`}}}function eo(e,t){return e?Number(e[t]):t}class el{entries=new Map;set(e,t,i){let r=this.entries.get(e);r||(r=new Map,this.entries.set(e,r)),r.set(t,i)}get(e,t=0){return this.entries.get(e)?.get(t)}}let ec="KHR_physics_rigid_bodies";function ef(e){if(!e||"object"!=typeof e||Array.isArray(e))throw Error("Expected joint object");return e}function eu(e,t){for(let i of Object.keys(e))if(!t.includes(i)&&!["extras","name"].includes(i))throw Error(`Unsupported joint field: ${i}`)}function ep(e){if(void 0!==e){if("number"!=typeof e||!Number.isFinite(e))throw Error("Expected joint number");return e}}function eh(e){if(void 0===e)return[];if(!Array.isArray(e))throw Error("Expected joint list");return e}class em{scenes;bindings=new Map;cameraDepths=new Map;constructor(e){for(let t of(this.scenes=e.scenes,e.bindings)){let{definition:e}=t,i=new G(e.viewDirection||[0,0,1]),r=new G(e.up||[0,1,0]);(0,$.v)(i.magnitude()>0&&r.magnitude()>0),(0,$.v)(new G(i).normalize().cross(new G(r).normalize()).magnitude()>1e-6),this.bindings.set(t.node,t)}}getDrawEntries(e){let{sceneIndex:t=0,cameraId:i="default"}=e,r=this.scenes[t];(0,$.v)(r);let n=new U(e.viewMatrix),a=new U(n).invert(),s=new G(a.getTranslation()),o=new G(1,0,0).transformAsVector(a).normalize(),l=new G(0,1,0).transformAsVector(a).normalize(),c=this.cameraDepths.get(i);c||(c=new Map,this.cameraDepths.set(i,c));let f=new Set,u=[],p=(e,t,i,r=0)=>{if(!e.display)return;let h=new U(t).multiplyRight(e.matrix),m=this.bindings.get(e),d=i||!!m?.definition.overlay;if(m?.definition.overlay&&(r=new G(h.getTranslation()).distance(s)),m){f.add(e);let t=new G(h.getTranslation()),i=new G(s).subtract(t);1e-8>i.magnitude()&&i.copy([a[8],a[9],a[10]]),"y"===m.definition.rotationAxis&&(i[1]=0,1e-8>i.magnitude()&&i.copy([0,0,1])),i.normalize();let r="y"===m.definition.rotationAxis?new G(0,1,0):new G(i).cross(o);1e-8>r.magnitude()&&(r=new G(l).subtract(new G(i).scale(l.dot(i)))),r.normalize();let u=ed(i,r),p=new G(m.matrixAuthored?e.matrix.getScale():e.scale);m.matrixAuthored&&0>e.matrix.determinant()&&(p[0]=-p[0]);let d=new G(m.definition.viewDirection||[0,0,1]).multiply(p),g=new G(m.definition.up||[0,1,0]).multiply(p),b=d.magnitude()>1e-8&&g.magnitude()>1e-8&&new G(d).normalize().cross(new G(g).normalize()).magnitude()>1e-8,v=ed(b?d:new G(m.definition.viewDirection||[0,0,1]),b?g:new G(m.definition.up||[0,1,0]));if(m.definition.scaleWithDistance){let i=Math.abs(new G(t).transformAsPoint(n)[2]);!c.has(e)&&i>1e-8&&c.set(e,i);let r=c.get(e);void 0!==r&&p.scale(i/r)}h=new U().translate(t).multiplyRight(u).multiplyRight(v.transpose()).scale(p)}if(e instanceof Y)for(let t of e.children)p(t,h,d,r);else u.push({node:e,modelMatrix:h,overlay:d,distance:r,depth:-new G(h.getTranslation()).transformAsPoint(n)[2]})};for(let e of(p(r,new U,!1),c.keys()))f.has(e)||c.delete(e);return u.sort((e,t)=>Number(e.overlay)-Number(t.overlay)||(e.overlay?t.distance-e.distance||t.depth-e.depth:0)),u}resetCamera(e="default"){this.cameraDepths.delete(e)}destroy(){this.bindings.clear(),this.cameraDepths.clear()}}function ed(e,t){e=new G(e).normalize();let i=new G(t).cross(e).normalize();return t=new G(e).cross(i).normalize(),new U([i[0],i[1],i[2],0,t[0],t[1],t[2],0,e[0],e[1],e[2],0,0,0,0,1])}function eg(e,t,i){let r=Math.sin(i*=.5);return e[0]=r*t[0],e[1]=r*t[1],e[2]=r*t[2],e[3]=Math.cos(i),e}function eb(e,t,i){let r=t[0],n=t[1],a=t[2],s=t[3],o=i[0],l=i[1],c=i[2],f=i[3];return e[0]=r*f+s*o+n*c-a*l,e[1]=n*f+s*l+a*o-r*c,e[2]=a*f+s*c+r*l-n*o,e[3]=s*f-r*o-n*l-a*c,e}function ev(e,t,i,r){let n,a,s,o,l,c=t[0],f=t[1],u=t[2],p=t[3],h=i[0],m=i[1],d=i[2],g=i[3];return(n=c*h+f*m+u*d+p*g)<0&&(n=-n,h=-h,m=-m,d=-d,g=-g),1-n>T.p8?(l=Math.sin(a=Math.acos(n)),s=Math.sin((1-r)*a)/l,o=Math.sin(r*a)/l):(s=1-r,o=r),e[0]=s*c+o*h,e[1]=s*f+o*m,e[2]=s*u+o*d,e[3]=s*p+o*g,e}let eS=function(e,t,i,r){let n=t[0],a=t[1],s=t[2],o=t[3];return e[0]=n+r*(i[0]-n),e[1]=a+r*(i[1]-a),e[2]=s+r*(i[2]-s),e[3]=o+r*(i[3]-o),e},e_=function(e){let t=e[0],i=e[1],r=e[2],n=e[3];return Math.sqrt(t*t+i*i+r*r+n*n)},ex=function(e){let t=e[0],i=e[1],r=e[2],n=e[3];return t*t+i*i+r*r+n*n},eM=function(e,t){let i=t[0],r=t[1],n=t[2],a=t[3],s=i*i+r*r+n*n+a*a;return s>0&&(s=1/Math.sqrt(s)),e[0]=i*s,e[1]=r*s,e[2]=n*s,e[3]=a*s,e},eR=(l=P.vt(),c=P.fA(1,0,0),f=P.fA(0,1,0),function(e,t,i){let r=P.Om(t,i);return r<-.999999?(P.$A(l,c,t),1e-6>P.Il(l)&&P.$A(l,f,t),P.S8(l,l),eg(e,l,Math.PI),e):r>.999999?(e[0]=0,e[1]=0,e[2]=0,e[3]=1,e):(P.$A(l,t,i),e[0]=l[0],e[1]=l[1],e[2]=l[2],e[3]=1+r,eM(e,e))});class eT extends F.a{constructor(e=0,t=0,i=0,r=1){super(-0,-0,-0,-0),Array.isArray(e)&&1==arguments.length?this.copy(e):this.set(e,t,i,r)}copy(e){return this[0]=e[0],this[1]=e[1],this[2]=e[2],this[3]=e[3],this.check()}set(e,t,i,r){return this[0]=e,this[1]=t,this[2]=i,this[3]=r,this.check()}fromObject(e){return this[0]=e.x,this[1]=e.y,this[2]=e.z,this[3]=e.w,this.check()}fromMatrix3(e){return!function(e,t){let i,r=t[0]+t[4]+t[8];if(r>0)i=Math.sqrt(r+1),e[3]=.5*i,i=.5/i,e[0]=(t[5]-t[7])*i,e[1]=(t[6]-t[2])*i,e[2]=(t[1]-t[3])*i;else{let r=0;t[4]>t[0]&&(r=1),t[8]>t[3*r+r]&&(r=2);let n=(r+1)%3,a=(r+2)%3;i=Math.sqrt(t[3*r+r]-t[3*n+n]-t[3*a+a]+1),e[r]=.5*i,i=.5/i,e[3]=(t[3*n+a]-t[3*a+n])*i,e[n]=(t[3*n+r]+t[3*r+n])*i,e[a]=(t[3*a+r]+t[3*r+a])*i}}(this,e),this.check()}fromEuler(e){switch(this.identity(),e.order){case"xyz":return this.rotateX(e.x).rotateY(e.y).rotateZ(e.z);case"yxz":return this.rotateY(e.y).rotateX(e.x).rotateZ(e.z);case"zxy":return this.rotateZ(e.z).rotateX(e.x).rotateY(e.y);case"zyx":return this.rotateZ(e.z).rotateY(e.y).rotateX(e.x);case"yzx":return this.rotateY(e.y).rotateZ(e.z).rotateX(e.x);case"xzy":return this.rotateX(e.x).rotateZ(e.z).rotateY(e.y);default:throw Error("Unknown Euler angle order")}}fromAxisRotation(e,t){return eg(this,e,t),this.check()}rotateTowards(e,t){return function(e,t,i,r){if(4!==t.length||4!==i.length||[...Array.from(t),...Array.from(i),r].some(e=>!Number.isFinite(e)))throw RangeError("Expected finite quaternions and step");if(4!==t.length||r<0)throw RangeError("Expected quaternions and a nonnegative step");let n=Math.max(...Array.from(t,Math.abs)),a=Math.max(...Array.from(i,Math.abs));if(!n||!a)throw RangeError("Zero quaternion");let s=Array.from(t,e=>e/n),o=Array.from(i,e=>e/a),l=Math.hypot(...s),c=Math.hypot(...o);for(let e=0;e<4;e++)s[e]/=l,o[e]/=c;let f=2*Math.acos(Math.min(1,Math.abs(s.reduce((e,t,i)=>e+t*o[i],0))));if(e.length<4)throw RangeError("Result buffer is too short");return ev(e,s,o,0===f?0:Math.min(1,r/f)),e}(this,this,e,t)}identity(){return this[0]=0,this[1]=0,this[2]=0,this[3]=1,this.check()}setAxisAngle(e,t){return this.fromAxisRotation(e,t)}get ELEMENTS(){return 4}get x(){return this[0]}set x(e){this[0]=(0,E.ws)(e)}get y(){return this[1]}set y(e){this[1]=(0,E.ws)(e)}get z(){return this[2]}set z(e){this[2]=(0,E.ws)(e)}get w(){return this[3]}set w(e){this[3]=(0,E.ws)(e)}len(){return e_(this)}lengthSquared(){return ex(this)}dot(e){return this[0]*e[0]+this[1]*e[1]+this[2]*e[2]+this[3]*e[3]}rotationTo(e,t){return eR(this,e,t),this.check()}add(e){return this[0]=this[0]+e[0],this[1]=this[1]+e[1],this[2]=this[2]+e[2],this[3]=this[3]+e[3],this.check()}calculateW(){let e,t,i;return e=this[0],t=this[1],i=this[2],this[0]=e,this[1]=t,this[2]=i,this[3]=Math.sqrt(Math.abs(1-e*e-t*t-i*i)),this.check()}conjugate(){return this[0]=-this[0],this[1]=-this[1],this[2]=-this[2],this[3]=this[3],this.check()}invert(){let e,t,i,r,n,a;return e=this[0],t=this[1],i=this[2],a=(n=e*e+t*t+i*i+(r=this[3])*r)?1/n:0,this[0]=-e*a,this[1]=-t*a,this[2]=-i*a,this[3]=r*a,this.check()}lerp(e,t,i){return void 0===i?this.lerp(this,e,t):(eS(this,e,t,i),this.check())}multiplyRight(e){return eb(this,this,e),this.check()}multiplyLeft(e){return eb(this,e,this),this.check()}normalize(){let e=this.len(),t=e>0?1/e:0;return this[0]=this[0]*t,this[1]=this[1]*t,this[2]=this[2]*t,this[3]=this[3]*t,0===e&&(this[3]=1),this.check()}rotateX(e){var t;let i,r,n,a,s,o;return t=.5*e,i=this[0],r=this[1],n=this[2],a=this[3],s=Math.sin(t),o=Math.cos(t),this[0]=i*o+a*s,this[1]=r*o+n*s,this[2]=n*o-r*s,this[3]=a*o-i*s,this.check()}rotateY(e){var t;let i,r,n,a,s,o;return t=.5*e,i=this[0],r=this[1],n=this[2],a=this[3],s=Math.sin(t),o=Math.cos(t),this[0]=i*o-n*s,this[1]=r*o+a*s,this[2]=n*o+i*s,this[3]=a*o-r*s,this.check()}rotateZ(e){var t;let i,r,n,a,s,o;return t=.5*e,i=this[0],r=this[1],n=this[2],a=this[3],s=Math.sin(t),o=Math.cos(t),this[0]=i*o+r*s,this[1]=r*o-i*s,this[2]=n*o+a*s,this[3]=a*o-n*s,this.check()}scale(e){return this[0]=this[0]*e,this[1]=this[1]*e,this[2]=this[2]*e,this[3]=this[3]*e,this.check()}slerp(e,t,i){let r,n,a;return 2==arguments.length?(r=this,n=e,a=t):(r=e,n=t,a=i),ev(this,r,n,a),this.check()}lengthSq(){return this.lengthSquared()}setFromAxisAngle(e,t){return this.setAxisAngle(e,t)}premultiply(e){return this.multiplyLeft(e)}multiply(e){return this.multiplyRight(e)}}function eC(e){if(!e.every(Number.isFinite)||Math.abs(e[3])+Math.abs(e[7])+Math.abs(e[11])>1e-7||Math.abs(e[15]-1)>1e-7)throw Error("Expected an affine transform");let t=[Math.hypot(e[0],e[1],e[2]),Math.hypot(e[4],e[5],e[6]),Math.hypot(e[8],e[9],e[10])];if(t.every(e=>0===e))return{position:[e[12],e[13],e[14]],rotation:[0,0,0,1],scale:t};if(t.some(e=>e<1e-10))throw Error("Singular collider transforms are unsupported");0>e.determinant()&&(t[0]=-t[0]);let i=[e[0]/t[0],e[1]/t[0],e[2]/t[0],e[4]/t[1],e[5]/t[1],e[6]/t[1],e[8]/t[2],e[9]/t[2],e[10]/t[2]];for(let[e,t]of[[0,1],[0,2],[1,2]])if(Math.abs(i[3*e]*i[3*t]+i[3*e+1]*i[3*t+1]+i[3*e+2]*i[3*t+2])>1e-5)throw Error("Sheared collider transforms are unsupported");let r=new eT().fromMatrix3(i).normalize();return{position:[e[12],e[13],e[14]],rotation:[r[0],r[1],r[2],r[3]],scale:t}}class eI{joints;constructor(e){this.joints=e}resolve(e,t){let i=new Map,r=new Map,n=(e,a,s)=>{if(i.has(e))throw Error("Joint scene must be a tree");let o=new U(a).multiplyRight(e.matrix),l=t.has(e)?e:s;if(i.set(e,o),r.set(e,l),e instanceof Y)for(let t of e.children)n(t,o,l)};for(let t of e)n(t,new U,null);let a=e=>{let t=i.get(e);if(!t)throw Error("Joint attachment is outside the scene");let n=r.get(e)??null,a=new U(t);if(n){let e=eC(i.get(n));a=new U().translate(e.position).multiplyRight(new U().fromQuaternion(e.rotation)).invert().multiplyRight(a)}let s=eC(a);return{body:n,position:s.position,orientation:s.rotation}};return this.joints.map(e=>({joint:e,first:a(e.first),second:a(e.second)}))}}var ey=i(90015),eA=i(6971),eE=i(9479),eN=i(8994),eL=i(55861),eP=i(62217),eO=i(7036),ew=i(68234),eU=i(16698);class eV{id;metadata={};device;factory;shaderInputs;bindings={};_uniformStore;_bindGroupCacheToken={};_dynamicResourceGenerations={};constructor(e,t={}){this.id=t.id||(0,z.L)("material"),this.device=e,this.factory=t.factory||new eH(e,{modules:t.modules||t.shaderInputs?.getModules()||[]});let i=Object.fromEntries((t.shaderInputs?.getModules()||this.factory.modules).map(e=>[e.name,e]));for(let[e,r]of(this.shaderInputs=t.shaderInputs||new ey.l(i),this._uniformStore=new eA.K(this.device,this.shaderInputs.modules),Object.entries(this.shaderInputs.modules)))if(this.ownsModule(e)&&(0,eU.fX)(r)){let t=this._uniformStore.getManagedUniformBuffer(e);this.bindings[`${e}Uniforms`]=t}this.updateShaderInputs(),t.bindings&&this._replaceOwnedBindings(t.bindings)}destroy(){this._uniformStore.destroy()}clone(e={}){let t=this.factory.createMaterial({id:e.id,shaderInputs:e.shaderInputs,bindings:{...this.getResourceBindings(),...e.bindings}});return e.shaderInputs||t.setProps(this.shaderInputs.getUniformValues()),e.moduleProps&&t.setProps(e.moduleProps),t.metadata={...this.metadata},t.updateShaderInputs(),t}ownsBinding(e){return this.factory.ownsBinding(e)}ownsModule(e){return this.factory.ownsModule(e)}setProps(e){this.shaderInputs.setProps(e)}updateShaderInputs(e){this._uniformStore.setUniforms(this.shaderInputs.getUniformValues(),e),this._setOwnedBindings(this.shaderInputs.getBindingValues())&&(this._bindGroupCacheToken={})}getResourceBindings(){let e={};for(let[t,i]of Object.entries(this.bindings))ek(t)||(e[t]=i);return e}getBindings(e={bindings:[]}){this._syncDynamicResourceGenerations();let t={};for(let[i,r]of Object.entries(this.bindings))if((0,ew.YT)(r)){let n=(0,ew.l0)(e,i,{fallbackGroup:eF}),a=n?r.resolveTextureBinding(n):null;a&&(t[i]=a)}else r instanceof eO.kL?t[i]=r.buffer:(0,eO.Hd)(r)?t[i]=(0,eO.j8)(r):t[i]=r;return this._syncDynamicResourceGenerations(),t}getBindingsByGroup(e={bindings:[]}){return this.factory.getBindingsByGroup(this.getBindings(e))}getBindGroupCacheKey(e){return this._syncDynamicResourceGenerations(),e===eF?this._bindGroupCacheToken:null}getBindingsUpdateTimestamp(){let e=0;for(let t of Object.values(this.bindings))t instanceof eE.X?e=Math.max(e,t.texture.updateTimestamp):t instanceof eN.h||t instanceof eL.g||t instanceof eP.r||t instanceof eO.kL?e=Math.max(e,t.updateTimestamp):(0,ew.YT)(t)?e=t.isReady?Math.max(e,t.updateTimestamp):1/0:(0,eO.Hd)(t)&&(e=Math.max(e,(t.buffer instanceof eO.kL,t.buffer.updateTimestamp)));return e}_replaceOwnedBindings(e){this._setOwnedBindings(e)&&(this._bindGroupCacheToken={})}_setOwnedBindings(e){let t=!1;for(let[i,r]of Object.entries(e))void 0!==r&&this.ownsBinding(i)&&this.bindings[i]!==r&&(this.bindings[i]=r,t=!0);return t}_syncDynamicResourceGenerations(){let e={},t=!1;for(let[r,n]of Object.entries(this.bindings)){var i;let a=(i=n,(0,ew.YT)(i)?i.generation:(0,eO.Xk)(i)?.generation??null);null!==a&&(e[r]=a,this._dynamicResourceGenerations[r]!==a&&(t=!0))}Object.keys(e).length!==Object.keys(this._dynamicResourceGenerations).length&&(t=!0),this._dynamicResourceGenerations=e,t&&(this._bindGroupCacheToken={})}}let eF=3;class eH{device;modules;_materialBindingNames;_materialModuleNames;constructor(e,t={}){this.device=e,this.modules=t.modules||[];let i=new ey.l(Object.fromEntries(this.modules.map(e=>[e.name,e])));this._materialBindingNames=function(e){let t=new Set;for(let i of Object.values(e.modules))for(let e of i.bindingLayout||[])e.group===eF&&t.add(e.name);return t}(i),this._materialModuleNames=function(e){let t=new Set;for(let i of Object.values(e.modules))i.name&&i.bindingLayout?.some(e=>e.group===eF&&e.name===i.name)&&t.add(i.name);return t}(i)}createMaterial(e={}){return new eV(this.device,{...e,factory:this})}getBindingNames(){return Array.from(this._materialBindingNames)}ownsBinding(e){if(this._materialBindingNames.has(e))return!0;let t=ek(e);return!!t&&this._materialModuleNames.has(t)}ownsModule(e){return this._materialModuleNames.has(e)}getBindingsByGroup(e){return Object.keys(e).length>0?{[eF]:e}:{}}}function ek(e){return e.endsWith("Uniforms")?e.slice(0,-8):null}var eD=i(25337),eB=i(11205);function eG(e){let t=e.value;if(t instanceof Float32Array)return t;let i=new Float32Array(t.length),r=ez(t),n=t instanceof Int8Array||t instanceof Int16Array||t instanceof Int32Array;for(let a=0;a<t.length;a++){let s=Number(t[a]);i[a]=e.normalized&&r?n?Math.max(s/r,-1):s/r:s}return i}function ez(e){return e instanceof Int8Array?127:e instanceof Uint8Array||e instanceof Uint8ClampedArray?255:e instanceof Int16Array?32767:e instanceof Uint16Array?65535:e instanceof Int32Array?0x7fffffff:0xffffffff*(e instanceof Uint32Array)}var ej=i(29936);class eK extends Array{clone(){return new this.constructor().copy(this)}fromArray(e,t=0){for(let i=0;i<this.ELEMENTS;++i)this[i]=e[i+t];return this.check()}toArray(e=[],t=0){for(let i=0;i<this.ELEMENTS;++i)e[t+i]=this[i];return e}toObject(e){return e}from(e){return Array.isArray(e)?this.copy(e):this.fromObject(e)}to(e){return e===this?this:(0,ej.cy)(e)?this.toArray(e):this.toObject(e)}toTarget(e){return e?this.to(e):this}toString(){return this.formatString(ej.$W)}formatString(e){let t="";for(let i=0;i<this.ELEMENTS;++i)t+=(i>0?", ":"")+(0,ej.Fl)(this[i],e);return`${e.printTypes?this.constructor.name:""}[${t}]`}equals(e){if(!e||this.length!==e.length)return!1;for(let t=0;t<this.ELEMENTS;++t)if(!(0,ej.aI)(this[t],e[t]))return!1;return!0}exactEquals(e){if(!e||this.length!==e.length)return!1;for(let t=0;t<this.ELEMENTS;++t)if(this[t]!==e[t])return!1;return!0}negate(){for(let e=0;e<this.ELEMENTS;++e)this[e]=-this[e];return this.check()}lerp(e,t,i){if(void 0===i)return this.lerp(this,e,t);for(let r=0;r<this.ELEMENTS;++r){let n=e[r],a="number"==typeof t?t:t[r];this[r]=n+i*(a-n)}return this.check()}min(e){for(let t=0;t<this.ELEMENTS;++t)this[t]=Math.min(e[t],this[t]);return this.check()}max(e){for(let t=0;t<this.ELEMENTS;++t)this[t]=Math.max(e[t],this[t]);return this.check()}clamp(e,t){for(let i=0;i<this.ELEMENTS;++i)this[i]=Math.min(Math.max(this[i],e[i]),t[i]);return this.check()}add(...e){for(let t of e)for(let e=0;e<this.ELEMENTS;++e)this[e]+=t[e];return this.check()}subtract(...e){for(let t of e)for(let e=0;e<this.ELEMENTS;++e)this[e]-=t[e];return this.check()}scale(e){if("number"==typeof e)for(let t=0;t<this.ELEMENTS;++t)this[t]*=e;else for(let t=0;t<this.ELEMENTS&&t<e.length;++t)this[t]*=e[t];return this.check()}multiplyByScalar(e){for(let t=0;t<this.ELEMENTS;++t)this[t]*=e;return this.check()}check(){if(ej.$W.debug&&!this.validate())throw Error(`math.gl: ${this.constructor.name} some fields set to invalid numbers'`);return this}validate(){let e=this.length===this.ELEMENTS;for(let t=0;t<this.ELEMENTS;++t)e=e&&Number.isFinite(this[t]);return e}}function eW(e,t,i=""){if(ej.$W.debug&&!function(e,t){if(e.length!==t)return!1;for(let t=0;t<e.length;++t)if(!Number.isFinite(e[t]))return!1;return!0}(e,t))throw Error(`math.gl: ${i} some fields set to invalid numbers'`);return e}class e$ extends eK{toString(){let e="[";if(ej.$W.printRowMajor){e+="row-major:";for(let t=0;t<this.RANK;++t)for(let i=0;i<this.RANK;++i)e+=` ${this[i*this.RANK+t]}`}else{e+="column-major:";for(let t=0;t<this.ELEMENTS;++t)e+=` ${this[t]}`}return e+"]"}getElementIndex(e,t){return t*this.RANK+e}getElement(e,t){return this[t*this.RANK+e]}setElement(e,t,i){return this[t*this.RANK+e]=function(e){if(!Number.isFinite(e))throw Error(`Invalid number ${JSON.stringify(e)}`);return e}(i),this}getColumn(e,t=Array(this.RANK).fill(-0)){let i=e*this.RANK;for(let e=0;e<this.RANK;++e)t[e]=this[i+e];return t}setColumn(e,t){let i=e*this.RANK;for(let e=0;e<this.RANK;++e)this[i+e]=t[e];return this}}function eq(e,t,i){let r=t[0],n=t[1],a=t[2],s=t[3],o=t[4],l=t[5],c=t[6],f=t[7],u=t[8],p=t[9],h=t[10],m=t[11],d=t[12],g=t[13],b=t[14],v=t[15],S=i[0],_=i[1],x=i[2],M=i[3];return e[0]=S*r+_*o+x*u+M*d,e[1]=S*n+_*l+x*p+M*g,e[2]=S*a+_*c+x*h+M*b,e[3]=S*s+_*f+x*m+M*v,S=i[4],_=i[5],x=i[6],M=i[7],e[4]=S*r+_*o+x*u+M*d,e[5]=S*n+_*l+x*p+M*g,e[6]=S*a+_*c+x*h+M*b,e[7]=S*s+_*f+x*m+M*v,S=i[8],_=i[9],x=i[10],M=i[11],e[8]=S*r+_*o+x*u+M*d,e[9]=S*n+_*l+x*p+M*g,e[10]=S*a+_*c+x*h+M*b,e[11]=S*s+_*f+x*m+M*v,S=i[12],_=i[13],x=i[14],M=i[15],e[12]=S*r+_*o+x*u+M*d,e[13]=S*n+_*l+x*p+M*g,e[14]=S*a+_*c+x*h+M*b,e[15]=S*s+_*f+x*m+M*v,e}let eX=function(e,t,i,r,n){let a=1/Math.tan(t/2);if(e[0]=a/i,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=a,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[11]=-1,e[12]=0,e[13]=0,e[15]=0,null!=n&&n!==1/0){let t=1/(r-n);e[10]=(n+r)*t,e[14]=2*n*r*t}else e[10]=-1,e[14]=-2*r;return e},eJ=function(e,t,i,r,n,a,s){let o=1/(t-i),l=1/(r-n),c=1/(a-s);return e[0]=-2*o,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=-2*l,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[10]=2*c,e[11]=0,e[12]=(t+i)*o,e[13]=(n+r)*l,e[14]=(s+a)*c,e[15]=1,e};function eY(e){if(16!==e.length||Array.from(e).some(e=>!Number.isFinite(e))||0!==e[3]||0!==e[7]||0!==e[11]||1!==e[15])throw RangeError("Expected a finite affine matrix");let t=[Math.hypot(e[0],e[1],e[2]),Math.hypot(e[4],e[5],e[6]),Math.hypot(e[8],e[9],e[10])];if(t.some(e=>0===e||!Number.isFinite(e)))throw RangeError("Singular transform");let i=Array.from({length:9},(i,r)=>e[4*Math.floor(r/3)+r%3]/t[Math.floor(r/3)]);for(let[e,t]of[[0,3],[0,6],[3,6]])if(Math.abs(i[e]*i[t]+i[e+1]*i[t+1]+i[e+2]*i[t+2])>1e-7)throw RangeError("Sheared transforms do not have a TRS decomposition");if(i[0]*(i[4]*i[8]-i[5]*i[7])-i[3]*(i[1]*i[8]-i[2]*i[7])+i[6]*(i[1]*i[5]-i[2]*i[4])<0){t[0]=-t[0];for(let e=0;e<3;e++)i[e]=-i[e]}return{rotation:i,scale:t,translation:[e[12],e[13],e[14]]}}(p=m||(m={}))[p.COL0ROW0=0]="COL0ROW0",p[p.COL0ROW1=1]="COL0ROW1",p[p.COL0ROW2=2]="COL0ROW2",p[p.COL0ROW3=3]="COL0ROW3",p[p.COL1ROW0=4]="COL1ROW0",p[p.COL1ROW1=5]="COL1ROW1",p[p.COL1ROW2=6]="COL1ROW2",p[p.COL1ROW3=7]="COL1ROW3",p[p.COL2ROW0=8]="COL2ROW0",p[p.COL2ROW1=9]="COL2ROW1",p[p.COL2ROW2=10]="COL2ROW2",p[p.COL2ROW3=11]="COL2ROW3",p[p.COL3ROW0=12]="COL3ROW0",p[p.COL3ROW1=13]="COL3ROW1",p[p.COL3ROW2=14]="COL3ROW2",p[p.COL3ROW3=15]="COL3ROW3";let eZ=45*Math.PI/180,eQ=Object.freeze([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);class e0 extends e${static get IDENTITY(){return o||Object.freeze(o=new e0),o}static get ZERO(){return s||Object.freeze(s=new e0([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0])),s}get ELEMENTS(){return 16}get RANK(){return 4}get INDICES(){return m}constructor(e){super(-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0),1==arguments.length&&Array.isArray(e)?this.copy(e):this.identity()}copy(e){return this[0]=e[0],this[1]=e[1],this[2]=e[2],this[3]=e[3],this[4]=e[4],this[5]=e[5],this[6]=e[6],this[7]=e[7],this[8]=e[8],this[9]=e[9],this[10]=e[10],this[11]=e[11],this[12]=e[12],this[13]=e[13],this[14]=e[14],this[15]=e[15],this.check()}set(e,t,i,r,n,a,s,o,l,c,f,u,p,h,m,d){return this[0]=e,this[1]=t,this[2]=i,this[3]=r,this[4]=n,this[5]=a,this[6]=s,this[7]=o,this[8]=l,this[9]=c,this[10]=f,this[11]=u,this[12]=p,this[13]=h,this[14]=m,this[15]=d,this.check()}setRowMajor(e,t,i,r,n,a,s,o,l,c,f,u,p,h,m,d){return this[0]=e,this[1]=n,this[2]=l,this[3]=p,this[4]=t,this[5]=a,this[6]=c,this[7]=h,this[8]=i,this[9]=s,this[10]=f,this[11]=m,this[12]=r,this[13]=o,this[14]=u,this[15]=d,this.check()}toRowMajor(e){return e[0]=this[0],e[1]=this[4],e[2]=this[8],e[3]=this[12],e[4]=this[1],e[5]=this[5],e[6]=this[9],e[7]=this[13],e[8]=this[2],e[9]=this[6],e[10]=this[10],e[11]=this[14],e[12]=this[3],e[13]=this[7],e[14]=this[11],e[15]=this[15],e}identity(){return this.copy(eQ)}fromObject(e){return this.check()}fromQuaternion(e){let t,i,r,n,a,s,o,l,c,f,u,p,h,m,d,g;return t=e[0],i=e[1],r=e[2],n=e[3],a=t+t,s=i+i,o=r+r,l=t*a,c=i*a,f=i*s,u=r*a,p=r*s,h=r*o,m=n*a,d=n*s,g=n*o,this[0]=1-f-h,this[1]=c+g,this[2]=u-d,this[3]=0,this[4]=c-g,this[5]=1-l-h,this[6]=p+m,this[7]=0,this[8]=u+d,this[9]=p-m,this[10]=1-l-f,this[11]=0,this[12]=0,this[13]=0,this[14]=0,this[15]=1,this.check()}fromMatrix3(e){return this.set(e[0],e[1],e[2],0,e[3],e[4],e[5],0,e[6],e[7],e[8],0,0,0,0,1)}frustum(e){let{left:t,right:i,bottom:r,top:n,near:a=.1,far:s=500}=e;if(s===1/0){var o,l,c,f,u,p;o=this,l=t,c=i,f=r,u=n,p=a,o[0]=2*p/(c-l),o[1]=0,o[2]=0,o[3]=0,o[4]=0,o[5]=2*p/(u-f),o[6]=0,o[7]=0,o[8]=(c+l)/(c-l),o[9]=(u+f)/(u-f),o[10]=-1,o[11]=-1,o[12]=0,o[13]=0,o[14]=-2*p,o[15]=0}else{let e,o,l;e=1/(i-t),o=1/(n-r),l=1/(a-s),this[0]=2*a*e,this[1]=0,this[2]=0,this[3]=0,this[4]=0,this[5]=2*a*o,this[6]=0,this[7]=0,this[8]=(i+t)*e,this[9]=(n+r)*o,this[10]=(s+a)*l,this[11]=-1,this[12]=0,this[13]=0,this[14]=s*a*2*l,this[15]=0}return this.check()}lookAt(e){let{eye:t,center:i=[0,0,0],up:r=[0,1,0]}=e;return!function(e,t,i,r){let n,a,s,o,l,c,f,u,p,h,m=t[0],d=t[1],g=t[2],b=r[0],v=r[1],S=r[2],_=i[0],x=i[1],M=i[2];if(1e-6>Math.abs(m-_)&&1e-6>Math.abs(d-x)&&1e-6>Math.abs(g-M))return e[0]=1,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=1,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[10]=1,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1;n=1/Math.sqrt((u=m-_)*u+(p=d-x)*p+(h=g-M)*h),u*=n,p*=n,h*=n,(n=Math.sqrt((a=v*h-S*p)*a+(s=S*u-b*h)*s+(o=b*p-v*u)*o))?(a*=n=1/n,s*=n,o*=n):(a=0,s=0,o=0),(n=Math.sqrt((l=p*o-h*s)*l+(c=h*a-u*o)*c+(f=u*s-p*a)*f))?(l*=n=1/n,c*=n,f*=n):(l=0,c=0,f=0),e[0]=a,e[1]=l,e[2]=u,e[3]=0,e[4]=s,e[5]=c,e[6]=p,e[7]=0,e[8]=o,e[9]=f,e[10]=h,e[11]=0,e[12]=-(a*m+s*d+o*g),e[13]=-(l*m+c*d+f*g),e[14]=-(u*m+p*d+h*g),e[15]=1}(this,t,i,r),this.check()}ortho(e){let{left:t,right:i,bottom:r,top:n,near:a=.1,far:s=500}=e;return eJ(this,t,i,r,n,a,s),this.check()}orthographic(e){let{fovy:t=eZ,aspect:i=1,focalDistance:r=1,near:n=.1,far:a=500}=e;e1(t);let s=r*Math.tan(t/2),o=s*i;return this.ortho({left:-o,right:o,bottom:-s,top:s,near:n,far:a})}perspective(e){let{fovy:t=45*Math.PI/180,aspect:i=1,near:r=.1,far:n=500}=e;return e1(t),eX(this,t,i,r,n),this.check()}determinant(){let e,t,i,r,n,a,s,o,l,c,f,u,p,h,m,d,g,b,v,S,_,x;return e=this[0],t=this[1],i=this[2],r=this[3],n=this[4],a=this[5],s=this[6],o=this[7],l=this[8],c=this[9],f=this[10],u=this[11],p=this[12],h=this[13],m=this[14],d=this[15],g=e*a-t*n,b=e*s-i*n,v=t*s-i*a,S=l*h-c*p,_=l*m-f*p,o*(e*(x=c*m-f*h)-t*_+i*S)-r*(n*x-a*_+s*S)+d*(l*v-c*b+f*g)-u*(p*v-h*b+m*g)}getScale(e=[-0,-0,-0]){return e[0]=Math.sqrt(this[0]*this[0]+this[1]*this[1]+this[2]*this[2]),e[1]=Math.sqrt(this[4]*this[4]+this[5]*this[5]+this[6]*this[6]),e[2]=Math.sqrt(this[8]*this[8]+this[9]*this[9]+this[10]*this[10]),e}getTranslation(e=[-0,-0,-0]){return e[0]=this[12],e[1]=this[13],e[2]=this[14],e}getRotation(e,t){let{rotation:i,scale:r}=eY(this);if(e=e||Array(16),t)for(let e=0;e<3;e++)t[e]=r[e];for(let t=0;t<16;t++)e[t]=0;for(let t=0;t<9;t++)e[4*Math.floor(t/3)+t%3]=i[t];return e[15]=1,e}getRotationMatrix3(e,t){let{rotation:i,scale:r}=eY(this);if(e=e||Array(9),t)for(let e=0;e<3;e++)t[e]=r[e];for(let t=0;t<9;t++)e[t]=i[t];return e}transpose(){return!function(e,t){if(e===t){let i=t[1],r=t[2],n=t[3],a=t[6],s=t[7],o=t[11];e[1]=t[4],e[2]=t[8],e[3]=t[12],e[4]=i,e[6]=t[9],e[7]=t[13],e[8]=r,e[9]=a,e[11]=t[14],e[12]=n,e[13]=s,e[14]=o}else e[0]=t[0],e[1]=t[4],e[2]=t[8],e[3]=t[12],e[4]=t[1],e[5]=t[5],e[6]=t[9],e[7]=t[13],e[8]=t[2],e[9]=t[6],e[10]=t[10],e[11]=t[14],e[12]=t[3],e[13]=t[7],e[14]=t[11],e[15]=t[15]}(this,this),this.check()}invert(){let e,t,i,r,n,a,s,o,l,c,f,u,p,h,m,d,g,b,v,S,_,x,M,R,T,C,I,y,A;return e=this[0],t=this[1],i=this[2],r=this[3],n=this[4],a=this[5],s=this[6],o=this[7],l=this[8],c=this[9],f=this[10],u=this[11],p=this[12],h=this[13],m=this[14],d=this[15],g=e*a-t*n,b=e*s-i*n,v=e*o-r*n,S=t*s-i*a,_=t*o-r*a,x=i*o-r*s,M=l*h-c*p,R=l*m-f*p,T=l*d-u*p,C=c*m-f*h,I=c*d-u*h,(A=g*(y=f*d-u*m)-b*I+v*C+S*T-_*R+x*M)&&(A=1/A,this[0]=(a*y-s*I+o*C)*A,this[1]=(i*I-t*y-r*C)*A,this[2]=(h*x-m*_+d*S)*A,this[3]=(f*_-c*x-u*S)*A,this[4]=(s*T-n*y-o*R)*A,this[5]=(e*y-i*T+r*R)*A,this[6]=(m*v-p*x-d*b)*A,this[7]=(l*x-f*v+u*b)*A,this[8]=(n*I-a*T+o*M)*A,this[9]=(t*T-e*I-r*M)*A,this[10]=(p*_-h*v+d*g)*A,this[11]=(c*v-l*_-u*g)*A,this[12]=(a*R-n*C-s*M)*A,this[13]=(e*C-t*R+i*M)*A,this[14]=(h*b-p*S-m*g)*A,this[15]=(l*S-c*b+f*g)*A),this.check()}multiplyLeft(e){return eq(this,e,this),this.check()}multiplyRight(e){return eq(this,this,e),this.check()}rotateX(e){let t,i,r,n,a,s,o,l,c,f;return t=Math.sin(e),i=Math.cos(e),r=this[4],n=this[5],a=this[6],s=this[7],o=this[8],l=this[9],c=this[10],f=this[11],this!==this&&(this[0]=this[0],this[1]=this[1],this[2]=this[2],this[3]=this[3],this[12]=this[12],this[13]=this[13],this[14]=this[14],this[15]=this[15]),this[4]=r*i+o*t,this[5]=n*i+l*t,this[6]=a*i+c*t,this[7]=s*i+f*t,this[8]=o*i-r*t,this[9]=l*i-n*t,this[10]=c*i-a*t,this[11]=f*i-s*t,this.check()}rotateY(e){let t,i,r,n,a,s,o,l,c,f;return t=Math.sin(e),i=Math.cos(e),r=this[0],n=this[1],a=this[2],s=this[3],o=this[8],l=this[9],c=this[10],f=this[11],this!==this&&(this[4]=this[4],this[5]=this[5],this[6]=this[6],this[7]=this[7],this[12]=this[12],this[13]=this[13],this[14]=this[14],this[15]=this[15]),this[0]=r*i-o*t,this[1]=n*i-l*t,this[2]=a*i-c*t,this[3]=s*i-f*t,this[8]=r*t+o*i,this[9]=n*t+l*i,this[10]=a*t+c*i,this[11]=s*t+f*i,this.check()}rotateZ(e){let t,i,r,n,a,s,o,l,c,f;return t=Math.sin(e),i=Math.cos(e),r=this[0],n=this[1],a=this[2],s=this[3],o=this[4],l=this[5],c=this[6],f=this[7],this!==this&&(this[8]=this[8],this[9]=this[9],this[10]=this[10],this[11]=this[11],this[12]=this[12],this[13]=this[13],this[14]=this[14],this[15]=this[15]),this[0]=r*i+o*t,this[1]=n*i+l*t,this[2]=a*i+c*t,this[3]=s*i+f*t,this[4]=o*i-r*t,this[5]=l*i-n*t,this[6]=c*i-a*t,this[7]=f*i-s*t,this.check()}rotateXYZ(e){return this.rotateX(e[0]).rotateY(e[1]).rotateZ(e[2])}rotateAxis(e,t){let i,r,n,a,s,o,l,c,f,u,p,h,m,d,g,b,v,S,_,x,M,R,T,C,I,y,A,E;return I=t[0],(E=Math.sqrt(I*I+(y=t[1])*y+(A=t[2])*A))<1e-6||(I*=E=1/E,y*=E,A*=E,r=Math.sin(e),n=1-(i=Math.cos(e)),a=this[0],s=this[1],o=this[2],l=this[3],c=this[4],f=this[5],u=this[6],p=this[7],h=this[8],m=this[9],d=this[10],g=this[11],b=I*I*n+i,v=y*I*n+A*r,S=A*I*n-y*r,_=I*y*n-A*r,x=y*y*n+i,M=A*y*n+I*r,R=I*A*n+y*r,T=y*A*n-I*r,C=A*A*n+i,this[0]=a*b+c*v+h*S,this[1]=s*b+f*v+m*S,this[2]=o*b+u*v+d*S,this[3]=l*b+p*v+g*S,this[4]=a*_+c*x+h*M,this[5]=s*_+f*x+m*M,this[6]=o*_+u*x+d*M,this[7]=l*_+p*x+g*M,this[8]=a*R+c*T+h*C,this[9]=s*R+f*T+m*C,this[10]=o*R+u*T+d*C,this[11]=l*R+p*T+g*C,this!==this&&(this[12]=this[12],this[13]=this[13],this[14]=this[14],this[15]=this[15])),this.check()}scale(e){var t;let i,r,n;return i=(t=Array.isArray(e)?e:[e,e,e])[0],r=t[1],n=t[2],this[0]=this[0]*i,this[1]=this[1]*i,this[2]=this[2]*i,this[3]=this[3]*i,this[4]=this[4]*r,this[5]=this[5]*r,this[6]=this[6]*r,this[7]=this[7]*r,this[8]=this[8]*n,this[9]=this[9]*n,this[10]=this[10]*n,this[11]=this[11]*n,this[12]=this[12],this[13]=this[13],this[14]=this[14],this[15]=this[15],this.check()}translate(e){let t,i,r,n,a,s,o,l,c,f,u,p,h,m,d;return h=e[0],m=e[1],d=e[2],this===this?(this[12]=this[0]*h+this[4]*m+this[8]*d+this[12],this[13]=this[1]*h+this[5]*m+this[9]*d+this[13],this[14]=this[2]*h+this[6]*m+this[10]*d+this[14],this[15]=this[3]*h+this[7]*m+this[11]*d+this[15]):(t=this[0],i=this[1],r=this[2],n=this[3],a=this[4],s=this[5],o=this[6],l=this[7],c=this[8],f=this[9],u=this[10],p=this[11],this[0]=t,this[1]=i,this[2]=r,this[3]=n,this[4]=a,this[5]=s,this[6]=o,this[7]=l,this[8]=c,this[9]=f,this[10]=u,this[11]=p,this[12]=t*h+a*m+c*d+this[12],this[13]=i*h+s*m+f*d+this[13],this[14]=r*h+o*m+u*d+this[14],this[15]=n*h+l*m+p*d+this[15]),this.check()}transform(e,t){if(4===e.length){var i;let r,n,a,s;return i=t||[-0,-0,-0,-0],r=e[0],n=e[1],a=e[2],s=e[3],i[0]=this[0]*r+this[4]*n+this[8]*a+this[12]*s,i[1]=this[1]*r+this[5]*n+this[9]*a+this[13]*s,i[2]=this[2]*r+this[6]*n+this[10]*a+this[14]*s,i[3]=this[3]*r+this[7]*n+this[11]*a+this[15]*s,eW(t=i,4),t}return this.transformAsPoint(e,t)}transformAsPoint(e,t){var i,r;let n,a,s,o,l,c,f,{length:u}=e;switch(u){case 2:i=t||[-0,-0],a=e[0],s=e[1],i[0]=this[0]*a+this[4]*s+this[12],i[1]=this[1]*a+this[5]*s+this[13],n=i;break;case 3:r=t||[-0,-0,-0],o=e[0],l=e[1],c=e[2],f=(f=this[3]*o+this[7]*l+this[11]*c+this[15])||1,r[0]=(this[0]*o+this[4]*l+this[8]*c+this[12])/f,r[1]=(this[1]*o+this[5]*l+this[9]*c+this[13])/f,r[2]=(this[2]*o+this[6]*l+this[10]*c+this[14])/f,n=r;break;default:throw Error("Illegal vector")}return eW(n,e.length),n}transformAsVector(e,t){var i,r;let n,a,s,o,l,c,f,u;switch(e.length){case 2:i=t||[-0,-0],a=e[0],s=e[1],o=this[3]*a+this[7]*s||1,i[0]=(this[0]*a+this[4]*s)/o,i[1]=(this[1]*a+this[5]*s)/o,n=i;break;case 3:r=t||[-0,-0,-0],l=e[0],c=e[1],f=e[2],u=this[3]*l+this[7]*c+this[11]*f||1,r[0]=(this[0]*l+this[4]*c+this[8]*f)/u,r[1]=(this[1]*l+this[5]*c+this[9]*f)/u,r[2]=(this[2]*l+this[6]*c+this[10]*f)/u,n=r;break;default:throw Error("Illegal vector")}return eW(n,e.length),n}makeRotationX(e){return this.identity().rotateX(e)}makeTranslation(e,t,i){return this.identity().translate([e,t,i])}}function e1(e){if(e>2*Math.PI)throw Error("expected radians")}let e3={props:{},uniforms:{},bindings:{},name:"skin",bindingLayout:[{name:"skin",group:0},{name:"skinJointMatrices",group:0,visibility:1}],dependencies:[],source:`
struct skinUniforms {
  jointMatrix: array<mat4x4<f32>, 64>,
};

@group(0) @binding(auto) var<uniform> skin: skinUniforms;

#ifdef HAS_INSTANCED_SKIN
@group(0) @binding(auto) var<storage, read> skinJointMatrices: array<mat4x4<f32>>;

fn getInstancedSkinMatrix(
  weights: vec4f,
  joints: vec4u,
  instanceIndex: u32,
  jointsPerInstance: u32
) -> mat4x4<f32> {
  let firstJoint = instanceIndex * jointsPerInstance;
  return (weights.x * skinJointMatrices[firstJoint + joints.x])
       + (weights.y * skinJointMatrices[firstJoint + joints.y])
       + (weights.z * skinJointMatrices[firstJoint + joints.z])
       + (weights.w * skinJointMatrices[firstJoint + joints.w]);
}
#else
#ifdef HAS_LARGE_SKIN
@group(0) @binding(auto) var<storage, read> skinJointMatrices: array<mat4x4<f32>>;
#endif
#endif

fn getSkinMatrix(weights: vec4f, joints: vec4u) -> mat4x4<f32> {
#ifdef HAS_LARGE_SKIN
  return (weights.x * skinJointMatrices[joints.x])
       + (weights.y * skinJointMatrices[joints.y])
       + (weights.z * skinJointMatrices[joints.z])
       + (weights.w * skinJointMatrices[joints.w]);
#else
  return (weights.x * skin.jointMatrix[joints.x])
       + (weights.y * skin.jointMatrix[joints.y])
       + (weights.z * skin.jointMatrix[joints.z])
       + (weights.w * skin.jointMatrix[joints.w]);
#endif
}
`,vs:`\

layout(std140) uniform skinUniforms {
  mat4 jointMatrix[SKIN_MAX_JOINTS];
} skin;

#ifdef HAS_INSTANCED_SKIN
uniform highp sampler2D skinJointMatrices;

mat4 getInstancedJointMatrix(uint jointIndex, uint instanceIndex) {
  int firstColumn = int(jointIndex * 4u);
  int row = int(instanceIndex);
  return mat4(
    texelFetch(skinJointMatrices, ivec2(firstColumn, row), 0),
    texelFetch(skinJointMatrices, ivec2(firstColumn + 1, row), 0),
    texelFetch(skinJointMatrices, ivec2(firstColumn + 2, row), 0),
    texelFetch(skinJointMatrices, ivec2(firstColumn + 3, row), 0)
  );
}

mat4 getInstancedSkinMatrix(
  vec4 weights,
  uvec4 joints,
  uint instanceIndex,
  uint jointsPerInstance
) {
  return (weights.x * getInstancedJointMatrix(joints.x, instanceIndex))
       + (weights.y * getInstancedJointMatrix(joints.y, instanceIndex))
       + (weights.z * getInstancedJointMatrix(joints.z, instanceIndex))
       + (weights.w * getInstancedJointMatrix(joints.w, instanceIndex));
}
#else
#ifdef HAS_LARGE_SKIN
uniform highp sampler2D skinJointMatrices;

mat4 getSkinJointMatrix(uint jointIndex) {
  int firstColumn = int(jointIndex * 4u);
  return mat4(
    texelFetch(skinJointMatrices, ivec2(firstColumn, 0), 0),
    texelFetch(skinJointMatrices, ivec2(firstColumn + 1, 0), 0),
    texelFetch(skinJointMatrices, ivec2(firstColumn + 2, 0), 0),
    texelFetch(skinJointMatrices, ivec2(firstColumn + 3, 0), 0)
  );
}
#endif
#endif

mat4 getSkinMatrix(vec4 weights, uvec4 joints) {
#ifdef HAS_LARGE_SKIN
  return (weights.x * getSkinJointMatrix(joints.x))
       + (weights.y * getSkinJointMatrix(joints.y))
       + (weights.z * getSkinJointMatrix(joints.z))
       + (weights.w * getSkinJointMatrix(joints.w));
#else
  return (weights.x * skin.jointMatrix[joints.x])
       + (weights.y * skin.jointMatrix[joints.y])
       + (weights.z * skin.jointMatrix[joints.z])
       + (weights.w * skin.jointMatrix[joints.w]);
#endif
}

`,fs:"",defines:{SKIN_MAX_JOINTS:64},getUniforms:(e={},t)=>{let{jointMatrices:i,skinJointMatrices:r,scenegraphsFromGLTF:n,skinIndex:a=0,meshWorldMatrix:s}=e,o=r?{skinJointMatrices:r}:{};if(i){var l;let e;return{jointMatrix:(l=i,(e=new Float32Array(1024)).set(l instanceof Float32Array?l.subarray(0,e.length):l.slice(0,e.length)),e),...o}}let c=n?.gltf?.skins?.[a];if(!c)return{jointMatrix:[],...o};let{inverseBindMatrices:f,joints:u,skeleton:p}=c,h=n.gltfNodeIndexToNodeMap,m=new Map,d=void 0===p?void 0:h?.get(p);for(let e of d?[d]:n.scenes||[])e.preorderTraversal((e,{worldMatrix:t})=>{m.set(e.id,t)});let g=s?new e0(s).invert():null,b=new Float32Array(1024),v=f?.value;for(let e=0;e<Math.min(u.length,64);e++){let t=h?.get(u[e]);if(!t)continue;let i=m.get(t.id)||t.matrix,r=g?new e0(g).multiplyRight(i):new e0(i);v&&v.length>=(e+1)*16&&r.multiplyRight(new e0(Array.from(v.slice(16*e,(e+1)*16)))),b.set(r,16*e)}return{jointMatrix:b,...o}},uniformTypes:{jointMatrix:["mat4x4<f32>",64]}},e2={name:"publishedTransforms",uniformTypes:{bodyIndex:"i32",viewProjection:"mat4x4<f32>"},defaultUniforms:{bodyIndex:-1},source:`
struct PublishedTransforms {bodyIndex:i32,viewProjection:mat4x4f}
@group(0) @binding(auto) var<uniform> publishedTransforms:PublishedTransforms;
@group(0) @binding(auto) var<storage,read> publishedBodyMatrices:array<mat4x4f>;
`,bindingLayout:[{name:"publishedBodyMatrices",group:0}]};var e4=i(4090),e5=i(33027),e6=i(2116),e9=i(90153);let e8={"+X":0,"-X":1,"+Y":2,"-Y":3,"+Z":4,"-Z":5};function e7(e){return e?Array.isArray(e)?e[0]??null:e:null}function te(e){if((0,e9.x)(e))return(0,e9.c)(e);if("object"==typeof e&&"width"in e&&"height"in e)return{width:e.width,height:e.height};throw Error("Unsupported mip-level data")}function tt(e){let{textureFormat:t,format:i}=e;if(t&&i&&t!==i)throw Error(`Conflicting texture formats "${t}" and "${i}" provided for the same mip level`);return t??i}function ti(e){let t=e8[e];if(void 0===t)throw Error(`Invalid cube face: ${e}`);return t}function tr(e){throw Error("setTexture1DData not supported in WebGL.")}function tn(e,t,i,r){let n=Array.isArray(t)?t:[t],a=[];for(let t=0;t<n.length;t++){let s=n[t];if((0,e9.x)(s))a.push({type:"external-image",image:s,z:e,mipLevel:t});else if("object"==typeof s&&null!==s&&"data"in s&&"width"in s&&"height"in s)a.push({type:"texture-data",data:s,textureFormat:tt(s),z:e,mipLevel:t});else if(ArrayBuffer.isView(s)&&i)a.push({type:"texture-data",data:{data:s,width:Math.max(1,i.width>>t),height:Math.max(1,i.height>>t),...r?{format:r}:{}},textureFormat:r,z:e,mipLevel:t});else throw Error("Unsupported 2D mip-level payload")}return a}function ta(e){let t=[];for(let i=0;i<e.length;i++)t.push(...tn(i,e[i]));return t}function ts(e){let t=[];for(let i=0;i<e.length;i++)t.push(...tn(i,e[i]));return t}function to(e){let t=[];for(let[i,r]of Object.entries(e)){let e=ti(i);t.push(...tn(e,r))}return t}function tl(e){let t=[];return e.forEach((e,i)=>{for(let[r,n]of Object.entries(e)){let e=6*i+ti(r);t.push(...tn(e,n))}}),t}class tc{device;id;props;_texture=null;_sampler=null;_view=null;ready;isReady=!1;destroyed=!1;generation=0;updateTimestamp;resolveReady=()=>{};rejectReady=()=>{};get texture(){if(!this._texture)throw Error("Texture not initialized yet");return this._texture}get sampler(){if(!this._sampler)throw Error("Sampler not initialized yet");return this._sampler}get view(){if(!this._view)throw Error("View not initialized yet");return this._view}get[Symbol.toStringTag](){return"DynamicTexture"}toString(){let e=this._texture?.width??this.props.width??"?",t=this._texture?.height??this.props.height??"?";return`DynamicTexture:"${this.id}":${e}x${t}px:(${this.isReady?"ready":"loading..."})`}resolveTextureBinding(e){return this.isReady?this.texture:null}constructor(e,t){this.device=e;let i=(0,e6.L)("dynamic-texture");this.props={...tc.defaultProps,id:i,...t,data:null},this.id=this.props.id,this.ready=new Promise((e,t)=>{this.resolveReady=e,this.rejectReady=t}),this.updateTimestamp=this.device.incrementTimestamp(),this.initAsync(t)}async initAsync(e){try{let t=await this._loadAllData(e);this._checkNotDestroyed();let i=t.data?function(e){if(!e.data)return[];let t=e.width&&e.height?{width:e.width,height:e.height}:void 0,i="format"in e?e.format:void 0;switch(e.dimension){case"1d":return tr(e.data);case"2d":return tn(0,e.data,t,i);case"3d":return ta(e.data);case"2d-array":return ts(e.data);case"cube":return to(e.data);case"cube-array":return tl(e.data);default:throw Error(`Unhandled dimension ${e.dimension}`)}}({...t,width:e.width,height:e.height,format:e.format}):[],r="format"in e&&void 0!==e.format,n="usage"in e&&void 0!==e.usage,a=(()=>{if(this.props.width&&this.props.height)return{width:this.props.width,height:this.props.height};let e=function(e){let{dimension:t,data:i}=e;if(!i)return null;switch(t){case"1d":{let e=e7(i);if(!e)return null;let{width:t}=te(e);return{width:t,height:1}}case"2d":{if(ArrayBuffer.isView(i))return null;let e=e7(i);return e?te(e):null}case"3d":case"2d-array":{if(!Array.isArray(i)||0===i.length)return null;let e=e7(i[0]);return e?te(e):null}case"cube":{let e=Object.keys(i)[0]??null;if(!e)return null;let t=e7(i[e]);return t?te(t):null}case"cube-array":{if(!Array.isArray(i)||0===i.length)return null;let e=i[0],t=Object.keys(e)[0]??null;if(!t)return null;let r=e7(e[t]);return r?te(r):null}default:return null}}(t);return e||{width:this.props.width||1,height:this.props.height||1}})();if(!a||a.width<=0||a.height<=0)throw Error(`${this} size could not be determined or was zero`);let s=function(e,t,i,r){if(0===t.length)return{subresources:t,mipLevels:1,format:r.format,hasExplicitMipChain:!1};let n=new Map;for(let e of t){let t=n.get(e.z)??[];t.push(e),n.set(e.z,t)}let a=t.some(e=>e.mipLevel>0),s=r.format,o=1/0,l=[];for(let[t,r]of n){let n=[...r].sort((e,t)=>e.mipLevel-t.mipLevel),a=n[0];if(!a||0!==a.mipLevel)throw Error(`DynamicTexture: slice ${t} is missing mip level 0`);let c=tu(e,a);if(c.width!==i.width||c.height!==i.height)throw Error(`DynamicTexture: slice ${t} base level dimensions ${c.width}x${c.height} do not match expected ${i.width}x${i.height}`);let f=tf(a);if(f){if(s&&s!==f)throw Error(`DynamicTexture: slice ${t} base level format "${f}" does not match texture format "${s}"`);s=f}let u=s&&e.isTextureFormatCompressed(s)?function(e,t,i,r){let{blockWidth:n=1,blockHeight:a=1}=e.getTextureFormatInfo(r),s=1;for(let e=1;;e++){let r=Math.max(1,t>>e),o=Math.max(1,i>>e);if(r<n||o<a)break;s++}return s}(e,c.width,c.height,s):e.getMipLevelCount(c.width,c.height),p=0;for(let t=0;t<n.length;t++){let i=n[t];if(!i||i.mipLevel!==t||t>=u)break;let r=tu(e,i),a=Math.max(1,c.width>>t),o=Math.max(1,c.height>>t);if(r.width!==a||r.height!==o)break;let f=tf(i);if(f&&(s||(s=f),f!==s))break;p++,l.push(i)}o=Math.min(o,p)}let c=Number.isFinite(o)?Math.max(1,o):1;return{subresources:l.filter(e=>e.mipLevel<c),mipLevels:c,format:s,hasExplicitMipChain:a}}(this.device,i,a,{format:r?e.format:void 0}),o=s.format??this.props.format,l={...this.props,...a,format:o,mipLevels:1,data:void 0};this.device.isTextureFormatCompressed(o)&&!n&&(l.usage=eL.g.SAMPLE|eL.g.COPY_DST);let c=this.props.mipmaps&&!s.hasExplicitMipChain&&!this.device.isTextureFormatCompressed(o);if("webgpu"===this.device.type&&c){let e="3d"===this.props.dimension?eL.g.SAMPLE|eL.g.STORAGE|eL.g.COPY_DST|eL.g.COPY_SRC:eL.g.SAMPLE|eL.g.RENDER|eL.g.COPY_DST|eL.g.COPY_SRC;l.usage|=e}let f=this.device.getMipLevelCount(l.width,l.height),u=s.hasExplicitMipChain?s.mipLevels:"auto"===this.props.mipLevels?f:Math.max(1,Math.min(f,this.props.mipLevels??1)),p={...l,mipLevels:u};this._texture=this.device.createTexture(p),this._sampler=this.texture.sampler,this._view=this.texture.view,this._touchGeneration(),s.subresources.length&&this._setTextureSubresources(s.subresources),!this.props.mipmaps||s.hasExplicitMipChain||c||W.R.warn(`${this} skipping auto-generated mipmaps for compressed texture format`)(),c&&this.generateMipmaps(),this.isReady=!0,this.resolveReady(this.texture),W.R.info(1,`${this} created`)()}catch(t){let e=t instanceof Error?t:Error(String(t));this.rejectReady(e)}}destroy(){this._texture&&(this._texture.destroy(),this._texture=null,this._sampler=null,this._view=null),this.isReady=!1,this.destroyed=!0}generateMipmaps(){"webgl"===this.device.type?(this.texture.generateMipmapsWebGL(),this._touch()):"webgpu"===this.device.type?(this.device.generateMipmapsWebGPU(this.texture),this._touch()):W.R.warn(`${this} mipmaps not supported on ${this.device.type}`)}setSampler(e={}){this._checkReady();let t=e instanceof e4.L?e:this.device.createSampler(e);this.texture.setSampler(t),this._sampler=t,this._touchGeneration()}async readBuffer(e={}){this.isReady||await this.ready;let t=e.width??this.texture.width,i=e.height??this.texture.height,r=e.depthOrArrayLayers??this.texture.depth,n=this.texture.computeMemoryLayout({width:t,height:i,depthOrArrayLayers:r}),a=this.device.createBuffer({byteLength:n.byteLength,usage:eN.h.COPY_DST|eN.h.MAP_READ});this.texture.readBuffer({...e,width:t,height:i,depthOrArrayLayers:r},a);let s=this.device.createFence();return await s.signaled,s.destroy(),a}async readAsync(e={}){this.isReady||await this.ready;let t=e.width??this.texture.width,i=e.height??this.texture.height,r=e.depthOrArrayLayers??this.texture.depth,n=this.texture.computeMemoryLayout({width:t,height:i,depthOrArrayLayers:r}),a=await this.readBuffer(e),s=await a.readAsync(0,n.byteLength);return a.destroy(),s.buffer instanceof ArrayBuffer?s.buffer:s.slice().buffer}resize(e){if(this._checkReady(),e.width===this.texture.width&&e.height===this.texture.height)return!1;let t=this.texture;return this._texture=t.clone(e),this._sampler=this.texture.sampler,this._view=this.texture.view,t.destroy(),this._touchGeneration(),W.R.info(`${this} resized`),!0}getCubeFaceIndex(e){let t=e8[e];if(void 0===t)throw Error(`Invalid cube face: ${e}`);return t}getCubeArrayFaceIndex(e,t){return 6*e+this.getCubeFaceIndex(t)}setTexture1DData(e){if(this._checkReady(),"1d"!==this.texture.props.dimension)throw Error(`${this} is not 1d`);let t=tr(e);this._setTextureSubresources(t)}setTexture2DData(e,t=0){if(this._checkReady(),"2d"!==this.texture.props.dimension)throw Error(`${this} is not 2d`);let i=tn(t,e);this._setTextureSubresources(i)}setTexture3DData(e){if("3d"!==this.texture.props.dimension)throw Error(`${this} is not 3d`);let t=ta(e);this._setTextureSubresources(t)}setTextureArrayData(e){if("2d-array"!==this.texture.props.dimension)throw Error(`${this} is not 2d-array`);let t=ts(e);this._setTextureSubresources(t)}setTextureCubeData(e){if("cube"!==this.texture.props.dimension)throw Error(`${this} is not cube`);let t=to(e);this._setTextureSubresources(t)}setTextureCubeArrayData(e){if("cube-array"!==this.texture.props.dimension)throw Error(`${this} is not cube-array`);let t=tl(e);this._setTextureSubresources(t)}_setTextureSubresources(e){for(let t of e){let{z:e,mipLevel:i}=t;switch(t.type){case"external-image":let{image:r,flipY:n}=t;this.texture.copyExternalImage({image:r,z:e,mipLevel:i,flipY:n});break;case"texture-data":let{data:a,textureFormat:s}=t;if(s&&s!==this.texture.format)throw Error(`${this} mip level ${i} uses format "${s}" but texture format is "${this.texture.format}"`);this.texture.writeData(a.data,{x:0,y:0,z:e,width:a.width,height:a.height,depthOrArrayLayers:1,mipLevel:i});break;default:throw Error("Unsupported 2D mip-level payload")}}e.length>0&&this._touch()}async _loadAllData(e){let t=await tp(e.data);return{dimension:e.dimension??"2d",data:t??null}}_checkNotDestroyed(){this.destroyed&&W.R.warn(`${this} already destroyed`)}_checkReady(){this.isReady||W.R.warn(`${this} Cannot perform this operation before ready`)}_touch(){this.updateTimestamp=this.device.incrementTimestamp()}_touchGeneration(){this.generation++,this._touch()}static defaultProps={...eL.g.defaultProps,dimension:"2d",data:null,mipmaps:!1}}function tf(e){if("texture-data"===e.type)return e.textureFormat??tt(e.data)}function tu(e,t){switch(t.type){case"external-image":return e.getExternalImageSize(t.image);case"texture-data":return{width:t.data.width,height:t.data.height};default:throw Error("Unsupported texture subresource")}}async function tp(e){if(Array.isArray(e=await e))return await Promise.all(e.map(tp));if(e&&"object"==typeof e&&e.constructor===Object){let t=e,i=await Promise.all(Object.values(t).map(tp)),r=Object.keys(t),n={};for(let e=0;e<r.length;e++)n[r[e]]=i[e];return n}return e}let th={name:"gpuAnimation",props:{},uniforms:{},bindings:{},source:`
#ifdef HAS_GPU_CROWD_ANIMATION
@group(0) @binding(auto) var<storage, read> gpuAnimationFrames: array<vec4f>;

fn readGPUAnimationFrame(frame: u32, offset: u32, frameStride: u32) -> vec4f {
  return gpuAnimationFrames[frame * frameStride + offset];
}

fn sampleGPUAnimationFrame(
  frames: vec4f,
  blend: vec4f,
  offset: u32,
  frameStride: u32
) -> vec4f {
  let first = mix(
    readGPUAnimationFrame(u32(frames.x), offset, frameStride),
    readGPUAnimationFrame(u32(frames.y), offset, frameStride),
    frames.z
  );
  if (blend.w <= 0.0) {
    return first;
  }
  let second = mix(
    readGPUAnimationFrame(u32(blend.x), offset, frameStride),
    readGPUAnimationFrame(u32(blend.y), offset, frameStride),
    blend.z
  );
  return mix(first, second, blend.w);
}

fn sampleGPUAnimationMatrix(
  frames: vec4f,
  blend: vec4f,
  firstColumn: u32,
  frameStride: u32
) -> mat4x4f {
  return mat4x4f(
    sampleGPUAnimationFrame(frames, blend, firstColumn, frameStride),
    sampleGPUAnimationFrame(frames, blend, firstColumn + 1u, frameStride),
    sampleGPUAnimationFrame(frames, blend, firstColumn + 2u, frameStride),
    sampleGPUAnimationFrame(frames, blend, firstColumn + 3u, frameStride)
  );
}

fn getGPUAnimatedSkinMatrix(
  weights: vec4f,
  joints: vec4u,
  frames: vec4f,
  blend: vec4f,
  frameStride: u32
) -> mat4x4f {
  return weights.x * sampleGPUAnimationMatrix(frames, blend, 4u + joints.x * 4u, frameStride)
       + weights.y * sampleGPUAnimationMatrix(frames, blend, 4u + joints.y * 4u, frameStride)
       + weights.z * sampleGPUAnimationMatrix(frames, blend, 4u + joints.z * 4u, frameStride)
       + weights.w * sampleGPUAnimationMatrix(frames, blend, 4u + joints.w * 4u, frameStride);
}
#endif

#ifdef HAS_INSTANCED_MORPH
@group(0) @binding(auto) var<storage, read> gpuMorphTargets: array<vec4f>;

#ifndef HAS_GPU_CROWD_ANIMATION
@group(0) @binding(auto) var<storage, read> gpuMorphWeights: array<vec4f>;
#endif

fn getGPUCrowdMorphWeight(
  instanceIndex: u32,
  targetIndex: u32,
  targetCount: u32,
  jointsPerInstance: u32,
  frames: vec4f,
  blend: vec4f,
  frameStride: u32
) -> f32 {
#ifdef HAS_GPU_CROWD_ANIMATION
  let offset = 4u + jointsPerInstance * 4u + targetIndex;
  return sampleGPUAnimationFrame(frames, blend, offset, frameStride).x;
#else
  let packedCount = (targetCount + 3u) / 4u;
  let packedWeights = gpuMorphWeights[instanceIndex * packedCount + targetIndex / 4u];
  return packedWeights[targetIndex % 4u];
#endif
}

fn getGPUCrowdMorphDelta(
  instanceIndex: u32,
  vertexIndex: u32,
  attributeIndex: u32,
  vertexCount: u32,
  targetCount: u32,
  jointsPerInstance: u32,
  frames: vec4f,
  blend: vec4f,
  frameStride: u32
) -> vec3f {
  var result = vec3f(0.0);
  for (var targetIndex = 0u; targetIndex < targetCount; targetIndex++) {
    let weight = getGPUCrowdMorphWeight(
      instanceIndex,
      targetIndex,
      targetCount,
      jointsPerInstance,
      frames,
      blend,
      frameStride
    );
    let offset = (targetIndex * 3u + attributeIndex) * vertexCount + vertexIndex;
    result += gpuMorphTargets[offset].xyz * weight;
  }
  return result;
}
#endif
`,vs:`
#ifdef HAS_GPU_CROWD_ANIMATION
uniform highp sampler2D gpuAnimationFrames;

vec4 sampleGPUAnimationFrame(vec4 frames, vec4 blend, int offset) {
  vec4 first = mix(
    texelFetch(gpuAnimationFrames, ivec2(offset, int(frames.x)), 0),
    texelFetch(gpuAnimationFrames, ivec2(offset, int(frames.y)), 0),
    frames.z
  );
  if (blend.w <= 0.0) {
    return first;
  }
  vec4 second = mix(
    texelFetch(gpuAnimationFrames, ivec2(offset, int(blend.x)), 0),
    texelFetch(gpuAnimationFrames, ivec2(offset, int(blend.y)), 0),
    blend.z
  );
  return mix(first, second, blend.w);
}

mat4 sampleGPUAnimationMatrix(vec4 frames, vec4 blend, int firstColumn) {
  return mat4(
    sampleGPUAnimationFrame(frames, blend, firstColumn),
    sampleGPUAnimationFrame(frames, blend, firstColumn + 1),
    sampleGPUAnimationFrame(frames, blend, firstColumn + 2),
    sampleGPUAnimationFrame(frames, blend, firstColumn + 3)
  );
}

mat4 getGPUAnimatedSkinMatrix(vec4 weights, uvec4 joints, vec4 frames, vec4 blend) {
  return weights.x * sampleGPUAnimationMatrix(frames, blend, 4 + int(joints.x) * 4)
       + weights.y * sampleGPUAnimationMatrix(frames, blend, 4 + int(joints.y) * 4)
       + weights.z * sampleGPUAnimationMatrix(frames, blend, 4 + int(joints.z) * 4)
       + weights.w * sampleGPUAnimationMatrix(frames, blend, 4 + int(joints.w) * 4);
}
#endif

#ifdef HAS_INSTANCED_MORPH
uniform highp sampler2D gpuMorphTargets;

#ifndef HAS_GPU_CROWD_ANIMATION
uniform highp sampler2D gpuMorphWeights;
#endif

float getGPUCrowdMorphWeight(
  uint instanceIndex,
  uint targetIndex,
  uint jointsPerInstance,
  vec4 frames,
  vec4 blend
) {
#ifdef HAS_GPU_CROWD_ANIMATION
  int offset = 4 + int(jointsPerInstance) * 4 + int(targetIndex);
  return sampleGPUAnimationFrame(frames, blend, offset).x;
#else
  vec4 packedWeights = texelFetch(
    gpuMorphWeights,
    ivec2(int(targetIndex / 4u), int(instanceIndex)),
    0
  );
  return packedWeights[int(targetIndex % 4u)];
#endif
}

vec3 getGPUCrowdMorphDelta(
  uint instanceIndex,
  uint vertexIndex,
  uint attributeIndex,
  uint targetCount,
  uint jointsPerInstance,
  vec4 frames,
  vec4 blend
) {
  vec3 result = vec3(0.0);
  for (uint targetIndex = 0u; targetIndex < targetCount; targetIndex++) {
    float weight = getGPUCrowdMorphWeight(
      instanceIndex,
      targetIndex,
      jointsPerInstance,
      frames,
      blend
    );
    result += texelFetch(
      gpuMorphTargets,
      ivec2(int(vertexIndex), int(targetIndex * 3u + attributeIndex)),
      0
    ).xyz * weight;
  }
  return result;
}
#endif
`,fs:"",bindingLayout:[{name:"gpuAnimationFrames",group:0,visibility:1},{name:"gpuMorphTargets",group:0,visibility:1},{name:"gpuMorphWeights",group:0,visibility:1}],getUniforms:(e={})=>e},tm=`
struct VertexInputs {
  @location(0) positions: vec3f,
#ifdef HAS_NORMALS
  @location(1) normals: vec3f,
#endif
#ifdef HAS_TANGENTS
  @location(2) TANGENT: vec4f,
#endif
#ifdef HAS_UV
  @location(3) texCoords: vec2f,
#endif
#ifdef HAS_UV_1
  @location(4) texCoords1: vec2f,
#endif
#ifdef HAS_SKIN
  @location(5) JOINTS_0: vec4u,
  @location(6) WEIGHTS_0: vec4f,
#endif
#ifdef HAS_SKIN_1
  @location(7) JOINTS_1: vec4u,
  @location(8) WEIGHTS_1: vec4f,
#endif
#ifdef HAS_GLTF_INSTANCING
  @location(9) instanceModelMatrixCol0: vec4f,
  @location(10) instanceModelMatrixCol1: vec4f,
  @location(11) instanceModelMatrixCol2: vec4f,
  @location(12) instanceModelMatrixCol3: vec4f,
  @builtin(instance_index) instanceIndex: u32,
#else
#ifdef HAS_INSTANCED_MORPH
  @builtin(instance_index) instanceIndex: u32,
#endif
#endif
#ifdef HAS_GPU_CROWD_ANIMATION
  @location(13) instanceAnimationFrames: vec4f,
  @location(14) instanceAnimationBlend: vec4f,
#endif
#ifdef HAS_INSTANCED_MORPH
  @builtin(vertex_index) vertexIndex: u32,
#endif
};

struct FragmentInputs {
  @builtin(position) position: vec4f,
  @location(0) pbrPosition: vec3f,
  @location(1) pbrUV0: vec2f,
  @location(2) pbrUV1: vec2f,
  @location(3) pbrNormal: vec3f,
#ifdef HAS_TANGENTS
  @location(4) pbrTangent: vec4f,
#endif
};

#ifdef HAS_GLTF_INSTANCING
fn getGLTFInstanceNormalMatrix(matrix: mat3x3f) -> mat3x3f {
  let firstCofactor = cross(matrix[1], matrix[2]);
  let inverseDeterminant = 1.0 / dot(matrix[0], firstCofactor);
  return mat3x3f(
    firstCofactor,
    cross(matrix[2], matrix[0]),
    cross(matrix[0], matrix[1])
  ) * inverseDeterminant;
}
#endif

@vertex
fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  var outputs: FragmentInputs;
  var position = vec4f(inputs.positions, 1.0);
  var normal = vec3f(0.0, 0.0, 1.0);
  var tangent = vec4f(1.0, 0.0, 0.0, 1.0);
  var uv0 = vec2f(0.0, 0.0);
  var uv1 = vec2f(0.0, 0.0);

#ifdef HAS_NORMALS
  normal = inputs.normals;
#endif
#ifdef HAS_UV
  uv0 = inputs.texCoords;
#endif
#ifdef HAS_UV_1
  uv1 = inputs.texCoords1;
#endif
#ifdef HAS_TANGENTS
  tangent = inputs.TANGENT;
#endif

#ifdef HAS_INSTANCED_MORPH
  var animationFrames = vec4f(0.0);
  var animationBlend = vec4f(0.0);
#ifdef HAS_GPU_CROWD_ANIMATION
  animationFrames = inputs.instanceAnimationFrames;
  animationBlend = inputs.instanceAnimationBlend;
#endif
  position = vec4f(
    position.xyz + getGPUCrowdMorphDelta(
      inputs.instanceIndex,
      inputs.vertexIndex,
      0u,
      u32(CROWD_MORPH_VERTEX_COUNT),
      u32(CROWD_MORPH_TARGET_COUNT),
      u32(CROWD_ANIMATION_JOINT_COUNT),
      animationFrames,
      animationBlend,
      u32(CROWD_ANIMATION_FRAME_STRIDE)
    ),
    1.0
  );
#ifdef HAS_NORMALS
  normal = normalize(normal + getGPUCrowdMorphDelta(
    inputs.instanceIndex,
    inputs.vertexIndex,
    1u,
    u32(CROWD_MORPH_VERTEX_COUNT),
    u32(CROWD_MORPH_TARGET_COUNT),
    u32(CROWD_ANIMATION_JOINT_COUNT),
    animationFrames,
    animationBlend,
    u32(CROWD_ANIMATION_FRAME_STRIDE)
  ));
#endif
#ifdef HAS_TANGENTS
  tangent = vec4f(normalize(tangent.xyz + getGPUCrowdMorphDelta(
    inputs.instanceIndex,
    inputs.vertexIndex,
    2u,
    u32(CROWD_MORPH_VERTEX_COUNT),
    u32(CROWD_MORPH_TARGET_COUNT),
    u32(CROWD_ANIMATION_JOINT_COUNT),
    animationFrames,
    animationBlend,
    u32(CROWD_ANIMATION_FRAME_STRIDE)
  )), tangent.w);
#endif
#endif

#ifdef HAS_SKIN
#ifdef HAS_GPU_CROWD_ANIMATION
  var skinMatrix = getGPUAnimatedSkinMatrix(
    inputs.WEIGHTS_0,
    inputs.JOINTS_0,
    inputs.instanceAnimationFrames,
    inputs.instanceAnimationBlend,
    u32(CROWD_ANIMATION_FRAME_STRIDE)
  );
#else
#ifdef HAS_INSTANCED_SKIN
  var skinMatrix = getInstancedSkinMatrix(
    inputs.WEIGHTS_0,
    inputs.JOINTS_0,
    inputs.instanceIndex,
    u32(CROWD_JOINTS_PER_INSTANCE)
  );
#else
  var skinMatrix = getSkinMatrix(inputs.WEIGHTS_0, inputs.JOINTS_0);
#endif
#endif
#ifdef HAS_SKIN_1
#ifdef HAS_GPU_CROWD_ANIMATION
  skinMatrix += getGPUAnimatedSkinMatrix(
    inputs.WEIGHTS_1,
    inputs.JOINTS_1,
    inputs.instanceAnimationFrames,
    inputs.instanceAnimationBlend,
    u32(CROWD_ANIMATION_FRAME_STRIDE)
  );
#else
#ifdef HAS_INSTANCED_SKIN
  skinMatrix += getInstancedSkinMatrix(
    inputs.WEIGHTS_1,
    inputs.JOINTS_1,
    inputs.instanceIndex,
    u32(CROWD_JOINTS_PER_INSTANCE)
  );
#else
  skinMatrix += getSkinMatrix(inputs.WEIGHTS_1, inputs.JOINTS_1);
#endif
#endif
#endif
  position = skinMatrix * position;
  normal = normalize((skinMatrix * vec4f(normal, 0.0)).xyz);
#ifdef HAS_TANGENTS
  tangent = vec4f(normalize((skinMatrix * vec4f(tangent.xyz, 0.0)).xyz), tangent.w);
#endif
#endif

#ifdef HAS_GLTF_INSTANCING
  var instanceMatrix = mat4x4f(
    inputs.instanceModelMatrixCol0,
    inputs.instanceModelMatrixCol1,
    inputs.instanceModelMatrixCol2,
    inputs.instanceModelMatrixCol3
  );
#ifdef HAS_GPU_CROWD_ANIMATION
  instanceMatrix *= sampleGPUAnimationMatrix(
    inputs.instanceAnimationFrames,
    inputs.instanceAnimationBlend,
    0u,
    u32(CROWD_ANIMATION_FRAME_STRIDE)
  );
#endif
  position = instanceMatrix * position;
  normal = normalize(getGLTFInstanceNormalMatrix(mat3x3f(
    instanceMatrix[0].xyz,
    instanceMatrix[1].xyz,
    instanceMatrix[2].xyz
  )) * normal);
#ifdef HAS_TANGENTS
  tangent = vec4f(normalize((instanceMatrix * vec4f(tangent.xyz, 0.0)).xyz), tangent.w);
#endif
#endif

  var resolvedModelMatrix = pbrProjection.modelMatrix;
  var resolvedNormalMatrix = pbrProjection.normalMatrix;
#ifdef HAS_PUBLISHED_TRANSFORMS
  if(publishedTransforms.bodyIndex>=0){
    let bodyMatrix=publishedBodyMatrices[u32(publishedTransforms.bodyIndex)];
    resolvedModelMatrix=bodyMatrix*resolvedModelMatrix;
    resolvedNormalMatrix=bodyMatrix*resolvedNormalMatrix;
  }
#endif
  let worldPosition = resolvedModelMatrix * position;

#ifdef HAS_NORMALS
  normal = normalize((resolvedNormalMatrix * vec4f(normal, 0.0)).xyz);
#endif
#ifdef HAS_TANGENTS
  let worldTangent = normalize((resolvedModelMatrix * vec4f(tangent.xyz, 0.0)).xyz);
  outputs.pbrTangent = vec4f(worldTangent, tangent.w);
#endif

  outputs.position = pbrProjection.modelViewProjectionMatrix * position;
#ifdef HAS_PUBLISHED_TRANSFORMS
  if(publishedTransforms.bodyIndex>=0){outputs.position=publishedTransforms.viewProjection*worldPosition;}
#endif
  outputs.pbrPosition = worldPosition.xyz / worldPosition.w;
  outputs.pbrUV0 = uv0;
  outputs.pbrUV1 = uv1;
  outputs.pbrNormal = normal;
  return outputs;
}

@fragment
fn fragmentMain(inputs: FragmentInputs, @builtin(front_facing) frontFacing: bool) -> @location(0) vec4f {
#ifdef DOUBLE_SIDED
  pbr_frontFacing = frontFacing;
#endif
  fragmentInputs.pbr_vPosition = inputs.pbrPosition;
  fragmentInputs.pbr_vUV0 = inputs.pbrUV0;
  fragmentInputs.pbr_vUV1 = inputs.pbrUV1;
  fragmentInputs.pbr_vNormal = inputs.pbrNormal;
#ifdef HAS_TANGENTS
  let tangent = normalize(inputs.pbrTangent.xyz);
  let bitangent = normalize(cross(inputs.pbrNormal, tangent)) * inputs.pbrTangent.w;
  fragmentInputs.pbr_vTBN = mat3x3f(tangent, bitangent, inputs.pbrNormal);
#endif
  return pbr_filterColor(vec4f(1.0));
}
`,td=`\
#version 300 es

  // in vec4 POSITION;
  in vec4 positions;

  #ifdef HAS_NORMALS
    // in vec4 NORMAL;
    in vec4 normals;
  #endif

  #ifdef HAS_TANGENTS
    in vec4 TANGENT;
  #endif

  #ifdef HAS_UV
    // in vec2 TEXCOORD_0;
    in vec2 texCoords;
  #endif

  #ifdef HAS_UV_1
    in vec2 texCoords1;
  #endif

  #ifdef HAS_SKIN
    in uvec4 JOINTS_0;
    in vec4 WEIGHTS_0;
  #endif

  #ifdef HAS_SKIN_1
    in uvec4 JOINTS_1;
    in vec4 WEIGHTS_1;
  #endif

  #ifdef HAS_GLTF_INSTANCING
    in vec4 instanceModelMatrixCol0;
    in vec4 instanceModelMatrixCol1;
    in vec4 instanceModelMatrixCol2;
    in vec4 instanceModelMatrixCol3;
  #endif

  #ifdef HAS_GPU_CROWD_ANIMATION
    in vec4 instanceAnimationFrames;
    in vec4 instanceAnimationBlend;
  #endif

  void main(void) {
    vec4 _NORMAL = vec4(0.);
    vec4 _TANGENT = vec4(0.);
    vec2 _TEXCOORD_0 = vec2(0.);
    vec2 _TEXCOORD_1 = vec2(0.);

    #ifdef HAS_NORMALS
      _NORMAL = normals;
    #endif

    #ifdef HAS_TANGENTS
      _TANGENT = TANGENT;
    #endif

    #ifdef HAS_UV
      _TEXCOORD_0 = texCoords;
    #endif

    #ifdef HAS_UV_1
      _TEXCOORD_1 = texCoords1;
    #endif

    vec4 pos = positions;

    #ifdef HAS_INSTANCED_MORPH
      vec4 animationFrames = vec4(0.0);
      vec4 animationBlend = vec4(0.0);
      #ifdef HAS_GPU_CROWD_ANIMATION
        animationFrames = instanceAnimationFrames;
        animationBlend = instanceAnimationBlend;
      #endif
      pos.xyz += getGPUCrowdMorphDelta(
        uint(gl_InstanceID),
        uint(gl_VertexID),
        0u,
        uint(CROWD_MORPH_TARGET_COUNT),
        uint(CROWD_ANIMATION_JOINT_COUNT),
        animationFrames,
        animationBlend
      );
      #ifdef HAS_NORMALS
        _NORMAL.xyz = normalize(_NORMAL.xyz + getGPUCrowdMorphDelta(
          uint(gl_InstanceID),
          uint(gl_VertexID),
          1u,
          uint(CROWD_MORPH_TARGET_COUNT),
          uint(CROWD_ANIMATION_JOINT_COUNT),
          animationFrames,
          animationBlend
        ));
      #endif
      #ifdef HAS_TANGENTS
        _TANGENT.xyz = normalize(_TANGENT.xyz + getGPUCrowdMorphDelta(
          uint(gl_InstanceID),
          uint(gl_VertexID),
          2u,
          uint(CROWD_MORPH_TARGET_COUNT),
          uint(CROWD_ANIMATION_JOINT_COUNT),
          animationFrames,
          animationBlend
        ));
      #endif
    #endif

    #ifdef HAS_SKIN
      #ifdef HAS_GPU_CROWD_ANIMATION
        mat4 skinMat = getGPUAnimatedSkinMatrix(
          WEIGHTS_0,
          JOINTS_0,
          instanceAnimationFrames,
          instanceAnimationBlend
        );
      #else
      #ifdef HAS_INSTANCED_SKIN
        mat4 skinMat = getInstancedSkinMatrix(
          WEIGHTS_0,
          JOINTS_0,
          uint(gl_InstanceID),
          uint(CROWD_JOINTS_PER_INSTANCE)
        );
      #else
      mat4 skinMat = getSkinMatrix(WEIGHTS_0, JOINTS_0);
      #endif
      #endif
      #ifdef HAS_SKIN_1
        #ifdef HAS_GPU_CROWD_ANIMATION
          skinMat += getGPUAnimatedSkinMatrix(
            WEIGHTS_1,
            JOINTS_1,
            instanceAnimationFrames,
            instanceAnimationBlend
          );
        #else
        #ifdef HAS_INSTANCED_SKIN
          skinMat += getInstancedSkinMatrix(
            WEIGHTS_1,
            JOINTS_1,
            uint(gl_InstanceID),
            uint(CROWD_JOINTS_PER_INSTANCE)
          );
        #else
          skinMat += getSkinMatrix(WEIGHTS_1, JOINTS_1);
        #endif
        #endif
      #endif
      pos = skinMat * pos;
      _NORMAL = skinMat * _NORMAL;
      _TANGENT = vec4((skinMat * vec4(_TANGENT.xyz, 0.)).xyz, _TANGENT.w);
    #endif

    #ifdef HAS_GLTF_INSTANCING
      mat4 instanceMatrix = mat4(
        instanceModelMatrixCol0,
        instanceModelMatrixCol1,
        instanceModelMatrixCol2,
        instanceModelMatrixCol3
      );
      #ifdef HAS_GPU_CROWD_ANIMATION
        instanceMatrix *= sampleGPUAnimationMatrix(
          instanceAnimationFrames,
          instanceAnimationBlend,
          0
        );
      #endif
      pos = instanceMatrix * pos;
      _NORMAL = vec4(normalize(transpose(inverse(mat3(instanceMatrix))) * _NORMAL.xyz), 0.0);
      _TANGENT = vec4(normalize(mat3(instanceMatrix) * _TANGENT.xyz), _TANGENT.w);
    #endif

    pbr_setPositionNormalTangentUV(pos, _NORMAL, _TANGENT, _TEXCOORD_0, _TEXCOORD_1);
    gl_Position = pbrProjection.modelViewProjectionMatrix * pos;
  }
`,tg=`\
#version 300 es
  out vec4 fragmentColor;

  void main(void) {
    vec3 pos = pbr_vPosition;
    fragmentColor = pbr_filterColor(vec4(1.0));
  }
`;function tb(e,t){let i=t.materialFactory||new eH(e,{modules:[M.s]}),r={...t.parsedPPBRMaterial.uniforms};delete r.camera;let n=Object.fromEntries(Object.entries({...r,...t.parsedPPBRMaterial.bindings}).filter(([e,t])=>{var r;return i.ownsBinding(e)&&((r=t)instanceof eN.h||r instanceof tc||r instanceof e4.L||r instanceof eL.g||r instanceof eE.X)})),a=i.createMaterial({id:t.id,bindings:n});return a.setProps({pbrMaterial:r}),a}function tv(e,t,i,r,n){if("webgpu"===e.type)return e.createBuffer({id:t,data:i,usage:eN.h.STORAGE|eN.h.COPY_DST});let a=e.createTexture({id:t,format:"rgba32float",width:r,height:n,usage:eL.g.SAMPLE|eL.g.COPY_DST,sampler:{minFilter:"nearest",magFilter:"nearest",mipmapFilter:"nearest"}});return a.writeData(i,{width:r,height:n}),a}function tS(e,t,i){if(!e)return[...i];let r=e.value;return i.map((i,n)=>{let a=r[t*e.size+n];return void 0===a?i:e.normalized?e.value instanceof Int8Array?Math.max(a/127,-1):e.value instanceof Int16Array?Math.max(a/32767,-1):e.value instanceof Uint8Array?a/255:e.value instanceof Uint16Array?a/65535:a:a})}var t_=i(30415),tx=i(56423),tM=i(11829);function tR(e,t={}){let i=e.intensity??1,r=t.intensity??1;(0,$.v)(Number.isFinite(i)&&i>=0),(0,$.v)(Number.isFinite(r)&&r>=0);let n=new t_.d((0,tx.V)({offset:t.offset??[0,0],rotation:t.rotation??0,scale:t.scale??[1,1]})),a=(0,tx.V)((0,tM.e3)(e.lightmapTexture));return{textureIndex:e.lightmapTexture.index,texCoord:(0,tM.CC)(e.lightmapTexture),transform:n.multiplyRight(a),intensity:i*r}}function tT(e,t){for(let i of(e.userData.morphWeights=[...t],e.userData.morphMeshes||[]))i.preorderTraversal(e=>{if(!(e instanceof Z))return;let i=e.userData.morphTargets;if(!i)return;let r=e.userData.morphWeightTransport;if(r){var n,a;n=r,a=t,n.values.fill(0),n.values.set(a.slice(0,n.values.length)),n.data instanceof eN.h?n.data.write(n.values):n.data.writeData(n.values,{width:n.packedTargetCount,height:1}),e.userData.morphWeights=[...t];return}!function(e,t,i,r){let n={};for(let e of["POSITION","NORMAL","TANGENT"]){let i=t.attributes[e];i&&(n[e]=eG(i))}let a=function(e,t,i){let r={};for(let n of["POSITION","NORMAL","TANGENT"]){let a=e[n];if(!a)continue;let s=new Float32Array(a),o="TANGENT"===n?4:3,l=Math.floor(a.length/o);for(let e=0;e<Math.min(t.length,i.length);e++){let r=i[e],a=t[e][n];if(!r||!a)continue;let c="TANGENT"===n&&a.length===4*l?4:3;for(let e=0;e<l;e++){let t=e*o,i=e*c;for(let e=0;e<3;e++)s[t+e]+=(a[i+e]||0)*r}}"POSITION"!==n&&function(e,t){for(let i=0;i<e.length;i+=t){let t=Math.hypot(e[i],e[i+1],e[i+2]);t>0&&(e[i]/=t,e[i+1]/=t,e[i+2]/=t)}}(s,o),r[n]=s}return r}(n,i,r),s={};for(let[e,i]of Object.entries(t.attributes))i&&(s[e]=i);for(let e of["POSITION","NORMAL","TANGENT"]){let t=a[e],i=s[e];t&&i&&(s[e]={...i,value:function(e,t){if(e.value instanceof Float32Array)return t;let i=e.value.slice(),r=ez(i),n=i instanceof Int8Array||i instanceof Int16Array||i instanceof Int32Array;for(let a=0;a<t.length;a++){let s=t[a];i[a]=e.normalized&&r?Math.round(Math.max(n?-1:0,Math.min(1,s))*r):s}return i}(i,t)})}let o=new eD.V2({id:t.id,topology:t.topology||"triangle-list",vertexCount:t.vertexCount,indices:t.indices,attributes:s,bufferLayout:t.bufferLayout}),l=(0,eB.C)(o),c=l.attributes.geometry?.value,f=e._gpuGeometry?.attributes.geometry||e.bufferAttributes.geometry;if(c&&f)return f.write(c);for(let t of["POSITION","NORMAL","TANGENT"]){let i=a[t];if(i){let r="POSITION"===t?"positions":"NORMAL"===t?"normals":"TANGENT";e.bufferAttributes[r]?.write(i)}}}(e.model,i.geometry,i.targets,t),e.userData.morphWeights=[...t]})}var tC=i(19710),tI=i(33577);let ty={properties:null,billboards:null,publishedTransforms:null,modelOptions:{},pbrDebug:!1,imageBasedLightingEnvironment:void 0,lights:!0,useTangents:!1,useByteColors:!0,strictExtensions:!1,excludeGaussianSplatPrimitives:!1};function tA(e,t,i,r){let n=(0,tI.lO)(e,t,i,r);for(let e of n.generatedTextures)r.generatedTextures.add(e);return n}function tE(e,t,i,r,n,a,s,o){let l=t.primitives||[],c=a&&function(e){let t=["_LIGHTMAP_OFFSET","_LIGHTMAP_SCALE","_LIGHTMAP_ROTATION","_LIGHTMAP_INTENSITY"];if(!t.some(t=>e.attributes[t]))return null;let i=[2,2,1,1];for(let[r,n]of t.entries()){let t=e.attributes[n];t&&((0,$.v)(t.value instanceof Float32Array&&!t.normalized),(0,$.v)(t.size===i[r]),(0,$.v)(t.count===e.matrices.length),(0,$.v)(t.value.length===t.count*t.size),(0,$.v)(t.value.every(e=>Number.isFinite(e)&&("_LIGHTMAP_INTENSITY"!==n||e>=0))))}return e.matrices.map((t,i)=>{let r=e.attributes._LIGHTMAP_OFFSET?.value,n=e.attributes._LIGHTMAP_SCALE?.value,a=e.attributes._LIGHTMAP_ROTATION?.value,s=e.attributes._LIGHTMAP_INTENSITY?.value;return{offset:r?[r[2*i],r[2*i+1]]:[0,0],scale:n?[n[2*i],n[2*i+1]]:[1,1],rotation:a?.[i]??0,intensity:s?.[i]??1}})}(a);if(c)return(0,$.v)(!!s?.lightmaps.length||l.some(e=>e.material?.extensions?.KHR_lightmap)),new Y({id:t.name||t.id,children:c.map((o,l)=>new Y({matrix:a.matrices[l],children:[tE(e,t,i,r,n,void 0,s,o)]}))});let f=l.flatMap((l,c)=>n.excludeGaussianSplatPrimitives&&l.extensions?.KHR_gaussian_splatting?[]:[function({device:e,gltfPrimitive:t,primitiveIndex:i,gltfMesh:r,gltf:n,gltfMaterialIdToMaterialMap:a,options:s,instancing:o,nodeLightmap:l,lightmapInstance:c}){let f=t.name||`${r.name||r.id}-primitive-${i}`,u=function(e){let t=1/0;for(let i of Object.values(e))if(i){let{value:e,size:r,components:n}=i,a=r??n;e?.length!==void 0&&a>=1&&(t=Math.min(t,e.length/a))}if(!Number.isFinite(t))throw Error("Could not determine vertex count from attributes");return t}(t.attributes),p=function(e,t,i){if(e!==tC.n.LINE_LOOP&&e!==tC.n.TRIANGLE_FAN)return{topology:function(e){switch(e){case tC.n.POINTS:return"point-list";case tC.n.LINES:return"line-list";case tC.n.LINE_STRIP:return"line-strip";case tC.n.TRIANGLES:return"triangle-list";case tC.n.TRIANGLE_STRIP:return"triangle-strip";default:throw Error(String(e))}}(e)};let r=t?.length??i,n=new(t instanceof Uint32Array||!t&&i>65536?Uint32Array:Uint16Array)(e===tC.n.LINE_LOOP?r>=2?2*r:0:r>=3?(r-2)*3:0),a=e=>t?.[e]??e;if(e===tC.n.LINE_LOOP){for(let e=0;e<r;e++)n[2*e]=a(e),n[2*e+1]=a((e+1)%r);return{topology:"line-list",indices:n}}for(let e=0;e<r-2;e++)n[3*e]=a(0),n[3*e+1]=a(e+1),n[3*e+2]=a(e+2);return{topology:"triangle-list",indices:n}}(t.mode??4,t.indices?.value,u),h=function(e,t,i){let r={};for(let[e,i]of Object.entries(t.attributes)){let{components:n,size:a,value:s,normalized:o}=i,l="POSITION"===e||"NORMAL"===e||"TANGENT"===e,c=!!(t.targets?.length&&l);r[e]={size:a??n,value:c?eG({value:s,normalized:o}):s,normalized:!c&&o}}return new eD.V2({id:e,topology:i.topology,indices:i.indices??t.indices?.value,attributes:r})}(f,t,p),m=h.vertexCount,d=function(e,t,i){if(!e.targets?.length)return;let r={};for(let e of["POSITION","NORMAL","TANGENT"]){let t=i.attributes[e]?.value;t instanceof Float32Array&&(r[e]=new Float32Array(t))}return{geometry:i,baseAttributes:r,targets:e.targets.map(e=>{let i={};for(let r of["POSITION","NORMAL","TANGENT"]){let n=e[r],a="number"==typeof n?t.accessors[n]:n;a?.value&&ArrayBuffer.isView(a.value)&&(i[r]=eG(a))}return i})}}(t,n,h),g=l?.lightmaps.find(e=>e.primitive===i),b=g?{...t.material,extensions:{...t.material?.extensions,KHR_lightmap:g}}:t.material,v=tA(e,b,h.attributes,{...s,gltf:n});if(c&&b?.extensions?.KHR_lightmap){let e=tR(b.extensions.KHR_lightmap,c);v.uniforms.lightmapUVTransform=e.transform,v.uniforms.lightmapIntensity=e.intensity}let S=function(e,t){let i,r,n,a,s,o,l,c,f,u,p,{id:h,geometry:m,parsedPPBRMaterial:d,vertexCount:g,modelOptions:b={},instanceMatrices:v,usesLargeSkinPalette:S=!1,morphTargets:_=[]}=t;if(t.publishedTransforms&&"webgpu"!==e.type)throw Error("Published transforms require WebGPU");let x=b.userData?.gltfAnimatedCrowd;if(x&&v)throw Error("Nested glTF crowd instancing is unsupported");W.R.info(4,"createGLTFModel defines: ",d.defines)();let R=[],T={},C=[],I=[],y=[],A=!!x?.gpuAnimation;if(v||x)for(let t=0;t<4;t++){let i=new Float32Array(4*(x?.capacity||v?.length||0));v?.forEach((e,r)=>{for(let n=0;n<4;n++)i[4*r+n]=e[4*t+n]});let r=`instanceModelMatrixCol${t}`,n=e.createBuffer({id:`${h||"gltf"}-${r}`,data:i,usage:eN.h.VERTEX|eN.h.COPY_DST});T[r]=n,C.push({name:r,format:"float32x4",stepMode:"instance"}),R.push(n),I.push(n),y.push(i)}if(x&&A)for(let[t,s]of[["instanceAnimationFrames",i=new Float32Array(4*x.capacity)],["instanceAnimationBlend",n=new Float32Array(4*x.capacity)]]){let i=e.createBuffer({id:`${h||"gltf"}-${t}`,data:s,usage:eN.h.VERTEX|eN.h.COPY_DST});T[t]=i,C.push({name:t,format:"float32x4",stepMode:"instance"}),R.push(i),"instanceAnimationFrames"===t?r=i:a=i}let E=!!d.defines.HAS_SKIN,N=!!(S&&E&&!x),L=!!(x&&E&&!A);x&&L&&(o=new Float32Array(x.capacity*x.jointsPerInstance*16),s="webgpu"===e.type?e.createBuffer({id:`${h||"gltf"}-crowd-joint-matrices`,byteLength:o.byteLength,usage:eN.h.STORAGE|eN.h.COPY_DST}):e.createTexture({id:`${h||"gltf"}-crowd-joint-matrices`,format:"rgba32float",width:4*x.jointsPerInstance,height:x.capacity,usage:eL.g.SAMPLE|eL.g.COPY_DST,sampler:{minFilter:"nearest",magFilter:"nearest",mipmapFilter:"nearest"}}),R.push(s));let P=_.length,O=Math.floor((m.attributes.POSITION?.value.length||0)/3);if(P>0&&O>0){let t=new Float32Array(3*P*O*4);for(let[e,i]of _.entries())for(let[r,n]of["POSITION","NORMAL","TANGENT"].entries()){let a=i[n];if(!a)continue;let s="TANGENT"===n&&a.length===4*O?4:3;for(let i=0;i<O;i++){let n=((3*e+r)*O+i)*4,o=i*s;t[n]=a[o]||0,t[n+1]=a[o+1]||0,t[n+2]=a[o+2]||0}}if(l=tv(e,`${h||"gltf"}-crowd-morph-targets`,t,O,3*P),R.push(l),!A){let t=Math.ceil(P/4),i=x?.capacity||1;f=tv(e,`${h||"gltf"}-crowd-morph-weights`,c=new Float32Array(i*t*4),t,i),R.push(f)}}let w=E&&x?x.jointsPerInstance:0,U=4+4*w+P;x?.gpuAnimation&&(u=tv(e,`${h||"gltf"}-crowd-animation-frames`,p=new Float32Array(x.gpuAnimation.frameCount*U*4),U,x.gpuAnimation.frameCount),R.push(u));let V=tm;for(let[e,t]of[["CROWD_JOINTS_PER_INSTANCE",x?.jointsPerInstance||0],["CROWD_MORPH_VERTEX_COUNT",O],["CROWD_MORPH_TARGET_COUNT",P],["CROWD_ANIMATION_JOINT_COUNT",w],["CROWD_ANIMATION_FRAME_STRIDE",U]])V=V.replaceAll(`u32(${e})`,`u32(${t})`);let F={id:h,source:V,vs:td,fs:tg,geometry:m,topology:m.topology,vertexCount:g,modules:[M.s,e3,...x||l?[th]:[],...t.publishedTransforms?[e2]:[]],...b,...v||x?{attributes:{...b.attributes,...T},bufferLayout:[...b.bufferLayout||[],...C],instanceCount:v?.length||0,isInstanced:!0}:{},defines:{...d.defines,...t.publishedTransforms?{HAS_PUBLISHED_TRANSFORMS:!0}:{},...b.defines,...v||x?{HAS_GLTF_INSTANCING:!0}:{},...L?{HAS_INSTANCED_SKIN:!0,CROWD_JOINTS_PER_INSTANCE:x.jointsPerInstance}:{},...N?{HAS_LARGE_SKIN:!0}:{},...A?{HAS_GPU_CROWD_ANIMATION:!0,CROWD_ANIMATION_FRAME_STRIDE:U}:{},...l?{HAS_INSTANCED_MORPH:!0,CROWD_MORPH_TARGET_COUNT:P}:{},...x||l?{CROWD_ANIMATION_JOINT_COUNT:w}:{}},parameters:{depthWriteEnabled:!0,depthCompare:"less",depthFormat:"depth24plus",cullMode:"back",...d.parameters,...b.parameters}},H=t.material||tb(e,{id:h?`${h}-material`:void 0,parsedPPBRMaterial:d});F.material=H;let k=new e5.K(e,F),D={...d.uniforms,...b.uniforms,...d.bindings,...b.bindings},B=function(e,t,i){let r=new Map;for(let t of e){for(let e of Object.keys(t.uniformTypes||{}))r.set(e,t.name);for(let e of t.bindingLayout||[])r.set(e.name,t.name)}let n={};for(let[e,a]of Object.entries(i)){if(void 0===a)continue;let i=r.get(e);!i||t.ownsModule(i)||(n[i]||={},n[i][e]=a)}return n}(k.shaderInputs.getModules(),H,D);k.shaderInputs.setProps(B),t.publishedTransforms&&k.shaderInputs.setProps({publishedTransforms:{publishedBodyMatrices:t.publishedTransforms,bodyIndex:-1}}),s&&k.shaderInputs.setProps({skin:{jointMatrices:[],skinJointMatrices:s}}),(u||l||f)&&k.shaderInputs.setProps({gpuAnimation:{...u?{gpuAnimationFrames:u}:{},...l?{gpuMorphTargets:l}:{},...f?{gpuMorphWeights:f}:{}}});let G=new Z({managedResources:R,model:k,bounds:t.bounds,instanceMatrices:v});return G.userData.gltfLargeSkinPalette=N,c&&f&&!x&&(G.userData.morphWeightTransport={values:c,data:f,packedTargetCount:Math.ceil(P/4)}),x&&(G.userData.gltfAnimatedCrowd={transformBuffers:I,transformColumns:y,skinJointMatrices:s,jointMatrices:o,jointsPerInstance:x.jointsPerInstance,morphTargetCount:P,morphTargetData:l,morphWeights:c,morphWeightData:f,animationFrames:u,animationFrameValues:p,animationFrameStride:U,animationJointCount:w,animationParameters:i,animationParameterBuffer:r,animationBlend:n,animationBlendBuffer:a}),G}(e,{id:f,geometry:h,material:!b?.extensions?.KHR_lightmap&&t.material&&a.get(t.material.id)||null,parsedPPBRMaterial:v,modelOptions:s.modelOptions,publishedTransforms:s.publishedTransforms??void 0,vertexCount:m,bounds:[t.attributes.POSITION.min,t.attributes.POSITION.max],instanceMatrices:o?.matrices,usesLargeSkinPalette:function(...e){for(let t of e)if(t){if(t.max?.some(e=>e>=64))return!0;for(let e=0;e<(t.value?.length||0);e++)if(t.value[e]>=64)return!0}return!1}(t.attributes.JOINTS_0,t.attributes.JOINTS_1),morphTargets:d?.targets});if(t.material&&S.model.material){let e=n.materials.findIndex(e=>e.id===t.material.id);tN(s.materialInstances,e,S.model.material)}o&&(S.userData.gltfInstancing=o);let _=t.extensions?.KHR_materials_variants?.mappings||[];if(_.length){let t=new Map;for(let i of _){let r="number"==typeof i.material?n.materials[i.material]:i.material,o=g?{...r,extensions:{...r?.extensions,KHR_lightmap:g}}:r,l=o&&a.get(o.id);if(!l)continue;let f=tA(e,o,h.attributes,{...s,gltf:n});if(o.extensions?.KHR_lightmap){if(c){let e=tR(o.extensions.KHR_lightmap,c);f.uniforms.lightmapUVTransform=e.transform,f.uniforms.lightmapIntensity=e.intensity}l=tb(e,{parsedPPBRMaterial:f})}for(let e of(tN(s.materialInstances,n.materials.indexOf(r),l),i.variants||[]))t.set(e,{material:l,parameters:{...S.model.parameters,...f.parameters,depthWriteEnabled:"BLEND"!==o.alphaMode,cullMode:o.doubleSided?"none":"back"}})}S.userData.gltfMaterialVariants={defaultMaterial:S.model.material,defaultParameters:{...S.model.parameters},mappings:t}}return d&&(S.userData.morphTargets=d),S}({device:e,gltfPrimitive:l,primitiveIndex:c,gltfMesh:t,gltf:i,gltfMaterialIdToMaterialMap:r,options:n,instancing:a,nodeLightmap:s,lightmapInstance:o})]);return new Y({id:t.name||t.id,children:f})}function tN(e,t,i){if(t<0)return;let r=e.get(t)||[];r.includes(i)||r.push(i),e.set(t,r)}var tL=i(34353);class tP{bindings;useByteColors;lights=[];constructor(e,t=!0){this.bindings=e,this.useByteColors=t,this.update()}update(){for(let{path:e,definition:t}of(this.lights.length=0,this.bindings)){if(!e.length||e.some(e=>!e.display))continue;let i=new U;for(let t of e)i.multiplyRight(t.matrix);let r=function(e,t,i){var r,n,a,s;let o=(r=e.color||[1,1,1],i?r.map(e=>255*e):(0,tL.sC)(r,!1)),l=e.intensity??1;switch(e.type){case"directional":return n=t,a=o,s=l,{type:"directional",direction:tw(n),color:a,intensity:s};case"point":return function(e,t,i,r){let n=tO(e),a=[1,0,0];return void 0!==r&&r>0&&(a=[1,0,1/(r*r)]),{type:"point",position:n,color:t,intensity:i,attenuation:a}}(t,o,l,e.range);case"spot":return function(e,t,i,r,n={}){let a=tO(e),s=tw(e),o=[1,0,0];return void 0!==r&&r>0&&(o=[1,0,1/(r*r)]),{type:"spot",position:a,direction:s,color:t,intensity:i,attenuation:o,innerConeAngle:n.innerConeAngle??0,outerConeAngle:n.outerConeAngle??Math.PI/4}}(t,o,l,e.range,e.spot);default:return}}(t,i,this.useByteColors);r&&this.lights.push(r)}}}function tO(e){return e.transformAsPoint([0,0,0])}function tw(e){return e.transformAsVector([0,0,-1])}class tU{name;playing=!0;speed=1;startTime=0;constructor(e={}){this.name=e.name||"unnamed",Object.assign(this,e)}setTime(e){if(!this.playing)return;let t=(e/1e3-this.startTime)*this.speed;this.applyTime(t)}}class tV{clips;animations;constructor(e){this.clips=e,this.animations=e}animate(e){W.R.warn(`${this.constructor.name}#animate is deprecated. Use ${this.constructor.name}#setTime instead`)(),this.setTime(e)}setTime(e){this.clips.forEach(t=>t.setTime(e))}getAnimations(){return this.clips}}function tF(e,t,i){let r=tk(e),n=tk(t),a=r.reduce((e,t,i)=>e+t*n[i],0),s=a<0?-1:1;if((a=Math.min(Math.abs(a),1))>.9995)return tk(r.map((e,t)=>e+i*(n[t]*s-e)));let o=Math.acos(a),l=Math.sin(o),c=Math.sin((1-i)*o)/l,f=Math.sin(i*o)/l*s;return tk(r.map((e,t)=>e*c+n[t]*f))}function tH(e,t,i,r){let n=e["CUBICSPLINE"===t?3*i+1:i];return n?"quaternion"===r?tk(n):[...n]:null}function tk(e){let t=Math.hypot(...e);return t>0?e.map(e=>e/t):[0,0,0,1]}class tD{clip;mixer;time=0;timeScale;weight;loop;repetitions;paused=!1;playing=!1;elapsedTime=0;fade=null;constructor(e,t,i={}){this.mixer=e,this.clip=t,this.loop=i.loop||"repeat",this.repetitions=i.repetitions??1/0,this.timeScale=i.timeScale??1,this.weight=i.weight??1}play(){return this.playing=!0,this.paused=!1,this}pause(){return this.paused=!0,this}resume(){return this.playing=!0,this.paused=!1,this}stop(){return this.playing=!1,this.paused=!1,this.fade=null,this.reset()}reset(){return this.elapsedTime=0,this.time=0,this}setTime(e){return this.elapsedTime=e,this.time=this.resolveLocalTime(e),this}setLoop(e,t=1/0){return this.loop=e,this.repetitions=t,this.time=this.resolveLocalTime(this.elapsedTime),this}setEffectiveWeight(e){return this.weight=Math.max(0,e),this.fade=null,this}setEffectiveTimeScale(e){return this.timeScale=e,this}fadeIn(e){return this.scheduleFade(1,e)}fadeOut(e){return this.scheduleFade(0,e)}crossFadeTo(e,t){return e.weight=0,e.play().fadeIn(t),this.fadeOut(t)}crossFadeFrom(e,t){return e.crossFadeTo(this,t),this}advance(e){this.playing&&!this.paused&&(this.advanceFade(Math.abs(e)),this.elapsedTime+=e*this.timeScale,this.time=this.resolveLocalTime(this.elapsedTime),this.hasFinished()&&(this.playing=!1))}get shouldApply(){return(this.playing||this.hasFinished())&&this.weight>0}scheduleFade(e,t){return t<=0?(this.weight=e,this.fade=null):this.fade={duration:t,elapsedTime:0,startWeight:this.weight,endWeight:e},this}advanceFade(e){if(!this.fade)return;this.fade.elapsedTime+=e;let t=Math.min(this.fade.elapsedTime/this.fade.duration,1);this.weight=this.fade.startWeight+(this.fade.endWeight-this.fade.startWeight)*t,1===t&&(this.fade=null)}hasFinished(){let e=this.clip.duration;return e<=0?"once"===this.loop:"once"===this.loop?this.elapsedTime>=e||this.elapsedTime<0:Number.isFinite(this.repetitions)&&Math.abs(this.elapsedTime)>=e*this.repetitions}resolveLocalTime(e){let t=this.clip.duration;if(t<=0)return 0;if("once"===this.loop)return Math.min(Math.max(e,0),t);if(Number.isFinite(this.repetitions)&&Math.abs(e)>=t*this.repetitions)return"ping-pong"===this.loop&&this.repetitions%2==0||e<0?0:t;let i=e>=0&&e<t?e:(e%t+t)%t;return"repeat"===this.loop||0===Math.abs(Math.floor(e/t)%2)?i:t-i}}class tB{time=0;timeScale=1;clips=new Map;actions=new Map;initialValues=new Map;constructor(e=[]){e.forEach(e=>this.addClip(e))}addClip(e){return this.clips.set(e.name,e),this}clipAction(e,t){let i="string"==typeof e?this.clips.get(e):e;if(!i)throw Error(`Unknown animation clip: ${e}`);this.addClip(i);let r=this.actions.get(i);return r||(r=new tD(this,i,t),this.actions.set(i,r)),r}getAction(e){let t=this.clips.get(e);return t?this.actions.get(t):void 0}update(e){return this.advance(e),this.applyValues(),this}advance(e){let t=e*this.timeScale;return this.time+=t,this.actions.forEach(e=>e.advance(t)),this}setTime(e){return this.time=e,this.actions.forEach(t=>{t.paused||t.setTime(e*t.timeScale)}),this.applyValues(),this}stopAllAction(){return this.actions.forEach(e=>e.stop()),this}applyValues(){let e=new Map;this.actions.forEach(t=>{(t.shouldApply||t.playing&&0===t.weight)&&t.clip.tracks.forEach(i=>{let r=i.evaluate(t.time);if(!r)return;let n=i.binding.id||i.binding;if(!this.initialValues.has(n)){let e=i.binding.getValue?.();e&&this.initialValues.set(n,[...e])}if(0===t.weight&&!this.initialValues.has(n))return;let a=e.get(n);if(!a)return void e.set(n,{binding:i.binding,value:[...r],valueType:i.valueType,weight:t.weight});if(0===t.weight)return;let s=a.weight+t.weight,o=t.weight/s;a.value="quaternion"===i.valueType?tF(a.value,r,o):a.value.map((e,t)=>e+(r[t]-e)*o),a.weight=s})}),e.forEach(({binding:e,value:t,valueType:i,weight:r},n)=>{let a=r<1?this.initialValues.get(n):void 0;a&&a.length===t.length&&(t="quaternion"===i?tF(a,t,r):t.map((e,t)=>a[t]+(e-a[t])*r)),e.setValue(t)})}}class tG extends tV{mixer;activeClip;onUpdate;previousTimeSeconds;constructor(e,t,i={}){if(super(e),this.mixer=t,this.onUpdate=i.onUpdate,this.activeClip=e[0]?.name,!1===i.autoplay)for(let t of e)t.playing=!1,t.action.stop();else"first"===i.autoplay&&this.activeClip&&this.selectClip(this.activeClip)}setUpdateHandler(e){return this.onUpdate=e,this}setTime(e){let t=e/1e3,i=void 0===this.previousTimeSeconds?0:t-this.previousTimeSeconds;this.previousTimeSeconds=t;let r=i*this.mixer.timeScale;this.clips.forEach(e=>{if(!e.playing)return void e.action.stop();if(e.action.paused)return;e.action.resume();let i=Math.max(0,t-e.startTime)*e.speed;e.action.setTime(i-r*e.action.timeScale)}),this.mixer.update(i),this.onUpdate?.()}update(e){this.mixer.update(e),this.onUpdate?.()}selectClip(e,t={}){let i=this.clips.find(t=>t.name===e);if(!i)throw Error(`Unknown animation clip: ${e}`);let r=this.clips.find(e=>e.name===this.activeClip),n=t.crossFadeDuration||0;for(let e of this.clips)e===i||n>0&&e===r||(e.playing=!1,e.action.stop());return i.playing=!0,n>0&&r&&r!==i?(r.playing=!0,r.action.crossFadeTo(i.action,n)):i.action.reset().setEffectiveWeight(1).play(),this.activeClip=e,i}}class tz extends tU{clip;mixer;action;constructor(e,t=new tB){super({name:e.name}),this.clip=e,this.mixer=t,this.action=t.clipAction(e).play()}applyTime(e){this.action.setTime(e),this.mixer.update(0)}}class tj{name;tracks;duration;constructor(e){this.name=e.name||"unnamed",this.tracks=e.tracks,this.duration=e.duration??Math.max(0,...e.tracks.map(e=>e.duration))}}class tK{name;times;values;interpolation;valueType;binding;constructor(e){this.name=e.name||e.binding.id||"unnamed",this.times=e.times,this.values=e.values,this.interpolation=e.interpolation||"LINEAR",this.valueType=e.valueType||"vector",this.binding=e.binding}get duration(){return this.times[this.times.length-1]||0}get sampler(){return{input:this.times,output:this.values,interpolation:this.interpolation}}evaluate(e){return function(e,t,i="vector"){var r,n,a,s,o,l,c,f,u;let{input:p,output:h,interpolation:m="LINEAR"}=t;if(!p.length||!h.length||!Number.isFinite(e))return null;let d=p.length-1;if(e<=p[0]||0===d)return tH(h,m,0,i);if(e>=p[d])return tH(h,m,d,i);let g=0,b=d;for(;b-g>1;){let t=Math.floor((g+b)/2);p[t]<=e?g=t:b=t}let v=p[g],S=p[b]-v;if(S<=0||"STEP"===m)return tH(h,m,g,i);let _=(e-v)/S;switch(m){case"LINEAR":{let e=h[g],t=h[b];if(!e||!t)return null;return"quaternion"===i?tF(e,t,_):(r=e,n=t,a=_,r.map((e,t)=>(1-a)*e+a*n[t]))}case"CUBICSPLINE":{let e,t,r=h[3*g+1],n=h[3*g+2],a=h[3*b],p=h[3*b+1];if(!r||!n||!a||!p)return null;let m=(s=r,o=n,l=a,c=p,f=S,t=(e=(u=_)*u)*u,s.map((i,r)=>(2*t-3*e+1)*i+(t-2*e+u)*o[r]*f+(-2*t+3*e)*c[r]+(t-e)*l[r]*f));return"quaternion"===i?tk(m):m}default:return null}}(e,this.sampler,this.valueType)}}class tW extends tz{animation;gltfNodeIdToNodeMap;materials;materialTextureTransformState;constructor(e){let t=new Map;super(new tj({name:e.animation.name||"unnamed",tracks:e.animation.channels.map(i=>(function(e,t,i){var r,n,a;let s=function(e){switch(e){case"STEP":case"LINEAR":case"CUBICSPLINE":return e;default:throw Error(`Unsupported animation interpolation: ${e}`)}}(e.sampler.interpolation);if("property"===e.type){let i,a;if(!t.properties)throw Error(`Missing runtime property adapter for ${e.pointer}`);return new tK({name:e.pointer,times:e.sampler.input,values:e.sampler.output,interpolation:s,valueType:e.pointer.endsWith("/inertiaOrientation")?"quaternion":"vector",binding:(r=t.properties,n=e.pointer,a="boolean"==typeof(i=()=>{let e=r.get(n);if(!e||!e.every(e=>"number"==typeof e||"boolean"==typeof e))throw Error("Missing numeric animation property");return e})()[0],{id:n,getValue:()=>i().map(Number),setValue:e=>{if(!r.set(n,a?[0!==e[0]]:[...e]))throw Error("Animation property is not writable")}})})}if("node"===e.type)return new tK({name:`${e.targetNodeId}.${e.path}`,times:e.sampler.input,values:e.sampler.output,interpolation:s,valueType:"rotation"===e.path?"quaternion":"vector",binding:function(e,t,i={}){return{id:i.id,getValue:()=>{switch(t){case"translation":return Array.from(e.position);case"rotation":return Array.from(e.rotation);case"scale":return Array.from(e.scale);case"weights":return Array.from(e.userData.morphWeights??[]);case"visibility":return[+!!e.display];case"selectable":return[+!!e.selectable];case"hoverable":return[+!!e.hoverable]}},setValue:r=>{switch(t){case"translation":e.setPosition(r).updateMatrix();break;case"rotation":e.setRotation(r).updateMatrix();break;case"scale":e.setScale(r).updateMatrix();break;case"weights":tT(e,r);break;case"selectable":e.setProps({selectable:0!==r[0]});break;case"hoverable":e.setProps({hoverable:0!==r[0]});break;case"visibility":e.setProps({display:0!==r[0]}),i.onVisibilityChange?.()}}}}(function(e,t){let i=e.get(t);if(!i)throw Error(`Cannot find animation target node ${t}`);return i}(t.gltfNodeIdToNodeMap,e.targetNodeId),e.path,{id:`node:${e.targetNodeId}:${e.path}`,onVisibilityChange:t.onVisibilityChange})});if("camera"===e.type||"light"===e.type){let i="camera"===e.type?(t.cameras||[])[e.targetCameraIndex]?.[e.projection]:(t.lightDefinitions||[])[e.targetLightIndex];if(!i)throw Error(`Cannot find animation target ${e.pointer}`);let r=i;return"light"===e.type&&("innerConeAngle"===e.property||"outerConeAngle"===e.property)&&(i.spot||={},r=i.spot),new tK({name:e.pointer,times:e.sampler.input,values:e.sampler.output,interpolation:s,binding:function(e,t,i={}){return{id:i.id,getValue:()=>{let r=e[t];return Array.isArray(r)?void 0===i.component?[...r]:[r[i.component]]:"number"==typeof r?[r]:[]},setValue:r=>{if(void 0!==i.component){let n=[...e[t]||[1,1,1]];n[i.component]=r[0],e[t]=n}else e[t]=1===r.length?r[0]:[...r];i.onChange?.()}}}(r,e.property,{id:e.pointer,component:"light"===e.type?e.component:void 0,onChange:"light"===e.type?t.onLightChange:void 0})})}let o=(t.materials||[])[e.targetMaterialIndex];if(!o)throw Error(`Cannot find animation target material ${e.targetMaterialIndex} for ${e.pointer}`);return new tK({name:e.pointer,times:e.sampler.input,values:e.sampler.output,interpolation:s,binding:"material"===e.type?(a=[...new Set([o,...t.materialInstances?.get(e.targetMaterialIndex)||[]])],{id:e.pointer,getValue:()=>{var t,i;let r,n;return t=a[0],i=e,r=t.shaderInputs.getUniformValues(),Array.isArray(n=r.pbrMaterial?.[i.property])?void 0===i.component?[...n]:[n[i.component]]:"number"==typeof n?[n]:[]},setValue:t=>{for(let i of a)!function(e,t,i){let r=void 0!==t.component?{[t.property]:function(e,t,i){let r=[...e];return r[t]=i,r}(function(e,t){let i=e.shaderInputs.getUniformValues(),r=i.pbrMaterial?.[t];return Array.isArray(r)?[...r]:[]}(e,t.property),t.component,i[0])}:{[t.property]:1===i.length?i[0]:i};e.setProps({pbrMaterial:r})}(i,e,t)}}):function(e,t,i=new Map,r){return{id:r,setValue:r=>{for(let n of e)!function(e,t,i,r){let n=function(e,t,i){let r=e.get(t)||{},n=r[i.textureSlot];return n||(n={offset:[...i.baseTransform.offset],rotation:i.baseTransform.rotation,scale:[...i.baseTransform.scale]},r[i.textureSlot]=n,e.set(t,r)),n}(r,e,t);switch(t.path){case"offset":void 0!==t.component?n.offset[t.component]=i[0]:n.offset=[i[0],i[1]];break;case"rotation":n.rotation=i[0];break;case"scale":void 0!==t.component?n.scale[t.component]=i[0]:n.scale=[i[0],i[1]]}e.setProps({pbrMaterial:{[t.uniform]:(0,tx.d)(t.baseTransform,n)}})}(n,t,r,i)}}}([...new Set([o,...t.materialInstances?.get(e.targetMaterialIndex)||[]])],{...e,uniform:(0,tM.lz)(e.textureSlot).uvTransformUniform},i,e.pointer)})})(i,e,t))}),e.mixer),this.animation=e.animation,this.gltfNodeIdToNodeMap=e.gltfNodeIdToNodeMap,this.materials=e.materials||[],this.materialTextureTransformState=t}}class t$ extends tG{constructor(e){let t=new tB;super(e.animations.map((i,r)=>{let n=i.name||`Animation-${r}`;return new tW({properties:e.properties,gltfNodeIdToNodeMap:e.gltfNodeIdToNodeMap,onVisibilityChange:e.onVisibilityChange,cameras:e.cameras,lightDefinitions:e.lightDefinitions,onLightChange:e.onLightChange,materials:e.materials,materialInstances:e.materialInstances,mixer:t,animation:{name:n,channels:i.channels}})}),t,e)}}class tq{bindings;scenes;constructor(e){this.scenes=e.scenes,this.bindings=e.bindings,this.update()}update(){if(0===this.bindings.length)return;let e=new Map;for(let t of this.scenes)t.preorderTraversal((t,{worldMatrix:i})=>{t instanceof Y&&e.set(t,new U(i))});for(let t of this.bindings)for(let i of(!function(e){let{joints:t,meshNode:i,worldMatrices:r,inverseBindMatrices:n,target:a}=e,s=t.length,o=a&&a.length===16*s?a:new Float32Array(16*s),l=i?r.get(i)||i.matrix:void 0,c=l?new U(l).invert():null;for(let e=0;e<s;e++){let i=t[e],a=r.get(i)||i.matrix,s=c?new U(c).multiplyRight(a):new U(a),l=16*e;if(n&&n.length>=l+16){let e=new U;for(let t=0;t<16;t++)e[t]=n[l+t];s.multiplyRight(e)}o.set(s,l)}}({joints:t.joints,meshNode:t.node,worldMatrices:e,inverseBindMatrices:t.inverseBindMatrices,target:t.jointMatrices}),t.skinJointMatrices&&(t.skinJointMatrices instanceof eN.h?t.skinJointMatrices.write(t.jointMatrices):t.skinJointMatrices.writeData(t.jointMatrices,{width:4*t.joints.length,height:1})),t.models))i.model.shaderInputs.setProps({skin:t.skinJointMatrices?{jointMatrices:[],skinJointMatrices:t.skinJointMatrices}:{jointMatrices:t.jointMatrices}})}getBinding(e){return this.bindings.find(t=>t.node===e)}destroy(){for(let e of this.bindings)e.skinJointMatrices?.destroy()}}class tX{variants;names;activeVariant=null;bindings;constructor(e){this.variants=e.variants,this.names=this.variants.map(e=>e.name),this.bindings=e.bindings}selectVariant(e){let t=this.variants.find(t=>t.name===e);if(!t)throw Error(`Unknown material variant: ${e}`);for(let{modelNode:e,...i}of this.bindings){let r=i.mappings.get(t.index);e.model.setMaterial(r?.material||i.defaultMaterial),e.model.setParameters(r?.parameters||i.defaultParameters)}this.activeVariant=e}resetVariant(){for(let{modelNode:e,...t}of this.bindings)e.model.setMaterial(t.defaultMaterial),e.model.setParameters(t.defaultParameters);this.activeVariant=null}}let tJ={supportLevel:"none",standardStatus:"unknown",comment:"Not currently listed in the luma.gl glTF extension support registry."},tY={KHR_physics_rigid_bodies:{supportLevel:"none",standardStatus:"draft",comment:"The optional @luma.gl/engine/gltf-physics adapter validates a pinned subset; ordinary scenegraph loading does not execute physics."},KHR_implicit_shapes:{supportLevel:"none",standardStatus:"draft",comment:"The optional physics adapter supports sphere/box colliders; shapes alone do not define rendering or simulation."},EXT_lights_area:{supportLevel:"loader-only",standardStatus:"draft",comment:"Opt-in AreaLightController feeds the shared Light API. PBR supports four rect/disk lights with LTC diffuse, isotropic GGX and clearcoat; disks use a 32-gon and other lobes retain numerical integration. No shadows or indirect light; strict loading does not claim full draft conformance."},KHR_lightmap:{supportLevel:"loader-only",standardStatus:"draft",comment:"Draft irradiance rendering supports UV0/UV1, node overrides and atlas instances through individual draws. Strict required-extension loading does not claim full draft conformance."},KHR_billboard:{supportLevel:"loader-only",standardStatus:"draft",comment:"Optional BillboardController supports an explicit full-axis profile. Constrained-axis semantics remain ambiguous; strict required-extension loading does not claim full support."},KHR_audio_emitter:{supportLevel:"parsed-and-wired",standardStatus:"draft",comment:"Opt-in AudioController provides Web Audio playback; the application owns context activation and listener updates."},KHR_audio_environment:{supportLevel:"loader-only",standardStatus:"draft",comment:"Opt-in listener selection, environment zones, emitter sends and impulse-response or approximate parametric reverb. Doppler, air absorption and listener graph hooks remain unsupported."},KHR_audio_graph:{supportLevel:"loader-only",standardStatus:"draft",comment:"Opt-in AudioController implements a processing and scheduled-source profile; animation pointers and general pulse-width synthesis remain unsupported."},KHR_draco_mesh_compression:{supportLevel:"built-in",standardStatus:"ratified",comment:"Decoded by loaders.gl before luma.gl builds the scenegraph."},EXT_meshopt_compression:{supportLevel:"built-in",standardStatus:"ratified",comment:"EXT meshopt-compressed buffer views are decoded by loaders.gl before rendering."},KHR_meshopt_compression:{supportLevel:"built-in",standardStatus:"release-candidate",comment:"Decoded by loaders.gl v5 before luma.gl builds the scenegraph."},KHR_mesh_quantization:{supportLevel:"built-in",standardStatus:"ratified",comment:"Loader-materialized quantized accessors retain their typed values and normalization."},EXT_mesh_features:{supportLevel:"loader-only",standardStatus:"unknown",comment:"Feature identifiers are decoded by loaders.gl; automatic rendering and picking are application-owned."},EXT_structural_metadata:{supportLevel:"loader-only",standardStatus:"unknown",comment:"Structural metadata is decoded by loaders.gl; automatic rendering and querying are application-owned."},KHR_gaussian_splatting:{supportLevel:"none",standardStatus:"ratified",comment:"A splat adapter exists, but ordinary glTF scene creation does not integrate it."},KHR_interactivity:{supportLevel:"none",standardStatus:"ratified",comment:"The subset interpreter is not integrated into ordinary glTF scene creation."},KHR_node_selectability:{supportLevel:"none",standardStatus:"ratified",comment:"Authored selection semantics are not wired into scene picking."},KHR_node_hoverability:{supportLevel:"none",standardStatus:"ratified",comment:"Authored hover semantics are not wired into pointer dispatch."},KHR_lights_punctual:{supportLevel:"built-in",standardStatus:"ratified",comment:"Parsed into luma.gl Light objects."},KHR_materials_unlit:{supportLevel:"built-in",standardStatus:"ratified",comment:"Unlit materials bypass the default lighting path."},KHR_materials_emissive_strength:{supportLevel:"built-in",standardStatus:"ratified",comment:"Applied by the stock PBR shader."},KHR_texture_basisu:{supportLevel:"built-in",standardStatus:"ratified",comment:"BasisU / KTX2 textures pass through when the device supports them."},KHR_texture_transform:{supportLevel:"built-in",standardStatus:"ratified",comment:"Per-slot UV transforms and animated pointers are applied at runtime; avoid duplicate legacy loader-side baking."},EXT_texture_webp:{supportLevel:"loader-only",standardStatus:"ratified",comment:"Texture source is resolved during load; final support depends on browser and device decode support."},EXT_texture_avif:{supportLevel:"none",standardStatus:"unknown",comment:"Source selection depends on the loaders.gl version and decoder; luma.gl does not independently resolve AVIF sources."},KHR_materials_specular:{supportLevel:"built-in",standardStatus:"ratified",comment:"The stock shader now applies specular factors and textures to the dielectric F0 term."},KHR_materials_ior:{supportLevel:"built-in",standardStatus:"ratified",comment:"The stock shader now drives dielectric reflectance from the glTF IOR value."},KHR_materials_transmission:{supportLevel:"built-in",standardStatus:"ratified",comment:"The stock shader now applies transmission to the base layer and exposes transparency through alpha, without a scene-color refraction buffer."},KHR_materials_volume:{supportLevel:"built-in",standardStatus:"ratified",comment:"Thickness and attenuation now tint transmitted light in the stock shader."},KHR_materials_clearcoat:{supportLevel:"built-in",standardStatus:"ratified",comment:"The stock shader now adds a secondary clearcoat specular lobe."},KHR_materials_sheen:{supportLevel:"built-in",standardStatus:"ratified",comment:"The stock shader now adds a sheen lobe for cloth-like materials."},KHR_materials_iridescence:{supportLevel:"built-in",standardStatus:"ratified",comment:"The stock shader now tints specular response with a view-dependent thin-film iridescence approximation."},KHR_materials_anisotropy:{supportLevel:"built-in",standardStatus:"ratified",comment:"The stock shader now shapes highlights and IBL response with an anisotropy-direction approximation."},KHR_materials_pbrSpecularGlossiness:{supportLevel:"loader-only",standardStatus:"archived",comment:"Extension data can be loaded, but it is not translated into the default metallic-roughness material path."},KHR_materials_variants:{supportLevel:"parsed-and-wired",standardStatus:"ratified",comment:"Primitive material variants can be selected and restored on the generated scenegraph."},EXT_mesh_gpu_instancing:{supportLevel:"built-in",standardStatus:"ratified",comment:"Accessor-backed instance transforms use one instanced draw per source primitive."},KHR_node_visibility:{supportLevel:"parsed-and-wired",standardStatus:"ratified",comment:"Recursive node visibility controls rendered geometry, punctual lights, and animation."},KHR_animation_pointer:{supportLevel:"parsed-and-wired",standardStatus:"ratified",comment:"Node transforms, morph weights and visibility, material factors, texture transforms, camera projections, and punctual lights are wired to runtime updates."},EXT_materials_bump:{supportLevel:"built-in",standardStatus:"draft",comment:"The experimental bump-map draft perturbs the canonical surface normal from a linear height texture."},KHR_materials_diffuse_transmission:{supportLevel:"built-in",standardStatus:"release-candidate",comment:"The Khronos release candidate adds energy-conserving back-lit diffuse transmission and independent color/factor textures."},KHR_materials_dispersion:{supportLevel:"parsed-and-wired",standardStatus:"ratified",comment:"The canonical PBR shader separates red, green, and blue transmission using wavelength-dependent refraction."},KHR_materials_scatter:{supportLevel:"loader-only",standardStatus:"draft",comment:"Thin-wall rendering supports transmission-gated forward/backward diffuse scattering, alpha strength textures and sRGB scatter color. Volumetric mode is rejected; strict required-extension loading does not claim full draft conformance."},KHR_materials_volume_scatter:{supportLevel:"parsed-and-wired",standardStatus:"draft",comment:"The unratified volume-scattering draft is approximated per surface; random-walk and screen-space diffusion are not implemented."},KHR_xmp:{supportLevel:"none",standardStatus:"archived",comment:"Metadata payloads remain in the loaded glTF, but luma.gl does not interpret them."},KHR_xmp_json_ld:{supportLevel:"parsed-and-wired",standardStatus:"ratified",comment:"XMP packet references are available through scene metadata."},EXT_lights_image_based:{supportLevel:"none",standardStatus:"multi-vendor",comment:"Use loadPBREnvironment() or custom environment setup instead."},EXT_texture_video:{supportLevel:"none",standardStatus:"multi-vendor",comment:"Video textures are not created automatically by the stock pipeline."},MSFT_lod:{supportLevel:"parsed-and-wired",standardStatus:"vendor",comment:"Node levels are parsed and selected by opt-in animated crowds; material LOD and GPU-driven selection are not implemented."}};function tZ(e,t){var i;let r,n=Array.from((i=e,tQ(r=new Set,i.extensionsUsed),tQ(r,i.extensionsRequired),tQ(r,i.extensionsRemoved),tQ(r,Object.keys(i.extensions||{})),(i.lights?.length||(i.nodes||[]).some(e=>"light"in e))&&r.add("KHR_lights_punctual"),(i.materials||[]).some(e=>e.unlit||e.extensions?.KHR_materials_unlit)&&r.add("KHR_materials_unlit"),r)).sort(),a=new Set(e.extensionsRequired||[]);return new Map(n.map(i=>{var r;let n=tY[i]||tJ,s=function(e,t,i,r){if("KHR_texture_basisu"!==e||!r)return t;let n=(function(e){let t=[];for(let i of e.textures||[]){let e=i?.source?.image;if(!e?.compressed)continue;let r=Array.isArray(e.data)?e.data[0]:Array.isArray(e.mipmaps)?e.mipmaps[0]:void 0;t.push(r?.textureFormat??null)}return t})(i).find(e=>null===e||!r.isTextureFormatSupported(e));return void 0===n?t:{supportLevel:"none",comment:null===n?`The ${r.type} device cannot use a BasisU texture whose transcoded GPU format is missing.`:`The ${r.type} device does not support the transcoded BasisU texture format '${n}'.`}}(i,n,e,t);return[i,{extensionName:i,required:a.has(i),supported:"built-in"===(r=s.supportLevel)||"parsed-and-wired"===r,supportLevel:s.supportLevel,standardStatus:n.standardStatus,comment:s.comment}]}))}function tQ(e,t=[]){for(let i of t)e.add(i)}function t0(e){switch(e){case"translation":case"rotation":case"scale":case"weights":return e;default:return null}}function t1(e){let t=t3(e);if(t){let e=tY[t]||null;if(e?.supportLevel==="none")return`${t} is referenced by this pointer, but ${e.comment.charAt(0).toLowerCase()}${e.comment.slice(1)}`}return`no runtime target exists for material property "${e.join("/")}"`}function t3(e){let t=e.indexOf("extensions"),i=e[t+1];return t>=0&&i?i:null}function t2(e,t){W.R.warn(`KHR_animation_pointer target ${e} will be skipped because ${t}`)()}function t4(e){if(e.value)return t5(!(e.value instanceof BigInt64Array)&&!(e.value instanceof BigUint64Array),"glTF animation accessors cannot use BigInt component arrays"),{value:e.value,components:e.components};let t=e.bufferView?.data;t5(void 0!==t),t5(5126===e.componentType);let i="SCALAR"===e.type?1:Number(e.type.slice(3));return{value:new Float32Array(t.buffer,t.byteOffset+(e.byteOffset||0),e.count*i),components:i}}function t5(e,t){if(!e)throw Error(t)}function t6(e){let t=[];return e.gltf.nodes.forEach((i,r)=>{let n=i.extensions?.KHR_billboard;if(!n)return;let a=e.gltfNodeIndexToNodeMap.get(r);(0,$.v)(a);let s=n.rotationAxis||["X","Y","Z"];(0,$.v)("y"===s?!0===e.allowLegacyYAxis:3===s.length&&3===new Set(s).size&&s.every(e=>["X","Y","Z"].includes(e))),t.push({node:a,definition:{...n,...n.viewDirection?{viewDirection:[...n.viewDirection]}:{},...n.up?{up:[...n.up]}:{},rotationAxis:"y"===n.rotationAxis?"y":"all"},matrixAuthored:!!i.matrix})}),{scenes:e.scenes,bindings:t}}function t9(e){if(!e)return{bounds:null,center:[0,0,0],size:[0,0,0],radius:.5,recommendedOrbitDistance:1};let t=[[e[0][0],e[0][1],e[0][2]],[e[1][0],e[1][1],e[1][2]]],i=[t[1][0]-t[0][0],t[1][1]-t[0][1],t[1][2]-t[0][2]],r=[t[0][0]+.5*i[0],t[0][1]+.5*i[1],t[0][2]+.5*i[2]],n=.5*Math.max(i[0],i[1],i[2]),a=Math.max(.5*Math.hypot(i[0],i[1],i[2]),.001);return{bounds:t,center:r,size:i,radius:a,recommendedOrbitDistance:Math.max(Math.max(n,.001)/Math.tan(Math.PI/6)*1.15,1.1*a)}}var t8=i(72217);async function t7(e){let t=[];return e.scenes.forEach(e=>{e.traverse(e=>{})}),await ie(()=>t.some(e=>!e.loaded))}async function ie(e){for(;e();)await new Promise(e=>requestAnimationFrame(e))}var it=i(29581),ii=i(21671);let ir=`\
layout(std140) uniform scenegraphUniforms {
  float rowIndexOffset;
  float sizeScale;
  float sizeMinPixels;
  float sizeMaxPixels;
  mat4 sceneModelMatrix;
  float composeModelMatrix;
} scenegraph;
`,ia={name:"scenegraph",source:`\
struct ScenegraphUniforms {
  rowIndexOffset: f32,
  sizeScale: f32,
  sizeMinPixels: f32,
  sizeMaxPixels: f32,
  sceneModelMatrix: mat4x4<f32>,
  composeModelMatrix: f32,
};

@group(0) @binding(auto)
var<uniform> scenegraph: ScenegraphUniforms;
`,vs:ir,fs:ir,uniformTypes:{rowIndexOffset:"f32",sizeScale:"f32",sizeMinPixels:"f32",sizeMaxPixels:"f32",sceneModelMatrix:"mat4x4<f32>",composeModelMatrix:"f32"}},is=`\
#version 300 es
#define SHADER_NAME scenegraph-layer-vertex-shader
in vec3 instancePositions;
in vec3 instancePositions64Low;
in vec4 instanceColors;
in vec3 instanceModelMatrixCol0;
in vec3 instanceModelMatrixCol1;
in vec3 instanceModelMatrixCol2;
in vec3 instanceTranslation;
in vec3 positions;
#ifdef HAS_UV
in vec2 texCoords;
#endif
#ifdef LIGHTING_PBR
#ifdef HAS_NORMALS
in vec3 normals;
#endif
#endif
out vec4 vColor;
#ifndef LIGHTING_PBR
#ifdef HAS_UV
out vec2 vTEXCOORD_0;
#endif
#endif
void main(void) {
#if defined(HAS_UV) && !defined(LIGHTING_PBR)
vTEXCOORD_0 = texCoords;
geometry.uv = texCoords;
#endif
geometry.worldPosition = instancePositions;
geometry.pickingColor = picking_getPickingColorFromIndex(scenegraph.rowIndexOffset + float(gl_InstanceID));
mat3 instanceModelMatrix = mat3(instanceModelMatrixCol0, instanceModelMatrixCol1, instanceModelMatrixCol2);
vec3 normal = vec3(0.0, 0.0, 1.0);
#ifdef LIGHTING_PBR
#ifdef HAS_NORMALS
normal = instanceModelMatrix * (scenegraph.sceneModelMatrix * vec4(normals, 0.0)).xyz;
#endif
#endif
float originalSize = project_size_to_pixel(scenegraph.sizeScale);
float clampedSize = clamp(originalSize, scenegraph.sizeMinPixels, scenegraph.sizeMaxPixels);
float sizeRatio = originalSize == 0.0 ? 0.0 : clampedSize / originalSize;
vec3 pos = (instanceModelMatrix * (scenegraph.sceneModelMatrix * vec4(positions, 1.0)).xyz) * scenegraph.sizeScale * sizeRatio + instanceTranslation;
if(scenegraph.composeModelMatrix > 0.5) {
DECKGL_FILTER_SIZE(pos, geometry);
geometry.normal = project_normal(normal);
geometry.worldPosition += pos;
gl_Position = project_position_to_clipspace(pos + instancePositions, instancePositions64Low, vec3(0.0), geometry.position);
}
else {
pos = project_size(pos);
DECKGL_FILTER_SIZE(pos, geometry);
gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, pos, geometry.position);
geometry.normal = project_normal(normal);
}
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
#ifdef LIGHTING_PBR
pbr_vPosition = geometry.position.xyz;
#ifdef HAS_NORMALS
pbr_vNormal = geometry.normal;
#endif
#ifdef HAS_UV
pbr_vUV0 = texCoords;
#else
pbr_vUV0 = vec2(0., 0.);
#endif
pbr_vUV1 = vec2(0., 0.);
geometry.uv = pbr_vUV0;
#endif
vColor = instanceColors;
DECKGL_FILTER_COLOR(vColor, geometry);
}
`,io=`\
#version 300 es
#define SHADER_NAME scenegraph-layer-fragment-shader
in vec4 vColor;
out vec4 fragColor;
#ifndef LIGHTING_PBR
#if defined(HAS_UV) && defined(HAS_BASECOLORMAP)
in vec2 vTEXCOORD_0;
uniform sampler2D pbr_baseColorSampler;
#endif
#endif
void main(void) {
#ifdef LIGHTING_PBR
fragColor = pbr_filterColor(vColor);
geometry.uv = pbr_vUV0;
#else
#if defined(HAS_UV) && defined(HAS_BASECOLORMAP)
fragColor = vColor * texture(pbr_baseColorSampler, vTEXCOORD_0);
geometry.uv = vTEXCOORD_0;
#else
fragColor = vColor;
#endif
#endif
fragColor.a *= layer.opacity;
DECKGL_FILTER_COLOR(fragColor, geometry);
}
`,il=`\
struct VertexInputs {
  @location(0) positions: vec3<f32>,
#ifdef HAS_NORMALS
  @location(1) normals: vec3<f32>,
#endif
#ifdef HAS_UV
  @location(3) texCoords: vec2<f32>,
#endif
  @location(6) instancePositions: vec3<f32>,
  @location(7) instancePositions64Low: vec3<f32>,
  @location(8) instanceColors: vec4<f32>,
  @location(10) instanceModelMatrixCol0: vec3<f32>,
  @location(11) instanceModelMatrixCol1: vec3<f32>,
  @location(12) instanceModelMatrixCol2: vec3<f32>,
  @location(13) instanceTranslation: vec3<f32>,
};

struct FragmentInputs {
  @builtin(position) position: vec4<f32>,
  @location(0) vColor: vec4<f32>,
  @location(1) vTexCoord: vec2<f32>,
  @location(2) pbrPosition: vec3<f32>,
  @location(3) pbrUV: vec2<f32>,
  @location(4) pbrNormal: vec3<f32>,
  @location(5) pickingColor: vec3<f32>,
};

@vertex
fn vertexMain(
  inputs: VertexInputs,
  @builtin(instance_index) instanceIndex: u32
) -> FragmentInputs {
  var outputs: FragmentInputs;

  geometry.worldPosition = inputs.instancePositions;
  geometry.pickingColor = picking_getPickingColorFromIndex(instanceIndex + u32(scenegraph.rowIndexOffset));

  var vertexPosition = inputs.positions;
  var texCoord = vec2<f32>(0.0, 0.0);
  var normal = vec3<f32>(0.0, 0.0, 1.0);

#ifdef HAS_UV
  texCoord = inputs.texCoords;
#endif
#ifdef HAS_NORMALS
  normal = inputs.normals;
#endif

  geometry.uv = texCoord;

  let instanceModelMatrix = mat3x3<f32>(
    inputs.instanceModelMatrixCol0,
    inputs.instanceModelMatrixCol1,
    inputs.instanceModelMatrixCol2
  );

  let scenePosition = (scenegraph.sceneModelMatrix * vec4<f32>(vertexPosition, 1.0)).xyz;
  let worldNormal = instanceModelMatrix * (scenegraph.sceneModelMatrix * vec4<f32>(normal, 0.0)).xyz;

  let originalSize = project_meter_size_to_pixel(scenegraph.sizeScale);
  let clampedSize = clamp(originalSize, scenegraph.sizeMinPixels, scenegraph.sizeMaxPixels);
  let sizeRatio = select(0.0, clampedSize / originalSize, originalSize > 0.0);

  var pos =
    (instanceModelMatrix * scenePosition) * scenegraph.sizeScale * sizeRatio +
    inputs.instanceTranslation;

  if (scenegraph.composeModelMatrix > 0.5) {
    DECKGL_FILTER_SIZE(&pos, geometry);
    geometry.normal = project_normal(worldNormal);
    geometry.worldPosition = inputs.instancePositions + pos;
    geometry.position = vec4<f32>(
      project_position_vec3_f64(inputs.instancePositions + pos, inputs.instancePositions64Low),
      1.0
    );
  } else {
    var sizeAdjustedPos = project_size_vec3(pos);
    DECKGL_FILTER_SIZE(&sizeAdjustedPos, geometry);
    // Scenegraph offsets are east/north/up in globe mode. Use project32's helper so it can
    // rotate the offset onto the local tangent plane before producing the common position.
    let projectResult = project_position_to_clipspace_and_commonspace(
      inputs.instancePositions,
      inputs.instancePositions64Low,
      sizeAdjustedPos
    );
    geometry.position = projectResult.commonPosition;
    geometry.normal = project_normal(worldNormal);
  }

  outputs.position = project_common_position_to_clipspace(geometry.position);
  outputs.vColor = inputs.instanceColors;
  outputs.vTexCoord = texCoord;
  outputs.pbrPosition = geometry.position.xyz;
  outputs.pbrUV = texCoord;
  outputs.pbrNormal = geometry.normal;
  outputs.pickingColor = geometry.pickingColor;
  DECKGL_FILTER_GL_POSITION(&outputs.position, geometry);
  return outputs;
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4<f32> {
  fragmentGeometry.uv = inputs.vTexCoord;

  if (picking.isActive > 0.5) {
    if (!picking_isColorValid(inputs.pickingColor)) {
      discard;
    }
    var extensionColor = vec4<f32>(inputs.pickingColor, 1.0);
    DECKGL_FILTER_COLOR(&extensionColor, fragmentGeometry);
    // Color filters may discard, but must not alter the picking payload.
    return vec4<f32>(inputs.pickingColor, 1.0);
  }

  var fragColor = inputs.vColor;

#ifdef LIGHTING_PBR
  fragmentInputs.pbr_vPosition = inputs.pbrPosition;
  // scenegraphPbrMaterial uses the indexed UV fields from the current PBR module.
  fragmentInputs.pbr_vUV0 = inputs.pbrUV;
  fragmentInputs.pbr_vUV1 = vec2<f32>(0.0);
  fragmentInputs.pbr_vNormal = inputs.pbrNormal;
  // Vertex color is part of the material base color and must be applied before lighting.
  fragColor = pbr_filterColor(fragColor);
#else
#ifdef HAS_BASECOLORMAP
  fragColor =
    fragColor *
    textureSample(pbr_baseColorSampler, pbr_baseColorSamplerSampler, inputs.vTexCoord);
#endif
#endif

  fragColor.a *= layer.opacity;

  if (picking.isHighlightActive > 0.5) {
    let highlightedObjectColor = picking_normalizeColor(picking.highlightedObjectColor);
    if (picking_isColorZero(abs(inputs.pickingColor - highlightedObjectColor))) {
      let highlightAlpha = picking.highlightColor.a;
      let blendedAlpha = highlightAlpha + fragColor.a * (1.0 - highlightAlpha);
      if (blendedAlpha > 0.0) {
        let highlightRatio = highlightAlpha / blendedAlpha;
        fragColor = vec4<f32>(
          mix(fragColor.rgb, picking.highlightColor.rgb, highlightRatio),
          blendedAlpha
        );
      }
    }
  }

  DECKGL_FILTER_COLOR(&fragColor, fragmentGeometry);
  return deckgl_premultiplied_alpha(fragColor);
}
`,ic=M.s.source.replace(/fn pbr_setPositionNormalTangentUV\([\s\S]*?\n}\n/,`fn pbr_setPositionNormalTangentUV(position: vec4f, normal: vec4f, tangent: vec4f, uv: vec2f)
{
  fragmentInputs.pbr_vPosition = position.xyz;
  fragmentInputs.pbr_vNormal = normal.xyz;
  fragmentInputs.pbr_vTBN = mat3x3f(
    vec3f(1.0, 0.0, 0.0),
    vec3f(0.0, 1.0, 0.0),
    vec3f(0.0, 0.0, 1.0)
  );
  fragmentInputs.pbr_vUV0 = uv;
  fragmentInputs.pbr_vUV1 = uv;
}
`).replace(/pbrProjection\.camera/g,"project.cameraPosition"),iu={...M.s,source:ic},ip=[255,255,255,255],ih={scenegraph:{type:"object",value:null,async:!0},getScene:e=>e&&e.scenes?"object"==typeof e.scene?e.scene:e.scenes[e.scene||0]:e,getAnimator:e=>e&&e.animator,_animations:null,onFirstDraw:{type:"function",value:()=>{}},sizeScale:{type:"number",value:1,min:0},sizeMinPixels:{type:"number",min:0,value:0},sizeMaxPixels:{type:"number",min:0,value:Number.MAX_SAFE_INTEGER},positions:{type:"object",value:null,optional:!0},colors:{type:"object",value:null,optional:!0},getPosition:{type:"accessor",value:e=>e.position},getColor:{type:"accessor",value:ip},_lighting:"flat",_imageBasedLightingEnvironment:void 0,getOrientation:{type:"accessor",value:[0,0,0]},getScale:{type:"accessor",value:[1,1,1]},getTranslation:{type:"accessor",value:[0,0,0]},getTransformMatrix:{type:"accessor",value:[]},loaders:[t8.B]};class im extends d.A{getShaders(){let e,t={},i=this.context.device?.type==="webgpu";"pbr"===this.props._lighting?(e=i?iu:M.s,t.LIGHTING_PBR=1):e=i?iu:{name:"pbrMaterial"};let r=[g.A,b.A,v.Ay,ia,e];return super.getShaders({defines:t,vs:is,fs:io,source:il,modules:r})}initializeState(){let e=this.getAttributeManager(),t="webgpu"!==this.context.device.type;e.addInstanced({instancePositions:{size:3,type:"float64",fp64:this.use64bitPositions(),...this.usePositionTransforms(),accessor:"getPosition",transition:t},instanceColors:{type:"unorm8",size:this.props.colorFormat.length,accessor:"getColor",defaultValue:ip,transition:t},instanceModelMatrix:ii.UB})}updateState(e){super.updateState(e);let{props:t,oldProps:i}=e;this.updateColumns(e),t.scenegraph!==i.scenegraph?this._updateScenegraph():t._animations!==i._animations&&this._applyAnimationsProp(this.state.animator,t._animations)}finalizeState(e){this.state.columns?.destroy(),super.finalizeState(e),this._destroyScenegraphAssets()}get isLoaded(){return!!(this.state?.scenegraph&&!this.state.columns?.loading&&super.isLoaded)}getNumInstances(){return this.state?.columns&&!Number.isFinite(this.props.numInstances)?this.state.columns.length:super.getNumInstances()}getBounds(){return this.state?.columns?this.state.columns.getBounds():super.getBounds()}updateColumns(e){if(!this.props.positions&&!this.props.colors){if(!this.state.columns)return;this.state.columns.destroy(),this.state.columns=void 0,this.internalState.attributeManager=this._getAttributeManager(),this.initializeState();return}if(this.props.extensions.length||Object.keys(this.props.transitions||{}).length)throw Error("Scenegraph columns do not support extensions or transitions");this.state.columns||(this.internalState.attributeManager?.finalize(),this.internalState.attributeManager=null,this.state.columns=new S.h(this.context.device,it.cc,"Scenegraph"));let t=it.EN.some(t=>!(0,_.b)(e.props[t],e.oldProps[t],1)&&("function"!=typeof e.props[t]||"function"!=typeof e.oldProps[t]));this.state.columns.updateIfNeeded({...e,changeFlags:{...e.changeFlags,dataChanged:e.changeFlags.dataChanged||!!t&&"transforms changed"}},{dataLoading:this.internalState.isAsyncPropLoading("data"),changed:()=>{this.setState({}),this.setNeedsUpdate()},failed:e=>this.raiseError(e,"converting scenegraph columns"),prepareFallbacks:(e,t,i)=>(0,it._3)(this.context.device,this.props,e,t,i),positionOptions:{transform:this.usePositionTransforms().transform?.bind(this),fp64:this.use64bitPositions()}})}_updateScenegraph(){let e=this.props,{device:t}=this.context,i=null;if(e.scenegraph instanceof K)i={scenes:[e.scenegraph]};else if(e.scenegraph&&"object"==typeof e.scenegraph){let r=e.scenegraph,n=function(e,t,i){var r;let n,a,s,o=function(e){let t=new el,i=e.extensions?.KHR_xmp_json_ld,r=i?.packets||[];for(let[i,n]of[["asset",[e.asset]],["scene",e.scenes||[]],["node",e.nodes||[]],["mesh",e.meshes||[]],["material",e.materials||[]],["image",e.images||[]],["animation",e.animations||[]]])n.forEach((e,n)=>{let a=e?.extensions?.KHR_xmp_json_ld;if(!a)return;let s=a.packet;if(!Number.isInteger(s)||s<0||s>=r.length)throw Error(`glTF: invalid XMP packet index ${s}`);let o=r[s];if(!o||"object"!=typeof o||Array.isArray(o))throw Error(`glTF: invalid XMP packet ${s}`);t.set(i,n,o)});return t}(t);if(i?.strictExtensions&&function(e,t){let i=Array.from(tZ(e,t).values()).filter(e=>e.required&&!e.supported);if(i.length)throw Error(`Unsupported required glTF extensions: ${i.map(e=>e.extensionName).join(", ")}. ${i.map(e=>`${e.extensionName}: ${e.comment}`).join(" ")}`)}(t,e),i?.billboards){let e=new Map;t.nodes.forEach((t,i)=>{t.extensions?.KHR_billboard&&e.set(i,new Y)}),new em(t6({gltf:t,scenes:[],gltfNodeIndexToNodeMap:e,allowLegacyYAxis:i.billboards.allowLegacyYAxis})).destroy()}let{scenes:l,materials:c,gltfMeshIdToNodeMap:f,gltfNodeIdToNodeMap:u,gltfNodeIndexToNodeMap:p,generatedTextures:h,materialInstances:m}=function(e,t,i={}){let r=new Set,n=new Map,a={...ty,...i,generatedTextures:r,materialInstances:n},s=new eH(e,{modules:[M.s]}),o=(t.materials||[]).map((i,r)=>{var n,o;return tb(e,{id:(n=i,o=r,n.name||n.id||`material-${o}`),parsedPPBRMaterial:tA(e,i,{TEXCOORD_1:!0},{...a,gltf:t,validateAttributes:!1,materialResourcesOnly:!0}),materialFactory:s})}),l=new Map;(t.materials||[]).forEach((e,t)=>{l.set(e.id,o[t])});let c=new Map;t.meshes.forEach((i,r)=>{let n=tE(e,i,t,l,{...a,validateLightmapAttributes:!1});c.set(i.id,n)});let f=new Map,u=new Map,p=new Set,h=new Set,m=new Set;return t.nodes.forEach((e,t)=>{var i;let r=new Y({id:(i=e).name||i.id,children:[],matrix:i.matrix,display:i.extensions?.KHR_node_visibility?.visible!==!1,selectable:i.extensions?.KHR_node_selectability?.selectable!==!1,hoverable:i.extensions?.KHR_node_hoverability?.hoverable!==!1,position:i.translation,rotation:i.rotation,scale:i.scale});f.set(t,r),u.set(e.id,r)}),t.nodes.forEach((i,r)=>{if(f.get(r).add((i.children??[]).map(({id:e})=>{let t=u.get(e);if(!t)throw Error(`Cannot find child ${e} of node ${r}`);return t})),i.mesh){let n=i.mesh,s=function(e,t){let i,r=t.extensions?.EXT_mesh_gpu_instancing?.attributes;if(!r||"object"!=typeof r)return null;let n={};for(let[t,a]of Object.entries(r)){let r="number"==typeof a?e.accessors[a]:a;if(!r||!ArrayBuffer.isView(r.value))throw Error(`Invalid glTF instance accessor for ${t}`);if(void 0!==i&&r.count!==i)throw Error("glTF instance attributes must have matching accessor counts");i=r.count,n[t]={value:r.value,size:r.components||function(e){switch(e){case"VEC2":return 2;case"VEC3":return 3;case"VEC4":return 4;default:return 1}}(r.type),count:r.count,normalized:!!r.normalized}}let a=[];for(let e=0;e<(i||0);e++){let t=tS(n.TRANSLATION,e,[0,0,0]),i=tS(n.ROTATION,e,[0,0,0,1]),r=tS(n.SCALE,e,[1,1,1]),s=Math.hypot(...i);if(s>0)for(let e=0;e<i.length;e++)i[e]/=s;a.push(new U().translate(t).multiplyRight(new U().fromQuaternion(i)).scale(r))}return{matrices:a,attributes:n}}(t,i),o=i.extensions?.KHR_lightmap;for(let[e,t]of(o&&function(e,t){(0,$.v)(e.lightmaps.length>0);let i=new Set;for(let r of e.lightmaps)(0,$.v)(Number.isInteger(r.primitive)&&r.primitive>=0&&r.primitive<t),(0,$.v)(!i.has(r.primitive)),i.add(r.primitive)}(o,n.primitives.length),n.primitives.entries())){let i=o?.lightmaps.find(t=>t.primitive===e)||t.material?.extensions?.KHR_lightmap;if(i){let e=(0,tM.CC)(i.lightmapTexture);(0,$.v)((0===e||1===e)&&!!t.attributes[`TEXCOORD_${e}`])}}let u=n.primitives.some(e=>!!e.targets?.length),d=o||s||a.publishedTransforms&&h.has(n.id)||u&&p.has(n.id)?tE(e,n,t,l,a,s||void 0,o):c.get(n.id);if(!d)throw Error(`Cannot find mesh child ${i.mesh.id} of node ${r}`);let g=f.get(r),b=c.get(n.id),v=h.has(n.id)&&(void 0!==i.skin||m.has(n.id))&&d===b?tE(e,n,t,l,a):d;if(g.add(v),g.userData.gltfMesh=v,h.add(n.id),void 0!==i.skin&&m.add(n.id),u){p.add(n.id);let e=n.primitives.find(e=>e.targets?.length)?.targets?.length||0,t=i.weights||n.weights||Array(e).fill(0);g.userData.morphMeshes=[v],a.modelOptions?.userData?.gltfAnimatedCrowd?g.userData.morphWeights=[...t]:tT(g,t)}}}),{scenes:t.scenes.map(e=>{let t=(e.nodes||[]).map(({id:t})=>{let i=u.get(t);if(!i)throw Error(`Cannot find child ${t} of scene ${e.name||e.id}`);return i});return new Y({id:e.name||e.id,children:t})}),materials:o,gltfMeshIdToNodeMap:c,gltfNodeIdToNodeMap:u,gltfNodeIndexToNodeMap:f,generatedTextures:r,materialInstances:n}}(e,t,i),d=i?.billboards?new em(t6({gltf:t,scenes:l,gltfNodeIndexToNodeMap:p,allowLegacyYAxis:i.billboards.allowLegacyYAxis})):null;l.forEach((e,i)=>{let r=o.get("scene",i);r&&(e.metadata.xmp=r);let n=t.scenes[i]?.extensions?.FB_geometry_metadata;n&&(e.metadata["fb:geometry"]=n)});let g=new Map;t.meshes.forEach((e,t)=>{let i=o.get("mesh",t);if(!i)return;g.set(e.id,i);let r=f.get(e.id);r&&(r.metadata.xmp=i)}),p.forEach((e,i)=>{let r=o.get("node",i);if(r&&(e.metadata.xmp=r),!g.size)return;let n=t.nodes[i]?.mesh,a=n&&g.get(n.id),s=e.userData.gltfMesh;a&&s instanceof Y&&(s.metadata.xmp=a)}),c.forEach((e,t)=>{let i=o.get("material",t);if(i)for(let r of(e.metadata.xmp=i,m.get(t)||[]))r.metadata.xmp=i});let b=function(e,t){let i=e.nodes??[],r=eh(ef(e.extensions?.[ec]??{}).physicsJoints),n=[],a=[];for(let e of t.keys()){let s=i[e].extensions?.[ec],o=void 0===s?void 0:ef(s).joint;if(void 0!==o)try{let i=ef(o);eu(i,["joint","connectedNode","enableCollision"]);let a=ep(i.joint),s=ep(i.connectedNode);if(void 0===a||!Number.isInteger(a)||!r[a]||void 0===s)throw Error("Invalid joint reference");if(void 0!==i.enableCollision&&"boolean"!=typeof i.enableCollision)throw Error("Invalid connected collision flag");let l=ef(r[a]);eu(l,["limits","drives"]);let c=t.get(e),f=t.get(s);if(!c||!f)throw Error("Joint attachment must be in the selected scene");let u=[],p=[];for(let e of eh(l.limits)){let t=ef(e);if(eu(t,["linearAxes","angularAxes","min","max","stiffness","damping"]),void 0===t.linearAxes==(void 0===t.angularAxes))throw Error("A limit needs exactly one axis kind");let i=eh(t.linearAxes??t.angularAxes).map(e=>{if("number"!=typeof e)throw Error("Invalid limit axis");return e});u.push({axes:i,angular:void 0!==t.angularAxes,minimum:ep(t.min),maximum:ep(t.max),stiffness:ep(t.stiffness),damping:ep(t.damping)})}for(let e of eh(l.drives)){let t=ef(e);if(eu(t,["type","mode","axis","maxForce","positionTarget","velocityTarget","stiffness","damping"]),!["linear","angular"].includes(String(t.type))||"force"!==t.mode&&"acceleration"!==t.mode)throw Error("Invalid drive type");if(void 0===t.positionTarget!=(void 0===t.stiffness)||void 0===t.velocityTarget!=(void 0===t.damping))throw Error("Drive targets require matching response coefficients");let i=ep(t.axis);if(void 0===i)throw Error("Missing drive axis");p.push({angular:"angular"===t.type,axis:i,mode:"acceleration"===t.mode?"acceleration":"force",maximumForce:ep(t.maxForce),positionTarget:ep(t.positionTarget),velocityTarget:ep(t.velocityTarget),stiffness:ep(t.stiffness),damping:ep(t.damping)})}n.push({nodeIndex:e,connectedNodeIndex:s,jointIndex:a,joint:{first:c,second:f,limits:u,drives:p,collideConnected:!0===i.enableCollision}})}catch(t){a.push({code:"unsupported-or-invalid-joint",path:`/nodes/${e}/extensions/${ec}/joint`,message:t instanceof Error?t.message:String(t)})}}return{declarations:n,issues:a}}(t,p),v=new eI(b.declarations.map(e=>e.joint)),S=(n=t.animations||[],a=new Map,s=new Map,n.flatMap((e,i)=>{let r=e.name||`Animation-${i}`,n=new Map,o=e.channels.flatMap(({sampler:i,target:r})=>{let o=function(e,t){let i;if("weights"===t.path)i=t.node;else{if("pointer"!==t.path)return;let e=t.extensions?.KHR_animation_pointer?.pointer,r="string"==typeof e?/^\/nodes\/(\d+)\/weights$/.exec(e):null;if(!r)return;i=Number(r[1])}let r=e.nodes[i??0],n="number"==typeof r?.mesh?e.meshes[r.mesh]:r?.mesh;return r?.weights?.length||n?.weights?.length||n?.primitives?.[0]?.targets?.length||1}(t,r),l=`${i}:${o??0}`,c=n.get(l);if(!c){let r=e.samplers[i];if(!r)throw Error(`Cannot find animation sampler ${i}`);let{input:f,interpolation:u="LINEAR",output:p}=r,h=function(e,t){if(t.has(e))return t.get(e);let{value:i,components:r}=t4(e);t5(1===r,"accessorToJsArray1D must have exactly 1 component");let n=Array.from(i);return t.set(e,n),n}(t.accessors[f],a),m=function(e,t){if(t.has(e))return t.get(e);let{value:i,components:r}=t4(e);t5(r>=1,"accessorToJsArray2D must have at least 1 component");let n=[];for(let e=0;e<i.length;e+=r)n.push(Array.from(i.slice(e,e+r)));return t.set(e,n),n}(t.accessors[p],s);c={input:h,interpolation:u,output:void 0!==o?function(e,t,i,r){let n=e.length/(Math.max(t,1)*("CUBICSPLINE"===i?3:1)),a=r>1?r:Number.isInteger(n)&&n>1?n:r;if(a<=1)return e;let s=e.flat(),o=[];for(let e=0;e<s.length;e+=a)o.push(s.slice(e,e+a));return o}(m,h.length,u,o):m},n.set(l,c)}let f=function(e,t,i){if("pointer"===t.path)return function(e,t,i){let r=t.extensions?.KHR_animation_pointer?.pointer;if("string"!=typeof r||!r.startsWith("/"))return W.R.warn("KHR_animation_pointer channel is missing a valid JSON pointer and will be skipped")(),null;if(function e(t){let i=/^(.*)\/(0|[1-9]\d*)$/.exec(t);if(i){let t=/\/(centerOfMass|inertiaDiagonal|linearVelocity|angularVelocity|size)$/.test(i[1])?3:4*!!/\/inertiaOrientation$/.test(i[1]);if(Number(i[2])<t)return e(i[1])}return/^\/extensions\/KHR_implicit_shapes\/shapes\/\d+\/(sphere\/radius|box\/size|(?:capsule|cylinder)\/(height|radiusBottom|radiusTop)|plane\/(sizeX|sizeZ|doubleSided))$/.test(t)||/^\/nodes\/\d+\/extensions\/KHR_physics_rigid_bodies\/(motion\/(isKinematic|mass|centerOfMass|inertiaDiagonal|inertiaOrientation|linearVelocity|angularVelocity|gravityFactor)|joint\/enableCollision)$/.test(t)||/^\/extensions\/KHR_physics_rigid_bodies\/physicsMaterials\/\d+\/(staticFriction|dynamicFriction|restitution)$/.test(t)||/^\/extensions\/KHR_physics_rigid_bodies\/physicsJoints\/\d+\/(limits\/\d+\/(min|max|stiffness|damping)|drives\/\d+\/(maxForce|positionTarget|velocityTarget|stiffness|damping))$/.test(t)}(r)){if(/(isKinematic|enableCollision)$/.test(r)&&"STEP"!==i.interpolation)throw Error("Boolean physics channels require STEP interpolation");return{type:"property",pointer:r,sampler:i}}let n=r.slice(1).split("/").map(e=>e.replace(/~1/g,"/").replace(/~0/g,"~"));switch(n[0]){case"nodes":return function(e,t,i,r){let n=5===t.length&&"extensions"===t[2]&&"KHR_node_visibility"===t[3]&&"visible"===t[4],a=5===t.length&&"extensions"===t[2]&&"KHR_node_selectability"===t[3]&&"selectable"===t[4],s=5===t.length&&"extensions"===t[2]&&"KHR_node_hoverability"===t[3]&&"hoverable"===t[4],o=n||a||s;if(3!==t.length&&!o)return t2(r,"node pointers must target transforms, morph weights, visibility, selectability, or hoverability"),null;let l=Number(t[1]),c=e.nodes[l];if(!Number.isInteger(l)||!c)return W.R.warn(`KHR_animation_pointer target ${r} references a missing node and will be skipped`)(),null;if(o&&"STEP"!==i.interpolation)return t2(r,"boolean node animation requires STEP interpolation"),null;let f=n?"visibility":a?"selectable":s?"hoverable":t0(t[2]);return f?{type:"node",sampler:i,targetNodeId:c.id,path:f}:(t2(r,`node property "${t[2]}" has no runtime animation mapping`),null)}(e,n,i,r);case"materials":var a,s,o,l,c,f,u,p,h=e,m=n,d=i,g=r;if(m.length<3)return t2(g,"material pointers must include a material index and target property path"),null;let b=Number(m[1]),v=h.materials[b];if(!Number.isInteger(b)||!v)return W.R.warn(`KHR_animation_pointer target ${g} references a missing material and will be skipped`)(),null;let S=function(e,t){let i=function(e,t){let i,r=t.lastIndexOf("extensions");if(r<0||"KHR_texture_transform"!==t[r+1]||r<1)return{reason:"not-a-texture-transform-target"};let n=(0,tM.Mg)(t.slice(0,r));if(!n)return{reason:function(e){let t=t3(e);if(t){let e=tY[t]||null;if(e?.supportLevel==="none")return`${t} is referenced by this pointer, but ${e.comment.charAt(0).toLowerCase()}${e.comment.slice(1)}`}return`texture-transform target "${e.join("/")}" has no runtime texture-slot mapping`}(t.slice(0,r))};let a=function(e,t){let i=e;for(let e of t)if(!(i=i?.[e]))return null;return i}(e,n.pathSegments);if(!a)return{reason:`texture-transform target "${t.slice(0,r).join("/")}" does not exist on the referenced material`};let s=t[r+2];if("texCoord"===s)return{reason:"animated KHR_texture_transform.texCoord is unsupported because texCoord selection is structural, not a runtime float/vector update"};if("offset"!==s&&"rotation"!==s&&"scale"!==s)return{reason:`KHR_texture_transform property "${s}" is not animatable; supported properties are offset, rotation, and scale`};let o=t[r+3];if(t.length>r+4)return{reason:`KHR_texture_transform.${s} does not support nested property paths`};if(void 0!==o){if(i=Number(o),"rotation"===s)return{reason:"KHR_texture_transform.rotation does not support component indices"};if(!Number.isInteger(i)||i<0||i>1)return{reason:`KHR_texture_transform.${s} component index "${o}" is invalid; only 0 and 1 are supported`}}return{type:"textureTransform",textureSlot:n.slot,path:s,component:i,baseTransform:(0,tM.e3)(a)}}(e,t);if(!("reason"in i)||"not-a-texture-transform-target"!==i.reason)return i;switch(t.join("/")){case"pbrMetallicRoughness/baseColorFactor":return e.pbrMetallicRoughness?{type:"material",property:"baseColorFactor"}:{reason:t1(t)};case"pbrMetallicRoughness/metallicFactor":return e.pbrMetallicRoughness?{type:"material",property:"metallicRoughnessValues",component:0}:{reason:t1(t)};case"pbrMetallicRoughness/roughnessFactor":return e.pbrMetallicRoughness?{type:"material",property:"metallicRoughnessValues",component:1}:{reason:t1(t)};case"normalTexture/scale":return e.normalTexture?{type:"material",property:"normalScale"}:{reason:t1(t)};case"occlusionTexture/strength":return e.occlusionTexture?{type:"material",property:"occlusionStrength"}:{reason:t1(t)};case"emissiveFactor":return{type:"material",property:"emissiveFactor"};case"alphaCutoff":return{type:"material",property:"alphaCutoff"};case"extensions/KHR_materials_specular/specularFactor":return e.extensions?.KHR_materials_specular?{type:"material",property:"specularIntensityFactor"}:{reason:t1(t)};case"extensions/KHR_materials_specular/specularColorFactor":return e.extensions?.KHR_materials_specular?{type:"material",property:"specularColorFactor"}:{reason:t1(t)};case"extensions/KHR_materials_ior/ior":return e.extensions?.KHR_materials_ior?{type:"material",property:"ior"}:{reason:t1(t)};case"extensions/EXT_materials_bump/bumpFactor":return e.extensions?.EXT_materials_bump?{type:"material",property:"bumpFactor"}:{reason:t1(t)};case"extensions/KHR_materials_diffuse_transmission/diffuseTransmissionFactor":return e.extensions?.KHR_materials_diffuse_transmission?{type:"material",property:"diffuseTransmissionFactor"}:{reason:t1(t)};case"extensions/KHR_materials_diffuse_transmission/diffuseTransmissionColorFactor":return e.extensions?.KHR_materials_diffuse_transmission?{type:"material",property:"diffuseTransmissionColorFactor"}:{reason:t1(t)};case"extensions/KHR_materials_scatter/scatterStrengthFactor":return e.extensions?.KHR_materials_scatter?{type:"material",property:"scatterStrengthFactor"}:{reason:t1(t)};case"extensions/KHR_materials_scatter/multiscatterColorFactor":case"extensions/KHR_materials_scatter/multiscatterColor":return e.extensions?.KHR_materials_scatter?{type:"material",property:"multiscatterColorFactor"}:{reason:t1(t)};case"extensions/KHR_materials_scatter/scatterAnisotropy":return e.extensions?.KHR_materials_scatter?{type:"material",property:"scatterAnisotropy"}:{reason:t1(t)};case"extensions/KHR_materials_volume_scatter/multiscatterColorFactor":case"extensions/KHR_materials_volume_scatter/multiscatterColor":return e.extensions?.KHR_materials_volume_scatter?{type:"material",property:"multiscatterColorFactor"}:{reason:t1(t)};case"extensions/KHR_materials_volume_scatter/scatterAnisotropy":return e.extensions?.KHR_materials_volume_scatter?{type:"material",property:"scatterAnisotropy"}:{reason:t1(t)};case"extensions/KHR_materials_dispersion/dispersion":return e.extensions?.KHR_materials_dispersion?{type:"material",property:"dispersion"}:{reason:t1(t)};case"extensions/KHR_materials_transmission/transmissionFactor":return e.extensions?.KHR_materials_transmission?{type:"material",property:"transmissionFactor"}:{reason:t1(t)};case"extensions/KHR_materials_volume/thicknessFactor":return e.extensions?.KHR_materials_volume?{type:"material",property:"thicknessFactor"}:{reason:t1(t)};case"extensions/KHR_materials_volume/attenuationDistance":return e.extensions?.KHR_materials_volume?{type:"material",property:"attenuationDistance"}:{reason:t1(t)};case"extensions/KHR_materials_volume/attenuationColor":return e.extensions?.KHR_materials_volume?{type:"material",property:"attenuationColor"}:{reason:t1(t)};case"extensions/KHR_materials_clearcoat/clearcoatFactor":return e.extensions?.KHR_materials_clearcoat?{type:"material",property:"clearcoatFactor"}:{reason:t1(t)};case"extensions/KHR_materials_clearcoat/clearcoatRoughnessFactor":return e.extensions?.KHR_materials_clearcoat?{type:"material",property:"clearcoatRoughnessFactor"}:{reason:t1(t)};case"extensions/KHR_materials_sheen/sheenColorFactor":return e.extensions?.KHR_materials_sheen?{type:"material",property:"sheenColorFactor"}:{reason:t1(t)};case"extensions/KHR_materials_sheen/sheenRoughnessFactor":return e.extensions?.KHR_materials_sheen?{type:"material",property:"sheenRoughnessFactor"}:{reason:t1(t)};case"extensions/KHR_materials_iridescence/iridescenceFactor":return e.extensions?.KHR_materials_iridescence?{type:"material",property:"iridescenceFactor"}:{reason:t1(t)};case"extensions/KHR_materials_iridescence/iridescenceIor":return e.extensions?.KHR_materials_iridescence?{type:"material",property:"iridescenceIor"}:{reason:t1(t)};case"extensions/KHR_materials_iridescence/iridescenceThicknessMinimum":return e.extensions?.KHR_materials_iridescence?{type:"material",property:"iridescenceThicknessRange",component:0}:{reason:t1(t)};case"extensions/KHR_materials_iridescence/iridescenceThicknessMaximum":return e.extensions?.KHR_materials_iridescence?{type:"material",property:"iridescenceThicknessRange",component:1}:{reason:t1(t)};case"extensions/KHR_materials_anisotropy/anisotropyStrength":return e.extensions?.KHR_materials_anisotropy?{type:"material",property:"anisotropyStrength"}:{reason:t1(t)};case"extensions/KHR_materials_anisotropy/anisotropyRotation":return e.extensions?.KHR_materials_anisotropy?{type:"material",property:"anisotropyRotation"}:{reason:t1(t)};case"extensions/KHR_materials_emissive_strength/emissiveStrength":return e.extensions?.KHR_materials_emissive_strength?{type:"material",property:"emissiveStrength"}:{reason:t1(t)};default:return{reason:t1(t)}}}(v,m.slice(2));return"reason"in S?(t2(g,S.reason),null):{sampler:d,pointer:g,targetMaterialIndex:b,...S};case"cameras":let _,x,M,R;return a=e,s=n,o=i,l=r,_=Number(s[1]),x=a.cameras?.[_],M=s[2],R=s[3],4===s.length&&Number.isInteger(_)&&x&&("perspective"===M||"orthographic"===M)&&x.type===M&&("perspective"===M?["aspectRatio","yfov","znear","zfar"]:["xmag","ymag","znear","zfar"]).includes(R)?{type:"camera",sampler:o,pointer:l,targetCameraIndex:_,projection:M,property:R}:(t2(l,"camera pointers must target a supported projection property"),null);case"extensions":if("KHR_lights_punctual"===n[1]){let t,a,s,o,l,h;return c=e,f=n,u=i,p=r,t=Number(f[3]),a=c.lights||c.extensions?.KHR_lights_punctual?.lights,o=(s="spot"===f[4])?f[5]:f[4],l=s||"color"!==o?void 0:f[5],h=s||void 0!==l?6:5,"lights"===f[2]&&f.length===h&&Number.isInteger(t)&&Array.isArray(a)&&a[t]&&["color","intensity","range","innerConeAngle","outerConeAngle"].includes(o)&&(!s||"innerConeAngle"===o||"outerConeAngle"===o)&&(void 0===l||/^[0-2]$/.test(l)&&"color"===o)?{type:"light",sampler:u,pointer:p,targetLightIndex:t,property:o,...void 0===l?{}:{component:Number(l)}}:(t2(p,"punctual-light pointers must target supported typed light properties"),null)}}return t2(r,`top-level target "${n[0]}" has no runtime animation mapping`),null}(e,t,i);let r=t0(t.path);if(!r)return null;let n=e.nodes[t.node??0];if(!n)throw Error(`Cannot find animation target ${t.node}`);return{type:"node",sampler:i,targetNodeId:n.id,path:r}}(t,r,c);return f?[f]:[]});return o.length?[{name:r,channels:o}]:[]})),_=(t.lights||t.extensions?.KHR_lights_punctual?.lights||[]).map(e=>({...e,...Array.isArray(e.color)?{color:[...e.color]}:{},...e.spot?{spot:{...e.spot}}:{}})),x=(t.cameras||[]).map(e=>{let t={...e};return e.perspective&&(t.perspective={...e.perspective}),e.orthographic&&(t.orthographic={...e.orthographic}),t}),R=function(e,t,i){if(!i.length)return[];let r=function(e){let t=new Map;for(let i of e)for(let e of i.children||[])t.set(e.id,i);return t}(e),n=[];for(let s of e){var a;let o=(a=s).light??a.extensions?.KHR_lights_punctual?.light,l=void 0===o?void 0:i[o];if(!l)continue;let c=[],f=s;for(;f&&c.length<e.length;){let e=t.get(f.id);if(!e)break;c.push(e),f=r.get(f.id)}f||n.push({path:c.reverse(),definition:l})}return n}(t.nodes,u,_),T=new tP(R,i?.useByteColors??!0),C=T.lights,I=()=>T.update(),y=new t$({onVisibilityChange:I,onLightChange:I,properties:i?.properties??void 0,cameras:x,lightDefinitions:_,animations:S,gltfNodeIdToNodeMap:u,materials:c,materialInstances:m}),A=new tX(function(e,t){let i=(e.extensions?.KHR_materials_variants?.variants||[]).map((e,t)=>({name:e.name||`Variant-${t}`,index:t})),r=new Set,n=[];for(let e of t)e.preorderTraversal(e=>{if(!(e instanceof Z)||r.has(e))return;let t=e.userData.gltfMaterialVariants;t&&(r.add(e),n.push({modelNode:e,...t}))});return{variants:i,bindings:n}}(t,l)),E=tZ(t,e),N=l.map(e=>t9(e.getBounds())),L=function(e){let t=null;for(let i of e)if(i.bounds){if(!t){t=[[...i.bounds[0]],[...i.bounds[1]]];continue}for(let e=0;e<3;e++)t[0][e]=Math.min(t[0][e],i.bounds[0][e]),t[1][e]=Math.max(t[1][e],i.bounds[1][e])}return t9(t)}(N),P=new tq({scenes:(r={device:e,gltf:t,scenes:l,gltfNodeIndexToNodeMap:p}).scenes,bindings:function(e){let{gltf:t,gltfNodeIndexToNodeMap:i}=e,r=[],n=t.skins||[],a=new Set;for(let t of e.scenes)t.preorderTraversal(e=>{e instanceof Y&&a.add(e)});for(let[s,o]of t.nodes.entries()){let l,c=o.skin;if(void 0===c||!o.mesh)continue;let f=n[function(e,t){return"number"==typeof t?t:(e.skins||[]).findIndex(i=>{if(i===t||t.id&&i.id===t.id)return!0;if(i.joints.length!==t.joints?.length||!i.joints.every((e,i)=>e===t.joints?.[i]))return!1;if("number"==typeof t.inverseBindMatrices){let r=e.accessors[t.inverseBindMatrices];return!i.inverseBindMatrices||i.inverseBindMatrices===r}return!0})}(t,c)],u=i.get(s);if(!f||!u||!a.has(u))continue;let p=f.joints.flatMap(e=>{let t=i.get(e);return t?[t]:[]});if(p.length!==f.joints.length)continue;let h=o.mesh,m=u.userData.gltfMesh,d=m instanceof Y?m:u.children.find(e=>e instanceof Y&&e.id===(h.name||h.id));if(!(d instanceof Y))continue;let g=[];d.preorderTraversal(e=>{e instanceof Z&&g.push(e)});let b=f.inverseBindMatrices?.value,v=new Float32Array(16*p.length);p.length>64&&g.some(e=>!0===e.userData.gltfLargeSkinPalette)&&(l=function(e,t,i){if("webgpu"===e.type)return e.createBuffer({id:`${t}-skin-joint-matrices`,byteLength:i.byteLength,usage:eN.h.STORAGE|eN.h.COPY_DST});let r=i.length/4;if(r>e.limits.maxTextureDimension2D)throw Error("Skin palette exceeds the device texture width limit");return e.createTexture({id:`${t}-skin-joint-matrices`,format:"rgba32float",width:r,height:1,usage:eL.g.SAMPLE|eL.g.COPY_DST,sampler:{minFilter:"nearest",magFilter:"nearest",mipmapFilter:"nearest"}})}(e.device,u.id,v)),r.push({node:u,joints:p,...b instanceof Float32Array?{inverseBindMatrices:b}:{},jointMatrices:v,...l?{skinJointMatrices:l}:{},models:g})}return r}(r)});y.setUpdateHandler(()=>{P.update(),R.length&&I()});let O=!1;return{metadata:o,scenes:l,materials:c,billboards:d,variants:A,joints:v,jointIssues:b.issues,cameras:x,animator:y,animations:S,lights:C,punctualLights:T,extensionSupport:E,sceneBounds:N,modelBounds:L,gltfMeshIdToNodeMap:f,gltfNodeIdToNodeMap:u,gltfNodeIndexToNodeMap:p,skins:P,gltf:t,destroy:()=>{if(O)return;O=!0,P.destroy(),d?.destroy();let e=new Set([...l,...f.values(),...u.values()]),t=new Set,i=new Set(c);for(let r of e)r.preorderTraversal(e=>{if(e instanceof Z){t.add(e);let r=e.userData.gltfMaterialVariants;for(let e of(r?.defaultMaterial&&i.add(r.defaultMaterial),r?.mappings.values()||[]))i.add(e.material);e.model?.material&&i.add(e.model.material)}});for(let e of t)e.destroy();for(let t of e)t.destroy();for(let e of i)e.destroy();for(let e of h)e.destroy();h.clear()}}}(t,r.json?new es().postProcess(r):r,this._getModelOptions());i=n,t7(n).then(()=>this.setNeedsRedraw()).catch(e=>{this.raiseError(e,"loading glTF")})}let r={layer:this,device:this.context.device},n=e.getScene(i,r),a=e.getAnimator(i,r);if(n instanceof Y){this._destroyScenegraphAssets(),this._applyAnimationsProp(a,e._animations);let t=[];n.traverse(e=>{e instanceof Z&&t.push(e.model)}),this.setState({scenegraph:n,animator:a,materials:i?.materials||null,models:t,firstDrawSignaled:!1}),this.getAttributeManager()?.invalidateAll()}else null!==n&&x.A.warn("invalid scenegraph:",n)()}_destroyScenegraphAssets(){this.state.scenegraph?.destroy(),this.state.materials?.forEach(e=>e.destroy()),this.state.scenegraph=null,this.state.animator=null,this.state.materials=null,this.state.models=[]}_applyAnimationsProp(e,t){if(!e||!t)return;let i=e.getAnimations();Object.keys(t).sort().forEach(e=>{let r=t[e];if("*"===e)i.forEach(e=>{Object.assign(e,r)});else if(Number.isFinite(Number(e))){let t=Number(e);t>=0&&t<i.length?Object.assign(i[t],r):x.A.warn(`animation ${e} not found`)()}else{let t=i.find(({animation:t})=>t.name===e);t?Object.assign(t,r):x.A.warn(`animation ${e} not found`)()}})}_getModelOptions(){let e,{_imageBasedLightingEnvironment:t}=this.props;t&&(e="function"==typeof t?t({device:this.context.device,gl:this.context.gl,layer:this}):t);let i="webgpu"===this.context.device.type?{depthWriteEnabled:!0,depthCompare:"less-equal"}:void 0;return{imageBasedLightingEnvironment:e,modelOptions:{id:this.props.id,isInstanced:!0,bufferLayout:this.state.columns?.getBufferLayouts()??this.getAttributeManager().getBufferLayouts(),parameters:i,...this.getShaders()},useTangents:!1}}draw({context:e}){if(!this.state.scenegraph||this.state.columns?.loading&&!this.state.columns.length)return;this.props._animations&&this.state.animator&&(this.state.animator.setTime(e.timeline.getTime()),this.setNeedsRedraw());let{viewport:t,renderPass:i}=this.context,{sizeScale:r,sizeMinPixels:n,sizeMaxPixels:a,coordinateSystem:s}=this.props,o={camera:t.cameraPosition},l=this.getNumInstances();this.state.scenegraph.traverse((e,{worldMatrix:c})=>{if(e instanceof Z){let{model:f}=e;f.setInstanceCount(l);let u={rowIndexOffset:0,sizeScale:r,sizeMinPixels:n,sizeMaxPixels:a,composeModelMatrix:+!!(0,ii.wi)(t,this.state.sourceCrs?.signature||s,!!this.state.preproject),sceneModelMatrix:c};f.shaderInputs.setProps({pbrProjection:o,scenegraph:u}),this.state.columns?this.state.columns.draw(f,i,(e,t)=>{f.setInstanceCount(Math.min(t,Math.max(0,l-e))),f.shaderInputs.setProps({scenegraph:{rowIndexOffset:e}})}):f.draw(i)}}),this.state.firstDrawSignaled||(this.state.firstDrawSignaled=!0,this.props.onFirstDraw?.())}}im.defaultProps=ih,im.layerName="ScenegraphLayer";let id=im},21671(e,t,i){i.d(t,{L6:()=>c,UB:()=>f,wi:()=>u});var r=i(53439);let n=Math.PI/180,a=new Float32Array(16),s=new Float32Array(12);function o(e,t,i){let r=t[0]*n,a=t[1]*n,s=t[2]*n,o=Math.sin(s),l=Math.sin(r),c=Math.sin(a),f=Math.cos(s),u=Math.cos(r),p=Math.cos(a),h=i[0],m=i[1],d=i[2];e[0]=h*p*u,e[1]=h*c*u,e[2]=-(h*l),e[3]=m*(-c*f+p*l*o),e[4]=m*(p*f+c*l*o),e[5]=m*u*o,e[6]=d*(c*o+p*l*f),e[7]=d*(-p*o+c*l*f),e[8]=d*u*f}function l(e){return e[0]=e[0],e[1]=e[1],e[2]=e[2],e[3]=e[4],e[4]=e[5],e[5]=e[6],e[6]=e[8],e[7]=e[9],e[8]=e[10],e[9]=e[12],e[10]=e[13],e[11]=e[14],e.subarray(0,12)}function c(e,t,i,r){if(e?.length===16)return l(new Float32Array(e));let n=new Float32Array(12);return o(n,t,i),n.set(r,9),n}let f={size:12,accessor:["getOrientation","getScale","getTranslation","getTransformMatrix"],shaderAttributes:{instanceModelMatrixCol0:{size:3,elementOffset:0},instanceModelMatrixCol1:{size:3,elementOffset:3},instanceModelMatrixCol2:{size:3,elementOffset:6},instanceTranslation:{size:3,elementOffset:9}},update(e,{startRow:t,endRow:i}){let{data:n,getOrientation:c,getScale:f,getTranslation:u,getTransformMatrix:p}=this.props,h=Array.isArray(p),m=h&&16===p.length,d=Array.isArray(f),g=Array.isArray(c),b=Array.isArray(u),v=m||!h&&!!p(n[0]);v?e.constant=m:e.constant=g&&d&&b;let S=e.value;if(e.constant){let t;v?(a.set(p),t=l(a)):(o(t=s,c,f),t.set(u,9)),e.value=new Float32Array(t)}else{let h=t*e.size,{iterable:_,objectInfo:x}=(0,r.X)(n,t,i);for(let e of _){let t;(x.index++,v)?(a.set(m?p:p(e,x)),t=l(a)):(o(t=s,g?c:c(e,x),d?f:f(e,x)),t.set(b?u:u(e,x),9)),S[h++]=t[0],S[h++]=t[1],S[h++]=t[2],S[h++]=t[3],S[h++]=t[4],S[h++]=t[5],S[h++]=t[6],S[h++]=t[7],S[h++]=t[8],S[h++]=t[9],S[h++]=t[10],S[h++]=t[11]}}}};function u(e,t,i=!1){return i?"cartesian"===t:t===e.crs?.signature||"cartesian"===t||"meter-offsets"===t||"default"===t&&!e.isGeospatial}},29581(e,t,i){i.d(t,{EN:()=>s,_3:()=>c,cc:()=>l});var r=i(53439),n=i(8994),a=i(21671);let s=["getTransformMatrix","getOrientation","getScale","getTranslation"],o=Object.keys(a.UB.shaderAttributes),l={positions:{attribute:"instancePositions",accessor:"getPosition",semantic:"position",size:3},colors:{attribute:"instanceColors",accessor:"getColor",semantic:"color",size:4}};for(let e of o)l[e]={attribute:e,accessor:e,semantic:"vector",size:3,prop:!1};function c(e,t,i,l,c){let f=t.data?.attributes?.instanceModelMatrix,u=f instanceof n.h?{buffer:f}:ArrayBuffer.isView(f)?{value:f}:f;if(!u){let e=s.map(e=>t[e]),n="function"!=typeof e[0]&&e[0]?.length===16||e.every(e=>Array.isArray(e)),o=n?1:l,c=new Float32Array(12*o),{objectInfo:f}=(0,r.X)(t.data);for(let t=0;t<o;t++){f.index=t;let r=i.at(t),n="function"==typeof e[0]?e[0](r,f):e[0],[s,o,l]=n?.length===16?[[],[],[]]:e.slice(1).map(e=>"function"==typeof e?e(r,f):e);c.set((0,a.L6)(n,s,o,l),12*t)}u={value:c,constant:n}}if(!u.constant&&!u.buffer&&l){let t=e.createBuffer({data:u.value,usage:n.h.VERTEX|n.h.COPY_DST});c(t),u={...u,buffer:t}}return Object.fromEntries(o.map((e,t)=>[e,{...u,size:3,stride:u.stride??48,offset:(u.offset??0)+12*t}]))}},56423(e,t,i){i.d(t,{V:()=>n,d:()=>a});var r=i(30415);function n(e){let t=new r.d().set(1,0,0,0,1,0,e.offset[0],e.offset[1],1),i=new r.d().set(Math.cos(e.rotation),Math.sin(e.rotation),0,-Math.sin(e.rotation),Math.cos(e.rotation),0,0,0,1),n=new r.d().set(e.scale[0],0,0,0,e.scale[1],0,0,0,1);return Array.from(t.multiplyRight(i).multiplyRight(n))}function a(e,t){let i=new r.d(n(e)),a=new r.d(n(t)),s=new r.d(i).invert();return Array.from(a.multiplyRight(s))}},33577(e,t,i){i.d(t,{lO:()=>h});var r=i(30415),n=i(58006),a=i(64344),s=i(55861),o=i(42528),l=i(11829),c=i(56423),f=i(19710);function u(e){switch(e){case f.n.CLAMP_TO_EDGE:return"clamp-to-edge";case f.n.REPEAT:return"repeat";case f.n.MIRRORED_REPEAT:return"mirror-repeat";default:return}}let p={NORMAL:["NORMAL","normals"],TANGENT:["TANGENT"],TEXCOORD_0:["TEXCOORD_0","texCoords"],TEXCOORD_1:["TEXCOORD_1","texCoords1"],JOINTS_0:["JOINTS_0"],WEIGHTS_0:["WEIGHTS_0"],JOINTS_1:["JOINTS_1"],WEIGHTS_1:["WEIGHTS_1"],COLOR_0:["COLOR_0","colors"]};function h(e,t,i,s){let o={defines:{MANUAL_SRGB:!0},bindings:{},uniforms:{camera:[0,0,0],metallicRoughnessValues:[1,1]},parameters:{},glParameters:{},generatedTextures:[]};o.defines.USE_TEX_LOD=!0;let{imageBasedLightingEnvironment:u}=s;if(u&&(o.bindings.pbr_diffuseEnvSampler=u.diffuseEnvSampler.texture,o.bindings.pbr_specularEnvSampler=u.specularEnvSampler.texture,o.bindings.pbr_brdfLUT=u.brdfLutTexture.texture,o.uniforms.IBLenabled=!0,o.uniforms.scaleIBLAmbient=[1,1]),s?.pbrDebug&&(o.defines.PBR_DEBUG=!0,o.uniforms.scaleDiffBaseMR=[0,0,0,0],o.uniforms.scaleFGDSpec=[0,0,0,0]),d(i,"NORMAL")&&(o.defines.HAS_NORMALS=!0),d(i,"TANGENT")&&s?.useTangents&&(o.defines.HAS_TANGENTS=!0),d(i,"TEXCOORD_0")&&(o.defines.HAS_UV=!0),d(i,"TEXCOORD_1")&&(o.defines.HAS_UV_1=!0),d(i,"JOINTS_0")&&d(i,"WEIGHTS_0")&&(o.defines.HAS_SKIN=!0),o.defines.HAS_SKIN&&d(i,"JOINTS_1")&&d(i,"WEIGHTS_1")&&(o.defines.HAS_SKIN_1=!0),d(i,"COLOR_0")&&(o.defines.HAS_COLORS=!0),s?.imageBasedLightingEnvironment&&(o.defines.USE_IBL=!0),s?.lights&&(o.defines.USE_LIGHTS=!0),t){if(!1!==s.validateAttributes){!function(e,t){let i=m(e,0);i.length>0&&!d(t,"TEXCOORD_0")&&a.R.warn(`glTF material uses ${i.join(", ")} but primitive is missing TEXCOORD_0; textured shading will sample the default UV coordinates`)();let r=m(e,1);if(r.length>0&&!d(t,"TEXCOORD_1")&&a.R.warn(`glTF material uses ${r.join(", ")} with TEXCOORD_1 but primitive is missing TEXCOORD_1; those textures will be skipped`)(),e.unlit||e.extensions?.KHR_materials_unlit||d(t,"NORMAL"))return;let n=e.normalTexture?"lit PBR shading with normalTexture":"lit PBR shading";a.R.warn(`glTF primitive is missing NORMAL while using ${n}; shading will fall back to geometric normals`)()}(t,i);let e=t.extensions?.KHR_lightmap;if(e&&!1!==s.validateLightmapAttributes){let t=(0,l.CC)(e.lightmapTexture);(0,n.v)((0===t||1===t)&&d(i,0===t?"TEXCOORD_0":"TEXCOORD_1"))}}!function(e,t,i,s,o,u=!1){if(i.parameters.cullMode=t.doubleSided?"none":"back",i.defines.DOUBLE_SIDED=!!t.doubleSided,i.uniforms.unlit=!!(t.unlit||t.extensions?.KHR_materials_unlit),t.pbrMetallicRoughness&&function(e,t,i,r,n){t.baseColorTexture&&v(e,t.baseColorTexture,"pbr_baseColorSampler",i,{featureOptions:{define:"HAS_BASECOLORMAP",enabledUniformName:"baseColorMapEnabled"},gltf:n,attributes:r,textureTransformSlot:"baseColor"}),i.uniforms.baseColorFactor=t.baseColorFactor||[1,1,1,1],t.metallicRoughnessTexture&&v(e,t.metallicRoughnessTexture,"pbr_metallicRoughnessSampler",i,{featureOptions:{define:"HAS_METALROUGHNESSMAP",enabledUniformName:"metallicRoughnessMapEnabled"},gltf:n,attributes:r,textureTransformSlot:"metallicRoughness"});let{metallicFactor:a=1,roughnessFactor:s=1}=t;i.uniforms.metallicRoughnessValues=[a,s]}(e,t.pbrMetallicRoughness,i,s,o),t.normalTexture){v(e,t.normalTexture,"pbr_normalSampler",i,{featureOptions:{define:"HAS_NORMALMAP",enabledUniformName:"normalMapEnabled"},gltf:o,attributes:s,textureTransformSlot:"normal"});let{scale:r=1}=t.normalTexture;i.uniforms.normalScale=r}if(t.occlusionTexture){v(e,t.occlusionTexture,"pbr_occlusionSampler",i,{featureOptions:{define:"HAS_OCCLUSIONMAP",enabledUniformName:"occlusionMapEnabled"},gltf:o,attributes:s,textureTransformSlot:"occlusion"});let{strength:r=1}=t.occlusionTexture;i.uniforms.occlusionStrength=r}switch(i.uniforms.emissiveFactor=t.emissiveFactor||[0,0,0],t.emissiveTexture&&v(e,t.emissiveTexture,"pbr_emissiveSampler",i,{featureOptions:{define:"HAS_EMISSIVEMAP",enabledUniformName:"emissiveMapEnabled"},gltf:o,attributes:s,textureTransformSlot:"emissive"}),function(e,t,i,s,o={},u=!1){var p,h,m,d,S,_,x;if(!t)return;let M=t.KHR_lightmap;if(M){let t=M.intensity??1;(0,n.v)(Number.isFinite(t)&&t>=0),i.uniforms.lightmapIntensity=t,i.uniforms.lightmapUVSet=(0,l.CC)(M.lightmapTexture),i.uniforms.lightmapUVTransform=new r.d((0,c.V)((0,l.e3)(M.lightmapTexture))),!u&&Object.keys(o).length>0&&v(e,M.lightmapTexture,"pbr_lightmapSampler",i,{gltf:s,attributes:o,featureOptions:{define:"HAS_LIGHTMAP",enabledUniformName:"lightmapMapEnabled"}})}((p=t).KHR_materials_specular||p.KHR_materials_ior||p.EXT_materials_bump||p.KHR_materials_transmission||p.KHR_materials_diffuse_transmission||p.KHR_materials_volume||p.KHR_materials_volume_scatter||p.KHR_materials_dispersion||p.KHR_materials_clearcoat||p.KHR_materials_sheen||p.KHR_materials_iridescence||p.KHR_materials_anisotropy)&&(i.defines.USE_MATERIAL_EXTENSIONS=!0),function(e,t,i,r,n={}){t&&(t.specularColorFactor&&(i.uniforms.specularColorFactor=t.specularColorFactor),void 0!==t.specularFactor&&(i.uniforms.specularIntensityFactor=t.specularFactor),t.specularColorTexture&&v(e,t.specularColorTexture,"pbr_specularColorSampler",i,{featureOptions:{define:"HAS_SPECULARCOLORMAP",enabledUniformName:"specularColorMapEnabled"},gltf:r,attributes:n,textureTransformSlot:"specularColor"}),t.specularTexture&&v(e,t.specularTexture,"pbr_specularIntensitySampler",i,{featureOptions:{define:"HAS_SPECULARINTENSITYMAP",enabledUniformName:"specularIntensityMapEnabled"},gltf:r,attributes:n,textureTransformSlot:"specularIntensity"}))}(e,t.KHR_materials_specular,i,s,o),h=t.KHR_materials_ior,m=i,h?.ior!==void 0&&(m.uniforms.ior=h.ior),function(e,t,i,r,n={}){t&&(i.uniforms.bumpFactor=Math.max(t.bumpFactor??1,0),t.bumpTexture&&v(e,t.bumpTexture,"pbr_bumpSampler",i,{featureOptions:{define:"HAS_BUMPMAP",enabledUniformName:"bumpMapEnabled"},gltf:r,attributes:n,textureTransformSlot:"bump"}))}(e,t.EXT_materials_bump,i,s,o),function(e,t,i,r,n={}){t&&(void 0!==t.transmissionFactor&&(i.uniforms.transmissionFactor=t.transmissionFactor),t.transmissionTexture&&v(e,t.transmissionTexture,"pbr_transmissionSampler",i,{featureOptions:{define:"HAS_TRANSMISSIONMAP",enabledUniformName:"transmissionMapEnabled"},gltf:r,attributes:n,textureTransformSlot:"transmission"}),(t.transmissionFactor??0)>0||t.transmissionTexture)&&(a.R.warn("KHR_materials_transmission uses a premultiplied-alpha blending approximation and may require mesh sorting")(),i.parameters.blend=!0,i.parameters.depthWriteEnabled=!1,i.parameters.blendColorOperation="add",i.parameters.blendColorSrcFactor="one",i.parameters.blendColorDstFactor="one-minus-src-alpha",i.parameters.blendAlphaOperation="add",i.parameters.blendAlphaSrcFactor="one",i.parameters.blendAlphaDstFactor="one-minus-src-alpha",i.glParameters.blend=!0,i.glParameters.depthMask=!1,i.glParameters.blendEquation=f.n.FUNC_ADD,i.glParameters.blendFunc=[f.n.ONE,f.n.ONE_MINUS_SRC_ALPHA,f.n.ONE,f.n.ONE_MINUS_SRC_ALPHA])}(e,t.KHR_materials_transmission,i,s,o),g(e,t.KHR_materials_diffuse_transmission,i,s,o),function(e,t,i,r,n={}){t&&(void 0!==t.thicknessFactor&&(i.uniforms.thicknessFactor=t.thicknessFactor),t.thicknessTexture&&v(e,t.thicknessTexture,"pbr_thicknessSampler",i,{featureOptions:{define:"HAS_THICKNESSMAP"},gltf:r,attributes:n,textureTransformSlot:"thickness"}),void 0!==t.attenuationDistance&&(i.uniforms.attenuationDistance=t.attenuationDistance),t.attenuationColor&&(i.uniforms.attenuationColor=t.attenuationColor))}(e,t.KHR_materials_volume,i,s,o),b(e,t.KHR_materials_volume_scatter,t.KHR_materials_volume,i,s,o);let R=t.KHR_materials_scatter;if(R&&t.KHR_materials_transmission){(0,n.v)(!t.KHR_materials_volume?.thicknessFactor),R.scatterStrengthTexture&&g(e,{diffuseTransmissionTexture:R.scatterStrengthTexture},i,s,o),(0,n.v)(!t.KHR_materials_unlit&&!t.KHR_materials_diffuse_transmission&&!t.KHR_materials_pbrSpecularGlossiness);let r=R.scatterStrengthFactor??0,a=R.scatterAnisotropy??0;(0,n.v)(Number.isFinite(r)&&r>=0&&r<=1),(0,n.v)(Number.isFinite(a)&&a>-1&&a<1),i.defines.HAS_MATERIAL_SCATTER=!0,i.uniforms.scatterStrengthFactor=r,b(e,R,{},i,s,o),i.uniforms.scatterAnisotropy=a,i.uniforms.multiscatterColorFactor=R.multiscatterColorFactor??R.multiscatterColor??[1,1,1]}d=t.KHR_materials_dispersion,S=i,d?.dispersion!==void 0&&(S.uniforms.dispersion=Math.max(d.dispersion,0)),function(e,t,i,r,n={}){t&&(void 0!==t.clearcoatFactor&&(i.uniforms.clearcoatFactor=t.clearcoatFactor),void 0!==t.clearcoatRoughnessFactor&&(i.uniforms.clearcoatRoughnessFactor=t.clearcoatRoughnessFactor),t.clearcoatTexture&&v(e,t.clearcoatTexture,"pbr_clearcoatSampler",i,{featureOptions:{define:"HAS_CLEARCOATMAP",enabledUniformName:"clearcoatMapEnabled"},gltf:r,attributes:n,textureTransformSlot:"clearcoat"}),t.clearcoatRoughnessTexture&&v(e,t.clearcoatRoughnessTexture,"pbr_clearcoatRoughnessSampler",i,{featureOptions:{define:"HAS_CLEARCOATROUGHNESSMAP",enabledUniformName:"clearcoatRoughnessMapEnabled"},gltf:r,attributes:n,textureTransformSlot:"clearcoatRoughness"}),t.clearcoatNormalTexture&&v(e,t.clearcoatNormalTexture,"pbr_clearcoatNormalSampler",i,{featureOptions:{define:"HAS_CLEARCOATNORMALMAP"},gltf:r,attributes:n,textureTransformSlot:"clearcoatNormal"}))}(e,t.KHR_materials_clearcoat,i,s,o),function(e,t,i,r,n={}){t&&(t.sheenColorFactor&&(i.uniforms.sheenColorFactor=t.sheenColorFactor),void 0!==t.sheenRoughnessFactor&&(i.uniforms.sheenRoughnessFactor=t.sheenRoughnessFactor),t.sheenColorTexture&&v(e,t.sheenColorTexture,"pbr_sheenColorSampler",i,{featureOptions:{define:"HAS_SHEENCOLORMAP",enabledUniformName:"sheenColorMapEnabled"},gltf:r,attributes:n,textureTransformSlot:"sheenColor"}),t.sheenRoughnessTexture&&v(e,t.sheenRoughnessTexture,"pbr_sheenRoughnessSampler",i,{featureOptions:{define:"HAS_SHEENROUGHNESSMAP",enabledUniformName:"sheenRoughnessMapEnabled"},gltf:r,attributes:n,textureTransformSlot:"sheenRoughness"}))}(e,t.KHR_materials_sheen,i,s,o),function(e,t,i,r,n={}){t&&(void 0!==t.iridescenceFactor&&(i.uniforms.iridescenceFactor=t.iridescenceFactor),void 0!==t.iridescenceIor&&(i.uniforms.iridescenceIor=t.iridescenceIor),(void 0!==t.iridescenceThicknessMinimum||void 0!==t.iridescenceThicknessMaximum)&&(i.uniforms.iridescenceThicknessRange=[t.iridescenceThicknessMinimum??100,t.iridescenceThicknessMaximum??400]),t.iridescenceTexture&&v(e,t.iridescenceTexture,"pbr_iridescenceSampler",i,{featureOptions:{define:"HAS_IRIDESCENCEMAP",enabledUniformName:"iridescenceMapEnabled"},gltf:r,attributes:n,textureTransformSlot:"iridescence"}),t.iridescenceThicknessTexture&&v(e,t.iridescenceThicknessTexture,"pbr_iridescenceThicknessSampler",i,{featureOptions:{define:"HAS_IRIDESCENCETHICKNESSMAP"},gltf:r,attributes:n,textureTransformSlot:"iridescenceThickness"}))}(e,t.KHR_materials_iridescence,i,s,o),function(e,t,i,r,n={}){t&&(void 0!==t.anisotropyStrength&&(i.uniforms.anisotropyStrength=t.anisotropyStrength),void 0!==t.anisotropyRotation&&(i.uniforms.anisotropyRotation=t.anisotropyRotation),t.anisotropyTexture&&v(e,t.anisotropyTexture,"pbr_anisotropySampler",i,{featureOptions:{define:"HAS_ANISOTROPYMAP",enabledUniformName:"anisotropyMapEnabled"},gltf:r,attributes:n,textureTransformSlot:"anisotropy"}))}(e,t.KHR_materials_anisotropy,i,s,o),_=t.KHR_materials_emissive_strength,x=i,_?.emissiveStrength!==void 0&&(x.uniforms.emissiveStrength=_.emissiveStrength)}(e,t.extensions,i,o,s,u),t.alphaMode||"OPAQUE"){case"OPAQUE":break;case"MASK":{let{alphaCutoff:e=.5}=t;i.defines.ALPHA_CUTOFF=!0,i.uniforms.alphaCutoffEnabled=!0,i.uniforms.alphaCutoff=e;break}case"BLEND":var p;a.R.warn("glTF BLEND alphaMode might not work well because it requires mesh sorting")(),(p=i).parameters.blend=!0,p.parameters.blendColorOperation="add",p.parameters.blendColorSrcFactor="src-alpha",p.parameters.blendColorDstFactor="one-minus-src-alpha",p.parameters.blendAlphaOperation="add",p.parameters.blendAlphaSrcFactor="one",p.parameters.blendAlphaDstFactor="one-minus-src-alpha",p.glParameters.blend=!0,p.glParameters.blendEquation=f.n.FUNC_ADD,p.glParameters.blendFunc=[f.n.SRC_ALPHA,f.n.ONE_MINUS_SRC_ALPHA,f.n.ONE,f.n.ONE_MINUS_SRC_ALPHA]}}(e,t,o,i,s.gltf,s.materialResourcesOnly)}return o}function m(e,t){let i=[];for(let r of(0,l.ii)()){let n=function(e,t){let i=e;for(let e of t)if(!(i=i?.[e]))return null;return i}(e,r.pathSegments);n&&(0,l.CC)(n)===t&&i.push(r.displayName)}return i}function d(e,t){return p[t].some(t=>!!e[t])}function g(e,t,i,r,n={}){t&&(i.uniforms.diffuseTransmissionFactor=Math.min(Math.max(t.diffuseTransmissionFactor??0,0),1),i.uniforms.diffuseTransmissionColorFactor=t.diffuseTransmissionColorFactor||[1,1,1],t.diffuseTransmissionTexture&&v(e,t.diffuseTransmissionTexture,"pbr_diffuseTransmissionSampler",i,{featureOptions:{define:"HAS_DIFFUSETRANSMISSIONMAP",enabledUniformName:"diffuseTransmissionMapEnabled"},gltf:r,attributes:n,textureTransformSlot:"diffuseTransmission"}),t.diffuseTransmissionColorTexture&&v(e,t.diffuseTransmissionColorTexture,"pbr_diffuseTransmissionColorSampler",i,{featureOptions:{define:"HAS_DIFFUSETRANSMISSIONCOLORMAP",enabledUniformName:"diffuseTransmissionColorMapEnabled"},gltf:r,attributes:n,textureTransformSlot:"diffuseTransmissionColor"}))}function b(e,t,i,r,n,a={}){t&&i&&(r.uniforms.multiscatterColorFactor=t.multiscatterColorFactor||t.multiscatterColor||[0,0,0],r.uniforms.scatterAnisotropy=Math.min(Math.max(t.scatterAnisotropy??0,-.999),.999),t.multiscatterColorTexture&&v(e,t.multiscatterColorTexture,"pbr_multiscatterColorSampler",r,{featureOptions:{define:"HAS_MULTISCATTERCOLORMAP",enabledUniformName:"multiscatterColorMapEnabled"},gltf:n,attributes:a,textureTransformSlot:"multiscatterColor"}))}function v(e,t,i,r,n={}){let{featureOptions:p={},gltf:h,attributes:m={},textureTransformSlot:g}=n,{define:b,enabledUniformName:x}=p,M=(0,l.CC)(t);if(M>1)return void a.R.warn(`Skipping ${String(i)} because ${M} is not supported; only TEXCOORD_0 and TEXCOORD_1 are currently available`)();if(1===M&&!d(m,"TEXCOORD_1"))return void a.R.warn(`Skipping ${String(i)} because it requires TEXCOORD_1 but the primitive does not provide TEXCOORD_1`)();let R=function(e,t){if(e.texture||void 0===e.index||!t?.textures)return e;let i=t.textures[e.index];return i?"texture"in i&&i.texture?{...i,...e,texture:i.texture}:"source"in i?{...e,texture:i}:e:e}(t,h),T=R.texture?.source?.image;if(!T)return void a.R.warn(`Skipping unresolved glTF texture for ${String(i)}`)();let C=function(e,t,i){if("compressed"in t)return function(e,t,i){let r;if(0===(r=Array.isArray(t.data)&&t.data[0]?.data?t.data:"mipmaps"in t&&Array.isArray(t.mipmaps)?t.mipmaps:[]).length||!r[0]?.data)return a.R.warn("createCompressedTexture: compressed image has no valid mip levels, creating fallback")(),S(e,i);let n=r[0],l=n.width??t.width??0,c=n.height??t.height??0;if(l<=0||c<=0)return a.R.warn("createCompressedTexture: base level has invalid dimensions, creating fallback")(),S(e,i);let f=_(n);if(!f)return a.R.warn("createCompressedTexture: compressed image has no textureFormat, creating fallback")(),S(e,i);if(!e.isTextureFormatSupported(f))return a.R.warn(`createCompressedTexture: ${e.type} device does not support '${f}', creating fallback`)(),S(e,i);let u=function(e,t,i){let{blockWidth:r=1,blockHeight:n=1}=o.vz.getInfo(i),a=1;for(let i=1;;i++){let s=Math.max(1,e>>i),o=Math.max(1,t>>i);if(s<r||o<n)break;a++}return a}(l,c,f),p=Math.min(r.length,u),h=1;for(let e=1;e<p;e++){let t=r[e];if(!t.data||t.width<=0||t.height<=0){a.R.warn(`createCompressedTexture: mip level ${e} has invalid data/dimensions, truncating`)();break}let i=_(t);if(i&&i!==f){a.R.warn(`createCompressedTexture: mip level ${e} format '${i}' differs from base '${f}', truncating`)();break}let n=Math.max(1,l>>e),s=Math.max(1,c>>e);if(t.width!==n||t.height!==s){a.R.warn(`createCompressedTexture: mip level ${e} dimensions ${t.width}x${t.height} don't match expected ${n}x${s}, truncating`)();break}h++}let m=e.createTexture({...i,format:f,usage:s.g.TEXTURE|s.g.COPY_DST,width:l,height:c,mipLevels:h,data:n.data});for(let e=1;e<h;e++)m.writeData(r[e].data,{width:r[e].width,height:r[e].height,mipLevel:e});return m}(e,t,{id:i.id,sampler:i.sampler});let r=void 0!==i.width&&void 0!==i.height?{width:i.width,height:i.height}:e.getExternalImageSize(t),n="nearest"===i.sampler.mipmapFilter||"linear"===i.sampler.mipmapFilter,l=n?e.getMipLevelCount(r.width,r.height):1,c=e.createTexture({id:i.id,sampler:i.sampler,width:r.width,height:r.height,mipLevels:l,...n?{usage:s.g.SAMPLE|s.g.RENDER|s.g.COPY_DST|s.g.COPY_SRC}:{},...i.colorSpace?{format:"srgb"===i.colorSpace?"rgba8unorm-srgb":"rgba8unorm"}:{},data:t});return l>1&&("webgl"===e.type?c.generateMipmapsWebGL():"webgpu"===e.type&&e.generateMipmapsWebGPU(c)),c}(e,T,{id:R.uniformName||R.id,sampler:{addressModeU:"repeat",addressModeV:"repeat",minFilter:"linear",magFilter:"linear",...function(e={}){let t=e.wrapS??e.parameters?.[f.n.TEXTURE_WRAP_S],i=e.wrapT??e.parameters?.[f.n.TEXTURE_WRAP_T],r=e.magFilter??e.parameters?.[f.n.TEXTURE_MAG_FILTER],n=e.minFilter??e.parameters?.[f.n.TEXTURE_MIN_FILTER],a=u(t),s=u(i),o=function(e){switch(e){case f.n.NEAREST:return"nearest";case f.n.LINEAR:return"linear";default:return}}(r);return{...a?{addressModeU:a}:{},...s?{addressModeV:s}:{},...o?{magFilter:o}:{},...function(e){switch(e){case f.n.NEAREST:return{minFilter:"nearest"};case f.n.LINEAR:return{minFilter:"linear"};case f.n.NEAREST_MIPMAP_NEAREST:return{minFilter:"nearest",mipmapFilter:"nearest"};case f.n.LINEAR_MIPMAP_NEAREST:return{minFilter:"linear",mipmapFilter:"nearest"};case f.n.NEAREST_MIPMAP_LINEAR:return{minFilter:"nearest",mipmapFilter:"linear"};case f.n.LINEAR_MIPMAP_LINEAR:return{minFilter:"linear",mipmapFilter:"linear"};default:return{}}}(n)}}(R.texture.sampler)}});if(r.bindings[i]=C,b&&(r.defines[b]=!0),x&&(r.uniforms[x]=!0),g){let e=(0,l.lz)(g);r.uniforms[e.uvSetUniform]=M,r.uniforms[e.uvTransformUniform]=(0,c.V)((0,l.e3)(t))}r.generatedTextures.push(C)}function S(e,t){return e.createTexture({...t,format:"rgba8unorm",width:1,height:1,mipLevels:1})}function _(e){return e.textureFormat}},11829(e,t,i){i.d(t,{CC:()=>c,Mg:()=>f,e3:()=>l,ii:()=>s,lz:()=>o});let r=[a("baseColor","pbr_baseColorSampler","baseColorTexture",["pbrMetallicRoughness","baseColorTexture"]),a("metallicRoughness","pbr_metallicRoughnessSampler","metallicRoughnessTexture",["pbrMetallicRoughness","metallicRoughnessTexture"]),a("normal","pbr_normalSampler","normalTexture",["normalTexture"]),a("occlusion","pbr_occlusionSampler","occlusionTexture",["occlusionTexture"]),a("emissive","pbr_emissiveSampler","emissiveTexture",["emissiveTexture"]),a("specularColor","pbr_specularColorSampler","KHR_materials_specular.specularColorTexture",["extensions","KHR_materials_specular","specularColorTexture"]),a("specularIntensity","pbr_specularIntensitySampler","KHR_materials_specular.specularTexture",["extensions","KHR_materials_specular","specularTexture"]),a("transmission","pbr_transmissionSampler","KHR_materials_transmission.transmissionTexture",["extensions","KHR_materials_transmission","transmissionTexture"]),a("thickness","pbr_thicknessSampler","KHR_materials_volume.thicknessTexture",["extensions","KHR_materials_volume","thicknessTexture"]),a("clearcoat","pbr_clearcoatSampler","KHR_materials_clearcoat.clearcoatTexture",["extensions","KHR_materials_clearcoat","clearcoatTexture"]),a("clearcoatRoughness","pbr_clearcoatRoughnessSampler","KHR_materials_clearcoat.clearcoatRoughnessTexture",["extensions","KHR_materials_clearcoat","clearcoatRoughnessTexture"]),a("clearcoatNormal","pbr_clearcoatNormalSampler","KHR_materials_clearcoat.clearcoatNormalTexture",["extensions","KHR_materials_clearcoat","clearcoatNormalTexture"]),a("sheenColor","pbr_sheenColorSampler","KHR_materials_sheen.sheenColorTexture",["extensions","KHR_materials_sheen","sheenColorTexture"]),a("sheenRoughness","pbr_sheenRoughnessSampler","KHR_materials_sheen.sheenRoughnessTexture",["extensions","KHR_materials_sheen","sheenRoughnessTexture"]),a("iridescence","pbr_iridescenceSampler","KHR_materials_iridescence.iridescenceTexture",["extensions","KHR_materials_iridescence","iridescenceTexture"]),a("iridescenceThickness","pbr_iridescenceThicknessSampler","KHR_materials_iridescence.iridescenceThicknessTexture",["extensions","KHR_materials_iridescence","iridescenceThicknessTexture"]),a("anisotropy","pbr_anisotropySampler","KHR_materials_anisotropy.anisotropyTexture",["extensions","KHR_materials_anisotropy","anisotropyTexture"]),a("bump","pbr_bumpSampler","EXT_materials_bump.bumpTexture",["extensions","EXT_materials_bump","bumpTexture"]),a("diffuseTransmission","pbr_diffuseTransmissionSampler","KHR_materials_diffuse_transmission.diffuseTransmissionTexture",["extensions","KHR_materials_diffuse_transmission","diffuseTransmissionTexture"]),a("diffuseTransmissionColor","pbr_diffuseTransmissionColorSampler","KHR_materials_diffuse_transmission.diffuseTransmissionColorTexture",["extensions","KHR_materials_diffuse_transmission","diffuseTransmissionColorTexture"]),a("multiscatterColor","pbr_multiscatterColorSampler","KHR_materials_volume_scatter.multiscatterColorTexture",["extensions","KHR_materials_volume_scatter","multiscatterColorTexture"])],n=new Map(r.map(e=>[e.slot,e]));function a(e,t,i,r){return{slot:e,binding:t,displayName:i,pathSegments:r,colorSpace:"baseColor"===e||"emissive"===e||"specularColor"===e||"sheenColor"===e||"diffuseTransmissionColor"===e||"multiscatterColor"===e?"srgb":"linear",uvSetUniform:`${e}UVSet`,uvTransformUniform:`${e}UVTransform`}}function s(){return r}function o(e){let t=n.get(e);if(!t)throw Error(`Unknown PBR texture transform slot ${e}`);return t}function l(e){let t=e?.extensions?.KHR_texture_transform;return{offset:t?.offset?[t.offset[0],t.offset[1]]:[0,0],rotation:t?.rotation??0,scale:t?.scale?[t.scale[0],t.scale[1]]:[1,1]}}function c(e){let t=e?.extensions?.KHR_texture_transform;return t?.texCoord??e?.texCoord??0}function f(e){if("extensions"===e[0]&&"KHR_materials_scatter"===e[1]){let t="scatterStrengthTexture"===e[2]?"diffuseTransmission":"multiscatterColorTexture"===e[2]?"multiscatterColor":null;if(t&&3===e.length)return{...o(t),pathSegments:e}}return r.find(t=>t.pathSegments.length===e.length&&t.pathSegments.every((t,i)=>e[i]===t))||null}},19710(e,t,i){var r,n;i.d(t,{n:()=>r}),(n=r||(r={}))[n.POINTS=0]="POINTS",n[n.LINES=1]="LINES",n[n.LINE_LOOP=2]="LINE_LOOP",n[n.LINE_STRIP=3]="LINE_STRIP",n[n.TRIANGLES=4]="TRIANGLES",n[n.TRIANGLE_STRIP=5]="TRIANGLE_STRIP",n[n.TRIANGLE_FAN=6]="TRIANGLE_FAN",n[n.ONE=1]="ONE",n[n.SRC_ALPHA=770]="SRC_ALPHA",n[n.ONE_MINUS_SRC_ALPHA=771]="ONE_MINUS_SRC_ALPHA",n[n.FUNC_ADD=32774]="FUNC_ADD",n[n.LINEAR=9729]="LINEAR",n[n.NEAREST=9728]="NEAREST",n[n.NEAREST_MIPMAP_NEAREST=9984]="NEAREST_MIPMAP_NEAREST",n[n.LINEAR_MIPMAP_NEAREST=9985]="LINEAR_MIPMAP_NEAREST",n[n.NEAREST_MIPMAP_LINEAR=9986]="NEAREST_MIPMAP_LINEAR",n[n.LINEAR_MIPMAP_LINEAR=9987]="LINEAR_MIPMAP_LINEAR",n[n.TEXTURE_MAG_FILTER=10240]="TEXTURE_MAG_FILTER",n[n.TEXTURE_MIN_FILTER=10241]="TEXTURE_MIN_FILTER",n[n.TEXTURE_WRAP_S=10242]="TEXTURE_WRAP_S",n[n.TEXTURE_WRAP_T=10243]="TEXTURE_WRAP_T",n[n.REPEAT=10497]="REPEAT",n[n.CLAMP_TO_EDGE=33071]="CLAMP_TO_EDGE",n[n.MIRRORED_REPEAT=33648]="MIRRORED_REPEAT",n[n.UNPACK_FLIP_Y_WEBGL=37440]="UNPACK_FLIP_Y_WEBGL"},33232(e,t,i){i.d(t,{a:()=>n});var r=i(7578);class n extends Array{clone(){return new this.constructor().copy(this)}fromArray(e,t=0){for(let i=0;i<this.ELEMENTS;++i)this[i]=e[i+t];return this.check()}toArray(e=[],t=0){for(let i=0;i<this.ELEMENTS;++i)e[t+i]=this[i];return e}toObject(e){return e}from(e){return Array.isArray(e)?this.copy(e):this.fromObject(e)}to(e){return e===this?this:(0,r.cy)(e)?this.toArray(e):this.toObject(e)}toTarget(e){return e?this.to(e):this}toString(){return this.formatString(r.$W)}formatString(e){let t="";for(let i=0;i<this.ELEMENTS;++i)t+=(i>0?", ":"")+(0,r.Fl)(this[i],e);return`${e.printTypes?this.constructor.name:""}[${t}]`}equals(e){if(!e||this.length!==e.length)return!1;for(let t=0;t<this.ELEMENTS;++t)if(!(0,r.aI)(this[t],e[t]))return!1;return!0}exactEquals(e){if(!e||this.length!==e.length)return!1;for(let t=0;t<this.ELEMENTS;++t)if(this[t]!==e[t])return!1;return!0}negate(){for(let e=0;e<this.ELEMENTS;++e)this[e]=-this[e];return this.check()}lerp(e,t,i){if(void 0===i)return this.lerp(this,e,t);for(let r=0;r<this.ELEMENTS;++r){let n=e[r],a="number"==typeof t?t:t[r];this[r]=n+i*(a-n)}return this.check()}min(e){for(let t=0;t<this.ELEMENTS;++t)this[t]=Math.min(e[t],this[t]);return this.check()}max(e){for(let t=0;t<this.ELEMENTS;++t)this[t]=Math.max(e[t],this[t]);return this.check()}clamp(e,t){for(let i=0;i<this.ELEMENTS;++i)this[i]=Math.min(Math.max(this[i],e[i]),t[i]);return this.check()}add(...e){for(let t of e)for(let e=0;e<this.ELEMENTS;++e)this[e]+=t[e];return this.check()}subtract(...e){for(let t of e)for(let e=0;e<this.ELEMENTS;++e)this[e]-=t[e];return this.check()}scale(e){if("number"==typeof e)for(let t=0;t<this.ELEMENTS;++t)this[t]*=e;else for(let t=0;t<this.ELEMENTS&&t<e.length;++t)this[t]*=e[t];return this.check()}multiplyByScalar(e){for(let t=0;t<this.ELEMENTS;++t)this[t]*=e;return this.check()}check(){if(r.$W.debug&&!this.validate())throw Error(`math.gl: ${this.constructor.name} some fields set to invalid numbers'`);return this}validate(){let e=this.length===this.ELEMENTS;for(let t=0;t<this.ELEMENTS;++t)e=e&&Number.isFinite(this[t]);return e}}},49895(e,t,i){i.d(t,{u:()=>s});var r=i(33232),n=i(1548),a=i(7578);class s extends r.a{toString(){let e="[";if(a.$W.printRowMajor){e+="row-major:";for(let t=0;t<this.RANK;++t)for(let i=0;i<this.RANK;++i)e+=` ${this[i*this.RANK+t]}`}else{e+="column-major:";for(let t=0;t<this.ELEMENTS;++t)e+=` ${this[t]}`}return e+"]"}getElementIndex(e,t){return t*this.RANK+e}getElement(e,t){return this[t*this.RANK+e]}setElement(e,t,i){return this[t*this.RANK+e]=(0,n.ws)(i),this}getColumn(e,t=Array(this.RANK).fill(-0)){let i=e*this.RANK;for(let e=0;e<this.RANK;++e)t[e]=this[i+e];return t}setColumn(e,t){let i=e*this.RANK;for(let e=0;e<this.RANK;++e)this[i+e]=t[e];return this}}},30415(e,t,i){let r;i.d(t,{d:()=>m});var n,a,s=i(49895),o=i(1548),l=i(31838);function c(e,t,i){let r=t[0],n=t[1],a=t[2],s=t[3],o=t[4],l=t[5],c=t[6],f=t[7],u=t[8],p=i[0],h=i[1],m=i[2],d=i[3],g=i[4],b=i[5],v=i[6],S=i[7],_=i[8];return e[0]=p*r+h*s+m*c,e[1]=p*n+h*o+m*f,e[2]=p*a+h*l+m*u,e[3]=d*r+g*s+b*c,e[4]=d*n+g*o+b*f,e[5]=d*a+g*l+b*u,e[6]=v*r+S*s+_*c,e[7]=v*n+S*o+_*f,e[8]=v*a+S*l+_*u,e}function f(e,t,i){let r=i[0],n=i[1];return e[0]=r*t[0],e[1]=r*t[1],e[2]=r*t[2],e[3]=n*t[3],e[4]=n*t[4],e[5]=n*t[5],e[6]=t[6],e[7]=t[7],e[8]=t[8],e}var u=i(10207),p=i(75592);(n=a||(a={}))[n.COL0ROW0=0]="COL0ROW0",n[n.COL0ROW1=1]="COL0ROW1",n[n.COL0ROW2=2]="COL0ROW2",n[n.COL1ROW0=3]="COL1ROW0",n[n.COL1ROW1=4]="COL1ROW1",n[n.COL1ROW2=5]="COL1ROW2",n[n.COL2ROW0=6]="COL2ROW0",n[n.COL2ROW1=7]="COL2ROW1",n[n.COL2ROW2=8]="COL2ROW2";let h=Object.freeze([1,0,0,0,1,0,0,0,1]);class m extends s.u{static get IDENTITY(){return d||Object.freeze(d=new m),d}static get ZERO(){return r||Object.freeze(r=new m([0,0,0,0,0,0,0,0,0])),r}get ELEMENTS(){return 9}get RANK(){return 3}get INDICES(){return a}constructor(e){super(-0,-0,-0,-0,-0,-0,-0,-0,-0),1==arguments.length&&Array.isArray(e)?this.copy(e):this.identity()}copy(e){return this[0]=e[0],this[1]=e[1],this[2]=e[2],this[3]=e[3],this[4]=e[4],this[5]=e[5],this[6]=e[6],this[7]=e[7],this[8]=e[8],this.check()}identity(){return this.copy(h)}fromObject(e){return this.check()}fromQuaternion(e){let t,i,r,n,a,s,o,l,c,f,u,p,h,m,d,g;return t=e[0],i=e[1],r=e[2],n=e[3],a=t+t,s=i+i,o=r+r,l=t*a,c=i*a,f=i*s,u=r*a,p=r*s,h=r*o,m=n*a,d=n*s,g=n*o,this[0]=1-f-h,this[3]=c-g,this[6]=u+d,this[1]=c+g,this[4]=1-l-h,this[7]=p-m,this[2]=u-d,this[5]=p+m,this[8]=1-l-f,this.check()}fromMatrix4(e){return this.set(e[0],e[1],e[2],e[4],e[5],e[6],e[8],e[9],e[10])}set(e,t,i,r,n,a,s,o,l){return this[0]=e,this[1]=t,this[2]=i,this[3]=r,this[4]=n,this[5]=a,this[6]=s,this[7]=o,this[8]=l,this.check()}setRowMajor(e,t,i,r,n,a,s,o,l){return this[0]=e,this[1]=r,this[2]=s,this[3]=t,this[4]=n,this[5]=o,this[6]=i,this[7]=a,this[8]=l,this.check()}determinant(){let e,t,i,r,n,a,s,o,l;return e=this[0],t=this[1],i=this[2],r=this[3],n=this[4],a=this[5],s=this[6],o=this[7],e*((l=this[8])*n-a*o)+t*(-l*r+a*s)+i*(o*r-n*s)}transpose(){return!function(e,t){if(e===t){let i=t[1],r=t[2],n=t[5];e[1]=t[3],e[2]=t[6],e[3]=i,e[5]=t[7],e[6]=r,e[7]=n}else e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8]}(this,this),this.check()}invert(){let e,t,i,r,n,a,s,o,l,c,f,u,p;return e=this[0],t=this[1],i=this[2],r=this[3],n=this[4],a=this[5],s=this[6],o=this[7],c=(l=this[8])*n-a*o,(p=e*c+t*(f=-l*r+a*s)+i*(u=o*r-n*s))&&(p=1/p,this[0]=c*p,this[1]=(-l*t+i*o)*p,this[2]=(a*t-i*n)*p,this[3]=f*p,this[4]=(l*e-i*s)*p,this[5]=(-a*e+i*r)*p,this[6]=u*p,this[7]=(-o*e+t*s)*p,this[8]=(n*e-t*r)*p),this.check()}multiplyLeft(e){return c(this,e,this),this.check()}multiplyRight(e){return c(this,this,e),this.check()}rotate(e){let t,i,r,n,a,s,o,l,c,f,u;return t=this[0],i=this[1],r=this[2],n=this[3],a=this[4],s=this[5],o=this[6],l=this[7],c=this[8],f=Math.sin(e),u=Math.cos(e),this[0]=u*t+f*n,this[1]=u*i+f*a,this[2]=u*r+f*s,this[3]=u*n-f*t,this[4]=u*a-f*i,this[5]=u*s-f*r,this[6]=o,this[7]=l,this[8]=c,this.check()}scale(e){return Array.isArray(e)?f(this,this,e):f(this,this,[e,e]),this.check()}translate(e){let t,i,r,n,a,s,o,l,c,f,u;return t=this[0],i=this[1],r=this[2],n=this[3],a=this[4],s=this[5],o=this[6],l=this[7],c=this[8],f=e[0],u=e[1],this[0]=t,this[1]=i,this[2]=r,this[3]=n,this[4]=a,this[5]=s,this[6]=f*t+u*n+o,this[7]=f*i+u*a+l,this[8]=f*r+u*s+c,this.check()}transform(e,t){let i;switch(e.length){case 2:i=(0,u.ei)(t||[-0,-0],e,this);break;case 3:i=(0,p.ei)(t||[-0,-0,-0],e,this);break;case 4:i=(0,l.vE)(t||[-0,-0,-0,-0],e,this);break;default:throw Error("Illegal vector")}return(0,o.qk)(i,e.length),i}}let d=null},22458(e,t,i){i.d(t,{p8:()=>r,tb:()=>n});let r=1e-6,n="u">typeof Float32Array?Float32Array:Array},10207(e,t,i){function r(e,t,i){let r=t[0],n=t[1];return e[0]=i[0]*r+i[3]*n+i[6],e[1]=i[1]*r+i[4]*n+i[7],e}function n(e,t,i){let r=t[0],n=t[1];return e[0]=i[0]*r+i[4]*n+i[12],e[1]=i[1]*r+i[5]*n+i[13],e}i.d(t,{Z0:()=>n,ei:()=>r})},75592(e,t,i){i.d(t,{$A:()=>l,Il:()=>g,Om:()=>o,S8:()=>s,Z0:()=>c,Z8:()=>h,eL:()=>p,ei:()=>f,fA:()=>a,g7:()=>d,gL:()=>u,vt:()=>n,x6:()=>m});var r=i(22458);function n(){let e=new r.tb(3);return r.tb!==Float32Array&&(e[0]=0,e[1]=0,e[2]=0),e}function a(e,t,i){let n=new r.tb(3);return n[0]=e,n[1]=t,n[2]=i,n}function s(e,t){let i=t[0],r=t[1],n=t[2],a=i*i+r*r+n*n;return a>0&&(a=1/Math.sqrt(a)),e[0]=t[0]*a,e[1]=t[1]*a,e[2]=t[2]*a,e}function o(e,t){return e[0]*t[0]+e[1]*t[1]+e[2]*t[2]}function l(e,t,i){let r=t[0],n=t[1],a=t[2],s=i[0],o=i[1],l=i[2];return e[0]=n*l-a*o,e[1]=a*s-r*l,e[2]=r*o-n*s,e}function c(e,t,i){let r=t[0],n=t[1],a=t[2],s=i[3]*r+i[7]*n+i[11]*a+i[15];return s=s||1,e[0]=(i[0]*r+i[4]*n+i[8]*a+i[12])/s,e[1]=(i[1]*r+i[5]*n+i[9]*a+i[13])/s,e[2]=(i[2]*r+i[6]*n+i[10]*a+i[14])/s,e}function f(e,t,i){let r=t[0],n=t[1],a=t[2];return e[0]=r*i[0]+n*i[3]+a*i[6],e[1]=r*i[1]+n*i[4]+a*i[7],e[2]=r*i[2]+n*i[5]+a*i[8],e}function u(e,t,i){let r=i[0],n=i[1],a=i[2],s=i[3],o=t[0],l=t[1],c=t[2],f=n*c-a*l,u=a*o-r*c,p=r*l-n*o,h=n*p-a*u,m=a*f-r*p,d=r*u-n*f,g=2*s;return f*=g,u*=g,p*=g,h*=2,m*=2,d*=2,e[0]=o+f+h,e[1]=l+u+m,e[2]=c+p+d,e}function p(e,t,i,r){let n=[],a=[];return n[0]=t[0]-i[0],n[1]=t[1]-i[1],n[2]=t[2]-i[2],a[0]=n[0],a[1]=n[1]*Math.cos(r)-n[2]*Math.sin(r),a[2]=n[1]*Math.sin(r)+n[2]*Math.cos(r),e[0]=a[0]+i[0],e[1]=a[1]+i[1],e[2]=a[2]+i[2],e}function h(e,t,i,r){let n=[],a=[];return n[0]=t[0]-i[0],n[1]=t[1]-i[1],n[2]=t[2]-i[2],a[0]=n[2]*Math.sin(r)+n[0]*Math.cos(r),a[1]=n[1],a[2]=n[2]*Math.cos(r)-n[0]*Math.sin(r),e[0]=a[0]+i[0],e[1]=a[1]+i[1],e[2]=a[2]+i[2],e}function m(e,t,i,r){let n=[],a=[];return n[0]=t[0]-i[0],n[1]=t[1]-i[1],n[2]=t[2]-i[2],a[0]=n[0]*Math.cos(r)-n[1]*Math.sin(r),a[1]=n[0]*Math.sin(r)+n[1]*Math.cos(r),a[2]=n[2],e[0]=a[0]+i[0],e[1]=a[1]+i[1],e[2]=a[2]+i[2],e}function d(e,t){let i=e[0],r=e[1],n=e[2],a=t[0],s=t[1],l=t[2],c=Math.sqrt((i*i+r*r+n*n)*(a*a+s*s+l*l));return Math.acos(Math.min(Math.max(c&&o(e,t)/c,-1),1))}let g=function(e){let t=e[0],i=e[1],r=e[2];return Math.sqrt(t*t+i*i+r*r)}},7578(e,t,i){i.d(t,{$W:()=>r,Fl:()=>n,aI:()=>function e(t,i,n){let s=r.EPSILON;n&&(r.EPSILON=n);try{if(t===i)return!0;if(a(t)&&a(i)){if(t.length!==i.length)return!1;for(let r=0;r<t.length;++r)if(!e(t[r],i[r]))return!1;return!0}if(t&&t.equals)return t.equals(i);if(i&&i.equals)return i.equals(t);if("number"==typeof t&&"number"==typeof i)return Math.abs(t-i)<=r.EPSILON*Math.max(1,Math.abs(t),Math.abs(i));return!1}finally{r.EPSILON=s}},cy:()=>a}),globalThis.mathgl=globalThis.mathgl||{config:{EPSILON:1e-12,debug:!1,precision:4,printTypes:!1,printDegrees:!1,printRowMajor:!0,_cartographicRadians:!1}};let r=globalThis.mathgl.config;function n(e,{precision:t=r.precision}={}){return e=Math.round(e/r.EPSILON)*r.EPSILON,`${parseFloat(e.toPrecision(t))}`}function a(e){return Array.isArray(e)||ArrayBuffer.isView(e)&&!(e instanceof DataView)}},31838(e,t,i){function r(e,t,i){let r=t[0],n=t[1],a=i[3]*r+i[7]*n||1;return e[0]=(i[0]*r+i[4]*n)/a,e[1]=(i[1]*r+i[5]*n)/a,e}function n(e,t,i){let r=t[0],n=t[1],a=t[2],s=i[3]*r+i[7]*n+i[11]*a||1;return e[0]=(i[0]*r+i[4]*n+i[8]*a)/s,e[1]=(i[1]*r+i[5]*n+i[9]*a)/s,e[2]=(i[2]*r+i[6]*n+i[10]*a)/s,e}function a(e,t,i){let r=t[0],n=t[1];return e[0]=i[0]*r+i[2]*n,e[1]=i[1]*r+i[3]*n,e[2]=t[2],e}function s(e,t,i){let r=t[0],n=t[1],a=t[2];return e[0]=i[0]*r+i[3]*n+i[6]*a,e[1]=i[1]*r+i[4]*n+i[7]*a,e[2]=i[2]*r+i[5]*n+i[8]*a,e[3]=t[3],e}i.d(t,{B$:()=>r,J4:()=>a,cL:()=>n,vE:()=>s})},1548(e,t,i){i.d(t,{qk:()=>a,ws:()=>n});var r=i(7578);function n(e){if(!Number.isFinite(e))throw Error(`Invalid number ${JSON.stringify(e)}`);return e}function a(e,t,i=""){if(r.$W.debug&&!function(e,t){if(e.length!==t)return!1;for(let t=0;t<e.length;++t)if(!Number.isFinite(e[t]))return!1;return!0}(e,t))throw Error(`math.gl: ${i} some fields set to invalid numbers'`);return e}},9515(e,t,i){i.d(t,{s:()=>_});let r=`\
#ifdef USE_IBL
@group(2) @binding(auto) var pbr_diffuseEnvSampler: texture_cube<f32>;
@group(2) @binding(auto) var pbr_diffuseEnvSamplerSampler: sampler;
@group(2) @binding(auto) var pbr_specularEnvSampler: texture_cube<f32>;
@group(2) @binding(auto) var pbr_specularEnvSamplerSampler: sampler;
@group(2) @binding(auto) var pbr_brdfLUT: texture_2d<f32>;
@group(2) @binding(auto) var pbr_brdfLUTSampler: sampler;
#endif
`,n=`\
#ifdef USE_IBL
uniform samplerCube pbr_diffuseEnvSampler;
uniform samplerCube pbr_specularEnvSampler;
uniform sampler2D pbr_brdfLUT;
#endif
`;var a=i(25261);let s=`
#ifdef USE_AREA_LIGHT_LTC
uniform sampler2D areaLTCMatrix;
uniform sampler2D areaLTCAmplitude;
// GGX fit and Fresnel decomposition: Heitz, Dupuy, Hill and Neubelt, SIGGRAPH 2016.
// Explicit bilinear lookup avoids requiring filterable float32 textures on WebGPU.
vec4 areaLTC_lookup(sampler2D table, vec2 coordinate) {
  vec2 position = clamp(coordinate, 0.0, 1.0) * 63.0;
  ivec2 lower = ivec2(floor(position));
  ivec2 upper = min(lower + ivec2(1), ivec2(63));
  vec2 fraction = fract(position);
  return mix(mix(texelFetch(table, lower, 0), texelFetch(table, ivec2(upper.x, lower.y), 0), fraction.x),
             mix(texelFetch(table, ivec2(lower.x, upper.y), 0), texelFetch(table, upper, 0), fraction.x), fraction.y);
}

// Exact horizon clipping followed by the spherical polygon edge integral.
// Disk support uses an inscribed 32-gon; the area error is below 0.65 percent.
float areaLTC_integral(AreaLightUniform light, vec3 receiver, vec3 normal, vec3 view, mat3 inverseTransform) {
  if (dot(light.normal, receiver - light.position) <= 0.0) return 0.0;
  vec3 tangent = view - normal * dot(view, normal);
  if (dot(tangent, tangent) < 1e-8) {
    vec3 axis = abs(normal.z) < 0.9 ? vec3(0.0, 0.0, 1.0) : vec3(0.0, 1.0, 0.0);
    tangent = cross(axis, normal);
  }
  tangent = normalize(tangent);
  mat3 transform = inverseTransform * transpose(mat3(tangent, -cross(normal, tangent), normal));
  vec3 vertices[33];
  int count = light.disk != 0 ? 32 : 4;
  for (int index = 0; index < 32; index++) {
    if (index >= count) break;
    vec2 coordinate;
    if (light.disk != 0) {
      float angle = float(index) * 6.28318530718 / 32.0;
      coordinate = vec2(cos(angle), -sin(angle));
    } else {
      coordinate = index == 0 ? vec2(1.0, -1.0) : index == 1 ? vec2(-1.0, -1.0) : index == 2 ? vec2(-1.0, 1.0) : vec2(1.0, 1.0);
    }
    vertices[index] = transform * (light.position + coordinate.x * light.halfAxisX + coordinate.y * light.halfAxisY - receiver);
  }
  vec3 clipped[34];
  int clippedCount = 0;
  for (int index = 0; index < 32; index++) {
    if (index >= count) break;
    vec3 start = vertices[index];
    vec3 end = vertices[(index + 1) % count];
    if (start.z > 0.0) { clipped[clippedCount] = start; clippedCount++; }
    if ((start.z > 0.0) != (end.z > 0.0)) {
      clipped[clippedCount] = mix(start, end, start.z / (start.z - end.z));
      clippedCount++;
    }
  }
  if (clippedCount < 3) return 0.0;
  vec3 integral = vec3(0.0);
  for (int index = 0; index < 34; index++) {
    if (index >= clippedCount) break;
    vec3 start = normalize(clipped[index]);
    vec3 end = normalize(clipped[(index + 1) % clippedCount]);
    vec3 edge = cross(start, end);
    float sine = length(edge);
    if (sine > 1e-7) integral += edge * (acos(clamp(dot(start, end), -1.0, 1.0)) / sine);
  }
  return min(abs(integral.z) / 6.28318530718, 1.0);
}

vec3 areaLTC_specular(AreaLightUniform light, vec3 receiver, vec3 normal, vec3 view, float roughness, vec3 reflectance0, vec3 reflectance90) {
  vec2 coordinate = vec2(roughness, sqrt(1.0 - clamp(dot(normal, view), 0.0, 1.0)));
  vec4 coefficients = areaLTC_lookup(areaLTCMatrix, coordinate);
  vec4 amplitude = areaLTC_lookup(areaLTCAmplitude, coordinate);
  mat3 inverseTransform = mat3(vec3(coefficients.x, 0.0, coefficients.y), vec3(0.0, 1.0, 0.0), vec3(coefficients.z, 0.0, coefficients.w));
  vec3 fresnel = reflectance0 * amplitude.x + (reflectance90 - reflectance0) * amplitude.y;
  return light.color * fresnel * areaLTC_integral(light, receiver, normal, view, inverseTransform);
}

vec3 areaLTC_evaluate(int index, vec3 receiver, vec3 normal, vec3 view, float roughness, vec3 diffuseColor, vec3 reflectance0, vec3 reflectance90) {
  AreaLightUniform light = areaLighting_getLight(index);
  float diffuseIntegral = areaLTC_integral(light, receiver, normal, view, mat3(1.0));
  return light.color * diffuseColor * (vec3(1.0) - reflectance0) * diffuseIntegral +
    areaLTC_specular(light, receiver, normal, view, roughness, reflectance0, reflectance90);
}
#endif
`,o=`
#ifdef USE_AREA_LIGHT_LTC
@group(2) @binding(auto) var areaLTCMatrix: texture_2d<f32>;
@group(2) @binding(auto) var areaLTCAmplitude: texture_2d<f32>;
fn areaLTC_lookup(table: texture_2d<f32>, coordinate: vec2f) -> vec4f {
  let position = clamp(coordinate, vec2f(0.0), vec2f(1.0)) * 63.0;
  let lower = vec2i(floor(position));
  let upper = min(lower + vec2i(1), vec2i(63));
  let fraction = fract(position);
  return mix(mix(textureLoad(table, lower, 0), textureLoad(table, vec2i(upper.x, lower.y), 0), fraction.x),
             mix(textureLoad(table, vec2i(lower.x, upper.y), 0), textureLoad(table, upper, 0), fraction.x), fraction.y);
}
fn areaLTC_integral(light: AreaLightUniform, receiver: vec3f, normal: vec3f, view: vec3f, inverseTransform: mat3x3f) -> f32 {
  if (dot(light.normal, receiver - light.position) <= 0.0) { return 0.0; }
  var tangent = view - normal * dot(view, normal);
  if (dot(tangent, tangent) < 1e-8) {
    let axis = select(vec3f(0.0, 1.0, 0.0), vec3f(0.0, 0.0, 1.0), abs(normal.z) < 0.9);
    tangent = cross(axis, normal);
  }
  tangent = normalize(tangent);
  let transform = inverseTransform * transpose(mat3x3f(tangent, -cross(normal, tangent), normal));
  var vertices: array<vec3f, 33>;
  let count = select(4, 32, light.disk != 0);
  for (var index = 0; index < 32; index++) {
    if (index >= count) { break; }
    var coordinate: vec2f;
    if (light.disk != 0) {
      let angle = f32(index) * 6.28318530718 / 32.0;
      coordinate = vec2f(cos(angle), -sin(angle));
    } else {
      coordinate = vec2f(1.0, 1.0);
      if (index == 0) { coordinate = vec2f(1.0, -1.0); }
      if (index == 1) { coordinate = vec2f(-1.0, -1.0); }
      if (index == 2) { coordinate = vec2f(-1.0, 1.0); }
    }
    vertices[index] = transform * (light.position + coordinate.x * light.halfAxisX + coordinate.y * light.halfAxisY - receiver);
  }
  var clipped: array<vec3f, 34>;
  var clippedCount = 0;
  for (var index = 0; index < 32; index++) {
    if (index >= count) { break; }
    let start = vertices[index];
    let end = vertices[(index + 1) % count];
    if (start.z > 0.0) { clipped[clippedCount] = start; clippedCount++; }
    if ((start.z > 0.0) != (end.z > 0.0)) {
      clipped[clippedCount] = mix(start, end, start.z / (start.z - end.z));
      clippedCount++;
    }
  }
  if (clippedCount < 3) { return 0.0; }
  var integral = vec3f(0.0);
  for (var index = 0; index < 34; index++) {
    if (index >= clippedCount) { break; }
    let start = normalize(clipped[index]);
    let end = normalize(clipped[(index + 1) % clippedCount]);
    let edge = cross(start, end);
    let sine = length(edge);
    if (sine > 1e-7) { integral += edge * (acos(clamp(dot(start, end), -1.0, 1.0)) / sine); }
  }
  return min(abs(integral.z) / 6.28318530718, 1.0);
}
fn areaLTC_specular(light: AreaLightUniform, receiver: vec3f, normal: vec3f, view: vec3f, roughness: f32, reflectance0: vec3f, reflectance90: vec3f) -> vec3f {
  let coordinate = vec2f(roughness, sqrt(1.0 - clamp(dot(normal, view), 0.0, 1.0)));
  let coefficients = areaLTC_lookup(areaLTCMatrix, coordinate);
  let amplitude = areaLTC_lookup(areaLTCAmplitude, coordinate);
  let inverseTransform = mat3x3f(vec3f(coefficients.x, 0.0, coefficients.y), vec3f(0.0, 1.0, 0.0), vec3f(coefficients.z, 0.0, coefficients.w));
  let fresnel = reflectance0 * amplitude.x + (reflectance90 - reflectance0) * amplitude.y;
  return light.color * fresnel * areaLTC_integral(light, receiver, normal, view, inverseTransform);
}
fn areaLTC_evaluate(index: i32, receiver: vec3f, normal: vec3f, view: vec3f, roughness: f32, diffuseColor: vec3f, reflectance0: vec3f, reflectance90: vec3f) -> vec3f {
  let light = areaLighting_getLight(index);
  let diffuseIntegral = areaLTC_integral(light, receiver, normal, view, mat3x3f(vec3f(1.0,0.0,0.0),vec3f(0.0,1.0,0.0),vec3f(0.0,0.0,1.0)));
  return light.color * diffuseColor * (vec3f(1.0) - reflectance0) * diffuseIntegral +
    areaLTC_specular(light, receiver, normal, view, roughness, reflectance0, reflectance90);
}
#endif
`,l=`
layout(std140) uniform areaLightingUniforms {
  int lightCount;
  int sampleCount;
  AreaLightUniform lights[4];
} areaLighting;

int areaLighting_getLightCount() { return lighting.areaLightCount + areaLighting.lightCount; }
AreaLightUniform areaLighting_getLight(int index) {
  if (index < lighting.areaLightCount) return lighting.areaLights[index];
  return areaLighting.lights[index - lighting.areaLightCount];
}

PointLight areaLighting_getSample(int lightIndex, int sampleIndex, vec3 receiver) {
  AreaLightUniform light = areaLighting_getLight(lightIndex);
  int grid = int(sqrt(float(areaLighting.sampleCount)));
  vec2 coordinate = (vec2(float(sampleIndex % grid), float(sampleIndex / grid)) + 0.5) / float(grid);
  float area = 4.0 * length(light.halfAxisX) * length(light.halfAxisY);
  if (light.disk != 0) {
    float radius = sqrt(coordinate.y);
    float angle = coordinate.x * 6.28318530718;
    coordinate = radius * vec2(cos(angle), sin(angle));
    area *= 0.785398163397;
  } else {
    coordinate = coordinate * 2.0 - 1.0;
  }
  vec3 position = light.position + coordinate.x * light.halfAxisX + coordinate.y * light.halfAxisY;
  vec3 displacement = receiver - position;
  float distanceSquared = max(dot(displacement, displacement), 0.000001);
  float emissionCosine = max(dot(light.normal, displacement * inversesqrt(distanceSquared)), 0.0);
  return PointLight(light.color * (area * emissionCosine / (float(areaLighting.sampleCount) * distanceSquared)), position, vec3(1.0, 0.0, 0.0));
}
`,c=`
struct AreaLightingUniforms {
  lightCount: i32,
  sampleCount: i32,
  lights: array<AreaLightUniform, 4>,
};
@group(2) @binding(auto) var<uniform> areaLighting: AreaLightingUniforms;

fn areaLighting_getLightCount() -> i32 { return lighting.areaLightCount + areaLighting.lightCount; }
fn areaLighting_getLight(index: i32) -> AreaLightUniform {
  if (index < lighting.areaLightCount) { return lighting.areaLights[index]; }
  return areaLighting.lights[index - lighting.areaLightCount];
}

fn areaLighting_getSample(lightIndex: i32, sampleIndex: i32, receiver: vec3f) -> PointLight {
  let light = areaLighting_getLight(lightIndex);
  let grid = i32(sqrt(f32(areaLighting.sampleCount)));
  var coordinate = (vec2f(f32(sampleIndex % grid), f32(sampleIndex / grid)) + 0.5) / f32(grid);
  var area = 4.0 * length(light.halfAxisX) * length(light.halfAxisY);
  if (light.disk != 0) {
    let radius = sqrt(coordinate.y);
    let angle = coordinate.x * 6.28318530718;
    coordinate = radius * vec2f(cos(angle), sin(angle));
    area *= 0.785398163397;
  } else {
    coordinate = coordinate * 2.0 - 1.0;
  }
  let position = light.position + coordinate.x * light.halfAxisX + coordinate.y * light.halfAxisY;
  let displacement = receiver - position;
  let distanceSquared = max(dot(displacement, displacement), 0.000001);
  let emissionCosine = max(dot(light.normal, displacement * inverseSqrt(distanceSquared)), 0.0);
  return PointLight(light.color * (area * emissionCosine / (f32(areaLighting.sampleCount) * distanceSquared)), position, vec3f(1.0, 0.0, 0.0));
}
`;var f=i(48416);let u={name:"areaLighting",props:{},uniforms:{},dependencies:[a.x],defaultUniforms:{lightCount:0,sampleCount:64,lights:Array.from({length:f.zv},f.qO)},uniformTypes:{lightCount:"i32",sampleCount:"i32",lights:[f.HF,f.zv]},bindingLayout:[{name:"areaLighting",group:2},{name:"areaLTCMatrix",group:2},{name:"areaLTCAmplitude",group:2}],source:c+o,vs:l+s,fs:l+s,getUniforms(e={}){let t=e.lights||[];return{lightCount:Math.min(t.length,f.zv),sampleCount:e.sampleCount||64,lights:(0,f.i0)(t,e.useByteColors)}}},p=`\
out vec3 pbr_vPosition;
out vec2 pbr_vUV0;
out vec2 pbr_vUV1;

#ifdef HAS_NORMALS
# ifdef HAS_TANGENTS
out mat3 pbr_vTBN;
# else
out vec3 pbr_vNormal;
# endif
#endif

void pbr_setPositionNormalTangentUV(
  vec4 position,
  vec4 normal,
  vec4 tangent,
  vec2 uv0,
  vec2 uv1
)
{
  vec4 pos = pbrProjection.modelMatrix * position;
  pbr_vPosition = vec3(pos.xyz) / pos.w;

#ifdef HAS_NORMALS
#ifdef HAS_TANGENTS
  vec3 normalW = normalize(vec3(pbrProjection.normalMatrix * vec4(normal.xyz, 0.0)));
  vec3 tangentW = normalize(vec3(pbrProjection.modelMatrix * vec4(tangent.xyz, 0.0)));
  vec3 bitangentW = cross(normalW, tangentW) * tangent.w;
  pbr_vTBN = mat3(tangentW, bitangentW, normalW);
#else // HAS_TANGENTS != 1
  pbr_vNormal = normalize(vec3(pbrProjection.normalMatrix * vec4(normal.xyz, 0.0)));
#endif
#endif

#ifdef HAS_UV
  pbr_vUV0 = uv0;
#else
  pbr_vUV0 = vec2(0.,0.);
#endif

  pbr_vUV1 = uv1;
}
`,h=`\
precision highp float;

layout(std140) uniform pbrMaterialUniforms {
  // Material is unlit
  bool unlit;

  // Base color map
  bool baseColorMapEnabled;
  vec4 baseColorFactor;

  bool normalMapEnabled;  
  float normalScale; // #ifdef HAS_NORMALMAP

  bool emissiveMapEnabled;
  vec3 emissiveFactor; // #ifdef HAS_EMISSIVEMAP

  vec2 metallicRoughnessValues;
  bool metallicRoughnessMapEnabled;

  bool occlusionMapEnabled;
  float occlusionStrength; // #ifdef HAS_OCCLUSIONMAP
  
  bool alphaCutoffEnabled;
  float alphaCutoff; // #ifdef ALPHA_CUTOFF

  vec3 specularColorFactor;
  float specularIntensityFactor;
  bool specularColorMapEnabled;
  bool specularIntensityMapEnabled;

  float ior;

  float transmissionFactor;
  bool transmissionMapEnabled;

  float thicknessFactor;
  float attenuationDistance;
  vec3 attenuationColor;

  float clearcoatFactor;
  float clearcoatRoughnessFactor;
  bool clearcoatMapEnabled;
  bool clearcoatRoughnessMapEnabled;

  vec3 sheenColorFactor;
  float sheenRoughnessFactor;
  bool sheenColorMapEnabled;
  bool sheenRoughnessMapEnabled;

  float iridescenceFactor;
  float iridescenceIor;
  vec2 iridescenceThicknessRange;
  bool iridescenceMapEnabled;

  float anisotropyStrength;
  float anisotropyRotation;
  vec2 anisotropyDirection;
  bool anisotropyMapEnabled;

  float emissiveStrength;
  float dispersion;
  
  // IBL
  bool IBLenabled;
  vec2 scaleIBLAmbient; // #ifdef USE_IBL
  
  // debugging flags used for shader output of intermediate PBR variables
  // #ifdef PBR_DEBUG
  vec4 scaleDiffBaseMR;
  vec4 scaleFGDSpec;
  // #endif

  int baseColorUVSet;
  mat3 baseColorUVTransform;
  int metallicRoughnessUVSet;
  mat3 metallicRoughnessUVTransform;
  int normalUVSet;
  mat3 normalUVTransform;
  int occlusionUVSet;
  mat3 occlusionUVTransform;
  int emissiveUVSet;
  mat3 emissiveUVTransform;
  int specularColorUVSet;
  mat3 specularColorUVTransform;
  int specularIntensityUVSet;
  mat3 specularIntensityUVTransform;
  int transmissionUVSet;
  mat3 transmissionUVTransform;
  int thicknessUVSet;
  mat3 thicknessUVTransform;
  int clearcoatUVSet;
  mat3 clearcoatUVTransform;
  int clearcoatRoughnessUVSet;
  mat3 clearcoatRoughnessUVTransform;
  int clearcoatNormalUVSet;
  mat3 clearcoatNormalUVTransform;
  int sheenColorUVSet;
  mat3 sheenColorUVTransform;
  int sheenRoughnessUVSet;
  mat3 sheenRoughnessUVTransform;
  int iridescenceUVSet;
  mat3 iridescenceUVTransform;
  int iridescenceThicknessUVSet;
  mat3 iridescenceThicknessUVTransform;
  int anisotropyUVSet;
  mat3 anisotropyUVTransform;

  float bumpFactor;
  bool bumpMapEnabled;
  float diffuseTransmissionFactor;
  bool diffuseTransmissionMapEnabled;
  vec3 diffuseTransmissionColorFactor;
  bool diffuseTransmissionColorMapEnabled;
  vec3 multiscatterColorFactor;
  bool multiscatterColorMapEnabled;
  float scatterAnisotropy;

  int bumpUVSet;
  mat3 bumpUVTransform;
  int diffuseTransmissionUVSet;
  mat3 diffuseTransmissionUVTransform;
  int diffuseTransmissionColorUVSet;
  mat3 diffuseTransmissionColorUVTransform;
  int multiscatterColorUVSet;
  mat3 multiscatterColorUVTransform;
  bool lightmapMapEnabled;
  float lightmapIntensity;
  int lightmapUVSet;
  mat3 lightmapUVTransform;
  float scatterStrengthFactor;
} pbrMaterial;

// Samplers
#ifdef HAS_BASECOLORMAP
uniform sampler2D pbr_baseColorSampler;
#endif
#ifdef HAS_NORMALMAP
uniform sampler2D pbr_normalSampler;
#endif
#ifdef HAS_EMISSIVEMAP
uniform sampler2D pbr_emissiveSampler;
#endif
#ifdef HAS_LIGHTMAP
uniform sampler2D pbr_lightmapSampler;
#endif
#ifdef HAS_METALROUGHNESSMAP
uniform sampler2D pbr_metallicRoughnessSampler;
#endif
#ifdef HAS_OCCLUSIONMAP
uniform sampler2D pbr_occlusionSampler;
#endif
#ifdef HAS_SPECULARCOLORMAP
uniform sampler2D pbr_specularColorSampler;
#endif
#ifdef HAS_SPECULARINTENSITYMAP
uniform sampler2D pbr_specularIntensitySampler;
#endif
#ifdef HAS_TRANSMISSIONMAP
uniform sampler2D pbr_transmissionSampler;
#endif
#ifdef HAS_THICKNESSMAP
uniform sampler2D pbr_thicknessSampler;
#endif
#ifdef HAS_CLEARCOATMAP
uniform sampler2D pbr_clearcoatSampler;
#endif
#ifdef HAS_CLEARCOATROUGHNESSMAP
uniform sampler2D pbr_clearcoatRoughnessSampler;
#endif
#ifdef HAS_CLEARCOATNORMALMAP
uniform sampler2D pbr_clearcoatNormalSampler;
#endif
#ifdef HAS_SHEENCOLORMAP
uniform sampler2D pbr_sheenColorSampler;
#endif
#ifdef HAS_SHEENROUGHNESSMAP
uniform sampler2D pbr_sheenRoughnessSampler;
#endif
#ifdef HAS_IRIDESCENCEMAP
uniform sampler2D pbr_iridescenceSampler;
#endif
#ifdef HAS_IRIDESCENCETHICKNESSMAP
uniform sampler2D pbr_iridescenceThicknessSampler;
#endif
#ifdef HAS_ANISOTROPYMAP
uniform sampler2D pbr_anisotropySampler;
#endif
#ifdef HAS_BUMPMAP
uniform sampler2D pbr_bumpSampler;
#endif
#ifdef HAS_DIFFUSETRANSMISSIONMAP
uniform sampler2D pbr_diffuseTransmissionSampler;
#endif
#ifdef HAS_DIFFUSETRANSMISSIONCOLORMAP
uniform sampler2D pbr_diffuseTransmissionColorSampler;
#endif
#ifdef HAS_MULTISCATTERCOLORMAP
uniform sampler2D pbr_multiscatterColorSampler;
#endif
// Inputs from vertex shader

in vec3 pbr_vPosition;
in vec2 pbr_vUV0;
in vec2 pbr_vUV1;

#ifdef HAS_NORMALS
#ifdef HAS_TANGENTS
in mat3 pbr_vTBN;
#else
in vec3 pbr_vNormal;
#endif
#endif

// Encapsulate the various inputs used by the various functions in the shading equation
// We store values in this struct to simplify the integration of alternative implementations
// of the shading terms, outlined in the Readme.MD Appendix.
struct PBRInfo {
  float NdotL;                  // cos angle between normal and light direction
  float NdotV;                  // cos angle between normal and view direction
  float NdotH;                  // cos angle between normal and half vector
  float LdotH;                  // cos angle between light direction and half vector
  float VdotH;                  // cos angle between view direction and half vector
  float perceptualRoughness;    // roughness value, as authored by the model creator (input to shader)
  float metalness;              // metallic value at the surface
  vec3 reflectance0;            // full reflectance color (normal incidence angle)
  vec3 reflectance90;           // reflectance color at grazing angle
  float alphaRoughness;         // roughness mapped to a more linear change in the roughness (proposed by [2])
  vec3 diffuseColor;            // color contribution from diffuse lighting
  vec3 specularColor;           // color contribution from specular lighting
  vec3 n;                       // normal at surface point
  vec3 v;                       // vector from surface point to camera
  vec3 l;                       // direction from the surface toward the current light
  vec3 h;                       // half vector between the current light and camera
};

const float M_PI = 3.141592653589793;
const float c_MinRoughness = 0.04;

// Widen sub-pixel specular lobes using the screen-space normal footprint.
// This is geometric specular antialiasing: the normal variance is converted
// into an additional squared perceptual roughness before evaluating BRDFs.
float widenSpecularRoughness(float perceptualRoughness, vec3 normal)
{
  vec3 normalDerivativeX = dFdx(normal);
  vec3 normalDerivativeY = dFdy(normal);
  float normalVariance =
    dot(normalDerivativeX, normalDerivativeX) +
    dot(normalDerivativeY, normalDerivativeY);
  float kernelRoughnessSquared = min(2.0 * normalVariance, 1.0);
  return clamp(
    sqrt(perceptualRoughness * perceptualRoughness + kernelRoughnessSquared),
    c_MinRoughness,
    1.0
  );
}

vec3 calculateFinalColor(PBRInfo pbrInfo, vec3 lightColor);

vec4 SRGBtoLINEAR(vec4 srgbIn)
{
#ifdef MANUAL_SRGB
#ifdef SRGB_FAST_APPROXIMATION
  vec3 linOut = pow(srgbIn.xyz,vec3(2.2));
#else // SRGB_FAST_APPROXIMATION
  vec3 bLess = step(vec3(0.04045),srgbIn.xyz);
  vec3 linOut = mix( srgbIn.xyz/vec3(12.92), pow((srgbIn.xyz+vec3(0.055))/vec3(1.055),vec3(2.4)), bLess );
#endif //SRGB_FAST_APPROXIMATION
  return vec4(linOut,srgbIn.w);;
#else //MANUAL_SRGB
  return srgbIn;
#endif //MANUAL_SRGB
}

vec2 getMaterialUV(int uvSet, mat3 uvTransform)
{
  vec2 baseUV = uvSet == 1 ? pbr_vUV1 : pbr_vUV0;
  return (uvTransform * vec3(baseUV, 1.0)).xy;
}

// Build the tangent basis from interpolated attributes or screen-space derivatives.
mat3 getTBN(vec2 uv)
{
#ifndef HAS_TANGENTS
  vec3 pos_dx = dFdx(pbr_vPosition);
  vec3 pos_dy = dFdy(pbr_vPosition);
  vec3 tex_dx = dFdx(vec3(uv, 0.0));
  vec3 tex_dy = dFdy(vec3(uv, 0.0));
  vec3 t = (tex_dy.t * pos_dx - tex_dx.t * pos_dy) / (tex_dx.s * tex_dy.t - tex_dy.s * tex_dx.t);

#ifdef HAS_NORMALS
  vec3 ng = normalize(pbr_vNormal);
#else
  vec3 ng = cross(pos_dx, pos_dy);
#endif

  t = normalize(t - ng * dot(ng, t));
  vec3 b = normalize(cross(ng, t));
  mat3 tbn = mat3(t, b, ng);
#else // HAS_TANGENTS
  mat3 tbn = pbr_vTBN;
#endif

#ifdef DOUBLE_SIDED
#ifdef HAS_NORMALS
  // Derivative normals already face the viewer; only flip an authored basis.
  if (!gl_FrontFacing) tbn = mat3(-tbn[0], -tbn[1], -tbn[2]);
#endif
#endif
  return tbn;
}

// Find the normal for this fragment, pulling either from a predefined normal map
// or from the interpolated mesh normal and tangent attributes.
vec3 getMappedNormal(sampler2D normalSampler, mat3 tbn, float normalScale, vec2 uv)
{
  vec3 n = texture(normalSampler, uv).rgb;
  return normalize(tbn * ((2.0 * n - 1.0) * vec3(normalScale, normalScale, 1.0)));
}

vec3 getNormal(mat3 tbn, vec2 uv)
{
#ifdef HAS_NORMALMAP
  vec3 n = getMappedNormal(pbr_normalSampler, tbn, pbrMaterial.normalScale, uv);
#else
  // The tbn matrix is linearly interpolated, so we need to re-normalize
  vec3 n = normalize(tbn[2].xyz);
#endif

#ifdef HAS_BUMPMAP
  vec2 bumpUV = getMaterialUV(pbrMaterial.bumpUVSet, pbrMaterial.bumpUVTransform);
  vec2 bumpTexelSize = 1.0 / vec2(textureSize(pbr_bumpSampler, 0));
  float bumpHeight = texture(pbr_bumpSampler, bumpUV).r;
  vec2 bumpGradient = vec2(
    texture(pbr_bumpSampler, bumpUV + vec2(bumpTexelSize.x, 0.0)).r - bumpHeight,
    texture(pbr_bumpSampler, bumpUV + vec2(0.0, bumpTexelSize.y)).r - bumpHeight
  );
  n = normalize(n - pbrMaterial.bumpFactor *
    (tbn[0] * bumpGradient.x + tbn[1] * bumpGradient.y));
#endif

  return n;
}

vec3 getClearcoatNormal(mat3 tbn, vec3 baseNormal, vec2 uv)
{
#ifdef HAS_CLEARCOATNORMALMAP
  return getMappedNormal(pbr_clearcoatNormalSampler, tbn, 1.0, uv);
#else
  return baseNormal;
#endif
}

// Calculation of the lighting contribution from an optional Image Based Light source.
// Precomputed Environment Maps are required uniform inputs and are computed as outlined in [1].
// See our README.md on Environment Maps [3] for additional discussion.
#ifdef USE_IBL
vec3 getIBLContribution(PBRInfo pbrInfo, vec3 n, vec3 reflection)
{
#ifdef USE_SCENE_ENVIRONMENT
  float maximumMipLevel = max(pbrScene.environmentMipCount - 1.0, 0.0);
  float rotationSine = sin(pbrScene.environmentRotation);
  float rotationCosine = cos(pbrScene.environmentRotation);
  mat2 environmentRotation = mat2(rotationCosine, rotationSine, -rotationSine, rotationCosine);
  vec3 environmentNormal = vec3(environmentRotation * n.xz, n.y).xzy;
  vec3 environmentReflection = vec3(environmentRotation * reflection.xz, reflection.y).xzy;
#else
  float maximumMipLevel = 9.0;
  vec3 environmentNormal = n;
  vec3 environmentReflection = reflection;
#endif
  float lod = pbrInfo.perceptualRoughness * maximumMipLevel;
  // retrieve a scale and bias to F0. See [1], Figure 3
  vec4 brdfSample = texture(pbr_brdfLUT,
    vec2(pbrInfo.NdotV, 1.0 - pbrInfo.perceptualRoughness));
  vec4 diffuseSample = texture(pbr_diffuseEnvSampler, environmentNormal);

#ifdef USE_TEX_LOD
  vec4 specularSample = textureLod(pbr_specularEnvSampler, environmentReflection, lod);
#else
  vec4 specularSample = texture(pbr_specularEnvSampler, environmentReflection);
#endif

#ifdef USE_SCENE_ENVIRONMENT
  vec3 brdf = brdfSample.rgb;
  vec3 diffuseLight = diffuseSample.rgb;
  vec3 specularLight = specularSample.rgb;
#else
  vec3 brdf = SRGBtoLINEAR(brdfSample).rgb;
  vec3 diffuseLight = SRGBtoLINEAR(diffuseSample).rgb;
  vec3 specularLight = SRGBtoLINEAR(specularSample).rgb;
#endif

  vec3 diffuse = diffuseLight * pbrInfo.diffuseColor;
  vec3 specular = specularLight * (pbrInfo.specularColor * brdf.x + brdf.y);

  // For presentation, this allows us to disable IBL terms
  diffuse *= pbrMaterial.scaleIBLAmbient.x;
  specular *= pbrMaterial.scaleIBLAmbient.y;

#ifdef USE_SCENE_ENVIRONMENT
  return (diffuse + specular) * max(pbrScene.environmentIntensity, 0.0);
#else
  return diffuse + specular;
#endif
}
#endif

// Basic Lambertian diffuse
// Implementation from Lambert's Photometria https://archive.org/details/lambertsphotome00lambgoog
// See also [1], Equation 1
vec3 diffuse(PBRInfo pbrInfo)
{
  return pbrInfo.diffuseColor / M_PI;
}

// The following equation models the Fresnel reflectance term of the spec equation (aka F())
// Implementation of fresnel from [4], Equation 15
vec3 specularReflection(PBRInfo pbrInfo)
{
  return pbrInfo.reflectance0 +
    (pbrInfo.reflectance90 - pbrInfo.reflectance0) *
    pow(clamp(1.0 - pbrInfo.VdotH, 0.0, 1.0), 5.0);
}

// This calculates the specular geometric attenuation (aka G()),
// where rougher material will reflect less light back to the viewer.
// This implementation is based on [1] Equation 4, and we adopt their modifications to
// alphaRoughness as input as originally proposed in [2].
float geometricOcclusion(PBRInfo pbrInfo)
{
  float NdotL = pbrInfo.NdotL;
  float NdotV = pbrInfo.NdotV;
  float r = pbrInfo.alphaRoughness;

  float attenuationL = 2.0 * NdotL / (NdotL + sqrt(r * r + (1.0 - r * r) * (NdotL * NdotL)));
  float attenuationV = 2.0 * NdotV / (NdotV + sqrt(r * r + (1.0 - r * r) * (NdotV * NdotV)));
  return attenuationL * attenuationV;
}

// The following equation(s) model the distribution of microfacet normals across
// the area being drawn (aka D())
// Implementation from "Average Irregularity Representation of a Roughened Surface
// for Ray Reflection" by T. S. Trowbridge, and K. P. Reitz
// Follows the distribution function recommended in the SIGGRAPH 2013 course notes
// from EPIC Games [1], Equation 3.
float microfacetDistribution(PBRInfo pbrInfo)
{
  float roughnessSq = pbrInfo.alphaRoughness * pbrInfo.alphaRoughness;
  float f = (pbrInfo.NdotH * roughnessSq - pbrInfo.NdotH) * pbrInfo.NdotH + 1.0;
  return roughnessSq / (M_PI * f * f);
}

float maxComponent(vec3 value)
{
  return max(max(value.r, value.g), value.b);
}

float getDielectricF0(float ior)
{
  float clampedIor = max(ior, 1.0);
  float ratio = (clampedIor - 1.0) / (clampedIor + 1.0);
  return ratio * ratio;
}

vec2 normalizeDirection(vec2 direction)
{
  float directionLength = length(direction);
  return directionLength > 0.0001 ? direction / directionLength : vec2(1.0, 0.0);
}

vec2 rotateDirection(vec2 direction, float rotation)
{
  float s = sin(rotation);
  float c = cos(rotation);
  return vec2(direction.x * c - direction.y * s, direction.x * s + direction.y * c);
}

vec3 encodeLinearSRGB(vec3 linearColor)
{
  vec3 positiveColor = max(linearColor, vec3(0.0));
  return mix(
    positiveColor * 12.92,
    1.055 * pow(positiveColor, vec3(1.0 / 2.4)) - 0.055,
    greaterThan(positiveColor, vec3(0.0031308))
  );
}

vec3 toneMapKhronosPBRNeutral(vec3 color)
{
  const float startCompression = 0.76;
  float darkestChannel = min(color.r, min(color.g, color.b));
  float offset = darkestChannel < 0.08
    ? darkestChannel - 6.25 * darkestChannel * darkestChannel
    : 0.04;
  color -= vec3(offset);

  float peak = maxComponent(color);
  if (peak < startCompression) {
    return color;
  }

  float compressionRange = 1.0 - startCompression;
  float compressedPeak = 1.0 - compressionRange * compressionRange /
    (peak + compressionRange - startCompression);
  color *= compressedPeak / max(peak, 0.0001);
  float desaturation = 1.0 - 1.0 / (0.15 * (peak - compressedPeak) + 1.0);
  return mix(color, vec3(compressedPeak), desaturation);
}

vec3 applySceneColorManagement(vec3 sceneColor)
{
#ifdef USE_SCENE_COLOR_MANAGEMENT
  vec3 color = max(sceneColor, vec3(0.0)) * max(pbrScene.exposure, 0.0);
  if (pbrScene.toneMapMode == 1) {
    color /= vec3(1.0) + color;
  } else if (pbrScene.toneMapMode == 2) {
    color = toneMapKhronosPBRNeutral(color);
  } else if (pbrScene.toneMapMode == 3) {
    color = clamp(
      (color * (2.51 * color + 0.03)) / (color * (2.43 * color + 0.59) + 0.14),
      vec3(0.0),
      vec3(1.0)
    );
  }
  return pbrScene.outputEncoding == 0 ? color : encodeLinearSRGB(color);
#else
  return pow(max(sceneColor, vec3(0.0)), vec3(1.0 / 2.2));
#endif
}

float dielectricSchlick(float reflectance, float cosine)
{
  return reflectance + (1.0 - reflectance) * pow(clamp(1.0 - cosine, 0.0, 1.0), 5.0);
}

vec3 evaluateIridescenceSensitivity(float opticalPathDifference, vec3 phaseShift)
{
  float phase = 2.0 * M_PI * opticalPathDifference * 1.0e-9;
  vec3 sensitivity = vec3(5.4856e-13, 4.4201e-13, 5.2481e-13);
  vec3 position = vec3(1.6810e6, 1.7953e6, 2.2084e6);
  vec3 variance = vec3(4.3278e9, 9.3046e9, 6.6121e9);
  vec3 xyz = sensitivity * sqrt(2.0 * M_PI * variance) *
    cos(position * phase + phaseShift) * exp(-phase * phase * variance);
  xyz.x += 9.7470e-14 * sqrt(2.0 * M_PI * 4.5282e9) *
    cos(2.2399e6 * phase + phaseShift.x) * exp(-4.5282e9 * phase * phase);
  xyz /= 1.0685e-7;
  return mat3(
    3.2404542, -0.9692660, 0.0556434,
    -1.5371385, 1.8760108, -0.2040259,
    -0.4985314, 0.0415560, 1.0572252
  ) * xyz;
}

vec3 getIridescenceTint(float iridescence, float thickness, float NdotV, vec3 baseReflectance)
{
  if (iridescence <= 0.0 || thickness <= 0.0) {
    return baseReflectance;
  }

  float filmIor = max(pbrMaterial.iridescenceIor, 1.0);
  float sineSquared = (1.0 - NdotV * NdotV) / (filmIor * filmIor);
  float cosineSquared = 1.0 - sineSquared;
  if (cosineSquared <= 0.0) {
    return mix(baseReflectance, vec3(1.0), iridescence);
  }
  float filmCosine = sqrt(cosineSquared);
  float firstInterfaceReflectance = dielectricSchlick(getDielectricF0(filmIor), NdotV);
  float transmittedEnergy = 1.0 - firstInterfaceReflectance;

  vec3 baseIor = (vec3(1.0) + sqrt(clamp(baseReflectance, vec3(0.0), vec3(0.9999)))) /
    (vec3(1.0) - sqrt(clamp(baseReflectance, vec3(0.0), vec3(0.9999))));
  vec3 secondInterfaceF0 = (baseIor - vec3(filmIor)) / (baseIor + vec3(filmIor));
  secondInterfaceF0 *= secondInterfaceF0;
  vec3 secondInterfaceReflectance = secondInterfaceF0 +
    (vec3(1.0) - secondInterfaceF0) * pow(1.0 - filmCosine, 5.0);
  vec3 phaseShift = vec3(M_PI);
  phaseShift += mix(vec3(0.0), vec3(M_PI), lessThan(baseIor, vec3(filmIor)));
  float opticalPathDifference = 2.0 * filmIor * thickness * filmCosine;
  vec3 combinedReflectance = clamp(
    firstInterfaceReflectance * secondInterfaceReflectance,
    vec3(0.00001),
    vec3(0.9999)
  );
  vec3 recurringAmplitude = sqrt(combinedReflectance);
  vec3 interfaceResponse = transmittedEnergy * transmittedEnergy * secondInterfaceReflectance /
    (vec3(1.0) - combinedReflectance);
  vec3 reflectedSpectrum = vec3(firstInterfaceReflectance) + interfaceResponse;
  vec3 harmonicAmplitude = interfaceResponse - vec3(transmittedEnergy);
  for (int harmonic = 1; harmonic <= 2; harmonic++) {
    harmonicAmplitude *= recurringAmplitude;
    reflectedSpectrum += harmonicAmplitude * 2.0 * evaluateIridescenceSensitivity(
      float(harmonic) * opticalPathDifference,
      float(harmonic) * phaseShift
    );
  }
  return mix(baseReflectance, clamp(reflectedSpectrum, vec3(0.0), vec3(1.0)), iridescence);
}

vec3 getVolumeAttenuation(float thickness)
{
  if (thickness <= 0.0) {
    return vec3(1.0);
  }

  vec3 attenuationCoefficient =
    -log(max(pbrMaterial.attenuationColor, vec3(0.0001))) /
    max(pbrMaterial.attenuationDistance, 0.0001);
  return exp(-attenuationCoefficient * thickness);
}

// KHR_materials_volume_scatter is an active draft. This evaluates a local,
// thickness-aware single-scattering approximation rather than random walk.
vec3 getDiffuseTransmissionAttenuation(
  PBRInfo pbrInfo,
  vec3 multiscatterColor,
  float thickness
)
{
  vec3 volumeAttenuation = getVolumeAttenuation(thickness);
  float scatteringStrength = maxComponent(multiscatterColor);
  if (thickness <= 0.0 || scatteringStrength <= 0.0001) {
    return volumeAttenuation;
  }

  float anisotropy = clamp(pbrMaterial.scatterAnisotropy, -0.95, 0.95);
  float scatteringCosine = clamp(dot(-pbrInfo.v, pbrInfo.l), -1.0, 1.0);
  float phaseDenominator = max(
    1.0 + anisotropy * anisotropy - 2.0 * anisotropy * scatteringCosine,
    0.0001
  );
  float phaseWeight = clamp(
    (1.0 - anisotropy * anisotropy) / pow(phaseDenominator, 1.5),
    0.0,
    4.0
  );
  float scatteringDepth = thickness / max(pbrMaterial.attenuationDistance, 0.0001);
  float scatteringProbability = 1.0 - exp(-scatteringDepth);
  vec3 scatteringColor = clamp(multiscatterColor, vec3(0.0), vec3(1.0));
  return mix(
    volumeAttenuation,
    volumeAttenuation * mix(vec3(1.0), scatteringColor * phaseWeight, scatteringColor),
    scatteringProbability
  );
}

vec3 calculateDiffuseTransmissionLight(
  PBRInfo pbrInfo,
  vec3 lightColor,
  vec3 diffuseTransmissionColor,
  float diffuseTransmission,
  vec3 multiscatterColor,
  float thickness
)
{
  float oppositeHemisphere = max(dot(-pbrInfo.n, pbrInfo.l), 0.0);
  if (oppositeHemisphere <= 0.0 || diffuseTransmission <= 0.0) {
    return vec3(0.0);
  }

  vec3 nonReflectedEnergy = vec3(1.0) - clamp(pbrInfo.reflectance0, vec3(0.0), vec3(1.0));
  vec3 attenuatedColor = getDiffuseTransmissionAttenuation(
    pbrInfo,
    multiscatterColor,
    thickness
  );
  return lightColor * diffuseTransmissionColor * nonReflectedEnergy *
    attenuatedColor * (diffuseTransmission * oppositeHemisphere / M_PI);
}

#ifdef USE_IBL
vec3 calculateDiffuseTransmissionIBL(
  PBRInfo pbrInfo,
  vec3 diffuseTransmissionColor,
  float diffuseTransmission,
  vec3 multiscatterColor,
  float thickness
)
{
  if (diffuseTransmission <= 0.0) {
    return vec3(0.0);
  }

#ifdef USE_SCENE_ENVIRONMENT
  float rotationSine = sin(pbrScene.environmentRotation);
  float rotationCosine = cos(pbrScene.environmentRotation);
  mat2 environmentRotation = mat2(rotationCosine, rotationSine, -rotationSine, rotationCosine);
  vec3 oppositeNormal = vec3(environmentRotation * -pbrInfo.n.xz, -pbrInfo.n.y).xzy;
  vec3 environmentColor = texture(pbr_diffuseEnvSampler, oppositeNormal).rgb *
    max(pbrScene.environmentIntensity, 0.0);
#else
  vec3 environmentColor = SRGBtoLINEAR(texture(pbr_diffuseEnvSampler, -pbrInfo.n)).rgb;
#endif
  vec3 nonReflectedEnergy = vec3(1.0) - clamp(pbrInfo.reflectance0, vec3(0.0), vec3(1.0));
  return environmentColor * diffuseTransmissionColor * nonReflectedEnergy *
    getDiffuseTransmissionAttenuation(pbrInfo, multiscatterColor, thickness) *
    diffuseTransmission * pbrMaterial.scaleIBLAmbient.x;
}
#endif

#ifdef USE_TRANSMISSION_FRAMEBUFFER
vec3 sampleTransmittedSceneColor(
  vec3 position,
  vec3 normal,
  vec3 viewDirection,
  float thickness,
  float perceptualRoughness,
  float indexOfRefraction
)
{
  vec3 refractionDirection = refract(
    -viewDirection,
    normal,
    1.0 / max(indexOfRefraction, 1.0)
  );
  vec3 refractedPosition = position + refractionDirection * thickness;
  vec4 clipPosition = pbrScene.projectionMatrix *
    pbrScene.viewMatrix * vec4(refractedPosition, 1.0);
  vec2 textureCoordinate = clipPosition.xy / max(clipPosition.w, 0.0001) * 0.5 + 0.5;
  textureCoordinate = clamp(textureCoordinate, vec2(0.001), vec2(0.999));

  vec2 blurRadius = perceptualRoughness * perceptualRoughness * 8.0 /
    max(pbrScene.framebufferSize, vec2(1.0));
  vec3 sceneColor = texture(pbr_transmissionFramebufferSampler, textureCoordinate).rgb * 0.4;
  sceneColor += texture(
    pbr_transmissionFramebufferSampler,
    textureCoordinate + vec2(blurRadius.x, 0.0)
  ).rgb * 0.15;
  sceneColor += texture(
    pbr_transmissionFramebufferSampler,
    textureCoordinate - vec2(blurRadius.x, 0.0)
  ).rgb * 0.15;
  sceneColor += texture(
    pbr_transmissionFramebufferSampler,
    textureCoordinate + vec2(0.0, blurRadius.y)
  ).rgb * 0.15;
  sceneColor += texture(
    pbr_transmissionFramebufferSampler,
    textureCoordinate - vec2(0.0, blurRadius.y)
  ).rgb * 0.15;
  return max(sceneColor, vec3(0.0));
}

vec3 getTransmittedSceneColor(
  vec3 position,
  vec3 normal,
  vec3 viewDirection,
  float thickness,
  float perceptualRoughness
)
{
  if (pbrMaterial.dispersion <= 0.0) {
    return sampleTransmittedSceneColor(
      position,
      normal,
      viewDirection,
      thickness,
      perceptualRoughness,
      pbrMaterial.ior
    );
  }

  float halfSpread = (max(pbrMaterial.ior, 1.0) - 1.0) * 0.025 * pbrMaterial.dispersion;
  vec3 indicesOfRefraction = max(
    vec3(pbrMaterial.ior - halfSpread, pbrMaterial.ior, pbrMaterial.ior + halfSpread),
    vec3(1.0)
  );
  return vec3(
    sampleTransmittedSceneColor(
      position, normal, viewDirection, thickness, perceptualRoughness, indicesOfRefraction.r
    ).r,
    sampleTransmittedSceneColor(
      position, normal, viewDirection, thickness, perceptualRoughness, indicesOfRefraction.g
    ).g,
    sampleTransmittedSceneColor(
      position, normal, viewDirection, thickness, perceptualRoughness, indicesOfRefraction.b
    ).b
  );
}
#endif

PBRInfo createClearcoatPBRInfo(PBRInfo basePBRInfo, vec3 clearcoatNormal, float clearcoatRoughness)
{
  float perceptualRoughness = clamp(clearcoatRoughness, c_MinRoughness, 1.0);
  float alphaRoughness = perceptualRoughness * perceptualRoughness;
  float NdotV = clamp(abs(dot(clearcoatNormal, basePBRInfo.v)), 0.001, 1.0);

  return PBRInfo(
    basePBRInfo.NdotL,
    NdotV,
    basePBRInfo.NdotH,
    basePBRInfo.LdotH,
    basePBRInfo.VdotH,
    perceptualRoughness,
    0.0,
    vec3(0.04),
    vec3(1.0),
    alphaRoughness,
    vec3(0.0),
    vec3(0.04),
    clearcoatNormal,
    basePBRInfo.v,
    basePBRInfo.l,
    basePBRInfo.h
  );
}

vec3 calculateClearcoatContribution(
  PBRInfo pbrInfo,
  vec3 lightColor,
  vec3 clearcoatNormal,
  float clearcoatFactor,
  float clearcoatRoughness
) {
  if (clearcoatFactor <= 0.0) {
    return vec3(0.0);
  }

  PBRInfo clearcoatPBRInfo = createClearcoatPBRInfo(pbrInfo, clearcoatNormal, clearcoatRoughness);
  return calculateFinalColor(clearcoatPBRInfo, lightColor) * clearcoatFactor;
}

#ifdef USE_IBL
vec3 calculateClearcoatIBLContribution(
  PBRInfo pbrInfo,
  vec3 clearcoatNormal,
  vec3 reflection,
  float clearcoatFactor,
  float clearcoatRoughness
) {
  if (clearcoatFactor <= 0.0) {
    return vec3(0.0);
  }

  PBRInfo clearcoatPBRInfo = createClearcoatPBRInfo(pbrInfo, clearcoatNormal, clearcoatRoughness);
  return getIBLContribution(clearcoatPBRInfo, clearcoatNormal, reflection) * clearcoatFactor;
}
#endif

vec3 calculateSheenContribution(
  PBRInfo pbrInfo,
  vec3 lightColor,
  vec3 sheenColor,
  float sheenRoughness
) {
  if (maxComponent(sheenColor) <= 0.0) {
    return vec3(0.0);
  }

  float alpha = max(sheenRoughness * sheenRoughness, 0.0001);
  float inverseAlpha = 1.0 / alpha;
  float sineSquared = max(1.0 - pbrInfo.NdotH * pbrInfo.NdotH, 0.0);
  float distribution = (2.0 + inverseAlpha) * pow(sineSquared, inverseAlpha * 0.5) /
    (2.0 * M_PI);
  float visibility = 1.0 / max(
    4.0 * (pbrInfo.NdotL + pbrInfo.NdotV - pbrInfo.NdotL * pbrInfo.NdotV),
    0.0001
  );
  return pbrInfo.NdotL * lightColor * sheenColor * distribution * visibility *
    (1.0 - pbrInfo.metalness);
}

vec3 calculateAnisotropicLightColor(
  PBRInfo pbrInfo,
  vec3 lightColor,
  vec3 anisotropyTangent,
  float anisotropyStrength
) {
  if (anisotropyStrength <= 0.0) {
    return calculateFinalColor(pbrInfo, lightColor);
  }

  vec3 anisotropyBitangent = normalize(cross(pbrInfo.n, anisotropyTangent));
  float tangentRoughness = mix(
    pbrInfo.alphaRoughness,
    1.0,
    anisotropyStrength * anisotropyStrength
  );
  float bitangentRoughness = clamp(pbrInfo.alphaRoughness, 0.001, 1.0);
  float roughnessProduct = tangentRoughness * bitangentRoughness;
  vec3 distributionVector = vec3(
    bitangentRoughness * dot(anisotropyTangent, pbrInfo.h),
    tangentRoughness * dot(anisotropyBitangent, pbrInfo.h),
    roughnessProduct * pbrInfo.NdotH
  );
  float distributionFactor = roughnessProduct /
    max(dot(distributionVector, distributionVector), 0.000001);
  float distribution = roughnessProduct * distributionFactor * distributionFactor / M_PI;
  float viewMask = pbrInfo.NdotL * length(vec3(
    tangentRoughness * dot(anisotropyTangent, pbrInfo.v),
    bitangentRoughness * dot(anisotropyBitangent, pbrInfo.v),
    pbrInfo.NdotV
  ));
  float lightMask = pbrInfo.NdotV * length(vec3(
    tangentRoughness * dot(anisotropyTangent, pbrInfo.l),
    bitangentRoughness * dot(anisotropyBitangent, pbrInfo.l),
    pbrInfo.NdotL
  ));
  float visibility = clamp(0.5 / max(viewMask + lightMask, 0.000001), 0.0, 1.0);
  vec3 fresnel = specularReflection(pbrInfo);
  vec3 diffuseContribution = (vec3(1.0) - fresnel) * diffuse(pbrInfo);
  return pbrInfo.NdotL * lightColor *
    (diffuseContribution + fresnel * distribution * visibility);
}

vec3 getAnisotropicReflection(PBRInfo pbrInfo, vec3 anisotropyTangent, float anisotropyStrength)
{
  if (anisotropyStrength <= 0.0) {
    return -normalize(reflect(pbrInfo.v, pbrInfo.n));
  }
  vec3 anisotropyBitangent = normalize(cross(pbrInfo.n, anisotropyTangent));
  vec3 anisotropicNormal = normalize(cross(anisotropyBitangent, pbrInfo.v));
  anisotropicNormal = normalize(cross(anisotropicNormal, anisotropyBitangent));
  float bend = anisotropyStrength * (1.0 - pbrInfo.perceptualRoughness);
  return -normalize(reflect(pbrInfo.v, normalize(mix(pbrInfo.n, anisotropicNormal, bend))));
}

vec3 calculateMaterialLightColor(
  PBRInfo pbrInfo,
  vec3 lightColor,
  vec3 clearcoatNormal,
  float clearcoatFactor,
  float clearcoatRoughness,
  vec3 sheenColor,
  float sheenRoughness,
  vec3 anisotropyTangent,
  float anisotropyStrength
) {
  vec3 color = calculateAnisotropicLightColor(
    pbrInfo,
    lightColor,
    anisotropyTangent,
    anisotropyStrength
  );
  color += calculateClearcoatContribution(
    pbrInfo,
    lightColor,
    clearcoatNormal,
    clearcoatFactor,
    clearcoatRoughness
  );
  color += calculateSheenContribution(pbrInfo, lightColor, sheenColor, sheenRoughness);
  return color;
}

void PBRInfo_setAmbientLight(inout PBRInfo pbrInfo) {
  pbrInfo.NdotL = 1.0;
  pbrInfo.NdotH = 0.0;
  pbrInfo.LdotH = 0.0;
  pbrInfo.VdotH = 1.0;
  pbrInfo.l = pbrInfo.n;
  pbrInfo.h = pbrInfo.n;
}

void PBRInfo_setDirectionalLight(inout PBRInfo pbrInfo, vec3 lightDirection) {
  vec3 n = pbrInfo.n;
  vec3 v = pbrInfo.v;
  vec3 l = normalize(lightDirection);             // Vector from surface point to light
  vec3 h = normalize(l+v);                        // Half vector between both l and v

  pbrInfo.NdotL = clamp(dot(n, l), 0.001, 1.0);
  pbrInfo.NdotH = clamp(dot(n, h), 0.0, 1.0);
  pbrInfo.LdotH = clamp(dot(l, h), 0.0, 1.0);
  pbrInfo.VdotH = clamp(dot(v, h), 0.0, 1.0);
  pbrInfo.l = l;
  pbrInfo.h = h;
}

void PBRInfo_setPointLight(inout PBRInfo pbrInfo, PointLight pointLight) {
  vec3 light_direction = normalize(pointLight.position - pbr_vPosition);
  PBRInfo_setDirectionalLight(pbrInfo, light_direction);
}

void PBRInfo_setSpotLight(inout PBRInfo pbrInfo, SpotLight spotLight) {
  vec3 light_direction = normalize(spotLight.position - pbr_vPosition);
  PBRInfo_setDirectionalLight(pbrInfo, light_direction);
}

vec3 calculateFinalColor(PBRInfo pbrInfo, vec3 lightColor) {
  // Calculate the shading terms for the microfacet specular shading model
  vec3 F = specularReflection(pbrInfo);
  float G = geometricOcclusion(pbrInfo);
  float D = microfacetDistribution(pbrInfo);

  // Calculation of analytical lighting contribution
  vec3 diffuseContrib = (1.0 - F) * diffuse(pbrInfo);
  vec3 specContrib = F * G * D / (4.0 * pbrInfo.NdotL * pbrInfo.NdotV);
  // Obtain final intensity as reflectance (BRDF) scaled by the energy of the light (cosine law)
  return pbrInfo.NdotL * lightColor * (diffuseContrib + specContrib);
}

// Visibility for the first four spotlights; environment and other lights are unaffected.
float pbr_ambientVisibility = 1.0;

vec4 pbr_filterColorWithShadows(vec4 vertexColor, float directionalVisibility, vec4 pointVisibility, vec4 spotVisibility)
{
  vec2 baseColorUV = getMaterialUV(pbrMaterial.baseColorUVSet, pbrMaterial.baseColorUVTransform);
  vec2 metallicRoughnessUV = getMaterialUV(
    pbrMaterial.metallicRoughnessUVSet,
    pbrMaterial.metallicRoughnessUVTransform
  );
  vec2 normalUV = getMaterialUV(pbrMaterial.normalUVSet, pbrMaterial.normalUVTransform);
  vec2 occlusionUV = getMaterialUV(pbrMaterial.occlusionUVSet, pbrMaterial.occlusionUVTransform);
  vec2 emissiveUV = getMaterialUV(pbrMaterial.emissiveUVSet, pbrMaterial.emissiveUVTransform);
  vec2 lightmapUV = getMaterialUV(pbrMaterial.lightmapUVSet, pbrMaterial.lightmapUVTransform);
  vec2 specularColorUV = getMaterialUV(
    pbrMaterial.specularColorUVSet,
    pbrMaterial.specularColorUVTransform
  );
  vec2 specularIntensityUV = getMaterialUV(
    pbrMaterial.specularIntensityUVSet,
    pbrMaterial.specularIntensityUVTransform
  );
  vec2 transmissionUV = getMaterialUV(
    pbrMaterial.transmissionUVSet,
    pbrMaterial.transmissionUVTransform
  );
  vec2 thicknessUV = getMaterialUV(pbrMaterial.thicknessUVSet, pbrMaterial.thicknessUVTransform);
  vec2 clearcoatUV = getMaterialUV(pbrMaterial.clearcoatUVSet, pbrMaterial.clearcoatUVTransform);
  vec2 clearcoatRoughnessUV = getMaterialUV(
    pbrMaterial.clearcoatRoughnessUVSet,
    pbrMaterial.clearcoatRoughnessUVTransform
  );
  vec2 clearcoatNormalUV = getMaterialUV(
    pbrMaterial.clearcoatNormalUVSet,
    pbrMaterial.clearcoatNormalUVTransform
  );
  vec2 sheenColorUV = getMaterialUV(
    pbrMaterial.sheenColorUVSet,
    pbrMaterial.sheenColorUVTransform
  );
  vec2 sheenRoughnessUV = getMaterialUV(
    pbrMaterial.sheenRoughnessUVSet,
    pbrMaterial.sheenRoughnessUVTransform
  );
  vec2 iridescenceUV = getMaterialUV(
    pbrMaterial.iridescenceUVSet,
    pbrMaterial.iridescenceUVTransform
  );
  vec2 iridescenceThicknessUV = getMaterialUV(
    pbrMaterial.iridescenceThicknessUVSet,
    pbrMaterial.iridescenceThicknessUVTransform
  );
  vec2 anisotropyUV = getMaterialUV(
    pbrMaterial.anisotropyUVSet,
    pbrMaterial.anisotropyUVTransform
  );
  vec2 diffuseTransmissionUV = getMaterialUV(
    pbrMaterial.diffuseTransmissionUVSet,
    pbrMaterial.diffuseTransmissionUVTransform
  );
  vec2 diffuseTransmissionColorUV = getMaterialUV(
    pbrMaterial.diffuseTransmissionColorUVSet,
    pbrMaterial.diffuseTransmissionColorUVTransform
  );
  vec2 multiscatterColorUV = getMaterialUV(
    pbrMaterial.multiscatterColorUVSet,
    pbrMaterial.multiscatterColorUVTransform
  );

  // The albedo may be defined from a base texture or a flat color
#ifdef HAS_BASECOLORMAP
  vec4 baseColor =
    SRGBtoLINEAR(texture(pbr_baseColorSampler, baseColorUV)) *
    pbrMaterial.baseColorFactor * vertexColor;
#else
  vec4 baseColor = pbrMaterial.baseColorFactor * vertexColor;
#endif

#ifdef ALPHA_CUTOFF
  if (baseColor.a < pbrMaterial.alphaCutoff) {
    discard;
  }
#endif

  vec3 color = vec3(0, 0, 0);

  float transmission = 0.0;

  vec3 lightmapIrradiance = vec3(0.0);
#ifdef HAS_LIGHTMAP
  if (pbrMaterial.lightmapMapEnabled) {
    lightmapIrradiance = texture(pbr_lightmapSampler, lightmapUV).rgb * pbrMaterial.lightmapIntensity;
  }
#endif

  if(pbrMaterial.unlit){
    color.rgb = baseColor.rgb;
#ifdef HAS_LIGHTMAP
    if (pbrMaterial.lightmapMapEnabled) {
      color *= lightmapIrradiance / M_PI * pbr_ambientVisibility;
#ifdef HAS_OCCLUSIONMAP
      if (pbrMaterial.occlusionMapEnabled) {
        float ao = texture(pbr_occlusionSampler, occlusionUV).r;
        color = mix(color, color * ao, pbrMaterial.occlusionStrength);
      }
#endif
    }
#endif
  }
  else{
    // Metallic and Roughness material properties are packed together
    // In glTF, these factors can be specified by fixed scalar values
    // or from a metallic-roughness map
    float perceptualRoughness = pbrMaterial.metallicRoughnessValues.y;
    float metallic = pbrMaterial.metallicRoughnessValues.x;
#ifdef HAS_METALROUGHNESSMAP
    // Roughness is stored in the 'g' channel, metallic is stored in the 'b' channel.
    // This layout intentionally reserves the 'r' channel for (optional) occlusion map data
    vec4 mrSample = texture(pbr_metallicRoughnessSampler, metallicRoughnessUV);
    perceptualRoughness = mrSample.g * perceptualRoughness;
    metallic = mrSample.b * metallic;
#endif
    perceptualRoughness = clamp(perceptualRoughness, c_MinRoughness, 1.0);
    metallic = clamp(metallic, 0.0, 1.0);
    mat3 tbn = getTBN(normalUV);
    vec3 n = getNormal(tbn, normalUV);                          // normal at surface point
    perceptualRoughness = widenSpecularRoughness(perceptualRoughness, n);
    vec3 v = normalize(pbrProjection.camera - pbr_vPosition);  // Vector from surface point to camera
    float NdotV = clamp(abs(dot(n, v)), 0.001, 1.0);
#ifdef USE_MATERIAL_EXTENSIONS
    bool useExtendedPBR =
      pbrMaterial.specularColorMapEnabled ||
      pbrMaterial.specularIntensityMapEnabled ||
      abs(pbrMaterial.specularIntensityFactor - 1.0) > 0.0001 ||
      maxComponent(abs(pbrMaterial.specularColorFactor - vec3(1.0))) > 0.0001 ||
      abs(pbrMaterial.ior - 1.5) > 0.0001 ||
      pbrMaterial.dispersion > 0.0001 ||
      pbrMaterial.transmissionMapEnabled ||
      pbrMaterial.transmissionFactor > 0.0001 ||
      pbrMaterial.diffuseTransmissionMapEnabled ||
      pbrMaterial.diffuseTransmissionColorMapEnabled ||
      pbrMaterial.diffuseTransmissionFactor > 0.0001 ||
      pbrMaterial.multiscatterColorMapEnabled ||
      maxComponent(pbrMaterial.multiscatterColorFactor) > 0.0001 ||
      pbrMaterial.clearcoatMapEnabled ||
      pbrMaterial.clearcoatRoughnessMapEnabled ||
      pbrMaterial.clearcoatFactor > 0.0001 ||
      pbrMaterial.clearcoatRoughnessFactor > 0.0001 ||
      pbrMaterial.sheenColorMapEnabled ||
      pbrMaterial.sheenRoughnessMapEnabled ||
      maxComponent(pbrMaterial.sheenColorFactor) > 0.0001 ||
      pbrMaterial.sheenRoughnessFactor > 0.0001 ||
      pbrMaterial.iridescenceMapEnabled ||
      pbrMaterial.iridescenceFactor > 0.0001 ||
      abs(pbrMaterial.iridescenceIor - 1.3) > 0.0001 ||
      abs(pbrMaterial.iridescenceThicknessRange.x - 100.0) > 0.0001 ||
      abs(pbrMaterial.iridescenceThicknessRange.y - 400.0) > 0.0001 ||
      pbrMaterial.anisotropyMapEnabled ||
      pbrMaterial.anisotropyStrength > 0.0001 ||
      abs(pbrMaterial.anisotropyRotation) > 0.0001 ||
      length(pbrMaterial.anisotropyDirection - vec2(1.0, 0.0)) > 0.0001;
#else
    bool useExtendedPBR = false;
#endif

    if (!useExtendedPBR) {
      // Keep the baseline metallic-roughness implementation byte-for-byte equivalent in behavior.
      float alphaRoughness = perceptualRoughness * perceptualRoughness;

      vec3 f0 = vec3(0.04);
      vec3 diffuseColor = baseColor.rgb * (vec3(1.0) - f0);
      diffuseColor *= 1.0 - metallic;
      vec3 specularColor = mix(f0, baseColor.rgb, metallic);

      float reflectance = max(max(specularColor.r, specularColor.g), specularColor.b);
      float reflectance90 = clamp(reflectance * 25.0, 0.0, 1.0);
      vec3 specularEnvironmentR0 = specularColor.rgb;
      vec3 specularEnvironmentR90 = vec3(1.0, 1.0, 1.0) * reflectance90;
      vec3 reflection = -normalize(reflect(v, n));

      PBRInfo pbrInfo = PBRInfo(
        0.0, // NdotL
        NdotV,
        0.0, // NdotH
        0.0, // LdotH
        0.0, // VdotH
        perceptualRoughness,
        metallic,
        specularEnvironmentR0,
        specularEnvironmentR90,
        alphaRoughness,
        diffuseColor,
        specularColor,
        n,
        v,
        n,
        n
      );

#ifdef USE_LIGHTS
      PBRInfo_setAmbientLight(pbrInfo);
      color += calculateFinalColor(pbrInfo, lighting.ambientColor * pbr_ambientVisibility);

      for(int i = 0; i < lighting.directionalLightCount; i++) {
        if (i < lighting.directionalLightCount) {
          PBRInfo_setDirectionalLight(pbrInfo, -lighting_getDirectionalLight(i).direction);
          color += calculateFinalColor(pbrInfo, lighting_getDirectionalLight(i).color * (i == 0 ? clamp(directionalVisibility, 0.0, 1.0) : 1.0));
        }
      }

      for(int i = 0; i < lighting.pointLightCount; i++) {
        if (i < lighting.pointLightCount) {
          PBRInfo_setPointLight(pbrInfo, lighting_getPointLight(i));
          float attenuation = getPointLightAttenuation(lighting_getPointLight(i), distance(lighting_getPointLight(i).position, pbr_vPosition));
          color += calculateFinalColor(pbrInfo, lighting_getPointLight(i).color * (i < 4 ? clamp(pointVisibility[min(i, 3)], 0.0, 1.0) : 1.0) / attenuation);
        }
      }

      for(int i = 0; i < lighting.spotLightCount; i++) {
        if (i < lighting.spotLightCount) {
          PBRInfo_setSpotLight(pbrInfo, lighting_getSpotLight(i));
          float attenuation = getSpotLightAttenuation(lighting_getSpotLight(i), pbr_vPosition);
          color += calculateFinalColor(pbrInfo, lighting_getSpotLight(i).color * (i < 4 ? clamp(spotVisibility[min(i, 3)], 0.0, 1.0) : 1.0) / attenuation);
        }
      }
      for (int areaIndex = 0; areaIndex < areaLighting_getLightCount(); areaIndex++) {
#ifdef USE_AREA_LIGHT_LTC
        color += areaLTC_evaluate(areaIndex, pbr_vPosition, pbrInfo.n, pbrInfo.v, pbrInfo.perceptualRoughness, pbrInfo.diffuseColor, pbrInfo.reflectance0, pbrInfo.reflectance90);
#else
        for (int sampleIndex = 0; sampleIndex < areaLighting.sampleCount; sampleIndex++) {
          PointLight sampleLight = areaLighting_getSample(areaIndex, sampleIndex, pbr_vPosition);
          if (dot(sampleLight.color, sampleLight.color) > 0.0) {
            PBRInfo_setPointLight(pbrInfo, sampleLight);
            color += calculateFinalColor(pbrInfo, sampleLight.color);
          }
        }
#endif
      }
#endif

vec3 indirectBaseColor = color;
#ifdef USE_IBL
      if (pbrMaterial.IBLenabled) {
        color += getIBLContribution(pbrInfo, n, reflection);
      }
#endif

      // The pinned KHR_lightmap draft explicitly defines c_diff = (1 - metallic) * baseColor.
      color += baseColor.rgb * (1.0 - metallic) * lightmapIrradiance / M_PI;
      color = indirectBaseColor + (color - indirectBaseColor) * pbr_ambientVisibility;

#ifdef HAS_OCCLUSIONMAP
      if (pbrMaterial.occlusionMapEnabled) {
        float ao = texture(pbr_occlusionSampler, occlusionUV).r;
        color = mix(color, color * ao, pbrMaterial.occlusionStrength);
      }
#endif

      vec3 emissive = pbrMaterial.emissiveFactor;
#ifdef HAS_EMISSIVEMAP
      if (pbrMaterial.emissiveMapEnabled) {
        emissive *= SRGBtoLINEAR(texture(pbr_emissiveSampler, emissiveUV)).rgb;
      }
#endif
      color += emissive * pbrMaterial.emissiveStrength;

#ifdef PBR_DEBUG
      color = mix(color, baseColor.rgb, pbrMaterial.scaleDiffBaseMR.y);
      color = mix(color, vec3(metallic), pbrMaterial.scaleDiffBaseMR.z);
      color = mix(color, vec3(perceptualRoughness), pbrMaterial.scaleDiffBaseMR.w);
#endif

      return vec4(applySceneColorManagement(color), baseColor.a);
    }

    float specularIntensity = pbrMaterial.specularIntensityFactor;
#ifdef HAS_SPECULARINTENSITYMAP
    if (pbrMaterial.specularIntensityMapEnabled) {
      specularIntensity *= texture(pbr_specularIntensitySampler, specularIntensityUV).a;
    }
#endif

    vec3 specularFactor = pbrMaterial.specularColorFactor;
#ifdef HAS_SPECULARCOLORMAP
    if (pbrMaterial.specularColorMapEnabled) {
      specularFactor *= SRGBtoLINEAR(texture(pbr_specularColorSampler, specularColorUV)).rgb;
    }
#endif

    transmission = pbrMaterial.transmissionFactor;
#ifdef HAS_TRANSMISSIONMAP
    if (pbrMaterial.transmissionMapEnabled) {
      transmission *= texture(pbr_transmissionSampler, transmissionUV).r;
    }
#endif
    transmission = clamp(transmission * (1.0 - metallic), 0.0, 1.0);
    float thickness = max(pbrMaterial.thicknessFactor, 0.0);
#ifdef HAS_THICKNESSMAP
    thickness *= texture(pbr_thicknessSampler, thicknessUV).g;
#endif

    float diffuseTransmission = clamp(pbrMaterial.diffuseTransmissionFactor, 0.0, 1.0);
#ifdef HAS_DIFFUSETRANSMISSIONMAP
    if (pbrMaterial.diffuseTransmissionMapEnabled) {
      diffuseTransmission *= texture(pbr_diffuseTransmissionSampler, diffuseTransmissionUV).a;
    }
#endif
    diffuseTransmission *= (1.0 - metallic) * (1.0 - transmission);
    vec3 diffuseTransmissionColor = pbrMaterial.diffuseTransmissionColorFactor;
#ifdef HAS_DIFFUSETRANSMISSIONCOLORMAP
    if (pbrMaterial.diffuseTransmissionColorMapEnabled) {
      diffuseTransmissionColor *= SRGBtoLINEAR(
        texture(pbr_diffuseTransmissionColorSampler, diffuseTransmissionColorUV)
      ).rgb;
    }
#endif
    vec3 multiscatterColor = pbrMaterial.multiscatterColorFactor;
#ifdef HAS_MULTISCATTERCOLORMAP
    if (pbrMaterial.multiscatterColorMapEnabled) {
      multiscatterColor *= SRGBtoLINEAR(
        texture(pbr_multiscatterColorSampler, multiscatterColorUV)
      ).rgb;
    }
#endif

    float originalTransmission = transmission;
    float scatterReflection = 0.0;
#ifdef HAS_MATERIAL_SCATTER
    if (thickness <= 0.0) {
      float strength = clamp(pbrMaterial.scatterStrengthFactor, 0.0, 1.0);
#ifdef HAS_DIFFUSETRANSMISSIONMAP
      if (pbrMaterial.diffuseTransmissionMapEnabled) {
        strength *= texture(pbr_diffuseTransmissionSampler, diffuseTransmissionUV).a;
      }
#endif
      float anisotropy = pbrMaterial.scatterAnisotropy;
      scatterReflection = originalTransmission * strength * (1.0 - anisotropy) * 0.5;
      diffuseTransmission = originalTransmission * strength * (1.0 + anisotropy) * 0.5;
      diffuseTransmissionColor = multiscatterColor;
      transmission *= 1.0 - strength;
    }
#endif

    float clearcoatFactor = pbrMaterial.clearcoatFactor;
    float clearcoatRoughness = pbrMaterial.clearcoatRoughnessFactor;
#ifdef HAS_CLEARCOATMAP
    if (pbrMaterial.clearcoatMapEnabled) {
      clearcoatFactor *= texture(pbr_clearcoatSampler, clearcoatUV).r;
    }
#endif
#ifdef HAS_CLEARCOATROUGHNESSMAP
    if (pbrMaterial.clearcoatRoughnessMapEnabled) {
      clearcoatRoughness *= texture(pbr_clearcoatRoughnessSampler, clearcoatRoughnessUV).g;
    }
#endif
    clearcoatFactor = clamp(clearcoatFactor, 0.0, 1.0);
    clearcoatRoughness = clamp(clearcoatRoughness, c_MinRoughness, 1.0);
    vec3 clearcoatNormal = getClearcoatNormal(getTBN(clearcoatNormalUV), n, clearcoatNormalUV);
    clearcoatRoughness = widenSpecularRoughness(clearcoatRoughness, clearcoatNormal);

    vec3 sheenColor = pbrMaterial.sheenColorFactor;
    float sheenRoughness = pbrMaterial.sheenRoughnessFactor;
#ifdef HAS_SHEENCOLORMAP
    if (pbrMaterial.sheenColorMapEnabled) {
      sheenColor *= SRGBtoLINEAR(texture(pbr_sheenColorSampler, sheenColorUV)).rgb;
    }
#endif
#ifdef HAS_SHEENROUGHNESSMAP
    if (pbrMaterial.sheenRoughnessMapEnabled) {
      sheenRoughness *= texture(pbr_sheenRoughnessSampler, sheenRoughnessUV).a;
    }
#endif
    sheenRoughness = clamp(sheenRoughness, c_MinRoughness, 1.0);

    float iridescence = pbrMaterial.iridescenceFactor;
#ifdef HAS_IRIDESCENCEMAP
    if (pbrMaterial.iridescenceMapEnabled) {
      iridescence *= texture(pbr_iridescenceSampler, iridescenceUV).r;
    }
#endif
    iridescence = clamp(iridescence, 0.0, 1.0);
    float iridescenceThickness = mix(
      pbrMaterial.iridescenceThicknessRange.x,
      pbrMaterial.iridescenceThicknessRange.y,
      0.5
    );
#ifdef HAS_IRIDESCENCETHICKNESSMAP
    iridescenceThickness = mix(
      pbrMaterial.iridescenceThicknessRange.x,
      pbrMaterial.iridescenceThicknessRange.y,
      texture(pbr_iridescenceThicknessSampler, iridescenceThicknessUV).g
    );
#endif

    float anisotropyStrength = clamp(pbrMaterial.anisotropyStrength, 0.0, 1.0);
    vec2 anisotropyDirection = normalizeDirection(pbrMaterial.anisotropyDirection);
#ifdef HAS_ANISOTROPYMAP
    if (pbrMaterial.anisotropyMapEnabled) {
      vec3 anisotropySample = texture(pbr_anisotropySampler, anisotropyUV).rgb;
      anisotropyStrength *= anisotropySample.b;
      vec2 mappedDirection = anisotropySample.rg * 2.0 - 1.0;
      if (length(mappedDirection) > 0.0001) {
        anisotropyDirection = normalize(mappedDirection);
      }
    }
#endif
    anisotropyDirection = rotateDirection(anisotropyDirection, pbrMaterial.anisotropyRotation);
    vec3 anisotropyTangent = normalize(tbn[0] * anisotropyDirection.x + tbn[1] * anisotropyDirection.y);
    if (length(anisotropyTangent) < 0.0001) {
      anisotropyTangent = normalize(tbn[0]);
    }
    // Roughness is authored as perceptual roughness; as is convention,
    // convert to material roughness by squaring the perceptual roughness [2].
    float alphaRoughness = perceptualRoughness * perceptualRoughness;

    float dielectricF0 = getDielectricF0(pbrMaterial.ior);
    vec3 dielectricSpecularF0 = min(
      vec3(dielectricF0) * specularFactor * specularIntensity,
      vec3(1.0)
    );
    dielectricSpecularF0 = getIridescenceTint(
      iridescence,
      iridescenceThickness,
      NdotV,
      dielectricSpecularF0
    );
    vec3 diffuseColor = baseColor.rgb * (vec3(1.0) - dielectricSpecularF0);
    diffuseColor *= (1.0 - metallic) * (1.0 - transmission) * (1.0 - diffuseTransmission);
#ifdef HAS_MATERIAL_SCATTER
    diffuseColor = (baseColor.rgb * (1.0 - metallic) * (1.0 - originalTransmission) +
      multiscatterColor * scatterReflection) * (vec3(1.0) - dielectricSpecularF0);
#endif
    vec3 specularColor = mix(dielectricSpecularF0, baseColor.rgb, metallic);

    float clearcoatViewFresnel = dielectricSchlick(
      0.04,
      clamp(abs(dot(clearcoatNormal, v)), 0.0, 1.0)
    );
    float sheenDirectionalAlbedo = maxComponent(sheenColor) *
      (0.157 + 0.343 * (1.0 - NdotV)) * (1.0 - sheenRoughness * 0.5);
    float baseLayerEnergy = (1.0 - clearcoatFactor * clearcoatViewFresnel) *
      (1.0 - clamp(sheenDirectionalAlbedo, 0.0, 1.0));
    diffuseColor *= baseLayerEnergy;
    specularColor *= baseLayerEnergy;

    // Compute reflectance.
    float reflectance = max(max(specularColor.r, specularColor.g), specularColor.b);

    // For typical incident reflectance range (between 4% to 100%) set the grazing
    // reflectance to 100% for typical fresnel effect.
    // For very low reflectance range on highly diffuse objects (below 4%),
    // incrementally reduce grazing reflecance to 0%.
    float reflectance90 = clamp(reflectance * 25.0, 0.0, 1.0);
    vec3 specularEnvironmentR0 = specularColor.rgb;
    vec3 specularEnvironmentR90 = vec3(1.0, 1.0, 1.0) * reflectance90;
    vec3 reflection = -normalize(reflect(v, n));

    PBRInfo pbrInfo = PBRInfo(
      0.0, // NdotL
      NdotV,
      0.0, // NdotH
      0.0, // LdotH
      0.0, // VdotH
      perceptualRoughness,
      metallic,
      specularEnvironmentR0,
      specularEnvironmentR90,
      alphaRoughness,
      diffuseColor,
      specularColor,
      n,
      v,
      n,
      n
    );


#ifdef USE_LIGHTS
    // Apply ambient light
    PBRInfo_setAmbientLight(pbrInfo);
    color += calculateMaterialLightColor(
      pbrInfo,
      lighting.ambientColor * pbr_ambientVisibility,
      clearcoatNormal,
      clearcoatFactor,
      clearcoatRoughness,
      sheenColor,
      sheenRoughness,
      anisotropyTangent,
      anisotropyStrength
    );

    // Apply directional light
    for(int i = 0; i < lighting.directionalLightCount; i++) {
      if (i < lighting.directionalLightCount) {
        PBRInfo_setDirectionalLight(pbrInfo, -lighting_getDirectionalLight(i).direction);
        color += calculateMaterialLightColor(
          pbrInfo,
          lighting_getDirectionalLight(i).color * (i == 0 ? clamp(directionalVisibility, 0.0, 1.0) : 1.0),
          clearcoatNormal,
          clearcoatFactor,
          clearcoatRoughness,
          sheenColor,
          sheenRoughness,
          anisotropyTangent,
          anisotropyStrength
        );
        color += calculateDiffuseTransmissionLight(
          pbrInfo,
          lighting_getDirectionalLight(i).color * (i == 0 ? clamp(directionalVisibility, 0.0, 1.0) : 1.0),
          diffuseTransmissionColor,
          diffuseTransmission,
          multiscatterColor,
          thickness
        );
      }
    }

    // Apply point light
    for(int i = 0; i < lighting.pointLightCount; i++) {
      if (i < lighting.pointLightCount) {
        PBRInfo_setPointLight(pbrInfo, lighting_getPointLight(i));
        float attenuation = getPointLightAttenuation(lighting_getPointLight(i), distance(lighting_getPointLight(i).position, pbr_vPosition));
        color += calculateMaterialLightColor(
          pbrInfo,
          lighting_getPointLight(i).color * (i < 4 ? clamp(pointVisibility[min(i, 3)], 0.0, 1.0) : 1.0) / attenuation,
          clearcoatNormal,
          clearcoatFactor,
          clearcoatRoughness,
          sheenColor,
          sheenRoughness,
          anisotropyTangent,
          anisotropyStrength
        );
        color += calculateDiffuseTransmissionLight(
          pbrInfo,
          lighting_getPointLight(i).color * (i < 4 ? clamp(pointVisibility[min(i, 3)], 0.0, 1.0) : 1.0) / attenuation,
          diffuseTransmissionColor,
          diffuseTransmission,
          multiscatterColor,
          thickness
        );
      }
    }

    for(int i = 0; i < lighting.spotLightCount; i++) {
      if (i < lighting.spotLightCount) {
        PBRInfo_setSpotLight(pbrInfo, lighting_getSpotLight(i));
        float attenuation = getSpotLightAttenuation(lighting_getSpotLight(i), pbr_vPosition);
        color += calculateMaterialLightColor(
          pbrInfo,
          lighting_getSpotLight(i).color * (i < 4 ? clamp(spotVisibility[min(i, 3)], 0.0, 1.0) : 1.0) / attenuation,
          clearcoatNormal,
          clearcoatFactor,
          clearcoatRoughness,
          sheenColor,
          sheenRoughness,
          anisotropyTangent,
          anisotropyStrength
        );
        color += calculateDiffuseTransmissionLight(
          pbrInfo,
          lighting_getSpotLight(i).color * (i < 4 ? clamp(spotVisibility[min(i, 3)], 0.0, 1.0) : 1.0) / attenuation,
          diffuseTransmissionColor,
          diffuseTransmission,
          multiscatterColor,
          thickness
        );
      }
    }
      for (int areaIndex = 0; areaIndex < areaLighting_getLightCount(); areaIndex++) {
#ifdef USE_AREA_LIGHT_LTC
        // Unsupported fits retain numerical integration rather than silently dropping material lobes.
        if (anisotropyStrength <= 0.0001 && dot(sheenColor, sheenColor) <= 0.000001 && diffuseTransmission <= 0.0001) {
        color += areaLTC_evaluate(areaIndex, pbr_vPosition, pbrInfo.n, pbrInfo.v, pbrInfo.perceptualRoughness, pbrInfo.diffuseColor, pbrInfo.reflectance0, pbrInfo.reflectance90);
        color += clearcoatFactor * areaLTC_specular(areaLighting_getLight(areaIndex), pbr_vPosition, clearcoatNormal, pbrInfo.v, clearcoatRoughness, vec3(0.04), vec3(1.0));
        } else {
        for (int sampleIndex = 0; sampleIndex < areaLighting.sampleCount; sampleIndex++) {
          PointLight sampleLight = areaLighting_getSample(areaIndex, sampleIndex, pbr_vPosition);
          if (dot(sampleLight.color, sampleLight.color) > 0.0) {
            PBRInfo_setPointLight(pbrInfo, sampleLight);
            color += calculateMaterialLightColor(pbrInfo, sampleLight.color, clearcoatNormal,
              clearcoatFactor, clearcoatRoughness, sheenColor, sheenRoughness, anisotropyTangent, anisotropyStrength);
            color += calculateDiffuseTransmissionLight(pbrInfo, sampleLight.color,
              diffuseTransmissionColor, diffuseTransmission, multiscatterColor, thickness);
          }
        }

        }
#else
        for (int sampleIndex = 0; sampleIndex < areaLighting.sampleCount; sampleIndex++) {
          PointLight sampleLight = areaLighting_getSample(areaIndex, sampleIndex, pbr_vPosition);
          if (dot(sampleLight.color, sampleLight.color) > 0.0) {
            PBRInfo_setPointLight(pbrInfo, sampleLight);
            color += calculateMaterialLightColor(pbrInfo, sampleLight.color, clearcoatNormal,
              clearcoatFactor, clearcoatRoughness, sheenColor, sheenRoughness, anisotropyTangent, anisotropyStrength);
            color += calculateDiffuseTransmissionLight(pbrInfo, sampleLight.color,
              diffuseTransmissionColor, diffuseTransmission, multiscatterColor, thickness);
          }
        }

#endif
      }
#endif

    vec3 indirectBaseColor = color;
    // Calculate lighting contribution from image based lighting source (IBL)
#ifdef USE_IBL
    if (pbrMaterial.IBLenabled) {
      color += getIBLContribution(
        pbrInfo,
        n,
        getAnisotropicReflection(pbrInfo, anisotropyTangent, anisotropyStrength)
      );
      color += calculateClearcoatIBLContribution(
        pbrInfo,
        clearcoatNormal,
        -normalize(reflect(v, clearcoatNormal)),
        clearcoatFactor,
        clearcoatRoughness
      );
      color += calculateDiffuseTransmissionIBL(
        pbrInfo,
        diffuseTransmissionColor,
        diffuseTransmission,
        multiscatterColor,
        thickness
      );
      color += sheenColor * pbrMaterial.scaleIBLAmbient.x * (1.0 - sheenRoughness) * 0.25;
    }
#endif

#ifdef HAS_MATERIAL_SCATTER
    color += (baseColor.rgb * (1.0 - metallic) * (1.0 - originalTransmission) +
      multiscatterColor * scatterReflection) * baseLayerEnergy * lightmapIrradiance / M_PI;
#else
    color += baseColor.rgb * (1.0 - metallic) * (1.0 - transmission) *
      (1.0 - diffuseTransmission) * baseLayerEnergy * lightmapIrradiance / M_PI;
#endif

    color = indirectBaseColor + (color - indirectBaseColor) * pbr_ambientVisibility;

 // Apply optional PBR terms for additional (optional) shading
#ifdef HAS_OCCLUSIONMAP
    if (pbrMaterial.occlusionMapEnabled) {
      float ao = texture(pbr_occlusionSampler, occlusionUV).r;
      color = mix(color, color * ao, pbrMaterial.occlusionStrength);
    }
#endif

    vec3 emissive = pbrMaterial.emissiveFactor;
#ifdef HAS_EMISSIVEMAP
    if (pbrMaterial.emissiveMapEnabled) {
      emissive *= SRGBtoLINEAR(texture(pbr_emissiveSampler, emissiveUV)).rgb;
    }
#endif
    color += emissive * pbrMaterial.emissiveStrength;

    if (transmission > 0.0) {
#ifdef USE_TRANSMISSION_FRAMEBUFFER
      float dielectricFresnel = getDielectricF0(pbrMaterial.ior);
      float transmissionFresnel = dielectricFresnel +
        (1.0 - dielectricFresnel) * pow(1.0 - NdotV, 5.0);
      vec3 transmittedColor = getTransmittedSceneColor(
        pbr_vPosition,
        n,
        v,
        thickness,
        perceptualRoughness
      );
      color += transmittedColor * getVolumeAttenuation(thickness) *
        transmission * (1.0 - transmissionFresnel);
#else
      color = mix(color, color * getVolumeAttenuation(thickness), transmission);
#endif
    }

    // This section uses mix to override final color for reference app visualization
    // of various parameters in the lighting equation.
#ifdef PBR_DEBUG
    // TODO: Figure out how to debug multiple lights

    // color = mix(color, F, pbr_scaleFGDSpec.x);
    // color = mix(color, vec3(G), pbr_scaleFGDSpec.y);
    // color = mix(color, vec3(D), pbr_scaleFGDSpec.z);
    // color = mix(color, specContrib, pbr_scaleFGDSpec.w);

    // color = mix(color, diffuseContrib, pbr_scaleDiffBaseMR.x);
    color = mix(color, baseColor.rgb, pbrMaterial.scaleDiffBaseMR.y);
    color = mix(color, vec3(metallic), pbrMaterial.scaleDiffBaseMR.z);
    color = mix(color, vec3(perceptualRoughness), pbrMaterial.scaleDiffBaseMR.w);
#endif

  }

#ifdef USE_TRANSMISSION_FRAMEBUFFER
  float alpha = clamp(baseColor.a, 0.0, 1.0);
#else
  float alpha = clamp(baseColor.a * (1.0 - transmission), 0.0, 1.0);
#endif
  return vec4(applySceneColorManagement(color), alpha);
}

// Depth-only passes use the same base-color alpha, vertex color and UV transform.
void pbr_discardMaskedFragment(vec4 vertexColor) {
#ifdef ALPHA_CUTOFF
  float alpha = pbrMaterial.baseColorFactor.a * vertexColor.a;
#ifdef HAS_BASECOLORMAP
  alpha *= texture(pbr_baseColorSampler, getMaterialUV(pbrMaterial.baseColorUVSet, pbrMaterial.baseColorUVTransform)).a;
#endif
  if (alpha < pbrMaterial.alphaCutoff) {discard;}
#endif
}

vec4 pbr_filterColorWithSpotShadows(vec4 vertexColor, vec4 spotVisibility) {
  return pbr_filterColorWithShadows(vertexColor, 1.0, vec4(1.0), spotVisibility);
}

vec4 pbr_filterColor(vec4 vertexColor) {
  return pbr_filterColorWithSpotShadows(vertexColor, vec4(1.0));
}
`,m=`\
#ifdef DOUBLE_SIDED
var<private> pbr_frontFacing: bool = true;
#endif
struct PBRFragmentInputs {
  pbr_vPosition: vec3f,
  pbr_vUV0: vec2f,
  pbr_vUV1: vec2f,
  pbr_vTBN: mat3x3f,
  pbr_vNormal: vec3f
};

var<private> fragmentInputs: PBRFragmentInputs;

fn pbr_setPositionNormalTangentUV(
  position: vec4f,
  normal: vec4f,
  tangent: vec4f,
  uv0: vec2f,
  uv1: vec2f
)
{
  var pos: vec4f = pbrProjection.modelMatrix * position;
  fragmentInputs.pbr_vPosition = pos.xyz / pos.w;
  fragmentInputs.pbr_vNormal = vec3f(0.0, 0.0, 1.0);
  fragmentInputs.pbr_vTBN = mat3x3f(
    vec3f(1.0, 0.0, 0.0),
    vec3f(0.0, 1.0, 0.0),
    vec3f(0.0, 0.0, 1.0)
  );
  fragmentInputs.pbr_vUV0 = vec2f(0.0, 0.0);
  fragmentInputs.pbr_vUV1 = uv1;

#ifdef HAS_NORMALS
  let normalW: vec3f = normalize((pbrProjection.normalMatrix * vec4f(normal.xyz, 0.0)).xyz);
  fragmentInputs.pbr_vNormal = normalW;
#ifdef HAS_TANGENTS
  let tangentW: vec3f = normalize((pbrProjection.modelMatrix * vec4f(tangent.xyz, 0.0)).xyz);
  let bitangentW: vec3f = cross(normalW, tangentW) * tangent.w;
  fragmentInputs.pbr_vTBN = mat3x3f(tangentW, bitangentW, normalW);
#endif
#endif

#ifdef HAS_UV
  fragmentInputs.pbr_vUV0 = uv0;
#endif
}

struct pbrMaterialUniforms {
  // Material is unlit
  unlit: u32,

  // Base color map
  baseColorMapEnabled: u32,
  baseColorFactor: vec4f,

  normalMapEnabled : u32,
  normalScale: f32,  // #ifdef HAS_NORMALMAP

  emissiveMapEnabled: u32,
  emissiveFactor: vec3f, // #ifdef HAS_EMISSIVEMAP

  metallicRoughnessValues: vec2f,
  metallicRoughnessMapEnabled: u32,

  occlusionMapEnabled: i32,
  occlusionStrength: f32, // #ifdef HAS_OCCLUSIONMAP
  
  alphaCutoffEnabled: i32,
  alphaCutoff: f32, // #ifdef ALPHA_CUTOFF

  specularColorFactor: vec3f,
  specularIntensityFactor: f32,
  specularColorMapEnabled: i32,
  specularIntensityMapEnabled: i32,

  ior: f32,

  transmissionFactor: f32,
  transmissionMapEnabled: i32,

  thicknessFactor: f32,
  attenuationDistance: f32,
  attenuationColor: vec3f,

  clearcoatFactor: f32,
  clearcoatRoughnessFactor: f32,
  clearcoatMapEnabled: i32,
  clearcoatRoughnessMapEnabled: i32,

  sheenColorFactor: vec3f,
  sheenRoughnessFactor: f32,
  sheenColorMapEnabled: i32,
  sheenRoughnessMapEnabled: i32,

  iridescenceFactor: f32,
  iridescenceIor: f32,
  iridescenceThicknessRange: vec2f,
  iridescenceMapEnabled: i32,

  anisotropyStrength: f32,
  anisotropyRotation: f32,
  anisotropyDirection: vec2f,
  anisotropyMapEnabled: i32,

  emissiveStrength: f32,
  dispersion: f32,
  
  // IBL
  IBLenabled: i32,
  scaleIBLAmbient: vec2f, // #ifdef USE_IBL
  
  // debugging flags used for shader output of intermediate PBR variables
  // #ifdef PBR_DEBUG
  scaleDiffBaseMR: vec4f,
  scaleFGDSpec: vec4f,
  // #endif

  baseColorUVSet: i32,
  baseColorUVTransform: mat3x3f,
  metallicRoughnessUVSet: i32,
  metallicRoughnessUVTransform: mat3x3f,
  normalUVSet: i32,
  normalUVTransform: mat3x3f,
  occlusionUVSet: i32,
  occlusionUVTransform: mat3x3f,
  emissiveUVSet: i32,
  emissiveUVTransform: mat3x3f,
  specularColorUVSet: i32,
  specularColorUVTransform: mat3x3f,
  specularIntensityUVSet: i32,
  specularIntensityUVTransform: mat3x3f,
  transmissionUVSet: i32,
  transmissionUVTransform: mat3x3f,
  thicknessUVSet: i32,
  thicknessUVTransform: mat3x3f,
  clearcoatUVSet: i32,
  clearcoatUVTransform: mat3x3f,
  clearcoatRoughnessUVSet: i32,
  clearcoatRoughnessUVTransform: mat3x3f,
  clearcoatNormalUVSet: i32,
  clearcoatNormalUVTransform: mat3x3f,
  sheenColorUVSet: i32,
  sheenColorUVTransform: mat3x3f,
  sheenRoughnessUVSet: i32,
  sheenRoughnessUVTransform: mat3x3f,
  iridescenceUVSet: i32,
  iridescenceUVTransform: mat3x3f,
  iridescenceThicknessUVSet: i32,
  iridescenceThicknessUVTransform: mat3x3f,
  anisotropyUVSet: i32,
  anisotropyUVTransform: mat3x3f,

  bumpFactor: f32,
  bumpMapEnabled: i32,
  diffuseTransmissionFactor: f32,
  diffuseTransmissionMapEnabled: i32,
  diffuseTransmissionColorFactor: vec3f,
  diffuseTransmissionColorMapEnabled: i32,
  multiscatterColorFactor: vec3f,
  multiscatterColorMapEnabled: i32,
  scatterAnisotropy: f32,

  bumpUVSet: i32,
  bumpUVTransform: mat3x3f,
  diffuseTransmissionUVSet: i32,
  diffuseTransmissionUVTransform: mat3x3f,
  diffuseTransmissionColorUVSet: i32,
  diffuseTransmissionColorUVTransform: mat3x3f,
  multiscatterColorUVSet: i32,
  multiscatterColorUVTransform: mat3x3f,
  lightmapMapEnabled: u32,
  lightmapIntensity: f32,
  lightmapUVSet: i32,
  lightmapUVTransform: mat3x3f,
  scatterStrengthFactor: f32,
}

@group(3) @binding(auto) var<uniform> pbrMaterial : pbrMaterialUniforms;

// Samplers
#ifdef HAS_BASECOLORMAP
@group(3) @binding(auto) var pbr_baseColorSampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_baseColorSamplerSampler: sampler;
#endif
#ifdef HAS_NORMALMAP
@group(3) @binding(auto) var pbr_normalSampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_normalSamplerSampler: sampler;
#endif
#ifdef HAS_EMISSIVEMAP
@group(3) @binding(auto) var pbr_emissiveSampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_emissiveSamplerSampler: sampler;
#endif
#ifdef HAS_LIGHTMAP
@group(3) @binding(auto) var pbr_lightmapSampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_lightmapSamplerSampler: sampler;
#endif
#ifdef HAS_METALROUGHNESSMAP
@group(3) @binding(auto) var pbr_metallicRoughnessSampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_metallicRoughnessSamplerSampler: sampler;
#endif
#ifdef HAS_OCCLUSIONMAP
@group(3) @binding(auto) var pbr_occlusionSampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_occlusionSamplerSampler: sampler;
#endif
#ifdef HAS_SPECULARCOLORMAP
@group(3) @binding(auto) var pbr_specularColorSampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_specularColorSamplerSampler: sampler;
#endif
#ifdef HAS_SPECULARINTENSITYMAP
@group(3) @binding(auto) var pbr_specularIntensitySampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_specularIntensitySamplerSampler: sampler;
#endif
#ifdef HAS_TRANSMISSIONMAP
@group(3) @binding(auto) var pbr_transmissionSampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_transmissionSamplerSampler: sampler;
#endif
#ifdef HAS_THICKNESSMAP
@group(3) @binding(auto) var pbr_thicknessSampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_thicknessSamplerSampler: sampler;
#endif
#ifdef HAS_CLEARCOATMAP
@group(3) @binding(auto) var pbr_clearcoatSampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_clearcoatSamplerSampler: sampler;
#endif
#ifdef HAS_CLEARCOATROUGHNESSMAP
@group(3) @binding(auto) var pbr_clearcoatRoughnessSampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_clearcoatRoughnessSamplerSampler: sampler;
#endif
#ifdef HAS_CLEARCOATNORMALMAP
@group(3) @binding(auto) var pbr_clearcoatNormalSampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_clearcoatNormalSamplerSampler: sampler;
#endif
#ifdef HAS_SHEENCOLORMAP
@group(3) @binding(auto) var pbr_sheenColorSampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_sheenColorSamplerSampler: sampler;
#endif
#ifdef HAS_SHEENROUGHNESSMAP
@group(3) @binding(auto) var pbr_sheenRoughnessSampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_sheenRoughnessSamplerSampler: sampler;
#endif
#ifdef HAS_IRIDESCENCEMAP
@group(3) @binding(auto) var pbr_iridescenceSampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_iridescenceSamplerSampler: sampler;
#endif
#ifdef HAS_IRIDESCENCETHICKNESSMAP
@group(3) @binding(auto) var pbr_iridescenceThicknessSampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_iridescenceThicknessSamplerSampler: sampler;
#endif
#ifdef HAS_ANISOTROPYMAP
@group(3) @binding(auto) var pbr_anisotropySampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_anisotropySamplerSampler: sampler;
#endif
#ifdef HAS_BUMPMAP
@group(3) @binding(auto) var pbr_bumpSampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_bumpSamplerSampler: sampler;
#endif
#ifdef HAS_DIFFUSETRANSMISSIONMAP
@group(3) @binding(auto) var pbr_diffuseTransmissionSampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_diffuseTransmissionSamplerSampler: sampler;
#endif
#ifdef HAS_DIFFUSETRANSMISSIONCOLORMAP
@group(3) @binding(auto) var pbr_diffuseTransmissionColorSampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_diffuseTransmissionColorSamplerSampler: sampler;
#endif
#ifdef HAS_MULTISCATTERCOLORMAP
@group(3) @binding(auto) var pbr_multiscatterColorSampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_multiscatterColorSamplerSampler: sampler;
#endif
// Encapsulate the various inputs used by the various functions in the shading equation
// We store values in this struct to simplify the integration of alternative implementations
// of the shading terms, outlined in the Readme.MD Appendix.
struct PBRInfo {
  NdotL: f32,                  // cos angle between normal and light direction
  NdotV: f32,                  // cos angle between normal and view direction
  NdotH: f32,                  // cos angle between normal and half vector
  LdotH: f32,                  // cos angle between light direction and half vector
  VdotH: f32,                  // cos angle between view direction and half vector
  perceptualRoughness: f32,    // roughness value, as authored by the model creator (input to shader)
  metalness: f32,              // metallic value at the surface
  reflectance0: vec3f,            // full reflectance color (normal incidence angle)
  reflectance90: vec3f,           // reflectance color at grazing angle
  alphaRoughness: f32,         // roughness mapped to a more linear change in the roughness (proposed by [2])
  diffuseColor: vec3f,            // color contribution from diffuse lighting
  specularColor: vec3f,           // color contribution from specular lighting
  n: vec3f,                       // normal at surface point
  v: vec3f,                       // vector from surface point to camera
  l: vec3f,                       // direction from the surface toward the current light
  h: vec3f                        // half vector between the current light and camera
};

const M_PI = 3.141592653589793;
const c_MinRoughness = 0.04;

// Widen sub-pixel specular lobes using the screen-space normal footprint.
// This is geometric specular antialiasing: the normal variance is converted
// into an additional squared perceptual roughness before evaluating BRDFs.
fn widenSpecularRoughness(perceptualRoughness: f32, normal: vec3f) -> f32 {
  let normalDerivativeX = dpdx(normal);
  let normalDerivativeY = dpdy(normal);
  let normalVariance =
    dot(normalDerivativeX, normalDerivativeX) +
    dot(normalDerivativeY, normalDerivativeY);
  let kernelRoughnessSquared = min(2.0 * normalVariance, 1.0);
  return clamp(
    sqrt(perceptualRoughness * perceptualRoughness + kernelRoughnessSquared),
    c_MinRoughness,
    1.0
  );
}

fn SRGBtoLINEAR(srgbIn: vec4f ) -> vec4f
{
  var linOut: vec3f = srgbIn.xyz;
#ifdef MANUAL_SRGB
  let bLess: vec3f = step(vec3f(0.04045), srgbIn.xyz);
  linOut = mix(
    srgbIn.xyz / vec3f(12.92),
    pow((srgbIn.xyz + vec3f(0.055)) / vec3f(1.055), vec3f(2.4)),
    bLess
  );
#ifdef SRGB_FAST_APPROXIMATION
  linOut = pow(srgbIn.xyz, vec3f(2.2));
#endif
#endif
  return vec4f(linOut, srgbIn.w);
}

fn getMaterialUV(uvSet: i32, uvTransform: mat3x3f) -> vec2f
{
  var baseUV = fragmentInputs.pbr_vUV0;
  if (uvSet == 1) {
    baseUV = fragmentInputs.pbr_vUV1;
  }
  return (uvTransform * vec3f(baseUV, 1.0)).xy;
}

// Build the tangent basis from interpolated attributes or screen-space derivatives.
fn getTBN(uv: vec2f) -> mat3x3f
{
  let pos_dx: vec3f = dpdx(fragmentInputs.pbr_vPosition);
  let pos_dy: vec3f = dpdy(fragmentInputs.pbr_vPosition);
  let tex_dx: vec3f = dpdx(vec3f(uv, 0.0));
  let tex_dy: vec3f = dpdy(vec3f(uv, 0.0));
  var t: vec3f = (tex_dy.y * pos_dx - tex_dx.y * pos_dy) / (tex_dx.x * tex_dy.y - tex_dy.x * tex_dx.y);

  var ng: vec3f = cross(pos_dy, pos_dx);
#ifdef HAS_NORMALS
  ng = normalize(fragmentInputs.pbr_vNormal);
#endif
  t = normalize(t - ng * dot(ng, t));
  var b: vec3f = normalize(cross(ng, t));
  var tbn: mat3x3f = mat3x3f(t, b, ng);
#ifdef HAS_TANGENTS
  tbn = fragmentInputs.pbr_vTBN;
#endif

#ifdef DOUBLE_SIDED
#ifdef HAS_NORMALS
  // Derivative normals already face the viewer; only flip an authored basis.
  if (!pbr_frontFacing) { tbn = mat3x3f(-tbn[0], -tbn[1], -tbn[2]); }
#endif
#endif
  return tbn;
}

// Find the normal for this fragment, pulling either from a predefined normal map
// or from the interpolated mesh normal and tangent attributes.
fn getMappedNormal(
  normalSampler: texture_2d<f32>,
  normalSamplerBinding: sampler,
  tbn: mat3x3f,
  normalScale: f32,
  uv: vec2f
) -> vec3f
{
  let n = textureSample(normalSampler, normalSamplerBinding, uv).rgb;
  return normalize(tbn * ((2.0 * n - 1.0) * vec3f(normalScale, normalScale, 1.0)));
}

fn getNormal(tbn: mat3x3f, uv: vec2f) -> vec3f
{
  // The tbn matrix is linearly interpolated, so we need to re-normalize
  var n: vec3f = normalize(tbn[2].xyz);
#ifdef HAS_NORMALMAP
  n = getMappedNormal(
    pbr_normalSampler,
    pbr_normalSamplerSampler,
    tbn,
    pbrMaterial.normalScale,
    uv
  );
#endif

#ifdef HAS_BUMPMAP
  let bumpUV = getMaterialUV(pbrMaterial.bumpUVSet, pbrMaterial.bumpUVTransform);
  let bumpTexelSize = 1.0 / vec2f(textureDimensions(pbr_bumpSampler, 0));
  let bumpHeight = textureSample(pbr_bumpSampler, pbr_bumpSamplerSampler, bumpUV).r;
  let bumpGradient = vec2f(
    textureSample(
      pbr_bumpSampler,
      pbr_bumpSamplerSampler,
      bumpUV + vec2f(bumpTexelSize.x, 0.0)
    ).r - bumpHeight,
    textureSample(
      pbr_bumpSampler,
      pbr_bumpSamplerSampler,
      bumpUV + vec2f(0.0, bumpTexelSize.y)
    ).r - bumpHeight
  );
  n = normalize(n - pbrMaterial.bumpFactor *
    (tbn[0] * bumpGradient.x + tbn[1] * bumpGradient.y));
#endif

  return n;
}

fn getClearcoatNormal(tbn: mat3x3f, baseNormal: vec3f, uv: vec2f) -> vec3f
{
#ifdef HAS_CLEARCOATNORMALMAP
  return getMappedNormal(
    pbr_clearcoatNormalSampler,
    pbr_clearcoatNormalSamplerSampler,
    tbn,
    1.0,
    uv
  );
#else
  return baseNormal;
#endif
}

// Calculation of the lighting contribution from an optional Image Based Light source.
// Precomputed Environment Maps are required uniform inputs and are computed as outlined in [1].
// See our README.md on Environment Maps [3] for additional discussion.
#ifdef USE_IBL
fn getIBLContribution(pbrInfo: PBRInfo, n: vec3f, reflection: vec3f) -> vec3f
{
#ifdef USE_SCENE_ENVIRONMENT
  let maximumMipLevel = max(pbrScene.environmentMipCount - 1.0, 0.0);
  let rotationSine = sin(pbrScene.environmentRotation);
  let rotationCosine = cos(pbrScene.environmentRotation);
  let environmentRotation = mat2x2f(
    vec2f(rotationCosine, rotationSine),
    vec2f(-rotationSine, rotationCosine)
  );
  let rotatedNormal = environmentRotation * n.xz;
  let rotatedReflection = environmentRotation * reflection.xz;
  let environmentNormal = vec3f(rotatedNormal.x, n.y, rotatedNormal.y);
  let environmentReflection = vec3f(rotatedReflection.x, reflection.y, rotatedReflection.y);
#else
  let maximumMipLevel = 9.0;
  let environmentNormal = n;
  let environmentReflection = reflection;
#endif
  let lod = pbrInfo.perceptualRoughness * maximumMipLevel;
  // retrieve a scale and bias to F0. See [1], Figure 3
  let brdfSample = textureSampleLevel(
    pbr_brdfLUT,
    pbr_brdfLUTSampler,
    vec2f(pbrInfo.NdotV, 1.0 - pbrInfo.perceptualRoughness),
    0.0
  );
  let diffuseSample = textureSampleLevel(
    pbr_diffuseEnvSampler,
    pbr_diffuseEnvSamplerSampler,
    environmentNormal,
    0.0
  );
  var specularSample = textureSampleLevel(
    pbr_specularEnvSampler,
    pbr_specularEnvSamplerSampler,
    environmentReflection,
    0.0
  );
#ifdef USE_TEX_LOD
  specularSample = textureSampleLevel(
    pbr_specularEnvSampler,
    pbr_specularEnvSamplerSampler,
    environmentReflection,
    lod
  );
#endif

#ifdef USE_SCENE_ENVIRONMENT
  let brdf = brdfSample.rgb;
  let diffuseLight = diffuseSample.rgb;
  let specularLight = specularSample.rgb;
#else
  let brdf = SRGBtoLINEAR(brdfSample).rgb;
  let diffuseLight = SRGBtoLINEAR(diffuseSample).rgb;
  let specularLight = SRGBtoLINEAR(specularSample).rgb;
#endif

  let diffuse = diffuseLight * pbrInfo.diffuseColor * pbrMaterial.scaleIBLAmbient.x;
  let specular =
    specularLight * (pbrInfo.specularColor * brdf.x + brdf.y) * pbrMaterial.scaleIBLAmbient.y;

#ifdef USE_SCENE_ENVIRONMENT
  return (diffuse + specular) * max(pbrScene.environmentIntensity, 0.0);
#else
  return diffuse + specular;
#endif
}
#endif

// Basic Lambertian diffuse
// Implementation from Lambert's Photometria https://archive.org/details/lambertsphotome00lambgoog
// See also [1], Equation 1
fn diffuse(pbrInfo: PBRInfo) -> vec3<f32> {
  return pbrInfo.diffuseColor / M_PI;
}

// The following equation models the Fresnel reflectance term of the spec equation (aka F())
// Implementation of fresnel from [4], Equation 15
fn specularReflection(pbrInfo: PBRInfo) -> vec3<f32> {
  return pbrInfo.reflectance0 +
    (pbrInfo.reflectance90 - pbrInfo.reflectance0) *
    pow(clamp(1.0 - pbrInfo.VdotH, 0.0, 1.0), 5.0);
}

// This calculates the specular geometric attenuation (aka G()),
// where rougher material will reflect less light back to the viewer.
// This implementation is based on [1] Equation 4, and we adopt their modifications to
// alphaRoughness as input as originally proposed in [2].
fn geometricOcclusion(pbrInfo: PBRInfo) -> f32 {
  let NdotL: f32 = pbrInfo.NdotL;
  let NdotV: f32 = pbrInfo.NdotV;
  let r: f32 = pbrInfo.alphaRoughness;

  let attenuationL = 2.0 * NdotL / (NdotL + sqrt(r * r + (1.0 - r * r) * (NdotL * NdotL)));
  let attenuationV = 2.0 * NdotV / (NdotV + sqrt(r * r + (1.0 - r * r) * (NdotV * NdotV)));
  return attenuationL * attenuationV;
}

// The following equation(s) model the distribution of microfacet normals across
// the area being drawn (aka D())
// Implementation from "Average Irregularity Representation of a Roughened Surface
// for Ray Reflection" by T. S. Trowbridge, and K. P. Reitz
// Follows the distribution function recommended in the SIGGRAPH 2013 course notes
// from EPIC Games [1], Equation 3.
fn microfacetDistribution(pbrInfo: PBRInfo) -> f32 {
  let roughnessSq = pbrInfo.alphaRoughness * pbrInfo.alphaRoughness;
  let f = (pbrInfo.NdotH * roughnessSq - pbrInfo.NdotH) * pbrInfo.NdotH + 1.0;
  return roughnessSq / (M_PI * f * f);
}

fn maxComponent(value: vec3f) -> f32 {
  return max(max(value.r, value.g), value.b);
}

fn getDielectricF0(ior: f32) -> f32 {
  let clampedIor = max(ior, 1.0);
  let ratio = (clampedIor - 1.0) / (clampedIor + 1.0);
  return ratio * ratio;
}

fn normalizeDirection(direction: vec2f) -> vec2f {
  let directionLength = length(direction);
  if (directionLength > 0.0001) {
    return direction / directionLength;
  }

  return vec2f(1.0, 0.0);
}

fn rotateDirection(direction: vec2f, rotation: f32) -> vec2f {
  let s = sin(rotation);
  let c = cos(rotation);
  return vec2f(direction.x * c - direction.y * s, direction.x * s + direction.y * c);
}

fn encodeLinearSRGB(linearColor: vec3f) -> vec3f {
  let positiveColor = max(linearColor, vec3f(0.0));
  return select(
    positiveColor * 12.92,
    1.055 * pow(positiveColor, vec3f(1.0 / 2.4)) - 0.055,
    positiveColor > vec3f(0.0031308)
  );
}

fn toneMapKhronosPBRNeutral(inputColor: vec3f) -> vec3f {
  let startCompression = 0.76;
  let darkestChannel = min(inputColor.r, min(inputColor.g, inputColor.b));
  let offset = select(
    0.04,
    darkestChannel - 6.25 * darkestChannel * darkestChannel,
    darkestChannel < 0.08
  );
  var color = inputColor - vec3f(offset);
  let peak = maxComponent(color);
  if (peak < startCompression) {
    return color;
  }

  let compressionRange = 1.0 - startCompression;
  let compressedPeak = 1.0 - compressionRange * compressionRange /
    (peak + compressionRange - startCompression);
  color *= compressedPeak / max(peak, 0.0001);
  let desaturation = 1.0 - 1.0 / (0.15 * (peak - compressedPeak) + 1.0);
  return mix(color, vec3f(compressedPeak), desaturation);
}

fn applySceneColorManagement(sceneColor: vec3f) -> vec3f {
#ifdef USE_SCENE_COLOR_MANAGEMENT
  var color = max(sceneColor, vec3f(0.0)) * max(pbrScene.exposure, 0.0);
  if (pbrScene.toneMapMode == 1) {
    color /= vec3f(1.0) + color;
  } else if (pbrScene.toneMapMode == 2) {
    color = toneMapKhronosPBRNeutral(color);
  } else if (pbrScene.toneMapMode == 3) {
    color = clamp(
      (color * (2.51 * color + 0.03)) / (color * (2.43 * color + 0.59) + 0.14),
      vec3f(0.0),
      vec3f(1.0)
    );
  }
  if (pbrScene.outputEncoding == 0) {
    return color;
  }
  return encodeLinearSRGB(color);
#else
  return pow(max(sceneColor, vec3f(0.0)), vec3f(1.0 / 2.2));
#endif
}

fn dielectricSchlick(reflectance: f32, cosine: f32) -> f32 {
  return reflectance + (1.0 - reflectance) * pow(clamp(1.0 - cosine, 0.0, 1.0), 5.0);
}

fn evaluateIridescenceSensitivity(opticalPathDifference: f32, phaseShift: vec3f) -> vec3f {
  let phase = 2.0 * M_PI * opticalPathDifference * 1.0e-9;
  let sensitivity = vec3f(5.4856e-13, 4.4201e-13, 5.2481e-13);
  let position = vec3f(1.6810e6, 1.7953e6, 2.2084e6);
  let variance = vec3f(4.3278e9, 9.3046e9, 6.6121e9);
  var xyz = sensitivity * sqrt(2.0 * M_PI * variance) *
    cos(position * phase + phaseShift) * exp(-phase * phase * variance);
  xyz.x += 9.7470e-14 * sqrt(2.0 * M_PI * 4.5282e9) *
    cos(2.2399e6 * phase + phaseShift.x) * exp(-4.5282e9 * phase * phase);
  xyz /= 1.0685e-7;
  return mat3x3f(
    vec3f(3.2404542, -0.9692660, 0.0556434),
    vec3f(-1.5371385, 1.8760108, -0.2040259),
    vec3f(-0.4985314, 0.0415560, 1.0572252)
  ) * xyz;
}

fn getIridescenceTint(
  iridescence: f32,
  thickness: f32,
  NdotV: f32,
  baseReflectance: vec3f
) -> vec3f {
  if (iridescence <= 0.0 || thickness <= 0.0) {
    return baseReflectance;
  }

  let filmIor = max(pbrMaterial.iridescenceIor, 1.0);
  let sineSquared = (1.0 - NdotV * NdotV) / (filmIor * filmIor);
  let cosineSquared = 1.0 - sineSquared;
  if (cosineSquared <= 0.0) {
    return mix(baseReflectance, vec3f(1.0), iridescence);
  }
  let filmCosine = sqrt(cosineSquared);
  let firstInterfaceReflectance = dielectricSchlick(getDielectricF0(filmIor), NdotV);
  let transmittedEnergy = 1.0 - firstInterfaceReflectance;
  let squareRootReflectance = sqrt(clamp(baseReflectance, vec3f(0.0), vec3f(0.9999)));
  let baseIor = (vec3f(1.0) + squareRootReflectance) /
    (vec3f(1.0) - squareRootReflectance);
  var secondInterfaceF0 = (baseIor - vec3f(filmIor)) / (baseIor + vec3f(filmIor));
  secondInterfaceF0 *= secondInterfaceF0;
  let secondInterfaceReflectance = secondInterfaceF0 +
    (vec3f(1.0) - secondInterfaceF0) * pow(1.0 - filmCosine, 5.0);
  let phaseShift = vec3f(M_PI) + select(
    vec3f(0.0),
    vec3f(M_PI),
    baseIor < vec3f(filmIor)
  );
  let opticalPathDifference = 2.0 * filmIor * thickness * filmCosine;
  let combinedReflectance = clamp(
    firstInterfaceReflectance * secondInterfaceReflectance,
    vec3f(0.00001),
    vec3f(0.9999)
  );
  let recurringAmplitude = sqrt(combinedReflectance);
  let interfaceResponse = transmittedEnergy * transmittedEnergy * secondInterfaceReflectance /
    (vec3f(1.0) - combinedReflectance);
  var reflectedSpectrum = vec3f(firstInterfaceReflectance) + interfaceResponse;
  var harmonicAmplitude = interfaceResponse - vec3f(transmittedEnergy);
  for (var harmonic = 1; harmonic <= 2; harmonic++) {
    harmonicAmplitude *= recurringAmplitude;
    reflectedSpectrum += harmonicAmplitude * 2.0 * evaluateIridescenceSensitivity(
      f32(harmonic) * opticalPathDifference,
      f32(harmonic) * phaseShift
    );
  }
  return mix(baseReflectance, clamp(reflectedSpectrum, vec3f(0.0), vec3f(1.0)), iridescence);
}

fn getVolumeAttenuation(thickness: f32) -> vec3f {
  if (thickness <= 0.0) {
    return vec3f(1.0);
  }

  let attenuationCoefficient =
    -log(max(pbrMaterial.attenuationColor, vec3f(0.0001))) /
    max(pbrMaterial.attenuationDistance, 0.0001);
  return exp(-attenuationCoefficient * thickness);
}

// KHR_materials_volume_scatter is an active draft. This evaluates a local,
// thickness-aware single-scattering approximation rather than random walk.
fn getDiffuseTransmissionAttenuation(
  pbrInfo: PBRInfo,
  multiscatterColor: vec3f,
  thickness: f32
) -> vec3f {
  let volumeAttenuation = getVolumeAttenuation(thickness);
  let scatteringStrength = maxComponent(multiscatterColor);
  if (thickness <= 0.0 || scatteringStrength <= 0.0001) {
    return volumeAttenuation;
  }

  let anisotropy = clamp(pbrMaterial.scatterAnisotropy, -0.95, 0.95);
  let scatteringCosine = clamp(dot(-pbrInfo.v, pbrInfo.l), -1.0, 1.0);
  let phaseDenominator = max(
    1.0 + anisotropy * anisotropy - 2.0 * anisotropy * scatteringCosine,
    0.0001
  );
  let phaseWeight = clamp(
    (1.0 - anisotropy * anisotropy) / pow(phaseDenominator, 1.5),
    0.0,
    4.0
  );
  let scatteringDepth = thickness / max(pbrMaterial.attenuationDistance, 0.0001);
  let scatteringProbability = 1.0 - exp(-scatteringDepth);
  let scatteringColor = clamp(multiscatterColor, vec3f(0.0), vec3f(1.0));
  return mix(
    volumeAttenuation,
    volumeAttenuation * mix(vec3f(1.0), scatteringColor * phaseWeight, scatteringColor),
    scatteringProbability
  );
}

fn calculateDiffuseTransmissionLight(
  pbrInfo: PBRInfo,
  lightColor: vec3f,
  diffuseTransmissionColor: vec3f,
  diffuseTransmission: f32,
  multiscatterColor: vec3f,
  thickness: f32
) -> vec3f {
  let oppositeHemisphere = max(dot(-pbrInfo.n, pbrInfo.l), 0.0);
  if (oppositeHemisphere <= 0.0 || diffuseTransmission <= 0.0) {
    return vec3f(0.0);
  }

  let nonReflectedEnergy = vec3f(1.0) - clamp(pbrInfo.reflectance0, vec3f(0.0), vec3f(1.0));
  let attenuatedColor = getDiffuseTransmissionAttenuation(
    pbrInfo,
    multiscatterColor,
    thickness
  );
  return lightColor * diffuseTransmissionColor * nonReflectedEnergy *
    attenuatedColor * (diffuseTransmission * oppositeHemisphere / M_PI);
}

#ifdef USE_IBL
fn calculateDiffuseTransmissionIBL(
  pbrInfo: PBRInfo,
  diffuseTransmissionColor: vec3f,
  diffuseTransmission: f32,
  multiscatterColor: vec3f,
  thickness: f32
) -> vec3f {
  if (diffuseTransmission <= 0.0) {
    return vec3f(0.0);
  }

#ifdef USE_SCENE_ENVIRONMENT
  let rotationSine = sin(pbrScene.environmentRotation);
  let rotationCosine = cos(pbrScene.environmentRotation);
  let environmentRotation = mat2x2f(
    vec2f(rotationCosine, rotationSine),
    vec2f(-rotationSine, rotationCosine)
  );
  let rotatedNormal = environmentRotation * -pbrInfo.n.xz;
  let oppositeNormal = vec3f(rotatedNormal.x, -pbrInfo.n.y, rotatedNormal.y);
  let environmentColor = textureSampleLevel(
    pbr_diffuseEnvSampler,
    pbr_diffuseEnvSamplerSampler,
    oppositeNormal,
    0.0
  ).rgb * max(pbrScene.environmentIntensity, 0.0);
#else
  let environmentColor = SRGBtoLINEAR(
    textureSampleLevel(pbr_diffuseEnvSampler, pbr_diffuseEnvSamplerSampler, -pbrInfo.n, 0.0)
  ).rgb;
#endif
  let nonReflectedEnergy = vec3f(1.0) - clamp(pbrInfo.reflectance0, vec3f(0.0), vec3f(1.0));
  return environmentColor * diffuseTransmissionColor * nonReflectedEnergy *
    getDiffuseTransmissionAttenuation(pbrInfo, multiscatterColor, thickness) *
    diffuseTransmission * pbrMaterial.scaleIBLAmbient.x;
}
#endif

#ifdef USE_TRANSMISSION_FRAMEBUFFER
fn sampleTransmittedSceneColor(
  position: vec3f,
  normal: vec3f,
  viewDirection: vec3f,
  thickness: f32,
  perceptualRoughness: f32,
  indexOfRefraction: f32
) -> vec3f {
  let refractionDirection = refract(
    -viewDirection,
    normal,
    1.0 / max(indexOfRefraction, 1.0)
  );
  let refractedPosition = position + refractionDirection * thickness;
  let clipPosition = pbrScene.projectionMatrix *
    pbrScene.viewMatrix * vec4f(refractedPosition, 1.0);
  var textureCoordinate = clipPosition.xy / max(clipPosition.w, 0.0001) * 0.5 + 0.5;
  textureCoordinate.y = 1.0 - textureCoordinate.y;
  textureCoordinate = clamp(textureCoordinate, vec2f(0.001), vec2f(0.999));

  let blurRadius = perceptualRoughness * perceptualRoughness * 8.0 /
    max(pbrScene.framebufferSize, vec2f(1.0));
  var sceneColor = textureSampleLevel(
    pbr_transmissionFramebufferSampler,
    pbr_transmissionFramebufferSamplerSampler,
    textureCoordinate,
    0.0
  ).rgb * 0.4;
  sceneColor += textureSampleLevel(
    pbr_transmissionFramebufferSampler,
    pbr_transmissionFramebufferSamplerSampler,
    textureCoordinate + vec2f(blurRadius.x, 0.0),
    0.0
  ).rgb * 0.15;
  sceneColor += textureSampleLevel(
    pbr_transmissionFramebufferSampler,
    pbr_transmissionFramebufferSamplerSampler,
    textureCoordinate - vec2f(blurRadius.x, 0.0),
    0.0
  ).rgb * 0.15;
  sceneColor += textureSampleLevel(
    pbr_transmissionFramebufferSampler,
    pbr_transmissionFramebufferSamplerSampler,
    textureCoordinate + vec2f(0.0, blurRadius.y),
    0.0
  ).rgb * 0.15;
  sceneColor += textureSampleLevel(
    pbr_transmissionFramebufferSampler,
    pbr_transmissionFramebufferSamplerSampler,
    textureCoordinate - vec2f(0.0, blurRadius.y),
    0.0
  ).rgb * 0.15;
  return max(sceneColor, vec3f(0.0));
}

fn getTransmittedSceneColor(
  position: vec3f,
  normal: vec3f,
  viewDirection: vec3f,
  thickness: f32,
  perceptualRoughness: f32
) -> vec3f {
  if (pbrMaterial.dispersion <= 0.0) {
    return sampleTransmittedSceneColor(
      position,
      normal,
      viewDirection,
      thickness,
      perceptualRoughness,
      pbrMaterial.ior
    );
  }

  let halfSpread = (max(pbrMaterial.ior, 1.0) - 1.0) * 0.025 * pbrMaterial.dispersion;
  let indicesOfRefraction = max(
    vec3f(pbrMaterial.ior - halfSpread, pbrMaterial.ior, pbrMaterial.ior + halfSpread),
    vec3f(1.0)
  );
  return vec3f(
    sampleTransmittedSceneColor(
      position, normal, viewDirection, thickness, perceptualRoughness, indicesOfRefraction.r
    ).r,
    sampleTransmittedSceneColor(
      position, normal, viewDirection, thickness, perceptualRoughness, indicesOfRefraction.g
    ).g,
    sampleTransmittedSceneColor(
      position, normal, viewDirection, thickness, perceptualRoughness, indicesOfRefraction.b
    ).b
  );
}
#endif

fn createClearcoatPBRInfo(
  basePBRInfo: PBRInfo,
  clearcoatNormal: vec3f,
  clearcoatRoughness: f32
) -> PBRInfo {
  let perceptualRoughness = clamp(clearcoatRoughness, c_MinRoughness, 1.0);
  let alphaRoughness = perceptualRoughness * perceptualRoughness;
  let NdotV = clamp(abs(dot(clearcoatNormal, basePBRInfo.v)), 0.001, 1.0);

  return PBRInfo(
    basePBRInfo.NdotL,
    NdotV,
    basePBRInfo.NdotH,
    basePBRInfo.LdotH,
    basePBRInfo.VdotH,
    perceptualRoughness,
    0.0,
    vec3f(0.04),
    vec3f(1.0),
    alphaRoughness,
    vec3f(0.0),
    vec3f(0.04),
    clearcoatNormal,
    basePBRInfo.v,
    basePBRInfo.l,
    basePBRInfo.h
  );
}

fn calculateClearcoatContribution(
  pbrInfo: PBRInfo,
  lightColor: vec3f,
  clearcoatNormal: vec3f,
  clearcoatFactor: f32,
  clearcoatRoughness: f32
) -> vec3f {
  if (clearcoatFactor <= 0.0) {
    return vec3f(0.0);
  }

  let clearcoatPBRInfo = createClearcoatPBRInfo(pbrInfo, clearcoatNormal, clearcoatRoughness);
  return calculateFinalColor(clearcoatPBRInfo, lightColor) * clearcoatFactor;
}

#ifdef USE_IBL
fn calculateClearcoatIBLContribution(
  pbrInfo: PBRInfo,
  clearcoatNormal: vec3f,
  reflection: vec3f,
  clearcoatFactor: f32,
  clearcoatRoughness: f32
) -> vec3f {
  if (clearcoatFactor <= 0.0) {
    return vec3f(0.0);
  }

  let clearcoatPBRInfo = createClearcoatPBRInfo(pbrInfo, clearcoatNormal, clearcoatRoughness);
  return getIBLContribution(clearcoatPBRInfo, clearcoatNormal, reflection) * clearcoatFactor;
}
#endif

fn calculateSheenContribution(
  pbrInfo: PBRInfo,
  lightColor: vec3f,
  sheenColor: vec3f,
  sheenRoughness: f32
) -> vec3f {
  if (maxComponent(sheenColor) <= 0.0) {
    return vec3f(0.0);
  }

  let alpha = max(sheenRoughness * sheenRoughness, 0.0001);
  let inverseAlpha = 1.0 / alpha;
  let sineSquared = max(1.0 - pbrInfo.NdotH * pbrInfo.NdotH, 0.0);
  let distribution = (2.0 + inverseAlpha) * pow(sineSquared, inverseAlpha * 0.5) /
    (2.0 * M_PI);
  let visibility = 1.0 / max(
    4.0 * (pbrInfo.NdotL + pbrInfo.NdotV - pbrInfo.NdotL * pbrInfo.NdotV),
    0.0001
  );
  return pbrInfo.NdotL * lightColor * sheenColor * distribution * visibility *
    (1.0 - pbrInfo.metalness);
}

fn calculateAnisotropicLightColor(
  pbrInfo: PBRInfo,
  lightColor: vec3f,
  anisotropyTangent: vec3f,
  anisotropyStrength: f32
) -> vec3f {
  if (anisotropyStrength <= 0.0) {
    return calculateFinalColor(pbrInfo, lightColor);
  }

  let anisotropyBitangent = normalize(cross(pbrInfo.n, anisotropyTangent));
  let tangentRoughness = mix(
    pbrInfo.alphaRoughness,
    1.0,
    anisotropyStrength * anisotropyStrength
  );
  let bitangentRoughness = clamp(pbrInfo.alphaRoughness, 0.001, 1.0);
  let roughnessProduct = tangentRoughness * bitangentRoughness;
  let distributionVector = vec3f(
    bitangentRoughness * dot(anisotropyTangent, pbrInfo.h),
    tangentRoughness * dot(anisotropyBitangent, pbrInfo.h),
    roughnessProduct * pbrInfo.NdotH
  );
  let distributionFactor = roughnessProduct /
    max(dot(distributionVector, distributionVector), 0.000001);
  let distribution = roughnessProduct * distributionFactor * distributionFactor / M_PI;
  let viewMask = pbrInfo.NdotL * length(vec3f(
    tangentRoughness * dot(anisotropyTangent, pbrInfo.v),
    bitangentRoughness * dot(anisotropyBitangent, pbrInfo.v),
    pbrInfo.NdotV
  ));
  let lightMask = pbrInfo.NdotV * length(vec3f(
    tangentRoughness * dot(anisotropyTangent, pbrInfo.l),
    bitangentRoughness * dot(anisotropyBitangent, pbrInfo.l),
    pbrInfo.NdotL
  ));
  let visibility = clamp(0.5 / max(viewMask + lightMask, 0.000001), 0.0, 1.0);
  let fresnel = specularReflection(pbrInfo);
  let diffuseContribution = (vec3f(1.0) - fresnel) * diffuse(pbrInfo);
  return pbrInfo.NdotL * lightColor *
    (diffuseContribution + fresnel * distribution * visibility);
}

fn getAnisotropicReflection(
  pbrInfo: PBRInfo,
  anisotropyTangent: vec3f,
  anisotropyStrength: f32
) -> vec3f {
  if (anisotropyStrength <= 0.0) {
    return -normalize(reflect(pbrInfo.v, pbrInfo.n));
  }
  let anisotropyBitangent = normalize(cross(pbrInfo.n, anisotropyTangent));
  var anisotropicNormal = normalize(cross(anisotropyBitangent, pbrInfo.v));
  anisotropicNormal = normalize(cross(anisotropicNormal, anisotropyBitangent));
  let bend = anisotropyStrength * (1.0 - pbrInfo.perceptualRoughness);
  return -normalize(reflect(pbrInfo.v, normalize(mix(pbrInfo.n, anisotropicNormal, bend))));
}

fn calculateMaterialLightColor(
  pbrInfo: PBRInfo,
  lightColor: vec3f,
  clearcoatNormal: vec3f,
  clearcoatFactor: f32,
  clearcoatRoughness: f32,
  sheenColor: vec3f,
  sheenRoughness: f32,
  anisotropyTangent: vec3f,
  anisotropyStrength: f32
) -> vec3f {
  var color = calculateAnisotropicLightColor(
    pbrInfo,
    lightColor,
    anisotropyTangent,
    anisotropyStrength
  );
  color += calculateClearcoatContribution(
    pbrInfo,
    lightColor,
    clearcoatNormal,
    clearcoatFactor,
    clearcoatRoughness
  );
  color += calculateSheenContribution(pbrInfo, lightColor, sheenColor, sheenRoughness);
  return color;
}

fn PBRInfo_setAmbientLight(pbrInfo: ptr<function, PBRInfo>) {
  (*pbrInfo).NdotL = 1.0;
  (*pbrInfo).NdotH = 0.0;
  (*pbrInfo).LdotH = 0.0;
  (*pbrInfo).VdotH = 1.0;
  (*pbrInfo).l = (*pbrInfo).n;
  (*pbrInfo).h = (*pbrInfo).n;
}

fn PBRInfo_setDirectionalLight(pbrInfo: ptr<function, PBRInfo>, lightDirection: vec3<f32>) {
  let n = (*pbrInfo).n;
  let v = (*pbrInfo).v;
  let l = normalize(lightDirection);             // Vector from surface point to light
  let h = normalize(l + v);                      // Half vector between both l and v

  (*pbrInfo).NdotL = clamp(dot(n, l), 0.001, 1.0);
  (*pbrInfo).NdotH = clamp(dot(n, h), 0.0, 1.0);
  (*pbrInfo).LdotH = clamp(dot(l, h), 0.0, 1.0);
  (*pbrInfo).VdotH = clamp(dot(v, h), 0.0, 1.0);
  (*pbrInfo).l = l;
  (*pbrInfo).h = h;
}

fn PBRInfo_setPointLight(pbrInfo: ptr<function, PBRInfo>, pointLight: PointLight) {
  let light_direction = normalize(pointLight.position - fragmentInputs.pbr_vPosition);
  PBRInfo_setDirectionalLight(pbrInfo, light_direction);
}

fn PBRInfo_setSpotLight(pbrInfo: ptr<function, PBRInfo>, spotLight: SpotLight) {
  let light_direction = normalize(spotLight.position - fragmentInputs.pbr_vPosition);
  PBRInfo_setDirectionalLight(pbrInfo, light_direction);
}

fn calculateFinalColor(pbrInfo: PBRInfo, lightColor: vec3<f32>) -> vec3<f32> {
  // Calculate the shading terms for the microfacet specular shading model
  let F = specularReflection(pbrInfo);
  let G = geometricOcclusion(pbrInfo);
  let D = microfacetDistribution(pbrInfo);

  // Calculation of analytical lighting contribution
  let diffuseContrib = (1.0 - F) * diffuse(pbrInfo);
  let specContrib = F * G * D / (4.0 * pbrInfo.NdotL * pbrInfo.NdotV);
  // Obtain final intensity as reflectance (BRDF) scaled by the energy of the light (cosine law)
  return pbrInfo.NdotL * lightColor * (diffuseContrib + specContrib);
}

// Visibility for the first four spotlights; environment and other lights are unaffected.
var<private> pbr_ambientVisibility: f32 = 1.0;

fn pbr_filterColorWithShadows(vertexColor: vec4<f32>, directionalVisibility: f32, pointVisibility: vec4f, spotVisibility: vec4f) -> vec4<f32> {
  let baseColorUV = getMaterialUV(pbrMaterial.baseColorUVSet, pbrMaterial.baseColorUVTransform);
  let metallicRoughnessUV = getMaterialUV(
    pbrMaterial.metallicRoughnessUVSet,
    pbrMaterial.metallicRoughnessUVTransform
  );
  let normalUV = getMaterialUV(pbrMaterial.normalUVSet, pbrMaterial.normalUVTransform);
  let occlusionUV = getMaterialUV(pbrMaterial.occlusionUVSet, pbrMaterial.occlusionUVTransform);
  let emissiveUV = getMaterialUV(pbrMaterial.emissiveUVSet, pbrMaterial.emissiveUVTransform);
  let lightmapUV = getMaterialUV(pbrMaterial.lightmapUVSet, pbrMaterial.lightmapUVTransform);
  let specularColorUV = getMaterialUV(
    pbrMaterial.specularColorUVSet,
    pbrMaterial.specularColorUVTransform
  );
  let specularIntensityUV = getMaterialUV(
    pbrMaterial.specularIntensityUVSet,
    pbrMaterial.specularIntensityUVTransform
  );
  let transmissionUV = getMaterialUV(
    pbrMaterial.transmissionUVSet,
    pbrMaterial.transmissionUVTransform
  );
  let thicknessUV = getMaterialUV(pbrMaterial.thicknessUVSet, pbrMaterial.thicknessUVTransform);
  let clearcoatUV = getMaterialUV(pbrMaterial.clearcoatUVSet, pbrMaterial.clearcoatUVTransform);
  let clearcoatRoughnessUV = getMaterialUV(
    pbrMaterial.clearcoatRoughnessUVSet,
    pbrMaterial.clearcoatRoughnessUVTransform
  );
  let clearcoatNormalUV = getMaterialUV(
    pbrMaterial.clearcoatNormalUVSet,
    pbrMaterial.clearcoatNormalUVTransform
  );
  let sheenColorUV = getMaterialUV(
    pbrMaterial.sheenColorUVSet,
    pbrMaterial.sheenColorUVTransform
  );
  let sheenRoughnessUV = getMaterialUV(
    pbrMaterial.sheenRoughnessUVSet,
    pbrMaterial.sheenRoughnessUVTransform
  );
  let iridescenceUV = getMaterialUV(
    pbrMaterial.iridescenceUVSet,
    pbrMaterial.iridescenceUVTransform
  );
  let iridescenceThicknessUV = getMaterialUV(
    pbrMaterial.iridescenceThicknessUVSet,
    pbrMaterial.iridescenceThicknessUVTransform
  );
  let anisotropyUV = getMaterialUV(
    pbrMaterial.anisotropyUVSet,
    pbrMaterial.anisotropyUVTransform
  );
  let diffuseTransmissionUV = getMaterialUV(
    pbrMaterial.diffuseTransmissionUVSet,
    pbrMaterial.diffuseTransmissionUVTransform
  );
  let diffuseTransmissionColorUV = getMaterialUV(
    pbrMaterial.diffuseTransmissionColorUVSet,
    pbrMaterial.diffuseTransmissionColorUVTransform
  );
  let multiscatterColorUV = getMaterialUV(
    pbrMaterial.multiscatterColorUVSet,
    pbrMaterial.multiscatterColorUVTransform
  );

  // The albedo may be defined from a base texture or a flat color
  var baseColor: vec4<f32> = pbrMaterial.baseColorFactor * vertexColor;
  #ifdef HAS_BASECOLORMAP
  baseColor = SRGBtoLINEAR(
    textureSample(pbr_baseColorSampler, pbr_baseColorSamplerSampler, baseColorUV)
  ) * pbrMaterial.baseColorFactor * vertexColor;
  #endif

  #ifdef ALPHA_CUTOFF
  if (baseColor.a < pbrMaterial.alphaCutoff) {
    discard;
  }
  #endif

  var color = vec3<f32>(0.0, 0.0, 0.0);
  var transmission = 0.0;

  var lightmapIrradiance = vec3<f32>(0.0);
  #ifdef HAS_LIGHTMAP
  if (pbrMaterial.lightmapMapEnabled != 0u) {
    lightmapIrradiance = textureSample(pbr_lightmapSampler, pbr_lightmapSamplerSampler, lightmapUV).rgb * pbrMaterial.lightmapIntensity;
  }
  #endif

  if (pbrMaterial.unlit != 0u) {
    color = baseColor.rgb;
    #ifdef HAS_LIGHTMAP
    if (pbrMaterial.lightmapMapEnabled != 0u) {
      color *= lightmapIrradiance / M_PI * pbr_ambientVisibility;
      #ifdef HAS_OCCLUSIONMAP
      if (pbrMaterial.occlusionMapEnabled != 0) {
        let ao = textureSample(pbr_occlusionSampler, pbr_occlusionSamplerSampler, occlusionUV).r;
        color = mix(color, color * ao, pbrMaterial.occlusionStrength);
      }
      #endif
    }
    #endif
  } else {
    // Metallic and Roughness material properties are packed together
    // In glTF, these factors can be specified by fixed scalar values
    // or from a metallic-roughness map
    var perceptualRoughness = pbrMaterial.metallicRoughnessValues.y;
    var metallic = pbrMaterial.metallicRoughnessValues.x;
    #ifdef HAS_METALROUGHNESSMAP
    // Roughness is stored in the 'g' channel, metallic is stored in the 'b' channel.
    // This layout intentionally reserves the 'r' channel for (optional) occlusion map data
    let mrSample = textureSample(
      pbr_metallicRoughnessSampler,
      pbr_metallicRoughnessSamplerSampler,
      metallicRoughnessUV
    );
    perceptualRoughness = mrSample.g * perceptualRoughness;
    metallic = mrSample.b * metallic;
    #endif
    perceptualRoughness = clamp(perceptualRoughness, c_MinRoughness, 1.0);
    metallic = clamp(metallic, 0.0, 1.0);
    let tbn = getTBN(normalUV);
    let n = getNormal(tbn, normalUV);                          // normal at surface point
    perceptualRoughness = widenSpecularRoughness(perceptualRoughness, n);
    let v = normalize(pbrProjection.camera - fragmentInputs.pbr_vPosition);  // Vector from surface point to camera
    let NdotV = clamp(abs(dot(n, v)), 0.001, 1.0);
    var useExtendedPBR = false;
    #ifdef USE_MATERIAL_EXTENSIONS
    useExtendedPBR =
      pbrMaterial.specularColorMapEnabled != 0 ||
      pbrMaterial.specularIntensityMapEnabled != 0 ||
      abs(pbrMaterial.specularIntensityFactor - 1.0) > 0.0001 ||
      maxComponent(abs(pbrMaterial.specularColorFactor - vec3f(1.0))) > 0.0001 ||
      abs(pbrMaterial.ior - 1.5) > 0.0001 ||
      pbrMaterial.dispersion > 0.0001 ||
      pbrMaterial.transmissionMapEnabled != 0 ||
      pbrMaterial.transmissionFactor > 0.0001 ||
      pbrMaterial.diffuseTransmissionMapEnabled != 0 ||
      pbrMaterial.diffuseTransmissionColorMapEnabled != 0 ||
      pbrMaterial.diffuseTransmissionFactor > 0.0001 ||
      pbrMaterial.multiscatterColorMapEnabled != 0 ||
      maxComponent(pbrMaterial.multiscatterColorFactor) > 0.0001 ||
      pbrMaterial.clearcoatMapEnabled != 0 ||
      pbrMaterial.clearcoatRoughnessMapEnabled != 0 ||
      pbrMaterial.clearcoatFactor > 0.0001 ||
      pbrMaterial.clearcoatRoughnessFactor > 0.0001 ||
      pbrMaterial.sheenColorMapEnabled != 0 ||
      pbrMaterial.sheenRoughnessMapEnabled != 0 ||
      maxComponent(pbrMaterial.sheenColorFactor) > 0.0001 ||
      pbrMaterial.sheenRoughnessFactor > 0.0001 ||
      pbrMaterial.iridescenceMapEnabled != 0 ||
      pbrMaterial.iridescenceFactor > 0.0001 ||
      abs(pbrMaterial.iridescenceIor - 1.3) > 0.0001 ||
      abs(pbrMaterial.iridescenceThicknessRange.x - 100.0) > 0.0001 ||
      abs(pbrMaterial.iridescenceThicknessRange.y - 400.0) > 0.0001 ||
      pbrMaterial.anisotropyMapEnabled != 0 ||
      pbrMaterial.anisotropyStrength > 0.0001 ||
      abs(pbrMaterial.anisotropyRotation) > 0.0001 ||
      length(pbrMaterial.anisotropyDirection - vec2f(1.0, 0.0)) > 0.0001;
    #endif

    if (!useExtendedPBR) {
      let alphaRoughness = perceptualRoughness * perceptualRoughness;

      let f0 = vec3<f32>(0.04);
      var diffuseColor = baseColor.rgb * (vec3<f32>(1.0) - f0);
      diffuseColor *= 1.0 - metallic;
      let specularColor = mix(f0, baseColor.rgb, metallic);

      let reflectance = max(max(specularColor.r, specularColor.g), specularColor.b);
      let reflectance90 = clamp(reflectance * 25.0, 0.0, 1.0);
      let specularEnvironmentR0 = specularColor;
      let specularEnvironmentR90 = vec3<f32>(1.0, 1.0, 1.0) * reflectance90;
      let reflection = -normalize(reflect(v, n));

      var pbrInfo = PBRInfo(
        0.0, // NdotL
        NdotV,
        0.0, // NdotH
        0.0, // LdotH
        0.0, // VdotH
        perceptualRoughness,
        metallic,
        specularEnvironmentR0,
        specularEnvironmentR90,
        alphaRoughness,
        diffuseColor,
        specularColor,
        n,
        v,
        n,
        n
      );

      #ifdef USE_LIGHTS
      PBRInfo_setAmbientLight(&pbrInfo);
      color += calculateFinalColor(pbrInfo, lighting.ambientColor * pbr_ambientVisibility);

      for (var i = 0; i < lighting.directionalLightCount; i++) {
        if (i < lighting.directionalLightCount) {
          PBRInfo_setDirectionalLight(&pbrInfo, -lighting_getDirectionalLight(i).direction);
          color += calculateFinalColor(pbrInfo, lighting_getDirectionalLight(i).color * select(1.0, clamp(directionalVisibility, 0.0, 1.0), i == 0));
        }
      }

      for (var i = 0; i < lighting.pointLightCount; i++) {
        if (i < lighting.pointLightCount) {
          PBRInfo_setPointLight(&pbrInfo, lighting_getPointLight(i));
          let attenuation = getPointLightAttenuation(
            lighting_getPointLight(i),
            distance(lighting_getPointLight(i).position, fragmentInputs.pbr_vPosition)
          );
          color += calculateFinalColor(pbrInfo, lighting_getPointLight(i).color * select(1.0, clamp(pointVisibility[min(i, 3)], 0.0, 1.0), i < 4) / attenuation);
        }
      }

      for (var i = 0; i < lighting.spotLightCount; i++) {
        if (i < lighting.spotLightCount) {
          PBRInfo_setSpotLight(&pbrInfo, lighting_getSpotLight(i));
          let attenuation = getSpotLightAttenuation(
            lighting_getSpotLight(i),
            fragmentInputs.pbr_vPosition
          );
          color += calculateFinalColor(pbrInfo, lighting_getSpotLight(i).color * select(1.0, clamp(spotVisibility[min(i, 3)], 0.0, 1.0), i < 4) / attenuation);
        }
      }
      for (var areaIndex: i32 = 0; areaIndex < areaLighting_getLightCount(); areaIndex++) {
#ifdef USE_AREA_LIGHT_LTC
        color += areaLTC_evaluate(areaIndex, fragmentInputs.pbr_vPosition, pbrInfo.n, pbrInfo.v, pbrInfo.perceptualRoughness, pbrInfo.diffuseColor, pbrInfo.reflectance0, pbrInfo.reflectance90);
#else
        for (var sampleIndex: i32 = 0; sampleIndex < areaLighting.sampleCount; sampleIndex++) {
          let sampleLight = areaLighting_getSample(areaIndex, sampleIndex, fragmentInputs.pbr_vPosition);
          if (dot(sampleLight.color, sampleLight.color) > 0.0) {
            PBRInfo_setPointLight(&pbrInfo, sampleLight);
            color += calculateFinalColor(pbrInfo, sampleLight.color);
          }
        }
#endif
      }
      #endif

      let indirectBaseColor = color;
#ifdef USE_IBL
      if (pbrMaterial.IBLenabled != 0) {
        color += getIBLContribution(pbrInfo, n, reflection);
      }
      #endif

      // The pinned KHR_lightmap draft explicitly defines c_diff = (1 - metallic) * baseColor.
      color += baseColor.rgb * (1.0 - metallic) * lightmapIrradiance / M_PI;
      color = indirectBaseColor + (color - indirectBaseColor) * pbr_ambientVisibility;

      #ifdef HAS_OCCLUSIONMAP
      if (pbrMaterial.occlusionMapEnabled != 0) {
        let ao = textureSample(pbr_occlusionSampler, pbr_occlusionSamplerSampler, occlusionUV).r;
        color = mix(color, color * ao, pbrMaterial.occlusionStrength);
      }
      #endif

      var emissive = pbrMaterial.emissiveFactor;
      #ifdef HAS_EMISSIVEMAP
      if (pbrMaterial.emissiveMapEnabled != 0u) {
        emissive *= SRGBtoLINEAR(
          textureSample(pbr_emissiveSampler, pbr_emissiveSamplerSampler, emissiveUV)
        ).rgb;
      }
      #endif
      color += emissive * pbrMaterial.emissiveStrength;

      #ifdef PBR_DEBUG
      color = mix(color, baseColor.rgb, pbrMaterial.scaleDiffBaseMR.y);
      color = mix(color, vec3<f32>(metallic), pbrMaterial.scaleDiffBaseMR.z);
      color = mix(color, vec3<f32>(perceptualRoughness), pbrMaterial.scaleDiffBaseMR.w);
      #endif

      return vec4<f32>(applySceneColorManagement(color), baseColor.a);
    }

    var specularIntensity = pbrMaterial.specularIntensityFactor;
    #ifdef HAS_SPECULARINTENSITYMAP
    if (pbrMaterial.specularIntensityMapEnabled != 0) {
      specularIntensity *= textureSample(
        pbr_specularIntensitySampler,
        pbr_specularIntensitySamplerSampler,
        specularIntensityUV
      ).a;
    }
    #endif

    var specularFactor = pbrMaterial.specularColorFactor;
    #ifdef HAS_SPECULARCOLORMAP
    if (pbrMaterial.specularColorMapEnabled != 0) {
      specularFactor *= SRGBtoLINEAR(
        textureSample(
          pbr_specularColorSampler,
          pbr_specularColorSamplerSampler,
          specularColorUV
        )
      ).rgb;
    }
    #endif

    transmission = pbrMaterial.transmissionFactor;
    #ifdef HAS_TRANSMISSIONMAP
    if (pbrMaterial.transmissionMapEnabled != 0) {
      transmission *= textureSample(
        pbr_transmissionSampler,
        pbr_transmissionSamplerSampler,
        transmissionUV
      ).r;
    }
    #endif
    transmission = clamp(transmission * (1.0 - metallic), 0.0, 1.0);
    var thickness = max(pbrMaterial.thicknessFactor, 0.0);
    #ifdef HAS_THICKNESSMAP
    thickness *= textureSample(
      pbr_thicknessSampler,
      pbr_thicknessSamplerSampler,
      thicknessUV
    ).g;
    #endif

    var diffuseTransmission = clamp(pbrMaterial.diffuseTransmissionFactor, 0.0, 1.0);
    #ifdef HAS_DIFFUSETRANSMISSIONMAP
    if (pbrMaterial.diffuseTransmissionMapEnabled != 0) {
      diffuseTransmission *= textureSample(
        pbr_diffuseTransmissionSampler,
        pbr_diffuseTransmissionSamplerSampler,
        diffuseTransmissionUV
      ).a;
    }
    #endif
    diffuseTransmission *= (1.0 - metallic) * (1.0 - transmission);
    var diffuseTransmissionColor = pbrMaterial.diffuseTransmissionColorFactor;
    #ifdef HAS_DIFFUSETRANSMISSIONCOLORMAP
    if (pbrMaterial.diffuseTransmissionColorMapEnabled != 0) {
      diffuseTransmissionColor *= SRGBtoLINEAR(
        textureSample(
          pbr_diffuseTransmissionColorSampler,
          pbr_diffuseTransmissionColorSamplerSampler,
          diffuseTransmissionColorUV
        )
      ).rgb;
    }
    #endif
    var multiscatterColor = pbrMaterial.multiscatterColorFactor;
    #ifdef HAS_MULTISCATTERCOLORMAP
    if (pbrMaterial.multiscatterColorMapEnabled != 0) {
      multiscatterColor *= SRGBtoLINEAR(
        textureSample(
          pbr_multiscatterColorSampler,
          pbr_multiscatterColorSamplerSampler,
          multiscatterColorUV
        )
      ).rgb;
    }
    #endif

    let originalTransmission = transmission;
    var scatterReflection = 0.0;
#ifdef HAS_MATERIAL_SCATTER
    if (thickness <= 0.0) {
      var strength = clamp(pbrMaterial.scatterStrengthFactor, 0.0, 1.0);
#ifdef HAS_DIFFUSETRANSMISSIONMAP
      if (pbrMaterial.diffuseTransmissionMapEnabled != 0) {
        strength *= textureSample(
        pbr_diffuseTransmissionSampler,
        pbr_diffuseTransmissionSamplerSampler,
        diffuseTransmissionUV
      ).a;
      }
#endif
      let anisotropy = pbrMaterial.scatterAnisotropy;
      scatterReflection = originalTransmission * strength * (1.0 - anisotropy) * 0.5;
      diffuseTransmission = originalTransmission * strength * (1.0 + anisotropy) * 0.5;
      diffuseTransmissionColor = multiscatterColor;
      transmission *= 1.0 - strength;
    }
#endif

    var clearcoatFactor = pbrMaterial.clearcoatFactor;
    var clearcoatRoughness = pbrMaterial.clearcoatRoughnessFactor;
    #ifdef HAS_CLEARCOATMAP
    if (pbrMaterial.clearcoatMapEnabled != 0) {
      clearcoatFactor *= textureSample(
        pbr_clearcoatSampler,
        pbr_clearcoatSamplerSampler,
        clearcoatUV
      ).r;
    }
    #endif
    #ifdef HAS_CLEARCOATROUGHNESSMAP
    if (pbrMaterial.clearcoatRoughnessMapEnabled != 0) {
      clearcoatRoughness *= textureSample(
        pbr_clearcoatRoughnessSampler,
        pbr_clearcoatRoughnessSamplerSampler,
        clearcoatRoughnessUV
      ).g;
    }
    #endif
    clearcoatFactor = clamp(clearcoatFactor, 0.0, 1.0);
    clearcoatRoughness = clamp(clearcoatRoughness, c_MinRoughness, 1.0);
    let clearcoatNormal = getClearcoatNormal(getTBN(clearcoatNormalUV), n, clearcoatNormalUV);
    clearcoatRoughness = widenSpecularRoughness(clearcoatRoughness, clearcoatNormal);

    var sheenColor = pbrMaterial.sheenColorFactor;
    var sheenRoughness = pbrMaterial.sheenRoughnessFactor;
    #ifdef HAS_SHEENCOLORMAP
    if (pbrMaterial.sheenColorMapEnabled != 0) {
      sheenColor *= SRGBtoLINEAR(
        textureSample(
          pbr_sheenColorSampler,
          pbr_sheenColorSamplerSampler,
          sheenColorUV
        )
      ).rgb;
    }
    #endif
    #ifdef HAS_SHEENROUGHNESSMAP
    if (pbrMaterial.sheenRoughnessMapEnabled != 0) {
      sheenRoughness *= textureSample(
        pbr_sheenRoughnessSampler,
        pbr_sheenRoughnessSamplerSampler,
        sheenRoughnessUV
      ).a;
    }
    #endif
    sheenRoughness = clamp(sheenRoughness, c_MinRoughness, 1.0);

    var iridescence = pbrMaterial.iridescenceFactor;
    #ifdef HAS_IRIDESCENCEMAP
    if (pbrMaterial.iridescenceMapEnabled != 0) {
      iridescence *= textureSample(
        pbr_iridescenceSampler,
        pbr_iridescenceSamplerSampler,
        iridescenceUV
      ).r;
    }
    #endif
    iridescence = clamp(iridescence, 0.0, 1.0);
    var iridescenceThickness = mix(
      pbrMaterial.iridescenceThicknessRange.x,
      pbrMaterial.iridescenceThicknessRange.y,
      0.5
    );
    #ifdef HAS_IRIDESCENCETHICKNESSMAP
    iridescenceThickness = mix(
      pbrMaterial.iridescenceThicknessRange.x,
      pbrMaterial.iridescenceThicknessRange.y,
      textureSample(
        pbr_iridescenceThicknessSampler,
        pbr_iridescenceThicknessSamplerSampler,
        iridescenceThicknessUV
      ).g
    );
    #endif

    var anisotropyStrength = clamp(pbrMaterial.anisotropyStrength, 0.0, 1.0);
    var anisotropyDirection = normalizeDirection(pbrMaterial.anisotropyDirection);
    #ifdef HAS_ANISOTROPYMAP
    if (pbrMaterial.anisotropyMapEnabled != 0) {
      let anisotropySample = textureSample(
        pbr_anisotropySampler,
        pbr_anisotropySamplerSampler,
        anisotropyUV
      ).rgb;
      anisotropyStrength *= anisotropySample.b;
      let mappedDirection = anisotropySample.rg * 2.0 - 1.0;
      if (length(mappedDirection) > 0.0001) {
        anisotropyDirection = normalize(mappedDirection);
      }
    }
    #endif
    anisotropyDirection = rotateDirection(anisotropyDirection, pbrMaterial.anisotropyRotation);
    var anisotropyTangent =
      normalize(tbn[0] * anisotropyDirection.x + tbn[1] * anisotropyDirection.y);
    if (length(anisotropyTangent) < 0.0001) {
      anisotropyTangent = normalize(tbn[0]);
    }
    // Roughness is authored as perceptual roughness; as is convention,
    // convert to material roughness by squaring the perceptual roughness [2].
    let alphaRoughness = perceptualRoughness * perceptualRoughness;

    let dielectricF0 = getDielectricF0(pbrMaterial.ior);
    var dielectricSpecularF0 = min(
      vec3f(dielectricF0) * specularFactor * specularIntensity,
      vec3f(1.0)
    );
    dielectricSpecularF0 = getIridescenceTint(
      iridescence,
      iridescenceThickness,
      NdotV,
      dielectricSpecularF0
    );
    var diffuseColor = baseColor.rgb * (vec3f(1.0) - dielectricSpecularF0);
    diffuseColor *= (1.0 - metallic) * (1.0 - transmission) * (1.0 - diffuseTransmission);
#ifdef HAS_MATERIAL_SCATTER
    diffuseColor = (baseColor.rgb * (1.0 - metallic) * (1.0 - originalTransmission) +
      multiscatterColor * scatterReflection) * (vec3f(1.0) - dielectricSpecularF0);
#endif
    var specularColor = mix(dielectricSpecularF0, baseColor.rgb, metallic);

    let clearcoatViewFresnel = dielectricSchlick(
      0.04,
      clamp(abs(dot(clearcoatNormal, v)), 0.0, 1.0)
    );
    let sheenDirectionalAlbedo = maxComponent(sheenColor) *
      (0.157 + 0.343 * (1.0 - NdotV)) * (1.0 - sheenRoughness * 0.5);
    let baseLayerEnergy = (1.0 - clearcoatFactor * clearcoatViewFresnel) *
      (1.0 - clamp(sheenDirectionalAlbedo, 0.0, 1.0));
    diffuseColor *= baseLayerEnergy;
    specularColor *= baseLayerEnergy;

    // Compute reflectance.
    let reflectance = max(max(specularColor.r, specularColor.g), specularColor.b);

    // For typical incident reflectance range (between 4% to 100%) set the grazing
    // reflectance to 100% for typical fresnel effect.
    // For very low reflectance range on highly diffuse objects (below 4%),
    // incrementally reduce grazing reflectance to 0%.
    let reflectance90 = clamp(reflectance * 25.0, 0.0, 1.0);
    let specularEnvironmentR0 = specularColor;
    let specularEnvironmentR90 = vec3<f32>(1.0, 1.0, 1.0) * reflectance90;
    let reflection = -normalize(reflect(v, n));

    var pbrInfo = PBRInfo(
      0.0, // NdotL
      NdotV,
      0.0, // NdotH
      0.0, // LdotH
      0.0, // VdotH
      perceptualRoughness,
      metallic,
      specularEnvironmentR0,
      specularEnvironmentR90,
      alphaRoughness,
      diffuseColor,
      specularColor,
      n,
      v,
      n,
      n
    );

    #ifdef USE_LIGHTS
    // Apply ambient light
    PBRInfo_setAmbientLight(&pbrInfo);
    color += calculateMaterialLightColor(
      pbrInfo,
      lighting.ambientColor * pbr_ambientVisibility,
      clearcoatNormal,
      clearcoatFactor,
      clearcoatRoughness,
      sheenColor,
      sheenRoughness,
      anisotropyTangent,
      anisotropyStrength
    );

    // Apply directional light
    for (var i = 0; i < lighting.directionalLightCount; i++) {
      if (i < lighting.directionalLightCount) {
        PBRInfo_setDirectionalLight(&pbrInfo, -lighting_getDirectionalLight(i).direction);
        color += calculateMaterialLightColor(
          pbrInfo,
          lighting_getDirectionalLight(i).color * select(1.0, clamp(directionalVisibility, 0.0, 1.0), i == 0),
          clearcoatNormal,
          clearcoatFactor,
          clearcoatRoughness,
          sheenColor,
          sheenRoughness,
          anisotropyTangent,
          anisotropyStrength
        );
        color += calculateDiffuseTransmissionLight(
          pbrInfo,
          lighting_getDirectionalLight(i).color * select(1.0, clamp(directionalVisibility, 0.0, 1.0), i == 0),
          diffuseTransmissionColor,
          diffuseTransmission,
          multiscatterColor,
          thickness
        );
      }
    }

    // Apply point light
    for (var i = 0; i < lighting.pointLightCount; i++) {
      if (i < lighting.pointLightCount) {
        PBRInfo_setPointLight(&pbrInfo, lighting_getPointLight(i));
        let attenuation = getPointLightAttenuation(
          lighting_getPointLight(i),
          distance(lighting_getPointLight(i).position, fragmentInputs.pbr_vPosition)
        );
        color += calculateMaterialLightColor(
          pbrInfo,
          lighting_getPointLight(i).color * select(1.0, clamp(pointVisibility[min(i, 3)], 0.0, 1.0), i < 4) / attenuation,
          clearcoatNormal,
          clearcoatFactor,
          clearcoatRoughness,
          sheenColor,
          sheenRoughness,
          anisotropyTangent,
          anisotropyStrength
        );
        color += calculateDiffuseTransmissionLight(
          pbrInfo,
          lighting_getPointLight(i).color * select(1.0, clamp(pointVisibility[min(i, 3)], 0.0, 1.0), i < 4) / attenuation,
          diffuseTransmissionColor,
          diffuseTransmission,
          multiscatterColor,
          thickness
        );
      }
    }

    for (var i = 0; i < lighting.spotLightCount; i++) {
      if (i < lighting.spotLightCount) {
        PBRInfo_setSpotLight(&pbrInfo, lighting_getSpotLight(i));
        let attenuation = getSpotLightAttenuation(lighting_getSpotLight(i), fragmentInputs.pbr_vPosition);
        color += calculateMaterialLightColor(
          pbrInfo,
          lighting_getSpotLight(i).color * select(1.0, clamp(spotVisibility[min(i, 3)], 0.0, 1.0), i < 4) / attenuation,
          clearcoatNormal,
          clearcoatFactor,
          clearcoatRoughness,
          sheenColor,
          sheenRoughness,
          anisotropyTangent,
          anisotropyStrength
        );
        color += calculateDiffuseTransmissionLight(
          pbrInfo,
          lighting_getSpotLight(i).color * select(1.0, clamp(spotVisibility[min(i, 3)], 0.0, 1.0), i < 4) / attenuation,
          diffuseTransmissionColor,
          diffuseTransmission,
          multiscatterColor,
          thickness
        );
      }
    }
      for (var areaIndex: i32 = 0; areaIndex < areaLighting_getLightCount(); areaIndex++) {
#ifdef USE_AREA_LIGHT_LTC
        // Unsupported fits retain numerical integration rather than silently dropping material lobes.
        if (anisotropyStrength <= 0.0001 && dot(sheenColor, sheenColor) <= 0.000001 && diffuseTransmission <= 0.0001) {
        color += areaLTC_evaluate(areaIndex, fragmentInputs.pbr_vPosition, pbrInfo.n, pbrInfo.v, pbrInfo.perceptualRoughness, pbrInfo.diffuseColor, pbrInfo.reflectance0, pbrInfo.reflectance90);
        color += clearcoatFactor * areaLTC_specular(areaLighting_getLight(areaIndex), fragmentInputs.pbr_vPosition, clearcoatNormal, pbrInfo.v, clearcoatRoughness, vec3f(0.04), vec3f(1.0));
        } else {
        for (var sampleIndex: i32 = 0; sampleIndex < areaLighting.sampleCount; sampleIndex++) {
          let sampleLight = areaLighting_getSample(areaIndex, sampleIndex, fragmentInputs.pbr_vPosition);
          if (dot(sampleLight.color, sampleLight.color) > 0.0) {
            PBRInfo_setPointLight(&pbrInfo, sampleLight);
            color += calculateMaterialLightColor(pbrInfo, sampleLight.color, clearcoatNormal,
              clearcoatFactor, clearcoatRoughness, sheenColor, sheenRoughness, anisotropyTangent, anisotropyStrength);
            color += calculateDiffuseTransmissionLight(pbrInfo, sampleLight.color,
              diffuseTransmissionColor, diffuseTransmission, multiscatterColor, thickness);
          }
        }

        }
#else
        for (var sampleIndex: i32 = 0; sampleIndex < areaLighting.sampleCount; sampleIndex++) {
          let sampleLight = areaLighting_getSample(areaIndex, sampleIndex, fragmentInputs.pbr_vPosition);
          if (dot(sampleLight.color, sampleLight.color) > 0.0) {
            PBRInfo_setPointLight(&pbrInfo, sampleLight);
            color += calculateMaterialLightColor(pbrInfo, sampleLight.color, clearcoatNormal,
              clearcoatFactor, clearcoatRoughness, sheenColor, sheenRoughness, anisotropyTangent, anisotropyStrength);
            color += calculateDiffuseTransmissionLight(pbrInfo, sampleLight.color,
              diffuseTransmissionColor, diffuseTransmission, multiscatterColor, thickness);
          }
        }

#endif
      }
    #endif

    let indirectBaseColor = color;
    // Calculate lighting contribution from image based lighting source (IBL)
    #ifdef USE_IBL
    if (pbrMaterial.IBLenabled != 0) {
      color += getIBLContribution(
        pbrInfo,
        n,
        getAnisotropicReflection(pbrInfo, anisotropyTangent, anisotropyStrength)
      );
      color += calculateClearcoatIBLContribution(
        pbrInfo,
        clearcoatNormal,
        -normalize(reflect(v, clearcoatNormal)),
        clearcoatFactor,
        clearcoatRoughness
      );
      color += calculateDiffuseTransmissionIBL(
        pbrInfo,
        diffuseTransmissionColor,
        diffuseTransmission,
        multiscatterColor,
        thickness
      );
      color += sheenColor * pbrMaterial.scaleIBLAmbient.x * (1.0 - sheenRoughness) * 0.25;
    }
    #endif

#ifdef HAS_MATERIAL_SCATTER
    color += (baseColor.rgb * (1.0 - metallic) * (1.0 - originalTransmission) +
      multiscatterColor * scatterReflection) * baseLayerEnergy * lightmapIrradiance / M_PI;
#else
    color += baseColor.rgb * (1.0 - metallic) * (1.0 - transmission) *
      (1.0 - diffuseTransmission) * baseLayerEnergy * lightmapIrradiance / M_PI;
#endif

    color = indirectBaseColor + (color - indirectBaseColor) * pbr_ambientVisibility;

    // Apply optional PBR terms for additional (optional) shading
    #ifdef HAS_OCCLUSIONMAP
    if (pbrMaterial.occlusionMapEnabled != 0) {
      let ao = textureSample(pbr_occlusionSampler, pbr_occlusionSamplerSampler, occlusionUV).r;
      color = mix(color, color * ao, pbrMaterial.occlusionStrength);
    }
    #endif

    var emissive = pbrMaterial.emissiveFactor;
    #ifdef HAS_EMISSIVEMAP
    if (pbrMaterial.emissiveMapEnabled != 0u) {
      emissive *= SRGBtoLINEAR(
        textureSample(pbr_emissiveSampler, pbr_emissiveSamplerSampler, emissiveUV)
      ).rgb;
    }
    #endif
    color += emissive * pbrMaterial.emissiveStrength;

    if (transmission > 0.0) {
      #ifdef USE_TRANSMISSION_FRAMEBUFFER
      let dielectricFresnel = getDielectricF0(pbrMaterial.ior);
      let transmissionFresnel = dielectricFresnel +
        (1.0 - dielectricFresnel) * pow(1.0 - NdotV, 5.0);
      let transmittedColor = getTransmittedSceneColor(
        fragmentInputs.pbr_vPosition,
        n,
        v,
        thickness,
        perceptualRoughness
      );
      color += transmittedColor * getVolumeAttenuation(thickness) *
        transmission * (1.0 - transmissionFresnel);
      #else
      color = mix(color, color * getVolumeAttenuation(thickness), transmission);
      #endif
    }

    // This section uses mix to override final color for reference app visualization
    // of various parameters in the lighting equation.
    #ifdef PBR_DEBUG
    // TODO: Figure out how to debug multiple lights

    // color = mix(color, F, pbr_scaleFGDSpec.x);
    // color = mix(color, vec3(G), pbr_scaleFGDSpec.y);
    // color = mix(color, vec3(D), pbr_scaleFGDSpec.z);
    // color = mix(color, specContrib, pbr_scaleFGDSpec.w);

    // color = mix(color, diffuseContrib, pbr_scaleDiffBaseMR.x);
    color = mix(color, baseColor.rgb, pbrMaterial.scaleDiffBaseMR.y);
    color = mix(color, vec3<f32>(metallic), pbrMaterial.scaleDiffBaseMR.z);
    color = mix(color, vec3<f32>(perceptualRoughness), pbrMaterial.scaleDiffBaseMR.w);
    #endif
  }

  #ifdef USE_TRANSMISSION_FRAMEBUFFER
  let alpha = clamp(baseColor.a, 0.0, 1.0);
  #else
  let alpha = clamp(baseColor.a * (1.0 - transmission), 0.0, 1.0);
  #endif
  return vec4<f32>(applySceneColorManagement(color), alpha);
}

// Depth-only passes use the same base-color alpha, vertex color and UV transform.
fn pbr_discardMaskedFragment(vertexColor: vec4f) {
#ifdef ALPHA_CUTOFF
  var alpha = pbrMaterial.baseColorFactor.a * vertexColor.a;
#ifdef HAS_BASECOLORMAP
  alpha *= textureSample(pbr_baseColorSampler, pbr_baseColorSamplerSampler, getMaterialUV(pbrMaterial.baseColorUVSet, pbrMaterial.baseColorUVTransform)).a;
#endif
  if (alpha < pbrMaterial.alphaCutoff) {discard;}
#endif
}

fn pbr_filterColorWithSpotShadows(vertexColor: vec4f, spotVisibility: vec4f) -> vec4f {
  return pbr_filterColorWithShadows(vertexColor, 1.0, vec4f(1.0), spotVisibility);
}

fn pbr_filterColor(vertexColor: vec4<f32>) -> vec4<f32> {
  return pbr_filterColorWithSpotShadows(vertexColor, vec4f(1.0));
}
`,d=`\
layout(std140) uniform pbrProjectionUniforms {
  mat4 modelViewProjectionMatrix;
  mat4 modelMatrix;
  mat4 normalMatrix;
  vec3 camera;
} pbrProjection;
`,g=`\
struct pbrProjectionUniforms {
  modelViewProjectionMatrix: mat4x4<f32>,
  modelMatrix: mat4x4<f32>,
  normalMatrix: mat4x4<f32>,
  camera: vec3<f32>
};

@group(0) @binding(auto) var<uniform> pbrProjection: pbrProjectionUniforms;
`,b=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],v=`\
layout(std140) uniform pbrSceneUniforms {
  float exposure;
  highp int toneMapMode;
  float environmentIntensity;
  float environmentRotation;
  float environmentMipCount;
  highp int outputEncoding;
  vec2 framebufferSize;
  mat4 viewMatrix;
  mat4 projectionMatrix;
} pbrScene;

#ifdef USE_TRANSMISSION_FRAMEBUFFER
uniform sampler2D pbr_transmissionFramebufferSampler;
#endif
`,S=`\
struct pbrSceneUniforms {
  exposure: f32,
  toneMapMode: i32,
  environmentIntensity: f32,
  environmentRotation: f32,
  environmentMipCount: f32,
  outputEncoding: i32,
  framebufferSize: vec2<f32>,
  viewMatrix: mat4x4<f32>,
  projectionMatrix: mat4x4<f32>
};

@group(1) @binding(auto) var<uniform> pbrScene: pbrSceneUniforms;

#ifdef USE_TRANSMISSION_FRAMEBUFFER
@group(1) @binding(auto) var pbr_transmissionFramebufferSampler: texture_2d<f32>;
@group(1) @binding(auto) var pbr_transmissionFramebufferSamplerSampler: sampler;
#endif
`,_={props:{},uniforms:{},defaultUniforms:{unlit:!1,baseColorMapEnabled:!1,baseColorFactor:[1,1,1,1],normalMapEnabled:!1,normalScale:1,emissiveMapEnabled:!1,lightmapMapEnabled:!1,emissiveFactor:[0,0,0],metallicRoughnessValues:[1,1],metallicRoughnessMapEnabled:!1,occlusionMapEnabled:!1,occlusionStrength:1,alphaCutoffEnabled:!1,alphaCutoff:.5,IBLenabled:!1,scaleIBLAmbient:[1,1],scaleDiffBaseMR:[0,0,0,0],scaleFGDSpec:[0,0,0,0],specularColorFactor:[1,1,1],specularIntensityFactor:1,specularColorMapEnabled:!1,specularIntensityMapEnabled:!1,ior:1.5,transmissionFactor:0,transmissionMapEnabled:!1,thicknessFactor:0,attenuationDistance:1e9,attenuationColor:[1,1,1],clearcoatFactor:0,clearcoatRoughnessFactor:0,clearcoatMapEnabled:!1,clearcoatRoughnessMapEnabled:!1,sheenColorFactor:[0,0,0],sheenRoughnessFactor:0,sheenColorMapEnabled:!1,sheenRoughnessMapEnabled:!1,iridescenceFactor:0,iridescenceIor:1.3,iridescenceThicknessRange:[100,400],iridescenceMapEnabled:!1,anisotropyStrength:0,anisotropyRotation:0,anisotropyDirection:[1,0],anisotropyMapEnabled:!1,emissiveStrength:1,lightmapIntensity:1,scatterStrengthFactor:0,dispersion:0,baseColorUVSet:0,baseColorUVTransform:[1,0,0,0,1,0,0,0,1],metallicRoughnessUVSet:0,metallicRoughnessUVTransform:[1,0,0,0,1,0,0,0,1],normalUVSet:0,normalUVTransform:[1,0,0,0,1,0,0,0,1],occlusionUVSet:0,occlusionUVTransform:[1,0,0,0,1,0,0,0,1],emissiveUVSet:0,lightmapUVSet:0,emissiveUVTransform:[1,0,0,0,1,0,0,0,1],lightmapUVTransform:[1,0,0,0,1,0,0,0,1],specularColorUVSet:0,specularColorUVTransform:[1,0,0,0,1,0,0,0,1],specularIntensityUVSet:0,specularIntensityUVTransform:[1,0,0,0,1,0,0,0,1],transmissionUVSet:0,transmissionUVTransform:[1,0,0,0,1,0,0,0,1],thicknessUVSet:0,thicknessUVTransform:[1,0,0,0,1,0,0,0,1],clearcoatUVSet:0,clearcoatUVTransform:[1,0,0,0,1,0,0,0,1],clearcoatRoughnessUVSet:0,clearcoatRoughnessUVTransform:[1,0,0,0,1,0,0,0,1],clearcoatNormalUVSet:0,clearcoatNormalUVTransform:[1,0,0,0,1,0,0,0,1],sheenColorUVSet:0,sheenColorUVTransform:[1,0,0,0,1,0,0,0,1],sheenRoughnessUVSet:0,sheenRoughnessUVTransform:[1,0,0,0,1,0,0,0,1],iridescenceUVSet:0,iridescenceUVTransform:[1,0,0,0,1,0,0,0,1],iridescenceThicknessUVSet:0,iridescenceThicknessUVTransform:[1,0,0,0,1,0,0,0,1],anisotropyUVSet:0,anisotropyUVTransform:[1,0,0,0,1,0,0,0,1],bumpFactor:1,bumpMapEnabled:!1,diffuseTransmissionFactor:0,diffuseTransmissionMapEnabled:!1,diffuseTransmissionColorFactor:[1,1,1],diffuseTransmissionColorMapEnabled:!1,multiscatterColorFactor:[0,0,0],multiscatterColorMapEnabled:!1,scatterAnisotropy:0,bumpUVSet:0,bumpUVTransform:[1,0,0,0,1,0,0,0,1],diffuseTransmissionUVSet:0,diffuseTransmissionUVTransform:[1,0,0,0,1,0,0,0,1],diffuseTransmissionColorUVSet:0,diffuseTransmissionColorUVTransform:[1,0,0,0,1,0,0,0,1],multiscatterColorUVSet:0,multiscatterColorUVTransform:[1,0,0,0,1,0,0,0,1]},name:"pbrMaterial",firstBindingSlot:0,bindingLayout:[{name:"pbrMaterial",group:3},{name:"pbr_baseColorSampler",group:3},{name:"pbr_normalSampler",group:3},{name:"pbr_emissiveSampler",group:3},{name:"pbr_lightmapSampler",group:3},{name:"pbr_metallicRoughnessSampler",group:3},{name:"pbr_occlusionSampler",group:3},{name:"pbr_specularColorSampler",group:3},{name:"pbr_specularIntensitySampler",group:3},{name:"pbr_transmissionSampler",group:3},{name:"pbr_thicknessSampler",group:3},{name:"pbr_clearcoatSampler",group:3},{name:"pbr_clearcoatRoughnessSampler",group:3},{name:"pbr_clearcoatNormalSampler",group:3},{name:"pbr_sheenColorSampler",group:3},{name:"pbr_sheenRoughnessSampler",group:3},{name:"pbr_iridescenceSampler",group:3},{name:"pbr_iridescenceThicknessSampler",group:3},{name:"pbr_anisotropySampler",group:3},{name:"pbr_bumpSampler",group:3},{name:"pbr_diffuseTransmissionSampler",group:3},{name:"pbr_diffuseTransmissionColorSampler",group:3},{name:"pbr_multiscatterColorSampler",group:3}],dependencies:[a.x,u,{name:"ibl",firstBindingSlot:32,bindingLayout:[{name:"pbr_diffuseEnvSampler",group:2},{name:"pbr_specularEnvSampler",group:2},{name:"pbr_brdfLUT",group:2}],source:r,vs:n,fs:n},{name:"pbrProjection",bindingLayout:[{name:"pbrProjection",group:0}],source:g,vs:d,fs:d,getUniforms:e=>e,uniformTypes:{modelViewProjectionMatrix:"mat4x4<f32>",modelMatrix:"mat4x4<f32>",normalMatrix:"mat4x4<f32>",camera:"vec3<f32>"}},{name:"pbrScene",bindingLayout:[{name:"pbrScene",group:1},{name:"pbr_transmissionFramebufferSampler",group:1}],source:S,vs:v,fs:v,getUniforms:e=>e,uniformTypes:{exposure:"f32",toneMapMode:"i32",environmentIntensity:"f32",environmentRotation:"f32",environmentMipCount:"f32",outputEncoding:"i32",framebufferSize:"vec2<f32>",viewMatrix:"mat4x4<f32>",projectionMatrix:"mat4x4<f32>"},defaultUniforms:{exposure:1,toneMapMode:2,environmentIntensity:1,environmentRotation:.5*Math.PI,environmentMipCount:1,outputEncoding:1,framebufferSize:[1,1],viewMatrix:b,projectionMatrix:b}}],source:m,vs:p,fs:h,defines:{LIGHTING_FRAGMENT:!0,HAS_NORMALMAP:!1,HAS_EMISSIVEMAP:!1,HAS_LIGHTMAP:!1,HAS_OCCLUSIONMAP:!1,HAS_BASECOLORMAP:!1,HAS_METALROUGHNESSMAP:!1,HAS_SPECULARCOLORMAP:!1,HAS_SPECULARINTENSITYMAP:!1,HAS_TRANSMISSIONMAP:!1,HAS_THICKNESSMAP:!1,HAS_CLEARCOATMAP:!1,HAS_CLEARCOATROUGHNESSMAP:!1,HAS_CLEARCOATNORMALMAP:!1,HAS_SHEENCOLORMAP:!1,HAS_SHEENROUGHNESSMAP:!1,HAS_IRIDESCENCEMAP:!1,HAS_IRIDESCENCETHICKNESSMAP:!1,HAS_ANISOTROPYMAP:!1,HAS_BUMPMAP:!1,HAS_DIFFUSETRANSMISSIONMAP:!1,HAS_DIFFUSETRANSMISSIONCOLORMAP:!1,HAS_MULTISCATTERCOLORMAP:!1,USE_MATERIAL_EXTENSIONS:!1,ALPHA_CUTOFF:!1,USE_IBL:!1,PBR_DEBUG:!1},getUniforms:e=>e,uniformTypes:{unlit:"i32",baseColorMapEnabled:"i32",baseColorFactor:"vec4<f32>",normalMapEnabled:"i32",normalScale:"f32",emissiveMapEnabled:"i32",emissiveFactor:"vec3<f32>",metallicRoughnessValues:"vec2<f32>",metallicRoughnessMapEnabled:"i32",occlusionMapEnabled:"i32",occlusionStrength:"f32",alphaCutoffEnabled:"i32",alphaCutoff:"f32",specularColorFactor:"vec3<f32>",specularIntensityFactor:"f32",specularColorMapEnabled:"i32",specularIntensityMapEnabled:"i32",ior:"f32",transmissionFactor:"f32",transmissionMapEnabled:"i32",thicknessFactor:"f32",attenuationDistance:"f32",attenuationColor:"vec3<f32>",clearcoatFactor:"f32",clearcoatRoughnessFactor:"f32",clearcoatMapEnabled:"i32",clearcoatRoughnessMapEnabled:"i32",sheenColorFactor:"vec3<f32>",sheenRoughnessFactor:"f32",sheenColorMapEnabled:"i32",sheenRoughnessMapEnabled:"i32",iridescenceFactor:"f32",iridescenceIor:"f32",iridescenceThicknessRange:"vec2<f32>",iridescenceMapEnabled:"i32",anisotropyStrength:"f32",anisotropyRotation:"f32",anisotropyDirection:"vec2<f32>",anisotropyMapEnabled:"i32",emissiveStrength:"f32",dispersion:"f32",IBLenabled:"i32",scaleIBLAmbient:"vec2<f32>",scaleDiffBaseMR:"vec4<f32>",scaleFGDSpec:"vec4<f32>",baseColorUVSet:"i32",baseColorUVTransform:"mat3x3<f32>",metallicRoughnessUVSet:"i32",metallicRoughnessUVTransform:"mat3x3<f32>",normalUVSet:"i32",normalUVTransform:"mat3x3<f32>",occlusionUVSet:"i32",occlusionUVTransform:"mat3x3<f32>",emissiveUVSet:"i32",emissiveUVTransform:"mat3x3<f32>",specularColorUVSet:"i32",specularColorUVTransform:"mat3x3<f32>",specularIntensityUVSet:"i32",specularIntensityUVTransform:"mat3x3<f32>",transmissionUVSet:"i32",transmissionUVTransform:"mat3x3<f32>",thicknessUVSet:"i32",thicknessUVTransform:"mat3x3<f32>",clearcoatUVSet:"i32",clearcoatUVTransform:"mat3x3<f32>",clearcoatRoughnessUVSet:"i32",clearcoatRoughnessUVTransform:"mat3x3<f32>",clearcoatNormalUVSet:"i32",clearcoatNormalUVTransform:"mat3x3<f32>",sheenColorUVSet:"i32",sheenColorUVTransform:"mat3x3<f32>",sheenRoughnessUVSet:"i32",sheenRoughnessUVTransform:"mat3x3<f32>",iridescenceUVSet:"i32",iridescenceUVTransform:"mat3x3<f32>",iridescenceThicknessUVSet:"i32",iridescenceThicknessUVTransform:"mat3x3<f32>",anisotropyUVSet:"i32",anisotropyUVTransform:"mat3x3<f32>",bumpFactor:"f32",bumpMapEnabled:"i32",diffuseTransmissionFactor:"f32",diffuseTransmissionMapEnabled:"i32",diffuseTransmissionColorFactor:"vec3<f32>",diffuseTransmissionColorMapEnabled:"i32",multiscatterColorFactor:"vec3<f32>",multiscatterColorMapEnabled:"i32",scatterAnisotropy:"f32",bumpUVSet:"i32",bumpUVTransform:"mat3x3<f32>",diffuseTransmissionUVSet:"i32",diffuseTransmissionUVTransform:"mat3x3<f32>",diffuseTransmissionColorUVSet:"i32",diffuseTransmissionColorUVTransform:"mat3x3<f32>",multiscatterColorUVSet:"i32",multiscatterColorUVTransform:"mat3x3<f32>",lightmapMapEnabled:"i32",lightmapIntensity:"f32",lightmapUVSet:"i32",lightmapUVTransform:"mat3x3<f32>",scatterStrengthFactor:"f32"}}}}]);