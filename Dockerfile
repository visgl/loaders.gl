# Docker Image for BuildKite CI
# -----------------------------

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
