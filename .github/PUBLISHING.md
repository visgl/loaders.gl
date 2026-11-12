# Publishing loaders.gl

Public packages under `modules/*` and `apps/*` share the version in `lerna.json`.
Publish 5.0 prereleases with the `beta` dist-tag. Private workspaces are not published.

## Current package setup

All 22 public workspace packages already exist on npm at 5.0.0-beta.2, including
documents, pointclouds, and tile-converter. The next coordinated release is
5.0.0-beta.8. Private workspaces stay version-aligned but are not published.

The standalone config, XML, textures, video, and Draco packages have been
consolidated into documents, images, and scene. Publish the current workspace
packages; do not recreate removed packages. See the upgrade guide for import migrations.

## Bootstrap a package

Trusted publishing requires the package to exist on npm first. A maintainer with
write access to the `@loaders.gl` scope must authenticate with `npm login` and
complete npm's browser/2FA prompts. Use a clean checkout of the reviewed release
revision and verify its package versions and dependencies before publishing.

For a newly introduced package, use its directory and the reviewed release version.
The documents beta.2 bootstrap below is a historical example:

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

New trusted publishers must complete their **first successful OIDC publication
within two days**. A manual bootstrap publication does not validate the subsequent
trusted-publisher configuration. Schedule the first tagged workflow release within
that window. npm's `trust list` can still show an expired relationship with the
expected repository, workflow, and permissions; matching fields alone do not prove
that it is usable.

If that first-publication window was missed, revoke the unvalidated relationship
using its ID from `npm trust list`, recreate the same repository/workflow relationship,
and publish a new version through the workflow within two days. Do not recreate
already validated relationships merely because a later release fails.

If a matching, validated relationship already exists, keep it. Review any different existing
relationship before replacing it. Verify the saved configuration with `npm trust
list` for each new package. Existing packages should retain their configured
relationships.

## Tagged release

The release workflow uses GitHub-hosted runners, npm 11, and `id-token: write`
for npm trusted publishing. The npm relationship must name exactly
`visgl/loaders.gl` and `release.yml`; no long-lived npm token is needed.

1. Merge the reviewed version, dependency pins, lockfile, and changelog preparation
   into latest master. Keep `NPM_TAG` set to `beta` and fixture URLs on master.
2. Verify all checks on the merged revision, then tag that exact master commit
   `v5.0.0-beta.8` and push the tag. Do not run `yarn publish-beta` after a
   version-preparation PR: it increments the version again and pushes a tag.
3. The workflow builds and tests packages, verifies embedded versions and the exact
   release tag, then publishes missing npm versions with the `beta` dist-tag.
4. A separate finalization job verifies every public workspace version and distribution
   tag in the registry before creating the GitHub prerelease announcement. It checks
   up to 60 times at 15-second intervals, allowing about 15 minutes for propagation.
   Missing versions, incorrect tags, and registry request failures still fail the job.

If publication is interrupted, rerun the failed publishing job on the same tagged
revision. A duplicate transparency-log entry (HTTP 409) can interrupt provenance
creation; inspect the package/version and retry missing publications without disabling
provenance or changing the tag. An upload log or an "already published" response
does not replace public registry verification.

If only finalization fails, rerun that job. It reads the registry before installing
announcement dependencies and does not rebuild or republish any packages. If metadata
has not propagated after the bounded wait, keep the release incomplete and inspect
the reported versions and tags before retrying. The successful publishing job supplies
the distribution tag to finalization; a failed publishing job cannot announce a release.

If the workflow itself needs repair, merge that repair into master, then
dispatch release.yml from master with release_tag set to the original tag. Every
job checks out that immutable tag; the branch guard checks the selected source
commit against master/release ancestry, and tag/version validation still applies. Already published versions are skipped by `lerna publish from-package`.
An existing GitHub announcement is retained, so it cannot block the npm retry.
Do not delete or move the release tag, and do not test trusted publishing by
republishing an existing version.

See [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/) and
[`npm trust`](https://docs.npmjs.com/cli/v11/commands/npm-trust/).

The publishing job restores a known MLT dependency-hoisting comment variation only
when the entire generated decoder matches the reviewed file after comment normalization.
Any real decoder change or other tracked source modification aborts publication.

The v5.0.0-beta.3 tag was retained after its publishing attempt failed before any
npm publication. Beta.4 includes the subsequent master changes and publishing repair.
