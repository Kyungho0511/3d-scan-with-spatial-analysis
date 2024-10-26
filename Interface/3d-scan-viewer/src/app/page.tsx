"use client";

import { useEffect, useRef } from "react";
import { createSession, createViewport } from "@shapediver/viewer";
import { createUi } from "@shapediver/viewer.shared.demo-helper";

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const initializeViewer = async () => {
      if (!canvasRef.current) return; // Type guard to ensure canvasRef.current is not null

      // Create a session
      const session = await createSession({
        ticket:
          "8c1fbc7d2f7baf922985438965b3d7614021960a11c13a1c01984fbd2926b8c9c85aeceb26a81bf46e2e599fdf63ec7af4b6851462a0d1b1bae64ff3c35378751189214f6f199118e6dd6ea5e08e2994b03fce8b5e0af9e0d9cb9e56a52ec106bbb3f6d90b005c-08ec0aa6d365cbe33243a055e9a6528d",
        modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com",
        id: "mySession",
      });

      // Create a single viewport with a fixed-size canvas element
      const viewport = await createViewport({
        id: "viewport1",
        canvas: canvasRef.current,
      });

      // Create a UI for the session
      createUi(session, canvasRef.current);
    };

    initializeViewer();
  }, []);

  return (
    <div className="flex min-h-screen p-8 gap-8 bg-gray-50">
      {/* Left container for ShapeDiver Viewer */}
      <div className="flex-1 bg-white rounded-lg shadow-md p-4 relative overflow-hidden">
        <h2 className="text-xl font-semibold mb-4">3D Viewer</h2>
        <canvas
          ref={canvasRef}
          id="viewport1"
          className="w-full h-full"
          style={{ maxWidth: "800px", maxHeight: "600px" }} // Set max dimensions
        />
      </div>

      {/* Right sidebar for inputs */}
      <div className="w-1/4 bg-white rounded-lg shadow-md p-4">
        <h2 className="text-xl font-semibold mb-4">Options</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="visualizationType" className="block font-medium text-gray-700">
              Visualization Type
            </label>
            <select
              id="visualizationType"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            >
              <option>Type 1</option>
              <option>Type 2</option>
              <option>Type 3</option>
            </select>
          </div>
          <div>
            <label htmlFor="analysisPeriod" className="block font-medium text-gray-700">
              Analysis Period
            </label>
            <select
              id="analysisPeriod"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            >
              <option>Period 1</option>
              <option>Period 2</option>
              <option>Period 3</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
