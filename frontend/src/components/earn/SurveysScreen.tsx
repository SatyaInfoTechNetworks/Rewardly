import React from 'react';
import { ArrowLeft, Flame } from 'lucide-react';
import { SurveyCard } from './SurveyCard';
import { Survey } from '@/hooks/useSurveys';
import styles from '@/app/page.module.css';

interface SurveysScreenProps {
  surveys: Survey[];
  loading: boolean;
  onBack: () => void;
}

export const SurveysScreen: React.FC<SurveysScreenProps> = ({ surveys, loading, onBack }) => {
  return (
    <div className={styles.surveysFullPage}>
      {/* Header */}
      <header className={styles.subPageHeader}>
        <button onClick={onBack} className={styles.backBtn}>
          <ArrowLeft size={20} />
        </button>
        <div className={styles.subPageTitleGroup}>
          <Flame size={20} className={styles.iconFlame} />
          <h2>All Surveys</h2>
        </div>
        <div style={{ width: 40 }}></div> {/* Spacing balance */}
      </header>

      {/* List */}
      <div className={styles.verticalScrollList}>
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={`skel-${i}`} className={styles.fullWidthCardWrapper}>
               <SurveyCard title="" time="" rating="" reward="" isLoading={true} />
            </div>
          ))
        ) : surveys.length > 0 ? (
          surveys.map((survey) => (
            <div key={survey.id} className={styles.fullWidthCardWrapper}>
              <SurveyCard {...survey} />
            </div>
          ))
        ) : (
          <div className={styles.emptyStateCenter}>
             <p>No surveys available right now.</p>
          </div>
        )}
      </div>
    </div>
  );
};
