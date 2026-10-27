# Publishing Zarr

`@loaders.gl/zarr` is a public package. Its version follows
other loaders.gl packages. Publish 5.0 prereleases with the `beta` dist-tag.

## Bootstrap a package

Trusted publishing requires the package to exist on npm first. A maintainer with
write access to the `@loaders.gl` scope must authenticate with `npm login` and
complete npm's browser/2FA prompts. Use a clean checkout of the reviewed release
revision and verify its package versions and dependencies before publishing.

```sh
yarn
yarn build
yarn build-workers
yarn test-node
yarn test-headless
yarn lint fix
npm pack ./modules/zarr --dry-run
npm publish ./modules/zarr --access public --tag beta
```

Only publish versions that are absent from the registry. Zarr already has older
4.x releases; its bootstrap here is the first release of the current 5.0 code.
Do not replace the `latest` tag with an alpha version.

## Configure trusted publishing

Use npm 11.15.0 or newer with a 2FA-enabled maintainer account. Inspect existing
relationships before creating one:

```sh
npm trust list @loaders.gl/zarr
npm trust github @loaders.gl/zarr --repo visgl/loaders.gl --file release.yml --allow-publish
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
list` for each package.

The existing `.github/workflows/release.yml` uses GitHub-hosted runners, a recent
npm CLI, and `id-token: write`. Tagged releases on `master` or a `*-release` branch
run tests and publish through `ocular-publish from-git`. The first subsequent
release must succeed for Zarr before OIDC publishing is verified end to
end. Never use a previously published version to test this workflow.

See [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/) and
[`npm trust`](https://docs.npmjs.com/cli/v11/commands/npm-trust/).
