import React from "react";
import ProfileView from "@/components/profile-view";

export default function Profile() {
  const getUserFirstName = () => {
    return "Student"; // In real app, would get from user context
  };

  return (
    <main className="px-6 py-8 animate-fade-in bg-gradient-to-br from-powder-100 via-sage-50 to-orange-50 min-h-screen">
      <div className="mb-12">
        <h1 className="text-4xl font-display font-bold text-foreground mb-2">
          Let's get to know you better, {getUserFirstName()}
        </h1>
        <p className="text-lg text-gray-600 font-medium">
          manage your profile to help personalize your email generation.
        </p>
      </div>
      
      <ProfileView />
    </main>
  );
}