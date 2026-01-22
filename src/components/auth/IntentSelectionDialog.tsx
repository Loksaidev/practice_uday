import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Gamepad2, Building2 } from "lucide-react";

interface IntentSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const IntentSelectionDialog = ({ open, onOpenChange }: IntentSelectionDialogProps) => {
  const navigate = useNavigate();

  const handlePlayGame = () => {
    localStorage.setItem("user_intent", "player");
    onOpenChange(false);
    navigate("/play");
  };

  const handleApplyOrganization = () => {
    localStorage.setItem("user_intent", "org_applicant");
    onOpenChange(false);
    navigate("/apply");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">Welcome to Knowsy!</DialogTitle>
          <DialogDescription className="text-center">
            What would you like to do?
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <Button
            onClick={handlePlayGame}
            size="lg"
            className="h-24 flex flex-col gap-2"
          >
            <Gamepad2 className="h-8 w-8" />
            <span className="text-lg">Play Knowsy</span>
            <span className="text-xs opacity-80">Join or create a game</span>
          </Button>
          <Button
            onClick={handleApplyOrganization}
            variant="outline"
            size="lg"
            className="h-24 flex flex-col gap-2"
          >
            <Building2 className="h-8 w-8" />
            <span className="text-lg">Create Organization Account</span>
            <span className="text-xs opacity-80">Apply to manage your organization</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IntentSelectionDialog;
