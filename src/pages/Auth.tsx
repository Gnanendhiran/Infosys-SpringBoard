import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "@/integrations/firebase/config";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Brain } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FloatingShapes } from "@/components/Animations/FloatingShapes";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [userType, setUserType] = useState<"recruiter" | "candidate">("candidate");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const isLoggingIn = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && !isLoggingIn.current) {
        const profileDoc = await getDoc(doc(db, "profiles", user.uid));
        if (profileDoc.exists()) {
          const profileData = profileDoc.data();
          if (profileData.user_type === "recruiter") {
            navigate("/hr-dashboard");
          } else {
            navigate("/candidate-dashboard");
          }
        }
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    isLoggingIn.current = true;

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const profileDoc = await getDoc(doc(db, "profiles", user.uid));
        if (profileDoc.exists()) {
          const profileData = profileDoc.data();

          // Check if the selected user type matches the profile user type
          if (profileData.user_type !== userType) {
            await auth.signOut();
            toast({
              title: "Access Denied",
              description: `You are registered as a ${profileData.user_type}. Please login as a ${profileData.user_type}.`,
              variant: "destructive",
            });
            return;
          }

          toast({
            title: "Welcome back!",
            description: "Successfully logged in.",
          });

          if (profileData.user_type === "recruiter") {
            navigate("/hr-dashboard");
          } else {
            navigate("/candidate-dashboard");
          }
        }
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Create profile in Firestore
        await setDoc(doc(db, "profiles", user.uid), {
          email: user.email,
          full_name: fullName,
          user_type: userType,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });

        toast({
          title: "Account created!",
          description: "Welcome to CareerAlign AI!",
        });

        // Navigate immediately after successful signup and profile creation
        if (userType === "recruiter") {
          navigate("/hr-dashboard");
        } else {
          navigate("/candidate-dashboard");
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Authentication failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      isLoggingIn.current = false;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <FloatingShapes count={3} />
      <div className="absolute inset-0 bg-gradient-to-br from-black via-emerald-950 to-blue-950 pointer-events-none" />

      <Card className="w-full max-w-md p-8 bg-black/30 backdrop-blur-sm border border-blue-600/30 relative z-10 fade-in-up">
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-4 group">
            <Brain className="h-8 w-8 text-white icon-bounce" />
            <div className="absolute inset-0 rounded-2xl bg-blue-600 opacity-50 blur-xl -z-10" />
          </div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent tracking-tight mb-2">CareerAlign AI</h1>
          <p className="text-white/70 text-sm">Smart Hiring & Career Growth</p>
        </div>

        <h2 className="text-xl font-semibold text-center mb-6 text-white/90">
          {isLogin ? "Welcome Back" : "Create Account"}
        </h2>

        <form onSubmit={handleAuth} className="space-y-5">
          {!isLogin && (
            <div className="space-y-4 fade-in-up" style={{ animationDelay: '0.1s' }}>
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-xs font-medium uppercase tracking-wider text-white/60 ml-1">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="John Doe"
                  className="bg-black/50 border-blue-600/30 focus:border-emerald-500 focus:ring-emerald-500/20 text-white placeholder:text-white/40 transition-all duration-300"
                />
              </div>
            </div>
          )}

          <div className="space-y-2 fade-in-up" style={{ animationDelay: '0.15s' }}>
            <Label className="text-xs font-medium uppercase tracking-wider text-white/60 ml-1">{isLogin ? "Login as" : "I am a"}</Label>
            <RadioGroup
              value={userType}
              onValueChange={(value: "recruiter" | "candidate") => setUserType(value)}
              className="grid grid-cols-2 gap-4"
            >
              <div className="relative">
                <RadioGroupItem value="candidate" id="candidate" className="peer sr-only" />
                <Label
                  htmlFor="candidate"
                  className="flex flex-col items-center justify-center p-3 rounded-xl border border-blue-600/30 bg-black/50 cursor-pointer hover:bg-blue-900/20 peer-data-[state=checked]:border-emerald-500 peer-data-[state=checked]:bg-emerald-900/20 peer-data-[state=checked]:text-emerald-400 text-white transition-all duration-300"
                >
                  <span className="font-semibold">Candidate</span>
                </Label>
              </div>
              <div className="relative">
                <RadioGroupItem value="recruiter" id="recruiter" className="peer sr-only" />
                <Label
                  htmlFor="recruiter"
                  className="flex flex-col items-center justify-center p-3 rounded-xl border border-blue-600/30 bg-black/50 cursor-pointer hover:bg-blue-900/20 peer-data-[state=checked]:border-emerald-500 peer-data-[state=checked]:bg-emerald-900/20 peer-data-[state=checked]:text-emerald-400 text-white transition-all duration-300"
                >
                  <span className="font-semibold">Recruiter</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2 fade-in-up" style={{ animationDelay: '0.2s' }}>
            <Label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-white/60 ml-1">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="bg-black/50 border-blue-600/30 focus:border-emerald-500 focus:ring-emerald-500/20 text-white placeholder:text-white/40 transition-all duration-300"
            />
          </div>

          <div className="space-y-2 fade-in-up" style={{ animationDelay: '0.3s' }}>
            <Label htmlFor="password" className="text-xs font-medium uppercase tracking-wider text-white/60 ml-1">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              minLength={6}
              className="bg-black/50 border-blue-600/30 focus:border-emerald-500 focus:ring-emerald-500/20 text-white placeholder:text-white/40 transition-all duration-300"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 font-bold h-11 mt-2 fade-in-up text-white"
            style={{ animationDelay: '0.4s' }}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              isLogin ? "Log In" : "Create Account"
            )}
          </Button>
        </form>

        <div className="mt-8 text-center fade-in-up" style={{ animationDelay: '0.5s' }}>
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-white/70 hover:text-emerald-400 transition-colors duration-300 flex items-center justify-center gap-2 mx-auto group"
          >
            {isLogin ? (
              <>
                Don't have an account? <span className="text-emerald-400 font-semibold group-hover:underline">Sign up</span>
              </>
            ) : (
              <>
                Already have an account? <span className="text-emerald-400 font-semibold group-hover:underline">Log in</span>
              </>
            )}
          </button>
        </div>
      </Card>
    </div>
  );
};

export default Auth;
