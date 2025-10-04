import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Users, Calendar, FileText, BarChart3, ArrowRight } from 'lucide-react';

// SSG를 위한 메타데이터
export const metadata = {
  title: '고고CAE - CAE 해석 업무를 한눈에',
  description: '설계자와 해석자가 CAE 해석 요청·진행·보고를 한 곳에서 관리할 수 있는 클라우드 SaaS 웹 서비스',
  keywords: 'CAE, 해석, 설계, 엔지니어링, 클라우드, SaaS',
  openGraph: {
    title: '고고CAE - CAE 해석 업무를 한눈에',
    description: '설계자와 해석자가 CAE 해석 요청·진행·보고를 한 곳에서 관리할 수 있는 클라우드 SaaS 웹 서비스',
    type: 'website',
  },
};

export default function Home() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">고고CAE</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" asChild>
                <Link href="/auth/login">로그인</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/signup">회원가입</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            CAE 해석 업무를
            <br />
            <span className="text-blue-600">한눈에</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            설계자와 해석자가 CAE 해석 요청·진행·보고를 한 곳에서 관리할 수 있는 
            클라우드 SaaS 웹 서비스입니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/auth/signup">
                지금 시작하기
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/auth/login">로그인</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              주요 기능
            </h2>
            <p className="text-lg text-gray-600">
              효율적인 CAE 업무 관리를 위한 핵심 기능들을 만나보세요
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>해석 요청</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  요청명, 차종, 날짜, 파일 첨부를 통한 체계적인 해석 요청 관리
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>담당자 지정</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  담당자 지정 및 업무 상태 변경으로 효율적인 작업 분배
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>캘린더·칸반</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  캘린더 뷰와 칸반 보드를 통한 직관적인 업무 상태 관리
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle>파일 관리</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  모델 업로드, 보고서 업·다운로드를 통한 파일 관리
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              사용 흐름
            </h2>
            <p className="text-lg text-gray-600">
              간단한 3단계로 CAE 해석 업무를 효율적으로 관리하세요
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">요청</h3>
              <p className="text-gray-600">
                설계자가 해석 요청을 생성하고 필요한 파일을 업로드합니다.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">진행</h3>
              <p className="text-gray-600">
                해석자가 담당을 지정받고 작업을 진행하며 상태를 업데이트합니다.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">완료</h3>
              <p className="text-gray-600">
                보고서를 업로드하고 설계자가 결과를 다운로드합니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Screenshots Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              실제 화면 미리보기
            </h2>
            <p className="text-lg text-gray-600">
              실제 사용하는 화면들을 미리 확인해보세요
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 대시보드 미리보기 */}
            <div className="text-center">
              <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
                <div className="aspect-video bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900">대시보드</h3>
                    <p className="text-sm text-gray-600">통계 및 현황 한눈에 파악</p>
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">대시보드</h3>
              <p className="text-gray-600">
                주요 통계 카드와 현황 피드로 업무 현황을 실시간으로 확인할 수 있습니다.
              </p>
            </div>

            {/* 칸반 보드 미리보기 */}
            <div className="text-center">
              <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
                <div className="aspect-video bg-gradient-to-br from-green-50 to-green-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900">칸반 보드</h3>
                    <p className="text-sm text-gray-600">드래그 앤 드롭으로 상태 관리</p>
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">칸반 보드</h3>
              <p className="text-gray-600">
                직관적인 칸반 보드로 요청 상태를 드래그 앤 드롭으로 쉽게 관리할 수 있습니다.
              </p>
            </div>

            {/* 캘린더 미리보기 */}
            <div className="text-center">
              <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
                <div className="aspect-video bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Calendar className="h-16 w-16 text-purple-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900">캘린더</h3>
                    <p className="text-sm text-gray-600">일정 및 마감일 관리</p>
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">캘린더 뷰</h3>
              <p className="text-gray-600">
                캘린더 형태로 요청 일정과 마감일을 한눈에 확인하고 관리할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            지금 시작하세요
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            CAE 해석 업무의 효율성을 높이고 싶다면 지금 바로 시작해보세요.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/auth/signup">
                무료로 시작하기
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h3 className="text-2xl font-bold text-white mb-4">고고CAE</h3>
          <p className="text-gray-400 mb-6">
            CAE 해석 업무를 한눈에 관리하는 클라우드 서비스
          </p>
          <div className="flex justify-center space-x-6">
            <Button variant="ghost" className="text-gray-400 hover:text-white">
              <Link href="/auth/login">로그인</Link>
            </Button>
            <Button variant="ghost" className="text-gray-400 hover:text-white">
              <Link href="/auth/signup">회원가입</Link>
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}

