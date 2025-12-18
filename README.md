# @biowilli/issue-reporter

A powerful, framework-agnostic feedback reporter with automatic screenshot capture and annotation tools for GitLab, GitHub, Jira and custom issue trackers.

Turn user feedback into actionable issues with just one click!

## Features

- **Automatic Screenshot Capture** - Uses dom-to-image-more to capture the current page
- **Screenshot Editor** - Built-in annotation tools (arrows, rectangles, circles, pen) with multiple colors
- **Framework Agnostic** - Works with React, Vue, Angular, or vanilla JavaScript
- **Pluggable Adapters** - Built-in support for GitLab and GitHub, easily extend for other platforms
- **Highly Customizable** - Customize colors, text labels, button styles, and modal appearance
- **System Metadata** - Automatically includes comprehensive browser and system information
- **TypeScript Support** - Fully typed for better developer experience
- **i18n Ready** - All text labels are customizable for any language

## Installation

```bash
npm install @biowilli/issue-reporter
```

Or with yarn:

```bash
yarn add @biowilli/issue-reporter
```

## Quick Start

### React

```tsx
import { FeedbackButton, GitLabAdapter } from '@biowilli/issue-reporter';

// 1. Create an adapter for your issue tracker (GitLab example)
const feedbackAdapter = new GitLabAdapter({
  baseUrl: 'https://gitlab.com', // Your GitLab instance URL
  projectId: '1234', // Your GitLab project ID
  accessToken: import.meta.env.VITE_GITLAB_ACCESS_TOKEN, // Access token from environment
  labels: ['user-feedback', 'bug'], // Labels to add to issues
});

function App() {
  return (
    <div>
      <h1>My App</h1>

      {/* 2. Add the feedback button anywhere in your app */}
      <FeedbackButton
        adapter={feedbackAdapter}
        position="bottom-right"
        includeMetadata={true}
        textLabels={{
          buttonText: 'Report Issue',
          modalTitle: 'Report a Problem',
        }}
        onSuccess={(response) => {
          console.log('Issue created:', response.url);
          alert(`Thank you! Issue created: ${response.url}`);
        }}
      />
    </div>
  );
}
```

**That's it!** Users can now click the button to report issues with automatic screenshots.

### Vanilla JavaScript

```javascript
import { createFeedbackReporter, GitLabAdapter } from '@biowilli/issue-reporter';

// Create adapter
const adapter = new GitLabAdapter({
  baseUrl: 'https://gitlab.com',
  projectId: '1234',
  accessToken: 'your-gitlab-token',
});

// Create reporter
const reporter = createFeedbackReporter({
  adapter,
  includeMetadata: true,
  onSuccess: (response) => {
    console.log('Issue created:', response.url);
  },
});

// Render the button
reporter.renderButton({
  text: 'Report Bug',
  position: 'bottom-right',
});
```

## Adapters

### GitLab Adapter

The GitLab adapter allows you to create issues directly in your GitLab projects.

```typescript
import { GitLabAdapter } from '@biowilli/issue-reporter';

const adapter = new GitLabAdapter({
  baseUrl: 'https://gitlab.com', // Your GitLab instance (gitlab.com or self-hosted)
  projectId: '1234', // Your project ID (found in project settings)
  accessToken: 'glpat-xxxxxxxxxxxx', // Your GitLab access token
  labels: ['user-feedback', 'bug'], // Optional: labels to add to issues
  assigneeIds: [123], // Optional: user IDs to auto-assign issues
});
```

#### Setting Up GitLab Access Token

To use the GitLab adapter, you need to create an access token with the right permissions:

**Required Scopes:**
- `api` - For creating issues and uploading files

**OR** (minimal permissions):
- `write_repository` - For uploading screenshots
- `api` or `write_api` - For creating issues

**Creating a Project Access Token (Recommended):**

1. Go to your GitLab project: `https://gitlab.com/your-project`
2. Navigate to **Settings** → **Access Tokens**
3. Create a new **Project Access Token**:
   - **Name**: `issue-reporter-frontend`
   - **Role**: `Reporter` (sufficient for creating issues) or `Developer`
   - **Scopes**: Select `api`
   - **Expiration**: Set an appropriate expiration date (optional)
4. Click **Create project access token**
5. Copy the token and store it securely in your environment variables

**Minimum Project Role:**
The token/user needs at least **Reporter** role in the project to:
- Create issues
- Upload files (screenshots)

**Security Best Practices:**
- Use **Project Access Tokens** instead of Personal Access Tokens
- Store tokens in environment variables (`.env.local`), never commit them
- Use the minimum required scopes
- Set an expiration date for tokens
- Rotate tokens regularly

### GitHub Adapter

The GitHub adapter creates issues in your GitHub repositories.

```typescript
import { GitHubAdapter } from '@biowilli/issue-reporter';

const adapter = new GitHubAdapter({
  baseUrl: 'https://api.github.com',
  projectId: '', // Not used for GitHub
  owner: 'your-username', // Repository owner
  repo: 'your-repo', // Repository name
  accessToken: 'ghp_xxxxxxxxxxxx', // GitHub personal access token
  labels: ['user-feedback', 'bug'], // Optional: issue labels
  assignees: ['username'], // Optional: GitHub usernames to assign
});
```

**GitHub Token:** Create a Personal Access Token at https://github.com/settings/tokens with `repo` scope.

### Custom Adapter

You can create your own adapter for any issue tracker (Jira, Linear, Asana, etc.):

```typescript
import { IssueTrackerAdapter, FeedbackData, IssueResponse } from '@biowilli/issue-reporter';

class MyCustomAdapter implements IssueTrackerAdapter {
  async createIssue(feedback: FeedbackData): Promise<IssueResponse | null> {
    // 1. Upload screenshot if provided
    let screenshotUrl = null;
    if (feedback.screenshot) {
      screenshotUrl = await this.uploadScreenshot(feedback.screenshot);
    }

    // 2. Create issue in your system
    const response = await fetch('https://your-api.com/issues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: feedback.title,
        description: feedback.description,
        screenshot: screenshotUrl,
        metadata: feedback.metadata,
      }),
    });

    const data = await response.json();

    // 3. Return issue details
    return {
      id: data.id,
      url: data.url,
      title: data.title,
    };
  }

  async uploadScreenshot(screenshot: Blob): Promise<string | null> {
    // Optional: Upload screenshot to your storage
    const formData = new FormData();
    formData.append('file', screenshot);

    const response = await fetch('https://your-api.com/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    return data.url;
  }
}

// Use your custom adapter
const adapter = new MyCustomAdapter();
```

## API Reference

### React Components

#### `<FeedbackButton>`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `adapter` | `IssueTrackerAdapter` | *required* | Issue tracker adapter instance |
| `position` | `'bottom-right' \| 'bottom-left' \| 'top-right' \| 'top-left' \| 'none'` | `'bottom-right'` | Button position |
| `buttonClassName` | `string` | `undefined` | Custom CSS class for the button |
| `includeMetadata` | `boolean` | `true` | Include system metadata in reports |
| `labels` | `string[]` | `[]` | Labels to add to issues |
| `textLabels` | `TextLabels` | `{}` | Customize all text labels (see below) |
| `buttonStyles` | `ButtonStyles` | `{}` | Customize button appearance (see below) |
| `modalStyles` | `ModalStyles` | `{}` | Customize modal appearance (see below) |
| `onSuccess` | `(response: IssueResponse) => void` | `undefined` | Called when issue is created |
| `onError` | `(error: Error) => void` | `undefined` | Called on error |

### Customization Options

#### Text Labels (`textLabels`)

All text labels can be customized for internationalization:

```typescript
textLabels={{
  buttonText: 'Report Issue',
  modalTitle: 'Report an Issue',
  titleLabel: 'Title',
  titlePlaceholder: 'Brief description of the issue',
  descriptionLabel: 'Description',
  descriptionPlaceholder: 'Detailed description of the issue...',
  screenshotLabel: 'Screenshot (optional)',
  screenshotHint: 'Upload a screenshot or paste from clipboard',
  includeScreenshotLabel: 'Include screenshot',
  editButtonText: 'Edit',
  removeButtonText: 'Remove',
  cancelButtonText: 'Cancel',
  submitButtonText: 'Submit Issue',
  submittingButtonText: 'Submitting...',
  capturingButtonText: 'Capturing...',
}}
```

#### Button Styles (`buttonStyles`)

Customize the feedback button appearance:

```typescript
buttonStyles={{
  backgroundColor: '#0070B7',
  color: 'white',
  hoverBackgroundColor: '#005a92',
  hoverColor: 'white',
  borderRadius: '8px',
  padding: '10px 16px',
  fontSize: '14px',
  fontWeight: '600',
  border: 'none',
  boxShadow: '0 2px 8px rgba(0, 112, 183, 0.3)',
}}
```

#### Modal Styles (`modalStyles`)

Customize the feedback modal appearance:

```typescript
modalStyles={{
  overlayBackgroundColor: 'rgba(0, 0, 0, 0.5)',
  backgroundColor: 'white',
  borderRadius: '12px',
  padding: '24px',
  maxWidth: '600px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
  headerColor: '#002e49',
  labelColor: '#00446e',
  inputBorderColor: '#E6EDF1',
  inputFocusBorderColor: '#0070B7',
  primaryButtonColor: '#0070B7',
  primaryButtonHoverColor: '#005a92',
  secondaryButtonColor: '#E6EDF1',
  dangerButtonColor: '#dc2626',
  dangerButtonHoverColor: '#b91c1c',
}}
```

### Complete Customization Example

```tsx
<FeedbackButton
  adapter={gitlabAdapter}
  position='bottom-right'
  includeMetadata={true}
  textLabels={{
    buttonText: 'Problem melden',
    modalTitle: 'Problem melden',
    titleLabel: 'Titel',
    descriptionLabel: 'Beschreibung',
    // ... other labels
  }}
  buttonStyles={{
    backgroundColor: '#0070B7',
    hoverBackgroundColor: '#005a92',
    // ... other styles
  }}
  modalStyles={{
    primaryButtonColor: '#0070B7',
    // ... other styles
  }}
  onSuccess={(response) => {
    console.log('Issue created:', response.url);
  }}
/>
```

### Vanilla JS Functions

#### `createFeedbackReporter(config)`

Creates a feedback reporter instance.

```typescript
const reporter = createFeedbackReporter({
  adapter: new GitLabAdapter({...}),
  includeMetadata: true,
  onSuccess: (response) => {},
  onError: (error) => {},
});
```

**Methods:**

- `renderButton(options)` - Renders the feedback button
- `openModal()` - Programmatically opens the feedback modal
- `destroy()` - Removes the button and cleans up

## Environment Variables

For security, store your access tokens in environment variables:

```env
# .env
VITE_GITLAB_ACCESS_TOKEN=your-token-here
VITE_GITLAB_PROJECT_ID=1234

# or for React
REACT_APP_GITLAB_TOKEN=your-token-here
```

## System Metadata

When `includeMetadata` is enabled, the following information is automatically collected:

**Browser Information:**
- Browser name and version (Chrome, Firefox, Safari, Edge)
- User Agent string

**Operating System:**
- OS name (Windows, macOS, Linux, Android, iOS)
- Platform details

**Language & Location:**
- Browser language(s)
- Timezone
- Date and time (ISO timestamp and localized)

**Screen & Display:**
- Screen resolution
- Viewport size
- Device pixel ratio (for Retina displays)
- Color depth

**Page Information:**
- Current URL
- Page title
- Referrer

**Connection & Performance:**
- Online/Offline status
- Connection type (4G, WiFi, etc.)

**Hardware (if available):**
- Available RAM (Chrome only)
- CPU cores
- Touch support
- Cookies enabled

## How It Works

1. **Button Click** - User clicks the feedback button
2. **Screenshot Capture** - Automatically captures the current page using dom-to-image-more
3. **Screenshot Editing** - User can annotate the screenshot with arrows, shapes, and pen
4. **Feedback Form** - User fills in title and description
5. **Metadata Collection** - Comprehensive system info is collected automatically
6. **Issue Creation** - Screenshot is uploaded and issue is created via adapter
7. **Success** - User receives confirmation with issue URL

## Real-World Example

Here's a complete example with German labels and custom styling:

```tsx
import { FeedbackButton, GitLabAdapter } from '@biowilli/issue-reporter';

const feedbackAdapter = new GitLabAdapter({
  baseUrl: 'https://git.fairkom.net',
  projectId: '123',
  accessToken: import.meta.env.VITE_GITLAB_ACCESS_TOKEN,
  labels: ['User-Feedback', 'Frontend'],
});

<FeedbackButton
  adapter={feedbackAdapter}
  position='bottom-right'
  includeMetadata={true}
  textLabels={{
    buttonText: 'Problem melden',
    modalTitle: 'Problem melden',
    titleLabel: 'Titel',
    descriptionLabel: 'Beschreibung',
    submitButtonText: 'Problem melden',
  }}
  buttonStyles={{
    backgroundColor: '#0070B7',
    hoverBackgroundColor: '#005a92',
    borderRadius: '8px',
  }}
  modalStyles={{
    primaryButtonColor: '#0070B7',
  }}
  onSuccess={(response) => {
    alert(`Issue created: ${response.url}`);
  }}
/>
```

## Development

```bash
# Install dependencies
npm install

# Build the package
npm run build

# Watch mode for development
npm run dev

# Publish to npm
npm version patch  # or minor/major
npm publish --access public
```

## Links

- **npm Package:** https://www.npmjs.com/package/@biowilli/issue-reporter
- **Issues:** https://github.com/fairkom/issue-reporter/issues

## License

MIT © biowilli

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
