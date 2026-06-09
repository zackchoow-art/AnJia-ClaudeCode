import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  Building2,
  Tags,
  HardHat,
  FileSignature,
  CheckSquare,
  Wallet,
  Settings,
  History
} from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Contracts from './pages/Contracts';
import SettingsView from './pages/Settings';
import Engineering from './pages/Engineering';
import Projects from './pages/Projects';
import ProjectForm from './pages/ProjectForm';
import Organization from './pages/Organization';
import Sales from './pages/Sales';
import Approvals from './pages/Approvals';
import Finance from './pages/Finance';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';

export type PageView = '仪表盘' | '项目' | '组织' | '销售' | '工程' | '合同' | '审批' | '财务' | '设置' | '审计日志' | '新建项目';

export default function App() {
  const [activePage, setActivePage] = useState<PageView>('仪表盘');

  // 监听自定义导航事件
  useEffect(() => {
    const handleNavigate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.page === 'ProjectsForm') {
        setActivePage('新建项目');
      }
    };

    window.addEventListener('navigateTo', handleNavigate as EventListener);
    return () => {
      window.removeEventListener('navigateTo', handleNavigate as EventListener);
    };
  }, []);

  const renderContent = () => {
    switch (activePage) {
      case '仪表盘':
        return <Dashboard />;
      case '项目':
        return <Projects />;
      case '组织':
        return <Organization />;
      case '销售':
        return <Sales />;
      case '工程':
        return <Engineering />;
      case '合同':
        return <Contracts />;
      case '审批':
        return <Approvals />;
      case '财务':
        return <Finance />;
      case '设置':
      case '审计日志':
        return <SettingsView />;
      case '新建项目':
        return <ProjectForm />;
      default:
        return (
          <div className="flex-1 flex flex-col items-center justify-center text-on-surface-variant opacity-50 p-8">
            <h2 className="text-2xl font-bold mb-2">模块建设中</h2>
            <p>{activePage} 模块正在部署中。</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex text-on-surface overflow-hidden">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      
      <div className="flex-1 ml-[240px] flex flex-col min-h-screen w-[calc(100%-240px)] relative">
        <Topbar />
        
        <main className="flex-1 overflow-y-auto pt-[64px] relative">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
