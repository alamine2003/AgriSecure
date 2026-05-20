import React, { useEffect, useState } from 'react';
import client from '../api/client';
import AlertBadge from './AlertBadge';

const DetectionLog = () => {
    const [detections, setDetections] = useState([]);

    useEffect(() => {
        client.get('/surveillance/detections/')
            .then(res => setDetections(res.data))
            .catch(err => console.error(err));
    }, []);

    return (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 bg-slate-800/30">
                <h2 className="text-sm font-bold flex items-center justify-between text-white">
                    LOGS DE DÉTECTION
                    <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded uppercase tracking-wider text-slate-300">LIVE</span>
                </h2>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-800/30 border-b border-slate-800">
                        <tr>
                            <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Time</th>
                            <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Camera</th>
                            <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Object</th>
                            <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Confidence</th>
                            <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Danger</th>
                        </tr>
                    </thead>
                    <tbody>
                        {detections.map(det => (
                            <tr key={det.id} className="border-b border-slate-800 hover:bg-slate-800/20 transition-colors">
                                <td className="p-4 text-sm text-slate-300">{new Date(det.detected_at).toLocaleString()}</td>
                                <td className="p-4 text-sm font-mono text-slate-400">{det.camera_name || det.camera}</td>
                                <td className="p-4 text-sm font-bold text-white">{det.label}</td>
                                <td className="p-4 text-sm text-slate-300">{(det.confidence * 100).toFixed(1)}%</td>
                                <td className="p-4 text-sm"><AlertBadge level={det.danger_level} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DetectionLog;
