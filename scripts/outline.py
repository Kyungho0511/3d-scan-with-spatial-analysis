import numpy as np
import matplotlib.pyplot as plt

import pandas as pd
import cv2


def load_data(filename):
    # Load data from the specified filename (assuming it's a parquet file for this example)
    df = pd.read_parquet(filename)
    return df

def get_group(df,cat):
    return df[(df['cat'] == cat)]

def get_point(df):
    points = df[['x', 'y']]
    return np.column_stack((points["x"].values, points["y"].values))

# Function to find range of 'z' column
def get_z_range(df):
    z_min = df['z'].min()
    z_max = df['z'].max()
    return z_min, z_max

def apply_transformation(points, padding, scale_x, scale_y, all_min_0, all_min_1):
    transformed_points = np.copy(points).astype(np.float32)
    transformed_points[:, 0] = (transformed_points[:, 0] - all_min_0) * scale_x + padding
    transformed_points[:, 1] = (transformed_points[:, 1] - all_min_1) * scale_y + padding
    return transformed_points

def reverse_transformation(transformed_points, padding, scale_x, scale_y, all_min_0, all_min_1):
    original_points = np.copy(transformed_points).astype(np.float32)
    original_points[:, 0] = (original_points[:, 0] - padding) / scale_x + all_min_0
    original_points[:, 1] = (original_points[:, 1] - padding) / scale_y + all_min_1
    return original_points

def closest_point_on_segment(p, a, b):
    ap = p - a
    ab = b - a
    t = np.dot(ap, ab) / np.dot(ab, ab)  # Ensure both `ap` and `ab` are 1D
    t = np.clip(t, 0, 1)  # Restrict t to the segment
    return a + t * ab

def main(filename):
    # Load data from file
    df = load_data(filename)

    ceiling = get_group(df,0)
    floor = get_group(df,1)
    windows = get_group(df,10)

    global_z_min = floor['z'].min()
    global_z_max = ceiling['z'].max()

    room_height = [global_z_min,global_z_max]

    flooor_ceiling =  np.vstack((get_point(ceiling), get_point(floor)))
    windows_pt = get_point(windows)

    image_size = (500, 500)
    padding = 50  # Amount of padding around the image
    padded_size = (image_size[0] + 2 * padding, image_size[1] + 2 * padding)

    all_min_0 = flooor_ceiling[:, 0].min()
    all_min_1= flooor_ceiling[:, 1].min()

    # Scaling factors for points to fit within the padded image dimensions
    scale_x = image_size[0] / (flooor_ceiling[:, 0].max() -all_min_0)
    scale_y = image_size[1] / (flooor_ceiling[:, 1].max() - all_min_1)

    transformed_fp = apply_transformation(flooor_ceiling,padding,scale_x,scale_y,all_min_0,all_min_1)

    transformed_window = apply_transformation(windows_pt,padding,scale_x,scale_y,all_min_0,all_min_1)

    image = np.zeros(padded_size, dtype=np.uint8)
    square_size = 20  # Adjust radius to make points thicker
    for point in transformed_fp:
        top_left = (int(point[0] - square_size / 2), int(point[1] - square_size / 2))
        bottom_right = (int(point[0] + square_size / 2), int(point[1] + square_size / 2))
        cv2.rectangle(image, top_left, bottom_right, color=255, thickness=-1)

    # Use Canny Edge Detection to find edges
    edges = cv2.Canny(image, threshold1=100, threshold2=200)

    # Morphological closing to close small gaps
    kernel = np.ones((5, 5), np.uint8)  # Adjust kernel size for closing threshold
    closed_edges = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel)

    # Find contours on the closed edge-detected image
    contours, _ = cv2.findContours(closed_edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    max_length = 0
    longest_contour = None

    for contour in contours:
        length = cv2.arcLength(contour, True)
        if length > max_length:
            max_length = length
            longest_contour = contour

    if longest_contour is not None:
        epsilon = 0.005 * max_length
        approx_longest_contour = cv2.approxPolyDP(longest_contour, epsilon, True)


    window_instance_id = windows['inst'].unique()
    window_filtered_df = windows.reset_index(drop=True)

    transformed_window = np.array(transformed_window)  # Ensure transformed_window is a NumPy array
    approx_longest_contour = approx_longest_contour.reshape(-1, 2)  # Reshape in case it needs flattening


    endpoint_lst =[]
    z_bound = []

    for wii in window_instance_id:
        indices = window_filtered_df.index[window_filtered_df['inst'] == wii].tolist()

        closest_points = []
        distances = []

        window4 = transformed_window[indices]
        windowdf_grp = window_filtered_df.iloc[indices]
        z_bound.append(np.array([windowdf_grp['z'].min(),windowdf_grp['z'].max()]))
        # Loop over each point in transformed_window
        for window_point in window4:
            min_dist = float('inf')
            closest_pt = None
            
            # Loop over each segment in approx_longest_contour
            for i in range(len(approx_longest_contour) - 1):
                a = approx_longest_contour[i]
                b = approx_longest_contour[i + 1]
                
                # Find the closest point on segment ab to window_point
                point_on_segment = closest_point_on_segment(window_point, a, b)
                dist = np.linalg.norm(window_point - point_on_segment)
                
                # Update minimum distance and closest point if this segment is closer
                if dist < min_dist:
                    min_dist = dist
                    closest_pt = point_on_segment
            
            # Store the closest point and corresponding distance for this window_point
            closest_points.append(closest_pt)
            distances.append(min_dist)

        # Convert lists to arrays if needed
        closest_points = np.array(closest_points)
        distances = np.array(distances)

        # Find the two points with the maximum distance directly
        endpoints = None

        # Compute pairwise distance matrix using broadcasting
        diff = closest_points[:, np.newaxis, :] - closest_points[np.newaxis, :, :]
        dist_matrix = np.sqrt(np.sum(diff ** 2, axis=-1))

        # Find the indices of the maximum distance in the matrix
        i, j = np.unravel_index(np.argmax(dist_matrix), dist_matrix.shape)
        endpoints = [closest_points[i], closest_points[j]]
        endpoint_lst.append(np.array(endpoints))

    
    final_fp = reverse_transformation(approx_longest_contour,padding,scale_x,scale_y,all_min_0,all_min_1)

    final_endpoint_lst = []
    for arr in endpoint_lst:
        final_endpoint_lst.append(reverse_transformation(arr,padding,scale_x,scale_y,all_min_0,all_min_1))



    return final_fp,room_height,final_endpoint_lst,z_bound