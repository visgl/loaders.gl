# Docker image for tile-converter module
# -----------------------------
# To build a docker image, run in the root folder of the repository:
# docker build -t loaders -f modules/tile-converter/Dockerfile .
#
# Use the image to convert tileset:
# docker run --rm \
#   -v /path/to/output_folder:/loaders-bundle/data \
#   -v /path/to/input/tileset:/loaders-bundle/input-data \
#   visgl/tile-converter \
#   --input-type 3DTILES \
#   --token ... \
#   --tileset input-data/tileset.json \
#   --name ... \
#   --output data \
#   --max-depth 3
#
# Description of arguments:
# --rm                  Remove container after conversion
# -v                    Create docker volume, linked to internal data folder
# visgl/tile-converter  Image name
# ...                   Converter options (described here: modules/tile-converter/docs/cli-reference/tile-converter.md)

# change to alpine
FROM node:16-alpine

# copy pgm and dist converter
WORKDIR /loaders-bundle
COPY ./modules/tile-converter/dist/converter.min.cjs .

# install dependencies
# join-images npm package related to the specific version of sharp
RUN npm install sharp@^0.30.4
RUN node converter.min.cjs --install-dependencies

# install zip to be able to create SLPK files
RUN apk --no-cache add zip unzip

ENTRYPOINT ["node", "converter.min.cjs"]
