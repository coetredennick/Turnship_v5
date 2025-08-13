import { useState } from "react";
import { Button } from "@/components/ui/button";
import { HelpCircle, MessageSquare, Compass, Menu, X, Sparkles } from "lucide-react";

export default function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFAQs = () => {
    window.open('https://help.turnship.com/faqs', '_blank');
  };

  const handleContact = () => {
    window.open('mailto:support@turnship.com?subject=Support Request', '_blank');
  };

  const handleMission = () => {
    window.open('https://turnship.com/mission', '_blank');
  };

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <Button
        onClick={toggleSidebar}
        className="fixed left-4 top-4 z-[70] md:hidden bg-white shadow-soft-md rounded-xl p-2"
        variant="ghost"
      >
        {isExpanded ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Sidebar */}
      <div 
        className={`fixed left-0 top-0 h-full bg-white/95 backdrop-blur-sm border-r border-gray-200 shadow-soft-lg z-[60] transition-all duration-300 ease-in-out ${
          isExpanded ? 'w-64' : 'w-20'
        } hover:w-64 group`}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="flex items-center p-5 border-b border-gray-100">
            <div className={`bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-soft-md transition-all duration-300 ${
              isExpanded ? 'w-12 h-12' : 'w-10 h-10 group-hover:w-12 group-hover:h-12'
            }`}>
              <Sparkles className="text-white w-6 h-6" />
            </div>
            <div className={`ml-3 transition-all duration-300 ${
              isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0'
            }`}>
              <h3 className="font-display font-bold text-gray-900">Turnship</h3>
              <p className="text-xs text-gray-500">Network Smarter</p>
            </div>
          </div>
          
          {/* Navigation Buttons */}
          <div className="flex-1 p-4 space-y-2">
            <Button 
              variant="ghost" 
              onClick={handleFAQs}
              className={`w-full h-12 text-gray-700 hover:text-purple-600 hover:bg-purple-50 transition-all duration-200 group/btn ${
                isExpanded ? 'justify-start px-4' : 'justify-center px-0 group-hover:justify-start group-hover:px-4'
              }`}
              title={!isExpanded ? "FAQs & Help" : undefined}
            >
              <div className="w-5 h-5 flex items-center justify-center">
                <HelpCircle className="h-5 w-5 flex-shrink-0" />
              </div>
              <span className={`ml-3 transition-all duration-200 ${
                isExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden group-hover:opacity-100 group-hover:w-auto'
              }`}>
                FAQs & Help
              </span>
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={handleContact}
              className={`w-full h-12 text-gray-700 hover:text-purple-600 hover:bg-purple-50 transition-all duration-200 group/btn ${
                isExpanded ? 'justify-start px-4' : 'justify-center px-0 group-hover:justify-start group-hover:px-4'
              }`}
              title={!isExpanded ? "Contact Support" : undefined}
            >
              <div className="w-5 h-5 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 flex-shrink-0" />
              </div>
              <span className={`ml-3 transition-all duration-200 ${
                isExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden group-hover:opacity-100 group-hover:w-auto'
              }`}>
                Contact Support
              </span>
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={handleMission}
              className={`w-full h-12 text-gray-700 hover:text-purple-600 hover:bg-purple-50 transition-all duration-200 group/btn ${
                isExpanded ? 'justify-start px-4' : 'justify-center px-0 group-hover:justify-start group-hover:px-4'
              }`}
              title={!isExpanded ? "Our Mission" : undefined}
            >
              <div className="w-5 h-5 flex items-center justify-center">
                <Compass className="h-5 w-5 flex-shrink-0" />
              </div>
              <span className={`ml-3 transition-all duration-200 ${
                isExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden group-hover:opacity-100 group-hover:w-auto'
              }`}>
                Our Mission
              </span>
            </Button>
          </div>

          {/* Toggle Button for Desktop */}
          <div className={`hidden md:flex justify-center p-4 border-t border-gray-100 ${
            isExpanded ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          } transition-opacity duration-200`}>
            <Button
              onClick={toggleSidebar}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-gray-600"
            >
              {isExpanded ? '← Collapse' : '→ Expand'}
            </Button>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100">
            <div className={`text-xs text-gray-400 transition-all duration-300 text-center ${
              isExpanded ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}>
              <p>v1.0.0</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}