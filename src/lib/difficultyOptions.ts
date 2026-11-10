import type { Difficulty } from '@/engine/difficulty';
import type { SegmentedOption } from '@/components/SegmentedControl';

export const difficultyOptions: SegmentedOption<Difficulty>[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'professional', label: 'Professional' },
  { value: 'expert', label: 'Expert' },
];
