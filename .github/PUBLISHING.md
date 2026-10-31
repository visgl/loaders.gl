# Publishing loaders.gl

Public packages under `modules/*` and `apps/*` share the version in `lerna.json`.
Publish 5.0 prereleases with the `beta` dist-tag. Private workspaces are not published.

## Beta.2 package setup

`@loaders.gl/documents` is new in 5.0.0-beta.2 and needs its first npm publication
and a trusted-publisher relationship before the tagged release can publish it
through GitHub Actions. The other public packages already have beta.1 releases.

The standalone config, XML, textures, video, and Draco packages have been
consolidated into documents, images, and scene. Publish the current workspace
packages; do not recreate removed packages. See the upgrade guide for import migrations.

## Bootstrap a package

Trusted publishing requires the package to exist on npm first. A maintainer with
write access to the `@loaders.gl` scope must authenticate with `npm login` and
complete npm's browser/2FA prompts. Use a clean checkout of the reviewed release
revision and verify its package versions and dependencies before publishing.

For documents, after the beta.2 preparation PR has been reviewed and merged:

```sh
yarn
yarn build
yarn build-apps
yarn build-workers
yarn test-node
yarn test-headless
yarn lint fix
node scripts/check-built-versions.mjs
npm pack ./modules/documents --dry-run
npm view @loaders.gl/documents@5.0.0-beta.2 version
```

If npm reports that this exact version does not exist, the maintainer can perform
its initial publication:

```sh
npm publish ./modules/documents --access public --tag beta
```

Only publish versions absent from the registry. If the version already exists,
skip initial publication and inspect its trusted-publisher configuration instead.
Do not replace the `latest` tag with a prerelease.

## Configure trusted publishing

Use npm 11.15.0 or newer with a 2FA-enabled maintainer account. Inspect existing
relationships before creating one:

```sh
npm trust list @loaders.gl/documents
npm trust github @loaders.gl/documents --repo visgl/loaders.gl --file release.yml --allow-publish
```

The equivalent package settings on npmjs.com are:

- Provider: GitHub Actions
- Organization: `visgl`
- Repository: `loaders.gl`
- Workflow filename: `release.yml`
- Environment: leave empty (the release job does not declare an environment)
- Allow direct publishing: enabled

If a matching relationship already exists, keep it. Review any different existing
relationship before replacing it. Verify the saved configuration with `npm trust
list` for each new package. Existing packages should retain their configured
relationships.

## Tagged release

The existing `.github/workflows/release.yml` uses GitHub-hosted runners, a recent
npm CLI, and `id-token: write`. Tagged releases on `master` or a `*-release` branch
run tests and publish through `ocular-publish from-git`.

Before tagging, verify the documents bootstrap and trust setup above, matching
versions and internal dependency pins, green release checks, and release notes.
The maintainer's bootstrap publication already supplies documents beta.2; confirm
it is present when checking the tagged release's package results. The next new
version published by Actions verifies documents OIDC publishing end to end.
Never use a previously published version to test this workflow.

See [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/) and
[`npm trust`](https://docs.npmjs.com/cli/v11/commands/npm-trust/).
