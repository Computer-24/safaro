"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    // ⭐ Handle inactive account
    if (res?.error === "InactiveAccount") {
      toast.error("Your account is inactive. Contact your administrator.");
      setLoading(false);
      return;
    }

    // ⭐ Handle invalid credentials
    if (res?.error === "CredentialsSignin") {
      toast.error("Invalid email or password.");
      setLoading(false);
      return;
    }

    // ⭐ Successful login
    if (res?.ok) {
      toast.success("Welcome back!");
      router.push("/dashboard");
      return;
    }

    setLoading(false);
  }

  return (
    <div className="w-full">

      {/* Theme toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-sm md:max-w-md lg:max-w-lg mx-auto shadow-lg border border-border">
        <CardHeader className="text-center space-y-1">
          <CardTitle className="text-2xl font-bold">Welcome to Safaro</CardTitle>
          <CardDescription>Sign in to continue</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                className="h-10"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-10"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>

    </div>
  );
}
