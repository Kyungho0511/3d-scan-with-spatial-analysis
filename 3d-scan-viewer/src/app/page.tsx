"use client"; // Ensures client-side rendering

import { useEffect, useRef, useState } from "react";
import { createSession, createViewport } from "@shapediver/viewer";

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sessionRef = useRef<any>(null);
  const [isSessionInitialized, setIsSessionInitialized] = useState(false);

  // States for ShapeDiver parameters
  const [spaceIndexType, setSpaceIndexType] = useState("A");
  const [visualizationType, setVisualizationType] = useState("sunHours");
  const [analysisPeriod, setAnalysisPeriod] = useState("6_10");

  useEffect(() => {
    const initializeViewer = async () => {
      if (!canvasRef.current) return;

      try {
        const viewport = await createViewport({
          canvas: canvasRef.current,
          id: "myViewport",
        });

        const session = await createSession({
          ticket: "bb95520c067922bd4c054a713bd0674aa6933ccfc853fdeb1d24de3357b2bedc6b5da3d6f8ebce4a18f50a71037316aab77d8e1ee153409cb7636c29449c185fd939d96e1dcacd6a72ac6f1730087d126c708f39c620ca61e517b6a62cca048092f341d31225d1-0d8bef910ac6880b6c57049595cf8db6",
          modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com",
          id: "mySession",
        });

        sessionRef.current = session;
        setIsSessionInitialized(true);
      } catch (error) {
        console.error("Error initializing session:", error);
      }
    };

    initializeViewer();
  }, []);

  const updateShapeDiverParameters = async () => {
    if (!isSessionInitialized || !sessionRef.current) return;

    const session = sessionRef.current;
    const visualizationParam = session.getParameterByName("Visualization Type")[0];
    const analysisPeriodParam = session.getParameterByName("Analysis Period")[0];

    // Debugging logs to verify values
    console.log("Setting Visualization Type to:", visualizationType);
    console.log("Setting Analysis Period to:", analysisPeriod);

    if (visualizationParam) visualizationParam.value = visualizationType; // Pass string directly
    if (analysisPeriodParam) analysisPeriodParam.value = analysisPeriod;   // Pass string directly

    await session.customize();
  };

  useEffect(() => {
    if (isSessionInitialized) {
      updateShapeDiverParameters();
    }
  }, [visualizationType, analysisPeriod, isSessionInitialized]);

  return (
    <div className="flex min-h-screen p-8 gap-8 bg-gray-50">
      <div className="flex-1 bg-white rounded-lg shadow-md p-4 relative overflow-hidden">
        <h2 className="text-xl font-semibold mb-4">3D Viewer</h2>
        <canvas
          ref={canvasRef}
          id="viewport1"
          className="w-full h-full"
          style={{ maxWidth: "1000px", maxHeight: "600px" }}
        />
      </div>

      <div className="w-1/4 bg-white rounded-lg shadow-md p-4">
        <h2 className="text-xl font-semibold mb-4">Options</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="spaceIndex" className="block font-medium text-gray-700">
              Space Index
            </label>
            <select
              id="spaceIndex"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              value={spaceIndexType}
              onChange={(e) => setSpaceIndexType(e.target.value)}
            >
              <option value="0">A</option>
              <option value="1">B</option>
              <option value="2">C</option>
            </select>
          </div>
          <div>
            <label htmlFor="visualizationType" className="block font-medium text-gray-700">
              Visualization Type
            </label>
            <select
              id="visualizationType"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              value={visualizationType}
              onChange={(e) => setVisualizationType(e.target.value)}
            >
              <option value="0">Sun Hours</option>
              <option value="1">Indoor Comfort</option>
              <option value="2">Daylight Availability</option>
              <option value="3">View Analysis</option>
            </select>
          </div>
          <div>
            <label htmlFor="analysisPeriod" className="block font-medium text-gray-700">
              Analysis Period
            </label>
            <select
              id="analysisPeriod"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              value={analysisPeriod}
              onChange={(e) => setAnalysisPeriod(e.target.value)}
            >
              <option value="0">Morning (6-10)</option>
              <option value="1">Noon (10-14)</option>
              <option value="2">Afternoon (14-18)</option>
              <option value="3">No Specific Time</option>
            </select>
          </div>
        </div>
        <ChatGPTBox />
      </div>
    </div>
  );
}

// ChatGPT chat box component
function ChatGPTBox() {
  const [messages, setMessages] = useState([{ role: "assistant", content: "Hello! How can I help you?" }]);
  const [input, setInput] = useState("");

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    setMessages((prevMessages) => [...prevMessages, { role: "user", content: input }]);
    setInput("");

    const response = { role: "assistant", content: "I'm here to help with your questions!" };
    setMessages((prevMessages) => [...prevMessages, response]);
  };

  return (
    <div className="mt-8 p-4 bg-gray-100 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold mb-4">ChatGPT Assistant</h2>
      <div className="overflow-y-auto h-48 mb-4 border rounded p-2 bg-white">
        {messages.map((msg, index) => (
          <div key={index} className={`mb-2 ${msg.role === "user" ? "text-right" : "text-left"}`}>
            <span className={`inline-block p-2 rounded-lg ${msg.role === "user" ? "bg-blue-200" : "bg-gray-200"}`}>
              {msg.content}
            </span>
          </div>
        ))}
      </div>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type your message..."
        className="w-full border rounded p-2 mb-2"
      />
      <button
        onClick={handleSendMessage}
        className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
      >
        Send
      </button>
    </div>
  );
}
