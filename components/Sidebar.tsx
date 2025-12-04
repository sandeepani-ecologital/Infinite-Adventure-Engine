import React from 'react';
import { Backpack, Map, Scroll } from 'lucide-react';

interface SidebarProps {
  inventory: string[];
  quest: string;
  isOpen: boolean;
  toggleSidebar: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ inventory, quest, isOpen, toggleSidebar }) => {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar Content */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-30 w-64 bg-adventure-panel border-r border-adventure-border 
          transform transition-transform duration-300 ease-in-out
          md:translate-x-0 md:static md:h-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="p-6 space-y-8 h-full overflow-y-auto">
          <div className="flex items-center space-x-2 text-adventure-accent mb-8">
            <Scroll className="w-6 h-6" />
            <h2 className="text-xl font-serif font-bold">Journal</h2>
          </div>

          {/* Quest Section */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-gray-400 uppercase text-xs font-bold tracking-wider">
              <Map className="w-4 h-4" />
              <span>Current Quest</span>
            </div>
            <div className="p-4 bg-black/30 rounded border border-adventure-border text-sm leading-relaxed text-gray-200">
              {quest || "Your journey is just beginning..."}
            </div>
          </div>

          {/* Inventory Section */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-gray-400 uppercase text-xs font-bold tracking-wider">
              <Backpack className="w-4 h-4" />
              <span>Inventory</span>
            </div>
            <ul className="space-y-2">
              {inventory.length === 0 ? (
                <li className="text-sm text-gray-500 italic p-2">Empty</li>
              ) : (
                inventory.map((item, idx) => (
                  <li 
                    key={idx} 
                    className="p-3 bg-black/30 rounded border border-adventure-border text-sm text-gray-200 flex items-center"
                  >
                    <span className="w-2 h-2 bg-adventure-accent rounded-full mr-3"></span>
                    {item}
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </aside>
    </>
  );
};
