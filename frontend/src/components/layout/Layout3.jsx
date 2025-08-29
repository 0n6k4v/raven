import React from 'react';
import { Outlet } from 'react-router-dom'
import PrimaryBar from '../common/PrimaryBar';
import SecondaryBar from '../common/SecondaryBar';
import Navigation from '../common/NavigationBar';

const Layout3 = () => {
  return (
    <div className="h-screen flex flex-col">
        <div className='hidden sm:block'>
            <PrimaryBar />
            <SecondaryBar />
        </div>
        <div className="flex flex-1 overflow-hidden">
            <div className='hidden sm:block'>
                <Navigation />
            </div>
            <div className="flex flex-1 overflow-auto">
                <Outlet />
            </div>
        </div>
    </div>
  );
};

export default Layout3;