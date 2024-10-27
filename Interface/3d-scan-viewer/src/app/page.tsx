"use client"; // Add this line at the top

import { useEffect, useRef, useState } from "react";
import { createSession, createViewport } from "@shapediver/viewer";

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sessionRef = useRef<any>(null);
  const [isSessionInitialized, setIsSessionInitialized] = useState(false);

  const [visualizationType, setVisualizationType] = useState("0");
  const [analysisPeriod, setAnalysisPeriod] = useState("0");

  useEffect(() => {
    const initializeViewer = async () => {
      if (typeof window === 'undefined' || !canvasRef.current) return;

      try {
        const viewport = await createViewport({
          canvas: canvasRef.current,
          id: "myViewport",
        });

        const session = await createSession({
          ticket: "8c1fbc7d2f7baf922985438965b3d7614021960a11c13a1c01984fbd2926b8c9c85aeceb26a81bf46e2e599fdf63ec7af4b6851462a0d1b1bae64ff3c35378751189214f6f199118e6dd6ea5e08e2994b03fce8b5e0af9e0d9cb9e56a52ec106bbb3f6d90b005c-08ec0aa6d365cbe33243a055e9a6528d",
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

    if (visualizationParam) visualizationParam.value = visualizationType;
    if (analysisPeriodParam) analysisPeriodParam.value = analysisPeriod;

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
            <label htmlFor="visualizationType" className="block font-medium text-gray-700">
              Visualization Type
            </label>
            <select
              id="visualizationType"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              value={visualizationType}
              onChange={(e) => setVisualizationType(e.target.value)}
            >
              <option value="0">Sun Hour</option>
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
              <option value="0">Morning(6-10)</option>
              <option value="1">Noon(10-14)</option>
              <option value="2">Afternoon(14-18)</option>
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

    // Append user message to chat
    setMessages((prevMessages) => [...prevMessages, { role: "user", content: input }]);
    setInput("");

    // Placeholder for GPT response (replace this with actual API call to OpenAI)
    const response = { role: "assistant", content: "I'm here to help with your questions!" };
    
    // Add GPT response to chat
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
