export interface SEOData {
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  canonical?: string;
  jsonLd?: Record<string, any>;
}

const defaultSEO: SEOData = {
  title: 'MalikAuth — Enterprise Software Licensing & Hardware Security',
  description:
    'Protect your software with AES-256 memory encryption, HWID locking, live session revocation, and instant remote variable synchronization.',
  ogType: 'website',
};

export function updateSEO(data: Partial<SEOData>): void {
  const merged = { ...defaultSEO, ...data };
  document.title = merged.title;

  setMetaTag('description', merged.description);
  setMetaTag('og:title', merged.ogTitle || merged.title);
  setMetaTag('og:description', merged.ogDescription || merged.description);
  setMetaTag('og:type', merged.ogType || 'website');
  if (merged.ogImage) setMetaTag('og:image', merged.ogImage);

  setMetaTag('twitter:card', 'summary_large_image');
  setMetaTag('twitter:title', merged.ogTitle || merged.title);
  setMetaTag('twitter:description', merged.ogDescription || merged.description);

  if (merged.canonical) {
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = merged.canonical;
  }

  if (merged.jsonLd) {
    let script = document.querySelector('script[type="application/ld+json"]') as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(merged.jsonLd);
  }
}

function setMetaTag(name: string, content: string): void {
  let el =
    document.querySelector(`meta[property="${name}"]`) ||
    document.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    if (name.startsWith('og:') || name.startsWith('article:')) {
      el.setAttribute('property', name);
    } else {
      el.setAttribute('name', name);
    }
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function removeSEO(): void {
  document.title = 'MalikAuth — Enterprise Software Licensing & Hardware Security';
  const jsonLd = document.querySelector('script[type="application/ld+json"]');
  if (jsonLd) jsonLd.remove();
}

export function getOrganizationJsonLd(): Record<string, any> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'MalikAuth',
    url: 'https://malikauth.com',
    logo: 'https://malikauth.com/logo.png',
    description:
      'Enterprise software licensing and hardware security platform with AES-256 memory encryption.',
    sameAs: [],
  };
}

export function getWebApplicationJsonLd(): Record<string, any> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'MalikAuth Security Platform',
    url: 'https://malikauth.com',
    applicationCategory: 'SecurityApplication',
    operatingSystem: 'Web',
    description:
      'Enterprise software licensing, hardware fingerprint locking, AES-256 memory encryption, and real-time session management.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };
}

export function getBreadcrumbJsonLd(items: { name: string; url: string }[]): Record<string, any> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
