# Docker image for tile-converter module
# -----------------------------
# To build a docker image, run in the root folder of the repository:
# docker build -t loaders -f modules/tile-converter/Dockerfile .
#
# Use the image to convert tileset:
# docker run --rm \
#   -v /path/to/output_folder:/loaders-bundle/data \
#   loaders \
#   --input-type 3dtiles \
#   --token ... \
#   --tileset ... \
#   --name ... \
#   --output data \
#   --max-depth 3
#
# Description of arguments:
# --rm              Remove container after conversion
# -v                Create docker volume, linked to internal data folder
# loaders           Image name
# ...               Converter options (described here: modules/tile-converter/docs/cli-reference/tile-converter.md)

FROM node:12 AS BUILD_IMAGE

# install yarn
RUN yarn global add yarn@1.7.0

# install dependencies and build
WORKDIR /loaders-gl
COPY . /loaders-gl
RUN yarn
RUN yarn build

# build converter bundle
WORKDIR /loaders-gl/modules/tile-converter
RUN yarn build-converter-bundle

# install dependencies
RUN node dist/converter.min.js --install-dependencies

# change to alpine
FROM node:12-alpine

RUN apk --no-cache add zip unzip

# copy pgm and dist converter
WORKDIR /loaders-bundle
COPY --from=BUILD_IMAGE /loaders-gl/modules/tile-converter/dist/ ./
COPY --from=BUILD_IMAGE /loaders-gl/modules/tile-converter/deps ./deps

ENTRYPOINT ["node", "converter.min.js"]
