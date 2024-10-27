import pyarrow.parquet as pq
import os
import pandas as pd
import numpy as np
import open3d as o3d
import trimesh
import ghhops_server as hs
import rhino3dm
from flask import Flask
import open3d as o3d
import json

def o3d_to_rhino3dm(o3d_mesh):
    """
    Converts an Open3D mesh into a Rhino3dm mesh.

    Parameters:
        o3d_mesh (o3d.geometry.TriangleMesh): The Open3D mesh to convert.

    Returns:
        rhino3dm.Mesh: The converted Rhino3dm mesh.
    """

    
    # Create a new Rhino3dm mesh
    rhino_mesh = rhino3dm.Mesh()

    # Add vertices to the Rhino mesh
    for vertex in o3d_mesh.vertices:
        rhino_mesh.Vertices.Add(vertex[0], vertex[1], vertex[2])

    # Add faces to the Rhino mesh
    for triangle in o3d_mesh.triangles:
        rhino_mesh.Faces.AddFace(triangle[0], triangle[1], triangle[2])

    return rhino_mesh

def aabb_to_mesh(aabb):
    """
    Converts an Open3D AxisAlignedBoundingBox into a TriangleMesh.

    Parameters:
        aabb (o3d.geometry.AxisAlignedBoundingBox): The bounding box to convert.

    Returns:
        o3d.geometry.TriangleMesh: The mesh representation of the AABB.
    """
    # Get the eight corners of the AABB
    corners = np.asarray(aabb.get_box_points())
    
    # Define the 12 triangles (faces) of the box using the corners
    faces = [
        [0, 1, 2], [0, 2, 3],  # bottom face
        [4, 5, 6], [4, 6, 7],  # top face
        [0, 1, 5], [0, 5, 4],  # front face
        [2, 3, 7], [2, 7, 6],  # back face
        [1, 2, 6], [1, 6, 5],  # right face
        [0, 3, 7], [0, 7, 4]   # left face
    ]
    
    # Create a TriangleMesh from the corners and faces
    mesh = o3d.geometry.TriangleMesh()
    mesh.vertices = o3d.utility.Vector3dVector(corners)
    mesh.triangles = o3d.utility.Vector3iVector(faces)
    
    # Optionally, compute normals for better visualization
    mesh.compute_vertex_normals()
    
    return mesh


def create_bounding_box(point_cloud):
    """
    Create a simplified bounding box around the point cloud.

    Parameters:
        point_cloud (o3d.geometry.PointCloud): The point cloud to wrap.

    Returns:
        o3d.geometry.TriangleMesh: The bounding box mesh.
    """
    # Get the axis-aligned bounding box (AABB)
    aabb = point_cloud.get_axis_aligned_bounding_box()
    
    bounding_box_mesh = aabb_to_mesh(aabb)
    # Create a mesh from the bounding bo
    # bounding_box_mesh = o3d.geometry.TriangleMesh.create_from_axis_aligned_bounding_box(aabb)
    
    # Optionally, we can apply a scaling factor to make the box larger
    scale_factor = 1.05  # Scale to make the box slightly larger
    bounding_box_mesh.scale(scale_factor, center=aabb.get_center())
    
    return bounding_box_mesh


def dfToPC(df):
    # Convert DataFrame to NumPy array
    points = df[['x', 'y', 'z']].to_numpy()
    # Create an Open3D point cloud object
    point_cloud = o3d.geometry.PointCloud()
    point_cloud.points = o3d.utility.Vector3dVector(points)
    return point_cloud


def dfToBB(df):
    return create_bounding_box(dfToPC(df))


def dfToMesh(df):
    
    point_cloud = dfToPC(df)

    # Downsample the point cloud
    pcd = point_cloud.voxel_down_sample(voxel_size=0.01)

    # Remove outliers
    cl, ind = pcd.remove_statistical_outlier(nb_neighbors=20, std_ratio=2.0)
    clean_pcd = pcd.select_by_index(ind)

    # Visualize the cleaned point cloud
    # o3d.visualization.draw_geometries([clean_pcd])

    # Estimate normals
    clean_pcd.estimate_normals(search_param=o3d.geometry.KDTreeSearchParamHybrid(radius=0.05, max_nn=30))

    # Orient the normals
    clean_pcd.orient_normals_consistent_tangent_plane(100)
    mesh, densities = o3d.geometry.TriangleMesh.create_from_point_cloud_poisson(
        clean_pcd, depth=9
    )

    # Define a threshold to remove low-density vertices
    vertices = np.asarray(mesh.vertices)
    density_threshold = np.percentile(densities, 5)  # Remove the bottom 5% of densities
    vertices_to_remove = densities < density_threshold

    # Filter vertices based on the density threshold
    mesh.remove_vertices_by_mask(vertices_to_remove)
    return mesh




def dfToRhinoMesh(df):
    return o3d_to_rhino3dm(dfToBB(df))

def dfToRhinoBBMesh(df):
    return o3d_to_rhino3dm(dfToMesh(df))
# def add_numbers(a: str, b: float) -> rhino3dm.Mesh:
a = dir_path = os.path.dirname(os.path.realpath(__file__)) + "/setup_22.parquet"

# Read the Parquet file
table = pq.read_table(a)

# Convert to a pandas DataFrame if needed
df = table.to_pandas()
dfWalls = df[df['cat'] == 2]
dfFloor = df[df['cat'] == 1]
dfCeiling = df[df['cat'] == 0]
dfWindow =df[df['cat'] == 10]

if(len(dfWindow) == 0):
    exit()
    
print(len(dfWalls))
print(len(dfFloor))
print(len(dfCeiling))



df_sampleWalls = dfWalls
df_sampleFloor = dfFloor
df_sampleCeiling = dfCeiling
df_sampleWalls = dfWalls.sample(n=40000, random_state=1)
df_sampleFloor = dfFloor.sample(n=40000, random_state=1)
df_sampleCeiling = dfCeiling.sample(n=40000, random_state=1)


df_sampleWindow = df[df['cat'] == 10]

walls = dfToRhinoMesh(df_sampleWalls)
floor = dfToRhinoMesh(df_sampleFloor)
ceiling = dfToRhinoMesh(df_sampleCeiling)
window = dfToRhinoMesh(df_sampleWindow)
# Create a 3dm file
model = rhino3dm.File3dm()
model.Objects.AddMesh(walls)
model.Objects.AddMesh(floor)
model.Objects.AddMesh(ceiling)
model.Objects.AddMesh(window)


walls = dfToRhinoBBMesh(df_sampleWalls)
floor = dfToRhinoBBMesh(df_sampleFloor)
ceiling = dfToRhinoBBMesh(df_sampleCeiling)
window = dfToRhinoBBMesh(df_sampleWindow)




# Add the point to the model
model.Objects.AddMesh(walls)
model.Objects.AddMesh(floor)
model.Objects.AddMesh(ceiling)
model.Objects.AddMesh(window)


# Write the model to a file
model.Write("my_geometry.3dm", 6) 






