import React from 'react';

const AlertBadge = ({ level }) => {
    const config = {
        'HIGH': 'bg-rose-500/10 text-rose-500 border-rose-500/20',
        'MEDIUM': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
        'LOW': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    };

    const styles = config[level] || config['LOW'];

    return (
        <span className={`px-2 py-1 text-[10px] uppercase tracking-widest font-bold rounded-full border ${styles}`}>
            {level}
        </span>
    );
};

export default AlertBadge;
