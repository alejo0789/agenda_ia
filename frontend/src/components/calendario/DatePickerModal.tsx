'use client';

import { useState, useMemo } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    startOfWeek,
    endOfWeek,
    isToday
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DatePickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedDate: Date;
    onSelectDate: (date: Date) => void;
}

const DAYS_OF_WEEK = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export function DatePickerModal({
    isOpen,
    onClose,
    selectedDate,
    onSelectDate
}: DatePickerModalProps) {
    const [currentMonth, setCurrentMonth] = useState(startOfMonth(selectedDate));

    const calendarDays = useMemo(() => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
        const calendarStart = startOfWeek(monthStart);
        const calendarEnd = endOfWeek(monthEnd);

        return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    }, [currentMonth]);

    const handlePrevMonth = () => {
        setCurrentMonth(prev => subMonths(prev, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(prev => addMonths(prev, 1));
    };

    const handleSelectDate = (date: Date) => {
        onSelectDate(date);
    };

    const handleToday = () => {
        const today = new Date();
        setCurrentMonth(startOfMonth(today));
        onSelectDate(today);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-sm m-4 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white">
                        Seleccionar Fecha
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>

                {/* Navegación de Mes */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                    <button
                        onClick={handlePrevMonth}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>

                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                        {format(currentMonth, 'MMMM yyyy', { locale: es })}
                    </h3>

                    <button
                        onClick={handleNextMonth}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                </div>

                {/* Días de la Semana */}
                <div className="grid grid-cols-7 px-4 py-2 border-b border-gray-200 dark:border-gray-800">
                    {DAYS_OF_WEEK.map((day) => (
                        <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Días del Mes */}
                <div className="grid grid-cols-7 gap-1 p-4">
                    {calendarDays.map((day, index) => {
                        const isCurrentMonth = isSameMonth(day, currentMonth);
                        const isSelected = isSameDay(day, selectedDate);
                        const isTodayDate = isToday(day);

                        return (
                            <button
                                key={index}
                                onClick={() => handleSelectDate(day)}
                                disabled={!isCurrentMonth}
                                className={`
                  relative h-10 w-10 rounded-full flex items-center justify-center text-sm transition-all
                  ${!isCurrentMonth ? 'text-gray-300 dark:text-gray-700 cursor-not-allowed' : 'cursor-pointer'}
                  ${isCurrentMonth && !isSelected ? 'hover:bg-purple-100 dark:hover:bg-purple-900/30 text-gray-700 dark:text-gray-300' : ''}
                  ${isSelected ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold shadow-lg' : ''}
                  ${isTodayDate && !isSelected ? 'ring-2 ring-purple-400 font-semibold' : ''}
                `}
                            >
                                {format(day, 'd')}
                                {isTodayDate && !isSelected && (
                                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-purple-600 rounded-full" />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleToday}
                    >
                        Ir a Hoy
                    </Button>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {format(selectedDate, "d 'de' MMMM, yyyy", { locale: es })}
                    </p>
                </div>
            </div>
        </div>
    );
}
