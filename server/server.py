from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import subprocess
import json

app = Flask(__name__)
CORS(app)  # 配置 CORS，允许来自 localhost 的前端请求

def run_cutter(file, pos, normal):
   # 调用 cutter.py
    print('cut_in')
    cutter_script_path = os.path.join(os.path.dirname(__file__), 'cutter.py')
    result = subprocess.run(['python', cutter_script_path, file, str(pos), str(normal)], stdout=subprocess.PIPE, stderr=subprocess.PIPE)  # 捕获 stdout 和 stderr
    print('cut_out')
    
    print(result.stdout.decode()) 
    print(result.stderr.decode())  
    
    if result.returncode == 0:
        return True
    else:
        return result.stderr.decode()

@app.route('/data', methods=['POST'])
def handle_data():
    # 检查是否有 JSON 数据在请求中
    if request.is_json:
        data = request.get_json()
        print('Received: ', data)

        pos = [data['pos']['x'], data['pos']['y'], data['pos']['z']]
        normal = [data['normal']['x'], data['normal']['y'], data['normal']['z']]
        file = data['file']

        # run cutter
        cut_result = run_cutter(file, pos, normal)

        print('cut_result', cut_result)
        # send result to frontend
        if cut_result == True:
            return jsonify(message='Cut successful'), 200
        else:
            return jsonify(message=f'Cut failed: {cut_result}'), 400
    else:
        return jsonify(message='No JSON received'), 400

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)