import React, { useEffect, useState } from 'react';
import { useProgress } from '../../hooks/usePersistence';

export const XPDisplay: React.FC = () => {
    const { progress } = useProgress();
    const [animate, setAnimate] = useState(false);
    const [prevXP, setPrevXP] = useState(progress.xp);

    useEffect(() => {
        if (progress.xp > prevXP) {
            setAnimate(true);
            const timer = setTimeout(() => setAnimate(false), 1000);
            setPrevXP(progress.xp);
            return () => clearTimeout(timer);
        }
    }, [progress.xp, prevXP]);

    const levelProgress = (progress.xp % 500) / 500 * 100;

    return (
        <div className="flex flex-col gap-1 w-full max-w-[200px]">
            <div className="flex justify-between items-center text-xs font-bold uppercase text-gray-400">
                <span>Level {progress.level}</span>
                <span className={`${animate ? 'text-green-500 scale-110' : 'text-gray-500'} transition-all duration-300`}>
                    {progress.xp} XP
                </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-700 ease-out"
                    style={{ width: `${levelProgress}%` }}
                />
            </div>
        </div>
    );
};
