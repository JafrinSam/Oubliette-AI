import React from 'react';
import { Outlet } from 'react-router-dom';
import ClientNavbar from '../components/ClientNavbar'; // 💡 Import new navbar
import Footer from '../components/client/Footer';

export default function ClientLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-primary transition-colors duration-300">
      <ClientNavbar />
      <main className="flex-grow"> 
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}