import React from 'react';
import { 
  MessageSquare, 
  Zap, 
  User, 
  Settings, 
  Home, 
  Database, 
  Wrench as Tool, 
  FileText, 
  ChevronRight, 
  ArrowRight, 
  Loader2, 
  Plus, 
  X, 
  Check, 
  Trash, 
  Edit, 
  Save, 
  Copy, 
  Play, 
  StopCircle,
  Undo,
  Redo,
  Code,
  Cpu,
  Bot,
  Server,
  Repeat,
  Share2,
  Eye,
  EyeOff,
  Share,
  Clipboard,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  Send
} from 'lucide-react';

export type IconType = React.FC<{ className?: string }>;

// Define the shape of our icons object
export type IconsType = {
  [key: string]: IconType;
};

// Export a collection of icons to be used throughout the app
export const Icons: IconsType = {
  messageSquare: MessageSquare,
  zap: Zap,
  user: User,
  settings: Settings,
  home: Home,
  database: Database,
  tool: Tool,
  fileText: FileText,
  chevronRight: ChevronRight,
  arrowRight: ArrowRight,
  loader: Loader2,
  plus: Plus,
  x: X,
  check: Check,
  trash: Trash,
  edit: Edit,
  save: Save,
  copy: Copy,
  play: Play,
  stop: StopCircle,
  undo: Undo,
  redo: Redo,
  code: Code,
  cpu: Cpu,
  bot: Bot,
  server: Server,
  repeat: Repeat,
  share: Share,
  eye: Eye,
  eyeOff: EyeOff,
  clipboard: Clipboard,
  share2: Share2,
  maximize: Maximize2,
  maximize2: Maximize2,
  minimize: Minimize2,
  minimize2: Minimize2,
  more: MoreHorizontal,
  send: Send
};

export default Icons;