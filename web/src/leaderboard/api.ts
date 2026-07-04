import type { Difficulty } from '../game/types'
import { supabase } from './supabaseClient'
import type { ScoreEntry } from './types'

const TABLE = 'scores'
const LEADERBOARD_LIMIT = 50

export async function submitScore(entry: ScoreEntry): Promise<void> {
  if (!supabase) throw new Error('Leaderboard is not configured (missing Supabase env vars).')
  const { error } = await supabase.from(TABLE).insert(entry)
  if (error) throw new Error(error.message)
}

export async function fetchScores(difficulty: Difficulty): Promise<ScoreEntry[]> {
  if (!supabase) throw new Error('Leaderboard is not configured (missing Supabase env vars).')
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('difficulty', difficulty)
    .order('time_left', { ascending: false })
    .limit(LEADERBOARD_LIMIT)
  if (error) throw new Error(error.message)
  return data as ScoreEntry[]
}
