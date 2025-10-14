export enum AppStep {
  INTRODUCTION,
  TOPIC,
  SCRIPT,
  RECORDING,
  COMPLETED,
}

export interface PodcastData {
  topic: string;
  keyPoints: string;
  script: string;
}
