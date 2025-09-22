import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { useAuth } from "@/hooks/use-auth";
import { ArrowRight, Loader2, UserX, Wallet } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

interface AuthProps {
  redirectAfterAuth?: string;
}

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const updateProfile = useMutation(api.users.updateProfile);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const redirect = redirectAfterAuth || "/";
      navigate(redirect);
    }
  }, [authLoading, isAuthenticated, navigate, redirectAfterAuth]);

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn("anonymous");
      const redirect = redirectAfterAuth || "/";
      navigate(redirect);
    } catch (error) {
      console.error("Guest login error:", error);
      setError(`Failed to sign in as guest: ${error instanceof Error ? error.message : "Unknown error"}`);
      setIsLoading(false);
    }
  };

  const handleConnectWallet = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const eth = (window as any).ethereum;
      if (!eth || !eth.request) {
        setIsLoading(false);
        setError("No crypto wallet detected. Please install MetaMask or Trust Wallet.");
        toast("No wallet detected. Please install MetaMask or Trust Wallet.");
        return;
      }

      // Request accounts from injected provider
      const accounts: string[] = await eth.request({ method: "eth_requestAccounts" });
      const address = accounts?.[0];
      if (!address) {
        throw new Error("No account returned from wallet.");
      }

      // Ensure we have a convex session (anonymous) to store the wallet
      if (!isAuthenticated) {
        await signIn("anonymous");
      }

      // Save wallet address to user profile
      await updateProfile({ walletAddress: address });

      toast("Wallet connected successfully!");
      const redirect = redirectAfterAuth || "/chat";
      navigate(redirect);
    } catch (e) {
      console.error("Wallet connect error:", e);
      setError(e instanceof Error ? e.message : "Failed to connect wallet.");
      toast("Failed to connect wallet.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Auth Content */}
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center justify-center h-full flex-col">
          <Card className="min-w-[350px] pb-0 border shadow-md">
            {/* Header */}
            <CardHeader className="text-center">
              <div className="flex justify-center">
                <img
                  src="./logo.svg"
                  alt="DivaChat Logo"
                  width={64}
                  height={64}
                  className="rounded-lg mb-4 mt-4 cursor-pointer"
                  onClick={() => navigate("/")}
                />
              </div>
              <CardTitle className="text-xl">Connect Your Wallet</CardTitle>
              <CardDescription>Authenticate with MetaMask or Trust Wallet</CardDescription>
            </CardHeader>

            {/* Wallet Connect */}
            <CardContent>
              <Button
                type="button"
                className="w-full"
                onClick={handleConnectWallet}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="mr-2 h-4 w-4" />
                    Connect Wallet
                  </>
                )}
              </Button>

              {error && <p className="mt-2 text-sm text-red-500 text-center">{error}</p>}

              <div className="mt-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full mt-4"
                  onClick={handleGuestLogin}
                  disabled={isLoading}
                >
                  <UserX className="mr-2 h-4 w-4" />
                  Continue as Guest
                </Button>

                <p className="text-xs text-muted-foreground mt-4 text-center">
                  Don't have a wallet?{" "}
                  <a
                    href="https://metamask.io/download/"
                    target="_blank"
                    rel="noreferrer"
                    className="underline hover:text-primary"
                  >
                    Install MetaMask
                  </a>
                </p>
              </div>
            </CardContent>

            <div className="py-4 px-6 text-xs text-center text-muted-foreground bg-muted border-t rounded-b-lg">
              Secured by{" "}
              <a
                href="https://vly.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-primary transition-colors"
              >
                vly.ai
              </a>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense>
      <Auth {...props} />
    </Suspense>
  );
}