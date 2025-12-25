import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { parseStreamChunk, extractProgress, extractVideoUrl } from '../utils/streamParser';

export function useTaskQueue(settings) {
    const [tasks, setTasks] = useState([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from DB (Async)
    useEffect(() => {
        const loadTasks = async () => {
            if (window.api && window.api.db) {
                try {
                    const saved = await window.api.db.load('sora_tasks');
                    if (saved && Array.isArray(saved)) {
                        setTasks(saved);
                    } else {
                        // Migrate from localStorage if DB is empty
                        const old = localStorage.getItem('sora_tasks');
                        if (old) setTasks(JSON.parse(old));
                    }
                } catch (e) {
                    console.error("DB Load failed", e);
                }
            } else {
                // Browser Fallback
                try {
                    const saved = localStorage.getItem('sora_tasks');
                    if (saved) setTasks(JSON.parse(saved));
                } catch (e) { console.warn(e) }
            }
            setIsLoaded(true);
        };
        loadTasks();
    }, []);

    // Persistent storage (Save)
    useEffect(() => {
        if (!isLoaded) return; // Prevent overwriting DB with empty state before load

        if (window.api && window.api.db) {
            window.api.db.save('sora_tasks', tasks);
        } else {
            // Browser Fallback with Quota Protection
            try {
                localStorage.setItem('sora_tasks', JSON.stringify(tasks));
            } catch (e) {
                if (e.name === 'QuotaExceededError' || e.code === 22) {
                    const leanTasks = tasks.map(t => ({
                        ...t,
                        image: t.image && t.image.length > 1000 ? null : t.image
                    }));
                    try { localStorage.setItem('sora_tasks', JSON.stringify(leanTasks)); } catch (_) { }
                }
            }
        }
    }, [tasks, isLoaded]);

    const activeTasksCount = useRef(0);
    const maxConcurrent = settings.concurrency || 2; // Dynamic limit

    const clearTasks = (projectId) => {
        if (projectId) {
            if (!window.confirm("确定要清空当前项目的任务记录吗？")) return;
            setTasks(prev => prev.filter(t => t.projectId !== projectId));

            // Update fallback storage immediately to avoid race with effect
            if (!(window.api && window.api.db)) {
                try {
                    const saved = JSON.parse(localStorage.getItem('sora_tasks') || '[]');
                    const filtered = saved.filter(t => t.projectId !== projectId);
                    localStorage.setItem('sora_tasks', JSON.stringify(filtered));
                } catch (e) { /* ignore */ }
            }
        } else {
            if (!window.confirm("确定要清空所有任务记录吗？")) return;
            setTasks([]);
            localStorage.removeItem('sora_tasks');
        }
    };

    const deleteTask = (id) => {
        if (!window.confirm('确定要删除该任务吗？')) return;
        setTasks(prev => prev.filter(t => t.id !== id));

        if (!(window.api && window.api.db)) {
            try {
                const saved = JSON.parse(localStorage.getItem('sora_tasks') || '[]');
                const filtered = saved.filter(t => t.id !== id);
                localStorage.setItem('sora_tasks', JSON.stringify(filtered));
            } catch (e) { /* ignore */ }
        }
    };

    const addTask = (taskData) => {
        const newTask = {
            id: uuidv4(),
            createdAt: Date.now(),
            status: 'pending', // pending, running, completed, failed
            progress: 0,
            logs: '',
            downloaded: false,
            localPath: null,
            retryCount: 0,
            ...taskData
        };
        setTasks(prev => [newTask, ...prev]);
    };

    const retryTask = (id) => {
        if (!window.confirm('确定要重试该任务吗？')) return;
        setTasks(prev => prev.map(t => t.id === id ? ({
            ...t,
            status: 'pending',
            progress: 0,
            logs: '',
            videoUrl: null,
            downloaded: false,
            localPath: null,
            retryCount: (t.retryCount || 0) + 1,
            createdAt: Date.now()
        }) : t));

        // Update fallback storage immediately
        if (!(window.api && window.api.db)) {
            try {
                const saved = JSON.parse(localStorage.getItem('sora_tasks') || '[]');
                const updated = saved.map(t => t.id === id ? ({
                    ...t,
                    status: 'pending',
                    progress: 0,
                    logs: '',
                    videoUrl: null,
                    downloaded: false,
                    localPath: null,
                    retryCount: (t.retryCount || 0) + 1,
                    createdAt: Date.now()
                }) : t);
                localStorage.setItem('sora_tasks', JSON.stringify(updated));
            } catch (e) { /* ignore */ }
        }
    };

    const updateTask = (id, updates) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    };

    const processQueue = async () => {
        if (activeTasksCount.current >= maxConcurrent) return;

        // Find next pending task
        // We strictly search in 'tasks' state. 
        // Optimization: Since we are inside useEffect with tasks dependency, 
        // we handle the scheduling.
    };

    useEffect(() => {
        const runNextTask = async () => {
            if (activeTasksCount.current >= maxConcurrent) return;

            // Find oldest pending task (last in array usually if new on top, wait... 
            // User sees "Task List", likely newest on top. 
            // Queue usually FIFO. If I append new to top, the bottom is oldest.
            // But standard "Tasks List" UI often has newest top. 
            // I added: setTasks(prev => [newTask, ...prev]); -> Newest First.
            // So search from end for FIFO, or beginning for LIFO. 
            // Let's do FIFO (Reverse search or just filter).

            const pendingTask = [...tasks].reverse().find(t => t.status === 'pending');

            if (!pendingTask) return;

            // Start Task
            activeTasksCount.current++;
            updateTask(pendingTask.id, { status: 'running', progress: 0 });

            try {
                await executeTask(pendingTask);
            } catch (e) {
                console.error("Task failed", e);
                updateTask(pendingTask.id, { status: 'failed', logs: pendingTask.logs + `\nError: ${e.message}` });
            } finally {
                activeTasksCount.current--;
                // Trigger generic re-check because dependency 'tasks' updates 
                // will re-trigger this effect automatically? 
                // Wait, 'updateTask' updates 'tasks', so useEffect runs again. 
                // Correct.
            }
        };

        runNextTask();
    }, [tasks, maxConcurrent]); // Dependency on tasks covers status changes

    const executeTask = async (task) => {
        const { baseUrl, apiKey, savePath } = settings;

        // Construct Messages
        const messages = [];
        if (task.image) {
            // Image to Video
            messages.push({
                role: "user",
                content: [
                    { type: "text", text: task.prompt },
                    { type: "image_url", image_url: { url: task.image } }
                ]
            });
        } else {
            // Text to Video
            messages.push({
                role: "user",
                content: task.prompt
            });
        }

        const abortController = new AbortController();

        // Fetch
        let videoUrl = null;
        let fullLogs = "";
        let buffer = "";

        try {
            const response = await fetch(`${baseUrl}/v1/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: task.model,
                    messages,
                    stream: true
                }),
                signal: abortController.signal
            });

            if (!response.ok) throw new Error(`API Error: ${response.status}`);
            if (!response.body) throw new Error("No response body");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            let lastLogUpdate = Date.now();
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const { events, buffer: newBuffer } = parseStreamChunk(chunk, buffer);
                buffer = newBuffer;

                for (const event of events) {
                    if (event.type === 'content') {
                        const text = event.value;
                        fullLogs += text;

                        // Check progress
                        const progress = extractProgress(text);
                        const now = Date.now();

                        // Update progress immediately when provided
                        if (progress !== null) {
                            updateTask(task.id, { progress, logs: fullLogs });
                            lastLogUpdate = now;
                        } else if (now - lastLogUpdate > 300) {
                            // Throttle log updates to avoid excessive re-renders
                            updateTask(task.id, { logs: fullLogs });
                            lastLogUpdate = now;
                        }

                        // Check URL
                        const url = extractVideoUrl(text);
                        if (url) {
                            videoUrl = url;
                        }
                    }
                }
            }
        } catch (e) {
            throw e;
        }

        updateTask(task.id, { progress: 100, logs: fullLogs });

        if (videoUrl) {
            // Download
            try {
                const filename = `sora_${task.id}_${Date.now()}.mp4`;

                let localPath = null;
                if (window.api && window.api.downloadVideo) {
                    localPath = await window.api.downloadVideo(videoUrl, savePath, filename);
                } else {
                    console.warn("Download not supported in browser mode");
                }

                updateTask(task.id, {
                    status: 'completed',
                    downloaded: !!localPath,
                    localPath: localPath,
                    videoUrl // Keep remote URL just in case
                });
            } catch (downloadErr) {
                updateTask(task.id, {
                    status: 'completed', // Generation success, but download failed? 
                    // Maybe mark 'partial'? Or just completed with error log.
                    logs: fullLogs + `\nDownload Failed: ${downloadErr.message}`
                });
            }
        } else {
            throw new Error("No video URL found in response");
        }
    };

    return {
        tasks,
        addTask,
        clearTasks,
        deleteTask,
        retryTask,
        activeTasks: activeTasksCount.current
    };
}
