import { IssueTrackerAdapter, IssueTrackerConfig, FeedbackData, IssueResponse } from '../types';
import { blobToBase64 } from '../core/screenshot';

export interface GitHubConfig extends IssueTrackerConfig {
  owner: string;
  repo: string;
  labels?: string[];
  assignees?: string[];
}

/**
 * GitHub Issue Tracker Adapter
 */
export class GitHubAdapter implements IssueTrackerAdapter {
  private config: GitHubConfig;

  constructor(config: GitHubConfig) {
    this.config = config;
  }

  /**
   * Creates an issue in GitHub with embedded screenshot
   * Note: GitHub doesn't have a direct upload API, so we embed the image as base64
   */
  async createIssue(feedback: FeedbackData): Promise<IssueResponse | null> {
    try {
      let screenshotMarkdown = '';

      // Convert screenshot to base64 if provided
      if (feedback.screenshot) {
        const base64 = await blobToBase64(feedback.screenshot);
        screenshotMarkdown = `\n\n## Screenshot\n![Screenshot](${base64})`;
      }

      // Build metadata section
      let metadataSection = '';
      if (feedback.metadata) {
        metadataSection = '\n\n## System Information\n```json\n' +
          JSON.stringify(feedback.metadata, null, 2) +
          '\n```';
      }

      // Build full description
      const fullDescription = `${feedback.description}${metadataSection}${screenshotMarkdown}`;

      // Create the issue
      const response = await fetch(
        `${this.config.baseUrl}/repos/${this.config.owner}/${this.config.repo}/issues`,
        {
          method: 'POST',
          headers: {
            'Authorization': `token ${this.config.accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json',
          },
          body: JSON.stringify({
            title: feedback.title,
            body: fullDescription,
            labels: this.config.labels || ['feedback', 'user-report'],
            assignees: this.config.assignees || [],
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        return {
          id: data.number,
          url: data.html_url,
          title: data.title,
        };
      }

      console.error('Failed to create GitHub issue:', response.statusText);
      return null;
    } catch (error) {
      console.error('Error creating GitHub issue:', error);
      return null;
    }
  }
}
