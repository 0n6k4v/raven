import React, { memo } from 'react';
import { Outlet } from 'react-router-dom';
import PrimaryBar from '../common/PrimaryBar';
import SecondaryBar from '../common/SecondaryBar';
import Navigation from '../common/NavigationBar';

/* PRESENTATIONAL COMPONENTS */
const LayoutContainer = memo(function LayoutContainer() {
  return (
    <div className="h-screen flex flex-col">
      <PrimaryBar />
      <SecondaryBar />
      <div className="flex flex-1 overflow-hidden">
        <Navigation />
        <main className="flex-1 overflow-auto pb-16 sm:pb-0" tabIndex={-1} aria-label="Main Content">
          <Outlet />
        </main>
      </div>
    </div>
  );
});

/* MAIN COMPONENT */
const Layout = LayoutContainer;

export default Layout;