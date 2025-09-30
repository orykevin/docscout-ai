"use client";

import ChatUI from "@/components/chat-ui";
import React from "react";

const HomePage = () => {
  return (
    <div className="flex justify-center h-full flex-col gap-12">
      <h1 className="text-3xl font-bold text-center">
        Just ask and let AI scout your docs
      </h1>
      <div className="pb-20">
        <ChatUI isFrontPage />
        <div></div>
      </div>
    </div>
  );
};

export default HomePage;
