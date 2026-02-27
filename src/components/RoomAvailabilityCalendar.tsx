import { useState, useEffect } from 'react';
import { format, eachDayOfInterval, startOfMonth, endOfMonth, startOfToday, isBefore } from 'date-fns';
import { th as thLocale, enUS as enUSLocale } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';

interface RoomAvailabilityCalendarProps {
  roomId: string;
  month?: Date;
  onMonthChange?: (date: Date) => void;
  userRole?: 'user' | 'developer' | 'admin';
}

interface AvailabilityData {
  [dateKey: string]: {
    isAvailable: boolean;
    bookedBy?: string;
    notes?: string;
  };
}

export const RoomAvailabilityCalendar = ({
  roomId,
  month = startOfToday(),
  onMonthChange,
  userRole = 'user',
}: RoomAvailabilityCalendarProps) => {
  const { language } = useLanguage();
  const [availabilityData, setAvailabilityData] = useState<AvailabilityData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [displayMonth, setDisplayMonth] = useState(month);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  // Fetch availability data for the current month
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!roomId) return;

      setIsLoading(true);
      try {
        const startDate = startOfMonth(displayMonth);
        const endDate = endOfMonth(displayMonth);

        // @ts-ignore - room_availability table is newly created
        const { data, error } = await (supabase as any)
          .from('room_availability')
          .select('availability_date, is_available, booked_by, notes')
          .eq('room_id', roomId)
          .gte('availability_date', format(startDate, 'yyyy-MM-dd'))
          .lte('availability_date', format(endDate, 'yyyy-MM-dd'));

        if (error) {
          console.error('Error fetching availability:', error);
          return;
        }

        // Convert to object keyed by date
        const availMap: AvailabilityData = {};
        data?.forEach((record) => {
          availMap[record.availability_date] = {
            isAvailable: record.is_available,
            bookedBy: record.booked_by,
            notes: record.notes,
          };
        });

        setAvailabilityData(availMap);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailability();
  }, [roomId, displayMonth]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!roomId) return;

    // @ts-ignore - room_availability table is newly created
    const channel = (supabase as any)
      .channel(`room-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_availability',
          filter: `room_id=eq.${roomId}`,
        },
        (payload: any) => {
          const record = payload.new || payload.old;
          if (!record || record.room_id !== roomId) return;

          setAvailabilityData((prev) => ({
            ...prev,
            [record.availability_date]: {
              isAvailable: record.is_available,
              bookedBy: record.booked_by,
              notes: record.notes,
            },
          }));
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [roomId]);

  const handlePrevMonth = () => {
    const newDate = new Date(displayMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    setDisplayMonth(newDate);
    onMonthChange?.(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(displayMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    setDisplayMonth(newDate);
    onMonthChange?.(newDate);
  };

  // Get all days in month
  const monthStart = startOfMonth(displayMonth);
  const monthEnd = endOfMonth(displayMonth);
  const daysInMonth = eachDayOfInterval({
    start: monthStart,
    end: monthEnd,
  });

  // Get weekday headers
  const weekDays = language === 'th' 
    ? ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Get first day of month's weekday offset
  const startingDayOfWeek = monthStart.getDay();
  const emptyDays = Array.from({ length: startingDayOfWeek }, (_, i) => i);

  const getDayStatus = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const availability = availabilityData[dateKey];
    
    // If not explicitly set, default to available
    if (!availability) return { isAvailable: true };
    
    return availability;
  };

  const selectedDate = selectedDateKey ? new Date(`${selectedDateKey}T00:00:00`) : null;
  const selectedStatus = selectedDate ? getDayStatus(selectedDate) : null;

  // Get today's status
  const today = startOfToday();
  const todayKey = format(today, 'yyyy-MM-dd');
  const todayStatus = availabilityData[todayKey];
  const isTodayAvailable = todayStatus?.isAvailable ?? true;

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-2 sm:p-3 md:p-4 shadow-sm overflow-x-auto">
      {/* Today's Status */}
      <div className={cn(
        'mb-3 sm:mb-4 md:mb-5 p-2 sm:p-3 md:p-4 rounded-lg border-2 font-semibold transition-all',
        isTodayAvailable
          ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300'
          : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300'
      )}>
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm md:text-base">
            {language === 'th' ? 'สถานะวันนี้' : 'Today\'s Status'}:
          </span>
          <span className="text-sm sm:text-base md:text-lg">
            {isTodayAvailable 
              ? (language === 'th' ? '🟢 ว่าง' : '🟢 Available')
              : (language === 'th' ? '🔴 ไม่ว่าง' : '🔴 Not Available')}
          </span>
        </div>
        {todayStatus?.bookedBy && (
          <p className="text-[9px] sm:text-xs md:text-sm mt-1.5 sm:mt-2 opacity-75">
            {language === 'th' ? 'จองโดย' : 'Booked by'}: {todayStatus.bookedBy}
          </p>
        )}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-2 sm:mb-3 px-1">
        <button
          onClick={handlePrevMonth}
          className="p-0.5 sm:p-1 md:p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-colors flex-shrink-0"
          aria-label="Previous month"
        >
          <ChevronLeft size={14} className="sm:w-[18px] sm:h-[18px] text-slate-600 dark:text-slate-400" />
        </button>

        <h3 className="font-semibold text-center text-slate-800 dark:text-white text-xs sm:text-sm md:text-base flex-grow px-2">
          {format(displayMonth, language === 'th' ? 'MMMM yyyy' : 'MMMM yyyy', {
            locale: language === 'th' ? thLocale : enUSLocale,
          })}
        </h3>

        <button
          onClick={handleNextMonth}
          className="p-0.5 sm:p-1 md:p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-colors flex-shrink-0"
          aria-label="Next month"
        >
          <ChevronRight size={14} className="sm:w-[18px] sm:h-[18px] text-slate-600 dark:text-slate-400" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-1 sm:mb-2 px-1">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-[8px] sm:text-xs md:text-sm font-semibold text-slate-600 dark:text-slate-400 py-1 sm:py-1.5 md:py-2"
          >
            <span className="sm:hidden">{day.substring(0, 1)}</span>
            <span className="hidden sm:inline">{day}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-6 sm:py-8 md:py-12">
          <div className="animate-spin">
            <div className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 border-2 border-slate-300 dark:border-slate-600 border-t-blue-500 rounded-full" />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1 px-1">
          {/* Empty cells for days before month starts */}
          {emptyDays.map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {/* Day cells */}
          {daysInMonth.map((date) => {
            const status = getDayStatus(date);
            const dateKey = format(date, 'yyyy-MM-dd');
            const isToday = format(date, 'yyyy-MM-dd') === format(startOfToday(), 'yyyy-MM-dd');
            const isPastDate = isBefore(date, startOfToday());
            const isSelected = selectedDateKey === dateKey;

            return (
              <button
                type="button"
                key={dateKey}
                onClick={() => setSelectedDateKey(dateKey)}
                className={cn(
                  'aspect-square flex items-center justify-center text-[7px] sm:text-[9px] md:text-xs font-medium rounded-sm sm:rounded-md transition-all border border-transparent',
                  'cursor-pointer',
                  isToday && !isPastDate && 'ring-[1.5px] ring-blue-500 sm:ring-2',
                  isSelected && 'border-slate-500 dark:border-slate-300',
                  isPastDate
                    ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                    : status.isAvailable
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                )}
                title={
                  isPastDate
                    ? 'Past date'
                    : status.bookedBy
                    ? `${status.isAvailable ? 'Available' : 'Booked by'}: ${status.bookedBy}${status.notes ? ` - ${status.notes}` : ''}`
                    : status.isAvailable ? 'Available' : 'Booked'
                }
              >
                {format(date, 'd')}
              </button>
            );
          })}
        </div>
      )}

      {selectedDate && selectedStatus && (
        <div className="mt-2 sm:mt-3 md:mt-4 mx-1 p-2 sm:p-3 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800/70">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <p className="text-[10px] sm:text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-200">
              {language === 'th' ? 'รายละเอียดวันที่' : 'Date Details'}: {format(selectedDate, language === 'th' ? 'd MMMM yyyy' : 'MMM d, yyyy', {
                locale: language === 'th' ? thLocale : enUSLocale,
              })}
            </p>
            <span
              className={cn(
                'inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full border shadow-sm',
                selectedStatus.isAvailable
                  ? 'text-green-700 dark:text-green-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-green-300 dark:border-green-700'
                  : 'text-red-700 dark:text-red-200 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/35 dark:to-rose-900/35 border-red-300 dark:border-red-700'
              )}
            >
              <span className={cn(
                'inline-block h-1.5 w-1.5 rounded-full',
                selectedStatus.isAvailable ? 'bg-green-500' : 'bg-red-500'
              )} />
              {selectedStatus.isAvailable
                ? (language === 'th' ? 'ว่าง' : 'Available')
                : (language === 'th' ? 'ไม่ว่าง' : 'Not Available')}
            </span>
          </div>

          {!selectedStatus.isAvailable && (
            <div className="space-y-1 text-[9px] sm:text-[11px] md:text-xs text-slate-600 dark:text-slate-300">
              <p>
                {language === 'th' ? 'ผู้จอง/สาเหตุ' : 'Booked by/Reason'}: {selectedStatus.bookedBy || (language === 'th' ? 'ไม่ระบุ' : 'Not specified')}
              </p>
              <p>
                {language === 'th' ? 'หมายเหตุ' : 'Note'}: {selectedStatus.notes || (language === 'th' ? 'ไม่มีรายละเอียดเพิ่มเติม' : 'No additional details')}
              </p>
            </div>
          )}

          {selectedStatus.isAvailable && (
            <p className="text-[9px] sm:text-[11px] md:text-xs text-slate-600 dark:text-slate-300">
              {language === 'th'
                ? 'วันนี้ห้องว่าง สามารถจองได้'
                : 'Room is available for booking on this date'}
            </p>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="mt-2 sm:mt-3 md:mt-4 pt-1 sm:pt-2 md:pt-3 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 text-[9px] sm:text-xs md:text-sm px-1">
        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2">
          <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-sm bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700" />
          <span className="text-slate-600 dark:text-slate-400">
            {language === 'th' ? 'ว่าง' : 'Available'}
          </span>
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2">
          <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-sm bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700" />
          <span className="text-slate-600 dark:text-slate-400">
            {language === 'th' ? 'ไม่ว่าง' : 'Not Available'}
          </span>
        </div>
      </div>

      {/* Info message - only show for admin and developer */}
      {(userRole === 'admin' || userRole === 'developer') && (
        <div className="mt-1 sm:mt-2 md:mt-3 flex items-start gap-1 sm:gap-1.5 md:gap-2 p-1.5 sm:p-2 md:p-2.5 rounded-sm sm:rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 mx-1">
          <AlertCircle size={10} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5 sm:mt-1 md:mt-1" />
          <p className="text-[8px] sm:text-[9px] md:text-xs text-blue-700 dark:text-blue-300">
            {language === 'th' 
              ? 'เฉพาะ Admin เท่านั้นที่สามารถแก้ไขข้อมูลได้'
              : 'Only admins can update room availability dates'}
          </p>
        </div>
      )}
    </div>
  );
};

export default RoomAvailabilityCalendar;
