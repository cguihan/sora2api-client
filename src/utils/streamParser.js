// Utility to parse the specific Sora API stream format

export const parseStreamChunk = (chunkText, currentBuffer) => {
    const fullBuffer = currentBuffer + chunkText;
    const lines = fullBuffer.split('\n');

    // We process all complete lines
    // If the last line is not empty, it might be incomplete, so save it to buffer
    const buffer = lines.pop(); // The last part potentially incomplete

    const events = [];

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;

        if (trimmed.startsWith('data: ')) {
            try {
                const jsonStr = trimmed.substring(6);
                const data = JSON.parse(jsonStr);
                const content = data.choices?.[0]?.delta?.content;
                if (content) {
                    events.push({ type: 'content', value: content });
                }
            } catch (e) {
                console.warn('Failed to parse SSE JSON:', e, trimmed);
            }
        }
    }

    return { events, buffer };
};

export const extractProgress = (text) => {
    // Regex for "**Video Generation Progress**: 9% (running)"
    const match = text.match(/Video Generation Progress\D+(\d+)%/i);
    if (match) {
        return parseInt(match[1], 10);
    }
    return null;
};

export const extractVideoUrl = (text) => {
    // Regex for "<video src='URL' controls>" or matches the URL inside src
    const match = text.match(/src=['"](.*?)['"]/);
    if (match) {
        return match[1];
    }
    return null;
};
