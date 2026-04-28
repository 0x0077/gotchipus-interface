'use client'

export const StatsBar = ({ totalListed }: { totalListed: number }) => {
  const stats = [
    { label: 'Floor Price',  value: '5', unit: 'USDC', icon: '◆', change: '+2.4%' },
    { label: '24h Volume',   value: '1.24',  unit: 'USDC', icon: '◈', change: '+18.7%' },
    { label: 'Total Listed', value: String(totalListed), unit: '',   icon: '▣' },
    { label: 'Owners',       value: '128',   unit: '',     icon: '◉' },
  ];

  return (
    <div className="grid grid-cols-4 gap-[3px] mb-1.5">
      {stats.map(s => (
        <div key={s.label} className="shadow-win98-inner bg-white px-2 py-1.5">
          <div className="text-[9px] text-[#808080] tracking-wide uppercase mb-[3px] flex items-center gap-[3px]">
            <span className="text-[#000080]">{s.icon}</span>{s.label}
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-[15px] font-bold font-mono">
              {s.value}
            </span>
            {s.unit && <span className="text-[10px] text-[#808080]">{s.unit}</span>}
            {s.change && (
              <span className={`text-[9px] font-bold ml-auto ${s.change.startsWith('+') ? 'text-[#008000]' : 'text-[#cc0000]'}`}>
                {s.change}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
