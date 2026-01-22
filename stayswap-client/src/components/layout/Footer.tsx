import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* About */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">StaySwap 소개</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link to="/about" className="hover:text-primary">
                  회사 소개
                </Link>
              </li>
              <li>
                <Link to="/careers" className="hover:text-primary">
                  채용
                </Link>
              </li>
              <li>
                <Link to="/press" className="hover:text-primary">
                  보도자료
                </Link>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">커뮤니티</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link to="/blog" className="hover:text-primary">
                  블로그
                </Link>
              </li>
              <li>
                <Link to="/forum" className="hover:text-primary">
                  포럼
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">고객지원</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link to="/help" className="hover:text-primary">
                  도움말
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-primary">
                  문의하기
                </Link>
              </li>
              <li>
                <Link to="/safety" className="hover:text-primary">
                  안전 센터
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">법적 고지</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link to="/terms" className="hover:text-primary">
                  이용약관
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-primary">
                  개인정보 처리방침
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-8 text-center text-sm text-gray-600">
          <p>&copy; 2026 StaySwap. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
