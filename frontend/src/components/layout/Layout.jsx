import React, { memo } from 'react';
import { Outlet } from 'react-router-dom';
import PrimaryBar from './PrimaryBar';
import SecondaryBar from './SecondaryBar';
import Navigation from './NavigationBar';

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

const Layout = LayoutContainer;

export default Layout;