import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface RoleSelectorProps {
  user: {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
    };
  };
  onRoleSet: (role: "organizer" | "participant") => void;
}

export default function RoleSelector({ user, onRoleSet }: RoleSelectorProps) {
  const [loading, setLoading] = useState(false);

  const setRole = async (role: "organizer" | "participant") => {
    setLoading(true);
    await supabase.from("users").upsert({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name,
      role,
    });
    setLoading(false);
    onRoleSet(role);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black/80">
      <div className="bg-white rounded-lg p-8 shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Select your role</h2>
        <button
          className="bg-blue-600 text-white px-6 py-2 rounded mb-4 w-full"
          onClick={() => setRole("organizer")}
          disabled={loading}
        >
          Organizer
        </button>
        <button
          className="bg-green-600 text-white px-6 py-2 rounded w-full"
          onClick={() => setRole("participant")}
          disabled={loading}
        >
          Participant
        </button>
      </div>
    </div>
  );
}