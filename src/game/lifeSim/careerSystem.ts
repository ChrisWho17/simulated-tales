// Life Simulation Career System - Career tracks and progression

export interface CareerLevel {
  level: number;
  title: string;
  salary: number;
  requirements: {
    skills: Record<string, number>;
    performance?: number;
    daysWorked?: number;
  };
}

export interface CareerTrack {
  id: string;
  name: string;
  icon: string;
  requiredSkills: string[];
  levels: CareerLevel[];
  workSchedule: {
    startHour: number;
    endHour: number;
    workDays: number[];  // 0 = Sunday, 6 = Saturday
  };
  perks: string[];
}

// Career tracks from the PDF
export const CAREER_TRACKS: CareerTrack[] = [
  {
    id: 'business',
    name: 'Business',
    icon: '💼',
    requiredSkills: ['charisma', 'logic'],
    levels: [
      { level: 1, title: 'Office Assistant', salary: 150, requirements: { skills: {} } },
      { level: 2, title: 'Administrative Coordinator', salary: 220, requirements: { skills: { charisma: 2 } } },
      { level: 3, title: 'Junior Executive', salary: 350, requirements: { skills: { charisma: 4, logic: 2 } } },
      { level: 4, title: 'Department Manager', salary: 500, requirements: { skills: { charisma: 6, logic: 4 } } },
      { level: 5, title: 'Senior Manager', salary: 700, requirements: { skills: { charisma: 8, logic: 6 } } },
      { level: 6, title: 'Vice President', salary: 1000, requirements: { skills: { charisma: 10, logic: 8 } } },
      { level: 7, title: 'CEO', salary: 1500, requirements: { skills: { charisma: 10, logic: 10 } } },
    ],
    workSchedule: { startHour: 9, endHour: 17, workDays: [1, 2, 3, 4, 5] },
    perks: ['Health Insurance', 'Company Car (Lv5+)', 'Stock Options (Lv6+)'],
  },
  {
    id: 'tech',
    name: 'Tech',
    icon: '💻',
    requiredSkills: ['programming', 'logic'],
    levels: [
      { level: 1, title: 'IT Support', salary: 180, requirements: { skills: {} } },
      { level: 2, title: 'Junior Developer', salary: 280, requirements: { skills: { programming: 3 } } },
      { level: 3, title: 'Software Developer', salary: 450, requirements: { skills: { programming: 5, logic: 3 } } },
      { level: 4, title: 'Senior Developer', salary: 650, requirements: { skills: { programming: 7, logic: 5 } } },
      { level: 5, title: 'Tech Lead', salary: 850, requirements: { skills: { programming: 9, logic: 7 } } },
      { level: 6, title: 'Engineering Manager', salary: 1100, requirements: { skills: { programming: 10, logic: 9, charisma: 5 } } },
      { level: 7, title: 'CTO', salary: 1600, requirements: { skills: { programming: 10, logic: 10, charisma: 8 } } },
    ],
    workSchedule: { startHour: 10, endHour: 18, workDays: [1, 2, 3, 4, 5] },
    perks: ['Remote Work', 'Free Snacks', 'Conference Budget'],
  },
  {
    id: 'culinary',
    name: 'Culinary',
    icon: '👨‍🍳',
    requiredSkills: ['cooking', 'creativity'],
    levels: [
      { level: 1, title: 'Dishwasher', salary: 100, requirements: { skills: {} } },
      { level: 2, title: 'Prep Cook', salary: 150, requirements: { skills: { cooking: 2 } } },
      { level: 3, title: 'Line Cook', salary: 220, requirements: { skills: { cooking: 4 } } },
      { level: 4, title: 'Station Chef', salary: 320, requirements: { skills: { cooking: 6, creativity: 3 } } },
      { level: 5, title: 'Sous Chef', salary: 450, requirements: { skills: { cooking: 8, creativity: 5 } } },
      { level: 6, title: 'Head Chef', salary: 650, requirements: { skills: { cooking: 10, creativity: 7 } } },
      { level: 7, title: 'Executive Chef', salary: 900, requirements: { skills: { cooking: 10, creativity: 10 } } },
    ],
    workSchedule: { startHour: 14, endHour: 22, workDays: [1, 2, 3, 4, 5, 6] },
    perks: ['Free Meals', 'Culinary Training', 'Restaurant Discounts'],
  },
  {
    id: 'creative',
    name: 'Entertainer',
    icon: '🎭',
    requiredSkills: ['creativity', 'charisma'],
    levels: [
      { level: 1, title: 'Street Performer', salary: 80, requirements: { skills: {} } },
      { level: 2, title: 'Open Mic Regular', salary: 120, requirements: { skills: { creativity: 2, charisma: 2 } } },
      { level: 3, title: 'Local Talent', salary: 200, requirements: { skills: { creativity: 4, charisma: 4 } } },
      { level: 4, title: 'Rising Star', salary: 350, requirements: { skills: { creativity: 6, charisma: 6 } } },
      { level: 5, title: 'Regional Celebrity', salary: 550, requirements: { skills: { creativity: 8, charisma: 8 } } },
      { level: 6, title: 'National Star', salary: 850, requirements: { skills: { creativity: 9, charisma: 9 } } },
      { level: 7, title: 'Legendary Icon', salary: 1400, requirements: { skills: { creativity: 10, charisma: 10 } } },
    ],
    workSchedule: { startHour: 18, endHour: 2, workDays: [4, 5, 6, 0] },
    perks: ['Flexible Schedule', 'Free Entry to Events', 'Fan Interactions'],
  },
  {
    id: 'athletic',
    name: 'Athletic',
    icon: '🏃',
    requiredSkills: ['fitness'],
    levels: [
      { level: 1, title: 'Gym Trainee', salary: 100, requirements: { skills: {} } },
      { level: 2, title: 'Personal Trainer', salary: 180, requirements: { skills: { fitness: 3 } } },
      { level: 3, title: 'Amateur Athlete', salary: 280, requirements: { skills: { fitness: 5 } } },
      { level: 4, title: 'Semi-Pro Athlete', salary: 450, requirements: { skills: { fitness: 7 } } },
      { level: 5, title: 'Professional Athlete', salary: 700, requirements: { skills: { fitness: 9 } } },
      { level: 6, title: 'Star Athlete', salary: 1000, requirements: { skills: { fitness: 10 } } },
      { level: 7, title: 'Hall of Famer', salary: 1500, requirements: { skills: { fitness: 10 } } },
    ],
    workSchedule: { startHour: 6, endHour: 14, workDays: [1, 2, 3, 4, 5, 6] },
    perks: ['Gym Access', 'Sports Equipment', 'Health Sponsorships'],
  },
  {
    id: 'medical',
    name: 'Medical',
    icon: '🏥',
    requiredSkills: ['logic', 'charisma'],
    levels: [
      { level: 1, title: 'Orderly', salary: 150, requirements: { skills: {} } },
      { level: 2, title: 'Medical Assistant', salary: 220, requirements: { skills: { logic: 2 } } },
      { level: 3, title: 'Nurse', salary: 350, requirements: { skills: { logic: 4, charisma: 2 } } },
      { level: 4, title: 'Resident', salary: 450, requirements: { skills: { logic: 6, charisma: 4 } } },
      { level: 5, title: 'Physician', salary: 700, requirements: { skills: { logic: 8, charisma: 6 } } },
      { level: 6, title: 'Specialist', salary: 1000, requirements: { skills: { logic: 9, charisma: 7 } } },
      { level: 7, title: 'Chief of Medicine', salary: 1400, requirements: { skills: { logic: 10, charisma: 9 } } },
    ],
    workSchedule: { startHour: 7, endHour: 19, workDays: [1, 2, 3, 4, 5] },
    perks: ['Health Insurance', 'Medical Training', 'Hospital Access'],
  },
  {
    id: 'criminal',
    name: 'Criminal',
    icon: '🎭',
    requiredSkills: ['mischief', 'fitness'],
    levels: [
      { level: 1, title: 'Petty Thief', salary: 100, requirements: { skills: {} } },
      { level: 2, title: 'Pickpocket', salary: 180, requirements: { skills: { mischief: 3 } } },
      { level: 3, title: 'Burglar', salary: 300, requirements: { skills: { mischief: 5, fitness: 3 } } },
      { level: 4, title: 'Safe Cracker', salary: 500, requirements: { skills: { mischief: 7, fitness: 5 } } },
      { level: 5, title: 'Getaway Driver', salary: 700, requirements: { skills: { mischief: 8, fitness: 6 } } },
      { level: 6, title: 'Crime Boss', salary: 1100, requirements: { skills: { mischief: 9, fitness: 7, charisma: 6 } } },
      { level: 7, title: 'Kingpin', salary: 1600, requirements: { skills: { mischief: 10, fitness: 8, charisma: 8 } } },
    ],
    workSchedule: { startHour: 22, endHour: 6, workDays: [0, 1, 2, 3, 4, 5, 6] },
    perks: ['Underworld Contacts', 'No Taxes', 'Street Cred'],
  },
  {
    id: 'influencer',
    name: 'Social Media',
    icon: '📱',
    requiredSkills: ['charisma', 'photography'],
    levels: [
      { level: 1, title: 'Aspiring Influencer', salary: 50, requirements: { skills: {} } },
      { level: 2, title: 'Content Creator', salary: 120, requirements: { skills: { charisma: 2, photography: 2 } } },
      { level: 3, title: 'Micro-Influencer', salary: 250, requirements: { skills: { charisma: 4, photography: 4 } } },
      { level: 4, title: 'Verified Creator', salary: 450, requirements: { skills: { charisma: 6, photography: 6 } } },
      { level: 5, title: 'Social Media Star', salary: 750, requirements: { skills: { charisma: 8, photography: 8 } } },
      { level: 6, title: 'Mega-Influencer', salary: 1200, requirements: { skills: { charisma: 9, photography: 9 } } },
      { level: 7, title: 'Internet Celebrity', salary: 2000, requirements: { skills: { charisma: 10, photography: 10 } } },
    ],
    workSchedule: { startHour: 10, endHour: 18, workDays: [0, 1, 2, 3, 4, 5, 6] },
    perks: ['Flexible Hours', 'Free Products', 'Brand Deals'],
  },
  {
    id: 'writer',
    name: 'Writer',
    icon: '✍️',
    requiredSkills: ['writing', 'creativity'],
    levels: [
      { level: 1, title: 'Blogger', salary: 80, requirements: { skills: {} } },
      { level: 2, title: 'Freelance Writer', salary: 150, requirements: { skills: { writing: 3 } } },
      { level: 3, title: 'Staff Writer', salary: 280, requirements: { skills: { writing: 5, creativity: 3 } } },
      { level: 4, title: 'Published Author', salary: 420, requirements: { skills: { writing: 7, creativity: 5 } } },
      { level: 5, title: 'Bestselling Author', salary: 650, requirements: { skills: { writing: 9, creativity: 7 } } },
      { level: 6, title: 'Award-Winning Author', salary: 950, requirements: { skills: { writing: 10, creativity: 9 } } },
      { level: 7, title: 'Literary Legend', salary: 1400, requirements: { skills: { writing: 10, creativity: 10 } } },
    ],
    workSchedule: { startHour: 9, endHour: 17, workDays: [1, 2, 3, 4, 5] },
    perks: ['Work From Home', 'Book Royalties', 'Speaking Engagements'],
  },
  {
    id: 'painter',
    name: 'Painter',
    icon: '🎨',
    requiredSkills: ['painting', 'creativity'],
    levels: [
      { level: 1, title: 'Art Student', salary: 60, requirements: { skills: {} } },
      { level: 2, title: 'Street Artist', salary: 100, requirements: { skills: { painting: 3 } } },
      { level: 3, title: 'Gallery Artist', salary: 200, requirements: { skills: { painting: 5, creativity: 3 } } },
      { level: 4, title: 'Commissioned Artist', salary: 350, requirements: { skills: { painting: 7, creativity: 5 } } },
      { level: 5, title: 'Renowned Artist', salary: 550, requirements: { skills: { painting: 9, creativity: 7 } } },
      { level: 6, title: 'Master Artist', salary: 850, requirements: { skills: { painting: 10, creativity: 9 } } },
      { level: 7, title: 'Legendary Painter', salary: 1300, requirements: { skills: { painting: 10, creativity: 10 } } },
    ],
    workSchedule: { startHour: 10, endHour: 18, workDays: [1, 2, 3, 4, 5, 6] },
    perks: ['Art Studio', 'Gallery Shows', 'Art Supplies'],
  },
  {
    id: 'musician',
    name: 'Musician',
    icon: '🎵',
    requiredSkills: ['music', 'charisma'],
    levels: [
      { level: 1, title: 'Busker', salary: 70, requirements: { skills: {} } },
      { level: 2, title: 'Bar Performer', salary: 130, requirements: { skills: { music: 3, charisma: 2 } } },
      { level: 3, title: 'Session Musician', salary: 250, requirements: { skills: { music: 5, charisma: 4 } } },
      { level: 4, title: 'Touring Musician', salary: 400, requirements: { skills: { music: 7, charisma: 6 } } },
      { level: 5, title: 'Recording Artist', salary: 650, requirements: { skills: { music: 9, charisma: 8 } } },
      { level: 6, title: 'Chart-Topping Artist', salary: 1000, requirements: { skills: { music: 10, charisma: 9 } } },
      { level: 7, title: 'Music Legend', salary: 1600, requirements: { skills: { music: 10, charisma: 10 } } },
    ],
    workSchedule: { startHour: 18, endHour: 2, workDays: [4, 5, 6] },
    perks: ['Concert Tickets', 'Music Studio Access', 'Royalties'],
  },
];

// Career State for a character
export interface CareerState {
  currentCareer: string | null;
  careerLevel: number;
  performance: number;  // 0-100
  daysWorked: number;
  isAtWork: boolean;
  workStartTime: number | null;
  unemployedDays: number;
}

export function createCareerState(): CareerState {
  return {
    currentCareer: null,
    careerLevel: 0,
    performance: 50,
    daysWorked: 0,
    isAtWork: false,
    workStartTime: null,
    unemployedDays: 0,
  };
}

export function getCareerTrack(careerId: string): CareerTrack | undefined {
  return CAREER_TRACKS.find(c => c.id === careerId);
}

export function getCurrentCareerLevel(careerState: CareerState): CareerLevel | undefined {
  if (!careerState.currentCareer) return undefined;
  const track = getCareerTrack(careerState.currentCareer);
  if (!track) return undefined;
  return track.levels[careerState.careerLevel - 1];
}

export function calculateDailyPay(careerState: CareerState): number {
  const level = getCurrentCareerLevel(careerState);
  if (!level) return 0;
  
  // Base salary modified by performance
  const performanceMultiplier = 0.5 + (careerState.performance / 100);
  return Math.round(level.salary * performanceMultiplier);
}

export function checkForPromotion(
  careerState: CareerState, 
  skills: Record<string, number>
): { canPromote: boolean; requirements: Record<string, number>; missing: Record<string, number> } {
  if (!careerState.currentCareer) {
    return { canPromote: false, requirements: {}, missing: {} };
  }
  
  const track = getCareerTrack(careerState.currentCareer);
  if (!track) {
    return { canPromote: false, requirements: {}, missing: {} };
  }
  
  const nextLevel = track.levels[careerState.careerLevel];
  if (!nextLevel) {
    return { canPromote: false, requirements: {}, missing: {} };
  }
  
  const requirements = nextLevel.requirements.skills;
  const missing: Record<string, number> = {};
  let canPromote = true;
  
  for (const [skill, required] of Object.entries(requirements)) {
    const current = skills[skill] || 0;
    if (current < required) {
      canPromote = false;
      missing[skill] = required - current;
    }
  }
  
  // Also check performance requirement if any
  if (nextLevel.requirements.performance && careerState.performance < nextLevel.requirements.performance) {
    canPromote = false;
  }
  
  return { canPromote, requirements, missing };
}

// Skill categories for life sim
export const LIFESIM_SKILLS = [
  'cooking',
  'fitness', 
  'charisma',
  'creativity',
  'logic',
  'gardening',
  'handiness',
  'programming',
  'writing',
  'photography',
  'music',
  'painting',
  'comedy',
  'mischief',
  'gaming',
];

export function getSkillIcon(skill: string): string {
  const icons: Record<string, string> = {
    cooking: '🍳',
    fitness: '💪',
    charisma: '💬',
    creativity: '✨',
    logic: '🧠',
    gardening: '🌱',
    handiness: '🔧',
    programming: '💻',
    writing: '✍️',
    photography: '📷',
    music: '🎵',
    painting: '🎨',
    comedy: '😂',
    mischief: '😈',
    gaming: '🎮',
  };
  return icons[skill] || '⭐';
}
