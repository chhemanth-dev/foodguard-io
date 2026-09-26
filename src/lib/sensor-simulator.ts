export type SensorStatus = "fresh" | "warning" | "risk";

export type SensorReading = {
  temperature: number;
  humidity: number;
  pressure: number;
  voc: number;
  status: SensorStatus;
  updatedAt: Date;
};

export function getSensorStatus(reading: Pick<SensorReading, "temperature" | "humidity" | "voc">): SensorStatus {
  if (reading.temperature > 7 || reading.humidity > 75 || reading.voc > 300) return "risk";
  if (reading.temperature > 5 || reading.humidity > 70 || reading.voc > 90) return "warning";
  return "fresh";
}

type BaseReading = Omit<SensorReading, "status" | "updatedAt">;

const baseReadings: BaseReading[] = [
  { temperature: 3.2, humidity: 62, pressure: 1012, voc: 76 },
  { temperature: 3.4, humidity: 63, pressure: 1012, voc: 82 },
  { temperature: 3.3, humidity: 62, pressure: 1011, voc: 89 },
  { temperature: 3.5, humidity: 64, pressure: 1011, voc: 96 },
];

export function getSimulatedReading(step: number, alertActive = false): SensorReading {
  const sample = baseReadings[step % baseReadings.length] ?? baseReadings[0];
  if (!sample) {
    return { temperature: 3.2, humidity: 62, pressure: 1012, voc: 76, status: "fresh", updatedAt: new Date() };
  }
  if (alertActive) {
    return {
      temperature: 7.8,
      humidity: 78,
      pressure: 1009,
      voc: 468,
      status: "risk",
      updatedAt: new Date(),
    };
  }

  return {
    ...sample,
    status: getSensorStatus(sample),
    updatedAt: new Date(),
  };
}