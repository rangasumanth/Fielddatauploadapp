import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
import { toast } from "sonner";
import { User, Mail, CheckCircle, Loader2 } from "lucide-react";
import { AxonLogo } from "@/app/components/ui/AxonLogo";
import type { UserInfo } from "@/app/App";

const USERS = [
  { name: "Hongren Liu", email: "lhongren@axon.com" },
  { name: "Sumanth Ranga", email: "sranga@axon.com" },
  { name: "Nishchal Krishnappa", email: "nkrishnappa@axon.com", },
  { name: "Salih Mohammed", email: "samohammed@axon.com" },
  { name: "Jeremy Berant", email: "jberant@axon.com" },
  { name: "Prasad Zinge", email: "pzinge@axon.com" },
];

type UserInfoScreenProps = {
  sessionId: string;
  onSubmit: (info: UserInfo) => void;
};

export function UserInfoScreen({
  sessionId,
  onSubmit,
}: UserInfoScreenProps) {
  console.log("[UserInfoScreen] Mounting...");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const handleUserSelect = (selectedName: string) => {
    const selectedUser = USERS.find(
      (user) => user.name === selectedName,
    );
    if (selectedUser) {
      setUserName(selectedUser.name);
      setEmail(selectedUser.email);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userName.trim() || !email.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);

    try {
      const { functionsBase, functionsRoutePrefix, publicAnonKey } = await import(
        "@/utils/supabase/info"
      );
      if (!functionsBase) {
        throw new Error("Missing Supabase functions base URL");
      }

      const response = await fetch(
        `${functionsBase}${functionsRoutePrefix}/session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ sessionId, userName, email }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to save session");
      }

      toast.success("Welcome! Session created successfully");
      onSubmit({ userName, email });
    } catch (error) {
      console.error("Error saving session:", error);
      toast.error("Failed to create session");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] flex items-center justify-center p-4 selection:bg-primary selection:text-primary-foreground">
      {/* Background Decorative Element */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[40%] h-[40%] bg-accent/10 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-md animate-scale-in relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-6 animate-fade-in">
            <AxonLogo size={80} color="var(--primary)" showText={false} className="drop-shadow-[0_0_15px_rgba(223,255,0,0.3)]" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic mb-2">
            AXON <span className="text-primary not-italic">EVIDENCE</span>
          </h1>
          <p className="text-zinc-400 font-black tracking-[0.3em] text-[10px] uppercase">
            Protocol Initialization Sequence
          </p>
        </div>

        <Card className="shadow-2xl border border-white/10 bg-zinc-900/50 backdrop-blur-xl">
          <CardHeader className="pb-4 border-b border-white/5">
            <CardTitle className="text-lg font-bold uppercase tracking-widest text-white flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-primary animate-pulse" />
              Mission Authentication
            </CardTitle>
            <CardDescription className="text-center text-zinc-500">
              Select verified field agent profile
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="userName" className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-primary" />
                  Agent Selection
                </Label>
                <div className="relative group">
                  <select
                    id="userName"
                    value={userName}
                    onChange={(e) => handleUserSelect(e.target.value)}
                    required
                    className="w-full bg-black/50 border border-white/10 rounded px-4 py-4 pr-10 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all duration-300 hover:border-white/20 appearance-none font-bold"
                  >
                    <option value="" disabled className="bg-zinc-900">
                      IDENTIFY AGENT...
                    </option>
                    {USERS.map((user) => (
                      <option key={user.email} value={user.name} className="bg-zinc-900">
                        {user.name.toUpperCase()}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-zinc-600 group-hover:text-primary transition-colors">
                    <CheckCircle className={`w-4 h-4 ${userName ? 'text-primary' : ''}`} aria-hidden="true" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-primary" />
                  Digital Identity (Read-only)
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    readOnly
                    className="bg-black/30 border-white/5 text-zinc-400 focus:ring-0 cursor-not-allowed font-mono text-xs tracking-wider h-12"
                  />
                  {email && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-ping" />
                    </div>
                  )}
                </div>
              </div>

              {userName && (
                <div className="flex items-center gap-4 p-4 bg-primary/5 border border-primary/20 rounded animate-fade-in">
                  <Avatar className="w-12 h-12 border border-primary/30">
                    <AvatarFallback className="bg-zinc-800 text-primary font-black">
                      {userName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-black text-white tracking-tight uppercase">{userName}</p>
                    <p className="text-[10px] text-zinc-500 font-mono">{email}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full border border-primary/50 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-primary" />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-14 bg-primary hover:bg-white text-black transition-all duration-300 font-black uppercase tracking-[0.2em] italic text-base rounded shadow-[0_0_20px_rgba(223,255,0,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] disabled:opacity-50 disabled:grayscale"
                disabled={isLoading || !userName}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                    AUTHENTICATING...
                  </>
                ) : (
                  <>
                    START MISSION SESSION
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-8">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">
            Secure Field data transmission encrypted
          </p>
        </div>
      </div>
    </div>
  );
}
