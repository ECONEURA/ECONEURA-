import React from 'react';
import {
  ClipboardList,
  CalendarDays,
  Megaphone,
  FileText,
  Gauge,
  Activity,
  FileBarChart2,
  MessageCircle,
  ListChecks,
  Bug,
  Radar,
  Inbox,
  Mail,
  TrendingUp,
} from 'lucide-react';

const cx = (...cls: (string | boolean | undefined)[]) => cls.filter(Boolean).join(' ');

export function isReactComponent(x: any): x is React.ElementType {
  return !!x && (typeof x === 'function' || typeof x === 'object');
}

export function iconForAgent(title: string): React.ElementType {
  const t = title.toLowerCase();
  let Icon: any = ClipboardList;
  if (t.includes('agenda')) Icon = CalendarDays;
  else if (t.includes('anuncio') || t.includes('comunicado')) Icon = Megaphone;
  else if (t.includes('resumen') || t.includes('registro')) Icon = FileText;
  else if (t.includes('okr') || t.includes('score')) Icon = Gauge;
  else if (t.includes('salud') || t.includes('health')) Icon = Activity;
  else if (t.includes('cost') || t.includes('gasto')) Icon = FileBarChart2;
  else if (t.includes('prompts')) Icon = MessageCircle;
  else if (t.includes('cuotas')) Icon = ListChecks;
  else if (t.includes('incidenc')) Icon = Bug;
  else if (t.includes('observabilidad') || t.includes('slo')) Icon = Radar;
  else if (t.includes('phishing')) Icon = Inbox;
  else if (t.includes('email')) Icon = Mail;
  else if (t.includes('tendencias')) Icon = TrendingUp;
  return isReactComponent(Icon) ? Icon : ClipboardList;
}

export type Agent = { id: string; title: string; desc: string; pills?: string[] };
type AgentCardProps = { a: Agent; busy?: boolean; onRun: () => Promise<any> | void };

export default function AgentCard({ a, busy, onRun }: AgentCardProps) {
  const I: any = iconForAgent(a.title);
  return (
    <div className='bg-white rounded-xl border p-4 flex flex-col'>
      <div className='flex items-start justify-between gap-3'>
        <div className='flex items-start gap-2'>
          {React.createElement(I, { className: 'w-4 h-4 mt-0.5 text-[#4b5563]' })}
          <div>
            <div className='font-semibold'>{a.title}</div>
            <div className='text-sm text-gray-600'>{a.desc}</div>
          </div>
        </div>
        <span className='text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border'>
          Activo
        </span>
      </div>

      {a.pills && (
        <div className='mt-2 text-[11px] text-gray-600 flex gap-2 flex-wrap'>
          {a.pills.map((p, i) => (
            <span key={i} className='px-2 py-0.5 rounded-md bg-gray-100 border'>
              {p}
            </span>
          ))}
        </div>
      )}

      <div className='mt-3'>
        <div className='h-2 rounded bg-gray-100 overflow-hidden'>
          <div className='h-2 bg-gray-300' style={{ width: '11%' }} />
        </div>
        <div className='mt-1 text-[11px] text-gray-500'>11%</div>
      </div>

      <div className='mt-3 flex gap-2'>
        <button
          onClick={() => onRun()}
          disabled={!!busy}
          className={cx(
            'h-9 px-3 rounded-md border text-sm',
            busy
              ? 'opacity-60 cursor-not-allowed'
              : 'bg-gray-100 hover:bg-gray-200 flex items-center gap-1'
          )}
        >
          Ejecutar
        </button>
        <button className='h-9 px-3 rounded-md border text-sm'>Pausar</button>
      </div>
    </div>
  );
}
