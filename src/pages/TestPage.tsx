import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TestPage: React.FC = () => {
  return (
    <div className="container mx-auto py-6">
      <h2 className="text-3xl font-bold mb-6">Test Page</h2>
      
      <Card>
        <CardHeader>
          <CardTitle>Test Component</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This is a test page to check if the application is loading correctly.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestPage;
