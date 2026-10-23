import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { TaskModal } from './components/TaskModal';
import { TaskCreateModal } from './components/TaskCreateModal';
import { WeeklyReflectionModal } from './components/WeeklyReflectionModal';
import { UserProfileModal } from './components/UserProfileModal';

import { DashboardView } from './views/DashboardView';
import { TasksView } from './views/TasksView';
import { DepartmentHealthView } from './views/DepartmentHealthView';
import { ReportsView } from './views/ReportsView';
import { ReflectionsView } from './views/ReflectionsView';
import { AdminView } from './views/AdminView';
import { PendingApprovalView } from './views/PendingApprovalView';
import { AccountRejectedView } from './views/AccountRejectedView';
import { AccessDeniedView } from './views/AccessDeniedView';
import { AuthView } from './views/AuthView';

const MainAppContent: React.FC = () => {
  const {
    currentUser,
    isAuthenticated,
    isUserProfileOpen,
    setIsUserProfileOpen,
    activeView,
    selectedTaskId,
    setSelectedTaskId,
    isCreateTaskOpen,
    setIsCreateTaskOpen,
    createTaskModalMode,
    isReflectionModalOpen,
    setIsReflectionModalOpen,
  } = useApp();

  // If user is not authenticated
  if (!isAuthenticated) {
    return <AuthView />;
  }

  // If user registration is pending approval
  if (currentUser?.registrationStatus === 'pending') {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white transition-colors">
        <PendingApprovalView />
      </div>
    );
  }

  // If user account is rejected or suspended
  if (currentUser?.registrationStatus === 'rejected') {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white transition-colors">
        <AccountRejectedView />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white transition-colors">
      {/* Main Top Header */}
      <Header />

      {/* Full Stack Sidebar + View Layout */}
      <div className="flex flex-1 min-h-[calc(100vh-60px)]">
        <Sidebar />

        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 pb-12 transition-colors">
          {activeView === 'dashboard' && <DashboardView />}
          {activeView === 'tasks' && <TasksView viewModeOverride="active" />}
          {activeView === 'past_tasks' && <TasksView viewModeOverride="past" />}
          {activeView === 'department_health' && <DepartmentHealthView />}
          {activeView === 'reports' && <ReportsView />}
          {activeView === 'reflections' && <ReflectionsView />}
          {activeView === 'admin' && (
            currentUser.role === 'admin' ? (
              <AdminView />
            ) : (
              <AccessDeniedView requiredRole="Administrator" screenName="Admin Operations Center" />
            )
          )}
        </main>
      </div>

      {/* Global Modals */}
      {isUserProfileOpen && (
        <UserProfileModal onClose={() => setIsUserProfileOpen(false)} />
      )}

      {selectedTaskId && (
        <TaskModal taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} />
      )}

      {isCreateTaskOpen && (
        <TaskCreateModal
          initialMode={createTaskModalMode}
          onClose={() => setIsCreateTaskOpen(false)}
        />
      )}

      {isReflectionModalOpen && (
        <WeeklyReflectionModal onClose={() => setIsReflectionModalOpen(false)} />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
