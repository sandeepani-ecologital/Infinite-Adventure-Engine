import React, { useEffect, useState } from 'react';

// Declaration for the global AI Studio object is assumed to be in the environment.
// We remove the local declaration to avoid type conflicts.

interface ApiKeyGateProps {
  onReady: () => void;
}

export const ApiKeyGate: React.FC<ApiKeyGateProps> = ({ onReady }) => {
  const [hasKey, setHasKey] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkKey = async () => {
    setIsLoading(true);
    try {
      if (window.aistudio) {
        const selected = await window.aistudio.hasSelectedApiKey();
        if (selected) {
          setHasKey(true);
          onReady();
        } else {
          setHasKey(false);
        }
      } else {
        // If not running in the specific environment with window.aistudio, 
        // we assume the environment variable process.env.API_KEY is handled externally 
        // or we bypass this check for development if configured. 
        // However, per instructions, we must assume window.aistudio exists for this feature.
        // Fallback for safety:
        console.warn("window.aistudio not found");
        // We'll just let it pass if local dev, but for the prompt requirements:
        // "Assume window.aistudio... are pre-configured"
        // If strictly following prompt instructions for the specific environment:
        setHasKey(true); 
        onReady();
      }
    } catch (e) {
      console.error("Error checking API key:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkKey();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio) {
      try {
        await window.aistudio.openSelectKey();
        // Assume success and proceed immediately as per instructions to avoid race conditions
        setHasKey(true);
        onReady();
      } catch (e) {
        console.error("Key selection failed", e);
        // Reset to allow retry
        setHasKey(false);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-adventure-bg text-adventure-text">
        <div className="animate-pulse">Checking Permissions...</div>
      </div>
    );
  }

  if (hasKey) {
    return null; // Render nothing, let parent render children
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-adventure-bg text-adventure-text p-8 space-y-6">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-3xl font-serif font-bold text-adventure-accent">Welcome to the Infinite Adventure</h1>
        <p className="text-gray-400">
          This experience requires high-fidelity image generation (Nano Banana Pro) and advanced reasoning. 
          Please select a paid API key to continue.
        </p>
        <button
          onClick={handleSelectKey}
          className="px-6 py-3 bg-adventure-accent text-black font-bold rounded hover:bg-yellow-500 transition-colors shadow-lg shadow-yellow-900/20"
        >
          Select API Key
        </button>
        <p className="text-xs text-gray-500 mt-4">
          Learn more about billing at <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="underline hover:text-white">ai.google.dev</a>
        </p>
      </div>
    </div>
  );
};