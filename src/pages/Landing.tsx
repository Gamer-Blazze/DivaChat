import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router";
import { 
  Shield, 
  Zap, 
  Globe, 
  Lock, 
  Coins, 
  MessageCircle,
  Users,
  FileImage,
  ArrowRight,
  Wallet,
  CheckCircle
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";

export default function Landing() {
  const { isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Add settings modal and theme state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Initialize theme from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const isDark = saved ? saved === "dark" : window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  // Handler to toggle theme and persist
  const toggleDark = (checked: boolean) => {
    setDarkMode(checked);
    document.documentElement.classList.toggle("dark", checked);
    localStorage.setItem("theme", checked ? "dark" : "light");
  };

  const features = [
    {
      icon: <Shield className="h-6 w-6" />,
      title: "End-to-End Encryption",
      description: "Messages encrypted via XMTP protocol. Only you and recipients can read them.",
    },
    {
      icon: <Wallet className="h-6 w-6" />,
      title: "Wallet Authentication",
      description: "Connect with MetaMask or WalletConnect. Your wallet is your identity.",
    },
    {
      icon: <Coins className="h-6 w-6" />,
      title: "Tokenized Messaging",
      description: "Attach token payments to messages. Send value with every conversation.",
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: "Decentralized Storage",
      description: "Media stored on IPFS with client-side encryption for maximum privacy.",
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Group Chats",
      description: "Create encrypted group conversations with multiple participants.",
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Real-time Sync",
      description: "Instant message delivery with typing indicators and read receipts.",
    },
  ];

  const benefits = [
    "No email or password required",
    "Messages never stored in plaintext",
    "Decentralized and censorship-resistant",
    "Built-in micropayments",
    "Cross-platform compatibility",
    "Open source and auditable"
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20"
    >
      {/* Navigation */}
      <nav className="border-b border-border/40 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div 
              className="flex items-center space-x-3 cursor-pointer"
              onClick={() => navigate("/")}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold tracking-tight">DivaChat</span>
            </motion.div>
            
            <div className="flex items-center space-x-2">
              {/* Primary CTA */}
              {!isLoading && (
                <Button
                  onClick={() => navigate(isAuthenticated ? "/chat" : "/auth")}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-6"
                >
                  {isAuthenticated ? "Open Chat" : "Connect Wallet"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Basic Settings</DialogTitle>
            <DialogDescription>Customize your DivaChat experience.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <div className="font-medium">Dark Mode</div>
                <div className="text-sm text-muted-foreground">Use a darker color theme</div>
              </div>
              <Switch
                checked={darkMode}
                onCheckedChange={toggleDark}
                aria-label="Toggle dark mode"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Badge variant="secondary" className="mb-6 px-4 py-2">
                <Lock className="h-3 w-3 mr-2" />
                Decentralized & Encrypted
              </Badge>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-5xl md:text-7xl font-bold tracking-tight mb-8"
            >
              Web3 Chat
              <br />
              <span className="text-primary">Reimagined</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed"
            >
              The first truly decentralized messaging platform with end-to-end encryption, 
              tokenized messaging, and IPFS storage. Connect your wallet and start chatting securely.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Button
                size="lg"
                onClick={() => navigate(isAuthenticated ? "/chat" : "/auth")}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg"
              >
                <Wallet className="mr-2 h-5 w-5" />
                {isAuthenticated ? "Open Chat" : "Connect Wallet"}
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                onClick={() => window.open("https://github.com", "_blank")}
                className="px-8 py-4 text-lg"
              >
                View on GitHub
              </Button>
            </motion.div>
          </div>
        </div>
        
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl" />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold tracking-tight mb-4">
              Built for the Decentralized Web
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              DivaChat combines the best of Web3 technology to create a messaging 
              experience that's private, secure, and truly owned by users.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full border-border/50 hover:border-primary/20 transition-colors">
                  <CardContent className="p-8">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6 text-primary">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-semibold mb-3 tracking-tight">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold tracking-tight mb-6">
                Why Choose DivaChat?
              </h2>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Traditional messaging apps collect your data, censor your messages, 
                and control your communications. DivaChat gives you back control.
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center space-x-3"
                  >
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="relative"
            >
              <Card className="p-8 border-border/50">
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                      <MessageCircle className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <div className="font-semibold">Alice</div>
                      <div className="text-sm text-muted-foreground">0x1234...5678</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="bg-primary/10 rounded-2xl rounded-bl-md p-4 max-w-xs">
                      <div className="flex items-center space-x-2 mb-2">
                        <Lock className="h-3 w-3 text-primary" />
                        <span className="text-xs text-primary">Encrypted</span>
                      </div>
                      <p className="text-sm">Hey! Check out this new DeFi protocol 🚀</p>
                    </div>
                    
                    <div className="bg-muted rounded-2xl rounded-br-md p-4 max-w-xs ml-auto">
                      <div className="flex items-center space-x-2 mb-2">
                        <Coins className="h-3 w-3 text-primary" />
                        <span className="text-xs text-primary">0.1 ETH attached</span>
                      </div>
                      <p className="text-sm">Thanks for the tip! 💰</p>
                    </div>
                    
                    <div className="bg-primary/10 rounded-2xl rounded-bl-md p-4 max-w-xs">
                      <div className="flex items-center space-x-2 mb-2">
                        <FileImage className="h-3 w-3 text-primary" />
                        <span className="text-xs text-primary">IPFS stored</span>
                      </div>
                      <div className="w-full h-20 bg-muted rounded-lg flex items-center justify-center">
                        <FileImage className="h-8 w-8 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold tracking-tight mb-6">
              Ready to Chat Securely?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join the future of messaging. Connect your wallet and start 
              having truly private conversations today.
            </p>
            
            <Button
              size="lg"
              onClick={() => navigate(isAuthenticated ? "/chat" : "/auth")}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg"
            >
              <Wallet className="mr-2 h-5 w-5" />
              {isAuthenticated ? "Open DivaChat" : "Get Started"}
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold tracking-tight">DivaChat</span>
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">GitHub</a>
              <a href="#" className="hover:text-foreground transition-colors">Docs</a>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-border/40 text-center text-sm text-muted-foreground">
            <p>Built with ❤️ for the decentralized web. Open source and auditable.</p>
          </div>
        </div>
      </footer>
    </motion.div>
  );
}