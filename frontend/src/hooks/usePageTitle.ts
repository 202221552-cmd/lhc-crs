import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export const usePageTitle = (pageName: string) => {
  const { centerName } = useAuth();

  useEffect(() => {
    document.title = centerName ? `${centerName} | ${pageName}` : pageName;
  }, [centerName, pageName]);
};
