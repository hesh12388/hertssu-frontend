export type CalendarAgendaProps ={
    items: Record<string, {name: string; height?: number}[]>;
    selectedDate?:string;
    onDayChange?: (date: string) => void;
}