import { useEffect } from 'react';

const NoIndexEnvironments = () => {
  useEffect(() => {
    // Check if we're in UAT environment or API environment
    const isUAT = window.location.hostname.includes('uat');
    const isAPI = window.location.hostname.includes('api');
    
    if (isUAT || isAPI) {
      // Add noindex meta tag
      const noindexMeta = document.createElement('meta');
      noindexMeta.name = 'robots';
      noindexMeta.content = 'noindex, nofollow, noarchive, nosnippet, noimageindex';
      document.head.appendChild(noindexMeta);
      
      // Add noindex for Google
      const googleNoindex = document.createElement('meta');
      googleNoindex.name = 'googlebot';
      googleNoindex.content = 'noindex, nofollow, noarchive, nosnippet, noimageindex';
      document.head.appendChild(googleNoindex);
      
      // Add noindex for Bing
      const bingNoindex = document.createElement('meta');
      bingNoindex.name = 'bingbot';
      bingNoindex.content = 'noindex, nofollow, noarchive, nosnippet, noimageindex';
      document.head.appendChild(bingNoindex);
    }
  }, []);

  return null;
};

export default NoIndexEnvironments;
