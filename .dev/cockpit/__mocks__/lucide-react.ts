// Lightweight mock for lucide-react used in tests.
// Do NOT import React here to avoid resolving a second React instance during test runs.
// Components return null so they don't create elements from a different React copy.

const Icon = (_props?: unknown) => null;

const named: Record<string, unknown> = {
  default: Icon,
  ArrowRight: Icon,
  ListChecks: Icon,
  CalendarDays: Icon,
  Crown: Icon,
  Cpu: Icon,
  Shield: Icon,
  Workflow: Icon,
  Users: Icon,
  Target: Icon,
  Brain: Icon,
  LineChart: Icon,
  Wallet: Icon,
  Database: Icon,
  ShieldCheck: Icon,
  UserCheck: Icon,
  MessageCircle: Icon,
  ClipboardList: Icon,
  Megaphone: Icon,
  FileText: Icon,
  Radar: Icon,
  Bug: Icon,
  Gauge: Icon,
  Activity: Icon,
  Inbox: Icon,
  Mail: Icon,
  TrendingUp: Icon,
  FileBarChart2: Icon,
};

const proxy = new Proxy(named, {
  get(target, prop: string) {
    if (prop in target) {
      const t = target as unknown as Record<string, unknown>;
      return t[prop as string];
    }
    return Icon;
  }
});

export default proxy as unknown as Record<string, unknown>;
export const __esModule = true;
// Named exports for icons used across the app/tests
export const ArrowRight = Icon;
export const ListChecks = Icon;
export const CalendarDays = Icon;
export const Crown = Icon;
export const Cpu = Icon;
export const Shield = Icon;
export const Workflow = Icon;
export const Users = Icon;
export const Target = Icon;
export const Brain = Icon;
export const LineChart = Icon;
export const Wallet = Icon;
export const Database = Icon;
export const ShieldCheck = Icon;
export const UserCheck = Icon;
export const MessageCircle = Icon;
export const ClipboardList = Icon;
export const Megaphone = Icon;
export const FileText = Icon;
export const Radar = Icon;
export const Bug = Icon;
export const Gauge = Icon;
export const Activity = Icon;
export const Inbox = Icon;
export const Mail = Icon;
export const TrendingUp = Icon;
export const FileBarChart2 = Icon;
