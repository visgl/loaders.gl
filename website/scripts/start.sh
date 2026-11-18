#!/bin/bash
set -e

bash scripts/prepare-assets.sh

export LOADERS_GL_WEBSITE_DEV=true
exec docusaurus start "$@"
