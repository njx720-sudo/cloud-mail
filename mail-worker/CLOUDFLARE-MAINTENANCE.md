# Cloudflare build configuration

The production Worker uses this fork's `main` branch. Update it manually from an
official Cloud Mail release tag, not from unreleased upstream `main` commits.
Review the upstream Wrangler configuration and database migrations before each
update, and back up the existing D1 database and KV objects first.

Cloudflare Workers Builds uses `/mail-worker` as its root directory and the
following build variables, configured in Cloudflare rather than this public
repository:

- `MAIL_D1_DATABASE_NAME`
- `MAIL_D1_DATABASE_ID`
- `MAIL_KV_NAMESPACE_ID`
- `MAIL_CUSTOM_DOMAIN`

Build command:

```sh
node scripts/prepare-cloudflare-config.cjs
```

Production deploy command:

```sh
npx wrangler deploy --config wrangler.codex.generated.toml
```

Non-production version command:

```sh
npx wrangler versions upload --config wrangler.codex.generated.toml
```

The script creates an ignored temporary configuration that binds the existing
D1 database and KV namespace, preserves dashboard variables and secrets,
keeps the workers.dev endpoint, and declares the existing custom domain. It
stops if an upstream change introduces conflicting bindings or routes. The
generated file and Cloudflare credentials must not be committed.

Before updating `main`, build the release on a non-production branch and
confirm Cloudflare reports success. Apply required database migrations before
the production deployment, then verify bindings, routes and existing mail.
