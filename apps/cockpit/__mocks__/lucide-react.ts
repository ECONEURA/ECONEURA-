import React from 'react';

const make = (name: string) => (props: any) =>
  React.createElement('svg', { 'data-icon': name, ...props });

export const ClipboardList = make('ClipboardList');
export const CalendarDays = make('CalendarDays');
export const Megaphone = make('Megaphone');
export const FileText = make('FileText');
export const Gauge = make('Gauge');
export const Activity = make('Activity');
export const FileBarChart2 = make('FileBarChart2');
export const MessageCircle = make('MessageCircle');
export const ListChecks = make('ListChecks');
export const Bug = make('Bug');
export const Radar = make('Radar');
export const Inbox = make('Inbox');
export const Mail = make('Mail');
export const TrendingUp = make('TrendingUp');

// Additional icons used by EconeuraCockpit
export const Crown = make('Crown');
export const Cpu = make('Cpu');
export const Shield = make('Shield');
export const Workflow = make('Workflow');
export const Users = make('Users');
export const Target = make('Target');
export const Brain = make('Brain');
export const LineChart = make('LineChart');
export const Wallet = make('Wallet');
export const Database = make('Database');
export const ShieldCheck = make('ShieldCheck');
export const UserCheck = make('UserCheck');

export default undefined;
