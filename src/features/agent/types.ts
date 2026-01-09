export interface AgentManifest {
  id: string;
  name: string;
  description: string;
  author: string;
  schema_version: number;
  homepage?: string;
  repository?: string;
  license?: string;
  permissions?: string[];
}

export interface AgentSource {
  type: 'git' | 'local';
  url?: string;
  revision?: string;
  sub_path?: string;
  path?: string;
}

export interface InstallInfo {
  source: AgentSource;
  installed_at: number;
  updated_at: number;
}

export interface InstalledAgent {
  manifest: AgentManifest;
  version_ref: string;
  path: string;
  install_info?: InstallInfo;
}
