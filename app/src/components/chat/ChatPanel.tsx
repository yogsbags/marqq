import { useState, useRef, useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import {
  HiX as X,
  HiPaperAirplane as Send,
  HiChat as Bot,
  HiUser as User,
  HiTrash as Trash2,
  HiPaperClip as Paperclip,
  HiDocumentText as FileText,
  HiPhotograph as Image,
  HiTable as FileSpreadsheet
} from 'react-icons/hi';
import { cn } from '@/lib/utils';
import { GroqService, ChatMessage } from '@/services/groqService';
import { executeGuidedWorkflow, type GuidedGoal, type GuidedWorkflowResponse } from '@/services/guidedWorkflowService';
import { toast } from 'sonner';
import { CSVAnalysisPanel } from '@/components/ui/csv-analysis-panel';

// Slash command definitions
const SLASH_COMMANDS = [
  { command: '/agents',               description: 'Open the AI team',                               action: 'agents' },
  { command: '/workflows',            description: 'Open workflow builder',                          action: 'workflows' },
  { command: '/lead-intelligence',    description: 'Find and score leads, build your ICP',           action: 'lead-intelligence' },
  { command: '/voice-bot',            description: 'Run outbound voice campaigns',                   action: 'voice-bot' },
  { command: '/video-bot',            description: 'Create AI video and avatar content',             action: 'video-bot' },
  { command: '/user-engagement',      description: 'Map customer journeys and lifecycle flows',      action: 'user-engagement' },
  { command: '/budget-optimization',  description: 'Analyse and reallocate campaign spend',          action: 'budget-optimization' },
  { command: '/performance-scorecard',description: 'Check performance across channels',              action: 'performance-scorecard' },
  { command: '/ai-content',           description: 'Create content — blog, email, social, ads',      action: 'ai-content' },
  { command: '/customer-view',        description: 'See a unified view of your customers',           action: 'customer-view' },
  { command: '/seo-llmo',             description: 'Optimise for search and AI answer engines',      action: 'seo-llmo' },
  { command: '/company-intel',        description: 'Build strategy, ICPs, competitive snapshot',     action: 'company-intel' },
  { command: '/help',                 description: 'How to talk to me',                              action: 'help' },
];

function detectGuidedGoal(input: string): GuidedGoal | null {
  const text = input.toLowerCase();

  const roiSignals = ['roi', 'roas', 'budget', 'reduce cpa', 'improve cpa', 'campaign efficiency'];
  if (roiSignals.some((signal) => text.includes(signal))) {
    return 'roi';
  }

  const contentSignals = ['content plan', 'content strategy', 'content calendar', 'social calendar', 'monthly content'];
  if (contentSignals.some((signal) => text.includes(signal))) {
    return 'content';
  }

  const leadsSignals = ['more leads', 'lead generation', 'qualified leads', 'pipeline growth', 'lead flow'];
  if (leadsSignals.some((signal) => text.includes(signal))) {
    return 'leads';
  }

  return null;
}

function toActionPlanMessage(response: GuidedWorkflowResponse): string {
  const lines = response.actionPlan.what_to_do_this_week.map((item) => `- ${item}`).join('\n');
  return [
    `## Guided Workflow Ready`,
    response.assistantMessage,
    ``,
    `## This Week Action Plan`,
    lines,
    ``,
    `**Owner:** ${response.actionPlan.owner}`,
    `**Expected Impact:** ${response.actionPlan.expected_impact}`,
    ``,
    `I am opening the recommended workflow now.`,
  ].join('\n');
}

// Convert markdown to rich text HTML
function markdownToRichText(markdown: string): string {
  let html = markdown;

  // Escape HTML to prevent XSS
  const escapeHtml = (text: string) => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  // Code blocks (```code```)
  html = html.replace(/```([\s\S]*?)```/g, (match, code) => {
    return `<pre class="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto my-2"><code class="text-xs font-mono">${escapeHtml(code.trim())}</code></pre>`;
  });

  // Inline code (`code`)
  html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>');

  // Headings (## Heading)
  html = html.replace(/^### (.*$)/gm, '<h3 class="text-base font-semibold mt-4 mb-2 text-gray-900 dark:text-gray-100">$1</h3>');
  html = html.replace(/^## (.*$)/gm, '<h2 class="text-lg font-semibold mt-4 mb-2 text-gray-900 dark:text-gray-100">$1</h2>');
  html = html.replace(/^# (.*$)/gm, '<h1 class="text-xl font-bold mt-4 mb-2 text-gray-900 dark:text-gray-100">$1</h1>');

  // Bold (**text** or __text__)
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong class="font-semibold">$1</strong>');

  // Italic (*text* or _text_)
  html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
  html = html.replace(/_(.*?)_/g, '<em class="italic">$1</em>');

  // Links [text](url) — purple instead of orange
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-purple-600 dark:text-purple-400 hover:underline">$1</a>');

  // Unordered lists (- item or * item)
  html = html.replace(/^[*+-]\s+(.+)$/gm, '<li class="ml-4 list-disc">$1</li>');

  // Ordered lists (1. item)
  html = html.replace(/^\d+\.\s+(.+)$/gm, '<li class="ml-4 list-decimal">$1</li>');

  // Wrap consecutive list items in <ul> or <ol>
  html = html.replace(/(<li[^>]*>.*<\/li>\n?)+/g, (match) => {
    if (match.includes('list-decimal')) {
      return `<ol class="space-y-1 my-2">${match}</ol>`;
    }
    return `<ul class="space-y-1 my-2">${match}</ul>`;
  });

  // Horizontal rules (---)
  html = html.replace(/^---$/gm, '<hr class="my-4 border-gray-300 dark:border-gray-700" />');

  // Line breaks (double newline = paragraph, single newline = <br>)
  html = html.split('\n\n').map(paragraph => {
    if (paragraph.trim()) {
      // Check if it's already a block element (heading, list, pre, hr)
      if (/^<(h[1-6]|ul|ol|pre|hr)/.test(paragraph.trim())) {
        return paragraph.trim();
      }
      // Convert single newlines to <br> within paragraphs
      const withBreaks = paragraph.replace(/\n/g, '<br />');
      return `<p class="leading-relaxed mb-2">${withBreaks}</p>`;
    }
    return '';
  }).join('');

  return html;
}

// Component to format AI responses with rich text (not markdown)
function FormattedMessage({ content, isAI }: { content: string; isAI: boolean }) {
  if (!isAI) {
    return <p className="text-sm whitespace-pre-wrap">{content}</p>;
  }

  // Convert markdown to rich text HTML
  const richTextHtml = markdownToRichText(content);

  return (
    <div
      className="text-sm prose prose-sm dark:prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: richTextHtml }}
    />
  );
}

export type Message = {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  file?: {
    name: string;
    size: number;
    type: string;
    url?: string;
  };
};

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  onMessagesChange: Dispatch<SetStateAction<Message[]>>;
  onModuleSelect?: (moduleId: string | null) => void;
}

export function ChatPanel({ isOpen, onClose, messages, onMessagesChange, onModuleSelect }: ChatPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredCommands, setFilteredCommands] = useState(SLASH_COMMANDS);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCSVAnalysis, setShowCSVAnalysis] = useState(false);
  const [csvFile, setCSVFile] = useState<File | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Handle input changes and slash command suggestions
  const handleInputChange = (value: string) => {
    setInputValue(value);

    if (value.startsWith('/')) {
      const query = value.toLowerCase();
      const filtered = SLASH_COMMANDS.filter(cmd =>
        cmd.command.toLowerCase().includes(query) ||
        cmd.description.toLowerCase().includes(query.slice(1))
      );
      setFilteredCommands(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  // Execute slash command
  const executeSlashCommand = async (command: string) => {
    const cmd = SLASH_COMMANDS.find(c => c.command === command);
    if (!cmd) return false;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: command,
      sender: 'user',
      timestamp: new Date(),
    };

    onMessagesChange([...messages, userMessage]);
    setInputValue('');
    setShowSuggestions(false);
    setIsTyping(true);

    // Navigate to the appropriate module first
    if (onModuleSelect && cmd.action !== 'help') {
      const moduleMap: Record<string, string> = {
        'lead-intelligence': 'lead-intelligence',
        'voice-bot': 'ai-voice-bot',
        'video-bot': 'ai-video-bot',
        'user-engagement': 'user-engagement',
        'budget-optimization': 'budget-optimization',
        'performance-scorecard': 'performance-scorecard',
        'ai-content': 'ai-content',
        'customer-view': 'unified-customer-view',
        'seo-llmo': 'seo-llmo',
        'company-intel': 'company-intelligence'
      };

      const moduleId = moduleMap[cmd.action];
      if (moduleId) {
        // Set hash to indicate auto-start
        window.location.hash = 'auto-start';
        onModuleSelect(moduleId);
      } else if (cmd.action === 'agents') {
        onModuleSelect('dashboard');
      } else if (cmd.action === 'workflows') {
        onModuleSelect('workflow-builder');
      }
    }

    try {
      let responseContent = '';

      switch (cmd.action) {
        case 'agents':
          responseContent = `I've opened the AI team for you. Assign work there, or tell me what you want done and I'll route it to the right person.`;
          break;

        case 'workflows':
          responseContent = `I've opened the workflow builder. Use it to chain agents or build a multi-step automation. Let me know if you want help designing it.`;
          break;

        case 'lead-intelligence':
          responseContent = `I've opened Lead Intelligence. Add your data or question there. Tell me what you're trying to find and I can help shape it first.`;
          break;

        case 'voice-bot':
          responseContent = `I've opened Voice Campaigns. Set the brief there, or keep talking here if you want help figuring out the campaign first.`;
          break;

        case 'video-bot':
          responseContent = `I've opened the video workspace. Build the workflow there, or tell me more about what you want to create.`;
          break;

        case 'user-engagement':
          responseContent = `I've opened User Engagement. Configure the flow there, or let me know the goal and I'll help scope it.`;
          break;

        case 'budget-optimization':
          responseContent = `I've opened Budget Optimization. Add your question, timeframe, and campaign data there to run the analysis.`;
          break;

        case 'performance-scorecard':
          responseContent = `I've opened the Performance Scorecard. Use it to understand what's happening and decide where to act next.`;
          break;

        case 'ai-content':
          responseContent = `I've opened the content workspace. Choose your format and brief there, or keep chatting and I'll help you shape it first.`;
          break;

        case 'customer-view':
          responseContent = `I've opened the Customer View. Explore context and signals there, or tell me what you're looking for.`;
          break;

        case 'seo-llmo':
          responseContent = `I've opened SEO / LLMO. Use it for structured work, or describe what you want to improve and we can scope it together.`;
          break;

        case 'help':
          responseContent = `Just tell me what you're working on in plain language — I'll figure out where to take it.\n\nIf you want to jump straight to an area, type \`/\` and the name. Or use \`@name\` to send work directly to a specialist.\n\n**Specialists:** @maya (SEO), @arjun (leads), @riya (content), @zara (campaigns), @dev (performance), @priya (brand), @kiran (social), @sam (email)`;
          break;

        default:
          return false;
      }

      await new Promise(resolve => setTimeout(resolve, 250));

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: responseContent,
        sender: 'ai',
        timestamp: new Date(),
      };

      onMessagesChange([...messages, userMessage, aiMessage]);

      if (cmd.action !== 'help') {
        toast.success(`Opened ${cmd.command.slice(1)}`);
      }

      return true;
    } catch (error) {
      console.error('Slash command error:', error);
      toast.error('Failed to execute command. Please try again.');
      return false;
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    // Check if it's a slash command
    if (inputValue.startsWith('/')) {
      const success = await executeSlashCommand(inputValue.trim());
      if (success) return;
      // If slash command failed, fall through to normal processing
    }

    // Create file info if file is selected
    let fileInfo = undefined;
    if (selectedFile) {
      fileInfo = {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
        url: URL.createObjectURL(selectedFile)
      };
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue || (selectedFile ? `Uploaded file: ${selectedFile.name}` : ''),
      sender: 'user',
      timestamp: new Date(),
      file: fileInfo,
    };

    onMessagesChange([...messages, userMessage]);
    const currentInput = inputValue;
    const currentFile = selectedFile;
    setInputValue('');
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIsTyping(true);

    try {
      const guidedGoal = currentFile ? null : detectGuidedGoal(currentInput);
      if (guidedGoal) {
        try {
          const guidedResponse = await executeGuidedWorkflow({
            userRequest: currentInput,
            goal: guidedGoal,
            moduleHint: 'company-intelligence',
            mode: 'guided',
          });

          sessionStorage.setItem(
            `guided_action_plan_${guidedResponse.actionPlan.goal}`,
            JSON.stringify(guidedResponse.actionPlan)
          );

          if (onModuleSelect) {
            window.location.hash = guidedResponse.navigation.hash;
            onModuleSelect(guidedResponse.navigation.moduleId);
          }

          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: toActionPlanMessage(guidedResponse),
            sender: 'ai',
            timestamp: new Date(),
          };
          onMessagesChange([...messages, userMessage, aiMessage]);
          toast.success('Guided workflow started');
          return;
        } catch (guidedError) {
          console.error('Guided workflow execution failed:', guidedError);
        }
      }

      // Convert messages to Groq format
      const chatMessages: ChatMessage[] = messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      // Add the current user message
      let messageContent = currentInput;
      if (currentFile) {
        messageContent += currentFile ? ` [File uploaded: ${currentFile.name} (${formatFileSize(currentFile.size)})]` : '';
      }

      chatMessages.push({
        role: 'user',
        content: messageContent
      });

      // Get AI response from Groq
      const aiResponse = await GroqService.getChatResponse(chatMessages);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        sender: 'ai',
        timestamp: new Date(),
      };

      onMessagesChange([...messages, userMessage, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to get AI response. Please try again.');

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I\'m having trouble connecting right now. Please try again in a moment.',
        sender: 'ai',
        timestamp: new Date(),
      };

      onMessagesChange([...messages, userMessage, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (showSuggestions && filteredCommands.length > 0) {
        // Auto-complete first suggestion
        const firstCommand = filteredCommands[0];
        setInputValue(firstCommand.command);
        setShowSuggestions(false);
      } else {
        handleSendMessage();
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (command: string) => {
    setInputValue(command);
    setShowSuggestions(false);
  };

  const handleClearChat = () => {
    const welcomeMessage: Message = {
      id: '1',
      content: "Hi, I'm Marqq AI. What are you working on?",
      sender: 'ai',
      timestamp: new Date(),
    };
    onMessagesChange([welcomeMessage]);
    toast.success('Chat cleared');
  };

  // File upload handlers
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = [
        'text/csv',
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];

      if (!validTypes.includes(file.type)) {
        toast.error('Please upload a valid CSV, PDF, or image file');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      setSelectedFile(file);
      toast.success(`${file.name} selected for upload`);

      // Auto-open CSV analysis for CSV files
      if (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv') ||
          file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
        setCSVFile(file);
        setShowCSVAnalysis(true);
      }
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('image')) {
      return <Image className="h-4 w-4" />;
    } else if (fileType.includes('pdf')) {
      return <FileText className="h-4 w-4" />;
    } else if (fileType.includes('csv') || fileType.includes('excel') || fileType.includes('spreadsheet')) {
      return <FileSpreadsheet className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Chat Panel */}
      <div className={cn(
        "fixed top-0 right-0 h-full w-96 bg-background border-l shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        {/* Header — clean minimal style with green online dot */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
          <div className="flex items-center gap-3">
            {/* Purple gradient avatar */}
            <div className="relative h-9 w-9 flex-shrink-0">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-sm">
                <span className="text-sm font-bold text-white">M</span>
              </div>
              {/* Green online dot */}
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Marqq AI</h3>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                <span className="text-[11px] text-muted-foreground">Online</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClearChat}
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
              title="Clear chat"
            >
              <Trash2 className="h-4 w-4" style={{ display: 'block' }} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
              title="Close chat"
            >
              <X className="h-4 w-4" style={{ display: 'block' }} />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex items-end gap-2",
                  message.sender === 'user' ? "flex-row-reverse" : "flex-row"
                )}
              >
                {/* Avatar — only for AI messages */}
                {message.sender === 'ai' && (
                  <div className="h-7 w-7 flex-shrink-0 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-sm">
                    <span className="text-[11px] font-bold text-white">M</span>
                  </div>
                )}

                <div className={cn(
                  "group flex flex-col max-w-[80%]",
                  message.sender === 'user' ? "items-end" : "items-start"
                )}>
                  {/* Bubble */}
                  <div className={cn(
                    "px-3 py-2.5 text-sm shadow-sm",
                    message.sender === 'user'
                      ? "bg-purple-600 text-white rounded-2xl rounded-tr-sm"
                      : "bg-purple-50 dark:bg-purple-950/20 text-gray-800 dark:text-gray-200 rounded-2xl rounded-tl-sm border border-purple-100 dark:border-purple-900/30"
                  )}>
                    {/* File attachment display */}
                    {message.file && (
                      <div className={cn(
                        "flex items-center space-x-2 p-2 rounded mb-2 border",
                        message.sender === 'user'
                          ? "bg-purple-500 border-purple-400"
                          : "bg-background border-border"
                      )}>
                        {getFileIcon(message.file.type)}
                        <div className="flex-1 min-w-0">
                          <div className={cn(
                            "text-xs font-medium truncate",
                            message.sender === 'user' ? "text-purple-100" : "text-foreground"
                          )}>
                            {message.file.name}
                          </div>
                          <div className={cn(
                            "text-xs opacity-70",
                            message.sender === 'user' ? "text-purple-200" : "text-muted-foreground"
                          )}>
                            {formatFileSize(message.file.size)}
                          </div>
                        </div>
                        {message.file.url && message.file.type.includes('image') && (
                          <img
                            src={message.file.url}
                            alt={message.file.name}
                            className="w-8 h-8 object-cover rounded"
                          />
                        )}
                      </div>
                    )}
                    <FormattedMessage
                      content={message.content}
                      isAI={message.sender === 'ai'}
                    />
                  </div>

                  {/* Timestamp — visible on hover */}
                  <p className={cn(
                    "text-[10px] mt-1 px-1 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-150",
                    message.sender === 'user' ? "text-right" : "text-left"
                  )}>
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))}

            {/* Typing Indicator — animated bouncing dots */}
            {isTyping && (
              <div className="flex items-end gap-2">
                <div className="h-7 w-7 flex-shrink-0 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-sm">
                  <span className="text-[11px] font-bold text-white">M</span>
                </div>
                <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t bg-background">
          {/* Selected File Preview */}
          {selectedFile && (
            <div className="mb-3 p-3 bg-muted/50 border border-border/70 rounded-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getFileIcon(selectedFile.type)}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{selectedFile.name}</div>
                    <div className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</div>
                  </div>
                  {selectedFile.type.includes('image') && (
                    <img
                      src={URL.createObjectURL(selectedFile)}
                      alt={selectedFile.name}
                      className="w-10 h-10 object-cover rounded"
                    />
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeSelectedFile}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Slash Command Suggestions */}
          {showSuggestions && filteredCommands.length > 0 && (
            <div className="mb-3 border border-border/70 rounded-2xl bg-background shadow-lg max-h-48 overflow-y-auto">
              {filteredCommands.map((cmd, index) => (
                <div
                  key={cmd.command}
                  className="flex items-center space-x-3 p-3 hover:bg-muted/50 cursor-pointer border-b last:border-b-0"
                  onClick={() => handleSuggestionClick(cmd.command)}
                >
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                      <span className="text-purple-600 font-mono text-sm">/</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{cmd.command}</div>
                    <div className="text-xs text-muted-foreground truncate">{cmd.description}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Full-width pill input bar */}
          <div className="flex items-center gap-2 rounded-full border border-border/70 bg-muted/30 px-3 py-1.5 focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all">
            {/* File Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-shrink-0 p-1 text-muted-foreground hover:text-purple-600 transition-colors"
              title="Upload file (CSV, PDF, Images)"
            >
              <Paperclip className="h-4 w-4" style={{ display: 'block' }} />
            </button>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.pdf,.jpg,.jpeg,.png,.gif,.webp,.xls,.xlsx"
              onChange={handleFileSelect}
              className="hidden"
            />

            <input
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={selectedFile ? "Add a message (optional)..." : "Message Marqq AI..."}
              disabled={isTyping}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60 disabled:opacity-50"
            />

            {/* Send button */}
            <button
              type="button"
              onClick={handleSendMessage}
              disabled={(!inputValue.trim() && !selectedFile) || isTyping}
              className="flex-shrink-0 p-1.5 rounded-full bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Send"
            >
              <Send className="h-3.5 w-3.5 text-white" style={{ display: 'block' }} />
            </button>
          </div>

          <p className="text-xs text-muted-foreground mt-2 text-center">
            Plain language works best. Type `/` to jump somewhere or `@name` to reach a specialist.
          </p>
        </div>
      </div>

      {/* CSV Analysis Panel */}
      {showCSVAnalysis && csvFile && (
        <CSVAnalysisPanel
          file={csvFile}
          onClose={() => {
            setShowCSVAnalysis(false);
            setCSVFile(null);
          }}
        />
      )}
    </>
  );
}
