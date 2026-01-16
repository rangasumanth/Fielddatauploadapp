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
import { toast } from "sonner";
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
      const { functionsBase, publicAnonKey } = await import(
        "@/utils/supabase/info"
      );
      if (!functionsBase) {
        throw new Error("Missing Supabase functions base URL");
      }

      const response = await fetch(
        `${functionsBase}/make-server-54e4d920/session`,
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
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">
            Field Tester Details
          </CardTitle>
          <CardDescription>
            Please enter your information to begin field testing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userName">User Name *</Label>
              <select
                id="userName"
                value={userName}
                onChange={(e) =>
                  handleUserSelect(e.target.value)
                }
                required
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="" disabled>
                  Select your name
                </option>
                {USERS.map((user) => (
                  <option key={user.email} value={user.name}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                readOnly
                className="bg-gray-50"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !userName}
            >
              {isLoading ? "Loading..." : "Continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
