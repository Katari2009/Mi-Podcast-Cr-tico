export enum AppStep {
  INTRODUCTION,
  TOPIC,
  SCRIPT,
  RECORDING,
  COMPLETED,
}

export enum BadgeType {
  FIRST_RECORDING = 'FIRST_RECORDING',
  SCRIPT_EDITED = 'SCRIPT_EDITED',
  PODCAST_PUBLISHED = 'PODCAST_PUBLISHED',
}

export interface PodcastData {
  topic: string;
  keyPoints: string;
  script: string;
  badges: BadgeType[];
}