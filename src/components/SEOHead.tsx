import { useEffect, type FC } from 'react';
import { updateSEO, removeSEO, type SEOData } from '../lib/seo';

interface SEOHeadProps {
  data: Partial<SEOData>;
}

export const SEOHead: FC<SEOHeadProps> = ({ data }) => {
  useEffect(() => {
    updateSEO(data);
    return () => removeSEO();
  }, [data]);

  return null;
};
