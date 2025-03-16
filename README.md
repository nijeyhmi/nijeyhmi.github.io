# 개인 블로그 'HYELOG'

## 🔧 프로젝트 개요

- **프로젝트 이름**: 개인 개발 블로그
- **기술 스택**: React18, Tailwind CSS, GitHub Pages
- **목적**: 개발 관련 글을 Markdown 형식으로 작성하고 GitHub Pages를 통해 배포하는 블로그

---

## ✅ 주요 기능 리스트

### 1. **Markdown 포스트 작성 및 렌더링**

**설명**: 블로그 포스트를 Markdown 형식으로 작성하고, 이를 HTML로 렌더링합니다.

#### 구현 세부사항:

- 포스트 목록 페이지 및 상세 페이지 구현
- 코드 블럭 하이라이트 기능 지원
- 이미지, 링크 등 Markdown 요소 지원

#### 구현 방법:

- 라이브러리: `react-markdown`, `remark-gfm`, `react-syntax-highlighter`

### 2. **페이지 배포**

**설명**: 블로그를 GitHub Pages를 통해 배포합니다.

#### 구현 세부사항:

- GitHub Actions 설정 파일 작성
- `gh-pages` 브랜치에 자동 배포 설정

#### 구현 방법:

- 라이브러리: `gh-pages`
- GitHub Actions 설정

## 🎨 UI 구성 요소

### 📋 **사이드바 (Sidebar)**

- 포트폴리오 메뉴
- 카테고리 리스트 메뉴

### 🖋️ **메인 페이지 (Main Page)**

- 블로그 포스트 목록
- 검색창
- 다크 모드 토글 버튼

### 🖋️ **포스트 목록 페이지 (Post List Page)**

- 제목
- 작성일자
- 카테고리
- 페이지네이션
- 필터링

### 📄 **포스트 상세 페이지 (Post Detail Page)**

- 제목
- 작성일자
- 카테고리
- 본문 (Markdown 렌더링)
- 포스트 이미지 (기본 이미지 또는 사용자가 추가한 이미지)

### 📄 **포트폴리오 페이지 (Portfolio Page)**

- 본문 (Markdown 렌더링)

---

## 📦 **사용 라이브러리 목록**

| 기능          | 라이브러리                 |
| ------------- | -------------------------- |
| 스타일링      | Tailwind CSS               |
| 페이지 라우팅 | React Router               |
| Markdown 파싱 | react-markdown, remark-gfm |
| 아이콘        | react-icons                |
| 배포          | gh-pages                   |

---

## 🔍 **향후 확장 기능**

1. 댓글 기능 추가 (Disqus 또는 Firebase)
2. 검색 기능
3. 다크 모드
4. 사이드바/태그 검색 기능
