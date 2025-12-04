import React, { useState, useEffect, useRef } from 'react';
import { Menu, Send, Sparkles, Image as ImageIcon, Settings } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { GeminiService } from './services/geminiService';
import { ApiKeyGate } from './components/ApiKeyGate';
import { Sidebar } from './components/Sidebar';
import { GameState, StoryResponse } from './types';

// Initial prompt to kickstart the game
const INITIAL_PROMPT = "Start a new fantasy adventure. The player wakes up in a mysterious location. Briefly describe the setting and provide 3 initial choices.";

const App: React.FC = () => {
  const [isKeyReady, setIsKeyReady] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [input, setInput] = useState('');
  
  // Game State
  const [gameState, setGameState] = useState<GameState>({
    inventory: [],
    currentQuest: "",
    history: [],
    currentImage: undefined,
    isGeneratingImage: false,
    isGeneratingStory: false,
    gameOver: false,
    imageSize: '1K'
  });

  const [currentNarrative, setCurrentNarrative] = useState<string>("");
  const [currentChoices, setCurrentChoices] = useState<string[]>([]);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const geminiRef = useRef<GeminiService | null>(null);

  // Initialize Service when Key is ready
  useEffect(() => {
    if (isKeyReady) {
      geminiRef.current = new GeminiService();
      startGame();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isKeyReady]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [gameState.history, currentNarrative, gameState.isGeneratingStory]);

  const startGame = () => {
    handleTurn(INITIAL_PROMPT, true);
  };

  const handleTurn = async (userAction: string, isStart = false) => {
    if (!geminiRef.current) return;

    setGameState(prev => ({ ...prev, isGeneratingStory: true }));
    setInput('');

    try {
      // 1. Generate Story Logic (Text)
      // Construct history for the API
      const apiHistory = gameState.history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }));

      const response: StoryResponse = await geminiRef.current.generateStorySegment(
        apiHistory,
        userAction
      );

      // 2. Update Game State with Text Response
      const newHistory = [...gameState.history];
      if (!isStart) {
        newHistory.push({ role: 'user', text: userAction });
      }
      newHistory.push({ role: 'model', text: response.narrative });

      setCurrentNarrative(response.narrative);
      setCurrentChoices(response.choices);
      
      setGameState(prev => ({
        ...prev,
        inventory: response.inventory,
        currentQuest: response.quest,
        history: newHistory,
        isGeneratingStory: false,
        isGeneratingImage: true // Start image generation
      }));

      // 3. Generate Image (Parallel-ish: started after text is done to ensure context)
      // We do this after state update so the text shows up first (better UX)
      generateImage(response.imagePrompt);

    } catch (error) {
      console.error("Turn Error:", error);
      setGameState(prev => ({ ...prev, isGeneratingStory: false, isGeneratingImage: false }));
      // Optional: Show error toast
    }
  };

  const generateImage = async (prompt: string) => {
    if (!geminiRef.current) return;
    
    try {
      const imageUrl = await geminiRef.current.generateSceneImage(prompt, gameState.imageSize);
      setGameState(prev => ({
        ...prev,
        currentImage: imageUrl,
        isGeneratingImage: false
      }));
    } catch (error) {
      console.error("Image Gen Error:", error);
      setGameState(prev => ({ ...prev, isGeneratingImage: false }));
    }
  };

  const handleChoiceClick = (choice: string) => {
    if (gameState.isGeneratingStory) return;
    handleTurn(choice);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || gameState.isGeneratingStory) return;
    handleTurn(input);
  };

  const toggleImageSize = () => {
    setGameState(prev => {
      const nextSize = prev.imageSize === '1K' ? '2K' : prev.imageSize === '2K' ? '4K' : '1K';
      return { ...prev, imageSize: nextSize };
    });
  };

  if (!isKeyReady) {
    return <ApiKeyGate onReady={() => setIsKeyReady(true)} />;
  }

  return (
    <div className="flex h-full w-full relative overflow-hidden">
      
      <Sidebar 
        inventory={gameState.inventory}
        quest={gameState.currentQuest}
        isOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      <main className="flex-1 flex flex-col h-full relative w-full md:w-auto transition-all">
        {/* Header / Mobile Nav */}
        <header className="flex-none h-16 bg-adventure-panel border-b border-adventure-border flex items-center justify-between px-4 z-10">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="md:hidden text-adventure-text hover:text-white"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="text-adventure-accent font-serif font-bold text-lg">
            Infinite Adventure
          </div>

          <div className="flex items-center space-x-4">
             {/* Image Size Toggle */}
             <button 
              onClick={toggleImageSize}
              className="flex items-center space-x-1 text-xs font-bold bg-black/40 px-3 py-1.5 rounded border border-adventure-border hover:bg-adventure-border transition-colors text-gray-300"
              title="Image Generation Resolution"
            >
              <ImageIcon className="w-3 h-3" />
              <span>{gameState.imageSize}</span>
            </button>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 space-y-6 pb-32 custom-scrollbar">
          
          {/* Active Scene Display */}
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Image Stage */}
            <div className="w-full aspect-video bg-black rounded-lg border border-adventure-border overflow-hidden relative shadow-2xl">
              {gameState.currentImage ? (
                <img 
                  src={gameState.currentImage} 
                  alt="Scene" 
                  className={`w-full h-full object-cover transition-opacity duration-700 ${gameState.isGeneratingImage ? 'opacity-50 scale-105' : 'opacity-100 scale-100'}`} 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600 bg-adventure-panel">
                  {gameState.isGeneratingStory ? "Dreaming..." : "No image available"}
                </div>
              )}
              
              {gameState.isGeneratingImage && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10">
                  <div className="flex flex-col items-center space-y-2">
                    <Sparkles className="w-8 h-8 text-adventure-accent animate-spin" />
                    <span className="text-adventure-accent text-sm font-bold tracking-widest uppercase">Painting Scene...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Narrative Stage */}
            <div className="prose prose-invert prose-lg max-w-none">
               {gameState.history.length === 0 && gameState.isGeneratingStory ? (
                 <div className="text-center text-gray-500 animate-pulse mt-10">Initializing world...</div>
               ) : (
                 <div className="bg-adventure-panel/50 p-6 rounded-lg border border-adventure-border/50">
                    <ReactMarkdown 
                      components={{
                        p: ({node, ...props}) => <p className="mb-4 font-serif text-gray-200 leading-relaxed text-lg" {...props} />,
                        strong: ({node, ...props}) => <strong className="text-adventure-accent font-bold" {...props} />
                      }}
                    >
                      {currentNarrative}
                    </ReactMarkdown>
                 </div>
               )}
            </div>

             {/* Action Choices */}
             {!gameState.isGeneratingStory && currentChoices.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4">
                  {currentChoices.map((choice, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleChoiceClick(choice)}
                      className="text-left p-4 rounded bg-black/20 border border-adventure-border hover:border-adventure-accent hover:bg-adventure-accent/10 transition-all text-sm font-medium text-gray-300 hover:text-white group"
                    >
                      <span className="block text-xs text-adventure-accent/70 mb-1 group-hover:text-adventure-accent">Option {idx + 1}</span>
                      {choice}
                    </button>
                  ))}
                </div>
             )}
            
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input Area (Sticky Bottom) */}
        <div className="flex-none bg-adventure-bg/95 backdrop-blur border-t border-adventure-border p-4 z-20">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={gameState.isGeneratingStory ? "The story is unfolding..." : "What do you want to do?"}
                disabled={gameState.isGeneratingStory}
                className="w-full bg-black/50 border border-adventure-border rounded-lg pl-4 pr-12 py-4 text-adventure-text focus:outline-none focus:border-adventure-accent focus:ring-1 focus:ring-adventure-accent transition-all placeholder-gray-600 font-serif"
              />
              <button
                type="submit"
                disabled={!input.trim() || gameState.isGeneratingStory}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-adventure-accent hover:text-white disabled:opacity-30 disabled:hover:text-adventure-accent transition-colors"
              >
                {gameState.isGeneratingStory ? (
                  <div className="w-5 h-5 border-2 border-adventure-accent border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
