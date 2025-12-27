import React, { useEffect, useState } from 'react';
import { useProgress } from '../../hooks/usePersistence';
import { getColorForLevel, LevelService } from './LevelSystem';

export const XPDisplay: React.FC = () => {
    const { progress, getLevelData } = useProgress();
    const [animate, setAnimate] = useState(false);
    const [prevXP, setPrevXP] = useState(progress.xp);

    // Get real level data from LevelService
    const levelData = getLevelData();

    useEffect(() => {
        if (progress.xp > prevXP) {
            setAnimate(true);
            const timer = setTimeout(() => setAnimate(false), 1000);
            setPrevXP(progress.xp);
            return () => clearTimeout(timer);
        }
    }, [progress.xp, prevXP]);

    const levelColor = getColorForLevel(levelData.level);

    return (
        <div className="flex flex-col gap-1 w-full max-w-[200px]">
            <div className="flex justify-between items-center text-xs font-bold uppercase text-gray-400">
                <span style={{ color: levelColor }}>
                    Lvl {levelData.level} · {levelData.title}
                </span>
                <span className={`${animate ? 'text-green-500 scale-110' : 'text-gray-500'} transition-all duration-300`}>
                    {LevelService.formatXP(progress.xp)} XP
                </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                    className="h-full transition-all duration-700 ease-out"
                    style={{
                        width: `${levelData.xpProgress}%`,
                        background: `linear-gradient(to right, ${levelColor}, ${levelColor}dd)`
                    }}
                />
            </div>
            {levelData.nextTitle && levelData.levelsToNextTitle <= 5 && (
                <div className="text-[10px] text-gray-400 text-right">
                    {levelData.levelsToNextTitle} níveis para {levelData.nextTitle}
                </div>
            )}
        </div>
    );
};
