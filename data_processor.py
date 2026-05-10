import pandas as pd
import numpy as np
import json

def process_sales_dashboard_data(prev_month_path, curr_month_path, manual_mapping_path, base_marketer_path):
    """
    프론트엔드 대시보드에 전달할 데이터를 가공하는 메인 함수입니다.
    전월/당월 매출, 수동 매칭 데이터, 기존 마케터 데이터를 병합 및 가공하여 Dictionary 형태로 반환합니다.
    """
    
    def read_file_robust(file_obj):
        if isinstance(file_obj, str):
            if file_obj.endswith('.csv'):
                try:
                    return pd.read_csv(file_obj, header=None, encoding='utf-8')
                except UnicodeDecodeError:
                    return pd.read_csv(file_obj, header=None, encoding='cp949')
            else:
                return pd.read_excel(file_obj, header=None, engine='openpyxl')
        
        try:
            return pd.read_excel(file_obj, header=None, engine='openpyxl')
        except Exception:
            file_obj.seek(0)
            try:
                return pd.read_csv(file_obj, header=None, encoding='utf-8')
            except UnicodeDecodeError:
                file_obj.seek(0)
                return pd.read_csv(file_obj, header=None, encoding='cp949')

    # ---------------------------------------------------------
    # [Step 1] 베이스 마케터 데이터 로드 (1차 매칭용)
    # ---------------------------------------------------------
    # 기존마케터데이터.csv 로드
    base_df = pd.read_csv(base_marketer_path)
    # 병합 시 타입 불일치 방지를 위해 광고계정 ID를 문자열로 통일
    base_df['광고계정ID'] = base_df['광고계정ID'].astype(str)

    # ---------------------------------------------------------
    # [Step 2] 수동 매칭 데이터 로드 및 전처리 (2차 매칭용)
    # ---------------------------------------------------------
    # 엑셀/CSV 등 포맷이 명확하지 않을 수 있으므로 header=None으로 로드
    manual_df = read_file_robust(manual_mapping_path)
    
    # A열(인덱스 0)은 광고계정 ID, L열(인덱스 11)은 팀 및 마케터 정보 추출
    manual_df = manual_df.iloc[:, [0, 11]]
    manual_df.columns = ['광고계정ID', '팀_마케터']
    manual_df['광고계정ID'] = manual_df['광고계정ID'].astype(str)
    
    # '팀'과 '마케터'를 공백 기준으로 분리하는 내부 함수
    def split_team_marketer(val):
        if pd.isna(val):
            return pd.Series([None, None])
        val_str = str(val).strip()
        if ' ' in val_str:
            # 첫 번째 공백을 기준으로 1번만 분리 (ex: "A팀 홍길동")
            parts = val_str.split(' ', 1)
            return pd.Series([parts[0], parts[1]])
        else:
            # 공백이 없는 단일 단어라면 양쪽에 동일하게 복사 (ex: "B팀")
            return pd.Series([val_str, val_str])
            
    # apply 함수를 이용해 '팀'과 '마케터' 컬럼을 새로 생성
    manual_df[['팀', '마케터']] = manual_df['팀_마케터'].apply(split_team_marketer)
    manual_df = manual_df.drop(columns=['팀_마케터']) # 기존 임시 컬럼 삭제

    # ---------------------------------------------------------
    # [Step 3] 매출 데이터 로드 및 전처리 공통 함수 정의
    # ---------------------------------------------------------
    def load_and_preprocess_sales(file_path):
        df = read_file_robust(file_path)
        
        # D열(인덱스 3)은 광고계정 ID, AU열(인덱스 46)은 매출액
        df = df.iloc[:, [3, 46]]
        df.columns = ['광고계정ID', '매출액']
        
        # 광고계정 ID 문자열 변환
        df['광고계정ID'] = df['광고계정ID'].astype(str)
        
        # 매출액 데이터에서 문자, 결측치를 0으로 변환 (에러 강제 처리)
        df['매출액'] = pd.to_numeric(df['매출액'], errors='coerce').fillna(0)
        
        return df

    # 전월/당월 매출 파일 각각 로드 및 전처리 수행
    prev_sales_df = load_and_preprocess_sales(prev_month_path)
    curr_sales_df = load_and_preprocess_sales(curr_month_path)

    # ---------------------------------------------------------
    # [Step 4] 팀 & 마케터 매칭 수행 (1차 & 2차)
    # ---------------------------------------------------------
    def apply_matching_logic(sales_df):
        # 1차 매칭: 베이스 마케터 데이터 기준으로 Left Join
        merged_df = pd.merge(sales_df, base_df, on='광고계정ID', how='left')
        
        # 2차 매칭: 수동 매칭 데이터 기준으로 Left Join
        # '_수동'이라는 접미사를 붙여 컬럼 이름 충돌을 방지
        merged_df = pd.merge(merged_df, manual_df, on='광고계정ID', how='left', suffixes=('', '_수동'))
        
        # 1차 매칭이 실패하여(NaN) 값이 비어있는 경우, 수동 매칭 값으로 덮어씀
        merged_df['팀'] = merged_df['팀'].fillna(merged_df['팀_수동'])
        merged_df['마케터'] = merged_df['마케터'].fillna(merged_df['마케터_수동'])
        
        # 1, 2차 매칭 후에도 값이 없다면 '미분류'로 마킹
        merged_df['팀'] = merged_df['팀'].fillna('미분류')
        merged_df['마케터'] = merged_df['마케터'].fillna('미분류')
        
        # 병합에 사용된 불필요한 '_수동' 임시 컬럼들 정리
        merged_df = merged_df.drop(columns=['팀_수동', '마케터_수동'])
        
        return merged_df

    # 당월/전월 데이터에 매칭 로직 동일하게 적용
    prev_final_df = apply_matching_logic(prev_sales_df)
    curr_final_df = apply_matching_logic(curr_sales_df)

    # ---------------------------------------------------------
    # [Step 5] 대시보드 Category별 데이터 집계
    # ---------------------------------------------------------
    
    # [Category 1] 구간별 계정수 집계 함수
    def get_revenue_tiers(df):
        # 매출액 구간(bins) 설정
        bins = [-np.inf, 1, 10000, 20000, 30000, 40000, 50000, np.inf]
        labels = [
            '1원 미만 (0원 처리)',
            '1원 이상 ~ 10,000원 미만',
            '10,000원 이상 ~ 20,000원 미만',
            '20,000원 이상 ~ 30,000원 미만',
            '30,000원 이상 ~ 40,000원 미만',
            '40,000원 이상 ~ 50,000원 미만',
            '50,000원 이상'
        ]
        
        # pd.cut을 사용하여 데이터들을 구간별 라벨로 매핑 (right=False 로 미만 처리)
        df['매출구간'] = pd.cut(df['매출액'], bins=bins, labels=labels, right=False)
        tier_counts = df['매출구간'].value_counts().to_dict()
        
        # 프론트엔드로 보낼 형태에 맞게 딕셔너리 재구성
        return {
            '50,000원 이상': int(tier_counts.get('50,000원 이상', 0)),
            '40,000원 이상 ~ 50,000원 미만': int(tier_counts.get('40,000원 이상 ~ 50,000원 미만', 0)),
            '30,000원 이상 ~ 40,000원 미만': int(tier_counts.get('30,000원 이상 ~ 40,000원 미만', 0)),
            '20,000원 이상 ~ 30,000원 미만': int(tier_counts.get('20,000원 이상 ~ 30,000원 미만', 0)),
            '10,000원 이상 ~ 20,000원 미만': int(tier_counts.get('10,000원 이상 ~ 20,000원 미만', 0)),
            '1원 이상 ~ 10,000원 미만': int(tier_counts.get('1원 이상 ~ 10,000원 미만', 0))
        }

    # [Category 2 & 3] 5만원 이상 필터링 및 집계 함수
    def get_over_50k_groups(df):
        # 5만원 이상 데이터만 추출
        filtered_df = df[df['매출액'] >= 50000]
        
        # Category 2: 팀별 계정 수 집계
        team_counts = filtered_df.groupby('팀').size().to_dict()
        
        # Category 3: 팀 & 마케터별 계정 수 집계
        # Pandas의 groupby 결과 키는 (팀, 마케터) 형태의 튜플이 되므로 JSON에 맞게 문자열 변환
        tm_counts_raw = filtered_df.groupby(['팀', '마케터']).size().to_dict()
        team_marketer_counts = {f"{k[0]} - {k[1]}": v for k, v in tm_counts_raw.items()}
        
        return team_counts, team_marketer_counts

    # 집계 함수 실행
    prev_cat1 = get_revenue_tiers(prev_final_df)
    curr_cat1 = get_revenue_tiers(curr_final_df)
    
    prev_cat2, prev_cat3 = get_over_50k_groups(prev_final_df)
    curr_cat2, curr_cat3 = get_over_50k_groups(curr_final_df)

    # ---------------------------------------------------------
    # [Step 6] 최종 프론트엔드 전송용 Dictionary 구성
    # ---------------------------------------------------------
    dashboard_data = {
        'category_1_revenue_tiers': {
            'previous_month': prev_cat1,
            'current_month': curr_cat1
        },
        'category_2_team_over_50k': {
            'previous_month': prev_cat2,
            'current_month': curr_cat2
        },
        'category_3_team_marketer_over_50k': {
            'previous_month': prev_cat3,
            'current_month': curr_cat3
        }
    }
    
    return dashboard_data

if __name__ == "__main__":
    pass
