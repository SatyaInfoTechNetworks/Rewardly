import React, { useState } from 'react';
import { ArrowLeft, Flame, Search, X } from 'lucide-react';
import { SurveyCard } from './SurveyCard';
import { Survey } from '@/hooks/useSurveys';
import styles from '@/app/page.module.css';

interface SurveysScreenProps {
  surveys: Survey[];
  loading: boolean;
  onBack: () => void;
}

export const SurveysScreen: React.FC<SurveysScreenProps> = ({ surveys, loading, onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSurveys = surveys.filter(survey => 
    survey.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    survey.source?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <div style={{ width: 40 }}></div>
      </header>

      {/* Search Bar */}
      <div className={styles.searchBarWrapper}>
        <div className={styles.searchInner}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search surveys..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className={styles.clearSearch}>
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className={styles.verticalScrollList}>
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={`skel-${i}`} className={styles.fullWidthCardWrapper}>
               <SurveyCard title="" time="" rating="" reward="" isLoading={true} />
            </div>
          ))
        ) : filteredSurveys.length > 0 ? (
          filteredSurveys.map((survey) => (
            <div key={survey.id} className={styles.fullWidthCardWrapper}>
              <SurveyCard {...survey} />
            </div>
          ))
        ) : (
          <div className={styles.emptyStateCenter}>
             <p>{searchQuery ? "No matching surveys found." : "No surveys available right now."}</p>
          </div>
        )}
      </div>
    </div>
  );
};
