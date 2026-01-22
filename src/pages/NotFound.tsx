import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const NotFound = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col overflow-hidden relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--knowsy-blue))]/10 via-background to-[hsl(var(--knowsy-purple))]/10" />
      
      

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center relative z-10">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
            {/* Funny Animal - Confused Cat */}
            <div className="flex justify-center">
              <div className="relative w-80 h-80">
                <svg
                  viewBox="0 0 200 240"
                  className="w-full h-full"
                  style={{
                    animation: "wiggle 0.5s infinite alternate",
                  }}
                >
                  <style>{`
                    @keyframes wiggle {
                      from { transform: rotate(-2deg); }
                      to { transform: rotate(2deg); }
                    }
                  `}</style>
                  
                  {/* Head */}
                  <circle cx="100" cy="80" r="50" fill="#FF9F43" />
                  
                  {/* Left Ear */}
                  <polygon points="65,35 55,10 75,25" fill="#FF9F43" />
                  
                  {/* Right Ear */}
                  <polygon points="135,35 145,10 125,25" fill="#FF9F43" />
                  
                  {/* Inner Left Ear */}
                  <polygon points="65,35 60,20 70,28" fill="#FFB366" />
                  
                  {/* Inner Right Ear */}
                  <polygon points="135,35 140,20 130,28" fill="#FFB366" />
                  
                  {/* Left Eye */}
                  <circle cx="80" cy="70" r="12" fill="white" />
                  <circle cx="80" cy="70" r="8" fill="black" />
                  <circle cx="82" cy="68" r="3" fill="white" />
                  
                  {/* Right Eye - Looking confused */}
                  <circle cx="120" cy="70" r="12" fill="white" />
                  <circle cx="120" cy="75" r="8" fill="black" />
                  <circle cx="122" cy="73" r="3" fill="white" />
                  
                  {/* Left Eyebrow - Confused */}
                  <path d="M 70 55 Q 80 50 90 55" stroke="black" strokeWidth="2" fill="none" />
                  
                  {/* Right Eyebrow - Confused */}
                  <path d="M 110 55 Q 120 50 130 55" stroke="black" strokeWidth="2" fill="none" />
                  
                  {/* Nose */}
                  <polygon points="100,85 97,92 103,92" fill="#FF6B9D" />
                  
                  {/* Mouth - Confused expression */}
                  <path d="M 100,92 Q 95,100 90,98" stroke="black" strokeWidth="2" fill="none" />
                  <path d="M 100,92 Q 105,100 110,98" stroke="black" strokeWidth="2" fill="none" />
                  
                  {/* Whiskers */}
                  <line x1="50" y1="80" x2="30" y2="75" stroke="black" strokeWidth="1.5" />
                  <line x1="50" y1="90" x2="30" y2="95" stroke="black" strokeWidth="1.5" />
                  <line x1="150" y1="80" x2="170" y2="75" stroke="black" strokeWidth="1.5" />
                  <line x1="150" y1="90" x2="170" y2="95" stroke="black" strokeWidth="1.5" />
                  
                  {/* Body */}
                  <ellipse cx="100" cy="160" rx="45" ry="55" fill="#FF9F43" />
                  
                  {/* Belly */}
                  <ellipse cx="100" cy="165" rx="30" ry="40" fill="#FFB366" />
                  
                  {/* Left Paw */}
                  <ellipse cx="70" cy="210" rx="12" ry="20" fill="#FF9F43" />
                  
                  {/* Right Paw */}
                  <ellipse cx="130" cy="210" rx="12" ry="20" fill="#FF9F43" />
                  
                  {/* Tail - Curved */}
                  <path d="M 140 150 Q 170 140 175 110" stroke="#FF9F43" strokeWidth="15" fill="none" strokeLinecap="round" />
                  
                  {/* Question mark on belly */}
                  <text x="100" y="170" fontSize="35" fontWeight="bold" fill="#FF6B9D" textAnchor="middle">?</text>
                </svg>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-6 text-center md:text-left">
              <div className="space-y-3">
                <span className="text-7xl md:text-8xl font-heading font-bold bg-gradient-to-r from-[hsl(var(--knowsy-blue))] to-[hsl(var(--knowsy-purple))] bg-clip-text text-transparent">
                  404
                </span>
                <h1 className="font-heading text-4xl md:text-5xl">
                  <span className="bg-gradient-to-r from-[hsl(var(--knowsy-blue))] via-[hsl(var(--knowsy-purple))] to-[hsl(var(--knowsy-red))] bg-clip-text text-transparent">
                    Page Not Found
                  </span>
                </h1>
              </div>

              <p className="font-body text-lg text-muted-foreground">
                Oops! This confused kitty can't find the page you're looking for. Looks like you've taken a wrong turn!
              </p>

          

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
