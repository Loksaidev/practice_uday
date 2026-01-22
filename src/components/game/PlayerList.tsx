import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, Check, Crown } from "lucide-react";

interface Player {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
  isAi: boolean;
}

interface Props {
  players: Player[];
  readyPlayers?: string[];
  vipPlayerId?: string;
  currentPlayerId?: string;
}

export function PlayerList({ players, readyPlayers = [], vipPlayerId, currentPlayerId }: Props) {
  return (
    <div className="flex gap-3 items-center flex-wrap">
      {players.map((player) => {
        const isReady = readyPlayers.includes(player.name);
        const isVIP = vipPlayerId === player.id;
        const isCurrent = currentPlayerId === player.id;
        
        return (
          <div
            key={player.id}
            className="flex flex-col items-center gap-1"
          >
            <div className="relative">
              <Avatar 
                className={`w-12 h-12 ${
                  isCurrent 
                    ? 'ring-2 ring-[hsl(var(--knowsy-blue))]' 
                    : isReady 
                    ? 'ring-2 ring-green-500' 
                    : 'opacity-60'
                }`}
              >
                <AvatarFallback className="bg-gradient-to-br from-[hsl(var(--knowsy-purple))] to-[hsl(var(--knowsy-blue))] text-white font-heading">
                  {player.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {isReady && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
              {isVIP && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-[hsl(var(--knowsy-yellow))] rounded-full flex items-center justify-center">
                  <Crown className="w-3 h-3 text-white" />
                </div>
              )}
              {player.isAi && (
                <div className="absolute -bottom-1 -left-1 w-5 h-5 bg-[hsl(var(--knowsy-purple))] rounded-full flex items-center justify-center">
                  <Bot className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
            <span className="text-xs font-body text-center max-w-[60px] truncate">
              {player.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}
