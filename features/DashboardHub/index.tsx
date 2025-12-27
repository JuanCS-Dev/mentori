import React from 'react';
import { WelcomeCard } from './WelcomeCard';
import { QuickStats } from './QuickStats';
import { TodayPlan } from './TodayPlan';
import { QuickActions } from './QuickActions';
import { EmbeddedChat } from './EmbeddedChat';
import { useProgress } from '../../hooks/usePersistence';
import { NeuroStudyPlanJSON, AppView } from '../../types';

interface DashboardHubProps {
  studyPlan: NeuroStudyPlanJSON | null;
  onNavigate: (view: AppView) => void;
}

export const DashboardHub: React.FC<DashboardHubProps> = ({ studyPlan, onNavigate }) => {
  const { progress, getAccuracy, getLevelData } = useProgress();
  const accuracy = getAccuracy();
  const levelData = getLevelData();

  const handleStartBlock = (blockIndex: number) => {
    console.log('Starting block:', blockIndex);
    onNavigate(AppView.STUDY_CYCLE);
  };

  return (
    <div className="animate-in fade-in duration-500">
      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Welcome Card */}
          <WelcomeCard progress={progress} levelData={levelData} />

          {/* Quick Stats */}
          <QuickStats progress={progress} accuracy={accuracy} />

          {/* Today's Plan */}
          <TodayPlan studyPlan={studyPlan} onStartBlock={handleStartBlock} />

          {/* Quick Actions */}
          <QuickActions onNavigate={onNavigate} pendingReviews={progress.questionsAnswered - progress.questionsCorrect} />
        </div>

        {/* Right Column - Chat (1/3) */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <EmbeddedChat />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHub;
