import vtk
import json

def read_3d_data(filename):
    reader = vtk.vtkSTLReader()
    reader.SetFileName(filename)
    reader.Update()
    data = reader.GetOutput()
    print(f"Read {data.GetNumberOfPoints()} points from {filename}")
    return data

def create_vtk_plane(pos, normal):
    plane = vtk.vtkPlane()
    plane.SetOrigin(float(pos[0]), float(pos[1]), float(pos[2]))
    plane.SetNormal(float(normal[0]), float(normal[1]), float(normal[2]))
    return plane

def cut_by_plane(plane, data):
    cutter = vtk.vtkCutter()
    cutter.SetCutFunction(plane)
    cutter.SetInputData(data)
    cutter.Update()
    cutStrips = vtk.vtkStripper()    
    cutStrips.SetInputConnection(cutter.GetOutputPort())
    cutStrips.Update()
    cutPoly = vtk.vtkPolyData()  
    cutPoly.SetPoints(cutStrips.GetOutput().GetPoints())
    cutPoly.SetPolys(cutStrips.GetOutput().GetLines())
    return cutPoly

def save_2d_data_vtk(data, filename):
    writer = vtk.vtkPolyDataWriter()
    writer.SetFileName(filename)
    writer.SetInputData(data)
    writer.SetFileVersion(3)
    writer.SetFileTypeToASCII()
    writer.Write()
    
def write_stl(polydata, filename):
    writer = vtk.vtkSTLWriter()
    writer.SetInputData(polydata)
    writer.SetFileTypeToASCII()
    writer.SetFileName(filename)
    writer.Write()
    
def main(file, pos, normal):
    path = '../model/' +  file;
    print('Reading from file: ',path)
    data = read_3d_data(path)
    print('Creating vtk plane...')
    plane = create_vtk_plane(pos, normal)
    print('Cutting data...')
    cut_data = cut_by_plane(plane, data)
    print(f"Got {cut_data.GetNumberOfPoints()} points after cutting")
    output_filename = f"{file.split('.')[0]}_cut.stl"
    output_path = '../model/' +  output_filename;
    print('Saving cut data: ' + output_path)
    write_stl(cut_data, output_path)
    print('Finished')
    return True

if __name__ == "__main__":
    # 使用传入参数进行切割操作
    import sys
    file = sys.argv[1]
    pos = json.loads(sys.argv[2])
    print('pos',pos)
    normal = json.loads(sys.argv[3])
    print('normal',normal)
    main(file, pos, normal)