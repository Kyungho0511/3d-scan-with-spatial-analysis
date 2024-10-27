
# Point Cloud Preprocessing for Grasshopper, Ladybug, and Web Visualization

This repository provides tools for preprocessing point clouds for analysis in Grasshopper using Ladybug and for web visualization with React and Three.js. The preprocessing pipeline cleans, transforms, and prepares spatial data, making it compatible with computational design workflows and interactive 3D visualization.

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Preprocessing Details](#preprocessing-details)
- [Visualization Workflow](#visualization-workflow)
- [Contributing](#contributing)
- [License](#license)

## Overview

This repository offers a Python-based toolset to preprocess point cloud data, making it ready for environmental analysis with Ladybug in Grasshopper and for interactive 3D web-based applications using React and Three.js. The provided scripts handle data transformation, segmentation, and spatial analysis, facilitating seamless integration between 3D point clouds and analytical workflows.

## Features

- **Load and Preprocess Point Clouds**: Import point cloud data from files (e.g., `.parquet`) and transform the data for further analysis.
- **Spatial Analysis**: Extract floors, ceilings, and windows from point cloud data for precise height calculations and boundary detection.
- **Transformation and Scaling**: Scale and pad point cloud data for image representation and contour detection.
- **Contour Extraction**: Use Canny edge detection and contour approximation for identifying structural boundaries.
- **Data Export**: Transform data back to its original scale and format for compatibility with Grasshopper and Ladybug.

## Installation

1. **Clone the repository:**
    \`\`\`bash
    git clone https://github.com/yourusername/point-cloud-preprocessor.git
    cd point-cloud-preprocessor
    \`\`\`

2. **Install Python dependencies:**
    \`\`\`bash
    pip install numpy pandas opencv-python matplotlib pyarrow
    \`\`\`

3. **Optional: Install additional visualization tools for web integration**
    - For the React-based web visualization:
      \`\`\`bash
      cd web-visualization
      npm install
      \`\`\`

## Usage

### Preprocessing Workflow

1. **Prepare Your Point Cloud Data:**
   - Ensure your point cloud data is saved as a `.parquet` file.
   - Place the file in the `data/` directory.

2. **Run the Preprocessing Script:**
   \`\`\`bash
   python preprocess.py --input data/your-pointcloud-file.parquet
   \`\`\`
   - This script will:
     - Load the point cloud data.
     - Extract floor, ceiling, and window data.
     - Transform and normalize coordinates for further analysis.
     - Identify and approximate room boundaries.
     - Output transformed coordinates and metadata.

3. **Data Output:**
   - The script returns processed data including:
     - `final_fp`: The contour points representing the room boundary.
     - `room_height`: A list with the minimum and maximum height of the room.
     - `final_endpoint_lst`: The endpoints of window alignments.
     - `z_bound`: The `z`-boundaries of window groups.

### Preprocessing Details

The \`preprocess.py\` script includes functions for various preprocessing steps:
- **Data Loading**: Reads point cloud data from a `.parquet` file.
- **Point Extraction**: Extracts points based on categories (e.g., ceiling, floor, windows).
- **Transformation**: Normalizes point positions to fit within a specified image size for visualization.
- **Edge Detection and Contour Approximation**: Identifies room boundaries using OpenCV's edge detection and contour approximation methods.
- **Reverse Transformation**: Transforms points back to their original scale for compatibility with Grasshopper.

### Visualization Workflow

1. **Prepare Data for Web Visualization:**
   - Export the processed point cloud data from the script as a JSON or CSV file.
   - Place the exported file in the \`web-visualization/public/data/\` directory.

2. **Start the React Application:**
   \`\`\`bash
   cd web-visualization
   npm start
   \`\`\`
   - Open \`http://localhost:3000\` to view the 3D visualization of your point cloud data.

3. **Deploy the Application**: 
   - Use platforms like Vercel or Netlify for deployment.
   - Adjust paths in the React app if needed.

## Contributing

We welcome contributions! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to contribute to this project.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.
