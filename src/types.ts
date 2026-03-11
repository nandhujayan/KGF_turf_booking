export type Sport = 'football' | 'cricket';

export interface TimeSlot {
  id: string;
  time: string;
  isBooked: boolean;
  price: number;
}

export interface BookingData {
  sport: Sport;
  date: Date;
  slotId: string;
}

export interface Facility {
  id: string;
  name: string;
  icon: string;
}
