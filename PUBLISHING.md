# Publishing Guide

## Publishing to npm

Follow these steps to publish the `@fairkom/issue-reporter` package to npm.

### Prerequisites

1. **npm Account**: Create an account at https://www.npmjs.com/signup
2. **Organization Access**: You need access to the `@fairkom` organization on npm, or change the package name

### Steps

#### 1. Login to npm

```bash
npm login
```

Enter your npm username, password, and email when prompted.

#### 2. Verify you're logged in

```bash
npm whoami
```

#### 3. Check if the package name is available

```bash
npm view @fairkom/issue-reporter
```

If you get a 404 error, the name is available. If not, you need to:
- Get access to the @fairkom organization, OR
- Change the package name in `package.json`

#### 4. Build the package

```bash
npm run build
```

This will create the `dist/` folder with all compiled files.

#### 5. Test the package locally (optional but recommended)

```bash
npm pack
```

This creates a `.tgz` file you can inspect or test install.

#### 6. Publish to npm

**For first-time publish of a scoped package:**

```bash
npm publish --access public
```

**For updates:**

```bash
npm publish
```

### Version Management

Before publishing updates, bump the version:

```bash
# Patch release (0.1.0 -> 0.1.1) for bug fixes
npm version patch

# Minor release (0.1.0 -> 0.2.0) for new features
npm version minor

# Major release (0.1.0 -> 1.0.0) for breaking changes
npm version major
```

This automatically:
- Updates `package.json`
- Creates a git commit
- Creates a git tag

Then push and publish:

```bash
git push && git push --tags
npm publish
```

### Publishing Checklist

Before publishing, ensure:

- [ ] All tests pass (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] README.md is up to date
- [ ] Version number is bumped appropriately
- [ ] LICENSE file exists
- [ ] .npmignore or `files` in package.json is correct
- [ ] Dependencies are correctly listed
- [ ] You're logged in to npm (`npm whoami`)

### After Publishing

1. Verify the package on npm: https://www.npmjs.com/package/@fairkom/issue-reporter
2. Test installing it in a fresh project:
   ```bash
   npm install @fairkom/issue-reporter
   ```
3. Update your projects to use the published version instead of local path

### Alternative: Private Registry

If you want to keep it private, you can:

1. **Use npm private packages** (requires paid plan)
2. **Use GitHub Packages**:
   ```bash
   npm config set @fairkom:registry https://npm.pkg.github.com
   npm publish
   ```
3. **Host your own registry** (Verdaccio, etc.)

### Troubleshooting

**"You do not have permission to publish"**
- You need access to the @fairkom organization
- Or change the package name to your own scope: `@your-username/issue-reporter`

**"Package name too similar to existing package"**
- Choose a different name

**"You must verify your email before publishing"**
- Check your email and verify your npm account

### Continuous Deployment (Optional)

You can automate publishing with GitHub Actions. Create `.github/workflows/publish.yml`:

```yaml
name: Publish to npm

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm run build
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Then add your npm token to GitHub Secrets as `NPM_TOKEN`.
