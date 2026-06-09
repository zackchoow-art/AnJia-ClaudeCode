import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function App() {
  return (
    <div className="min-h-screen flex text-on-surface overflow-hidden bg-surface">
      <Sidebar />

      <div className="flex-1 ml-[260px] flex flex-col min-h-screen relative">
        <Topbar />

        <main className="flex-1 overflow-y-auto pt-[64px] relative px-8 py-6 max-w-[1600px] mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
