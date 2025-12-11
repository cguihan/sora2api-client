import React, { useState, useRef } from 'react';
import { Upload, X, Film, Clock, Monitor, Smartphone } from 'lucide-react';
import '../styles/TaskForm.css';

export default function TaskForm({ values, onChange, onSubmit }) {
    const fileInputRef = useRef(null);
    // values = { prompt, ratio, duration, image, imagePreview }

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                onChange('image', file);
                onChange('imagePreview', reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        onChange('image', null);
        onChange('imagePreview', null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!values.prompt.trim()) return;

        let model = 'sora-video-10s';
        if (values.ratio === '16:9') {
            model = values.duration === '10s' ? 'sora-video-10s' : 'sora-video-15s';
        } else { // 9:16
            model = values.duration === '10s' ? 'sora-video-portrait-10s' : 'sora-video-portrait-15s';
        }

        onSubmit({
            prompt: values.prompt,
            model,
            ratio: values.ratio,
            duration: values.duration,
            image: values.imagePreview
        });

        // Draft kept intentionally
    };

    return (
        <div className="task-form-container glass">
            <h2 className="section-title">新建任务</h2>
            <form onSubmit={handleSubmit}>

                <div className="form-group">
                    <label>提示词 (Prompt)</label>
                    <textarea
                        value={values.prompt}
                        onChange={(e) => onChange('prompt', e.target.value)}
                        placeholder="描述您想要生成的视频画面..."
                        rows={4}
                        className="prompt-input"
                    />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>视频比例</label>
                        <div className="select-buttons">
                            <button
                                type="button"
                                className={`select-btn ${values.ratio === '16:9' ? 'active' : ''}`}
                                onClick={() => onChange('ratio', '16:9')}
                            >
                                <Monitor size={16} /> 16:9
                            </button>
                            <button
                                type="button"
                                className={`select-btn ${values.ratio === '9:16' ? 'active' : ''}`}
                                onClick={() => onChange('ratio', '9:16')}
                            >
                                <Smartphone size={16} /> 9:16
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>视频时长</label>
                        <div className="select-buttons">
                            <button
                                type="button"
                                className={`select-btn ${values.duration === '10s' ? 'active' : ''}`}
                                onClick={() => onChange('duration', '10s')}
                            >
                                <Clock size={16} /> 10s
                            </button>
                            <button
                                type="button"
                                className={`select-btn ${values.duration === '15s' ? 'active' : ''}`}
                                onClick={() => onChange('duration', '15s')}
                            >
                                <Film size={16} /> 15s
                            </button>
                        </div>
                    </div>
                </div>

                <div className="form-group">
                    <label>参考图 (可选)</label>
                    {!values.imagePreview ? (
                        <div
                            className="upload-box"
                            onClick={() => fileInputRef.current.click()}
                        >
                            <Upload size={24} />
                            <span>点击上传参考图片</span>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                accept="image/*"
                                hidden
                            />
                        </div>
                    ) : (
                        <div className="image-preview">
                            <img src={values.imagePreview} alt="Reference" />
                            <button type="button" className="remove-btn" onClick={removeImage}>
                                <X size={14} />
                            </button>
                        </div>
                    )}
                </div>

                <button type="submit" className="premium-btn submit-btn" disabled={!values.prompt}>
                    添加到任务队列
                </button>
            </form>
        </div>
    );
}
