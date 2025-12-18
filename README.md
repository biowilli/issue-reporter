# @fairkom/issue-reporter

Framework-agnostic feedback reporter with screenshot capture for GitLab, GitHub, Jira and custom issue trackers.

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
npm install @fairkom/issue-reporter
# or
yarn add @fairkom/issue-reporter
```

## Quick Start

### React

```tsx
import { FeedbackButton, GitLabAdapter } from '@fairkom/issue-reporter';

function App() {
  const adapter = new GitLabAdapter({
    baseUrl: 'https://git.fairkom.net',
    projectId: '1234',
    accessToken: process.env.REACT_APP_GITLAB_TOKEN!,
    labels: ['user-feedback', 'bug'],
  });

  return (
    <div>
      <h1>My App</h1>
      <FeedbackButton
        adapter={adapter}
        buttonText="🐛 Report Bug"
        position="bottom-right"
        onSuccess={(response) => {
          console.log('Issue created:', response.url);
        }}
      />
    </div>
  );
}
```

### Vanilla JavaScript

```javascript
import { createFeedbackReporter, GitLabAdapter } from '@fairkom/issue-reporter';

const adapter = new GitLabAdapter({
  baseUrl: 'https://git.fairkom.net',
  projectId: '1234',
  accessToken: 'your-gitlab-token',
});

const reporter = createFeedbackReporter({
  adapter,
  includeMetadata: true,
  onSuccess: (response) => {
    console.log('Issue created:', response.url);
  },
});

// Render the feedback button
reporter.renderButton({
  text: '🐛 Report Bug',
  position: 'bottom-right',
});
```

## Adapters

### GitLab Adapter

```typescript
import { GitLabAdapter } from '@fairkom/issue-reporter';

const adapter = new GitLabAdapter({
  baseUrl: 'https://gitlab.com', // or your self-hosted GitLab
  projectId: '1234',
  accessToken: 'your-access-token',
  labels: ['feedback', 'bug'], // optional
  assigneeIds: [123], // optional, user IDs to assign
});
```

#### GitLab Access Token Setup

The GitLab adapter requires an access token with the following permissions:

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

```typescript
import { GitHubAdapter } from '@fairkom/issue-reporter';

const adapter = new GitHubAdapter({
  baseUrl: 'https://api.github.com',
  projectId: '', // not used for GitHub
  owner: 'your-username',
  repo: 'your-repo',
  accessToken: 'your-github-token',
  labels: ['feedback', 'bug'], // optional
  assignees: ['username'], // optional
});
```

### Custom Adapter

Create your own adapter by implementing the `IssueTrackerAdapter` interface:

```typescript
import { IssueTrackerAdapter, FeedbackData, IssueResponse } from '@fairkom/issue-reporter';

class CustomAdapter implements IssueTrackerAdapter {
  async createIssue(feedback: FeedbackData): Promise<IssueResponse | null> {
    // Your implementation
    const response = await fetch('your-api-endpoint', {
      method: 'POST',
      body: JSON.stringify(feedback),
    });

    return {
      id: 'issue-id',
      url: 'issue-url',
      title: feedback.title,
    };
  }

  async uploadScreenshot(screenshot: Blob): Promise<string | null> {
    // Optional: implement screenshot upload
    return 'screenshot-url';
  }
}
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

## Development

```bash
# Install dependencies
npm install

# Build the package
npm run build

# Watch mode
npm run dev
```

## License

MIT © Fairkom

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
