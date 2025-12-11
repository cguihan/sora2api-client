import React, { useState } from 'react';
import { Plus, Settings, Folder, Video, X, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { v4 as uuidv4 } from 'uuid';

export default function Sidebar({ projects, activeProjectId, onSelectProject, onAddProject, onDeleteProject, onOpenSettings }) {

    const handleAddProject = () => {
        const name = `项目 ${projects.length + 1}`;
        onAddProject({ id: uuidv4(), name, createdAt: Date.now() });
    };

    return (
        <div className={clsx(
            "w-64 flex flex-col transition-colors duration-200 flex-shrink-0 glass-panel rounded-2xl ml-4 my-4 h-[calc(100vh-32px)]",
            // ml-4 my-4 (16px gaps). Height: 100vh - 16px top - 16px bottom = 32px.
            "border-r border-[var(--glass-border)]"
        )}>
            {/* Header: Fixed height h-16 */}
            <div className="h-16 px-4 border-b border-[var(--glass-border)] flex items-center justify-between app-drag-region flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold app-no-drag shadow-sm">
                        S
                    </div>
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 tracking-tight">
                        Sora
                    </h1>
                </div>
                {/* Settings Button Moved Here */}
                <button
                    onClick={onOpenSettings}
                    className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors app-no-drag"
                    title="设置"
                >
                    <Settings size={18} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
                <h2 className="text-base font-bold text-[var(--text-secondary)] mb-3 px-2">项目列表</h2>
                <div className="space-y-1">
                    {projects.map(project => (
                        <div
                            key={project.id}
                            className={clsx(
                                "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors group",
                                activeProjectId === project.id
                                    ? "bg-[var(--glass-border)] font-medium text-[var(--text-primary)]" // Use glass border as active bg for subtlety
                                    : "text-[var(--text-secondary)] hover:bg-[var(--glass-border)] hover:text-[var(--text-primary)]"
                            )}
                        >
                            <button
                                onClick={() => onSelectProject(project.id)}
                                className="flex items-center gap-3 flex-1 text-left truncate"
                            >
                                <Folder size={16} />
                                <span className="truncate">{project.name}</span>
                            </button>

                            {projects.length > 1 && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDeleteProject(project.id); }}
                                    className="text-[var(--text-secondary)] hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100"
                                    title="删除项目"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="p-4 pb-8 border-t border-[var(--glass-border)]">
                <button
                    onClick={handleAddProject}
                    className="w-48 mx-auto flex items-center justify-center gap-2 premium-btn rounded-lg text-sm font-medium transition-transform active:scale-95 shadow-md"
                >
                    <Plus size={16} />
                    新建项目
                </button>
            </div>
        </div>
    );
}
