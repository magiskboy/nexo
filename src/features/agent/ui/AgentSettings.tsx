import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { Button } from '@/ui/atoms/button/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/ui/atoms/card';
import { Input } from '@/ui/atoms/input';
import { Label } from '@/ui/atoms/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/atoms/tabs';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/atoms/dialog/component';
import { Separator } from '@/ui/atoms/separator';
import { ScrollArea } from '@/ui/atoms/scroll-area';
import { toast } from 'sonner';
import {
  Loader2,
  Plus,
  Download,
  GitBranch,
  ChevronDown,
  ChevronUp,
  Bot,
  ExternalLink,
  Trash2,
  Wrench,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { TauriCommands } from '@/bindings/commands';
import { invokeCommand } from '@/lib/tauri';
import { useGetInstalledAgentsQuery } from '../state/api';
import type { InstalledAgent } from '../types';
import { CommunityAgentsSection } from './CommunityAgentsSection';

export function AgentSettings() {
  const {
    data: agents = [],
    isLoading: _loading,
    refetch: fetchAgents,
  } = useGetInstalledAgentsQuery();
  const [installing, setInstalling] = useState(false);

  // Git Install State
  const [gitUrl, setGitUrl] = useState('');
  const [gitRevision, setGitRevision] = useState('');
  const [gitSubpath, setGitSubpath] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Agent Detail Dialog State
  const [selectedAgent, setSelectedAgent] = useState<InstalledAgent | null>(
    null
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [agentTools, setAgentTools] = useState<
    Array<{ name: string; description?: string }>
  >([]);
  const [agentInstructions, setAgentInstructions] = useState<string>('');
  const [loadingAgentInfo, setLoadingAgentInfo] = useState(false);

  const handleInstallLocal = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: 'Agent Package',
            extensions: ['zip'],
          },
        ],
      });

      if (!selected) return;

      setInstalling(true);
      toast.info('Installing agent from zip...');

      await invoke('install_agent', {
        payload: {
          source_type: 'local',
          path: selected,
        },
      });

      toast.success('Agent installed successfully!');
      fetchAgents();
    } catch (error) {
      toast.error('Failed to install agent: ' + error);
    } finally {
      setInstalling(false);
    }
  };

  const handleInstallGit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gitUrl) return;

    setInstalling(true);
    toast.info('Cloning and installing agent...');

    try {
      await invoke('install_agent', {
        payload: {
          source_type: 'git',
          url: gitUrl,
          revision: gitRevision.trim() || 'main',
          sub_path: gitSubpath.trim() || '/',
        },
      });

      toast.success('Agent installed successfully from Git!');
      setGitUrl('');
      setGitRevision('');
      setGitSubpath('');
      setShowAdvanced(false);
      fetchAgents();
    } catch (error) {
      toast.error('Installation failed: ' + error);
    } finally {
      setInstalling(false);
    }
  };

  const handleUpdateAgent = async () => {
    if (!selectedAgent) return;

    setUpdating(true);
    toast.info(`Updating agent ${selectedAgent.manifest.name}...`);

    try {
      await invoke(TauriCommands.UPDATE_AGENT, {
        agentId: selectedAgent.manifest.id,
      });

      toast.success('Agent updated successfully!');
      // Refresh list and keep dialog open but refresh details maybe?
      // Actually fetchAgents will update the list state.
      // We might want to re-select the agent to show new version ref.
      await fetchAgents();

      // Close dialog for now as simpler UX, or find the updated agent in new list
      setDialogOpen(false);
      setSelectedAgent(null);
    } catch (error) {
      toast.error('Failed to update agent: ' + error);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteAgent = async () => {
    if (!selectedAgent) return;

    setDeleting(true);
    try {
      await invoke(TauriCommands.DELETE_AGENT, {
        agentId: selectedAgent.manifest.id,
      });

      toast.success('Agent deleted successfully!');
      setDeleteDialogOpen(false);
      setDialogOpen(false);
      setSelectedAgent(null);
      fetchAgents();
    } catch (error) {
      toast.error('Failed to delete agent: ' + error);
    } finally {
      setDeleting(false);
    }
  };

  const fetchAgentInfo = async (agentId: string) => {
    setLoadingAgentInfo(true);
    try {
      const info = await invokeCommand<{
        tools: Array<{ name: string; description?: string }>;
        instructions: string;
      }>(TauriCommands.GET_AGENT_INFO, { agentId });

      setAgentTools(info.tools || []);
      setAgentInstructions(info.instructions || '');
    } catch (error) {
      console.error('Failed to fetch agent info:', error);
      setAgentTools([]);
      setAgentInstructions('');
    } finally {
      setLoadingAgentInfo(false);
    }
  };

  const handleAgentClick = (agent: InstalledAgent) => {
    setSelectedAgent(agent);
    setDialogOpen(true);
    fetchAgentInfo(agent.manifest.id);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="installed" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="installed">Installed Agents</TabsTrigger>
          <TabsTrigger value="store">Install New</TabsTrigger>
        </TabsList>

        <TabsContent value="installed" className="mt-6 space-y-4">
          {agents.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-muted/10">
              <p className="text-muted-foreground text-sm">
                No agents installed yet.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {agents.map((agent) => (
                <Card
                  key={agent.manifest.id}
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => handleAgentClick(agent)}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      {agent.manifest.name}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {agent.manifest.id}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 h-10 overflow-hidden text-ellipsis line-clamp-2">
                      {agent.manifest.description}
                    </p>
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>v{agent.version_ref.substring(0, 7)}</span>
                      <span>by {agent.manifest.author}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="store" className="mt-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Local Install */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Download className="h-4 w-4" /> Local Installation
                </CardTitle>
                <CardDescription className="text-xs">
                  Install an agent from a .zip file on your computer.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col min-h-[200px]">
                <div className="flex-1 flex items-center justify-center py-4">
                  <div className="text-center space-y-2">
                    <Download className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  </div>
                </div>
                <Button
                  onClick={handleInstallLocal}
                  disabled={installing}
                  className="w-full"
                  size="sm"
                >
                  {installing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Select Zip File
                </Button>
              </CardContent>
            </Card>

            {/* Git Install */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <GitBranch className="h-4 w-4" /> Install from Git
                </CardTitle>
                <CardDescription className="text-xs">
                  Clone and install directly from a repository. Defaults to main
                  branch and root path.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleInstallGit} className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="git-url" className="text-xs">
                      Repository URL
                    </Label>
                    <Input
                      id="git-url"
                      placeholder="https://github.com/user/repo"
                      value={gitUrl}
                      onChange={(e) => setGitUrl(e.target.value)}
                      required
                      className="h-8 text-sm"
                    />
                  </div>

                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      showAdvanced
                        ? 'max-h-48 opacity-100'
                        : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="space-y-2 pt-2 border-t">
                      <div className="space-y-2">
                        <Label htmlFor="git-rev" className="text-xs">
                          Revision
                        </Label>
                        <Input
                          id="git-rev"
                          placeholder="main"
                          value={gitRevision}
                          onChange={(e) => setGitRevision(e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="git-sub" className="text-xs">
                          Subpath
                        </Label>
                        <Input
                          id="git-sub"
                          placeholder="/"
                          value={gitSubpath}
                          onChange={(e) => setGitSubpath(e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="text-xs h-7 px-2 w-full justify-start"
                  >
                    {showAdvanced ? (
                      <>
                        <ChevronUp className="mr-1 h-3 w-3" />
                        Hide advanced options
                      </>
                    ) : (
                      <>
                        <ChevronDown className="mr-1 h-3 w-3" />
                        Show advanced options
                      </>
                    )}
                  </Button>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={installing || !gitUrl}
                    size="sm"
                  >
                    {installing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <GitBranch className="mr-2 h-4 w-4" />
                    )}
                    Clone & Install
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <Separator />

          <CommunityAgentsSection />
        </TabsContent>
      </Tabs>

      {/* Agent Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2.5">
                <Bot className="size-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-xl">
                  {selectedAgent?.manifest.name || 'Agent Details'}
                </DialogTitle>
                {selectedAgent && (
                  <p className="text-xs text-muted-foreground font-mono mt-1">
                    {selectedAgent.manifest.id}
                  </p>
                )}
              </div>
            </div>
          </DialogHeader>
          <DialogBody>
            <ScrollArea className="h-full pr-4">
              {selectedAgent && (
                <div className="space-y-6">
                  {/* Description */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Description</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {selectedAgent.manifest.description}
                    </p>
                  </div>

                  <Separator />

                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm">Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground mb-1">Author</p>
                        <p className="font-medium">
                          {selectedAgent.manifest.author}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Version</p>
                        <p className="font-mono text-xs">
                          {selectedAgent.version_ref}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">
                          Schema Version
                        </p>
                        <p className="font-medium">
                          {selectedAgent.manifest.schema_version}
                        </p>
                      </div>
                      {selectedAgent.manifest.license && (
                        <div>
                          <p className="text-muted-foreground mb-1">License</p>
                          <p className="font-medium">
                            {selectedAgent.manifest.license}
                          </p>
                        </div>
                      )}
                      {selectedAgent.install_info && (
                        <>
                          <div>
                            <p className="text-muted-foreground mb-1">Source</p>
                            <p className="font-medium capitalize">
                              {selectedAgent.install_info.source.type}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground mb-1">
                              Updated
                            </p>
                            <p className="font-medium text-xs">
                              {new Date(
                                selectedAgent.install_info.updated_at * 1000
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Links */}
                  {(selectedAgent.manifest.homepage ||
                    selectedAgent.manifest.repository ||
                    (selectedAgent.install_info?.source.type === 'git' &&
                      selectedAgent.install_info.source.url)) && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm">Links</h4>
                        <div className="space-y-2">
                          {selectedAgent.manifest.homepage && (
                            <a
                              href={selectedAgent.manifest.homepage}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-primary hover:underline"
                            >
                              <ExternalLink className="h-4 w-4" />
                              <span>Homepage</span>
                            </a>
                          )}
                          {selectedAgent.manifest.repository && (
                            <a
                              href={selectedAgent.manifest.repository}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-primary hover:underline"
                            >
                              <ExternalLink className="h-4 w-4" />
                              <span>Repository</span>
                            </a>
                          )}
                          {/* Show source URL if different from repo or if repo missing */}
                          {selectedAgent.install_info?.source.type === 'git' &&
                            selectedAgent.install_info.source.url &&
                            selectedAgent.install_info.source.url !==
                              selectedAgent.manifest.repository && (
                              <a
                                href={selectedAgent.install_info.source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-primary hover:underline"
                              >
                                <GitBranch className="h-4 w-4" />
                                <span>Source Repository</span>
                              </a>
                            )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Permissions */}
                  {selectedAgent.manifest.permissions &&
                    selectedAgent.manifest.permissions.length > 0 && (
                      <>
                        <Separator />
                        <div className="space-y-3">
                          <h4 className="font-medium text-sm">Permissions</h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedAgent.manifest.permissions.map(
                              (permission, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 text-xs bg-muted rounded-md"
                                >
                                  {permission}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      </>
                    )}

                  {/* Tools */}
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <Wrench className="h-4 w-4" />
                      Tools ({agentTools.length})
                    </h4>
                    {loadingAgentInfo ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Loading tools...</span>
                      </div>
                    ) : agentTools.length > 0 ? (
                      <div className="space-y-2">
                        {agentTools.map((tool, index) => (
                          <div
                            key={index}
                            className="p-3 rounded-md bg-muted/50 border"
                          >
                            <div className="font-medium text-sm mb-1">
                              {tool.name}
                            </div>
                            {tool.description && (
                              <p className="text-xs text-muted-foreground">
                                {tool.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No tools available
                      </p>
                    )}
                  </div>

                  {/* Instructions */}
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Instructions
                    </h4>
                    {loadingAgentInfo ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Loading instructions...</span>
                      </div>
                    ) : agentInstructions ? (
                      <div className="p-3 rounded-md bg-muted/50 border">
                        <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans">
                          {agentInstructions}
                        </pre>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No instructions available
                      </p>
                    )}
                  </div>

                  {/* Path */}
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Installation Path</h4>
                    <p className="text-xs text-muted-foreground font-mono break-all">
                      {selectedAgent.path}
                    </p>
                  </div>
                </div>
              )}
            </ScrollArea>
          </DialogBody>
          <DialogFooter className="flex justify-between items-center sm:justify-between w-full">
            <Button
              type="button"
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Agent
            </Button>

            {selectedAgent?.install_info?.source.type === 'git' && (
              <Button
                type="button"
                variant="outline"
                onClick={handleUpdateAgent}
                disabled={updating}
                className="gap-2"
              >
                {updating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Update from Git
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Agent</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete{' '}
              {selectedAgent && (
                <span className="font-semibold">
                  {selectedAgent.manifest.name}
                </span>
              )}
              ? This action cannot be undone.
            </p>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteAgent}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
