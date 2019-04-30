# Contributing

Contributions are welcome, assuming that they align with the general design goals and philosophy of the repo.

Unless you just want to contribute a small bug fix, it is a good idea to start by opening an issue and discuss your idea with the maintainers. This maximizes the chances that your contribution will be accepted once you open a pull request.


## Configuring Your Development Environment

To contribute, you will likely want to clone the loaders.gl repository and make sure you can install, build and run tests.

Our primary development environment is MacOS, but it is possible to build loaders.gl on Linux and Windows (using a Linux environment).


### Setting up Linux Environment on Windows 10

Install [WSL (Windows Subsystem for Linux)](https://docs.microsoft.com/en-us/windows/wsl/install-win10) on Windows 10.


### Install Node and NPM

```sh
sudo apt update
sudo apt install nodejs
```

### Option: Install NVM

- `https://www.liquidweb.com/kb/how-to-install-nvm-node-version-manager-for-node-js-on-ubuntu-12-04-lts/`
- `https://github.com/nvm-sh/nvm/releases`

### Install yarn

https://www.hostinger.com/tutorials/how-to-install-yarn-on-ubuntu/

```sh
sudo apt update
sudo apt install yarn nodejs
yarn –version
```

### Install jq

```sh
sudo apt-get install jq
```

### Configuring your System

On Linux Systems Install packages

- mesa-utils
- xvfb
- libgl1-mesa-dri
- libglapi-mesa
- libosmesa6
- libxi-dev

To get the headless tests working: export DISPLAY=:99.0; sh -e /etc/init.d/xvfb start


## Running Tests

- `yarn lint`: Check coding standards and formatting
- `yarn lint fix`: Fix errors with formatting
- `yarn test node`: Quick test run under Node.js
- `yarn test browser`: Test run under browser, good for interactive debugging
- `yarn test`: Run lint, node test, browser tests (in headless mode)
