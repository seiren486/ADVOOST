from flask import Flask, request, jsonify
import os
import sys

# 프로젝트 루트 경로를 sys.path에 추가하여 data_processor.py를 임포트할 수 있게 함
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from data_processor import process_sales_dashboard_data

app = Flask(__name__)

@app.route('/api/index', methods=['POST'])
def process_data():
    try:
        # 프론트엔드에서 폼 데이터로 보낸 파일 추출
        if 'previousMonth' not in request.files or 'currentMonth' not in request.files or 'teamNames' not in request.files:
            return jsonify({'error': '필수 파일이 누락되었습니다.'}), 400

        prev_month = request.files['previousMonth']
        curr_month = request.files['currentMonth']
        manual_mapping = request.files['teamNames']

        # 서버에 고정된 기존마케터데이터.csv 또는 .txt 경로
        base_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data')
        base_marketer_path = os.path.join(base_dir, '기존마케터데이터.csv')
        base_marketer_path_txt = os.path.join(base_dir, '기존마케터데이터.txt')

        if os.path.exists(base_marketer_path_txt):
            base_marketer_path = base_marketer_path_txt
        elif not os.path.exists(base_marketer_path):
            return jsonify({'error': '서버에 기존마케터데이터.csv 또는 .txt 파일이 존재하지 않습니다. data/ 폴더에 추가해주세요.'}), 500

        # 파일 객체를 그대로 파이썬 함수로 전달
        # data_processor.py는 BytesIO와 같은 file-like 객체를 읽을 수 있어야 함
        result = process_sales_dashboard_data(
            prev_month_path=prev_month.stream,
            curr_month_path=curr_month.stream,
            manual_mapping_path=manual_mapping.stream,
            base_marketer_path=base_marketer_path
        )

        return jsonify(result), 200

    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

# 로컬 테스트용
if __name__ == '__main__':
    app.run(debug=True, port=5328)
