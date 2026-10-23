// Centraliza o catálogo de serviços e os horários disponíveis.
export type ServiceId = "1" | "2" | "3";

export type Service = {
  name: string;
  price: number;
};

export const services: Record<ServiceId, Service> = {
  "1": { name: "Corte de cabelo", price: 40 },
  "2": { name: "Barba", price: 25 },
  "3": { name: "Corte + barba", price: 60 },
};

export const availableTimes: Record<string, string> = {
  "1": "09:00",
  "2": "10:00",
  "3": "14:00",
  "4": "15:00",
};
