import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Settings, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

export default function SettingsPage() {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const { user } = useAuth();
  const [walletOpen, setWalletOpen] = useState(false);
  const [displayName, setDisplayName] = useState<string>("");

  // Initialize displayName when user loads
  useEffect(() => {
    setDisplayName(user?.name ?? "");
  }, [user]);

  // Add: mutation to update profile
  const updateProfile = useMutation(api.users.updateProfile);

  // Initialize theme from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const isDark =
      saved ? saved === "dark" : window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggleDark = (checked: boolean) => {
    setDarkMode(checked);
    document.documentElement.classList.toggle("dark", checked);
    localStorage.setItem("theme", checked ? "dark" : "light");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="min-h-screen bg-background"
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button variant="outline" onClick={() => setWalletOpen(true)} className="gap-2">
            <User className="h-4 w-4" />
            Profile
          </Button>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
            <Settings className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
            <p className="text-sm text-muted-foreground">Customize your DivaChat experience</p>
          </div>
        </div>

        <Separator className="mb-6" />

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Theme and display preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <div className="font-medium">Dark Mode</div>
                  <div className="text-sm text-muted-foreground">Use a darker color theme across the app</div>
                </div>
                <Switch checked={darkMode} onCheckedChange={toggleDark} aria-label="Toggle dark mode" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Wallet/Profile Dialog */}
        <Dialog open={walletOpen} onOpenChange={setWalletOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Wallet & Profile</DialogTitle>
              <DialogDescription>View your wallet address and edit your display name.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Wallet address */}
              <div className="rounded-md border p-3">
                <div className="text-sm text-muted-foreground mb-1">Wallet Address</div>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-xs break-all pr-2">
                    {user?.walletAddress ?? "No wallet connected"}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!user?.walletAddress}
                    onClick={async () => {
                      if (!user?.walletAddress) return;
                      await navigator.clipboard.writeText(user.walletAddress);
                      toast("Wallet address copied");
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </div>

              {/* Display name edit */}
              <div className="rounded-md border p-3 space-y-2">
                <div className="text-sm text-muted-foreground">Display Name</div>
                <Input
                  placeholder="Enter a display name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
                <div className="flex justify-end">
                  <Button
                    onClick={async () => {
                      try {
                        await updateProfile({ name: displayName.trim() || undefined });
                        toast("Profile updated");
                        setWalletOpen(false);
                      } catch {
                        toast("Failed to update profile");
                      }
                    }}
                  >
                    Save
                  </Button>
                </div>
              </div>

              {/* Manage wallet button */}
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => {
                    setWalletOpen(false);
                    navigate("/auth");
                  }}
                >
                  Manage / Connect Wallet
                </Button>
                <Button onClick={() => setWalletOpen(false)} variant="ghost">
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </motion.div>
  );
}