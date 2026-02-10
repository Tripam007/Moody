
import React from 'react';
import { Dumbbell, Cloud, PartyPopper, Frown, Smile, Radio, Music, Target, Languages } from 'lucide-react';
import { MoodConfig } from './types';

export const MOODS: MoodConfig[] = [
  {
    id: 'gym',
    name: 'Gym',
    icon: '💪',
    description: 'High energy workout music',
    color: 'from-orange-500 to-red-600'
  },
  {
    id: 'chill',
    name: 'Chill',
    icon: '😌',
    description: 'Relaxing and peaceful vibes',
    color: 'from-blue-400 to-cyan-500'
  },
  {
    id: 'party',
    name: 'Party',
    icon: '🎉',
    description: 'Dance and celebrate',
    color: 'from-purple-500 to-pink-600'
  },
  {
    id: 'sad',
    name: 'Sad',
    icon: '😢',
    description: 'Emotional and melancholic',
    color: 'from-gray-600 to-blue-800'
  },
  {
    id: 'happy',
    name: 'Happy',
    icon: '😊',
    description: 'Upbeat and positive energy',
    color: 'from-yellow-400 to-orange-500'
  },
  {
    id: 'old-school',
    name: 'Old School',
    icon: '📻',
    description: 'Classic hits from the past',
    color: 'from-amber-700 to-yellow-900'
  },
  {
    id: 'pop',
    name: 'Pop',
    icon: '🎵',
    description: 'Top chart hits',
    color: 'from-pink-400 to-indigo-500'
  },
  {
    id: 'focus',
    name: 'Focus',
    icon: '🎯',
    description: 'Concentration and productivity',
    color: 'from-emerald-400 to-teal-600'
  },
  {
    id: 'hindi',
    name: 'Hindi Hits',
    icon: '🇮🇳',
    description: 'Best of Bollywood & Indie',
    color: 'from-orange-400 to-green-500'
  }
];
