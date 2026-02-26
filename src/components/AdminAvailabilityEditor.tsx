import { useState, useEffect } from 'react';
import { format, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns';
import { th as thLocale, enUS as enUSLocale } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Trash2, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import sweetAlert from '@/lib/sweetAlert';

interface AdminAvailabilityEditorProps {
  roomId: string;
  roomName: string;
  isOpen: boolean;
  onClose: () => void;
}

interface AvailabilityRecord {
  availability_date: string;
  is_available: boolean;
  booked_by?: string;
  notes?: string;
}

export const AdminAvailabilityEditor = ({
  roomId,
  roomName,
  isOpen,
  onClose,
}: AdminAvailabilityEditorProps) => {
  const { language } = useLanguage();
  const [month, setMonth] = useState(new Date());
  const [availabilityData, setAvailabilityData] = useState<Map<string, AvailabilityRecord>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [editData, setEditData] = useState({ is_available: true, booked_by: '', notes: '' });

  // Fetch availability data
  useEffect(() => {
    if (!isOpen || !roomId) return;
    fetchAvailabilityData();
  }, [roomId, month, isOpen]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!isOpen || !roomId) return;

    // @ts-ignore - room_availability table is newly created
    const channel = (supabase as any)
      .channel(`admin-room-${roomId}`)
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

          setAvailabilityData((prev) => {
            const newMap = new Map(prev);
            if (payload.eventType === 'DELETE') {
              newMap.delete(record.availability_date);
            } else {
              newMap.set(record.availability_date, {
                availability_date: record.availability_date,
                is_available: record.is_available,
                booked_by: record.booked_by,
                notes: record.notes,
              });
            }
            return newMap;
          });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [isOpen, roomId]);

  const fetchAvailabilityData = async () => {
    setIsLoading(true);
    try {
      const startDate = startOfMonth(month);
      const endDate = endOfMonth(month);

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

      const dataMap = new Map<string, AvailabilityRecord>();
      data?.forEach((record) => {
        dataMap.set(record.availability_date, record);
      });

      setAvailabilityData(dataMap);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevMonth = () => {
    const newMonth = new Date(month);
    newMonth.setMonth(newMonth.getMonth() - 1);
    setMonth(newMonth);
  };

  const handleNextMonth = () => {
    const newMonth = new Date(month);
    newMonth.setMonth(newMonth.getMonth() + 1);
    setMonth(newMonth);
  };

  const handleDateClick = (dateStr: string) => {
    const record = availabilityData.get(dateStr);
    setSelectedDate(dateStr);
    setEditData({
      is_available: record?.is_available ?? true,
      booked_by: record?.booked_by ?? '',
      notes: record?.notes ?? '',
    });
    setIsEditingDate(true);
  };

  const handleSaveAvailability = async () => {
    if (!selectedDate) {
      sweetAlert.error(language === 'th' ? 'เลือกวันที่ไม่ได้' : 'Please select a date');
      return;
    }

    setIsLoading(true);
    try {
      const record = availabilityData.get(selectedDate);
      let error: any = null;

      if (record) {
        // Update existing record
        // @ts-ignore - room_availability table is newly created
        const { error: updateError } = await (supabase as any)
          .from('room_availability')
          .update({
            is_available: editData.is_available,
            booked_by: editData.booked_by || null,
            notes: editData.notes || null,
          })
          .eq('room_id', roomId)
          .eq('availability_date', selectedDate);

        error = updateError;
      } else {
        // Create new record
        // @ts-ignore - room_availability table is newly created
        const { error: insertError } = await (supabase as any)
          .from('room_availability')
          .insert({
            room_id: roomId,
            availability_date: selectedDate,
            is_available: editData.is_available,
            booked_by: editData.booked_by || null,
            notes: editData.notes || null,
          });

        error = insertError;
      }

      if (error) {
        console.error('Save error:', error);
        const errorMsg = error.message || error.code || 'Unknown error';
        throw new Error(`Failed to save: ${errorMsg}`);
      }

      sweetAlert.success(language === 'th' ? 'อัพเดทสำเร็จ' : 'Updated successfully');
      setIsEditingDate(false);
      setSelectedDate(null);
      setEditData({ is_available: true, booked_by: '', notes: '' });
      await fetchAvailabilityData();
    } catch (error: any) {
      console.error('Error saving availability:', error);
      sweetAlert.error(
        language === 'th' 
          ? `เกิดข้อผิดพลาด: ${error.message}`
          : `Error: ${error.message}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAvailability = async () => {
    if (!selectedDate) return;

    const confirmed = await sweetAlert.modal.confirm(
      language === 'th' ? 'ลบความพร่อม?' : 'Delete availability?',
      language === 'th' ? 'ข้อมูลนี้จะถูกลบออก' : 'This record will be deleted'
    );

    if (!confirmed) return;

    setIsLoading(true);
    try {
      // @ts-ignore - room_availability table is newly created
      const { error } = await (supabase as any)
        .from('room_availability')
        .delete()
        .eq('room_id', roomId)
        .eq('availability_date', selectedDate);

      if (error) throw error;

      sweetAlert.success(language === 'th' ? 'ลบสำเร็จ' : 'Deleted successfully');
      setIsEditingDate(false);
      setSelectedDate(null);
      await fetchAvailabilityData();
    } catch (error) {
      console.error('Error deleting availability:', error);
      sweetAlert.error(language === 'th' ? 'เกิดข้อผิดพลาด' : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkBlock = async (days: number) => {
    const confirmed = await sweetAlert.modal.confirm(
      language === 'th' ? `ปิดการจองสำหรับ ${days} วน?` : `Block booking for next ${days} days?`,
      language === 'th' ? `ห้องนี้จะไม่พร่อมสำหรับ ${days} วนข้างหน้า` : `This room will be unavailable for the next ${days} days`
    );

    if (!confirmed) return;

    setIsLoading(true);
    try {
      const records = [];
      const today = new Date();

      for (let i = 0; i < days; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        records.push({
          room_id: roomId,
          availability_date: format(date, 'yyyy-MM-dd'),
          is_available: false,
          booked_by: 'System Block',
          notes: language === 'th' ? 'ปิดการจองอัตโนมัติ' : 'Auto-blocked',
        });
      }

      // @ts-ignore - room_availability table is newly created
      const { error } = await (supabase as any)
        .from('room_availability')
        .upsert(records, { onConflict: 'room_id,availability_date' });

      if (error) throw error;

      sweetAlert.success(language === 'th' ? 'ปิดการจองสำเร็จ' : 'Blocked successfully');
      await fetchAvailabilityData();
    } catch (error) {
      console.error('Error bulk blocking:', error);
      sweetAlert.error(language === 'th' ? 'เกิดข้อผิดพลาด' : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startingDayOfWeek = monthStart.getDay();
  const weekDays = language === 'th' 
    ? ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-full sm:max-w-lg md:max-w-2xl w-[95vw] sm:w-auto bg-white dark:bg-white border-2 border-primary/20 shadow-2xl rounded-2xl">
          <DialogHeader className="bg-gradient-to-r from-primary/5 to-primary/10 -mx-4 sm:-mx-6 -mt-6 px-3 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-primary/20 rounded-t-2xl">
            <DialogTitle className="text-lg sm:text-xl md:text-2xl font-bold text-foreground/90">
              {language === 'th' ? 'จัดการสถานะของห้อง' : 'Manage Room Status'} <span className="text-primary text-sm sm:text-base md:text-lg">- {roomName}</span>
            </DialogTitle>
            <DialogDescription className="text-foreground/70 font-medium text-xs sm:text-sm md:text-base mt-1 sm:mt-2 line-clamp-2">
              {language === 'th' 
                ? '🟢 สีเขียว = ว่าง | 🔴 สีแดง = ไม่ว่าง | คลิกที่วันที่เพื่อแก้ไข'
                : '🟢 Green = Available | 🔴 Red = Not Available | Click date to edit'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-5 px-3 sm:px-6 pb-4 sm:pb-6 max-h-[80vh] overflow-y-auto">
            {/* Quick actions */}
            <div className="flex gap-1.5 sm:gap-2 flex-wrap">
              <Button
                size="sm"
                onClick={() => handleBulkBlock(7)}
                disabled={isLoading}
                className="border-2 border-orange-500 bg-orange-50 hover:bg-orange-100 text-orange-700 font-semibold transition-all shadow-sm hover:shadow-md text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
              >
                {language === 'th' ? 'ปิด 7 วน' : 'Block 7 days'}
              </Button>
              <Button
                size="sm"
                onClick={() => handleBulkBlock(14)}
                disabled={isLoading}
                className="border-2 border-orange-500 bg-orange-50 hover:bg-orange-100 text-orange-700 font-semibold transition-all shadow-sm hover:shadow-md text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
              >
                {language === 'th' ? 'ปิด 14 วน' : 'Block 14 days'}
              </Button>
              <Button
                size="sm"
                onClick={() => handleBulkBlock(30)}
                disabled={isLoading}
                className="border-2 border-orange-500 bg-orange-50 hover:bg-orange-100 text-orange-700 font-semibold transition-all shadow-sm hover:shadow-md text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
              >
                {language === 'th' ? 'ปิด 30 วน' : 'Block 30 days'}
              </Button>
            </div>

            {/* Month navigation */}
            <div className="flex items-center justify-between bg-primary/5 p-2 sm:p-4 rounded-xl border border-primary/15">
              <button onClick={handlePrevMonth} className="p-1 sm:p-2 hover:bg-primary/15 rounded-lg transition-all text-foreground/80 hover:text-foreground">
                <ChevronLeft size={16} className="sm:w-5 sm:h-5" />
              </button>
              <h3 className="font-bold text-sm sm:text-base md:text-lg text-foreground/90">
                {format(month, language === 'th' ? 'MMMM yyyy' : 'MMMM yyyy', {
                  locale: language === 'th' ? thLocale : enUSLocale,
                })}
              </h3>
              <button onClick={handleNextMonth} className="p-1 sm:p-2 hover:bg-primary/15 rounded-lg transition-all text-foreground/80 hover:text-foreground">
                <ChevronRight size={16} className="sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Calendar grid */}
            <div>
              <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-1 sm:mb-2 px-1 sm:px-2 py-1.5 sm:py-2 bg-primary/5 rounded-lg border border-primary/15">
                {weekDays.map((day) => (
                  <div key={day} className="text-center text-[10px] sm:text-xs font-bold text-foreground/90 py-1 sm:py-2">
                    {day}
                  </div>
                ))}
              </div>

              {isLoading ? (
                <div className="flex justify-center py-6 sm:py-8">
                  <div className="animate-spin"><div className="h-5 w-5 sm:h-6 sm:w-6 border-2 border-primary/30 border-t-primary rounded-full" /></div>
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-0.5 sm:gap-1 p-1 sm:p-2 bg-white rounded-lg border border-primary/15">
                  {Array.from({ length: startingDayOfWeek }, (_, i) => (
                    <div key={`empty-${i}`} className="aspect-square" />
                  ))}

                  {daysInMonth.map((date) => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const record = availabilityData.get(dateStr);
                    const isAvailable = record?.is_available ?? true;

                    return (
                      <button
                        key={dateStr}
                        onClick={() => handleDateClick(dateStr)}
                        className={cn(
                          'aspect-square flex items-center justify-center text-[10px] sm:text-xs md:text-sm font-bold rounded-md sm:rounded-lg transition-all hover:shadow-md cursor-pointer border-2',
                          isAvailable
                            ? 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100 hover:border-green-500'
                            : 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-500'
                        )}
                      >
                        {format(date, 'd')}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit date modal */}
      <Dialog open={isEditingDate} onOpenChange={setIsEditingDate}>
        <DialogContent className="max-w-full sm:max-w-lg w-[95vw] sm:w-auto bg-white dark:bg-white border-2 border-primary/20 shadow-2xl rounded-2xl">
          <DialogHeader className="bg-gradient-to-r from-primary/5 to-primary/10 -mx-4 sm:-mx-6 -mt-6 px-3 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-primary/20 rounded-t-2xl">
            <DialogTitle className="text-base sm:text-lg md:text-xl font-bold text-foreground/90">
              {language === 'th' ? 'แก้ไขสถานะของห้องพัก' : 'Edit Room Status'} <span className="text-primary text-xs sm:text-sm md:text-base">- {selectedDate}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-5 px-3 sm:px-6 pb-4 sm:pb-6">
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs sm:text-sm font-bold text-foreground/90">
                  {language === 'th' ? 'สถานะของห้อง' : 'Room Status'}
                </Label>
                <span className="text-[10px] sm:text-xs px-2 py-1 rounded bg-primary/10 text-primary font-semibold">
                  {editData.is_available 
                    ? (language === 'th' ? '🟢 ว่าง' : '🟢 Available')
                    : (language === 'th' ? '🔴 ไม่ว่าง' : '🔴 Not Available')}
                </span>
              </div>
              <div className="flex gap-2 sm:gap-3">
                <Button
                  onClick={() => setEditData({ ...editData, is_available: true })}
                  className={cn(
                    'flex-1 border-2 font-semibold text-xs sm:text-sm transition-all px-2 sm:px-4 py-2 sm:py-2.5 duration-200',
                    editData.is_available
                      ? 'border-green-600 bg-green-600 text-white hover:bg-green-700 hover:border-green-700 shadow-lg scale-105'
                      : 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100 hover:border-green-400'
                  )}
                >
                  <span className="mr-1.5">🟢</span>
                  {language === 'th' ? 'ว่าง' : 'Available'}
                </Button>
                <Button
                  onClick={() => setEditData({ ...editData, is_available: false })}
                  className={cn(
                    'flex-1 border-2 font-semibold text-xs sm:text-sm transition-all px-2 sm:px-4 py-2 sm:py-2.5 duration-200',
                    !editData.is_available
                      ? 'border-red-600 bg-red-600 text-white hover:bg-red-700 hover:border-red-700 shadow-lg scale-105'
                      : 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-400'
                  )}
                >
                  <span className="mr-1.5">🔴</span>
                  {language === 'th' ? 'ไม่ว่าง' : 'Not Available'}
                </Button>
              </div>
            </div>

            {!editData.is_available && (
              <div className="bg-primary/5 p-2 sm:p-4 rounded-lg border border-primary/15 space-y-2 sm:space-y-4">
                <div>
                  <Label htmlFor="booked_by" className="text-xs sm:text-sm font-bold text-foreground/90">
                    {language === 'th' ? 'จองโดย' : 'Booked By'}
                  </Label>
                  <Input
                    id="booked_by"
                    placeholder={language === 'th' ? 'เช่น Agoda, Booking.com, John Smith' : 'e.g. Agoda, Booking.com, John Smith'}
                    value={editData.booked_by}
                    onChange={(e) => setEditData({ ...editData, booked_by: e.target.value })}
                    className="mt-1 sm:mt-2 border-2 bg-white text-xs sm:text-sm text-foreground/90 placeholder:font-medium placeholder:text-foreground/50 focus:border-primary"
                  />
                </div>

                <div>
                  <Label htmlFor="notes" className="text-xs sm:text-sm font-bold text-foreground/90">
                    {language === 'th' ? 'หมายเหตุ' : 'Notes'}
                  </Label>
                  <Input
                    id="notes"
                    placeholder={language === 'th' ? 'เช่น Manual block, สำคัญ' : 'e.g. Manual block, Important'}
                    value={editData.notes}
                    onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                    className="mt-1 sm:mt-2 border-2 bg-white text-xs sm:text-sm text-foreground/90 placeholder:font-medium placeholder:text-foreground/50 focus:border-primary"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2 sm:pt-4">
              <Button
                onClick={handleSaveAvailability}
                disabled={isLoading}
                className="flex-1 border-2 border-blue-600 bg-blue-600 text-white hover:bg-blue-700 hover:border-blue-700 font-semibold shadow-md transition-all text-xs sm:text-sm px-2 sm:px-3 py-2 sm:py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-3 w-3 sm:h-4 sm:w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{language === 'th' ? 'กำลังบันทึก...' : 'Saving...'}</span>
                  </div>
                ) : (
                  language === 'th' ? 'บันทึก' : 'Save'
                )}
              </Button>
              <Button
                onClick={handleDeleteAvailability}
                disabled={isLoading}
                className="border-2 border-red-500 bg-red-50 hover:bg-red-100 text-red-600 font-semibold transition-all p-1.5 sm:p-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 size={14} className="sm:w-4 sm:h-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminAvailabilityEditor;
