import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';

import Home from 'lucide-react/dist/esm/icons/home';
import Facebook from 'lucide-react/dist/esm/icons/facebook';
import Twitter from 'lucide-react/dist/esm/icons/twitter';
import Instagram from 'lucide-react/dist/esm/icons/instagram';
import Youtube from 'lucide-react/dist/esm/icons/youtube';

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t pt-16 pb-8">
      <div className="container mx-auto px-4 max-w-[1200px]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Logo & Description */}
          <div>
            <div className="flex items-center gap-2 text-gray-900 mb-4">
              <Home className="h-6 w-6 text-indigo-600" />
              <span className="text-xl font-bold">StaySwap</span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              집을 교환하고 새로운 경험을 만나세요. 현지인처럼 여행하고 특별한 추억을 만들어보세요.
            </p>
            <div className="flex gap-3">
              <a
                href="#"
                className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center hover:bg-indigo-600 hover:text-white text-gray-600 transition-colors"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center hover:bg-indigo-600 hover:text-white text-gray-600 transition-colors"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center hover:bg-indigo-600 hover:text-white text-gray-600 transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center hover:bg-indigo-600 hover:text-white text-gray-600 transition-colors"
              >
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* 서비스 */}
          <div>
            <h3 className="text-gray-900 font-semibold mb-4">서비스</h3>
            <ul className="space-y-3 text-sm text-gray-500">
              <li>
                <Link to={ROUTES.LISTINGS} className="hover:text-indigo-600 transition-colors">
                  숙소 찾기
                </Link>
              </li>
              <li>
                <Link to={ROUTES.NEW_LISTING} className="hover:text-indigo-600 transition-colors">
                  숙소 등록
                </Link>
              </li>
              <li>
                <Link to={ROUTES.EXCHANGES} className="hover:text-indigo-600 transition-colors">
                  교환 관리
                </Link>
              </li>
              <li>
                <Link to={ROUTES.SUBSCRIPTION} className="hover:text-indigo-600 transition-colors">
                  구독 플랜
                </Link>
              </li>
            </ul>
          </div>

          {/* 회사 정보 */}
          <div>
            <h3 className="text-gray-900 font-semibold mb-4">회사 정보</h3>
            <ul className="space-y-3 text-sm text-gray-500">
              <li>
                <Link to="/about" className="hover:text-indigo-600 transition-colors">
                  회사 소개
                </Link>
              </li>
              <li>
                <Link to="/careers" className="hover:text-indigo-600 transition-colors">
                  채용 정보
                </Link>
              </li>
              <li>
                <Link to="/press" className="hover:text-indigo-600 transition-colors">
                  언론 보도
                </Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-indigo-600 transition-colors">
                  블로그
                </Link>
              </li>
            </ul>
          </div>

          {/* 지원 */}
          <div>
            <h3 className="text-gray-900 font-semibold mb-4">지원</h3>
            <ul className="space-y-3 text-sm text-gray-500">
              <li>
                <Link to="/help" className="hover:text-indigo-600 transition-colors">
                  도움말 센터
                </Link>
              </li>
              <li>
                <Link to="/safety" className="hover:text-indigo-600 transition-colors">
                  안전 정보
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-indigo-600 transition-colors">
                  문의하기
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-indigo-600 transition-colors">
                  자주 묻는 질문
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">© 2025 StaySwap. All rights reserved.</p>
          <div className="flex gap-6 text-sm">
            <Link to="/terms" className="text-gray-500 hover:text-indigo-600 transition-colors">
              이용약관
            </Link>
            <Link to="/privacy" className="text-gray-500 hover:text-indigo-600 transition-colors">
              개인정보처리방침
            </Link>
            <Link to="/sitemap" className="text-gray-500 hover:text-indigo-600 transition-colors">
              사이트맵
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
