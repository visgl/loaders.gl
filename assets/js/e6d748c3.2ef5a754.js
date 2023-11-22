"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([[7161],{93613:(e,n,s)=>{s.r(n),s.d(n,{assets:()=>r,contentTitle:()=>o,default:()=>h,frontMatter:()=>t,metadata:()=>d,toc:()=>a});var l=s(85893),i=s(11151);const t={},o="Development Environment",d={id:"developer-guide/dev-env",title:"Development Environment",description:"The master branch is the active development branch.",source:"@site/../docs/developer-guide/dev-env.md",sourceDirName:"developer-guide",slug:"/developer-guide/dev-env",permalink:"/docs/developer-guide/dev-env",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/loaders.gl/tree/master/website/../docs/developer-guide/dev-env.md",tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"Handling Errors",permalink:"/docs/developer-guide/error-handling"},next:{title:"Preferred JavaScript APIs",permalink:"/docs/developer-guide/concepts/javascript-apis"}},r={},a=[{value:"Running Tests",id:"running-tests",level:2},{value:"Environment Setup",id:"environment-setup",level:2},{value:"Develop on Windows",id:"develop-on-windows",level:3},{value:"Develop on Linux",id:"develop-on-linux",level:3},{value:"Appendix: Installing JavaScript Development Tools",id:"appendix-installing-javascript-development-tools",level:2},{value:"Install Node and NPM using NVM (recommended)",id:"install-node-and-npm-using-nvm-recommended",level:3},{value:"Optional: Install Node and NPM manually",id:"optional-install-node-and-npm-manually",level:4},{value:"Install yarn",id:"install-yarn",level:3},{value:"Install jq",id:"install-jq",level:3},{value:"Install build-essential package",id:"install-build-essential-package",level:3}];function c(e){const n={a:"a",code:"code",h1:"h1",h2:"h2",h3:"h3",h4:"h4",li:"li",p:"p",pre:"pre",strong:"strong",ul:"ul",...(0,i.a)(),...e.components};return(0,l.jsxs)(l.Fragment,{children:[(0,l.jsx)(n.h1,{id:"development-environment",children:"Development Environment"}),"\n",(0,l.jsxs)(n.p,{children:["The ",(0,l.jsx)(n.strong,{children:"master"})," branch is the active development branch."]}),"\n",(0,l.jsxs)(n.p,{children:["Building loaders.gl locally from the source requires node.js ",(0,l.jsx)(n.code,{children:">=10"}),".\nWe use ",(0,l.jsx)(n.a,{href:"https://yarnpkg.com/en/docs/install",children:"yarn classic"})," to manage the dependencies."]}),"\n",(0,l.jsx)(n.pre,{children:(0,l.jsx)(n.code,{className:"language-bash",children:"git checkout master\nyarn\nyarn bootstrap\n"})}),"\n",(0,l.jsx)(n.h2,{id:"running-tests",children:"Running Tests"}),"\n",(0,l.jsxs)(n.ul,{children:["\n",(0,l.jsxs)(n.li,{children:[(0,l.jsx)(n.code,{children:"yarn bootstrap"}),": Install and build workers etc. Run every time you pull a new branch."]}),"\n",(0,l.jsxs)(n.li,{children:[(0,l.jsx)(n.code,{children:"yarn lint"}),": Check coding standards and formatting"]}),"\n",(0,l.jsxs)(n.li,{children:[(0,l.jsx)(n.code,{children:"yarn lint fix"}),": Fix errors with formatting"]}),"\n",(0,l.jsxs)(n.li,{children:[(0,l.jsx)(n.code,{children:"yarn test node"}),": Quick test run under Node.js"]}),"\n",(0,l.jsxs)(n.li,{children:[(0,l.jsx)(n.code,{children:"yarn test browser"}),": Test run under browser, good for interactive debugging"]}),"\n",(0,l.jsxs)(n.li,{children:[(0,l.jsx)(n.code,{children:"yarn test"}),": Run lint, node test, browser tests (in headless mode)"]}),"\n"]}),"\n",(0,l.jsx)(n.h2,{id:"environment-setup",children:"Environment Setup"}),"\n",(0,l.jsx)(n.p,{children:"Note that our primary development environment is MacOS, but it is also possible to build loaders.gl on Linux and Windows."}),"\n",(0,l.jsx)(n.h3,{id:"develop-on-windows",children:"Develop on Windows"}),"\n",(0,l.jsx)(n.p,{children:"It is possible to build loaders.gl on Windows 10, but not directly in the Windows command prompt. You will need to install a Linux command line environment."}),"\n",(0,l.jsxs)(n.p,{children:["First, install ",(0,l.jsx)(n.a,{href:"https://docs.microsoft.com/en-us/windows/wsl/install-win10",children:"WSL (Windows Subsystem for Linux)"})," on Windows 10, and follow the ",(0,l.jsx)(n.a,{href:"#develop-on-linux",children:"Linux"})," directions."]}),"\n",(0,l.jsx)(n.p,{children:"Note that you may also need to make some decisions on where to place your code and whether to link the linux subsystem to your windows drives."}),"\n",(0,l.jsx)(n.p,{children:"Once this is done, follow the instructions for developing on Linux."}),"\n",(0,l.jsx)(n.h3,{id:"develop-on-linux",children:"Develop on Linux"}),"\n",(0,l.jsx)(n.p,{children:"On Linux systems, the following packages are necessary for running webgl-based headless render tests."}),"\n",(0,l.jsxs)(n.ul,{children:["\n",(0,l.jsx)(n.li,{children:"mesa-utils"}),"\n",(0,l.jsx)(n.li,{children:"xvfb"}),"\n",(0,l.jsx)(n.li,{children:"libgl1-mesa-dri"}),"\n",(0,l.jsx)(n.li,{children:"libglapi-mesa"}),"\n",(0,l.jsx)(n.li,{children:"libosmesa6"}),"\n",(0,l.jsx)(n.li,{children:"libxi-dev"}),"\n"]}),"\n",(0,l.jsxs)(n.p,{children:["To get the headless tests working: ",(0,l.jsx)(n.code,{children:"export DISPLAY=:99.0; sh -e /etc/init.d/xvfb start"})]}),"\n",(0,l.jsx)(n.h2,{id:"appendix-installing-javascript-development-tools",children:"Appendix: Installing JavaScript Development Tools"}),"\n",(0,l.jsx)(n.p,{children:"You will of course need to install the basic JavaScript development tools. Unless you are new to JavaScript development you most likely already have these in place. The following should work on a linux system."}),"\n",(0,l.jsx)(n.h3,{id:"install-node-and-npm-using-nvm-recommended",children:"Install Node and NPM using NVM (recommended)"}),"\n",(0,l.jsxs)(n.ul,{children:["\n",(0,l.jsx)(n.li,{children:(0,l.jsx)(n.code,{children:"https://www.liquidweb.com/kb/how-to-install-nvm-node-version-manager-for-node-js-on-ubuntu-12-04-lts/"})}),"\n",(0,l.jsx)(n.li,{children:(0,l.jsx)(n.code,{children:"https://github.com/nvm-sh/nvm#install--update-script"})}),"\n",(0,l.jsx)(n.li,{children:(0,l.jsx)(n.code,{children:"https://github.com/nvm-sh/nvm/releases"})}),"\n"]}),"\n",(0,l.jsx)(n.pre,{children:(0,l.jsx)(n.code,{className:"language-bash",children:"nvm install 16\nnvm use 16\n"})}),"\n",(0,l.jsx)(n.p,{children:"(Node 16 is currently recommeded for building and development of loaders 3.3. NPM comes with the NodeJS in this case)"}),"\n",(0,l.jsx)(n.h4,{id:"optional-install-node-and-npm-manually",children:"Optional: Install Node and NPM manually"}),"\n",(0,l.jsx)(n.pre,{children:(0,l.jsx)(n.code,{className:"language-bash",children:"sudo apt update\nsudo apt install nodejs\nsudo apt install npm\n"})}),"\n",(0,l.jsx)(n.h3,{id:"install-yarn",children:"Install yarn"}),"\n",(0,l.jsxs)(n.p,{children:[(0,l.jsx)(n.a,{href:"https://www.hostinger.com/tutorials/how-to-install-yarn-on-ubuntu/",children:"https://www.hostinger.com/tutorials/how-to-install-yarn-on-ubuntu/"}),"\n(yarn version needed is 1.22.19 or the latest stable 1.xx.xx)"]}),"\n",(0,l.jsx)(n.pre,{children:(0,l.jsx)(n.code,{className:"language-bash",children:"sudo apt update\nsudo apt install yarn nodejs\nyarn \u2013version\n"})}),"\n",(0,l.jsx)(n.h3,{id:"install-jq",children:"Install jq"}),"\n",(0,l.jsx)(n.pre,{children:(0,l.jsx)(n.code,{className:"language-bash",children:"sudo apt-get install jq\n"})}),"\n",(0,l.jsx)(n.h3,{id:"install-build-essential-package",children:"Install build-essential package"}),"\n",(0,l.jsx)(n.p,{children:"This step might be required for some systems that do not have required packages pre-installed."}),"\n",(0,l.jsx)(n.pre,{children:(0,l.jsx)(n.code,{className:"language-bash",children:"sudo apt-get install build-essential\n"})})]})}function h(e={}){const{wrapper:n}={...(0,i.a)(),...e.components};return n?(0,l.jsx)(n,{...e,children:(0,l.jsx)(c,{...e})}):c(e)}},11151:(e,n,s)=>{s.d(n,{Z:()=>d,a:()=>o});var l=s(67294);const i={},t=l.createContext(i);function o(e){const n=l.useContext(t);return l.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function d(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(i):e.components||i:o(e.components),l.createElement(t.Provider,{value:n},e.children)}}}]);