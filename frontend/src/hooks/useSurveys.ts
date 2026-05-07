import { useState, useEffect } from 'react';

export interface Survey {
  id: string;
  title: string;
  time: string;
  rating: string;
  reward: string;
  href: string;
  category?: string;
}

export const useSurveys = (userId: string | undefined) => {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSurveys = async () => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://rewardlyapi.satyainfotechnetworks.com';
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_URL}/api/surveys/cpx?userId=${userId}`, {
        credentials: 'include'
      });
      const data = await response.json();

      if (data.status === "success" && data.surveys && data.surveys.length > 0) {
        const mappedSurveys = data.surveys.map((s: any) => ({
          id: s.id,
          title: s.category ? `${s.category} Survey` : "Market Research",
          time: `${s.loi} mins`,
          // Use exact value of statistics_rating_count for ratings as requested
          rating: s.statistics_rating_count.toString(),
          reward: Math.floor(parseFloat(s.payout)).toLocaleString(),
          href: s.href_new,
          category: s.category
        }));
        setSurveys(mappedSurveys);
      } else {
        // Remove fallback as requested. Keep surveys empty.
        setSurveys([]);
        if (data.status === "error") {
          setError(data.message);
        }
      }
    } catch (err: any) {
      console.error("Survey Fetch Error:", err);
      setError(err.message);
      setSurveys([]); // No fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchSurveys();
    }
  }, [userId]);

  return { surveys, loading, error, refetch: fetchSurveys };
};
