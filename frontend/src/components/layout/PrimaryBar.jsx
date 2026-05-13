import React, { memo, useMemo } from 'react';
import logoAsset from '../../assets/raven.png';

// ============================================================================
// DOMAIN LAYER - Pure Business Logic
// ============================================================================

class AppIdentityEntity {
  constructor() {
    this.acronym = "RAVEN";
    this.tagline = "RAPID ANALYSIS FOR VIOLENT EVIDENCE & NARCOTICS";
    this.logoAltText = "RAVEN Logo";
  }
}

// ============================================================================
// APPLICATION LAYER - Hooks & Use Cases
// ============================================================================

export const useBranding = () => {
  const identity = useMemo(() => new AppIdentityEntity(), []);
  
  return {
    identity
  };
};

// ============================================================================
// PRESENTATION LAYER - UI Components
// ============================================================================

const LogoImage = memo(({ alt }) => (
  <img
    src={logoAsset}
    alt={alt}
    className="h-8 w-auto"
    loading="lazy"
    decoding="async"
  />
));

const BrandTypography = memo(({ acronym, tagline }) => (
  <div className="leading-tight">
    <h1 className="text-xl font-bold text-white m-0 leading-none">
      {acronym}
    </h1>
    <p
      className="text-[2.7px] text-white m-0 leading-none tracking-wide"
      aria-label={tagline}
    >
      {tagline}
    </p>
  </div>
));

const BrandingGroup = memo(({ identity }) => (
  <div className="flex items-center space-x-2">
    <LogoImage alt={identity.logoAltText} />
    <BrandTypography 
      acronym={identity.acronym} 
      tagline={identity.tagline} 
    />
  </div>
));

// ============================================================================
// MAIN COMPONENT - Composition Root
// ============================================================================

const PrimaryBar = memo(function PrimaryBar() {
  const { identity } = useBranding();

  return (
    <header
      className="h-12 bg-gradient-to-r from-crimson to-deep-maroon flex items-center px-4 sm:px-6 justify-between text-white w-full"
      role="banner"
    >
      <BrandingGroup identity={identity} />
    </header>
  );
});

export default PrimaryBar;