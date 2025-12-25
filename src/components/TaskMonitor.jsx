import React from 'react';
import { Play, CheckCircle, AlertCircle, Loader2, Download, Trash2, Pencil, Image as ImageIcon, RefreshCw } from 'lucide-react';
import '../styles/TaskMonitor.css';

export default function TaskMonitor({ tasks, onTaskClick, onClearTasks, onEditTask, onDeleteTask, onRetryTask }) {
    if (tasks.length === 0) {
        return (
            <div className="task-monitor-empty">
                <div className="empty-content">
                    <p>暂无任务</p>
                    <span>快去创建一个新任务吧</span>
                </div>
            </div>
        );
    }

    return (
        <div className="task-monitor-container">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h2 className="section-title mb-0">任务队列 ({tasks.length})</h2>
                {tasks.length > 0 && (
                    <button onClick={onClearTasks} className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1">
                        <Trash2 size={14} /> 清空记录
                    </button>
                )}
            </div>

            <div className="task-list">
                {tasks.map(task => (
                    <div
                        key={task.id}
                        className={`task-item ${task.status} ${task.downloaded ? 'downloaded' : ''}`}
                    >
                        <div className="task-row">
                            <div className="task-thumb" onClick={() => onTaskClick(task)}>
                                {task.image ? (
                                    <img src={task.image} className="w-full h-full object-cover" alt="ref" />
                                ) : (
                                    <div className="no-thumb"><ImageIcon size={24} opacity={0.3} /></div>
                                )}
                            </div>

                            <div className="task-main">
                                <div className="task-header">
                                    <div className="flex items-center gap-2">
                                        <span className="task-model-badge">{task.model}</span>
                                        <span className="task-time">{new Date(task.createdAt).toLocaleTimeString()}</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onEditTask(task); }}
                                            className="p-1 hover:bg-[var(--bg-tertiary)] rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                                            title="编辑并重新生成"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        {task.status === 'failed' && onRetryTask && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onRetryTask(task.id); }}
                                                className="p-1 hover:bg-[var(--bg-tertiary)] rounded text-[var(--text-primary)] hover:text-[var(--accent-color)] transition-colors"
                                                title="重试任务"
                                            >
                                                <RefreshCw size={14} />
                                            </button>
                                        )}
                                        {task.status === 'failed' && onDeleteTask && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }}
                                                className="p-1 hover:bg-[var(--bg-tertiary)] rounded text-red-500 hover:text-red-600 transition-colors"
                                                title="删除失败任务"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <p
                                    className="task-prompt cursor-pointer hover:text-[var(--accent-color)] transition-colors"
                                    onClick={() => onTaskClick(task)}
                                    title="点击查看详情"
                                >
                                    {task.prompt}
                                </p>

                                <div className="mt-2">
                                    {task.status === 'running' && (
                                        <div className="progress-container">
                                            <div className="progress-bar-bg"><div className="progress-bar-fill" style={{ width: `${task.progress}%` }} /></div>
                                            <div className="progress-text">{task.progress}%</div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="status-column">
                                <div className="status-badge-wrapper">
                                    <div className="status-indicator">
                                        {task.status === 'pending' && <span className="status-badge pending">等待中</span>}
                                        {task.status === 'running' && <span className="status-badge running"><Loader2 size={12} className="animate-spin" /> 生成中</span>}
                                        {task.status === 'completed' && <span className="status-badge completed"><CheckCircle size={12} /> 完成</span>}
                                        {task.status === 'failed' && <span className="status-badge failed"><AlertCircle size={12} /> 失败</span>}
                                    </div>

                                    <div className="status-tooltip" role="tooltip">
                                        <div className="tooltip-title">实时响应</div>
                                        <pre className="tooltip-body">{task.logs ? task.logs : '暂无接收数据'}</pre>
                                    </div>
                                </div>

                                {(task.localPath || task.videoUrl) && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onTaskClick(task); }}
                                        className="open-video-btn"
                                        title="打开视频"
                                    >
                                        <Play size={20} fill="url(#play-gradient)" stroke="url(#play-gradient)" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* SVG Gradient Definition for Play Button */}
            <svg width="0" height="0" className="absolute">
                <defs>
                    <linearGradient id="play-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#2563eb" /> {/* Blue-600 */}
                        <stop offset="100%" stopColor="#9333ea" /> {/* Purple-600 */}
                    </linearGradient>
                </defs>
            </svg>
        </div>
    );
}
