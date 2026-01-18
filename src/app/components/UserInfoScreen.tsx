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
import type { UserInfo } from "@/app/App";

const USERS = [
  { name: "Hongren Liu", email: "lhongren@axon.com" },
  { name: "Sumanth Ranga", email: "sranga@axon.com" },
  { name: "Nishchal Krishnappa", email: "nkrishnappa@axon.com",},
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-scale-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-full mb-4 shadow-lg-custom">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to Field Testing
          </h1>
          <p className="text-gray-600">
            Please select your information to begin your testing session
          </p>
        </div>

        <Card className="shadow-xl-custom border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-center text-gray-800">
              Tester Information
            </CardTitle>
            <CardDescription className="text-center text-gray-500">
              Choose your profile from the list below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="userName" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Select Tester *
                </Label>
                <div className="relative">
                  <select
                    id="userName"
                    value={userName}
                    onChange={(e) => handleUserSelect(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-8 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 hover:border-gray-400"
                  >
                    <option value="" disabled>
                      Choose your name...
                    </option>
                    {USERS.map((user) => (
                      <option key={user.email} value={user.name}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <CheckCircle className={`w-4 h-4 ${userName ? 'text-green-500' : 'text-gray-300'}`} />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    readOnly
                    className="bg-gray-50 border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 pr-10"
                  />
                  {email && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                  )}
                </div>
              </div>

              {userName && (
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg animate-fade-in">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-green-100 text-green-700 font-medium">
                      {userName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-green-800">{userName}</p>
                    <p className="text-sm text-green-600">{email}</p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-primary hover:opacity-90 transition-all duration-200 shadow-md-custom font-medium text-white"
                disabled={isLoading || !userName}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Setting up your session...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Start Testing Session
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Your session will be automatically saved for future use
          </p>
        </div>
      </div>
    </div>
  );
}
