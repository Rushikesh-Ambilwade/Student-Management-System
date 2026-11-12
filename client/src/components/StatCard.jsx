export default function StatCard({
  title,
  value,
  subtext,
  icon: Icon,
  badgeText,
  badgeType = 'info', // 'success', 'warning', 'danger', 'info'
  colorClass = 'from-indigo-600 to-indigo-500',
  onClick
}) {
  const badgeStyles = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-indigo-50 text-indigo-700 border-indigo-200'
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden group ${
        onClick ? 'cursor-pointer hover:border-indigo-300' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
          <div className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">{value}</div>
        </div>
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${colorClass} text-white flex items-center justify-center shadow-md shadow-indigo-500/10 group-hover:scale-105 transition-transform`}>
          {Icon && <Icon className="w-5 h-5" />}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        {subtext && <span className="text-slate-500 font-medium truncate">{subtext}</span>}
        {badgeText && (
          <span className={`px-2 py-0.5 rounded-full font-semibold border ${badgeStyles[badgeType] || badgeStyles.info}`}>
            {badgeText}
          </span>
        )}
      </div>
    </div>
  );
}
