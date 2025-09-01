// src/pages/About.tsx
import React from "react";

const About: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-3xl font-bold mb-4">About This Project</h2>
      <p className="text-gray-700 leading-relaxed mb-4">
        This is a React + TypeScript + Tailwind CSS frontend project. 
        It is connected to a backend to fetch and display data dynamically.
      </p>
      <p className="text-gray-700 leading-relaxed mb-4">
        The purpose of this app is to demonstrate how to structure a project with 
        reusable components, clean file organization, and modern UI styling using Tailwind. 
        You can easily extend this app with new pages, authentication, and API integrations.
      </p>
      <p className="text-gray-700 leading-relaxed">
        🚀 Next steps: add authentication, dashboard features, and real-time API data.
      </p>
    </div>
  );
};

export default About;
