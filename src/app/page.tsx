import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FileText, Users, Calendar, BarChart3, ArrowRight, CheckCircle } from 'lucide-react';

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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center transform group-hover:scale-110 transition-transform duration-200">
                <span className="text-white font-bold text-xs">GO</span>
              </div>
              <span className="text-lg font-bold text-gray-900">고고CAE</span>
            </Link>

            <nav className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
                주요기능
              </Link>
              <Link href="#solution" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
                솔루션
              </Link>
              <Link href="#workflow" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
                사용흐름
              </Link>
            </nav>

            <div className="flex items-center space-x-3">
              <Button variant="ghost" asChild className="text-sm font-medium">
                <Link href="/auth/login">로그인</Link>
              </Button>
              <Button asChild className="bg-blue-600 hover:bg-blue-700 text-sm font-medium">
                <Link href="/auth/signup">회원가입</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 pt-20 pb-32">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl animate-pulse delay-700"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-300/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left content */}
            <div className="text-white space-y-8 animate-fade-in-up">
              <div className="inline-block">
                <p className="text-sm font-medium text-blue-200 mb-2">설계자와 해석자를 위한 스마트한 협업 플랫폼</p>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                CAE 해석 업무를
                <br />
                <span className="text-blue-200">한눈에</span>
              </h1>
              <p className="text-lg text-blue-100 leading-relaxed max-w-xl">
                설계자와 해석자가 CAE 해석 요청·진행·보고를 한 곳에서 관리할 수 있는
                클라우드 기반 통합 협업 플랫폼입니다.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-gray-100 font-semibold group">
                  <Link href="/auth/signup">
                    시작하기
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 font-semibold">
                  <Link href="#features">더 알아보기</Link>
                </Button>
              </div>
            </div>

            {/* Right illustration - Isometric 3D */}
            <div className="relative lg:h-[500px] flex items-center justify-center animate-fade-in-right">
              <div className="relative w-full max-w-lg">
                {/* Main platform */}
                <div className="relative" style={{ transform: 'perspective(1200px) rotateY(-15deg) rotateX(5deg)', transformStyle: 'preserve-3d' }}>
                  {/* Floating cards */}
                  <div className="absolute -top-8 -left-8 w-40 h-32 bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-4 animate-float" style={{ animationDelay: '0s' }}>
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="h-2 bg-gray-200 rounded w-full mb-1"></div>
                        <div className="h-2 bg-gray-100 rounded w-2/3"></div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <div className="flex-1 h-1.5 bg-blue-200 rounded"></div>
                      <div className="flex-1 h-1.5 bg-green-200 rounded"></div>
                      <div className="flex-1 h-1.5 bg-purple-200 rounded"></div>
                    </div>
                  </div>

                  {/* Center main card */}
                  <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 relative z-10">
                    <div className="space-y-6">
                      <div className="w-full h-48 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-grid-white/10 bg-[size:20px_20px]"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                            <BarChart3 className="h-12 w-12 text-white" />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-100 rounded w-full"></div>
                        <div className="h-3 bg-gray-100 rounded w-5/6"></div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="h-16 bg-blue-50 rounded-lg"></div>
                        <div className="h-16 bg-green-50 rounded-lg"></div>
                        <div className="h-16 bg-purple-50 rounded-lg"></div>
                      </div>
                    </div>
                  </div>

                  {/* Small floating card - top right */}
                  <div className="absolute -top-4 -right-12 w-36 h-28 bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-4 animate-float" style={{ animationDelay: '1s' }}>
                    <Calendar className="h-8 w-8 text-purple-600 mb-2" />
                    <div className="space-y-1.5">
                      <div className="h-2 bg-gray-200 rounded w-full"></div>
                      <div className="h-2 bg-gray-100 rounded w-3/4"></div>
                    </div>
                  </div>

                  {/* Small floating card - bottom right */}
                  <div className="absolute -bottom-8 -right-8 w-40 h-32 bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-4 animate-float" style={{ animationDelay: '0.5s' }}>
                    <Users className="h-8 w-8 text-green-600 mb-2" />
                    <div className="space-y-1.5">
                      <div className="h-2 bg-gray-200 rounded w-full"></div>
                      <div className="h-2 bg-gray-100 rounded w-4/5"></div>
                      <div className="h-2 bg-gray-100 rounded w-2/3"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Progress bar indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center space-x-2">
            <div className="w-12 h-1 bg-white rounded-full"></div>
            <div className="w-8 h-1 bg-white/30 rounded-full"></div>
            <div className="w-8 h-1 bg-white/30 rounded-full"></div>
          </div>
        </div>
      </section>

      {/* Introduction Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            CAE 해석 업무의 새로운 기준을 제시합니다.
          </h2>
          <p className="text-base md:text-lg text-gray-600 leading-relaxed">
            복잡한 CAE 해석 프로세스를 단순하게, 흩어진 업무를 하나로.<br />
            고고CAE는 설계자와 해석자 간의 원활한 소통과 협업을 지원하여<br />
            업무 효율을 극대화하고 프로젝트 완성도를 높입니다.
          </p>
        </div>
      </section>

      {/* Features Section - 3 columns */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group relative">
              <Card className="h-full p-8 border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-gradient-to-br from-blue-50 to-white">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
                    <FileText className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">해석 요청 관리</h3>
                <p className="text-gray-600 leading-relaxed">
                  요청명, 차종, 날짜, 모델 파일까지 모든 정보를 한 번에 등록하고 체계적으로 관리할 수 있습니다.
                </p>
              </Card>
            </div>

            {/* Feature 2 */}
            <div className="group relative">
              <Card className="h-full p-8 border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-gradient-to-br from-indigo-50 to-white">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">스마트 업무 배분</h3>
                <p className="text-gray-600 leading-relaxed">
                  해석자 지정부터 상태 변경까지, 드래그 앤 드롭으로 직관적인 업무 분배를 실현합니다.
                </p>
              </Card>
            </div>

            {/* Feature 3 */}
            <div className="group relative">
              <Card className="h-full p-8 border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-gradient-to-br from-purple-50 to-white">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
                    <Calendar className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">시각화된 일정 관리</h3>
                <p className="text-gray-600 leading-relaxed">
                  캘린더와 칸반 보드로 전체 업무 현황을 한눈에 파악하고 일정을 효율적으로 관리하세요.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section id="solution" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              고고CAE가 제공하는<br className="hidden md:block" />
              강력한 기능들을 만나보세요
            </h2>
          </div>

          {/* Solutions grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
            {[
              { title: '대시보드', subtitle: '실시간 업무 현황 통계', color: 'from-blue-600 to-blue-700' },
              { title: '칸반 보드', subtitle: '드래그 앤 드롭 업무 관리', color: 'from-indigo-600 to-indigo-700' },
              { title: '캘린더', subtitle: '일정 기반 요청 관리', color: 'from-purple-600 to-purple-700' },
              { title: '파일 관리', subtitle: '모델 및 보고서 업로드', color: 'from-blue-600 to-indigo-600' },
              { title: '요청 목록', subtitle: '전체 요청 조회 및 검색', color: 'from-indigo-600 to-purple-600' },
              { title: '권한 관리', subtitle: '설계자/해석자 역할 구분', color: 'from-purple-600 to-pink-600' },
            ].map((solution, index) => (
              <Card
                key={index}
                className="group relative overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 border-0 hover:scale-105 transition-all duration-300 cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                     style={{ backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))` }}></div>
                <div className="relative p-8 h-40 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-2">{solution.title}</h3>
                    <p className="text-sm text-gray-300">{solution.subtitle}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-2 transition-all duration-300" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section id="workflow" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">간단한 3단계 워크플로우</h2>
            <p className="text-lg text-gray-600">요청부터 완료까지, 모든 과정을 투명하게 관리하세요</p>
          </div>

          {/* Carousel-style workflow */}
          <div className="relative">
            <div className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-hide">
              {[
                {
                  category: 'STEP 01',
                  title: '해석 요청 생성',
                  description: '설계자가 필요한 해석 작업을 요청하고 모델 파일을 업로드합니다. 차종, 날짜, 우선순위 등 모든 정보를 한 번에 입력할 수 있습니다.',
                  icon: <FileText className="h-12 w-12" />,
                  color: 'from-blue-500 to-blue-600'
                },
                {
                  category: 'STEP 02',
                  title: '담당자 지정 및 진행',
                  description: '관리자가 적합한 해석자를 지정하고, 해석자는 작업을 진행하며 실시간으로 상태를 업데이트합니다. 칸반 보드로 모든 진행 상황을 시각화합니다.',
                  icon: <CheckCircle className="h-12 w-12" />,
                  color: 'from-indigo-500 to-indigo-600'
                },
                {
                  category: 'STEP 03',
                  title: '완료 및 보고서 제출',
                  description: '해석 작업이 완료되면 결과 보고서를 업로드하고, 설계자는 언제든지 다운로드하여 검토할 수 있습니다.',
                  icon: <BarChart3 className="h-12 w-12" />,
                  color: 'from-purple-500 to-purple-600'
                }
              ].map((item, index) => (
                <Card key={index} className="flex-none w-80 md:w-96 snap-center border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group">
                  <div className={`h-2 bg-gradient-to-r ${item.color}`}></div>
                  <div className="p-8">
                    <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${item.color} text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      {item.icon}
                    </div>
                    <div className="text-xs font-semibold text-blue-600 mb-2">{item.category}</div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">{item.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{item.description}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div className="text-center mt-8">
            <Button asChild variant="link" className="text-blue-600 font-semibold group">
              <Link href="/auth/signup">
                지금 시작하기 →
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background image placeholder */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-indigo-900 to-blue-900">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
          <div className="absolute top-20 left-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 leading-tight">
            CAE 업무 혁신의 시작,<br />
            지금 고고CAE와 함께하세요
          </h2>
          <p className="text-xl text-blue-100 mb-12">
            복잡했던 CAE 프로세스를 간단하게, 흩어진 정보를 한곳에.<br />
            설계자와 해석자의 완벽한 협업을 경험해보세요.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-gray-100 font-semibold text-lg px-10 py-6">
              <Link href="/auth/signup">
                무료로 시작하기
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 font-semibold text-lg px-10 py-6">
              <Link href="/auth/login">
                로그인
              </Link>
            </Button>
          </div>
          <p className="text-sm text-blue-200 mt-8">
            ✓ 회원가입 무료 &nbsp;&nbsp; ✓ 신용카드 불필요 &nbsp;&nbsp; ✓ 언제든 시작 가능
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xs">GO</span>
                </div>
                <span className="text-xl font-bold text-white">고고CAE</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed mb-4">
                CAE 해석 업무를 한눈에 관리하는 클라우드 협업 플랫폼<br />
                설계자와 해석자의 효율적인 소통과 협업을 지원합니다.
              </p>
              <p className="text-xs text-gray-500">
                더 나은 CAE 워크플로우를 만들어갑니다.
              </p>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">메뉴</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="#features" className="hover:text-blue-400 transition-colors">주요 기능</Link></li>
                <li><Link href="#solution" className="hover:text-blue-400 transition-colors">제공 기능</Link></li>
                <li><Link href="#workflow" className="hover:text-blue-400 transition-colors">사용 흐름</Link></li>
                <li><Link href="/dashboard" className="hover:text-blue-400 transition-colors">대시보드</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">시작하기</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/auth/signup" className="hover:text-blue-400 transition-colors">회원가입</Link></li>
                <li><Link href="/auth/login" className="hover:text-blue-400 transition-colors">로그인</Link></li>
                <li><Link href="/requests" className="hover:text-blue-400 transition-colors">요청 목록</Link></li>
                <li><Link href="/kanban" className="hover:text-blue-400 transition-colors">칸반 보드</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-gray-500 text-center md:text-left">
              © 2025 고고CAE. All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm text-gray-500">
              <Link href="#" className="hover:text-blue-400 transition-colors">개인정보처리방침</Link>
              <Link href="#" className="hover:text-blue-400 transition-colors">이용약관</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

