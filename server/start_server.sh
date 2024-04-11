#!/bin/bash

# 创建并激活虚拟环境
echo "Creating virtual environment..."
python3 -m venv env

echo "Activating virtual environment..."
source env/bin/activate

# 检查并安装依赖
echo "Checking and installing dependencies..."

python3 -m pip install --upgrade pip

requirements=("flask" "flask-cors" "jinja2" "werkzeug" "vtk")

for req in ${requirements[@]}
do
    if python3 -c "import pkg_resources; pkg_resources.get_distribution('${req}')"; then
        echo "'${req}' is installed."
    else
        echo "'${req}' is NOT installed. Installing..."
        pip install ${req} || { echo "Failed to install '${req}'. Exiting..."; exit 1; }
    fi
done

# 启动 server.py
echo "Starting server.py..."

python3 server.py
