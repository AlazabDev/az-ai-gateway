import { supabase } from '@/integrations/supabase/client';
import { integrationStorage } from './integration-storage';

export interface GitHubUser {
  login: string;
  name: string | null;
  avatar_url: string;
  public_repos: number;
  html_url: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  updated_at: string;
  private: boolean;
  stargazers_count: number;
}

export interface GitHubFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size: number;
  download_url: string | null;
}

type GitHubProxyAction = 'user' | 'repos' | 'contents' | 'file';

class GitHubAPI {
  private async invoke<T>(action: GitHubProxyAction, payload: Record<string, unknown> = {}): Promise<T> {
    const { data, error } = await supabase.functions.invoke('github-proxy', {
      body: { action, ...payload },
    });

    if (error) {
      const context = (error as { context?: Response }).context;
      let message = error.message;

      try {
        if (context) {
          const parsed = await context.clone().json();
          if (parsed?.error) message = parsed.error;
        }
      } catch {
        // Keep the original Supabase Functions error.
      }

      throw new Error(`GitHub proxy error: ${message}`);
    }

    if (data?.error) throw new Error(`GitHub proxy error: ${data.error}`);
    return data as T;
  }

  isConnected(): boolean {
    const integration = integrationStorage.load('github');
    return integration?.status === 'connected' && Boolean(integration.secretRefs?.GITHUB_TOKEN);
  }

  async getUser(): Promise<GitHubUser> {
    return this.invoke<GitHubUser>('user');
  }

  async getRepos(page = 1, perPage = 30): Promise<GitHubRepo[]> {
    const settings = integrationStorage.load('github')?.settings || {};
    return this.invoke<GitHubRepo[]>('repos', {
      page,
      perPage,
      includePrivate: Boolean(settings.includePrivate),
    });
  }

  async getRepoContents(owner: string, repo: string, path = ''): Promise<GitHubFile[]> {
    return this.invoke<GitHubFile[]>('contents', { owner, repo, path });
  }

  async getFileContent(owner: string, repo: string, path: string): Promise<string> {
    const result = await this.invoke<{ content: string }>('file', { owner, repo, path });
    return result.content;
  }
}

export const githubAPI = new GitHubAPI();
