import { IssueTrackerAdapter, IssueTrackerConfig, FeedbackData, IssueResponse } from '../types';

export interface GitLabConfig extends IssueTrackerConfig {
  labels?: string[];
  assigneeIds?: number[];
}

/**
 * GitLab Issue Tracker Adapter
 */
export class GitLabAdapter implements IssueTrackerAdapter {
  private config: GitLabConfig;

  constructor(config: GitLabConfig) {
    this.config = config;
  }

  /**
   * Uploads a screenshot to GitLab
   */
  async uploadScreenshot(screenshot: Blob): Promise<string | null> {
    try {
      const formData = new FormData();
      formData.append('file', screenshot, 'feedback_screenshot.png');

      const response = await fetch(
        `${this.config.baseUrl}/api/v4/projects/${this.config.projectId}/uploads`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
          },
          body: formData,
        }
      );

      if (response.status === 201) {
        const data = await response.json();
        return data.url || null;
      }

      return null;
    } catch (error) {
      console.error('Error uploading screenshot to GitLab:', error);
      return null;
    }
  }

  /**
   * Creates an issue in GitLab
   */
  async createIssue(feedback: FeedbackData): Promise<IssueResponse | null> {
    try {
      let screenshotUrl: string | null = null;

      // Upload screenshot if provided
      if (feedback.screenshot) {
        screenshotUrl = await this.uploadScreenshot(feedback.screenshot);
      }

      // Build metadata section
      let metadataSection = '';
      if (feedback.metadata) {
        metadataSection = '\n\n## System Information\n```json\n' +
          JSON.stringify(feedback.metadata, null, 2) +
          '\n```';
      }

      // Build full description with screenshot
      const fullDescription = `${feedback.description}${metadataSection}

${screenshotUrl ? `\n\n## Screenshot\n![Screenshot](${screenshotUrl})` : ''}`;

      // Create the issue
      const response = await fetch(
        `${this.config.baseUrl}/api/v4/projects/${this.config.projectId}/issues`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: feedback.title,
            description: fullDescription,
            labels: feedback.labels || [],
            assignee_ids: this.config.assigneeIds || [],
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        return {
          id: data.iid,
          url: data.web_url,
          title: data.title,
        };
      }

      console.error('Failed to create GitLab issue:', response.statusText);
      return null;
    } catch (error) {
      console.error('Error creating GitLab issue:', error);
      return null;
    }
  }
}
