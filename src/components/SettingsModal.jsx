import React, { useState, useEffect } from 'react';
import { Save, FolderOpen } from 'lucide-react';
import '../styles/SettingsModal.css';

export default function SettingsModal({ isOpen, onClose, onSave, initialSettings }) {
    const [baseUrl, setBaseUrl] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [savePath, setSavePath] = useState('');
    const [concurrency, setConcurrency] = useState(2);

    useEffect(() => {
        if (isOpen && initialSettings) {
            setBaseUrl(initialSettings.baseUrl || 'http://localhost:8000');
            setApiKey(initialSettings.apiKey || '');
            setSavePath(initialSettings.savePath || 'C:\\Downloads\\Sora');
            setConcurrency(initialSettings.concurrency || 2);
        }
    }, [isOpen, initialSettings]);

    const handleSelectDir = async () => {
        try {
            if (window.api && window.api.selectDirectory) {
                const path = await window.api.selectDirectory();
                if (path) setSavePath(path);
            } else {
                alert("Native file dialog not available in browser mode.");
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleSave = () => {
        onSave({ baseUrl, apiKey, savePath, concurrency });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content glass">
                <h2 className="section-title">设置</h2>

                <div className="form-group">
                    <label>API 地址 (Base URL)</label>
                    <input
                        type="text"
                        value={baseUrl}
                        onChange={(e) => setBaseUrl(e.target.value)}
                        placeholder="http://localhost:8000"
                        className="w-full"
                    />
                </div>

                <div className="form-group">
                    <label>API Key</label>
                    <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="sk-..."
                        className="w-full"
                    />
                </div>

                <div className="form-group">
                    <label>视频保存路径</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={savePath}
                            readOnly
                            className="w-full"
                        />
                        <button type="button" className="icon-btn" onClick={handleSelectDir}>
                            <FolderOpen size={18} />
                        </button>
                    </div>
                </div>

                <div className="form-group">
                    <label>同时执行任务上限 (1-50)</label>
                    <input
                        type="number"
                        min="1"
                        max="50"
                        value={concurrency}
                        onChange={(e) => setConcurrency(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                        className="w-full"
                    />
                </div>

                <div className="modal-actions">
                    <button onClick={onClose} className="cancel-btn">取消</button>
                    <button onClick={handleSave} className="premium-btn">保存设置</button>
                </div>
            </div>
        </div>
    );
}
