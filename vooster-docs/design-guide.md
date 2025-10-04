# GOGOCAE_R1 Design Guide

## 1. 전체적인 무드 (Overall Mood)

GOGOCAE_R1은 CAE 해석 업무의 전문성과 신뢰성을 강조하는 **신뢰할 수 있고 전문적인(Trustworthy and Professional)** 무드를 추구합니다. B2B SaaS 환경에서 엔지니어들이 정확하고 효율적으로 업무를 처리할 수 있도록 차분하고 정돈된 시각적 경험을 제공합니다.

핵심 디자인 철학:
- **명확성**: 복잡한 해석 업무 플로우를 직관적으로 이해할 수 있는 인터페이스
- **신뢰성**: 전문적이고 안정감 있는 컬러와 타이포그래피로 업무 도구로서의 신뢰감 구축
- **효율성**: 최소한의 클릭으로 핵심 작업을 완료할 수 있는 사용자 중심 설계

## 2. 참조 서비스 (Reference Service)

- **이름**: Vooster.ai
- **설명**: AI 기반 비즈니스 자동화 플랫폼
- **디자인 무드**: 깔끔한 화이트 스페이스 활용과 선명한 블루 포인트 컬러로 전문성과 신뢰감을 동시에 표현
- **Primary Color**: #3366FF
- **Secondary Color**: #F5F7FA

## 3. 색상 & 그라데이션 (Color & Gradient)

### 컬러 팔레트
- **Primary Color**: #1846FF (Royal Blue)
- **Secondary Color**: #0B1F4B (Deep Navy)
- **Accent Color**: #20C997 (Teal)
- **Background**: #F5F7FA (Light Gray)
- **Text Primary**: #1F2937 (Dark Gray)
- **Text Secondary**: #6B7280 (Medium Gray)

### 무드
- **톤**: Cool, Low-Medium Saturation
- **특성**: 차분하고 전문적인 느낌으로 장시간 작업에 적합한 눈의 피로도 최소화

### 컬러 사용법
중요도별 UI 요소 컬러 적용:
1. **최고 우선순위**: Primary Blue (#1846FF) - 주요 CTA 버튼, 활성 상태
2. **높은 우선순위**: Accent Teal (#20C997) - 성공 상태, 완료 배지
3. **중간 우선순위**: Secondary Navy (#0B1F4B) - 헤더, 사이드바 배경
4. **낮은 우선순위**: Background Gray (#F5F7FA) - 카드 배경, 구분선

## 4. 타이포그래피 & 폰트 (Typography & Font)

### 폰트 시스템
- **기본 폰트**: Inter (Google Fonts)
- **대체 폰트**: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif

### 타이포그래피 계층
- **Heading 1**: Inter SemiBold, 32px, Line Height 1.2
- **Heading 2**: Inter SemiBold, 24px, Line Height 1.3
- **Heading 3**: Inter SemiBold, 20px, Line Height 1.4
- **Body Large**: Inter Regular, 16px, Line Height 1.5
- **Body**: Inter Regular, 14px, Line Height 1.5
- **Caption**: Inter Regular, 12px, Line Height 1.4, Color #6B7280

### 글자 간격
- **Letter Spacing**: -0.01em (Heading), 0em (Body)
- **Paragraph Spacing**: 16px (Body), 12px (Caption)

## 5. 레이아웃 & 구조 (Layout & Structure)

### 그리드 시스템
- **컨테이너 최대 너비**: 1440px
- **사이드바 너비**: 240px (고정)
- **메인 콘텐츠 영역**: 1200px (최대)
- **그리드**: 12컬럼 시스템
- **거터**: 24px
- **마진**: 좌우 24px (모바일), 40px (데스크탑)

### 레이아웃 원칙
- **사이드바 네비게이션**: 좌측 고정형으로 모든 주요 기능에 빠른 접근 제공
- **카드 기반 레이아웃**: 정보를 논리적 단위로 그룹화하여 가독성 향상
- **화이트 스페이스**: 충분한 여백으로 정보 계층 구조 명확화

### 반응형 브레이크포인트
- **Desktop**: 1280px+
- **Tablet**: 768px - 1279px
- **Mobile**: 320px - 767px

## 6. 비주얼 스타일 (Visual Style)

### 아이콘 스타일
- **타입**: Outline 스타일, 1.5px 스트로크
- **배경**: 원형 배경 없음
- **라이브러리**: Phosphor Icons 또는 Lucide
- **크기**: 16px (Small), 20px (Medium), 24px (Large)

### 이미지 & 일러스트레이션
- **스타일**: 미니멀하고 기하학적인 형태
- **컬러**: 브랜드 컬러 팔레트 내에서 사용
- **용도**: 온보딩, 빈 상태(Empty State), 에러 페이지

### 그림자 & 효과
- **카드 그림자**: 0 1px 3px rgba(0,0,0,0.08)
- **호버 효과**: 0 4px 12px rgba(0,0,0,0.12)
- **포커스 링**: #20C997 2px 아웃라인

## 7. UX 가이드 (UX Guide)

### 타겟 사용자 대응 전략: Both (전문가 + 초보자)

#### 전문가 사용자를 위한 UX
- **효율성 중심**: 핵심 기능을 단축키와 우클릭 메뉴로 빠르게 접근
- **정보 밀도**: 대시보드에서 'My Tasks' 중심의 집중적 정보 제공
- **배치 작업**: 다중 선택으로 상태 일괄 변경 기능
- **키보드 네비게이션**: 전체 인터페이스에서 키보드만으로 조작 가능

#### 초보자 사용자를 위한 UX
- **온보딩**: 첫 로그인 시 3-4단계 인터랙티브 투어 제공
- **가이드**: '새 요청 만들기' 플로팅 버튼과 양식 내 힌트 텍스트
- **도움말**: 도움말 센터 링크 및 튜토리얼 비디오 팝업
- **피드백**: 명확한 성공/오류 메시지와 다음 단계 안내

#### 공통 UX 원칙
- **일관성**: 모든 페이지에서 동일한 인터랙션 패턴 유지
- **예측 가능성**: 사용자 행동에 대한 즉각적이고 명확한 피드백
- **접근성**: WCAG AA 기준 준수로 모든 사용자가 이용 가능

## 8. UI 컴포넌트 가이드 (UI Component Guide)

### 버튼 (Buttons)
#### Primary Button
- **배경**: #1846FF
- **텍스트**: White
- **Border Radius**: 6px
- **Padding**: 12px 24px
- **Font**: Inter Medium, 14px
- **Hover**: 투명도 90%

#### Secondary Button
- **배경**: White
- **텍스트**: #1846FF
- **테두리**: 1px solid #1846FF
- **Border Radius**: 6px
- **Padding**: 12px 24px
- **Hover**: 배경 #F8FAFC

#### Ghost Button
- **배경**: Transparent
- **텍스트**: #6B7280
- **Hover**: 배경 #F1F5F9

### 입력 필드 (Input Fields)
- **배경**: White
- **테두리**: 1px solid #D1D5DB
- **Border Radius**: 6px
- **Padding**: 12px 16px
- **Font**: Inter Regular, 14px
- **Focus**: 테두리 #1846FF, 그림자 0 0 0 3px rgba(24,70,255,0.1)
- **Error**: 테두리 #EF4444

### 카드 (Cards)
- **배경**: White
- **Border Radius**: 8px
- **그림자**: 0 1px 3px rgba(0,0,0,0.08)
- **Padding**: 24px
- **Hover**: 그림자 0 4px 12px rgba(0,0,0,0.12)

### 네비게이션 바 (Navigation Bar)
#### 사이드바
- **너비**: 240px
- **배경**: #0B1F4B
- **텍스트**: White
- **활성 항목**: 배경 rgba(255,255,255,0.1)
- **아이콘**: 20px, White
- **패딩**: 16px

#### 상단 헤더
- **높이**: 64px
- **배경**: White
- **그림자**: 0 1px 3px rgba(0,0,0,0.08)
- **로고**: 좌측 정렬
- **사용자 메뉴**: 우측 정렬

### 상태 배지 (Status Badges)
#### 미지정 (Unassigned)
- **배경**: #FEF3C7
- **텍스트**: #92400E
- **Border Radius**: 16px

#### 진행중 (In Progress)
- **배경**: #DBEAFE
- **텍스트**: #1E40AF
- **Border Radius**: 16px

#### 완료 (Completed)
- **배경**: #D1FAE5
- **텍스트**: #065F46
- **Border Radius**: 16px

### 모달 & 팝업 (Modals & Popups)
- **오버레이**: rgba(0,0,0,0.5)
- **배경**: White
- **Border Radius**: 12px
- **최대 너비**: 600px
- **그림자**: 0 20px 25px rgba(0,0,0,0.1)
- **애니메이션**: Fade + Scale 200ms ease-out

### 테이블 (Tables)
- **헤더 배경**: #F9FAFB
- **테두리**: 1px solid #E5E7EB
- **행 호버**: #F9FAFB
- **셀 패딩**: 12px 16px
- **폰트**: Inter Regular, 14px

### 로딩 & 피드백 (Loading & Feedback)
#### 로딩 스피너
- **색상**: #1846FF
- **크기**: 24px (기본), 16px (작은 버튼 내)
- **애니메이션**: 회전 1초 linear infinite

#### 토스트 메시지
- **성공**: 배경 #10B981, 아이콘 체크마크
- **오류**: 배경 #EF4444, 아이콘 X
- **경고**: 배경 #F59E0B, 아이콘 느낌표
- **위치**: 우상단 고정
- **지속 시간**: 4초 자동 사라짐

### 접근성 (Accessibility)
- **컬러 대비**: WCAG AA 기준 4.5:1 이상
- **포커스 표시**: #20C997 2px 아웃라인
- **키보드 네비게이션**: Tab 순서 논리적 구성
- **스크린 리더**: 모든 인터랙티브 요소에 적절한 라벨 제공

### 모션 & 애니메이션 (Motion & Animation)
- **상태 변경**: Fade + Slide 150ms ease-out
- **호버 효과**: 100ms ease-out으로 투명도 변화
- **페이지 전환**: 200ms ease-out으로 슬라이드 효과
- **로딩 애니메이션**: 부드러운 회전과 진행률 표시