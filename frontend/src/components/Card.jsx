import React from 'react';

const Card = ({ children, className = '', ...props }) => {
    return (
        <div
            className={`glass-panel rounded-xl shadow-xl border border-white/5 overflow-hidden ${className}`}
            {...props}
        >
            {children}
        </div>
    );
};

export const CardHeader = ({ title, subtitle, action }) => (
    <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
        <div>
            {title && <h3 className="text-lg font-bold text-white font-display">{title}</h3>}
            {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
    </div>
);

export const CardBody = ({ children, className = '' }) => (
    <div className={`p-6 ${className}`}>
        {children}
    </div>
);

export default Card;
