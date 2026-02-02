import { useState, useRef, useEffect } from 'react';
import { DayPicker, DateRange } from 'react-day-picker';
import { format, isBefore, startOfDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils/cn';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import ChevronLeft from 'lucide-react/dist/esm/icons/chevron-left';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';

interface DateRangePickerProps {
  checkinDate: string;
  checkoutDate: string;
  onCheckinChange: (date: string) => void;
  onCheckoutChange: (date: string) => void;
  className?: string;
}

export function DateRangePicker({
  checkinDate,
  checkoutDate,
  onCheckinChange,
  onCheckoutChange,
  className,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectingType, setSelectingType] = useState<'checkin' | 'checkout'>('checkin');
  const containerRef = useRef<HTMLDivElement>(null);

  const today = startOfDay(new Date());

  const selectedRange: DateRange | undefined =
    checkinDate || checkoutDate
      ? {
          from: checkinDate ? new Date(checkinDate) : undefined,
          to: checkoutDate ? new Date(checkoutDate) : undefined,
        }
      : undefined;

  const handleDayClick = (day: Date | undefined) => {
    if (!day) return;

    const dateStr = format(day, 'yyyy-MM-dd');

    if (selectingType === 'checkin') {
      onCheckinChange(dateStr);
      // 체크아웃이 체크인보다 앞서면 초기화
      if (checkoutDate && isBefore(new Date(checkoutDate), day)) {
        onCheckoutChange('');
      }
      setSelectingType('checkout');
    } else {
      // 체크아웃 선택 시 체크인보다 앞선 날짜면 체크인으로 설정
      if (checkinDate && isBefore(day, new Date(checkinDate))) {
        onCheckinChange(dateStr);
        onCheckoutChange('');
        setSelectingType('checkout');
      } else {
        onCheckoutChange(dateStr);
        setIsOpen(false);
        setSelectingType('checkin');
      }
    }
  };

  const handleInputClick = (type: 'checkin' | 'checkout') => {
    setSelectingType(type);
    setIsOpen(true);
  };

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    return format(new Date(dateStr), 'M월 d일 (EEE)', { locale: ko });
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* 날짜 입력 영역 */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => handleInputClick('checkin')}
          className={cn(
            'flex flex-col items-start px-4 py-3 border rounded-xl transition-all text-left',
            'hover:border-indigo-300 focus:outline-none',
            isOpen && selectingType === 'checkin'
              ? 'border-indigo-500 ring-2 ring-indigo-100'
              : 'border-gray-200'
          )}
        >
          <span className="text-xs font-medium text-gray-500 mb-1">체크인</span>
          <span className={cn(
            'text-sm font-medium',
            checkinDate ? 'text-gray-900' : 'text-gray-400'
          )}>
            {checkinDate ? formatDisplayDate(checkinDate) : '날짜 선택'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleInputClick('checkout')}
          className={cn(
            'flex flex-col items-start px-4 py-3 border rounded-xl transition-all text-left',
            'hover:border-indigo-300 focus:outline-none',
            isOpen && selectingType === 'checkout'
              ? 'border-indigo-500 ring-2 ring-indigo-100'
              : 'border-gray-200'
          )}
        >
          <span className="text-xs font-medium text-gray-500 mb-1">체크아웃</span>
          <span className={cn(
            'text-sm font-medium',
            checkoutDate ? 'text-gray-900' : 'text-gray-400'
          )}>
            {checkoutDate ? formatDisplayDate(checkoutDate) : '날짜 선택'}
          </span>
        </button>
      </div>

      {/* 선택된 박 수 표시 */}
      {checkinDate && checkoutDate && (
        <div className="mt-2 text-center">
          <span className="text-sm text-indigo-600 font-medium">
            {Math.ceil((new Date(checkoutDate).getTime() - new Date(checkinDate).getTime()) / (1000 * 60 * 60 * 24))}박
          </span>
        </div>
      )}

      {/* 캘린더 드롭다운 */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-50 animate-in fade-in-0 zoom-in-95">
          <div className="mb-3 pb-3 border-b border-gray-100">
            <p className="text-sm text-gray-600 text-center">
              {selectingType === 'checkin' ? (
                <span className="flex items-center justify-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  체크인 날짜를 선택하세요
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  체크아웃 날짜를 선택하세요
                </span>
              )}
            </p>
          </div>

          <DayPicker
            mode="range"
            selected={selectedRange}
            onDayClick={handleDayClick}
            locale={ko}
            numberOfMonths={1}
            disabled={{ before: today }}
            showOutsideDays
            fixedWeeks
            classNames={{
              months: 'flex flex-col',
              month: 'space-y-3',
              month_caption: 'flex justify-center pt-1 relative items-center mb-2',
              caption_label: 'text-base font-semibold text-gray-900',
              nav: 'space-x-1 flex items-center absolute inset-x-0 justify-between',
              button_previous: cn(
                'h-8 w-8 bg-transparent p-0 opacity-70 hover:opacity-100',
                'inline-flex items-center justify-center rounded-full',
                'hover:bg-gray-100 transition-colors'
              ),
              button_next: cn(
                'h-8 w-8 bg-transparent p-0 opacity-70 hover:opacity-100',
                'inline-flex items-center justify-center rounded-full',
                'hover:bg-gray-100 transition-colors'
              ),
              month_grid: 'w-full border-collapse',
              weekdays: 'flex',
              weekday: cn(
                'text-gray-500 rounded-md w-10 font-medium text-xs',
                'flex items-center justify-center'
              ),
              week: 'flex w-full mt-1',
              day: cn(
                'relative p-0 text-center text-sm focus-within:relative h-10 w-10',
                'first:[&:has([aria-selected])]:rounded-l-full',
                'last:[&:has([aria-selected])]:rounded-r-full',
                '[&:has([aria-selected])]:bg-indigo-50'
              ),
              day_button: cn(
                'h-10 w-10 p-0 font-normal rounded-full',
                'inline-flex items-center justify-center',
                'hover:bg-indigo-100 hover:text-indigo-900 transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1'
              ),
              range_start: 'day-range-start [&>button]:bg-indigo-600 [&>button]:text-white [&>button]:hover:bg-indigo-700 rounded-l-full',
              range_end: 'day-range-end [&>button]:bg-indigo-600 [&>button]:text-white [&>button]:hover:bg-indigo-700 rounded-r-full',
              selected: '[&>button]:bg-indigo-600 [&>button]:text-white [&>button]:hover:bg-indigo-700',
              today: '[&>button]:ring-1 [&>button]:ring-indigo-300 [&>button]:font-semibold',
              outside: '[&>button]:text-gray-300 [&>button]:opacity-50',
              disabled: '[&>button]:text-gray-300 [&>button]:opacity-50 [&>button]:cursor-not-allowed [&>button]:hover:bg-transparent',
              range_middle: 'bg-indigo-50 [&>button]:text-indigo-900 rounded-none',
              hidden: 'invisible',
            }}
            components={{
              Chevron: ({ orientation }) =>
                orientation === 'left'
                  ? <ChevronLeft className="h-5 w-5" />
                  : <ChevronRight className="h-5 w-5" />
            }}
          />

          {/* 하단 버튼 */}
          <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
            <button
              type="button"
              onClick={() => {
                onCheckinChange('');
                onCheckoutChange('');
                setSelectingType('checkin');
              }}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              초기화
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
