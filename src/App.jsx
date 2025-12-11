import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TaskForm from './components/TaskForm';
import TaskMonitor from './components/TaskMonitor';
import SettingsModal from './components/SettingsModal';
import { useTaskQueue } from './hooks/useTaskQueue';
import { v4 as uuidv4 } from 'uuid';

export default function App() {
  // Settings State
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('sora_settings');
    return saved ? JSON.parse(saved) : {
      baseUrl: 'http://localhost:8082',
      apiKey: '',
      savePath: 'C:\\Downloads\\Sora',
      concurrency: 2
    };
  });

  const [activeLayout, setActiveLayout] = useState('split'); // split | full
  const [projects, setProjects] = useState(() => {
    try {
      const saved = localStorage.getItem('sora_projects');
      return saved ? JSON.parse(saved) : [{ id: 'default', name: '我的第一个项目' }];
    } catch {
      return [{ id: 'default', name: '我的第一个项目' }];
    }
  });

  // Persist projects
  useEffect(() => {
    localStorage.setItem('sora_projects', JSON.stringify(projects));
  }, [projects]);
  const [activeProjectId, setActiveProjectId] = useState('default');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Task Queue Hook
  const { tasks, addTask, clearTasks } = useTaskQueue(settings);

  // Filter tasks by project? (Optional requirement, but good for "Projects")
  // User said "The sidebar can create new projects". "Clicking a task... shows details".
  // For simplicity, I'll filter visual tasks, but useTaskQueue manages global queue.
  const projectTasks = tasks.filter(t => t.projectId === activeProjectId);

  const handleSaveSettings = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('sora_settings', JSON.stringify(newSettings));
  };

  // Draft State (Persisted)
  const [projectDrafts, setProjectDrafts] = useState(() => {
    try {
      const saved = localStorage.getItem('sora_project_drafts');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Persist drafts
  useEffect(() => {
    try {
      localStorage.setItem('sora_project_drafts', JSON.stringify(projectDrafts));
    } catch (e) {
      console.warn("Failed to save drafts:", e);
    }
  }, [projectDrafts]);

  const currentDraft = projectDrafts[activeProjectId] || {
    prompt: '',
    ratio: '16:9',
    duration: '10s',
    image: null,
    imagePreview: null
  };

  const handleDraftChange = (field, value) => {
    setProjectDrafts(prev => ({
      ...prev,
      [activeProjectId]: {
        ...prev[activeProjectId],
        [field]: value
      }
    }));
  };

  const handleCreateTask = (taskData) => {
    addTask({
      ...taskData,
      projectId: activeProjectId
    });
  };

  const handleOpenTask = (task) => {
    // Open video if downloaded
    if (task.localPath && window.api) {
      window.api.openPath(task.localPath);
    } else if (task.videoUrl) {
      window.open(task.videoUrl, '_blank');
    }
  };

  // Edit Task: Fill draft with task details
  const handleEditTask = (task) => {
    setProjectDrafts(prev => ({
      ...prev,
      [activeProjectId]: {
        prompt: task.prompt || '',
        ratio: task.ratio || '16:9',
        duration: task.duration || '10s',
        imagePreview: task.image || null, // task.image holds the base64/url
        image: null // Cannot restore File object, but preview works for display
      }
    }));
  };

  const handleAddProject = (project) => {
    setProjects(prev => [...prev, project]);
    setActiveProjectId(project.id);
  };

  const handleDeleteProject = (projectId) => {
    if (projects.length <= 1) return;
    if (confirm('确定要删除这个项目吗？')) {
      setProjects(prev => prev.filter(p => p.id !== projectId));
      if (activeProjectId === projectId) {
        setActiveProjectId(projects[0].id);
      }
    }
  };

  // Dynamic Title Bar for Modal Backdrop
  useEffect(() => {
    if (window.api && window.api.updateTitleBarOverlay) {
      if (isSettingsOpen) {
        // Dim the title bar to simulate backdrop (approximate gray)
        window.api.updateTitleBarOverlay({
          color: '#808080', // Match rgba(0,0,0,0.5) backdrop on white bg
          symbolColor: '#ffffff' // Switch to white symbols on dark background
        });
      } else {
        // Restore to pure white
        window.api.updateTitleBarOverlay({
          color: '#ffffff',
          symbolColor: '#1f2937'
        });
      }
    }
  }, [isSettingsOpen]);

  return (
    <div className="flex h-screen w-full text-[var(--text-primary)] overflow-hidden">
      <Sidebar
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={setActiveProjectId}
        onAddProject={handleAddProject}
        onDeleteProject={handleDeleteProject}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header - Glass Effect */}
        <header className="h-16 flex items-center justify-between px-6 app-drag-region flex-shrink-0 glass-panel mx-4 mt-4 rounded-2xl mb-0">
          {/* mx-4 mt-4. Removed mb-2 (using padding in container below for gap) or keep gap? 
              Sidebar has my-4. 
              Header is mt-4. 
              Content starts after header. We want bottom of content to be at 16px from bottom.
              If Header is 16(64px) + 16(mt) = 80px space.
              Content needs pb-4.
              Let's keep mb-4 for Header to push content down? No, grid gap is better.
              Let's use gap in flex col?
          */}
          <h1 className="font-semibold text-lg text-[var(--text-primary)]">
            {projects.find(p => p.id === activeProjectId)?.name}
          </h1>

        </header>

        {/* Main Split Layout */}
        <div className="flex-1 flex overflow-hidden p-4 gap-4">

          {/* Left: Input Form (Fixed Width or Flex) */}
          <div className="w-[400px] flex-shrink-0 h-full">
            <TaskForm
              values={currentDraft}
              onChange={handleDraftChange}
              onSubmit={handleCreateTask}
            />
          </div>

          {/* Right: Task Monitor */}
          <div className="flex-1 h-full min-w-0">
            <TaskMonitor
              tasks={projectTasks}
              onTaskClick={handleOpenTask}
              onClearTasks={clearTasks}
              onEditTask={handleEditTask}
            />
          </div>

        </div>
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        initialSettings={settings}
        onSave={handleSaveSettings}
      />
    </div>
  );
}
