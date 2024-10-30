"use client"; // Ensures client-side rendering

import { useEffect, useRef, useState } from "react";
import { createSession, createViewport } from "@shapediver/viewer";

interface Feature {
  name: string;
  value: string | number;
}

interface InputSectionProps {
  label: string;
  options: string[];
  selected: string;
  setSelected: React.Dispatch<React.SetStateAction<string>>;
  disabledOptions?: string[]; // Optionally disable specific options
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sessionRef = useRef<any>(null);
  const [isSessionInitialized, setIsSessionInitialized] = useState<boolean>(false);

  // States for ShapeDiver parameters
  const [spaceIndex, setSpaceIndex] = useState<string>("0");
  const [visualizationType, setVisualizationType] = useState<string>("0");
  const [analysisPeriod, setAnalysisPeriod] = useState<string>("0");

  // State to hold features after "color" and their values
  const [featuresAfterColor, setFeaturesAfterColor] = useState<Feature[]>([]);

  useEffect(() => {
    if (typeof window === "undefined" || !canvasRef.current) return; // Client-side check for window object

    const initializeViewer = async () => {
      try {
        const viewport = await createViewport({
          canvas: canvasRef.current as HTMLCanvasElement,
          id: "myViewport",
        });

        const session = await createSession({
          ticket: "b01272f0e2b880ffc3d2a22a002de6471fd4e1f21877f5e0491248db9eb526e354ffc2aed031a32509cd03dd122506fc1f8d7a2c84bda26fc208c018941af3a19bf567fd9449e2fad6349d76c3b3c5c27ad9c758314b9d9839285bedacacc91e8b13391f0bea73-978cc2d04bff5c3eee0419c927fb9df0",
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
    const spaceIndexParam = session.getParameterByName("Space Index")[0];

    // Set values for ShapeDiver parameters
    if (visualizationParam) visualizationParam.value = visualizationType;
    if (analysisPeriodParam) analysisPeriodParam.value = analysisPeriod;
    if (spaceIndexParam) spaceIndexParam.value = spaceIndex;

    await session.customize();
  };

  useEffect(() => {
    if (isSessionInitialized) {
      updateShapeDiverParameters();
    }
  }, [spaceIndex, visualizationType, analysisPeriod, isSessionInitialized]);

  const generateFilePath = (): string => {
    return `https://raw.githubusercontent.com/Kyungho0511/3d-scan-with-spatial-analysis/refs/heads/simulation-to-viewer/ViewerData/S${spaceIndex}_V${visualizationType}_H${analysisPeriod}.txt`;
  };

  const fetchAndSetFeaturesAfterColor = async () => {
    const filePath = generateFilePath();
    try {
      const response = await fetch(filePath);
      const data = await response.json();

      const features = Object.keys(data);
      const colorIndex = features.indexOf("color");

      if (colorIndex !== -1) {
        const featuresAfterColor: Feature[] = features.slice(colorIndex + 1).map((feature) => ({
          name: feature,
          value: !isNaN(Number(data[feature])) ? Number(data[feature]).toFixed(2) : data[feature],
        }));
        setFeaturesAfterColor(featuresAfterColor);
      } else {
        console.log("'color' key not found in the data.");
      }
    } catch (error) {
      console.error("Error fetching or parsing file:", error);
    }
  };

  // Fetch features when parameters change
  useEffect(() => {
    fetchAndSetFeaturesAfterColor();
  }, [spaceIndex, visualizationType, analysisPeriod]);

  // Auto-select "No Specific Time" if "View Analysis" is chosen
  useEffect(() => {
    if (visualizationType === "1") { // View Analysis selected
      setAnalysisPeriod("3"); // Set to "No Specific Time"
    } else if (visualizationType === "0" && ["0", "1", "2"].includes(analysisPeriod)) { // Sun Hour selected
      setAnalysisPeriod("0"); // Default to "Morning"
    }
  }, [visualizationType]);

  // Disable options based on the selected visualization type
  const disabledAnalysisPeriods = visualizationType === "1" ? ["0", "1", "2"] : [];

  return (
    <div className="flex min-h-screen p-8 gap-8 bg-gray-50">
      <div className="flex-1 bg-white rounded-lg shadow-md p-4 relative overflow-hidden">
        <h2 className="text-xl font-semibold mb-4"></h2>
        <canvas
          ref={canvasRef}
          id="viewport1"
          className="w-full h-full"
          style={{ maxWidth: "1000px", maxHeight: "625px" }}
        />
      </div>

      <div className="w-1/4 bg-white rounded-lg shadow-md p-4">
        <h2 className="text-xl font-semibold mb-4">Analysis Inputs</h2>
        <div className="space-y-4">
          <InputSection label="Space Index" options={["A(original)", "A(cleaned)", "B(original)", "B(cleaned)"]} selected={spaceIndex} setSelected={setSpaceIndex} />
          <InputSection label="Visualization Type" options={["Sun Hour", "View Analysis"]} selected={visualizationType} setSelected={setVisualizationType} />
          <InputSection
            label="Analysis Period"
            options={["Morning(6-10)", "Noon(10-14)", "Afternoon(14-18)", "No Specific Time"]}
            selected={analysisPeriod}
            setSelected={setAnalysisPeriod}
            disabledOptions={disabledAnalysisPeriods} // Disable options for "View Analysis"
          />
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Analysis Results</h3>
          <div className="space-y-4">
            {featuresAfterColor.map((feature, index) => (
              <div key={index} className="p-2 border rounded bg-gray-100">
                <div className="font-semibold text-gray-700">{feature.name}</div>
                <div className="text-gray-900">
                  {typeof feature.value === "string" ? feature.value : Number(feature.value).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Input section component with optional disabled options
function InputSection({ label, options, selected, setSelected, disabledOptions = [] }: InputSectionProps) {
  return (
    <div>
      <label className="block font-medium text-gray-700">{label}</label>
      <div className="mt-1 flex flex-wrap gap-2">
        {options.map((option, index) => {
          const isDisabled = disabledOptions.includes(index.toString());
          return (
            <button
              key={index}
              className={`px-3 py-1 rounded ${selected === index.toString() ? "bg-blue-500 text-white" : isDisabled ? "grey-out" : "bg-gray-200"}`}
              style={{ minWidth: "75px" }}
              onClick={() => setSelected(index.toString())}
              disabled={isDisabled}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
