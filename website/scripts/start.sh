#!/bin/bash
set -e

bash scripts/prepare-assets.sh

exec docusaurus start "$@"
