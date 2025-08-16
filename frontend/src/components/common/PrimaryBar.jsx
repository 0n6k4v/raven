import React, { memo } from 'react';
import logo from '../../assets/raven.png';

/* ========================= PRESENTATIONAL COMPONENTS ========================= */
const RavenLogo = memo(function RavenLogo() {
  return (
    <div className="flex items-center space-x-2">
      <img
        src={logo}
        alt="RAVEN Logo"
        className="h-8 w-auto"
        loading="lazy"
        decoding="async"
      />
      <div className="leading-tight">
        <h1 className="text-xl font-bold text-white m-0 leading-none">RAVEN</h1>
        <p
          className="text-[2.7px] text-white m-0 leading-none tracking-wide"
          aria-label="RAPID ANALYSIS FOR VIOLENT EVIDENCE & NARCOTICS"
        >
          RAPID ANALYSIS FOR VIOLENT EVIDENCE &amp; NARCOTICS
        </p>
      </div>
    </div>
  );
});

/* ========================= MAIN COMPONENT ========================= */
const PrimaryBar = memo(function PrimaryBar() {
  return (
    <header
      className="h-12 bg-gradient-to-r from-crimson to-deep-maroon flex items-center px-4 sm:px-6 justify-between text-white w-full"
      role="banner"
    >
      <RavenLogo />
    </header>
  );
});

export default PrimaryBar;