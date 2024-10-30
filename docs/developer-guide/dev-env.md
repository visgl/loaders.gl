# Development Environment

The **master** branch is the active development branch.

Building loaders.gl locally from the source requires node.js `>=10`.
We use [yarn classic](https://yarnpkg.com/en/docs/install) to manage the dependencies.

```bash
git checkout master
yarn
yarn bootstrap
```

## Running Tests

- `yarn bootstrap`: Install and build workers etc. Run every time you pull a new branch.
- `yarn lint`: Check coding standards and formatting
- `yarn lint fix`: Fix errors with formatting
- `yarn test node`: Quick test run under Node.js
- `yarn test browser`: Test run under browser, good for interactive debugging
- `yarn test`: Run lint, node test, browser tests (in headless mode)

## Environment Setup

Note that our primary development environment is MacOS, but it is also possible to build loaders.gl on Linux and Windows.

### Develop on Windows

It is possible to build loaders.gl on Windows 10, but not directly in the Windows command prompt. You will need to install a Linux command line environment.

First, install [WSL (Windows Subsystem for Linux)](https://docs.microsoft.com/en-us/windows/wsl/install-win10) on Windows 10, and follow the [Linux](#develop-on-linux) directions.

Note that you may also need to make some decisions on where to place your code and whether to link the linux subsystem to your windows drives.

Once this is done, follow the instructions for developing on Linux.

### Develop on Linux

On Linux systems, the following packages are necessary for running webgl-based headless render tests.

- mesa-utils
- xvfb
- libgl1-mesa-dri
- libglapi-mesa
- libosmesa6
- libxi-dev

To get the headless tests working: `export DISPLAY=:99.0; sh -e /etc/init.d/xvfb start`

## Appendix: Installing JavaScript Development Tools

You will of course need to install the basic JavaScript development tools. Unless you are new to JavaScript development you most likely already have these in place. The following should work on a linux system.

### Install Node and NPM using NVM (recommended)

- `https://www.liquidweb.com/kb/how-to-install-nvm-node-version-manager-for-node-js-on-ubuntu-12-04-lts/`
- `https://github.com/nvm-sh/nvm#install--update-script`
- `https://github.com/nvm-sh/nvm/releases`

```bash
nvm install 16
nvm use 16
```

(Node 16 is currently recommeded for building and development of loaders 3.3. NPM comes with the NodeJS in this case)

#### Optional: Install Node and NPM manually

```bash
sudo apt update
sudo apt install nodejs
sudo apt install npm
```

### Install yarn

https://www.hostinger.com/tutorials/how-to-install-yarn-on-ubuntu/
(yarn version needed is 1.22.19 or the latest stable 1.xx.xx)

```bash
sudo apt update
sudo apt install yarn nodejs
yarn –version
```

### Install jq

```bash
sudo apt-get install jq
```

### Install build-essential package

This step might be required for some systems that do not have required packages pre-installed.

```bash
sudo apt-get install build-essential
```
